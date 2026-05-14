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
import { readLatestCampaignLaunchSnapshot } from "@/lib/campaign-snapshots";
import { createCampaignBlueprint } from "@/lib/template-engine";
import {
  createMetaAd,
  createMetaAdCreative,
  createMetaAdSet,
  createMetaCampaign,
  createMetaLeadForm,
  fetchMetaAdAccountDetails,
  inspectMetaLeadFormAccess,
  fetchMetaTokenDebugInfo,
  getMetaScopes,
  updateMetaObjectStatus,
} from "@/lib/meta";
import {
  getWorkspaceMetaAccessToken,
  getWorkspaceMetaIntegrationState,
} from "@/lib/meta-integration";
import { env } from "@/lib/env";
import {
  CampaignGoal,
  CampaignAdType,
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
  pageAccessToken: string | null;
  resolvedAssets: MetaResolvedAssets;
  integrationState: Awaited<ReturnType<typeof getWorkspaceMetaIntegrationState>>;
};

const leadFormManagementScopes = ["pages_manage_ads"] as const;
const leadFormManagementTasks = ["ADVERTISE", "MANAGE"] as const;

function goalLabel(goal: CampaignGoal) {
  return campaignGoalOptions.find((item) => item.id === goal)?.label || "Leads";
}

function adTypeRequiresLeadForm(adType: CampaignAdType) {
  return adType === "lead_form";
}

function adTypeRequiresPixel(adType: CampaignAdType) {
  return adType === "landing_page";
}

function adTypeUsesWebsiteDestination(adType: CampaignAdType) {
  return adType === "landing_page";
}

function adTypeRequiresPhone(adType: CampaignAdType) {
  return adType === "call_now";
}

function adTypeUsesMessengerSetup(adType: CampaignAdType) {
  return adType === "messenger_leads" || adType === "messenger_engagement";
}

function mapAdTypeToCta(adType: CampaignAdType) {
  switch (adType) {
    case "landing_page":
      return "LEARN_MORE";
    case "call_now":
      return "CALL_NOW";
    case "messenger_leads":
    case "messenger_engagement":
      return "SEND_MESSAGE";
    case "lead_form":
    default:
      return "SIGN_UP";
  }
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

function resolvePlaceholderRuntimeValue(
  fieldId: string,
  launchState: CampaignLaunchState,
  setupValues: ReturnType<typeof getTemplateSetupValuesFromLaunchState>,
) {
  const directValue = launchState.placeholderValues?.[fieldId];
  if (directValue && directValue.trim()) {
    return directValue.trim();
  }

  const setupValue = (setupValues as Record<string, unknown>)[fieldId];
  if (typeof setupValue === "string" && setupValue.trim()) {
    return setupValue.trim();
  }

  const normalizedId = fieldId.trim().toLowerCase();
  const aliases: Record<string, string[]> = {
    price: ["offerPrice"],
    offerprice: ["offerPrice"],
    regularprice: ["regularPrice"],
    businessname: ["businessName"],
    business_name: ["businessName"],
    location: ["city", "targetLocation"],
  };

  for (const aliasKey of aliases[normalizedId] || []) {
    const aliasValue = (setupValues as Record<string, unknown>)[aliasKey];
    if (typeof aliasValue === "string" && aliasValue.trim()) {
      return aliasValue.trim();
    }
  }

  const setupEntry = Object.entries(setupValues).find(([key, value]) => {
    return key.toLowerCase() === normalizedId && typeof value === "string" && value.trim();
  });

  if (setupEntry && typeof setupEntry[1] === "string") {
    return setupEntry[1].trim();
  }

  return "";
}

function absolutizeAppUrl(path: string) {
  const base = env.appUrl?.trim();
  if (!base) return path;
  try {
    return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
  } catch {
    return path;
  }
}

function normalizeCreativeMediaUrl(url?: string | null) {
  const trimmed = url?.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return absolutizeAppUrl(trimmed);
  return sanitizeDestinationUrl(trimmed);
}

function isPrivateOrLocalHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".local") ||
    /^10\./.test(normalized) ||
    /^192\.168\./.test(normalized) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
}

function resolveCreativeImageUrl(context: MetaLaunchContext) {
  const candidates = [
    ...(context.template.creativeAssets?.imageUrls || []),
    context.template.previewImage,
    context.businessProfile?.logo_url || "",
  ]
    .map((candidate) => normalizeCreativeMediaUrl(candidate))
    .filter(Boolean);

  return candidates[0] || "";
}

async function validateCreativeImageUrl(url: string) {
  if (!url) {
    return { ok: false, reason: "Campaign creative needs a preview image or image asset before it can publish." };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: "Creative image URL is invalid." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "Creative image URL must be HTTPS and publicly reachable by Meta." };
  }

  if (isPrivateOrLocalHost(parsed.hostname)) {
    return { ok: false, reason: "Creative image URL points to a local/private host. Meta cannot fetch media from localhost or private networks." };
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) {
      return { ok: false, reason: `Creative image URL returned ${response.status}.` };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return { ok: false, reason: "Creative image URL does not return an image content type." };
    }
  } catch {
    return { ok: false, reason: "Creative image URL could not be fetched from the server environment." };
  }

  return { ok: true, reason: "" };
}

function resolveThankYouDestinationUrl(context: MetaLaunchContext) {
  if (
    context.launchState.thankYouPage.buttonAction === "OPEN_WEBSITE" ||
    context.launchState.thankYouPage.buttonAction === "DOWNLOAD"
  ) {
    return sanitizeDestinationUrl(context.launchState.thankYouPage.websiteUrl);
  }

  if (context.resolvedAssets.page?.id) {
    return `https://www.facebook.com/${context.resolvedAssets.page.id}`;
  }

  const fallbackPageId = context.launchState.integrationSelections.pageId;
  if (fallbackPageId) {
    return `https://www.facebook.com/${fallbackPageId}`;
  }

  return "https://www.facebook.com";
}

function resolveAdTypeDestinationUrl(context: MetaLaunchContext) {
  switch (context.launchState.adType) {
    case "landing_page":
      return sanitizeDestinationUrl(context.launchState.landingPageUrl) || "https://facebook.com";
    case "call_now":
      return context.launchState.phoneNumber?.trim()
        ? `tel:${resolveCallPhoneNumber(context)}`
        : "https://facebook.com";
    case "messenger_leads":
    case "messenger_engagement":
      return context.resolvedAssets.page?.id
        ? `https://m.me/${context.resolvedAssets.page.id}`
        : context.launchState.integrationSelections.pageId
          ? `https://m.me/${context.launchState.integrationSelections.pageId}`
          : "https://facebook.com";
    case "lead_form":
    default:
      return resolveThankYouDestinationUrl(context);
  }
}

function resolveCallPhoneNumber(context: MetaLaunchContext) {
  const rawPhone = context.launchState.phoneNumber.trim();
  if (!rawPhone) return "";
  if (/^\+/.test(rawPhone)) return rawPhone;
  const countryCode = context.launchState.thankYouPage.completionCountryCode || "+1";
  return `${countryCode}${rawPhone}`;
}

function getSelectedPageAsset(context: MetaLaunchContext) {
  const pageId = context.resolvedAssets.page?.id;
  if (!pageId) return null;
  return context.integrationState.assets.pages.find((asset) => asset.asset_id === pageId) || null;
}

function getSelectedPageTasks(context: MetaLaunchContext) {
  const pageAsset = getSelectedPageAsset(context);
  const rawTasks = pageAsset?.metadata_json?.tasks;
  return Array.isArray(rawTasks) ? rawTasks.filter((task): task is string => typeof task === "string") : [];
}

function formatMetaAssetLabel(asset: { id: string; name: string } | null, fallback: string) {
  if (!asset) return fallback;
  return `${asset.name} (${asset.id})`;
}

function buildLeadFormCapabilityMessage({
  context,
  tokenScopes,
  configuredScopes,
  errorMessage,
  missingPermissions,
}: {
  context: MetaLaunchContext;
  tokenScopes: string[];
  configuredScopes: string[];
  errorMessage: string;
  missingPermissions: string[];
}) {
  const pageLabel = formatMetaAssetLabel(context.resolvedAssets.page, "selected Page");
  const adAccountLabel = formatMetaAssetLabel(context.resolvedAssets.adAccount, "selected ad account");
  const pageTasks = getSelectedPageTasks(context);
  const hasLeadFormTasks = leadFormManagementTasks.every((task) => pageTasks.includes(task));
  const tokenMissingLeadFormScopes = leadFormManagementScopes.filter((scope) => !tokenScopes.includes(scope));
  const oauthMissingLeadFormScopes = leadFormManagementScopes.filter((scope) => !configuredScopes.includes(scope));

  if (tokenMissingLeadFormScopes.length) {
    const roleHint = hasLeadFormTasks
      ? `The Page already grants tasks ${pageTasks.join(", ")}.`
      : pageTasks.length
        ? `The Page currently grants tasks ${pageTasks.join(", ")}. Managed lead forms need at least ${leadFormManagementTasks.join(" and ")} tasks on the selected Page.`
        : "The current Page tasks could not be confirmed from the latest asset sync.";

    const reconnectHint = oauthMissingLeadFormScopes.length
      ? `This workspace's standard OAuth scope list is ${configuredScopes.join(", ")}, so a normal reconnect from settings will not add ${oauthMissingLeadFormScopes.join(", ")}. Use the launch-flow Facebook reconnect, which requests the extra lead-form scope, then refresh assets.`
      : `Reconnect Meta with ${tokenMissingLeadFormScopes.join(", ")} approved, then refresh assets.`;

    return `Lead-form access failed for Page ${pageLabel} on ad account ${adAccountLabel}. ${roleHint} The active Meta token scopes are ${tokenScopes.join(", ") || "none"}, so Meta rejected /leadgen_forms with: ${errorMessage}. ${reconnectHint}`;
  }

  if (!hasLeadFormTasks && pageTasks.length) {
    return `Lead-form access failed for Page ${pageLabel} on ad account ${adAccountLabel}. The active Meta token already has the needed scope, but the selected Page only grants tasks ${pageTasks.join(", ")}. Managed lead forms need ${leadFormManagementTasks.join(" and ")} Page access.`;
  }

  if (missingPermissions.length) {
    return `Lead-form access failed for Page ${pageLabel} on ad account ${adAccountLabel}. Meta returned: ${errorMessage}. Missing permission(s): ${missingPermissions.join(", ")}.`;
  }

  return `Lead-form access could not be confirmed for Page ${pageLabel} on ad account ${adAccountLabel}. Meta returned: ${errorMessage}. Refresh assets to reload the selected Page token, and if the error persists confirm the Meta user has Page access plus business access to the selected ad account.`;
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

  const latestLaunchSnapshot = await readLatestCampaignLaunchSnapshot({
    admin,
    campaignId: campaign.id,
  }).catch(() => null);

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
    latestLaunchSnapshot || campaign.launch_state_json || {},
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
  const selectedPageAccessToken =
    pageAsset?.metadata_json &&
    typeof pageAsset.metadata_json === "object" &&
    typeof pageAsset.metadata_json.access_token === "string"
      ? pageAsset.metadata_json.access_token
      : null;
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
    pageAccessToken: selectedPageAccessToken,
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
  console.info(
    "[meta preflight] active connection",
    context.integrationState.connection?.id || "missing",
    "workspace=",
    context.workspaceId,
    "token scopes=",
    (tokenData?.scopes || context.integrationState.connection?.scopes || []).join(","),
  );

  if (!tokenData?.is_valid) {
    issues.push({
      code: "token_invalid",
      message: "Meta connection token is invalid or expired. Reconnect Meta in workspace settings.",
      type: "blocking",
      scope: "both",
      field: "metaConnection",
    });
  }

  const tokenScopes = tokenData?.scopes || context.integrationState.connection?.scopes || [];
  const missingScopes = requiredScopes.filter((scope) => !tokenScopes.includes(scope));
  const configuredScopes = getMetaScopes();
  if (missingScopes.length) {
    issues.push({
      code: "token_missing_scopes",
      message: `Meta connection is missing required scopes: ${missingScopes.join(", ")}. Reconnect Meta for this workspace to grant them.`,
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

  const placeholderFields = getTemplatePlaceholderFields(context.template);
  for (const field of placeholderFields) {
    if (!field.required) continue;
    const value = resolvePlaceholderRuntimeValue(field.id, context.launchState, setupValues);
    if (!value) {
      issues.push({
        code: `missing_placeholder_${field.id}`,
        message: `${field.label} is required before launch.`,
        type: "blocking",
        scope: "both",
        field: `placeholder.${field.id}`,
      });
    }
  }

  const thankYouWebsiteUrl = sanitizeDestinationUrl(context.launchState.thankYouPage.websiteUrl);
  const resolvedThankYouUrl = resolveAdTypeDestinationUrl(context);

  if (context.launchState.adType === "landing_page") {
    const landingPageUrl = sanitizeDestinationUrl(context.launchState.landingPageUrl);
    if (!landingPageUrl) {
      issues.push({
        code: "missing_landing_page_url",
        message: "Landing page campaigns need a website URL.",
        type: "blocking",
        scope: "both",
        field: "landingPageUrl",
      });
    } else {
      try {
        // Validate URL shape.
        // eslint-disable-next-line no-new
        new URL(landingPageUrl);
      } catch {
        issues.push({
          code: "invalid_landing_page_url",
          message: "Landing page URL is invalid.",
          type: "blocking",
          scope: "both",
          field: "landingPageUrl",
        });
      }
    }
  }

  if (adTypeRequiresPhone(context.launchState.adType)) {
    if (!context.launchState.phoneNumber?.trim()) {
      issues.push({
        code: "missing_call_phone",
        message: "Call Now campaigns need a phone number.",
        type: "blocking",
        scope: "both",
        field: "phoneNumber",
      });
    }
  }

  if (context.launchState.thankYouPage.enabled && adTypeRequiresLeadForm(context.launchState.adType)) {
    if (
      context.launchState.thankYouPage.buttonAction === "OPEN_WEBSITE" ||
      context.launchState.thankYouPage.buttonAction === "DOWNLOAD" ||
      goalUsesWebsiteDestination(context.launchState.campaignGoal)
    ) {
      if (thankYouWebsiteUrl) {
        try {
          // Validate URL shape.
          // eslint-disable-next-line no-new
          new URL(thankYouWebsiteUrl);
        } catch {
          issues.push({
            code: "invalid_destination_url",
            message: "Destination URL is invalid.",
            type: "blocking",
            scope: "both",
            field: "thankYouPage.websiteUrl",
          });
        }
      }
    }

    if (context.launchState.thankYouPage.buttonAction === "CALL_BUSINESS") {
      if (!context.launchState.thankYouPage.completionPhone?.trim()) {
        issues.push({
          code: "missing_call_phone",
          message: "Call Business thank-you actions need a phone number.",
          type: "blocking",
          scope: "both",
          field: "thankYouPage.completionPhone",
        });
      }
    }
  }

  if (adTypeRequiresLeadForm(context.launchState.adType)) {
    if (context.resolvedAssets.page?.id) {
      const leadFormAccess = await inspectMetaLeadFormAccess({
        accessToken: context.pageAccessToken || context.accessToken,
        pageId: context.resolvedAssets.page.id,
      });
      if (!leadFormAccess.ok) {
        const missingPermissions = leadFormAccess.missingPermissions;
        const hasMissingPagesManageAds = missingPermissions.includes("pages_manage_ads");
        issues.push({
          code: hasMissingPagesManageAds ? "page_manage_ads_missing" : "lead_form_page_access_unavailable",
          message: buildLeadFormCapabilityMessage({
            context,
            tokenScopes,
            configuredScopes,
            errorMessage: leadFormAccess.errorMessage || "Meta lead form access check failed.",
            missingPermissions,
          }),
          type: "blocking",
          scope: "both",
          field: hasMissingPagesManageAds ? "metaScopes" : "pageId",
        });
      }
    }

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

  if (adTypeUsesMessengerSetup(context.launchState.adType)) {
    if (
      !context.launchState.messengerWelcomeMessage.trim() &&
      !context.launchState.messengerReplyPrompt.trim()
    ) {
      issues.push({
        code: "missing_messenger_setup",
        message: "Messenger campaigns work best with a welcome message or reply prompt.",
        type: "warning",
        scope: "both",
        field: "messengerSetup",
      });
    }
  }

  if (adTypeRequiresPixel(context.launchState.adType) && !context.resolvedAssets.pixel) {
    issues.push({
      code: "missing_pixel_required",
      message: "A selected pixel is required for this campaign goal.",
      type: "blocking",
      scope: "both",
      field: "pixelId",
    });
  }

  if (context.launchState.adType === "landing_page" && !context.resolvedAssets.pixel) {
    issues.push({
      code: "pixel_recommended",
      message: "No pixel is selected. Landing page campaigns can still draft, but optimization quality may be limited.",
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

  const blueprint = createCampaignBlueprint(context.template, setupValues, {
    logoUrl: context.businessProfile?.logo_url || null,
    beforeImageUrls: (context.campaign.before_images_json as string[]) || [],
    afterImageUrls: (context.campaign.after_images_json as string[]) || [],
  });
  const creativeImageUrl = resolveCreativeImageUrl(context);
  const creativeImageValidation = await validateCreativeImageUrl(creativeImageUrl);
  if (!creativeImageValidation.ok) {
    issues.push({
      code: "creative_image_unavailable",
      message: creativeImageValidation.reason,
      type: "blocking",
      scope: "both",
      field: "creative.image",
    });
  }

  if ((context.template.creativeAssets?.videoUrls || []).length > 0 && !creativeImageUrl) {
    issues.push({
      code: "video_only_creative_unsupported",
      message: "Video-only creative publish is not configured yet. Add a preview image or image asset for this campaign.",
      type: "blocking",
      scope: "both",
      field: "creative.image",
    });
  }

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
  if (context.resolvedAssets.pixel && adTypeRequiresPixel(context.launchState.adType)) {
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
      destinationType: adTypeUsesWebsiteDestination(context.launchState.adType)
        ? "website"
        : adTypeRequiresLeadForm(context.launchState.adType)
          ? "lead_form"
          : "engagement",
    },
    creative: {
      name: `${context.launchState.advanced.campaignName || context.campaign.name} Creative`,
      primaryText: blueprint.adCopy.primary,
      headline: blueprint.adCopy.headlines[0] || context.campaign.headline,
      description: blueprint.adCopy.descriptions[0] || context.campaign.subheadline,
      ctaType: mapAdTypeToCta(context.launchState.adType),
      destinationUrl: resolveAdTypeDestinationUrl(context) || resolvedThankYouUrl || "https://facebook.com",
      imageUrl: creativeImageUrl,
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
  const resolvedThankYouUrl = resolveThankYouDestinationUrl(context);
  const now = new Date().toISOString();
  const statusSeed = "PAUSED";
  const externalIds: Record<string, string> = {};
  const metaResponses: Record<string, unknown> = {};
  const launchWarnings = [...preflight.warnings];
  let resolvedLeadFormId = summary.creative.leadFormId;

  if (adTypeRequiresLeadForm(context.launchState.adType) && summary.creative.leadFormMode === "managed_new") {
    const thankYouPage = context.launchState.thankYouPage.enabled
      ? {
          title: context.launchState.thankYouPage.headline,
          body: context.launchState.thankYouPage.description,
          buttonText: context.launchState.thankYouPage.buttonLabel,
          buttonType: context.launchState.thankYouPage.buttonAction,
          websiteUrl: resolvedThankYouUrl,
          completionCountryCode: context.launchState.thankYouPage.completionCountryCode,
          completionPhone: context.launchState.thankYouPage.completionPhone,
        }
      : undefined;

    const createdLeadForm = await createMetaLeadForm({
      accessToken: context.pageAccessToken || context.accessToken,
      pageId: context.resolvedAssets.page?.id || "",
      name: summary.creative.managedLeadFormName,
      privacyPolicyUrl: context.launchState.advanced.privacyPolicyUrl,
      fields: summary.creative.leadFormFields,
      thankYouPage,
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
          adTypeRequiresLeadForm(context.launchState.adType)
            ? {
                lead_gen_form_id: resolvedLeadFormId,
              }
            : context.launchState.adType === "call_now"
              ? {
                  link: summary.creative.destinationUrl,
                  phone_number: resolveCallPhoneNumber(context),
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
