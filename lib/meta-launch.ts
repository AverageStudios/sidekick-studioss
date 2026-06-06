import { createHash, randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTemplateById, hydrateTemplateRecord } from "@/data/templates";
import {
  buildMetaGeoLocations,
} from "@/lib/meta-targeting";
import {
  campaignGoalOptions,
  createLaunchStateView,
  getTemplatePlaceholderFields,
  getTemplateSetupValuesFromLaunchState,
  CampaignLaunchView,
  normalizeCampaignLaunchState,
  normalizeLeadFormQuestionKey,
  parseDailyBudgetToCents,
  resolvePlaceholderValue,
} from "@/lib/campaign-launch";
import { readLatestCampaignLaunchSnapshot } from "@/lib/campaign-snapshots";
import { createCampaignBlueprint } from "@/lib/template-engine";
import { hasUnresolvedPlaceholders } from "@/lib/template-placeholders";
import {
  createMetaAd,
  createMetaAdCreative,
  createMetaAdSet,
  createMetaCampaign,
  createMetaLeadForm,
  fetchMetaAdAccountDetails,
  fetchMetaLeadForms,
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
import { getWorkspaceBusinessProfileById } from "@/lib/workspaces";
import {
  CampaignGoal,
  CampaignAdType,
  CampaignLaunchState,
  CampaignPublishMode,
  CampaignRecord,
  TemplateSeed,
} from "@/types";

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

const optionalCampaignColumns = new Set([
  "workspace_id",
  "external_ids_json",
  "external_publish_status",
  "meta_campaign_id",
  "meta_adset_id",
  "meta_ad_id",
  "meta_lead_form_id",
  "meta_creative_id",
  "meta_effective_status",
  "meta_configured_status",
  "meta_status_synced_at",
  "management_sync_state",
  "archived_at",
]);

function getMissingCampaignSchemaColumn(message?: string) {
  if (!message) return null;
  const match = message.match(/Could not find the '([^']+)' column of 'campaigns'/i);
  return match?.[1] || null;
}

async function updateCampaignWithSchemaFallback(
  admin: SupabaseAdmin,
  campaignId: string,
  payload: Record<string, unknown>,
) {
  const nextPayload = { ...payload };

  while (Object.keys(nextPayload).length) {
    const { error } = await admin.from("campaigns").update(nextPayload).eq("id", campaignId);
    if (!error) {
      return;
    }

    const missingColumn = getMissingCampaignSchemaColumn(error.message);
    if (!missingColumn || !optionalCampaignColumns.has(missingColumn) || !(missingColumn in nextPayload)) {
      throw new Error(error.message);
    }

    delete nextPayload[missingColumn];
  }
}

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
  leadForm: { id: string; name: string; mode: CampaignLaunchView["leadForm"]["mode"] } | null;
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
    destinationType: "ON_AD" | "WEBSITE" | null;
  };
  creative: {
    name: string;
    primaryText: string;
    headline: string;
    description: string;
    ctaType: string;
    destinationUrl: string;
    imageUrl: string;
    leadFormMode: CampaignLaunchView["leadForm"]["mode"];
    leadFormId: string | null;
    managedLeadFormName: string;
    leadFormFields: Array<CampaignLaunchView["leadForm"]["fields"][number]>;
    leadFormCustomQuestions: CampaignLaunchView["leadForm"]["customQuestions"];
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
  launchState: CampaignLaunchView;
  launchStateModel: CampaignLaunchState;
  businessProfile: {
    business_name: string;
    website?: string | null;
    industry?: string | null;
    privacy_policy_url?: string | null;
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

type MetaRequestError = Error & {
  metaCode?: number;
  metaSubcode?: number;
  metaType?: string;
  metaTraceId?: string;
  metaUserTitle?: string;
  metaUserMessage?: string;
  metaErrorData?: Record<string, unknown>;
  metaBlameFieldSpecs?: string[][];
  metaRequestUrl?: string;
  metaRequestBody?: string;
  metaResponseBody?: string;
  metaResponseJson?: unknown;
  metaPublishStage?: string;
  metaPublishEndpoint?: string;
  metaPublishPayload?: Record<string, unknown>;
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

function resolveAdSetDestinationType(adType: CampaignAdType): "ON_AD" | "WEBSITE" | null {
  if (adTypeRequiresLeadForm(adType)) {
    return "ON_AD";
  }
  if (adTypeUsesWebsiteDestination(adType)) {
    return "WEBSITE";
  }
  return null;
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

function resolveMetaObjective(adType: CampaignAdType, goal: CampaignGoal) {
  if (adType === "call_now") {
    return "OUTCOME_AWARENESS" as const;
  }
  return goal;
}

function mapGoalToOptimizationGoal(adType: CampaignAdType, goal: CampaignGoal) {
  if (adType === "call_now") return "REACH" as const;
  if (goal === "OUTCOME_AWARENESS") return "REACH" as const;
  if (goal === "OUTCOME_TRAFFIC") return "LINK_CLICKS" as const;
  if (goal === "OUTCOME_ENGAGEMENT") return "POST_ENGAGEMENT" as const;
  if (goal === "OUTCOME_APP_PROMOTION") return "APP_INSTALLS" as const;
  if (goal === "OUTCOME_SALES") return "OFFSITE_CONVERSIONS" as const;
  return "LEAD_GENERATION" as const;
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
  return resolvePlaceholderValue(fieldId, launchState, setupValues);
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

  return "";
}

function isMetaOwnedUrl(value: string) {
  const normalized = sanitizeDestinationUrl(value);
  if (!normalized) return false;
  try {
    const hostname = new URL(normalized).hostname.toLowerCase();
    return (
      hostname === "facebook.com" ||
      hostname.endsWith(".facebook.com") ||
      hostname === "fb.com" ||
      hostname.endsWith(".fb.com") ||
      hostname === "m.me" ||
      hostname.endsWith(".m.me") ||
      hostname === "instagram.com" ||
      hostname.endsWith(".instagram.com") ||
      hostname === "messenger.com" ||
      hostname.endsWith(".messenger.com")
    );
  } catch {
    return false;
  }
}

function isLocalOrPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

function isPublicAbsoluteUrl(value: string) {
  const normalized = sanitizeDestinationUrl(value);
  if (!normalized) return false;
  try {
    const url = new URL(normalized);
    if (!/^https?:$/i.test(url.protocol)) {
      return false;
    }
    return !isLocalOrPrivateHostname(url.hostname);
  } catch {
    return false;
  }
}

function resolvePublicAppBaseUrl() {
  const configured = sanitizeDestinationUrl(env.appUrl || "");
  if (configured && isPublicAbsoluteUrl(configured)) {
    return configured.replace(/\/+$/, "");
  }
  return "https://sidekickstudioss.com";
}

function buildPublicAppUrl(pathname: string) {
  return new URL(pathname, resolvePublicAppBaseUrl()).toString();
}

function resolveLeadFormPrivacyPolicyUrl(context: MetaLaunchContext) {
  const configured = sanitizeDestinationUrl(context.launchState.advanced.privacyPolicyUrl);
  if (configured && isPublicAbsoluteUrl(configured) && !isMetaOwnedUrl(configured)) {
    return configured;
  }
  return buildPublicAppUrl("/privacy");
}

function resolveLeadFormCreativeExternalUrl(context: MetaLaunchContext) {
  const candidates = [
    context.launchState.landingPageUrl,
    context.launchState.thankYouPage.websiteUrl,
    resolveLeadFormPrivacyPolicyUrl(context),
    buildPublicAppUrl("/"),
  ];

  for (const candidate of candidates) {
    const normalized = sanitizeDestinationUrl(candidate);
    if (!normalized) continue;
    if (!isPublicAbsoluteUrl(normalized)) continue;
    if (isMetaOwnedUrl(normalized)) continue;
    return normalized;
  }

  return "";
}

function resolveCallNowCreativeUrl(context: MetaLaunchContext) {
  const candidates = [
    context.businessProfile?.website || "",
    context.launchState.landingPageUrl,
    resolveLeadFormPrivacyPolicyUrl(context),
    buildPublicAppUrl("/"),
  ];

  for (const candidate of candidates) {
    const normalized = sanitizeDestinationUrl(candidate);
    if (!normalized) continue;
    if (!isPublicAbsoluteUrl(normalized)) continue;
    if (isMetaOwnedUrl(normalized)) continue;
    return normalized;
  }

  return "";
}

function resolveAdTypeDestinationUrl(context: MetaLaunchContext) {
  switch (context.launchState.adType) {
    case "landing_page":
      return sanitizeDestinationUrl(context.launchState.landingPageUrl);
    case "call_now":
      return resolveCallNowCreativeUrl(context);
    case "messenger_leads":
    case "messenger_engagement":
      return context.resolvedAssets.page?.id
        ? `https://m.me/${context.resolvedAssets.page.id}`
        : context.launchState.integrationSelections.pageId
          ? `https://m.me/${context.launchState.integrationSelections.pageId}`
          : "";
    case "lead_form":
    default:
      return resolveLeadFormCreativeExternalUrl(context) || resolveThankYouDestinationUrl(context);
  }
}

function resolveCallPhoneNumber(context: MetaLaunchContext) {
  const rawPhone = context.launchState.phoneNumber.trim();
  if (!rawPhone) return "";
  const normalizedRawPhone = rawPhone.replace(/[^\d+]/g, "");
  if (!normalizedRawPhone) return "";
  if (/^\+/.test(normalizedRawPhone)) {
    return `+${normalizedRawPhone.slice(1).replace(/\D/g, "")}`;
  }

  const digitPhone = normalizedRawPhone.replace(/\D/g, "");
  const rawCountryCode = (context.launchState.thankYouPage.completionCountryCode || "+1").trim();
  const normalizedCountryCode = rawCountryCode.startsWith("+")
    ? `+${rawCountryCode.slice(1).replace(/\D/g, "")}`
    : `+${rawCountryCode.replace(/\D/g, "")}`;

  if (!digitPhone) return "";
  if (normalizedCountryCode === "+1" && digitPhone.length === 11 && digitPhone.startsWith("1")) {
    return `+${digitPhone}`;
  }
  return `${normalizedCountryCode}${digitPhone}`;
}

function isValidMetaCallPhoneNumber(phone: string) {
  return /^\+\d{10,15}$/.test(phone);
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

function stringifyMetaPayload(payload: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
}

function formatUtcTimestampForName(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

function buildManagedLeadFormName(context: MetaLaunchContext) {
  const templateName = context.template.name?.trim() || context.launchState.advanced.campaignName?.trim() || "Lead Form";
  const businessName = context.businessProfile?.business_name?.trim() || context.campaign.name?.trim() || "Workspace";
  const timestamp = formatUtcTimestampForName();
  const suffix = randomUUID().slice(0, 6);
  const name = `${templateName} - ${businessName} - ${timestamp} - ${suffix}`;
  return name.length > 120 ? name.slice(0, 117).trimEnd() + "..." : name;
}

function buildManagedLeadFormFingerprint({
  pageId,
  privacyPolicyUrl,
  fields,
  customQuestions,
  thankYouPage,
}: {
  pageId: string;
  privacyPolicyUrl: string;
  fields: Array<CampaignLaunchView["leadForm"]["fields"][number]>;
  customQuestions: CampaignLaunchView["leadForm"]["customQuestions"];
  thankYouPage?: {
    title?: string;
    body?: string;
    buttonText?: string;
    buttonType?: "OPEN_WEBSITE" | "DOWNLOAD" | "CALL_BUSINESS";
    websiteUrl?: string;
    completionCountryCode?: string;
    completionPhone?: string;
  };
}) {
  const payload = {
    pageId,
    privacyPolicyUrl,
    fields,
    customQuestions: customQuestions.map((question) => ({
      key: normalizeLeadFormQuestionKey(question.key),
      label: question.label.trim(),
      type: question.type,
      options: question.options.map((option) => option.value.trim()).filter(Boolean),
    })),
    thankYouPage: thankYouPage
      ? {
          title: thankYouPage.title || "",
          body: thankYouPage.body || "",
          buttonText: thankYouPage.buttonText || "",
          buttonType: thankYouPage.buttonType || "",
          websiteUrl: thankYouPage.websiteUrl || "",
          completionCountryCode: thankYouPage.completionCountryCode || "",
          completionPhone: thankYouPage.completionPhone || "",
        }
      : null,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function validateManagedLeadFormCustomQuestions(
  questions: CampaignLaunchView["leadForm"]["customQuestions"],
  standardFields: CampaignLaunchView["leadForm"]["fields"],
) {
  const issues: InternalIssue[] = [];
  const seenKeys = new Set<string>(standardFields.map((field) => field.toLowerCase()));

  questions.forEach((question, index) => {
    const normalizedKey = normalizeLeadFormQuestionKey(question.key || question.label);
    if (!question.label.trim()) {
      issues.push({
        code: `missing_custom_question_label_${question.id}`,
        message: `Custom question ${index + 1} needs a question label.`,
        type: "blocking",
        scope: "both",
        field: `leadForm.customQuestions.${index}.label`,
      });
    }

    if (!normalizedKey) {
      issues.push({
        code: `invalid_custom_question_key_${question.id}`,
        message: `Custom question ${index + 1} needs a valid internal key.`,
        type: "blocking",
        scope: "both",
        field: `leadForm.customQuestions.${index}.key`,
      });
    } else if (seenKeys.has(normalizedKey)) {
      issues.push({
        code: `duplicate_custom_question_key_${question.id}`,
        message: `Custom question keys must be unique. "${normalizedKey}" is duplicated.`,
        type: "blocking",
        scope: "both",
        field: `leadForm.customQuestions.${index}.key`,
      });
    } else {
      seenKeys.add(normalizedKey);
    }

    if (question.type === "MULTIPLE_CHOICE") {
      const options = question.options.map((option) => option.value.trim()).filter(Boolean);
      if (!options.length) {
        issues.push({
          code: `missing_custom_question_options_${question.id}`,
          message: `Multiple choice question "${question.label || `Question ${index + 1}`}" needs at least one option.`,
          type: "blocking",
          scope: "both",
          field: `leadForm.customQuestions.${index}.options`,
        });
      }
    }
  });

  return issues;
}

function buildPersistedCampaignMetaIds(externalIds: Record<string, string>) {
  return {
    meta_campaign_id: externalIds.campaign_id || null,
    meta_adset_id: externalIds.adset_id || null,
    meta_ad_id: externalIds.ad_id || null,
    meta_lead_form_id: externalIds.lead_form_id || null,
    meta_creative_id: externalIds.creative_id || null,
  };
}

export function summarizeMetaError(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }
  const metaError = error as MetaRequestError;
  return {
    message: metaError.message,
    stage: metaError.metaPublishStage || null,
    endpoint: metaError.metaPublishEndpoint || metaError.metaRequestUrl || null,
    code: metaError.metaCode ?? null,
    subcode: metaError.metaSubcode ?? null,
    type: metaError.metaType || null,
    traceId: metaError.metaTraceId || null,
    userTitle: metaError.metaUserTitle || null,
    userMessage: metaError.metaUserMessage || null,
    blameFieldSpecs: metaError.metaBlameFieldSpecs || null,
    requestUrl: metaError.metaRequestUrl || null,
    requestBody: metaError.metaRequestBody || null,
    responseBody: metaError.metaResponseBody || null,
    responseJson: metaError.metaResponseJson || null,
    errorData: metaError.metaErrorData || null,
    payload: metaError.metaPublishPayload || null,
  };
}

function annotateMetaPublishError(
  error: unknown,
  metaPublishStage: string,
  metaPublishEndpoint: string,
  metaPublishPayload: Record<string, unknown>,
) {
  const metaError = (error instanceof Error ? error : new Error(String(error))) as MetaRequestError;
  metaError.metaPublishStage = metaPublishStage;
  metaError.metaPublishEndpoint = metaPublishEndpoint;
  metaError.metaPublishPayload = stringifyMetaPayload(metaPublishPayload);
  return metaError;
}

function describeDuplicateLeadFormError(metaError: MetaRequestError) {
  if (metaError.metaSubcode === 1892019) {
    return "Meta rejected the lead form name because it already exists. A unique name is now generated automatically, so retry the launch. If this keeps happening, delete the old form or change the managed form name.";
  }
  return null;
}

function buildCampaignCreatePayload(summary: MetaLaunchPreflight["normalizedPayloadSummary"]) {
  return {
    name: summary.campaign.name,
    objective: summary.objective,
    status: "PAUSED",
    special_ad_categories: "[]",
    is_adset_budget_sharing_enabled: "false",
  };
}

function buildAdSetCreatePayload({
  summary,
  campaignId,
  status,
}: {
  summary: MetaLaunchPreflight["normalizedPayloadSummary"];
  campaignId: string;
  status: "PAUSED" | "ACTIVE";
}) {
  return {
    name: summary.adSet.name,
    campaign_id: campaignId,
    billing_event: summary.adSet.billingEvent,
    optimization_goal: summary.adSet.optimizationGoal,
    daily_budget: String(summary.adSet.dailyBudgetCents),
    targeting: JSON.stringify(summary.adSet.targeting),
    status,
    promoted_object: JSON.stringify(summary.adSet.promotedObject || {}),
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    ...(summary.adSet.destinationType ? { destination_type: summary.adSet.destinationType } : {}),
  };
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
  const connectionMetadata = context.integrationState.connection?.metadata_json || {};
  const oauthRequestedScopes = Array.isArray(connectionMetadata.oauth_requested_scopes)
    ? connectionMetadata.oauth_requested_scopes.filter((scope): scope is string => typeof scope === "string")
    : [];
  const oauthGrantedScopes = Array.isArray(connectionMetadata.oauth_granted_scopes)
    ? connectionMetadata.oauth_granted_scopes.filter((scope): scope is string => typeof scope === "string")
    : [];
  const oauthScopeSet =
    typeof connectionMetadata.oauth_scope_set === "string" ? connectionMetadata.oauth_scope_set : null;
  const reconnectTraceMissing = !oauthRequestedScopes.length;
  const leadFormScopeWasRequested = oauthRequestedScopes.includes("pages_manage_ads");
  const leadFormScopeWasGranted = oauthGrantedScopes.includes("pages_manage_ads");

  if (tokenMissingLeadFormScopes.length) {
    const roleHint = hasLeadFormTasks
      ? `The Page already grants tasks ${pageTasks.join(", ")}.`
      : pageTasks.length
        ? `The Page currently grants tasks ${pageTasks.join(", ")}. Managed lead forms need at least ${leadFormManagementTasks.join(" and ")} tasks on the selected Page.`
        : "The current Page tasks could not be confirmed from the latest asset sync.";

    const reconnectHint = reconnectTraceMissing
      ? `This active connection does not include any saved OAuth scope trace, so it predates the lead-form reconnect upgrade and has never proven that it requested ${tokenMissingLeadFormScopes.join(", ")}. Reconnect once from the updated launch flow or workspace settings, then refresh assets.`
      : !leadFormScopeWasRequested
        ? `This connection was created with scope set ${oauthScopeSet || "default"} and requested scopes ${oauthRequestedScopes.join(", ") || configuredScopes.join(", ")}, which did not include ${tokenMissingLeadFormScopes.join(", ")}. Reconnect from the updated launch flow or workspace settings, which now requests the extra lead-form scope, then refresh assets.`
        : !leadFormScopeWasGranted
          ? `The updated reconnect flow did request ${tokenMissingLeadFormScopes.join(", ")}, but Meta still granted only ${oauthGrantedScopes.join(", ") || tokenScopes.join(", ")}. The remaining blocker is Meta-side permission approval for this app/user/Page connection.`
          : oauthMissingLeadFormScopes.length
            ? `This workspace's standard OAuth scope list is ${configuredScopes.join(", ")}, so a normal reconnect from settings will not add ${oauthMissingLeadFormScopes.join(", ")}. Use the lead-form reconnect path, then refresh assets.`
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

  const workspaceBusinessProfile = await getWorkspaceBusinessProfileById(admin, campaign.workspace_id);
  const businessProfile = workspaceBusinessProfile
    ? {
        business_name: workspaceBusinessProfile.business_name,
        website: workspaceBusinessProfile.website,
        industry: workspaceBusinessProfile.industry,
        privacy_policy_url: workspaceBusinessProfile.privacy_policy_url,
        location: workspaceBusinessProfile.location,
        phone: workspaceBusinessProfile.phone,
        email: workspaceBusinessProfile.email,
        description: workspaceBusinessProfile.description,
        logo_url: workspaceBusinessProfile.logo_url,
      }
    : null;

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
          website: businessProfile.website || "",
          industry: businessProfile.industry || "",
          privacy_policy_url: businessProfile.privacy_policy_url || "",
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
    integrationState.selected.adAccountId || launchState.integrationSelections.adAccountId || "";
  const selectedPageId =
    integrationState.selected.pageId || launchState.integrationSelections.pageId || "";
  const selectedPixelId =
    launchState.integrationSelections.pixelId || integrationState.selected.pixelId || "";
  const selectedLeadFormId =
    launchState.adTypeConfig.leadForm.selectedFormId ||
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
  launchState.adTypeConfig = {
    ...launchState.adTypeConfig,
    leadForm: {
      ...launchState.adTypeConfig.leadForm,
      selectedFormId: selectedLeadFormId,
    },
    landingPage: {
      ...launchState.adTypeConfig.landingPage,
      pixelId: selectedPixelId || launchState.adTypeConfig.landingPage.pixelId,
    },
  };
  const launchStateView = createLaunchStateView(launchState);

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
          mode: launchStateView.leadForm.mode,
        }
      : null,
    instagramActor: instagramAsset
      ? { id: instagramAsset.asset_id, name: instagramAsset.name || instagramAsset.asset_id }
      : null,
  };

  return {
    campaign,
    template,
    launchState: launchStateView,
    launchStateModel: launchState,
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
  const connectionMetadata =
    context.integrationState.connection?.metadata_json &&
    typeof context.integrationState.connection.metadata_json === "object"
      ? context.integrationState.connection.metadata_json
      : {};
  console.info(
    "[meta preflight] active connection",
    context.integrationState.connection?.id || "missing",
    "workspace=",
    context.workspaceId,
    "token scopes=",
    (tokenData?.scopes || context.integrationState.connection?.scopes || []).join(","),
    "scopeSet=",
    typeof connectionMetadata.oauth_scope_set === "string" ? connectionMetadata.oauth_scope_set : "missing",
    "requested scopes=",
    Array.isArray(connectionMetadata.oauth_requested_scopes)
      ? connectionMetadata.oauth_requested_scopes.join(",")
      : "missing",
    "granted scopes=",
    Array.isArray(connectionMetadata.oauth_granted_scopes)
      ? connectionMetadata.oauth_granted_scopes.join(",")
      : "missing",
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

  const unresolvedTargetLocation = (context.launchState.targetLocations || []).find((location) => {
    if (location.scope === "world" || location.scope === "country" || location.scope === "state") {
      return false;
    }

    const hasMetaKey = Boolean(location.metaLocation?.key);
    const hasCoordinates = typeof location.lat === "number" && typeof location.lon === "number";

    return !hasMetaKey && !hasCoordinates;
  });

  if (unresolvedTargetLocation) {
    issues.push({
      code: "unresolved_target_location",
      message: `Select a suggested location for "${unresolvedTargetLocation.label}" before launch so Meta can target it correctly.`,
      type: "blocking",
      scope: "both",
      field: "targetLocations",
    });
  }

  const setupValues = getTemplateSetupValuesFromLaunchState(
    context.template,
    context.launchStateModel,
    context.businessProfile
      ? {
          id: "",
          user_id: context.campaign.user_id,
          workspace_id: context.workspaceId,
          business_name: context.businessProfile.business_name,
          website: context.businessProfile.website || "",
          industry: context.businessProfile.industry || "",
          privacy_policy_url: context.businessProfile.privacy_policy_url || "",
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
    const value = resolvePlaceholderRuntimeValue(field.id, context.launchStateModel, setupValues);
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
  const resolvedLeadFormCreativeUrl = resolveLeadFormCreativeExternalUrl(context);

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
    } else if (!isValidMetaCallPhoneNumber(resolveCallPhoneNumber(context))) {
      issues.push({
        code: "invalid_call_phone",
        message: "Call Now phone number must include a valid country code and phone number.",
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
    if (!resolvedLeadFormCreativeUrl) {
      issues.push({
        code: "missing_lead_form_external_url",
        message:
          "Lead form creatives need an external advertiser URL. Add a landing page or advertiser-domain URL before publishing.",
        type: "blocking",
        scope: "both",
        field: "creative.destinationUrl",
      });
    } else if (!isPublicAbsoluteUrl(resolvedLeadFormCreativeUrl)) {
      issues.push({
        code: "invalid_lead_form_external_url",
        message:
          "Lead form creatives must use a public absolute URL. Localhost, private-network, and relative URLs are not allowed.",
        type: "blocking",
        scope: "both",
        field: "creative.destinationUrl",
      });
    } else if (isMetaOwnedUrl(resolvedLeadFormCreativeUrl)) {
      issues.push({
        code: "invalid_lead_form_external_url",
        message:
          "Lead form creatives cannot use Facebook, Instagram, Messenger, or other Meta-owned URLs. Use an advertiser-owned website URL instead.",
        type: "blocking",
        scope: "both",
        field: "creative.destinationUrl",
      });
    }

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
      const customQuestions = context.launchState.leadForm.customQuestions || [];
      if (!selectedLeadFields.length && !customQuestions.length) {
        issues.push({
          code: "missing_lead_form_questions",
          message: "Add at least one standard field or custom question for managed lead form mode.",
          type: "blocking",
          scope: "both",
          field: "leadForm.customQuestions",
        });
      }
      issues.push(...validateManagedLeadFormCustomQuestions(customQuestions, selectedLeadFields));
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

  if (context.launchState.adType === "landing_page" && !context.resolvedAssets.pixel) {
    issues.push({
      code: "pixel_recommended",
      message: "No pixel is selected. Landing page campaigns can still publish, but optimization quality may be limited.",
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
    objective: resolveMetaObjective(context.launchState.adType, context.launchState.campaignGoal),
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
      optimizationGoal: mapGoalToOptimizationGoal(context.launchState.adType, context.launchState.campaignGoal),
      targeting,
      promotedObject,
      destinationType: resolveAdSetDestinationType(context.launchState.adType),
    },
    creative: {
      name: `${context.launchState.advanced.campaignName || context.campaign.name} Creative`,
      primaryText:
        blueprint.adCopy.primary ||
        context.campaign.ad_copy_json?.primary ||
        context.template.adCopy.primary ||
        context.template.description ||
        context.template.promoDetails ||
        "",
      headline: blueprint.adCopy.headlines[0] || context.campaign.headline,
      description:
        blueprint.adCopy.descriptions[0] ||
        context.campaign.ad_copy_json?.descriptions?.[0] ||
        "",
      ctaType: mapAdTypeToCta(context.launchState.adType),
      destinationUrl: adTypeRequiresLeadForm(context.launchState.adType)
        ? resolvedLeadFormCreativeUrl
        : resolveAdTypeDestinationUrl(context) || resolvedThankYouUrl || "",
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
      leadFormCustomQuestions: context.launchState.leadForm.customQuestions || [],
    },
    ad: {
      name: `${context.launchState.advanced.campaignName || context.campaign.name} Ad`,
      statusDraft: "PAUSED",
      statusLive: "ACTIVE",
    },
  };

  const { blockingIssues, warnings } = buildIssuesForMode(mode, issues);
  if (context.launchState.adType === "lead_form" && normalizedPayloadSummary.adSet.destinationType !== "ON_AD") {
    blockingIssues.push({
      code: "lead_form_destination_type_invalid",
      message: "Lead form campaigns must use ON_AD destination so Meta can use the on-ad instant form flow.",
      field: "adSet.destinationType",
      scope: mode,
    });
  }
  const unresolvedCreativeField = [
    { field: "creative.primaryText", label: "Primary text", value: normalizedPayloadSummary.creative.primaryText },
    { field: "creative.headline", label: "Headline", value: normalizedPayloadSummary.creative.headline },
    { field: "creative.description", label: "Description", value: normalizedPayloadSummary.creative.description },
  ].find((item) => hasUnresolvedPlaceholders(item.value));

  if (unresolvedCreativeField) {
    blockingIssues.push({
      code: "creative_placeholders_unresolved",
      message: `${unresolvedCreativeField.label} still contains unresolved placeholder text. Fill every required value before publishing.`,
      field: unresolvedCreativeField.field,
      scope: mode,
    });
  }
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
  const pageId = context.resolvedAssets.page?.id || context.launchState.integrationSelections.pageId || "";
  const pageAccessToken = context.pageAccessToken || context.accessToken;

  console.info("[meta publish] normalized wizard state", {
    campaignId,
    workspaceId: context.workspaceId,
    mode,
    adType: context.launchState.adType,
    objective: summary.objective,
    selectedAssets: {
      adAccount: context.resolvedAssets.adAccount,
      page: context.resolvedAssets.page,
      pixel: context.resolvedAssets.pixel,
      leadForm: context.resolvedAssets.leadForm,
      instagramActor: context.resolvedAssets.instagramActor,
    },
    payloadSummary: summary,
  });

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
    const managedLeadFormName = buildManagedLeadFormName(context);
    const leadFormFingerprint = buildManagedLeadFormFingerprint({
      pageId,
      privacyPolicyUrl: resolveLeadFormPrivacyPolicyUrl(context),
      fields: summary.creative.leadFormFields,
      customQuestions: summary.creative.leadFormCustomQuestions,
      thankYouPage,
    });
    const existingExternalIds =
      context.campaign.external_ids_json && typeof context.campaign.external_ids_json === "object"
        ? (context.campaign.external_ids_json as Record<string, unknown>)
        : {};
    const storedLeadFormId =
      typeof existingExternalIds.lead_form_id === "string" ? existingExternalIds.lead_form_id : null;
    const storedLeadFormFingerprint =
      typeof existingExternalIds.lead_form_fingerprint === "string"
        ? existingExternalIds.lead_form_fingerprint
        : null;
    const storedLeadFormName =
      typeof existingExternalIds.lead_form_name === "string" ? existingExternalIds.lead_form_name : null;
    const canReuseStoredLeadForm =
      Boolean(storedLeadFormId) && storedLeadFormFingerprint === leadFormFingerprint;
    const reusableLeadForms = canReuseStoredLeadForm
      ? await fetchMetaLeadForms(pageAccessToken, pageId).catch(
          () => [] as Array<{ id: string; name?: string }>,
        )
      : [];
    const reusableLeadForm = reusableLeadForms.find(
      (form: { id: string; name?: string }) => form.id === storedLeadFormId,
    ) || null;

    if (reusableLeadForm) {
      resolvedLeadFormId = reusableLeadForm.id;
      externalIds.lead_form_id = reusableLeadForm.id;
      metaResponses.lead_form = {
        id: reusableLeadForm.id,
        name: reusableLeadForm.name || storedLeadFormName || managedLeadFormName,
        reused: true,
      };
      console.info("[meta publish] reusing existing lead form", {
        campaignId,
        leadFormId: reusableLeadForm.id,
        leadFormName: reusableLeadForm.name || storedLeadFormName || managedLeadFormName,
      });
    } else {
      const leadFormPayloadDebug = {
        name: managedLeadFormName,
        locale: "en_US",
        allow_organic_lead: "true",
        is_optimized_for_quality: "false",
        block_display_for_non_targeted_viewer: "false",
        questions: [
          ...summary.creative.leadFormFields.map((type) => ({
            type,
            key: type.toLowerCase(),
          })),
          ...summary.creative.leadFormCustomQuestions.map((question) => ({
            type: "CUSTOM",
            key: normalizeLeadFormQuestionKey(question.key || question.label),
            label: question.label,
            ...(question.type === "MULTIPLE_CHOICE"
              ? {
                  options: question.options
                    .map((option, index) => ({
                      key: `${normalizeLeadFormQuestionKey(question.key || question.label)}_${index + 1}`,
                      value: option.value,
                    }))
                    .filter((option) => option.value.trim()),
                }
              : {}),
          })),
        ],
        privacy_policy: {
          url: resolveLeadFormPrivacyPolicyUrl(context),
          link_text: "Privacy Policy",
        },
        ...(thankYouPage
          ? {
              thank_you_page: {
                title: thankYouPage.title || "Thanks, we got your request.",
                body: thankYouPage.body || "We'll follow up shortly with the next step.",
                button_type:
                  thankYouPage.buttonType === "CALL_BUSINESS"
                    ? "CALL_BUSINESS"
                    : thankYouPage.buttonType === "DOWNLOAD"
                      ? thankYouPage.websiteUrl
                        ? "DOWNLOAD"
                        : "VIEW_ON_FACEBOOK"
                      : thankYouPage.websiteUrl
                        ? "VIEW_WEBSITE"
                        : "VIEW_ON_FACEBOOK",
                button_text: thankYouPage.buttonText || "Continue",
                ...(thankYouPage.websiteUrl
                  ? { website_url: thankYouPage.websiteUrl }
                  : {}),
                ...(thankYouPage.completionCountryCode && thankYouPage.buttonType === "CALL_BUSINESS"
                  ? { country_code: thankYouPage.completionCountryCode }
                  : {}),
                ...(thankYouPage.completionPhone && thankYouPage.buttonType === "CALL_BUSINESS"
                  ? { business_phone_number: thankYouPage.completionPhone }
                  : {}),
              },
            }
          : {}),
      };

      console.info("[meta publish] lead form create request", {
        endpoint: `${pageId}/leadgen_forms`,
        payload: leadFormPayloadDebug,
      });

      let createdLeadForm;
      try {
        createdLeadForm = await createMetaLeadForm({
          accessToken: pageAccessToken,
          pageId,
          name: managedLeadFormName,
          privacyPolicyUrl: resolveLeadFormPrivacyPolicyUrl(context),
          fields: summary.creative.leadFormFields,
          customQuestions: summary.creative.leadFormCustomQuestions,
          thankYouPage,
        });
      } catch (error) {
        const metaError = error as MetaRequestError;
        const duplicateMessage = describeDuplicateLeadFormError(metaError);
        if (duplicateMessage) {
          const duplicateError = error instanceof Error ? error : new Error(String(error));
          duplicateError.message = duplicateMessage;
          throw annotateMetaPublishError(
            duplicateError,
            "lead_form_create",
            `${pageId}/leadgen_forms`,
            leadFormPayloadDebug,
          );
        }
        throw annotateMetaPublishError(
          error,
          "lead_form_create",
          `${pageId}/leadgen_forms`,
          leadFormPayloadDebug,
        );
      }

      if (!createdLeadForm.id) {
        throw new Error("Meta lead form could not be created.");
      }
      resolvedLeadFormId = createdLeadForm.id;
      externalIds.lead_form_id = createdLeadForm.id;
      metaResponses.lead_form = createdLeadForm;
      console.info("[meta publish] lead form created", {
        campaignId,
        leadFormId: createdLeadForm.id,
        leadFormName: managedLeadFormName,
        mode,
      });

      await updateCampaignWithSchemaFallback(admin, campaignId, {
        external_ids_json: {
          ...existingExternalIds,
          lead_form_id: createdLeadForm.id,
          lead_form_name: managedLeadFormName,
          lead_form_fingerprint: leadFormFingerprint,
        },
        updated_at: now,
      });
    }
  }

  const campaignPayload: Record<string, string> = buildCampaignCreatePayload(summary);

  console.info("[meta publish] campaign create request", {
    endpoint: `act_${(context.resolvedAssets.adAccount?.id || "").replace(/^act_/, "")}/campaigns`,
    payload: campaignPayload,
  });

  let campaignResponse;
  try {
    campaignResponse = await createMetaCampaign({
      accessToken: context.accessToken,
      adAccountId: context.resolvedAssets.adAccount?.id || "",
      payload: campaignPayload,
    });
  } catch (error) {
    throw annotateMetaPublishError(
      error,
      "campaign_create",
      `act_${(context.resolvedAssets.adAccount?.id || "").replace(/^act_/, "")}/campaigns`,
      campaignPayload,
    );
  }
  if (!campaignResponse.id) {
    throw new Error("Meta campaign creation failed.");
  }
  externalIds.campaign_id = campaignResponse.id;
  metaResponses.campaign = campaignResponse;

  const adSetPayload: Record<string, string> = buildAdSetCreatePayload({
    summary,
    campaignId: campaignResponse.id,
    status: statusSeed,
  });

  console.info("[meta publish] ad set create request", {
    endpoint: `act_${(context.resolvedAssets.adAccount?.id || "").replace(/^act_/, "")}/adsets`,
    payload: adSetPayload,
  });

  let adSetResponse;
  try {
    adSetResponse = await createMetaAdSet({
      accessToken: context.accessToken,
      adAccountId: context.resolvedAssets.adAccount?.id || "",
      payload: adSetPayload,
    });
  } catch (error) {
    throw annotateMetaPublishError(
      error,
      "adset_create",
      `act_${(context.resolvedAssets.adAccount?.id || "").replace(/^act_/, "")}/adsets`,
      adSetPayload,
    );
  }
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
                  link: `tel:${resolveCallPhoneNumber(context)}`,
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

  console.info("[meta publish] creative create request", {
    endpoint: `act_${(context.resolvedAssets.adAccount?.id || "").replace(/^act_/, "")}/adcreatives`,
    payload: creativePayload,
  });

  let creativeResponse;
  try {
    creativeResponse = await createMetaAdCreative({
      accessToken: context.accessToken,
      adAccountId: context.resolvedAssets.adAccount?.id || "",
      payload: creativePayload,
    });
  } catch (error) {
    throw annotateMetaPublishError(
      error,
      "creative_create",
      `act_${(context.resolvedAssets.adAccount?.id || "").replace(/^act_/, "")}/adcreatives`,
      creativePayload,
    );
  }
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

  console.info("[meta publish] ad create request", {
    endpoint: `act_${(context.resolvedAssets.adAccount?.id || "").replace(/^act_/, "")}/ads`,
    payload: adPayload,
  });

  let adResponse;
  try {
    adResponse = await createMetaAd({
      accessToken: context.accessToken,
      adAccountId: context.resolvedAssets.adAccount?.id || "",
      payload: adPayload,
    });
  } catch (error) {
    throw annotateMetaPublishError(
      error,
      "ad_create",
      `act_${(context.resolvedAssets.adAccount?.id || "").replace(/^act_/, "")}/ads`,
      adPayload,
    );
  }
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

  const persistedMetaIds = buildPersistedCampaignMetaIds(externalIds);
  const mergedExternalIds = {
    ...(context.campaign.external_ids_json && typeof context.campaign.external_ids_json === "object"
      ? (context.campaign.external_ids_json as Record<string, unknown>)
      : {}),
    ...externalIds,
  };
  try {
    await updateCampaignWithSchemaFallback(admin, campaignId, {
      status: mode === "live" ? "published" : "draft",
      external_publish_status: finalStatus,
      external_ids_json: mergedExternalIds,
      ...persistedMetaIds,
      updated_at: now,
    });
  } catch (error) {
    const campaignPersistError = error instanceof Error ? error : new Error(String(error));
    console.error("[meta publish] failed to persist campaign meta ids", {
      campaignId,
      error: campaignPersistError.message,
      externalIds,
      mergedExternalIds,
      persistedMetaIds,
    });
    throw new Error(`Campaign publish metadata could not be saved: ${campaignPersistError.message}`);
  }

  console.info("[meta publish] persisted campaign meta ids", {
    campaignId,
    externalIds,
    mergedExternalIds,
    persistedMetaIds,
    publishStatus: finalStatus,
  });

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
