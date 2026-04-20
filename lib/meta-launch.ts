import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTemplateById, hydrateTemplateRecord } from "@/data/templates";
import {
  buildMetaGeoLocations,
} from "@/lib/meta-targeting";
import {
  campaignGoalOptions,
  getTemplatePlaceholderFields,
  getTemplateSetupValuesFromLaunchState,
  normalizeCampaignLaunchState,
  parseDailyBudgetToCents,
} from "@/lib/campaign-launch";
import { createCampaignBlueprint } from "@/lib/template-engine";
import {
  createMetaAd,
  createMetaAdCreative,
  createMetaAdSet,
  createMetaCampaign,
  createMetaLeadForm,
  fetchMetaAdAccountDetails,
  fetchMetaTokenDebugInfo,
  getMetaScopes,
  updateMetaObjectStatus,
} from "@/lib/meta";
import {
  getWorkspaceMetaAccessToken,
  getWorkspaceMetaIntegrationState,
} from "@/lib/meta-integration";
import {
  CampaignGoal,
  CampaignLaunchState,
  CampaignPublishMode,
  CampaignRecord,
  TemplateSeed,
} from "@/types";

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

type IssueScope = "draft" | "live" | "both";

type InternalIssue = {
  code: string;
  message: string;
  field?: string;
  type: "blocking" | "warning";
  scope: IssueScope;
};

export type LaunchIssue = {
  code: string;
  message: string;
  field?: string;
  scope: IssueScope;
};

export type MetaResolvedAssets = {
  adAccount: { id: string; name: string } | null;
  page: { id: string; name: string } | null;
  pixel: { id: string; name: string } | null;
  leadForm: { id: string; name: string; mode: CampaignLaunchState["leadForm"]["mode"] } | null;
  instagramActor: { id: string; name: string } | null;
};

type MetaNormalizedPayloadSummary = {
  objective: CampaignGoal;
  campaign: {
    name: string;
    statusDraft: "PAUSED";
    statusLive: "ACTIVE";
  };
  adSet: {
    name: string;
    dailyBudgetCents: number;
    billingEvent: "IMPRESSIONS";
    optimizationGoal:
      | "REACH"
      | "LINK_CLICKS"
      | "POST_ENGAGEMENT"
      | "LEAD_GENERATION"
      | "APP_INSTALLS"
      | "OFFSITE_CONVERSIONS";
    targeting: Record<string, unknown>;
    promotedObject: Record<string, unknown>;
    destinationType: "website" | "lead_form" | "engagement";
  };
  creative: {
    name: string;
    primaryText: string;
    headline: string;
    description: string;
    ctaType: string;
    destinationUrl: string;
    imageUrl: string;
    leadFormMode: CampaignLaunchState["leadForm"]["mode"];
    leadFormId: string | null;
    managedLeadFormName: string;
    leadFormFields: Array<CampaignLaunchState["leadForm"]["fields"][number]>;
  };
  ad: {
    name: string;
    statusDraft: "PAUSED";
    statusLive: "ACTIVE";
  };
};

export type MetaLaunchPreflight = {
  mode: CampaignPublishMode;
  blockingIssues: LaunchIssue[];
  warnings: LaunchIssue[];
  resolvedAssets: MetaResolvedAssets;
  normalizedPayloadSummary: MetaNormalizedPayloadSummary;
};

type MetaLaunchContext = {
  campaign: CampaignRecord;
  template: TemplateSeed;
  launchState: CampaignLaunchState;
  businessProfile: {
    business_name: string;
    location: string;
    phone: string;
    email: string;
    description: string;
    logo_url: string | null;
  } | null;
  workspaceId: string;
  accessToken: string;
  resolvedAssets: MetaResolvedAssets;
  integrationState: Awaited<ReturnType<typeof getWorkspaceMetaIntegrationState>>;
};

function goalLabel(goal: CampaignGoal) {
  return campaignGoalOptions.find((item) => item.id === goal)?.label || "Leads";
}

function mapGoalToOptimizationGoal(goal: CampaignGoal) {
  if (goal === "OUTCOME_AWARENESS") return "REACH" as const;
  if (goal === "OUTCOME_TRAFFIC") return "LINK_CLICKS" as const;
  if (goal === "OUTCOME_ENGAGEMENT") return "POST_ENGAGEMENT" as const;
  if (goal === "OUTCOME_APP_PROMOTION") return "APP_INSTALLS" as const;
  if (goal === "OUTCOME_SALES") return "OFFSITE_CONVERSIONS" as const;
  return "LEAD_GENERATION" as const;
}

function mapGoalToCta(goal: CampaignGoal) {
  if (goal === "OUTCOME_SALES") return "SHOP_NOW";
  if (goal === "OUTCOME_APP_PROMOTION") return "DOWNLOAD";
  if (goal === "OUTCOME_LEADS") return "SIGN_UP";
  return "LEARN_MORE";
}

function goalUsesWebsiteDestination(goal: CampaignGoal) {
  return goal === "OUTCOME_TRAFFIC" || goal === "OUTCOME_SALES";
}

function goalRequiresLeadForm(goal: CampaignGoal) {
  return goal === "OUTCOME_LEADS";
}

function goalRequiresPixel(goal: CampaignGoal) {
  return goal === "OUTCOME_SALES";
}

function buildIssuesForMode(mode: CampaignPublishMode, issues: InternalIssue[]) {
  const applies = (issue: InternalIssue) =>
    issue.scope === "both" || issue.scope === mode;

  const blockingIssues = issues
    .filter((issue) => issue.type === "blocking" && applies(issue))
    .map((issue) => ({
      code: issue.code,
      message: issue.message,
      field: issue.field,
      scope: issue.scope,
    }));

  const warnings = issues
    .filter((issue) => issue.type === "warning" || (issue.type === "blocking" && !applies(issue)))
    .map((issue) => ({
      code: issue.code,
      message: issue.message,
      field: issue.field,
      scope: issue.scope,
    }));

  return { blockingIssues, warnings };
}

function parseInterestTargeting(raw: string) {
  const tokens = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const interests: Array<{ id: string; name: string }> = [];
  const unresolved: string[] = [];

  for (const token of tokens) {
    const matched = token.match(/(\d{4,})/);
    if (!matched) {
      unresolved.push(token);
      continue;
    }
    interests.push({ id: matched[1], name: token });
  }

  return { interests, unresolved };
}

function sanitizeDestinationUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function loadMetaLaunchContext({
  admin,
  campaignId,
  userId,
}: {
  admin: SupabaseAdmin;
  campaignId: string;
  userId: string;
}): Promise<MetaLaunchContext> {
  const { data: campaignData, error: campaignError } = await admin
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (!campaignData) {
    throw new Error("Campaign draft not found.");
  }

  const campaign = campaignData as CampaignRecord;
  if (!campaign.workspace_id) {
    throw new Error("Campaign is missing workspace context.");
  }

  const { data: membership } = await admin
    .from("workspace_memberships")
    .select("id")
    .eq("workspace_id", campaign.workspace_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership?.id) {
    throw new Error("You do not have access to this workspace campaign.");
  }

  const { data: templateRecord, error: templateError } = await admin
    .from("templates")
    .select("*")
    .eq("id", campaign.template_id)
    .maybeSingle();

  if (templateError) {
    throw new Error(templateError.message);
  }

  const template = templateRecord
    ? hydrateTemplateRecord(templateRecord)
    : getTemplateById(campaign.template_id);
  if (!template) {
    throw new Error("Template for this campaign could not be loaded.");
  }

  const { data: businessProfileData } = await admin
    .from("business_profiles")
    .select("business_name, location, phone, email, description, logo_url")
    .eq("workspace_id", campaign.workspace_id)
    .maybeSingle();
  const businessProfile =
    (businessProfileData as MetaLaunchContext["businessProfile"]) || null;

  const integrationState = await getWorkspaceMetaIntegrationState({
    admin,
    workspaceId: campaign.workspace_id,
  });
  const tokenContext = await getWorkspaceMetaAccessToken({
    admin,
    workspaceId: campaign.workspace_id,
  });

  if (!tokenContext?.accessToken) {
    throw new Error("Meta is not connected for this workspace.");
  }

  const launchState = normalizeCampaignLaunchState(
    campaign.launch_state_json || {},
    template,
    businessProfile
      ? {
          id: "",
          user_id: campaign.user_id,
          workspace_id: campaign.workspace_id,
          business_name: businessProfile.business_name,
          location: businessProfile.location,
          phone: businessProfile.phone,
          email: businessProfile.email,
          description: businessProfile.description,
          logo_url: businessProfile.logo_url,
          brand_color: "#6D5EF8",
          default_cta: campaign.cta_text,
        }
      : null,
  );

  const selectedAdAccountId =
    launchState.integrationSelections.adAccountId || integrationState.selected.adAccountId || "";
  const selectedPageId =
    launchState.integrationSelections.pageId || integrationState.selected.pageId || "";
  const selectedPixelId =
    launchState.integrationSelections.pixelId || integrationState.selected.pixelId || "";
  const selectedLeadFormId =
    launchState.leadForm.selectedFormId ||
    launchState.integrationSelections.leadFormId ||
    integrationState.selected.leadFormId ||
    "";
  const selectedInstagramActorId =
    launchState.integrationSelections.instagramActorId ||
    integrationState.selected.instagramActorId ||
    "";

  launchState.integrationSelections = {
    ...launchState.integrationSelections,
    adAccountId: selectedAdAccountId,
    pageId: selectedPageId,
    pixelId: selectedPixelId,
    leadFormId: selectedLeadFormId,
    instagramActorId: selectedInstagramActorId,
  };
  launchState.leadForm = {
    ...launchState.leadForm,
    selectedFormId: selectedLeadFormId,
  };

  const adAccountAsset = integrationState.assets.adAccounts.find((asset) => asset.asset_id === selectedAdAccountId) || null;
  const pageAsset = integrationState.assets.pages.find((asset) => asset.asset_id === selectedPageId) || null;
  const pixelAsset = integrationState.assets.pixels.find((asset) => asset.asset_id === selectedPixelId) || null;
  const leadFormAsset = integrationState.assets.leadForms.find((asset) => asset.asset_id === selectedLeadFormId) || null;
  const instagramAsset = integrationState.assets.instagramActors.find((asset) => asset.asset_id === selectedInstagramActorId) || null;

  const resolvedAssets: MetaResolvedAssets = {
    adAccount: adAccountAsset
      ? { id: adAccountAsset.asset_id, name: adAccountAsset.name || adAccountAsset.asset_id }
      : null,
    page: pageAsset
      ? { id: pageAsset.asset_id, name: pageAsset.name || pageAsset.asset_id }
      : null,
    pixel: pixelAsset
      ? { id: pixelAsset.asset_id, name: pixelAsset.name || pixelAsset.asset_id }
      : null,
    leadForm: leadFormAsset
      ? {
          id: leadFormAsset.asset_id,
          name: leadFormAsset.name || leadFormAsset.asset_id,
          mode: launchState.leadForm.mode,
        }
      : null,
    instagramActor: instagramAsset
      ? { id: instagramAsset.asset_id, name: instagramAsset.name || instagramAsset.asset_id }
      : null,
  };

  return {
    campaign,
    template,
    launchState,
    businessProfile,
    workspaceId: campaign.workspace_id,
    accessToken: tokenContext.accessToken,
    resolvedAssets,
    integrationState,
  };
}

export async function runMetaLaunchPreflight({
  admin,
  campaignId,
  userId,
  mode,
}: {
  admin: SupabaseAdmin;
  campaignId: string;
  userId: string;
  mode: CampaignPublishMode;
}): Promise<MetaLaunchPreflight> {
  const context = await loadMetaLaunchContext({ admin, campaignId, userId });
  const issues: InternalIssue[] = [];
  const requiredScopes = getMetaScopes();
  const debug = await fetchMetaTokenDebugInfo(context.accessToken).catch(() => null);
  const tokenData = debug?.data;

  if (!tokenData?.is_valid) {
    issues.push({
      code: "token_invalid",
      message: "Meta connection token is invalid or expired. Reconnect Meta in workspace settings.",
      type: "blocking",
      scope: "both",
      field: "metaConnection",
    });
  }

  const tokenScopes = tokenData?.scopes || [];
  const missingScopes = requiredScopes.filter((scope) => !tokenScopes.includes(scope));
  if (missingScopes.length) {
    issues.push({
      code: "token_missing_scopes",
      message: `Meta connection is missing required scopes: ${missingScopes.join(", ")}.`,
      type: "blocking",
      scope: "both",
      field: "metaScopes",
    });
  }

  if (!context.resolvedAssets.adAccount) {
    issues.push({
      code: "missing_ad_account",
      message: "Select an ad account for this workspace before launching.",
      type: "blocking",
      scope: "both",
      field: "adAccountId",
    });
  }

  if (!context.resolvedAssets.page) {
    issues.push({
      code: "missing_page",
      message: "Select a Facebook Page for this workspace before launching.",
      type: "blocking",
      scope: "both",
      field: "pageId",
    });
  }

  if (context.launchState.campaignGoal === "OUTCOME_APP_PROMOTION") {
    issues.push({
      code: "unsupported_goal_app_promotion",
      message:
        "App promotion requires app-specific assets that are not configured yet. Choose another goal for now.",
      type: "blocking",
      scope: "both",
      field: "campaignGoal",
    });
  }

  const budgetCents = parseDailyBudgetToCents(context.launchState.dailyBudget);
  if (!budgetCents) {
    issues.push({
      code: "invalid_daily_budget",
      message: "Daily budget must be a valid amount greater than 0.",
      type: "blocking",
      scope: "both",
      field: "dailyBudget",
    });
  }

  const hasTargetLocations =
    (context.launchState.targetLocations || []).length > 0 ||
    Boolean(context.launchState.targetLocation?.trim());
  if (!hasTargetLocations) {
    issues.push({
      code: "missing_target_location",
      message: "Add at least one target location before launch.",
      type: "blocking",
      scope: "both",
      field: "targetLocations",
    });
  }

  const placeholderFields = getTemplatePlaceholderFields(context.template);
  for (const field of placeholderFields) {
    if (!field.required) continue;
    const value = context.launchState.placeholderValues[field.id];
    if (!value || !value.trim()) {
      issues.push({
        code: `missing_placeholder_${field.id}`,
        message: `${field.label} is required before launch.`,
        type: "blocking",
        scope: "both",
        field: `placeholder.${field.id}`,
      });
    }
  }

  const destinationUrl = sanitizeDestinationUrl(context.launchState.thankYouPage.destinationUrl);
  if (goalUsesWebsiteDestination(context.launchState.campaignGoal)) {
    if (!destinationUrl) {
      issues.push({
        code: "missing_destination_url",
        message: "Destination URL is required for website campaign goals.",
        type: "blocking",
        scope: "both",
        field: "thankYouPage.destinationUrl",
      });
    } else {
      try {
        // Validate URL shape.
        // eslint-disable-next-line no-new
        new URL(destinationUrl);
      } catch {
        issues.push({
          code: "invalid_destination_url",
          message: "Destination URL is invalid.",
          type: "blocking",
          scope: "both",
          field: "thankYouPage.destinationUrl",
        });
      }
    }
  }

  if (goalRequiresLeadForm(context.launchState.campaignGoal)) {
    if (context.launchState.leadForm.mode === "existing") {
      if (!context.launchState.leadForm.selectedFormId) {
        issues.push({
          code: "missing_lead_form_existing",
          message: "Select an existing Meta lead form or switch to managed lead form.",
          type: "blocking",
          scope: "both",
          field: "leadForm.selectedFormId",
        });
      }
    } else {
      if (!context.launchState.leadForm.managedFormName.trim()) {
        issues.push({
          code: "missing_lead_form_name",
          message: "Provide a lead form name for SideKick-managed form creation.",
          type: "blocking",
          scope: "both",
          field: "leadForm.managedFormName",
        });
      }
      if (!context.launchState.advanced.privacyPolicyUrl.trim()) {
        issues.push({
          code: "missing_privacy_policy_url",
          message: "Privacy policy URL is required for managed lead forms.",
          type: "blocking",
          scope: "both",
          field: "advanced.privacyPolicyUrl",
        });
      } else {
        const normalizedPrivacyUrl = sanitizeDestinationUrl(
          context.launchState.advanced.privacyPolicyUrl,
        );
        try {
          // Validate privacy policy URL shape before lead form creation.
          // eslint-disable-next-line no-new
          new URL(normalizedPrivacyUrl);
        } catch {
          issues.push({
            code: "invalid_privacy_policy_url",
            message: "Privacy policy URL is invalid.",
            type: "blocking",
            scope: "both",
            field: "advanced.privacyPolicyUrl",
          });
        }
      }

      const selectedLeadFields = context.launchState.leadForm.fields || [];
      if (!selectedLeadFields.length) {
        issues.push({
          code: "missing_lead_form_fields",
          message: "Select at least one lead form field for managed lead form mode.",
          type: "blocking",
          scope: "both",
          field: "leadForm.fields",
        });
      } else if (
        !selectedLeadFields.includes("EMAIL") &&
        !selectedLeadFields.includes("PHONE")
      ) {
        issues.push({
          code: "lead_form_contact_field_required",
          message: "Managed lead forms need at least Email or Phone to capture a contact method.",
          type: "blocking",
          scope: "both",
          field: "leadForm.fields",
        });
      }
    }
  }

  if (goalRequiresPixel(context.launchState.campaignGoal) && !context.resolvedAssets.pixel) {
    issues.push({
      code: "missing_pixel_required",
      message: "A selected pixel is required for this campaign goal.",
      type: "blocking",
      scope: "both",
      field: "pixelId",
    });
  }

  if (context.launchState.campaignGoal === "OUTCOME_TRAFFIC" && !context.resolvedAssets.pixel) {
    issues.push({
      code: "pixel_recommended",
      message:
        "No pixel is selected. Traffic campaigns can still draft, but optimization quality may be limited.",
      type: "warning",
      scope: "both",
      field: "pixelId",
    });
  }

  if (context.resolvedAssets.adAccount) {
    const adAccountDetails = await fetchMetaAdAccountDetails(
      context.accessToken,
      context.resolvedAssets.adAccount.id,
    ).catch(() => null);

    if (!adAccountDetails) {
      issues.push({
        code: "ad_account_details_unavailable",
        message:
          "Could not read ad account readiness details from Meta. Draft is still available.",
        type: "warning",
        scope: "both",
        field: "adAccountId",
      });
    } else {
      const accountStatus = adAccountDetails.account_status;
      const disableReason = adAccountDetails.disable_reason;
      const funding = adAccountDetails.funding_source_details;
      const fundingReadable = !!funding && typeof funding === "object";
      const hasFunding =
        fundingReadable && Object.keys(funding as Record<string, unknown>).length > 0;

      if (typeof accountStatus === "number" && accountStatus !== 1) {
        issues.push({
          code: "ad_account_not_active",
          message:
            "Meta ad account is not in an active state. Draft is still allowed, live publish is blocked.",
          type: "blocking",
          scope: "live",
          field: "adAccountId",
        });
      }

      if (typeof disableReason === "number" && disableReason > 0) {
        issues.push({
          code: "ad_account_disable_reason",
          message:
            "Meta returned an ad account disable reason. Draft is still allowed, live publish is blocked.",
          type: "blocking",
          scope: "live",
          field: "adAccountId",
        });
      }

      if (fundingReadable && !hasFunding) {
        issues.push({
          code: "funding_missing",
          message:
            "Meta ad account has no readable funding/payment source. Draft is allowed, live publish is blocked.",
          type: "blocking",
          scope: "live",
          field: "adAccountId",
        });
      }

      if (!fundingReadable) {
        issues.push({
          code: "funding_not_readable",
          message:
            "Funding/payment readiness could not be confirmed. Draft is allowed, live publish may fail.",
          type: "warning",
          scope: "both",
          field: "adAccountId",
        });
      }
    }
  }

  const setupValues = getTemplateSetupValuesFromLaunchState(
    context.template,
    context.launchState,
    context.businessProfile
      ? {
          id: "",
          user_id: context.campaign.user_id,
          workspace_id: context.workspaceId,
          business_name: context.businessProfile.business_name,
          location: context.businessProfile.location,
          phone: context.businessProfile.phone,
          email: context.businessProfile.email,
          description: context.businessProfile.description,
          logo_url: context.businessProfile.logo_url,
          brand_color: "#6D5EF8",
          default_cta: context.campaign.cta_text,
        }
      : null,
  );

  const blueprint = createCampaignBlueprint(context.template, setupValues, {
    logoUrl: context.businessProfile?.logo_url || null,
    beforeImageUrls: (context.campaign.before_images_json as string[]) || [],
    afterImageUrls: (context.campaign.after_images_json as string[]) || [],
  });

  const { interests, unresolved } = parseInterestTargeting(
    context.launchState.targeting.interests,
  );
  if (unresolved.length) {
    issues.push({
      code: "interests_unresolved",
      message:
        "Some interests are not numeric Meta IDs and will be ignored in V1 publish payload.",
      type: "warning",
      scope: "both",
      field: "targeting.interests",
    });
  }

  const genders =
    context.launchState.targeting.gender === "male"
      ? [1]
      : context.launchState.targeting.gender === "female"
        ? [2]
        : undefined;

  const targeting: Record<string, unknown> = {
    ...buildMetaGeoLocations(context.launchState),
    age_min: Number.parseInt(context.launchState.targeting.ageMin || "23", 10),
    age_max: Number.parseInt(context.launchState.targeting.ageMax || "65", 10),
    ...(genders ? { genders } : {}),
    ...(interests.length
      ? {
          interests: interests.map((interest) => ({
            id: interest.id,
            name: interest.name,
          })),
        }
      : {}),
  };

  const promotedObject: Record<string, unknown> = {};
  if (context.resolvedAssets.page) {
    promotedObject.page_id = context.resolvedAssets.page.id;
  }
  if (context.resolvedAssets.pixel && goalRequiresPixel(context.launchState.campaignGoal)) {
    promotedObject.pixel_id = context.resolvedAssets.pixel.id;
    promotedObject.custom_event_type = "PURCHASE";
  }

  const normalizedPayloadSummary: MetaNormalizedPayloadSummary = {
    objective: context.launchState.campaignGoal,
    campaign: {
      name:
        context.launchState.advanced.campaignName ||
        context.campaign.name ||
        `${goalLabel(context.launchState.campaignGoal)} Campaign`,
      statusDraft: "PAUSED",
      statusLive: "ACTIVE",
    },
    adSet: {
      name: `${context.launchState.advanced.campaignName || context.campaign.name} Ad Set`,
      dailyBudgetCents: budgetCents || 0,
      billingEvent: "IMPRESSIONS",
      optimizationGoal: mapGoalToOptimizationGoal(context.launchState.campaignGoal),
      targeting,
      promotedObject,
      destinationType: goalUsesWebsiteDestination(context.launchState.campaignGoal)
        ? "website"
        : goalRequiresLeadForm(context.launchState.campaignGoal)
          ? "lead_form"
          : "engagement",
    },
    creative: {
      name: `${context.launchState.advanced.campaignName || context.campaign.name} Creative`,
      primaryText: blueprint.adCopy.primary,
      headline: blueprint.adCopy.headlines[0] || context.campaign.headline,
      description: blueprint.adCopy.descriptions[0] || context.campaign.subheadline,
      ctaType: mapGoalToCta(context.launchState.campaignGoal),
      destinationUrl: destinationUrl || "https://facebook.com",
      imageUrl: context.template.previewImage || "",
      leadFormMode: context.launchState.leadForm.mode,
      leadFormId: context.launchState.leadForm.selectedFormId || null,
      managedLeadFormName:
        context.launchState.leadForm.managedFormName ||
        context.launchState.advanced.leadFormName ||
        "SideKick Lead Form",
      leadFormFields:
        context.launchState.leadForm.fields.length > 0
          ? context.launchState.leadForm.fields
          : ["FULL_NAME", "EMAIL", "PHONE"],
    },
    ad: {
      name: `${context.launchState.advanced.campaignName || context.campaign.name} Ad`,
      statusDraft: "PAUSED",
      statusLive: "ACTIVE",
    },
  };

  const { blockingIssues, warnings } = buildIssuesForMode(mode, issues);
  return {
    mode,
    blockingIssues,
    warnings,
    resolvedAssets: context.resolvedAssets,
    normalizedPayloadSummary,
  };
}

export async function publishMetaFromPreflight({
  admin,
  campaignId,
  userId,
  mode,
  preflight,
}: {
  admin: SupabaseAdmin;
  campaignId: string;
  userId: string;
  mode: CampaignPublishMode;
  preflight: MetaLaunchPreflight;
}) {
  if (preflight.blockingIssues.length) {
    throw new Error("Preflight has blocking issues.");
  }

  const context = await loadMetaLaunchContext({ admin, campaignId, userId });
  const summary = preflight.normalizedPayloadSummary;
  const now = new Date().toISOString();
  const statusSeed = "PAUSED";
  const externalIds: Record<string, string> = {};
  const metaResponses: Record<string, unknown> = {};
  const launchWarnings = [...preflight.warnings];
  let resolvedLeadFormId = summary.creative.leadFormId;

  if (goalRequiresLeadForm(context.launchState.campaignGoal) && summary.creative.leadFormMode === "managed_new") {
    const createdLeadForm = await createMetaLeadForm({
      accessToken: context.accessToken,
      pageId: context.resolvedAssets.page?.id || "",
      name: summary.creative.managedLeadFormName,
      privacyPolicyUrl: context.launchState.advanced.privacyPolicyUrl,
      fields: summary.creative.leadFormFields,
    });

    if (!createdLeadForm.id) {
      throw new Error("Meta lead form could not be created.");
    }
    resolvedLeadFormId = createdLeadForm.id;
    externalIds.lead_form_id = createdLeadForm.id;
    metaResponses.lead_form = createdLeadForm;
  }

  const campaignPayload: Record<string, string> = {
    name: summary.campaign.name,
    objective: summary.objective,
    status: statusSeed,
    special_ad_categories: "[]",
  };

  const campaignResponse = await createMetaCampaign({
    accessToken: context.accessToken,
    adAccountId: context.resolvedAssets.adAccount?.id || "",
    payload: campaignPayload,
  });
  if (!campaignResponse.id) {
    throw new Error("Meta campaign creation failed.");
  }
  externalIds.campaign_id = campaignResponse.id;
  metaResponses.campaign = campaignResponse;

  const adSetPayload: Record<string, string> = {
    name: summary.adSet.name,
    campaign_id: campaignResponse.id,
    billing_event: summary.adSet.billingEvent,
    optimization_goal: summary.adSet.optimizationGoal,
    daily_budget: String(summary.adSet.dailyBudgetCents),
    targeting: JSON.stringify(summary.adSet.targeting),
    status: statusSeed,
    promoted_object: JSON.stringify(summary.adSet.promotedObject || {}),
  };

  const adSetResponse = await createMetaAdSet({
    accessToken: context.accessToken,
    adAccountId: context.resolvedAssets.adAccount?.id || "",
    payload: adSetPayload,
  });
  if (!adSetResponse.id) {
    throw new Error("Meta ad set creation failed.");
  }
  externalIds.adset_id = adSetResponse.id;
  metaResponses.adset = adSetResponse;

  const objectStorySpec: Record<string, unknown> = {
    page_id: context.resolvedAssets.page?.id || "",
    link_data: {
      message: summary.creative.primaryText,
      link: summary.creative.destinationUrl,
      name: summary.creative.headline,
      description: summary.creative.description,
      ...(summary.creative.imageUrl ? { picture: summary.creative.imageUrl } : {}),
      call_to_action: {
        type: summary.creative.ctaType,
        value:
          goalRequiresLeadForm(context.launchState.campaignGoal)
            ? {
                lead_gen_form_id: resolvedLeadFormId,
              }
            : {
                link: summary.creative.destinationUrl,
              },
      },
    },
  };

  const creativePayload: Record<string, string> = {
    name: summary.creative.name,
    object_story_spec: JSON.stringify(objectStorySpec),
  };

  const creativeResponse = await createMetaAdCreative({
    accessToken: context.accessToken,
    adAccountId: context.resolvedAssets.adAccount?.id || "",
    payload: creativePayload,
  });
  if (!creativeResponse.id) {
    throw new Error("Meta ad creative creation failed.");
  }
  externalIds.creative_id = creativeResponse.id;
  metaResponses.creative = creativeResponse;

  const adPayload: Record<string, string> = {
    name: summary.ad.name,
    adset_id: adSetResponse.id,
    creative: JSON.stringify({ creative_id: creativeResponse.id }),
    status: statusSeed,
  };

  const adResponse = await createMetaAd({
    accessToken: context.accessToken,
    adAccountId: context.resolvedAssets.adAccount?.id || "",
    payload: adPayload,
  });
  if (!adResponse.id) {
    throw new Error("Meta ad creation failed.");
  }
  externalIds.ad_id = adResponse.id;
  metaResponses.ad = adResponse;

  let finalStatus = "draft_paused";
  if (mode === "live") {
    const activationAttempts: Array<{ label: string; objectId?: string }> = [
      { label: "campaign", objectId: campaignResponse.id },
      { label: "adset", objectId: adSetResponse.id },
      { label: "ad", objectId: adResponse.id },
    ];

    for (const attempt of activationAttempts) {
      if (!attempt.objectId) continue;
      try {
        await updateMetaObjectStatus({
          accessToken: context.accessToken,
          objectId: attempt.objectId,
          status: "ACTIVE",
        });
      } catch {
        launchWarnings.push({
          code: `activation_fallback_${attempt.label}`,
          message: `${attempt.label} stayed PAUSED because Meta rejected ACTIVE status. Draft objects were still created.`,
          scope: "live",
        });
      }
    }
    finalStatus = "live_requested";
  }

  await admin
    .from("campaigns")
    .update({
      external_publish_status: finalStatus,
      external_ids_json: externalIds,
      updated_at: now,
    })
    .eq("id", campaignId);

  return {
    externalIds,
    metaResponses,
    warnings: launchWarnings,
    publishStatus: finalStatus,
  };
}

export async function createMetaPublishJob({
  admin,
  workspaceId,
  campaignId,
  mode,
  createdBy,
  preflight,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  campaignId: string;
  mode: CampaignPublishMode;
  createdBy: string;
  preflight: MetaLaunchPreflight;
}) {
  const { data, error } = await admin
    .from("campaign_publish_jobs")
    .insert({
      workspace_id: workspaceId,
      campaign_id: campaignId,
      provider: "meta",
      mode,
      status: preflight.blockingIssues.length ? "preflight_failed" : "queued",
      preflight_blocking_issues_json: preflight.blockingIssues,
      preflight_warnings_json: preflight.warnings,
      resolved_assets_json: preflight.resolvedAssets,
      normalized_payload_json: preflight.normalizedPayloadSummary,
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as {
    id: string;
  };
}

export async function markMetaPublishJobResult({
  admin,
  jobId,
  status,
  metaRequest,
  metaResponse,
  externalIds,
  errorMessage,
  warnings,
}: {
  admin: SupabaseAdmin;
  jobId: string;
  status: "publishing" | "published" | "failed";
  metaRequest?: Record<string, unknown>;
  metaResponse?: Record<string, unknown>;
  externalIds?: Record<string, unknown>;
  errorMessage?: string;
  warnings?: LaunchIssue[];
}) {
  const { error } = await admin
    .from("campaign_publish_jobs")
    .update({
      status,
      meta_request_json: metaRequest || {},
      meta_response_json: metaResponse || {},
      external_ids_json: externalIds || {},
      preflight_warnings_json: warnings || [],
      error_message: errorMessage || null,
      completed_at: status === "published" || status === "failed" ? new Date().toISOString() : null,
    })
    .eq("id", jobId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function runMetaPreflightAndCreateJob({
  admin,
  campaignId,
  userId,
  mode,
}: {
  admin: SupabaseAdmin;
  campaignId: string;
  userId: string;
  mode: CampaignPublishMode;
}) {
  const context = await loadMetaLaunchContext({ admin, campaignId, userId });
  const preflight = await runMetaLaunchPreflight({
    admin,
    campaignId,
    userId,
    mode,
  });
  const job = await createMetaPublishJob({
    admin,
    workspaceId: context.workspaceId,
    campaignId,
    mode,
    createdBy: userId,
    preflight,
  });

  return {
    preflight,
    jobId: job.id,
    workspaceId: context.workspaceId,
  };
}

export function buildPublishRequestPayloadSummary(preflight: MetaLaunchPreflight) {
  return {
    mode: preflight.mode,
    objective: preflight.normalizedPayloadSummary.objective,
    campaignName: preflight.normalizedPayloadSummary.campaign.name,
    adSetName: preflight.normalizedPayloadSummary.adSet.name,
    adName: preflight.normalizedPayloadSummary.ad.name,
    ctaType: preflight.normalizedPayloadSummary.creative.ctaType,
    destinationType: preflight.normalizedPayloadSummary.adSet.destinationType,
    generatedRequestId: randomUUID(),
  };
}
