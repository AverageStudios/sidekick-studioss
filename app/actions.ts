"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, getCurrentRole, getCurrentUser } from "@/lib/auth";
import { authSuccessMessages, formatAuthErrorMessage } from "@/lib/auth-messages";
import { createCampaignBlueprint } from "@/lib/template-engine";
import { env, isDemoModeEnabled, isSupabasePublicConfigured, isSupabaseServerConfigured } from "@/lib/env";
import { getPublishedTemplateBySlug } from "@/lib/template-repository";
import { slugify } from "@/lib/utils";
import { sendLeadConfirmationEmail, sendWorkspaceInvitationEmail } from "@/services/follow-up";
import { deleteStoragePaths, deleteStoragePrefix, getStoragePathFromPublicUrl, uploadAsset } from "@/services/storage";
import { storageBucketName } from "@/services/storage";
import { checkRateLimit, getIpFromHeaders, logRateLimitHit } from "@/lib/rate-limit";
import {
  createWorkspaceForUser,
  ensureWorkspaceContextForUser,
  updateWorkspaceIdentityRecord,
  upsertWorkspaceBusinessProfile,
  userHasWorkspaceAccess,
} from "@/lib/workspaces";
import { isMetaConfigured, updateMetaObjectStatus } from "@/lib/meta";
import {
  formatTemplateCtaLabel,
  normalizeIndustryLabel,
  normalizeTemplateCtaType,
} from "@/data/template-taxonomy";
import { CampaignRecord, LeadRecord, SupportTicketStatus } from "@/types";
import { getCanonicalLeadStatus } from "@/lib/leads";
import {
  disconnectWorkspaceMetaConnection,
  saveWorkspaceMetaSelections,
  syncWorkspaceMetaAssets,
  getWorkspaceMetaAccessToken,
} from "@/lib/meta-integration";
import { ensureWorkspaceMetaLeadAutomation, syncWorkspaceMetaLeads } from "@/lib/meta-leads";
import {
  archiveCampaignWithMetaSync,
  deleteCampaignWithMetaCleanup,
  getCampaignLifecycleState,
  repairCampaignMetaIdentifiers,
  syncCampaignStatusFromMeta,
} from "@/lib/campaign-management";
import {
  AdminTemplateActionState,
  AdminTemplateFieldName,
  emptyAdminTemplateActionState,
  getEmptyAdminTemplateFormData,
  getEmptyLeadFormSettings,
} from "@/lib/admin-template-form";
import {
  connectWorkspaceCrmProvider,
  disconnectWorkspaceCrmProvider,
  processLeadCrmDelivery,
  queueLeadForCrmDelivery,
  retryFailedCrmDeliveriesForWorkspace,
  saveWorkspaceCrmRoutingRule,
} from "@/lib/crm-integration";
import {
  appendSupportTicketMessage,
  createSupportTicketWithMessage,
  isMissingSupportTableError,
  supportCategories,
  supportPriorities,
  supportStatuses,
} from "@/lib/support";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const RATE_LIMITED_ACTION_MESSAGE = "Too many attempts right now. Please wait a moment and try again.";

const uuidSchema = z.string().uuid();
const publicLeadSubmissionSchema = z.object({
  funnelSlug: z.string().trim().min(1).max(160),
  campaignId: z.string().uuid().optional().or(z.literal("")),
  funnelId: z.string().uuid().optional().or(z.literal("")),
  email: z.string().trim().email().max(254),
  name: z.string().trim().min(1).max(120),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(40)
    .regex(/^[+()\d\s.-]+$/, "Enter a valid phone number."),
  serviceInterest: z.string().trim().min(1).max(160),
  message: z.string().trim().max(1000).optional().default(""),
});

function isMissingTableError(message: string | null | undefined, tableName: string) {
  const value = message || "";
  return (
    value.includes(`Could not find the table 'public.${tableName}' in the schema cache`) ||
    value.includes(`relation "public.${tableName}" does not exist`) ||
    value.includes(`relation "${tableName}" does not exist`)
  );
}

function isMissingColumnError(
  error: { message?: string | null } | null | undefined,
  tableName: string,
  columnName: string,
) {
  const value = error?.message || "";
  return (
    value.includes(`column ${tableName}.${columnName} does not exist`) ||
    value.includes(`Could not find the '${columnName}' column of '${tableName}' in the schema cache`) ||
    (value.includes(tableName) && value.includes(columnName) && value.includes("schema cache"))
  );
}

function logActionError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error instanceof Error ? error.message : "Unexpected action error");
}

async function enforceActionRateLimit({
  key,
  limit,
  windowMs,
  redirectTo,
  userId,
  email,
}: {
  key: string;
  limit: number;
  windowMs: number;
  redirectTo: string;
  userId?: string | null;
  email?: string | null;
}) {
  const headerStore = await headers();
  const ip = getIpFromHeaders(headerStore);
  const result = checkRateLimit({
    key,
    limit,
    windowMs,
    identifiers: {
      ip,
      userId,
      email,
    },
  });

  if (!result.allowed) {
    logRateLimitHit({
      key,
      retryAfterSeconds: result.retryAfterSeconds,
      matchedOn: result.matchedOn,
      ip,
      userId,
    });
    redirect(appendQueryParam(redirectTo, "error", RATE_LIMITED_ACTION_MESSAGE));
  }
}

async function runWorkspaceCleanup(
  label: string,
  operation: PromiseLike<{ error: { message?: string | null } | null }>,
  options?: { optionalTable?: string },
) {
  const result = await operation;
  if (result.error) {
    if (options?.optionalTable && isMissingTableError(result.error.message, options.optionalTable)) {
      return;
    }
    throw new Error(`Could not delete workspace ${label}: ${result.error.message || "Unknown database error"}`);
  }
}

function collectStoragePathsFromUrls(urls: Array<string | null | undefined>) {
  return urls
    .map((url) => getStoragePathFromPublicUrl(url))
    .filter((path): path is string => Boolean(path));
}

function collectCampaignStorageUrls(
  campaigns: Array<{
    before_images_json?: unknown;
    after_images_json?: unknown;
  }> | null | undefined,
) {
  const urls: string[] = [];

  for (const campaign of campaigns || []) {
    const beforeImages = Array.isArray(campaign.before_images_json) ? campaign.before_images_json : [];
    const afterImages = Array.isArray(campaign.after_images_json) ? campaign.after_images_json : [];

    for (const imageUrl of [...beforeImages, ...afterImages]) {
      if (typeof imageUrl === "string" && imageUrl.trim()) {
        urls.push(imageUrl.trim());
      }
    }
  }

  return urls;
}

async function loadWorkspaceStorageCleanupTargets(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  workspaceId: string,
) {
  const [campaignsResult, businessProfileResult] = await Promise.all([
    admin.from("campaigns").select("before_images_json, after_images_json").eq("workspace_id", workspaceId),
    admin.from("business_profiles").select("logo_url").eq("workspace_id", workspaceId),
  ]);

  if (campaignsResult.error) {
    throw new Error(`Could not inspect workspace campaigns before deletion: ${campaignsResult.error.message}`);
  }

  if (businessProfileResult.error) {
    throw new Error(`Could not inspect workspace branding before deletion: ${businessProfileResult.error.message}`);
  }

  return {
    paths: collectStoragePathsFromUrls([
      ...(businessProfileResult.data || []).map((profile) => profile.logo_url),
      ...collectCampaignStorageUrls(campaignsResult.data),
    ]),
    prefixes: [`logos/workspaces/${workspaceId}`],
  };
}

async function cleanupWorkspaceStorageAssets(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  workspaceId: string,
) {
  const targets = await loadWorkspaceStorageCleanupTargets(admin, workspaceId);

  if (targets.paths.length) {
    await deleteStoragePaths(targets.paths);
  }

  for (const prefix of targets.prefixes) {
    await deleteStoragePrefix(prefix);
  }
}

async function verifyNoRemainingRowsByColumn(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  records: Array<{ table: string; column: string; value: string; optional?: boolean }>,
) {
  for (const record of records) {
    const result = await admin.from(record.table).select("id", { head: true, count: "exact" }).eq(record.column, record.value);

    if (result.error) {
      if (record.optional && isMissingTableError(result.error.message, record.table)) {
        continue;
      }

      throw new Error(`Could not verify ${record.table} cleanup: ${result.error.message}`);
    }

    if ((result.count || 0) > 0) {
      throw new Error(`Supabase still has ${record.table} rows linked to this deletion.`);
    }
  }
}

function appendSafeActionError(redirectTo: string, message: string) {
  const safeRedirectTo = redirectTo.startsWith("/") ? redirectTo : "/dashboard";
  return appendQueryParam(safeRedirectTo, "error", message);
}

async function requireAuthenticatedActionUser(redirectTo = "/login") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

async function requireSupabaseAdminForAction(redirectTo: string) {
  if (!isSupabaseServerConfigured()) {
    redirect(appendSafeActionError(redirectTo, "Server database access is not configured."));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(appendSafeActionError(redirectTo, "Server database access is not configured."));
  }

  return admin;
}

async function userCanAccessWorkspaceResource({
  userId,
  ownerUserId,
  workspaceId,
}: {
  userId: string;
  ownerUserId?: string | null;
  workspaceId?: string | null;
}) {
  if (ownerUserId && ownerUserId === userId) return true;
  if (!workspaceId) return false;
  return userHasWorkspaceAccess(userId, workspaceId);
}

async function requireLeadMutationAccess({
  admin,
  leadId,
  userId,
}: {
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
  leadId: string;
  userId: string;
}) {
  const { data, error } = await admin
    .from("leads")
    .select("id, user_id, workspace_id")
    .eq("id", leadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const lead = data as Pick<LeadRecord, "id" | "user_id" | "workspace_id"> | null;
  if (!lead) {
    return { ok: false as const, status: 404 as const, message: "Lead not found." };
  }

  const allowed = await userCanAccessWorkspaceResource({
    userId,
    ownerUserId: lead.user_id,
    workspaceId: lead.workspace_id,
  });

  if (!allowed) {
    return { ok: false as const, status: 403 as const, message: "You do not have access to this lead." };
  }

  return { ok: true as const, lead };
}

async function deleteWorkspaceAndDependencies(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  workspaceId: string,
) {
  await cleanupWorkspaceStorageAssets(admin, workspaceId);

  await runWorkspaceCleanup(
    "publish jobs",
    admin.from("campaign_publish_jobs").delete().eq("workspace_id", workspaceId),
    { optionalTable: "campaign_publish_jobs" },
  );
  await runWorkspaceCleanup(
    "launch snapshots",
    admin.from("campaign_launch_snapshots").delete().eq("workspace_id", workspaceId),
    { optionalTable: "campaign_launch_snapshots" },
  );
  await runWorkspaceCleanup(
    "provider assets",
    admin.from("workspace_provider_assets").delete().eq("workspace_id", workspaceId),
    { optionalTable: "workspace_provider_assets" },
  );
  await runWorkspaceCleanup(
    "provider connections",
    admin.from("workspace_provider_connections").delete().eq("workspace_id", workspaceId),
    { optionalTable: "workspace_provider_connections" },
  );
  await runWorkspaceCleanup(
    "legacy Meta connections",
    admin.from("workspace_meta_connections").delete().eq("workspace_id", workspaceId),
    { optionalTable: "workspace_meta_connections" },
  );
  await runWorkspaceCleanup(
    "workspace invitations",
    admin.from("workspace_invitations").delete().eq("workspace_id", workspaceId),
    { optionalTable: "workspace_invitations" },
  );
  await runWorkspaceCleanup(
    "follow-up settings",
    admin.from("follow_up_settings").delete().eq("workspace_id", workspaceId),
  );
  await runWorkspaceCleanup("funnels", admin.from("funnels").delete().eq("workspace_id", workspaceId));
  await runWorkspaceCleanup("leads", admin.from("leads").delete().eq("workspace_id", workspaceId));
  await runWorkspaceCleanup("campaigns", admin.from("campaigns").delete().eq("workspace_id", workspaceId));
  await runWorkspaceCleanup("business profile", admin.from("business_profiles").delete().eq("workspace_id", workspaceId));
  await runWorkspaceCleanup(
    "active workspace references",
    admin.from("profiles").update({ active_workspace_id: null }).eq("active_workspace_id", workspaceId),
  );
  await runWorkspaceCleanup(
    "workspace memberships",
    admin.from("workspace_memberships").delete().eq("workspace_id", workspaceId),
  );

  const { error: deleteError } = await admin.from("workspaces").delete().eq("id", workspaceId);
  if (deleteError) {
    throw new Error(`Could not delete workspace: ${deleteError.message}`);
  }

  await verifyNoRemainingRowsByColumn(admin, [
    { table: "workspaces", column: "id", value: workspaceId },
    { table: "workspace_memberships", column: "workspace_id", value: workspaceId },
    { table: "business_profiles", column: "workspace_id", value: workspaceId },
    { table: "campaigns", column: "workspace_id", value: workspaceId },
    { table: "funnels", column: "workspace_id", value: workspaceId },
    { table: "leads", column: "workspace_id", value: workspaceId },
    { table: "follow_up_settings", column: "workspace_id", value: workspaceId },
    { table: "workspace_invitations", column: "workspace_id", value: workspaceId, optional: true },
    { table: "workspace_meta_connections", column: "workspace_id", value: workspaceId, optional: true },
    { table: "workspace_provider_connections", column: "workspace_id", value: workspaceId, optional: true },
    { table: "workspace_provider_assets", column: "workspace_id", value: workspaceId, optional: true },
    { table: "campaign_publish_jobs", column: "workspace_id", value: workspaceId, optional: true },
    { table: "campaign_launch_snapshots", column: "workspace_id", value: workspaceId, optional: true },
    { table: "crm_routing_rules", column: "workspace_id", value: workspaceId, optional: true },
    { table: "lead_deliveries", column: "workspace_id", value: workspaceId, optional: true },
    { table: "support_tickets", column: "workspace_id", value: workspaceId, optional: true },
    { table: "support_ticket_messages", column: "workspace_id", value: workspaceId, optional: true },
  ]);
}

const signUpSchema = authSchema.extend({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
});

const profileAvatarMaxBytes = 5 * 1024 * 1024;
const allowedProfileAvatarTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const allowedWorkspaceLogoTypes = allowedProfileAvatarTypes;

function createImageFileFromDataUrl(dataUrl: string, fileBaseName: string, errorLabel: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error(`Use a JPG, PNG, WEBP, or GIF image for your ${errorLabel}.`);
  }

  const [, mimeType, encoded] = match;
  if (!allowedProfileAvatarTypes.has(mimeType)) {
    throw new Error(`Use a JPG, PNG, WEBP, or GIF image for your ${errorLabel}.`);
  }

  const buffer = Buffer.from(encoded, "base64");
  if (!buffer.byteLength) {
    throw new Error(`${errorLabel.charAt(0).toUpperCase() + errorLabel.slice(1)} crop could not be processed.`);
  }

  if (buffer.byteLength > profileAvatarMaxBytes) {
    throw new Error(`${errorLabel.charAt(0).toUpperCase() + errorLabel.slice(1)} must be 5 MB or smaller.`);
  }

  const extension =
    mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : mimeType === "image/gif" ? "gif" : "jpg";

  return new File([buffer], `${fileBaseName}.${extension}`, { type: mimeType });
}

function createAvatarFileFromDataUrl(dataUrl: string) {
  return createImageFileFromDataUrl(dataUrl, "profile-avatar", "profile picture");
}

function createWorkspaceLogoFileFromDataUrl(dataUrl: string) {
  return createImageFileFromDataUrl(dataUrl, "workspace-logo", "workspace logo");
}

const optionalText = z.string().trim().optional().default("");
const supportTicketSchema = z.object({
  subject: z.string().trim().min(3, "Add a short subject.").max(140, "Subject must be 140 characters or fewer."),
  category: z.enum(supportCategories),
  priority: z.enum(supportPriorities),
  message: z.string().trim().min(10, "Tell us a little more so support can help.").max(5000, "Message must be 5,000 characters or fewer."),
  currentRoute: z.string().trim().max(300).optional().default("/support"),
});
const supportReplySchema = z.object({
  ticketId: z.string().uuid("Ticket is missing."),
  message: z.string().trim().min(2, "Add a reply before sending.").max(5000, "Reply must be 5,000 characters or fewer."),
});
const supportStatusSchema = z.object({
  ticketId: z.string().uuid("Ticket is missing."),
  status: z.enum(supportStatuses),
  redirectTo: z.string().trim().optional().default("/admin/support"),
});
const headlineText = z
  .string()
  .trim()
  .max(25, "Headline must be 25 characters or fewer.")
  .optional()
  .default("");
const optionalUrl = z.union([z.literal(""), z.string().url("Enter a valid preview image URL.")]).transform((value) => value || "");

const templateAdminSchema = z.object({
  name: z.string().min(2, "Template name is required."),
  slug: optionalText,
  industryId: optionalText,
  categoryId: optionalText,
  category: optionalText,
  industry: optionalText,
  description: z.string().min(8, "Short description is required."),
  previewImageUrl: optionalUrl,
  mediaImageUrls: z.array(z.string().url()).default([]),
  mediaVideoUrls: z.array(z.string().url()).default([]),
  status: z.enum(["draft", "published", "archived"]),
  isFeatured: z.boolean(),
  positioning: optionalText,
  campaignType: optionalText,
  audienceType: optionalText,
  offerFramework: optionalText,
  displayLink: optionalText,
  adFormat: optionalText,
  mediaType: optionalText,
  adSetStructure: optionalText,
  advantagePlusSettings: optionalText,
  placements: optionalText,
  dynamicCreative: optionalText,
  conversionEvent: optionalText,
  specialAdCategory: optionalText,
  kpiCtrAll: optionalText,
  kpiCtrLink: optionalText,
  kpiCr: optionalText,
  kpiCpa: optionalText,
  utmParameters: optionalText,
  offerType: optionalText,
  supportedAdTypes: z.array(z.enum(["lead_form", "landing_page", "call_now", "messenger_leads", "messenger_engagement"])).default(["lead_form"]),
  defaultAdType: z.enum(["lead_form", "landing_page", "call_now", "messenger_leads", "messenger_engagement"]).default("lead_form"),
  promoDetails: optionalText,
  headline: headlineText,
  subheadline: optionalText,
  ctaDefault: optionalText,
  offerLabel: optionalText,
  benefits: z.array(z.string()).default([]),
  offerStructure: z.array(z.string()).default([]),
  faq: z.array(z.object({ question: z.string().min(2), answer: z.string().min(2) })).default([]),
  campaignObjective: optionalText,
  adPrimary: optionalText,
  adHeadlines: z.array(z.string()).default([]),
  adDescriptions: z.array(z.string()).default([]),
  targeting: optionalText,
  budget: optionalText,
  creativeGuidance: z.array(z.string()).default([]),
  landingIntro: optionalText,
  formCta: optionalText,
  formFields: z.array(z.string()).default([]),
  nextStepFlow: z.array(z.string()).default([]),
  landingPageUrl: optionalText,
  phoneNumber: optionalText,
  messengerWelcomeMessage: optionalText,
  messengerReplyPrompt: optionalText,
  thankYouEnabled: z.boolean().default(true),
  thankYouHeadline: optionalText,
  thankYouDescription: optionalText,
  thankYouButtonText: optionalText,
  thankYouWebsiteUrl: optionalText,
  leadFormSettingsJson: optionalText,
  followUpSubject: optionalText,
  followUpBody: optionalText,
  followUpSms: optionalText,
  reminderMessage: optionalText,
});

function splitLines(value: FormDataEntryValue | null) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitFaq(value: FormDataEntryValue | null) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, ...answerParts] = line.split("|");
      return {
        question: question?.trim() || "",
        answer: answerParts.join("|").trim(),
      };
    })
    .filter((item) => item.question && item.answer);
}

function buildTemplateAdminValues(formData: FormData) {
  const supportedAdTypes = formData.getAll("supportedAdTypes").map(String);
  const mediaImageUrls = formData.getAll("mediaImageUrls").map(String).filter(Boolean);
  const mediaVideoUrls = formData.getAll("mediaVideoUrls").map(String).filter(Boolean);
  const name = String(formData.get("name") || "");
  const category = String(formData.get("category") || formData.get("industry") || "");
  const industry = String(formData.get("industry") || formData.get("category") || "");
  return templateAdminSchema.safeParse({
    name,
    slug: slugify(String(formData.get("slug") || name || "")),
    industryId: String(formData.get("industryId") || ""),
    categoryId: String(formData.get("categoryId") || ""),
    category,
    industry,
    description: String(formData.get("description") || ""),
    previewImageUrl: String(formData.get("previewImageUrl") || "").trim(),
    mediaImageUrls,
    mediaVideoUrls,
    status: String(formData.get("status") || "draft"),
    isFeatured: formData.get("isFeatured") === "on",
    positioning: String(formData.get("positioning") || ""),
    campaignType: String(formData.get("campaignType") || ""),
    audienceType: String(formData.get("audienceType") || ""),
    offerFramework: String(formData.get("offerFramework") || ""),
    displayLink: String(formData.get("displayLink") || ""),
    adFormat: String(formData.get("adFormat") || ""),
    mediaType: String(formData.get("mediaType") || ""),
    adSetStructure: String(formData.get("adSetStructure") || ""),
    advantagePlusSettings: String(formData.get("advantagePlusSettings") || ""),
    placements: String(formData.get("placements") || ""),
    dynamicCreative: String(formData.get("dynamicCreative") || ""),
    conversionEvent: String(formData.get("conversionEvent") || ""),
    specialAdCategory: String(formData.get("specialAdCategory") || ""),
    kpiCtrAll: String(formData.get("kpiCtrAll") || ""),
    kpiCtrLink: String(formData.get("kpiCtrLink") || ""),
    kpiCr: String(formData.get("kpiCr") || ""),
    kpiCpa: String(formData.get("kpiCpa") || ""),
    utmParameters: String(formData.get("utmParameters") || ""),
    offerType: String(formData.get("offerType") || ""),
    supportedAdTypes:
      supportedAdTypes.length > 0
        ? supportedAdTypes
        : ["lead_form"],
    defaultAdType: String(formData.get("defaultAdType") || "lead_form"),
    promoDetails: String(formData.get("promoDetails") || ""),
    headline: String(formData.get("headline") || name).trim().slice(0, 25),
    subheadline: String(formData.get("subheadline") || ""),
    ctaDefault: String(formData.get("ctaDefault") || "Get Started"),
    offerLabel: String(formData.get("offerLabel") || ""),
    benefits: splitLines(formData.get("benefits")),
    offerStructure: splitLines(formData.get("offerStructure")),
    faq: splitFaq(formData.get("faq")),
    campaignObjective: String(formData.get("campaignObjective") || ""),
    adPrimary: String(formData.get("adPrimary") || ""),
    adHeadlines: splitLines(formData.get("adHeadlines")),
    adDescriptions: splitLines(formData.get("adDescriptions")),
    targeting: String(formData.get("targeting") || ""),
    budget: String(formData.get("budget") || ""),
    creativeGuidance: splitLines(formData.get("creativeGuidance")),
    landingIntro: String(formData.get("landingIntro") || ""),
    formCta: String(formData.get("formCta") || ""),
    formFields: splitLines(formData.get("formFields")),
    nextStepFlow: splitLines(formData.get("nextStepFlow")),
    landingPageUrl: String(formData.get("landingPageUrl") || ""),
    phoneNumber: String(formData.get("phoneNumber") || ""),
    messengerWelcomeMessage: String(formData.get("messengerWelcomeMessage") || ""),
    messengerReplyPrompt: String(formData.get("messengerReplyPrompt") || ""),
    thankYouEnabled: formData.get("thankYouEnabled") === "on",
    thankYouHeadline: String(formData.get("thankYouHeadline") || ""),
    thankYouDescription: String(formData.get("thankYouDescription") || ""),
    thankYouButtonText: String(formData.get("thankYouButtonText") || ""),
    thankYouWebsiteUrl: String(formData.get("thankYouWebsiteUrl") || ""),
    leadFormSettingsJson: String(formData.get("leadFormSettingsJson") || JSON.stringify(getEmptyLeadFormSettings())),
    followUpSubject: String(formData.get("followUpSubject") || ""),
    followUpBody: String(formData.get("followUpBody") || ""),
    followUpSms: String(formData.get("followUpSms") || ""),
    reminderMessage: String(formData.get("reminderMessage") || ""),
  });
}

function getTemplateFieldErrors(error: z.ZodError): Partial<Record<AdminTemplateFieldName, string>> {
  const fieldErrors: Partial<Record<AdminTemplateFieldName, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field as AdminTemplateFieldName] = issue.message;
    }
  }

  return fieldErrors;
}

function getTemplateDbErrorState(message: string): AdminTemplateActionState {
  const normalized = message.toLowerCase();

  if (normalized.includes("slug") && normalized.includes("duplicate")) {
    return {
      formError: null,
      fieldErrors: {
        slug: "This slug is already in use. Try a different one.",
      },
    };
  }

  if (normalized.includes("preview") || normalized.includes("storage") || normalized.includes("bucket")) {
    return {
      formError: `The preview image could not be uploaded. Check Supabase storage bucket "${storageBucketName}" and try again.`,
      fieldErrors: {},
    };
  }

  return {
    formError: message,
    fieldErrors: {},
  };
}

async function resolveAdminTemplatePreviewImage(formData: FormData, fallbackUrl?: string) {
  const removePreviewImage = String(formData.get("removePreviewImage") || "") === "1";
  const previewImageFile = formData.get("previewImage");

  if (removePreviewImage) {
    return "";
  }

  if (previewImageFile instanceof File && previewImageFile.size > 0) {
    return (await uploadAsset(previewImageFile, "templates/previews")) || "";
  }

  return fallbackUrl || "";
}

function buildAdminTemplateConfig(values: z.infer<typeof templateAdminSchema>) {
  const resolvedOfferLabel = values.offerLabel || values.offerType || "Limited-time offer";
  const normalizedIndustry = normalizeIndustryLabel(values.industry);
  const supportedAdTypes = values.supportedAdTypes.length ? values.supportedAdTypes : ["lead_form"];
  const resolvedCtaType = normalizeTemplateCtaType(values.ctaDefault) || "LEARN_MORE";
  const resolvedCtaLabel = formatTemplateCtaLabel(values.ctaDefault, "Learn more");
  let leadFormSettings = getEmptyLeadFormSettings();

  try {
    const parsed = JSON.parse(values.leadFormSettingsJson || "{}");
    leadFormSettings = {
      ...leadFormSettings,
      ...parsed,
      multipleChoiceQuestions: Array.isArray(parsed?.multipleChoiceQuestions)
        ? parsed.multipleChoiceQuestions
        : leadFormSettings.multipleChoiceQuestions,
      shortQuestions: Array.isArray(parsed?.shortQuestions)
        ? parsed.shortQuestions
        : leadFormSettings.shortQuestions,
      standardQuestions: Array.isArray(parsed?.standardQuestions)
        ? parsed.standardQuestions
        : leadFormSettings.standardQuestions,
    };
  } catch {
    leadFormSettings = getEmptyLeadFormSettings();
  }

  return {
    industry: normalizedIndustry || values.industry,
    launchCategory: values.category,
    positioning: values.positioning,
    campaignType: values.campaignType,
    audienceType: values.audienceType,
    offerFramework: values.offerFramework,
    displayLink: values.displayLink,
    adFormat: values.adFormat,
    mediaType: values.mediaType,
    campaignSettings: {
      adSetStructure: values.adSetStructure,
      advantagePlusSettings: values.advantagePlusSettings,
      placements: values.placements,
      dynamicCreative: values.dynamicCreative,
      conversionEvent: values.conversionEvent,
    },
    additionalSettings: {
      specialAdCategory: values.specialAdCategory,
      kpiThresholds: {
        ctrAll: values.kpiCtrAll,
        ctrLink: values.kpiCtrLink,
        cr: values.kpiCr,
        cpa: values.kpiCpa,
      },
      utmParameters: values.utmParameters,
    },
    offerType: values.offerType,
    supportedAdTypes,
    defaultAdType: supportedAdTypes.includes(values.defaultAdType) ? values.defaultAdType : supportedAdTypes[0] || "lead_form",
    promoDetails: values.promoDetails,
    ctaType: resolvedCtaType,
    ctaLabel: resolvedCtaLabel,
    ctaDefault: resolvedCtaLabel,
    cta: resolvedCtaType,
    root_cta: resolvedCtaType,
    creative_cta: resolvedCtaType,
    recommended_cta: resolvedCtaType,
    ctaPolicy: {
      displayLabel: resolvedCtaLabel,
    },
    template: {
      slug: values.slug,
      category: values.category,
      categoryLabel: values.category,
      internalName: values.name,
    },
    offerStructure: values.offerStructure,
    benefits: values.benefits,
    faq: values.faq,
    adCopy: {
      objective: values.campaignObjective,
      primary: values.adPrimary || values.description || values.headline,
      headlines: values.adHeadlines,
      descriptions: values.adDescriptions,
      targeting: values.targeting,
      budget: values.budget,
      creativeGuidance: values.creativeGuidance,
    },
    funnel: {
      heroHeadline: values.headline || values.name,
      heroSubheadline: values.subheadline,
      offerLabel: resolvedOfferLabel,
      whyChooseUs: values.benefits,
      finalCta: resolvedCtaLabel || "Get Started",
      pageIntro: values.landingIntro,
      formCta: values.formCta || resolvedCtaLabel || "Request details",
      formFields: values.formFields,
      nextStepFlow: values.nextStepFlow,
    },
    creativeAssets: {
      imageUrls: values.mediaImageUrls,
      videoUrls: values.mediaVideoUrls,
    },
    creative: {
      cta: resolvedCtaType,
    },
    leadFlowDefaults: {
      pageIntro: values.landingIntro,
      formCta: values.formCta || resolvedCtaLabel || "Request details",
      formFields: values.formFields,
      nextStepFlow: values.nextStepFlow,
    },
    leadFormSettings,
    adTypeConfig: {
      lead_form: {
        thankYouEnabled: values.thankYouEnabled,
        thankYouHeadline: values.thankYouHeadline,
        thankYouDescription: values.thankYouDescription,
        thankYouButtonLabel: values.thankYouButtonText,
        thankYouWebsiteUrl: values.thankYouWebsiteUrl,
      },
      landing_page: {
        landingPageUrl: values.landingPageUrl,
      },
      call_now: {
        phoneNumber: values.phoneNumber,
      },
      messenger_leads: {
        messengerWelcomeMessage: values.messengerWelcomeMessage,
        messengerReplyPrompt: values.messengerReplyPrompt,
      },
      messenger_engagement: {
        messengerWelcomeMessage: values.messengerWelcomeMessage,
        messengerReplyPrompt: values.messengerReplyPrompt,
      },
    },
    followUpDefaults: {
      subject: values.followUpSubject || "Thanks for reaching out",
      body: values.followUpBody || "We got your request and will follow up shortly.",
      sms: values.followUpSms,
      reminder: values.reminderMessage,
    },
  };
}

async function requireAdminActionUser() {
  const user = await getCurrentUser();
  const role = await getCurrentRole();

  if (!user || role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

type AdminSupabaseClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

function createAdminLibraryRedirect({
  industryId,
  categoryId,
  templateId,
  success,
  error,
}: {
  industryId?: string | null;
  categoryId?: string | null;
  templateId?: string | null;
  success?: string | null;
  error?: string | null;
}) {
  const params = new URLSearchParams();
  if (industryId) params.set("industryId", industryId);
  if (categoryId) params.set("categoryId", categoryId);
  if (templateId) params.set("templateId", templateId);
  if (success) params.set("success", success);
  if (error) params.set("error", error);
  const query = params.toString();
  return query ? `/admin/templates?${query}` : "/admin/templates";
}

function revalidateTemplateLibraryPaths(templateId?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/templates");
  if (templateId) {
    revalidatePath(`/admin/templates/${templateId}/edit`);
  }
  revalidatePath("/templates");
  revalidatePath("/templates/new");
  revalidatePath("/product/templates");
}

async function resolveTemplatePlacement(
  admin: AdminSupabaseClient,
  {
    industryId,
    categoryId,
    fallbackIndustry,
    fallbackCategory,
  }: {
    industryId?: string | null;
    categoryId?: string | null;
    fallbackIndustry?: string | null;
    fallbackCategory?: string | null;
  },
) {
  let resolvedIndustryId = industryId?.trim() || null;
  let resolvedCategoryId = categoryId?.trim() || null;
  let resolvedIndustryName = fallbackIndustry?.trim() || "";
  let resolvedCategoryName = fallbackCategory?.trim() || "";

  if (resolvedCategoryId) {
    const { data: category, error } = await admin
      .from("template_categories")
      .select("id, name, industry_id")
      .eq("id", resolvedCategoryId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (category) {
      resolvedCategoryId = category.id;
      resolvedCategoryName = category.name;
      resolvedIndustryId = category.industry_id;
    }
  }

  if (resolvedIndustryId) {
    const { data: industry, error } = await admin
      .from("template_industries")
      .select("id, name")
      .eq("id", resolvedIndustryId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (industry) {
      resolvedIndustryId = industry.id;
      resolvedIndustryName = industry.name;
    }
  }

  return {
    industryId: resolvedIndustryId,
    categoryId: resolvedCategoryId,
    industryName: resolvedIndustryName,
    categoryName: resolvedCategoryName,
  };
}

async function buildUniqueTemplateLibrarySlug(
  admin: AdminSupabaseClient,
  table: "template_industries" | "template_categories" | "templates",
  baseValue: string,
  {
    industryId,
    ignoreId,
  }: {
    industryId?: string | null;
    ignoreId?: string | null;
  } = {},
) {
  const baseSlug = slugify(baseValue) || `item-${Date.now()}`;
  let attempt = 0;

  while (attempt < 50) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    let query = admin.from(table).select("id").eq("slug", slug).limit(1);
    if (table === "template_categories" && industryId) {
      query = query.eq("industry_id", industryId);
    }
    if (ignoreId) {
      query = query.neq("id", ignoreId);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    if (!data || data.length === 0) {
      return slug;
    }
    attempt += 1;
  }

  return `${baseSlug}-${Date.now().toString().slice(-6)}`;
}

export async function signUpAction(formData: FormData) {
  const values = signUpSchema.safeParse({
    firstName: String(formData.get("firstName") || ""),
    lastName: String(formData.get("lastName") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  });

  if (!values.success) {
    const message = values.error.issues[0]?.message || "Enter your name, email, and password.";
    redirect(`/signup?error=${encodeURIComponent(formatAuthErrorMessage(message))}`);
  }

  await enforceActionRateLimit({
    key: "auth:signup",
    limit: 3,
    windowMs: 60 * 60 * 1000,
    redirectTo: "/signup",
    email: values.data.email,
  });

  if (!isSupabasePublicConfigured()) {
    if (isDemoModeEnabled()) {
      redirect("/dashboard");
    }

    redirect(`/signup?error=${encodeURIComponent("Supabase auth is not configured yet.")}`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/signup?error=Supabase auth is not configured yet.");
  }
  const { data, error } = await supabase!.auth.signUp({
    email: values.data.email,
    password: values.data.password,
    options: {
      emailRedirectTo: `${env.appUrl}/auth/callback?next=/login`,
      data: {
        first_name: values.data.firstName,
        last_name: values.data.lastName,
        full_name: `${values.data.firstName} ${values.data.lastName}`.trim(),
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(formatAuthErrorMessage(error.message))}`);
  }

  if (data.user && isSupabaseServerConfigured()) {
    const admin = createSupabaseAdminClient();
    if (admin) {
      const { error: profileError } = await admin.from("profiles").upsert(
        {
          user_id: data.user.id,
          role: "user",
          first_name: values.data.firstName,
          last_name: values.data.lastName,
        },
        { onConflict: "user_id" },
      );

      if (profileError) {
        redirect(`/signup?error=${encodeURIComponent(formatAuthErrorMessage(profileError.message))}`);
      }
    }
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirect(`/signup/confirm?email=${encodeURIComponent(values.data.email)}`);
}

export async function resendConfirmationAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const source = String(formData.get("source") || "signup");
  const safeSource = source === "login" ? "login" : "signup";
  const redirectBase =
    safeSource === "login"
      ? `/login?email=${encodeURIComponent(email)}&needsConfirm=1`
      : `/signup/confirm?email=${encodeURIComponent(email)}`;

  const values = z.object({ email: z.string().email() }).safeParse({ email });

  if (!values.success) {
    redirect(`${redirectBase}&error=${encodeURIComponent("Enter a valid email address.")}`);
  }

  await enforceActionRateLimit({
    key: "auth:resend-confirmation",
    limit: 3,
    windowMs: 60 * 60 * 1000,
    redirectTo: redirectBase,
    email: values.data.email,
  });

  if (!isSupabasePublicConfigured()) {
    redirect(`${redirectBase}&error=${encodeURIComponent("Supabase auth is not configured yet.")}`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(`${redirectBase}&error=${encodeURIComponent("Supabase auth is not configured yet.")}`);
  }

  const { error } = await supabase!.auth.resend({
    type: "signup",
    email: values.data.email,
    options: {
      emailRedirectTo: `${env.appUrl}/auth/callback?next=/login`,
    },
  });

  if (error) {
    redirect(`${redirectBase}&error=${encodeURIComponent(formatAuthErrorMessage(error.message))}`);
  }

  redirect(`${redirectBase}&success=${encodeURIComponent(authSuccessMessages.confirmationResent)}`);
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const values = authSchema.safeParse({
    email,
    password: String(formData.get("password") || ""),
  });

  if (!values.success) {
    const message = values.error.issues[0]?.message || "Enter a valid email and password.";
    redirect(`/login?error=${encodeURIComponent(formatAuthErrorMessage(message))}`);
  }

  await enforceActionRateLimit({
    key: "auth:signin",
    limit: 5,
    windowMs: 60 * 1000,
    redirectTo: "/login",
    email: values.data.email,
  });

  if (!isSupabasePublicConfigured()) {
    if (isDemoModeEnabled()) {
      redirect("/dashboard");
    }

    redirect(`/login?error=${encodeURIComponent("Supabase auth is not configured yet.")}`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login?error=Supabase auth is not configured yet.");
  }
  const { error } = await supabase!.auth.signInWithPassword(values.data);

  if (error) {
    const friendlyMessage = formatAuthErrorMessage(error.message);
    if (friendlyMessage === "Please confirm your email before signing in.") {
      redirect(
        `/login?error=${encodeURIComponent(friendlyMessage)}&email=${encodeURIComponent(values.data.email)}&needsConfirm=1`,
      );
    }
    redirect(`/login?error=${encodeURIComponent(formatAuthErrorMessage(error.message))}`);
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  if (isSupabasePublicConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  redirect(`/login?success=${encodeURIComponent(authSuccessMessages.signedOut)}`);
}

export async function cancelSubscriptionAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect(
      `/settings?error=${encodeURIComponent(
        "Billing cancellation requests are not available right now. Please contact support.",
      )}#account-controls`,
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(
      `/settings?error=${encodeURIComponent(
        "Billing cancellation requests are not available right now. Please contact support.",
      )}#account-controls`,
    );
  }

  const workspaceContext = await ensureWorkspaceContextForUser(user);
  const workspaceId = workspaceContext?.activeWorkspace.id || "";
  const workspaceName = workspaceContext?.activeWorkspace.name || "Current workspace";
  const userName = workspaceContext?.userDisplayName || user.email || "SideKick user";
  const userEmail = user.email || workspaceContext?.userEmail || "";

  if (!workspaceId) {
    redirect(`/settings?error=${encodeURIComponent("Choose a workspace before canceling a subscription.")}#account-controls`);
  }

  try {
    await createSupportTicketWithMessage({
      admin,
      ticket: {
        workspace_id: workspaceId,
        workspace_name: workspaceName,
        user_id: user.id,
        user_name: userName,
        user_email: userEmail,
        subject: "Cancel subscription request",
        category: "billing",
        priority: "medium",
        message:
          "Please cancel my SideKick subscription or active trial. This request was submitted from account settings.",
        current_route: "/settings",
        context_json: {
          workspaceName,
          workspaceId,
          currentRoute: "/settings",
          submittedAt: new Date().toISOString(),
          requestType: "cancel_subscription",
        },
      },
      message: {
        ticket_id: "",
        workspace_id: workspaceId,
        author_user_id: user.id,
        author_name: userName,
        author_email: userEmail,
        author_role: "user",
        body: "Please cancel my SideKick subscription or active trial.",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Could not submit cancellation request.";
    const message = isMissingSupportTableError(errorMessage)
      ? "Billing cancellation requests are not enabled in this database yet. Please contact support directly."
      : errorMessage;
    redirect(`/settings?error=${encodeURIComponent(message)}#account-controls`);
  }

  revalidatePath("/settings");
  revalidatePath("/support");
  redirect(`/settings?saved=${encodeURIComponent("Cancellation request received. Our team will confirm it by email.")}#account-controls`);
}

export async function deleteAccountAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect(`/settings?error=${encodeURIComponent("Account deletion is not available right now.")}#account-controls`);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(`/settings?error=${encodeURIComponent("Account deletion is not available right now.")}#account-controls`);
  }

  const { data: ownedWorkspaces, error: ownedWorkspacesError } = await admin
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id);

  if (ownedWorkspacesError) {
    logActionError("delete account owned workspace lookup", ownedWorkspacesError);
    redirect(`/settings?error=${encodeURIComponent("Account deletion could not be completed.")}#account-controls`);
  }

  const [campaignAssetsResult, businessProfilesResult, profileAvatarResult] = await Promise.all([
    admin.from("campaigns").select("before_images_json, after_images_json").eq("user_id", user.id),
    admin.from("business_profiles").select("logo_url").eq("user_id", user.id),
    admin.from("profiles").select("avatar_url").eq("user_id", user.id).maybeSingle(),
  ]);

  if (campaignAssetsResult.error) {
    logActionError("delete account campaign asset lookup", campaignAssetsResult.error);
    redirect(`/settings?error=${encodeURIComponent("Account deletion could not be completed.")}#account-controls`);
  }

  if (businessProfilesResult.error) {
    logActionError("delete account business profile lookup", businessProfilesResult.error);
    redirect(`/settings?error=${encodeURIComponent("Account deletion could not be completed.")}#account-controls`);
  }

  if (profileAvatarResult.error && !isMissingColumnError(profileAvatarResult.error, "profiles", "avatar_url")) {
    logActionError("delete account profile avatar lookup", profileAvatarResult.error);
    redirect(`/settings?error=${encodeURIComponent("Account deletion could not be completed.")}#account-controls`);
  }

  for (const workspace of ownedWorkspaces || []) {
    await deleteWorkspaceAndDependencies(admin, workspace.id);
  }

  const optionalDelete = async (tableName: string, operation: PromiseLike<{ error: { message?: string | null } | null }>) => {
    const result = await operation;
    if (result.error && !isMissingTableError(result.error.message, tableName)) {
      throw new Error(result.error.message || `Could not delete ${tableName}.`);
    }
  };

  try {
    const avatarPaths = collectStoragePathsFromUrls([
      !profileAvatarResult.error ? profileAvatarResult.data?.avatar_url : null,
      typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
    ]);
    const userAssetPaths = collectStoragePathsFromUrls([
      ...(businessProfilesResult.data || []).map((profile) => profile.logo_url),
      ...collectCampaignStorageUrls(campaignAssetsResult.data),
    ]);

    if (avatarPaths.length || userAssetPaths.length) {
      await deleteStoragePaths([...avatarPaths, ...userAssetPaths]);
    }
    await deleteStoragePrefix(`profiles/${user.id}`);

    await optionalDelete("support_ticket_messages", admin.from("support_ticket_messages").delete().eq("author_user_id", user.id));
    await optionalDelete("support_tickets", admin.from("support_tickets").delete().eq("user_id", user.id));
    await optionalDelete("workspace_provider_connections", admin.from("workspace_provider_connections").delete().eq("user_id", user.id));
    await optionalDelete("workspace_meta_connections", admin.from("workspace_meta_connections").delete().eq("user_id", user.id));
    await optionalDelete("workspace_invitations", admin.from("workspace_invitations").delete().eq("invited_by_user_id", user.id));
    await optionalDelete("workspace_invitations", admin.from("workspace_invitations").delete().eq("accepted_by_user_id", user.id));
    await optionalDelete("campaign_publish_jobs", admin.from("campaign_publish_jobs").update({ created_by: null }).eq("created_by", user.id));
    await optionalDelete("campaign_launch_snapshots", admin.from("campaign_launch_snapshots").update({ created_by: null }).eq("created_by", user.id));
    await runWorkspaceCleanup("campaigns", admin.from("campaigns").delete().eq("user_id", user.id));
    await runWorkspaceCleanup("funnels", admin.from("funnels").delete().eq("user_id", user.id));
    await runWorkspaceCleanup("leads", admin.from("leads").delete().eq("user_id", user.id));
    await runWorkspaceCleanup("follow-up settings", admin.from("follow_up_settings").delete().eq("user_id", user.id));
    await runWorkspaceCleanup("business profiles", admin.from("business_profiles").delete().eq("user_id", user.id));
    await runWorkspaceCleanup("workspace memberships", admin.from("workspace_memberships").delete().eq("user_id", user.id));
    await runWorkspaceCleanup("profiles", admin.from("profiles").delete().eq("user_id", user.id));
    await verifyNoRemainingRowsByColumn(admin, [
      { table: "workspaces", column: "owner_user_id", value: user.id },
      { table: "workspace_memberships", column: "user_id", value: user.id },
      { table: "business_profiles", column: "user_id", value: user.id },
      { table: "campaigns", column: "user_id", value: user.id },
      { table: "funnels", column: "user_id", value: user.id },
      { table: "leads", column: "user_id", value: user.id },
      { table: "follow_up_settings", column: "user_id", value: user.id },
      { table: "profiles", column: "user_id", value: user.id },
      { table: "support_tickets", column: "user_id", value: user.id, optional: true },
      { table: "workspace_provider_connections", column: "user_id", value: user.id, optional: true },
      { table: "workspace_meta_connections", column: "user_id", value: user.id, optional: true },
    ]);
  } catch (error) {
    logActionError("delete account cleanup", error);
    redirect(`/settings?error=${encodeURIComponent("Account deletion could not be completed.")}#account-controls`);
  }

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteUserError) {
    logActionError("delete account auth user cleanup", deleteUserError);
    redirect(`/settings?error=${encodeURIComponent("Account deletion could not be completed.")}#account-controls`);
  }

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut().catch(() => undefined);
  }

  redirect(`/login?success=${encodeURIComponent("Your account has been deleted.")}`);
}

export async function submitSupportTicketAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const values = supportTicketSchema.safeParse({
    subject: String(formData.get("subject") || ""),
    category: String(formData.get("category") || ""),
    priority: String(formData.get("priority") || "medium"),
    message: String(formData.get("message") || ""),
    currentRoute: String(formData.get("currentRoute") || "/support"),
  });

  if (!values.success) {
    const message = values.error.issues[0]?.message || "Complete the support ticket fields.";
    redirect(`/support/new?error=${encodeURIComponent(message)}`);
  }

  if (!isSupabaseServerConfigured()) {
    redirect(
      `/support/new?error=${encodeURIComponent(
        "Support ticket storage is not configured yet. Email support directly for now.",
      )}`,
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(
      `/support/new?error=${encodeURIComponent(
        "Support ticket storage is not available right now. Email support directly for now.",
      )}`,
    );
  }

  const workspaceContext = await ensureWorkspaceContextForUser(user);
  if (!workspaceContext?.activeWorkspace.id) {
    redirect(`/support/new?error=${encodeURIComponent("Choose a workspace before submitting a ticket.")}`);
  }

  const workspaceId = workspaceContext.activeWorkspace.id;
  const hasAccess = await userHasWorkspaceAccess(user.id, workspaceId);
  if (!hasAccess) {
    redirect(`/support/new?error=${encodeURIComponent("You do not have access to this workspace.")}`);
  }

  const userName = workspaceContext.userDisplayName || user.email || "SideKick user";
  const userEmail = user.email || workspaceContext.userEmail || "";
  const submittedAt = new Date().toISOString();
  const context = {
    workspaceName: workspaceContext.activeWorkspace.name,
    workspaceId,
    currentRoute: values.data.currentRoute || "/support",
    submittedAt,
    appEnvironment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    appUrl: env.appUrl,
  };

  let createdTicketId = "";

  try {
    const createdTicket = await createSupportTicketWithMessage({
      admin,
      ticket: {
        workspace_id: workspaceId,
        workspace_name: workspaceContext.activeWorkspace.name,
        user_id: user.id,
        user_name: userName,
        user_email: userEmail,
        subject: values.data.subject,
        category: values.data.category,
        priority: values.data.priority,
        message: values.data.message,
        current_route: values.data.currentRoute || "/support",
        context_json: context,
      },
      message: {
        ticket_id: "",
        workspace_id: workspaceId,
        author_user_id: user.id,
        author_name: userName,
        author_email: userEmail,
        author_role: "user",
        body: values.data.message,
      },
    });
    createdTicketId = createdTicket.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Could not create support ticket.";
    const message =
      isMissingSupportTableError(errorMessage)
        ? "Support ticket storage is not enabled in this database yet. Apply supabase/migrations/022_support_tickets.sql and 023_support_ticket_threads.sql, or email support directly for now."
        : errorMessage;
    redirect(`/support/new?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/support");
  redirect(createdTicketId ? `/support/${createdTicketId}?submitted=1` : "/support?submitted=1");
}

export async function replyToSupportTicketAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const values = supportReplySchema.safeParse({
    ticketId: String(formData.get("ticketId") || ""),
    message: String(formData.get("message") || ""),
  });

  const redirectTo = String(formData.get("redirectTo") || "/support");
  const safeRedirectTo = redirectTo.startsWith("/") ? redirectTo : "/support";

  if (!values.success) {
    const message = values.error.issues[0]?.message || "Reply could not be sent.";
    redirect(`${safeRedirectTo}${safeRedirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
  }

  const admin = createSupabaseAdminClient();
  if (!admin || !isSupabaseServerConfigured()) {
    redirect(`${safeRedirectTo}${safeRedirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Support is not available right now.")}`);
  }

  const workspaceContext = await ensureWorkspaceContextForUser(user);
  const workspaceId = workspaceContext?.activeWorkspace.id;
  if (!workspaceId) {
    redirect(`${safeRedirectTo}${safeRedirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Choose a workspace before replying.")}`);
  }

  const { data: ticketData, error: ticketError } = await admin
    .from("support_tickets")
    .select("id, user_id, workspace_id")
    .eq("id", values.data.ticketId)
    .maybeSingle();

  if (ticketError || !ticketData || ticketData.user_id !== user.id || ticketData.workspace_id !== workspaceId) {
    redirect(`${safeRedirectTo}${safeRedirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("That ticket is not available in this workspace.")}`);
  }

  try {
    await appendSupportTicketMessage({
      admin,
      ticketId: values.data.ticketId,
      body: values.data.message,
      authorUserId: user.id,
      authorName: workspaceContext.userDisplayName || user.email || "SideKick user",
      authorEmail: user.email || workspaceContext.userEmail || "",
      authorRole: "user",
      nextStatus: "active",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reply could not be sent.";
    redirect(`${safeRedirectTo}${safeRedirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/support");
  revalidatePath("/admin/support");
  redirect(`${safeRedirectTo}${safeRedirectTo.includes("?") ? "&" : "?"}replied=1`);
}

export async function adminReplyToSupportTicketAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const role = await getCurrentRole();
  if (role !== "admin") {
    redirect("/dashboard");
  }

  const values = supportReplySchema.safeParse({
    ticketId: String(formData.get("ticketId") || ""),
    message: String(formData.get("message") || ""),
  });
  const nextStatus = (String(formData.get("nextStatus") || "waiting_on_user") as SupportTicketStatus);
  const redirectTo = String(formData.get("redirectTo") || `/admin/support/${String(formData.get("ticketId") || "")}`);
  const safeRedirectTo = redirectTo.startsWith("/") ? redirectTo : "/admin/support";

  if (!values.success) {
    const message = values.error.issues[0]?.message || "Reply could not be sent.";
    redirect(`${safeRedirectTo}${safeRedirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
  }

  const admin = createSupabaseAdminClient();
  if (!admin || !isSupabaseServerConfigured()) {
    redirect(`${safeRedirectTo}${safeRedirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Support admin is not available right now.")}`);
  }

  const profile = await getCurrentProfile();

  try {
    await appendSupportTicketMessage({
      admin,
      ticketId: values.data.ticketId,
      body: values.data.message,
      authorUserId: user.id,
      authorName: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || user.email || "SideKick admin",
      authorEmail: user.email || "",
      authorRole: "admin",
      nextStatus: supportStatuses.includes(nextStatus) ? nextStatus : "waiting_on_user",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reply could not be sent.";
    redirect(`${safeRedirectTo}${safeRedirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/support");
  revalidatePath("/admin/support");
  redirect(`${safeRedirectTo}${safeRedirectTo.includes("?") ? "&" : "?"}saved=${encodeURIComponent("Reply sent")}`);
}

export async function adminUpdateSupportTicketStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const role = await getCurrentRole();
  if (role !== "admin") {
    redirect("/dashboard");
  }

  const values = supportStatusSchema.safeParse({
    ticketId: String(formData.get("ticketId") || ""),
    status: String(formData.get("status") || ""),
    redirectTo: String(formData.get("redirectTo") || "/admin/support"),
  });

  if (!values.success) {
    const message = values.error.issues[0]?.message || "Status could not be updated.";
    const fallback = String(formData.get("redirectTo") || "/admin/support");
    const safeFallback = fallback.startsWith("/") ? fallback : "/admin/support";
    redirect(`${safeFallback}${safeFallback.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
  }

  const admin = createSupabaseAdminClient();
  if (!admin || !isSupabaseServerConfigured()) {
    redirect(`${values.data.redirectTo}${values.data.redirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Support admin is not available right now.")}`);
  }

  const { error } = await admin
    .from("support_tickets")
    .update({
      status: values.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", values.data.ticketId);

  if (error) {
    const message = isMissingSupportTableError(error.message)
      ? "Support ticket storage is not enabled in this database yet. Apply supabase/migrations/022_support_tickets.sql and 023_support_ticket_threads.sql."
      : error.message;
    redirect(`${values.data.redirectTo}${values.data.redirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/support");
  revalidatePath("/support");
  redirect(`${values.data.redirectTo}${values.data.redirectTo.includes("?") ? "&" : "?"}saved=${encodeURIComponent("Status updated")}`);
}

type CampaignLifecycleControl = "pause" | "resume" | "archive";

function appendQueryParam(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

async function loadManagedCampaign(admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>, campaignId: string) {
  const { data: campaign, error } = await admin
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!campaign) {
    throw new Error("Campaign could not be found.");
  }

  return campaign as CampaignRecord;
}

async function runCampaignLifecycleAction(
  formData: FormData,
  action: CampaignLifecycleControl,
) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect("/dashboard");
  }

  const campaignId = String(formData.get("campaignId") || "").trim();
  const redirectTo = String(formData.get("redirectTo") || `/campaigns/${campaignId || ""}`) || `/campaigns/${campaignId || ""}`;

  if (!campaignId) {
    redirect(appendQueryParam(redirectTo, "error", "Campaign could not be found."));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(appendQueryParam(redirectTo, "error", "Campaign controls are not available right now."));
  }

  let successMessage: string | null = null;

  try {
    const campaign = await loadManagedCampaign(admin, campaignId);
    const repaired = await repairCampaignMetaIdentifiers(admin, campaign);
    const normalizedCampaign = repaired.campaign;
    const hasAccess = campaign.workspace_id
      ? await userHasWorkspaceAccess(user.id, campaign.workspace_id)
      : campaign.user_id === user.id;

    if (!hasAccess) {
      throw new Error("You do not have access to this campaign.");
    }

    const lifecycleState = getCampaignLifecycleState(normalizedCampaign);
    const identifiers = repaired.identifiers;
    const metaObjectIds = [identifiers.campaignId, identifiers.adSetId, identifiers.adId].filter(
      (value): value is string => Boolean(value),
    );
    const targetMetaStatus: "ACTIVE" | "PAUSED" = action === "resume" ? "ACTIVE" : "PAUSED";

    if (action !== "archive" && lifecycleState === "draft") {
      throw new Error("Only launched campaigns can be paused or resumed.");
    }

    if (lifecycleState === "archived" && action !== "archive") {
      throw new Error("Archived campaigns cannot be resumed. Duplicate or republish the campaign to launch again.");
    }

    if (action !== "archive" && !metaObjectIds.length) {
      throw new Error("No Meta campaign IDs were saved for this campaign, so it cannot be paused or resumed yet.");
    }

    const noopSuccessMessage =
      action === "pause" && lifecycleState === "paused"
        ? "Campaign is already paused."
        : action === "resume" && lifecycleState === "active"
          ? "Campaign is already active."
          : action === "archive" && lifecycleState === "archived"
            ? "Campaign is already archived."
            : null;

    if (noopSuccessMessage) {
      successMessage = noopSuccessMessage;
    } else {
      const metaAccessToken =
        metaObjectIds.length && campaign.workspace_id
          ? (await getWorkspaceMetaAccessToken({
              admin,
              workspaceId: campaign.workspace_id,
            }))?.accessToken || null
          : null;

      if (action !== "archive" && metaObjectIds.length && !metaAccessToken) {
        throw new Error("Meta is not connected for this workspace.");
      }

      const remoteObjectIds = action === "archive" && !metaAccessToken ? [] : metaObjectIds;

      if (remoteObjectIds.length) {
        const statusUpdates = await Promise.allSettled(
          remoteObjectIds.map((objectId) =>
            updateMetaObjectStatus({
              accessToken: metaAccessToken || "",
              objectId,
              status: targetMetaStatus,
            }),
          ),
        );

        const failedUpdate = statusUpdates.find((result) => result.status === "rejected") as
          | PromiseRejectedResult
          | undefined;
        if (failedUpdate) {
          throw failedUpdate.reason instanceof Error
            ? failedUpdate.reason
            : new Error(String(failedUpdate.reason || "Meta status update failed."));
        }
      }

      if (action === "archive") {
        await archiveCampaignWithMetaSync({
          admin,
          campaign: {
            ...normalizedCampaign,
          } as CampaignRecord,
        });
      } else {
        const syncedCampaign = await syncCampaignStatusFromMeta({
          admin,
          campaign: normalizedCampaign,
        });
        const syncedLifecycle = getCampaignLifecycleState(syncedCampaign);
        if (action === "pause" && syncedLifecycle !== "paused") {
          throw new Error(
            `Meta did not confirm the campaign is paused. Current Meta status is ${syncedCampaign.meta_effective_status || syncedCampaign.external_publish_status || "unknown"}.`,
          );
        }
        if (action === "resume" && syncedLifecycle !== "active") {
          throw new Error(
            `Meta did not confirm the campaign is active. Current Meta status is ${syncedCampaign.meta_effective_status || syncedCampaign.external_publish_status || "unknown"}.`,
          );
        }
      }

      successMessage =
        action === "pause"
          ? "Campaign paused."
          : action === "resume"
            ? "Campaign resumed."
            : metaAccessToken && metaObjectIds.length
              ? "Campaign archived."
              : "Campaign archived locally because Meta was unavailable.";
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Campaign update failed.";
    if (
      message === "Campaign is already paused." ||
      message === "Campaign is already active." ||
      message === "Campaign is already archived."
    ) {
      successMessage = message;
    } else {
      redirect(appendQueryParam(redirectTo, "error", message));
    }
  }

  if (successMessage) {
    revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath("/workspace/settings");
    revalidatePath("/templates");
    revalidatePath("/performance");
    revalidatePath("/dashboard");
    redirect(appendQueryParam(redirectTo, "success", successMessage));
  }
}

async function deleteCampaignRecordsEverywhere({
  admin,
  campaign,
}: {
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
  campaign: CampaignRecord;
}) {
  const campaignId = campaign.id;

  const [leadResult, snapshotResult, followUpResult, funnelResult, publishJobsResult, campaignResult] = await Promise.all([
    admin.from("leads").delete().eq("campaign_id", campaignId),
    admin.from("campaign_launch_snapshots").delete().eq("campaign_id", campaignId),
    admin.from("follow_up_settings").delete().eq("campaign_id", campaignId),
    admin.from("funnels").delete().eq("campaign_id", campaignId),
    admin.from("campaign_publish_jobs").delete().eq("campaign_id", campaignId),
    admin.from("campaigns").delete().eq("id", campaignId),
  ]);

  for (const result of [leadResult, snapshotResult, followUpResult, funnelResult, publishJobsResult, campaignResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }
}

export async function pauseCampaignAction(formData: FormData) {
  await runCampaignLifecycleAction(formData, "pause");
}

export async function resumeCampaignAction(formData: FormData) {
  await runCampaignLifecycleAction(formData, "resume");
}

export async function archiveCampaignAction(formData: FormData) {
  await deleteCampaignAction(formData);
}

export async function deleteCampaignAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect("/dashboard");
  }

  const campaignId = String(formData.get("campaignId") || "").trim();
  const redirectTo = String(formData.get("redirectTo") || `/campaigns/${campaignId || ""}`) || `/campaigns/${campaignId || ""}`;
  const successRedirectTo = String(formData.get("successRedirectTo") || "/templates") || "/templates";
  const safeRedirectTo = redirectTo.startsWith("/") ? redirectTo : "/templates";
  const campaignIdResult = uuidSchema.safeParse(campaignId);

  if (!campaignIdResult.success) {
    redirect(appendQueryParam(safeRedirectTo, "error", "Campaign could not be found."));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(appendQueryParam(safeRedirectTo, "error", "Campaign deletion is not available right now."));
  }

  try {
    const campaign = await loadManagedCampaign(admin, campaignIdResult.data);
    const hasAccess = campaign.workspace_id
      ? await userHasWorkspaceAccess(user.id, campaign.workspace_id)
      : campaign.user_id === user.id;

    if (!hasAccess) {
      throw new Error("You do not have access to this campaign.");
    }

    await deleteCampaignWithMetaCleanup({
      admin,
      campaign,
    });
    await deleteCampaignRecordsEverywhere({
      admin,
      campaign,
    });
  } catch (error) {
    logActionError("delete campaign", error);
    redirect(appendQueryParam(safeRedirectTo, "error", "Campaign deletion failed."));
  }

  revalidatePath(`/campaigns/${campaignIdResult.data}`);
  revalidatePath("/workspace/settings");
  revalidatePath("/templates");
  revalidatePath("/performance");
  revalidatePath("/dashboard");
  redirect(appendQueryParam(successRedirectTo, "success", "Campaign deleted."));
}

export async function deleteDraftCampaignAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect("/dashboard");
  }

  const campaignId = String(formData.get("campaignId") || "").trim();
  const redirectTo = String(formData.get("redirectTo") || `/campaigns/${campaignId || ""}`) || `/campaigns/${campaignId || ""}`;
  const safeRedirectTo = redirectTo.startsWith("/") ? redirectTo : "/templates/drafts";
  const campaignIdResult = uuidSchema.safeParse(campaignId);

  if (!campaignIdResult.success) {
    redirect(appendQueryParam(safeRedirectTo, "error", "Campaign could not be found."));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(appendQueryParam(safeRedirectTo, "error", "Campaign deletion is not available right now."));
  }

  try {
    const campaign = await loadManagedCampaign(admin, campaignIdResult.data);
    const hasAccess = campaign.workspace_id
      ? await userHasWorkspaceAccess(user.id, campaign.workspace_id)
      : campaign.user_id === user.id;

    if (!hasAccess) {
      throw new Error("You do not have access to this campaign.");
    }

    if (getCampaignLifecycleState(campaign) !== "draft") {
      throw new Error("Only draft campaigns can be deleted.");
    }

    await deleteCampaignWithMetaCleanup({
      admin,
      campaign,
    });
    await deleteCampaignRecordsEverywhere({
      admin,
      campaign,
    });
  } catch (error) {
    logActionError("delete draft campaign", error);
    redirect(appendQueryParam(safeRedirectTo, "error", "Draft deletion failed."));
  }

  revalidatePath(`/campaigns/${campaignIdResult.data}`);
  revalidatePath("/templates/drafts");
  revalidatePath("/performance");
  revalidatePath("/dashboard");
  revalidatePath("/templates");
  redirect(appendQueryParam(redirectTo, "success", "Draft deleted."));
}

export async function syncCampaignStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect("/dashboard");
  }

  const campaignId = String(formData.get("campaignId") || "").trim();
  const redirectTo = String(formData.get("redirectTo") || `/campaigns/${campaignId || ""}`) || `/campaigns/${campaignId || ""}`;

  if (!campaignId) {
    redirect(appendQueryParam(redirectTo, "error", "Campaign could not be found."));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(appendQueryParam(redirectTo, "error", "Campaign status sync is not available right now."));
  }

  try {
    const campaign = await loadManagedCampaign(admin, campaignId);
    const hasAccess = campaign.workspace_id
      ? await userHasWorkspaceAccess(user.id, campaign.workspace_id)
      : campaign.user_id === user.id;

    if (!hasAccess) {
      throw new Error("You do not have access to this campaign.");
    }

    await syncCampaignStatusFromMeta({
      admin,
      campaign,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Campaign status sync failed.";
    redirect(appendQueryParam(redirectTo, "error", message));
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/workspace/settings");
  revalidatePath("/templates");
  revalidatePath("/performance");
  revalidatePath("/dashboard");
  redirect(appendQueryParam(redirectTo, "success", "Campaign status synced from Meta."));
}

export async function switchWorkspaceAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseServerConfigured()) {
    redirect("/dashboard");
  }

  const workspaceId = String(formData.get("workspaceId") || "");
  const redirectTo = String(formData.get("redirectTo") || "/dashboard");
  const admin = createSupabaseAdminClient();

  if (!admin || !workspaceId) {
    redirect(redirectTo);
  }

  const membership = await admin
    .from("workspace_memberships")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!membership.data) {
    redirect("/dashboard");
  }

  await admin.from("profiles").update({ active_workspace_id: workspaceId }).eq("user_id", user.id);
  await admin
    .from("workspace_memberships")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/templates");
  revalidatePath("/leads");
  revalidatePath("/performance");
  revalidatePath("/settings");
  revalidatePath("/workspace/settings");
  revalidatePath("/workspaces");
  redirect(redirectTo);
}

export async function createWorkspaceAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const redirectTo = String(formData.get("redirectTo") || "/workspace/settings?section=general&created=1");
  const workspaceName = String(formData.get("workspaceName") || "").trim();
  if (!workspaceName) {
    redirect("/workspaces/new?error=Workspace%20name%20is%20required.");
  }

  await createWorkspaceForUser(user, {
    workspaceName,
    businessName: String(formData.get("businessName") || ""),
    businessEmail: String(formData.get("businessEmail") || ""),
    businessPhone: String(formData.get("businessPhone") || ""),
    website: String(formData.get("website") || ""),
    industry: String(formData.get("industry") || ""),
    privacyPolicyUrl: String(formData.get("privacyPolicyUrl") || ""),
  });

  revalidatePath("/dashboard");
  revalidatePath("/templates");
  revalidatePath("/leads");
  revalidatePath("/performance");
  revalidatePath("/workspace/settings");
  revalidatePath("/settings");
  revalidatePath("/workspaces");
  redirect(redirectTo);
}

export async function deleteWorkspaceAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const workspaceId = String(formData.get("workspaceId") || "").trim();
  const redirectTo = String(formData.get("redirectTo") || "/workspaces");

  if (!workspaceId) {
    redirect(redirectTo);
  }

  if (!isSupabaseServerConfigured()) {
    redirect(redirectTo);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(redirectTo);
  }

  const membershipRole = await getWorkspaceMembershipRole({
    admin,
    workspaceId,
    userId: user.id,
  });

  if (membershipRole !== "owner") {
    redirect(redirectTo);
  }

  const workspaceContext = await ensureWorkspaceContextForUser(user);
  const totalWorkspaces = workspaceContext?.workspaces || [];
  if (totalWorkspaces.length <= 1) {
    redirect(redirectTo);
  }

  const remainingWorkspaces = totalWorkspaces.filter((workspace) => workspace.id !== workspaceId);
  const nextActiveWorkspaceId = remainingWorkspaces[0]?.id || null;

  await deleteWorkspaceAndDependencies(admin, workspaceId);

  await admin.from("profiles").update({ active_workspace_id: nextActiveWorkspaceId }).eq("user_id", user.id);

  const { data: deletedWorkspaceStillExists, error: verifyDeleteError } = await admin
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (verifyDeleteError) {
    throw new Error(`Could not verify workspace deletion: ${verifyDeleteError.message}`);
  }

  if (deletedWorkspaceStillExists?.id) {
    throw new Error("Workspace delete did not complete in Supabase.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/templates");
  revalidatePath("/leads");
  revalidatePath("/performance");
  revalidatePath("/settings");
  revalidatePath("/workspace/settings");
  revalidatePath("/workspaces");
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

async function getWorkspaceMembershipRole({
  admin,
  workspaceId,
  userId,
}: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  workspaceId: string;
  userId: string;
}) {
  if (!admin) return null;
  const workspaceResult = await admin
    .from("workspaces")
    .select("owner_user_id")
    .eq("id", workspaceId)
    .maybeSingle();

  const workspaceOwnerId = workspaceResult.data?.owner_user_id;
  if (workspaceOwnerId && workspaceOwnerId === userId) {
    await admin.from("workspace_memberships").upsert(
      {
        workspace_id: workspaceId,
        user_id: userId,
        role: "owner",
      },
      { onConflict: "workspace_id,user_id" },
    );
    return "owner";
  }

  const { data } = await admin
    .from("workspace_memberships")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as "owner" | "admin" | "member" | undefined) || null;
}

function canManageInvites(role: string | null) {
  return role === "owner" || role === "admin";
}

function canAssignWorkspaceRole(actorRole: string | null, targetRole: string) {
  if (actorRole === "owner") return targetRole === "admin" || targetRole === "member";
  if (actorRole === "admin") return targetRole === "member";
  return false;
}

async function resolveWorkspaceActorRole({
  admin,
  workspaceId,
  userId,
  ownerUserIdFromContext,
}: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  workspaceId: string;
  userId: string;
  ownerUserIdFromContext?: string | null;
}) {
  if (ownerUserIdFromContext && ownerUserIdFromContext === userId) {
    await admin?.from("workspace_memberships").upsert(
      {
        workspace_id: workspaceId,
        user_id: userId,
        role: "owner",
      },
      { onConflict: "workspace_id,user_id" },
    );
    return "owner" as const;
  }

  return getWorkspaceMembershipRole({ admin, workspaceId, userId });
}

export async function inviteWorkspaceMemberAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseServerConfigured()) {
    redirect("/login");
  }

  const admin = createSupabaseAdminClient();
  const workspaceContext = await ensureWorkspaceContextForUser(user);
  const workspaceId = workspaceContext?.activeWorkspace.id || "";
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const inviteRole = String(formData.get("role") || "member");

  if (!admin || !workspaceId) {
    redirect("/workspace/settings?section=members&error=Workspace context is missing.");
  }

  const actorRole = await resolveWorkspaceActorRole({
    admin,
    workspaceId,
    userId: user.id,
    ownerUserIdFromContext: workspaceContext?.activeWorkspace.owner_user_id || null,
  });
  if (!canManageInvites(actorRole)) {
    redirect("/workspace/settings?section=members&error=Only workspace admins can invite members.");
  }

  if (!email || !email.includes("@")) {
    redirect("/workspace/settings?section=members&error=Enter a valid email address.");
  }

  if (!canAssignWorkspaceRole(actorRole, inviteRole)) {
    redirect("/workspace/settings?section=members&error=You can only invite allowed roles.");
  }

  const existingPendingInvite = await admin
    .from("workspace_invitations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("invited_email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (existingPendingInvite.data) {
    redirect("/workspace/settings?section=members&error=An invite is already pending for this email.");
  }

  const usersLookup = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const matchedUser = (usersLookup.data?.users || []).find((candidate) => candidate.email?.toLowerCase() === email);

  if (matchedUser?.id) {
    const existingMembership = await admin
      .from("workspace_memberships")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", matchedUser.id)
      .maybeSingle();

    if (existingMembership.data) {
      redirect("/workspace/settings?section=members&error=This user is already in the workspace.");
    }
  }

  const token = randomUUID();
  const inviteResult = await admin.from("workspace_invitations").insert({
    workspace_id: workspaceId,
    invited_email: email,
    invited_role: inviteRole,
    invited_by_user_id: user.id,
    token,
    status: "pending",
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (inviteResult.error) {
    redirect(`/workspace/settings?section=members&error=${encodeURIComponent(formatAuthErrorMessage(inviteResult.error.message))}`);
  }

  const inviteUrl = `${env.appUrl}/workspaces/invite?token=${token}`;
  await sendWorkspaceInvitationEmail({
    to: email,
    workspaceName: workspaceContext?.activeWorkspace.name || "Your workspace",
    inviterName: [workspaceContext?.profile.first_name, workspaceContext?.profile.last_name].filter(Boolean).join(" ") || user.email || "A workspace admin",
    role: inviteRole as "admin" | "member",
    inviteUrl,
  });

  revalidatePath("/workspace/settings");
  redirect("/workspace/settings?section=members&saved=1");
}

export async function revokeWorkspaceInvitationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseServerConfigured()) {
    redirect("/login");
  }

  const admin = createSupabaseAdminClient();
  const workspaceContext = await ensureWorkspaceContextForUser(user);
  const workspaceId = workspaceContext?.activeWorkspace.id || "";
  const invitationId = String(formData.get("invitationId") || "");

  if (!admin || !workspaceId || !invitationId) {
    redirect("/workspace/settings?section=members&error=Invalid invitation.");
  }

  const actorRole = await resolveWorkspaceActorRole({
    admin,
    workspaceId,
    userId: user.id,
    ownerUserIdFromContext: workspaceContext?.activeWorkspace.owner_user_id || null,
  });
  if (!canManageInvites(actorRole)) {
    redirect("/workspace/settings?section=members&error=Only workspace admins can manage invitations.");
  }

  const { error } = await admin
    .from("workspace_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("workspace_id", workspaceId)
    .eq("status", "pending");

  if (error) {
    redirect(`/workspace/settings?section=members&error=${encodeURIComponent(formatAuthErrorMessage(error.message))}`);
  }

  revalidatePath("/workspace/settings");
  redirect("/workspace/settings?section=members&saved=1");
}

export async function updateWorkspaceMemberRoleAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseServerConfigured()) {
    redirect("/login");
  }

  const admin = createSupabaseAdminClient();
  const workspaceContext = await ensureWorkspaceContextForUser(user);
  const workspaceId = workspaceContext?.activeWorkspace.id || "";
  const membershipId = String(formData.get("membershipId") || "");
  const nextRole = String(formData.get("role") || "member");

  if (!admin || !workspaceId || !membershipId) {
    redirect("/workspace/settings?section=members&error=Invalid membership update.");
  }

  const actorRole = await resolveWorkspaceActorRole({
    admin,
    workspaceId,
    userId: user.id,
    ownerUserIdFromContext: workspaceContext?.activeWorkspace.owner_user_id || null,
  });
  if (!canManageInvites(actorRole) || !canAssignWorkspaceRole(actorRole, nextRole)) {
    redirect("/workspace/settings?section=members&error=You do not have permission to assign this role.");
  }

  const membership = await admin
    .from("workspace_memberships")
    .select("id, user_id, role")
    .eq("id", membershipId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!membership.data) {
    redirect("/workspace/settings?section=members&error=Member not found.");
  }

  if (membership.data.role === "owner") {
    redirect("/workspace/settings?section=members&error=Owner role cannot be changed.");
  }
  if (actorRole === "admin" && membership.data.role !== "member") {
    redirect("/workspace/settings?section=members&error=Admins can only manage members.");
  }

  const { error } = await admin
    .from("workspace_memberships")
    .update({ role: nextRole })
    .eq("id", membershipId)
    .eq("workspace_id", workspaceId);

  if (error) {
    redirect(`/workspace/settings?section=members&error=${encodeURIComponent(formatAuthErrorMessage(error.message))}`);
  }

  revalidatePath("/workspace/settings");
  revalidatePath("/workspaces");
  redirect("/workspace/settings?section=members&saved=1");
}

export async function removeWorkspaceMemberAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseServerConfigured()) {
    redirect("/login");
  }

  const admin = createSupabaseAdminClient();
  const workspaceContext = await ensureWorkspaceContextForUser(user);
  const workspaceId = workspaceContext?.activeWorkspace.id || "";
  const membershipId = String(formData.get("membershipId") || "");

  if (!admin || !workspaceId || !membershipId) {
    redirect("/workspace/settings?section=members&error=Invalid member removal.");
  }

  const actorRole = await resolveWorkspaceActorRole({
    admin,
    workspaceId,
    userId: user.id,
    ownerUserIdFromContext: workspaceContext?.activeWorkspace.owner_user_id || null,
  });
  if (!canManageInvites(actorRole)) {
    redirect("/workspace/settings?section=members&error=Only workspace admins can remove members.");
  }

  const membership = await admin
    .from("workspace_memberships")
    .select("id, user_id, role")
    .eq("id", membershipId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!membership.data) {
    redirect("/workspace/settings?section=members&error=Member not found.");
  }

  if (membership.data.role === "owner") {
    redirect("/workspace/settings?section=members&error=Owner cannot be removed.");
  }
  if (actorRole === "admin" && membership.data.role !== "member") {
    redirect("/workspace/settings?section=members&error=Admins can only remove members.");
  }

  if (membership.data.user_id === user.id) {
    redirect("/workspace/settings?section=members&error=Use workspace switching before removing yourself.");
  }

  const { error } = await admin
    .from("workspace_memberships")
    .delete()
    .eq("id", membershipId)
    .eq("workspace_id", workspaceId);

  if (error) {
    redirect(`/workspace/settings?section=members&error=${encodeURIComponent(formatAuthErrorMessage(error.message))}`);
  }

  revalidatePath("/workspace/settings");
  revalidatePath("/workspaces");
  redirect("/workspace/settings?section=members&saved=1");
}

export async function acceptWorkspaceInvitationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseServerConfigured()) {
    redirect("/login");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/workspaces/invite?error=Server access is not configured.");
  }

  const token = String(formData.get("token") || "");
  if (!token) {
    redirect("/workspaces/invite?error=Invitation token is missing.");
  }

  const { data: invitation } = await admin
    .from("workspace_invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!invitation) {
    redirect("/workspaces/invite?error=Invitation not found.");
  }

  if (invitation.status !== "pending") {
    redirect("/workspaces/invite?error=This invitation is no longer active.");
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await admin.from("workspace_invitations").update({ status: "expired" }).eq("id", invitation.id);
    redirect("/workspaces/invite?error=This invitation has expired.");
  }

  const userEmail = (user.email || "").toLowerCase();
  if (!userEmail || userEmail !== String(invitation.invited_email || "").toLowerCase()) {
    redirect("/workspaces/invite?error=Sign in with the invited email to accept this invitation.");
  }

  await admin.from("workspace_memberships").upsert(
    {
      workspace_id: invitation.workspace_id,
      user_id: user.id,
      role: invitation.invited_role,
    },
    { onConflict: "workspace_id,user_id" },
  );
  await admin
    .from("workspace_memberships")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("workspace_id", invitation.workspace_id)
    .eq("user_id", user.id);

  await admin
    .from("workspace_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by_user_id: user.id,
    })
    .eq("id", invitation.id);

  await admin.from("profiles").update({ active_workspace_id: invitation.workspace_id }).eq("user_id", user.id);

  revalidatePath("/workspaces");
  revalidatePath("/workspace/settings");
  redirect("/dashboard?success=Workspace invitation accepted.");
}

export async function createCampaignAction(formData: FormData) {
  const user = await getCurrentUser();
  const templateSlug = String(formData.get("templateSlug") || "");
  const intent = String(formData.get("intent") || "launch");
  const template = await getPublishedTemplateBySlug(templateSlug);

  if (!template) {
    redirect("/templates");
  }

  const logoFile = formData.get("logo") as File;
  const beforeFiles = [formData.get("before1"), formData.get("before2")].filter(Boolean) as File[];
  const afterFiles = [formData.get("after1"), formData.get("after2")].filter(Boolean) as File[];

  const values = {
    businessName: String(formData.get("businessName") || ""),
    city: String(formData.get("city") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    offerPrice: String(formData.get("offerPrice") || ""),
    regularPrice: String(formData.get("regularPrice") || ""),
    ctaText: String(formData.get("ctaText") || template.ctaDefault),
    headline: String(formData.get("headline") || "").trim().slice(0, 25),
    description: String(formData.get("description") || template.adCopy.descriptions?.[0] || ""),
    subheadline: String(formData.get("subheadline") || ""),
    businessDescription: String(formData.get("businessDescription") || ""),
    testimonialText: String(formData.get("testimonialText") || ""),
    brandColor: String(formData.get("brandColor") || "#6D5EF8"),
    followUpEnabled: formData.get("followUpEnabled") === "on",
  };

  const [logoUrl, ...assetUploads] = await Promise.all([
    uploadAsset(logoFile, "logos"),
    ...beforeFiles.map((file, index) => uploadAsset(file, `before/${index}`)),
    ...afterFiles.map((file, index) => uploadAsset(file, `after/${index}`)),
  ]);

  const beforeImageUrls = assetUploads.slice(0, beforeFiles.length).filter(Boolean) as string[];
  const afterImageUrls = assetUploads.slice(beforeFiles.length).filter(Boolean) as string[];

  const blueprint = createCampaignBlueprint(template, values, {
    logoUrl,
    beforeImageUrls,
    afterImageUrls,
  });

  if (!isSupabaseServerConfigured() || !user) {
    redirect("/campaigns/campaign-demo");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/campaigns/campaign-demo");
  }
  const workspaceContext = await ensureWorkspaceContextForUser(user);
  const activeWorkspaceId = workspaceContext?.activeWorkspace.id || null;
  if (!activeWorkspaceId) {
    redirect("/campaigns/campaign-demo");
  }

  await upsertWorkspaceBusinessProfile(admin, {
    user_id: user.id,
    workspace_id: activeWorkspaceId,
    business_name: values.businessName,
    location: values.city,
    phone: values.phone,
    email: values.email,
    description: values.businessDescription,
    logo_url: logoUrl || workspaceContext?.businessProfile?.logo_url || null,
    brand_color: values.brandColor,
    default_cta: values.ctaText,
  });

  if (activeWorkspaceId) {
    await admin.from("workspaces").update({ name: values.businessName }).eq("id", activeWorkspaceId);
  }

  const { data: campaign, error: campaignError } = await admin
    .from("campaigns")
    .insert({
      user_id: user.id,
      workspace_id: activeWorkspaceId,
      template_id: template.id,
      launch_category: template.industry,
      launch_industry: template.industry,
      launch_offer_type: template.offerType,
      name: blueprint.campaignName,
      slug: blueprint.slug,
      offer_price: Number(values.offerPrice) || null,
      regular_price: Number(values.regularPrice) || null,
      cta_text: values.ctaText,
      headline: blueprint.funnelConfig.headline,
      subheadline: blueprint.funnelConfig.subheadline,
      business_description: values.businessDescription,
      testimonial_text: blueprint.funnelConfig.testimonialText,
      before_images_json: blueprint.funnelConfig.beforeImageUrls,
      after_images_json: blueprint.funnelConfig.afterImageUrls,
      ad_copy_json: blueprint.adCopy,
      status: intent === "draft" ? "draft" : "published",
    })
    .select()
    .single();

  if (campaignError || !campaign) {
    redirect(`/templates/${template.slug}?error=${encodeURIComponent(campaignError?.message || "Could not create campaign")}`);
  }

  await Promise.all([
    admin.from("funnels").insert({
      user_id: user.id,
      workspace_id: activeWorkspaceId,
      campaign_id: campaign.id,
      slug: blueprint.slug,
      is_published: intent !== "draft",
      published_at: intent === "draft" ? null : new Date().toISOString(),
      config_json: blueprint.funnelConfig,
    }),
    admin.from("follow_up_settings").upsert(
      {
        user_id: user.id,
        workspace_id: activeWorkspaceId,
        campaign_id: campaign.id,
        email_enabled: values.followUpEnabled,
        sms_enabled: false,
        confirmation_subject: `Thanks for contacting ${values.businessName}`,
        confirmation_body: `We got your request and will follow up shortly.`,
      },
      { onConflict: "campaign_id" },
    ),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/templates");
  revalidatePath("/leads");
  revalidatePath(`/campaigns/${campaign.id}`);
  redirect(`/campaigns/${campaign.id}`);
}

export async function submitLeadAction(formData: FormData) {
  const rawPayload = {
    funnelSlug: String(formData.get("funnelSlug") || ""),
    campaignId: String(formData.get("campaignId") || ""),
    funnelId: String(formData.get("funnelId") || ""),
    email: String(formData.get("email") || ""),
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || ""),
    serviceInterest: String(formData.get("serviceInterest") || ""),
    message: String(formData.get("message") || ""),
  };
  const parsedPayload = publicLeadSubmissionSchema.safeParse(rawPayload);
  const fallbackSlug = rawPayload.funnelSlug.trim();
  const baseRedirect = fallbackSlug ? `/f/${encodeURIComponent(fallbackSlug)}` : "/";
  const errorRedirect = appendQueryParam(baseRedirect, "error", "Please check the form and try again.");
  const successRedirect = appendQueryParam(baseRedirect, "submitted", "1");

  if (!parsedPayload.success) {
    redirect(errorRedirect);
  }

  const payload = parsedPayload.data;

  await enforceActionRateLimit({
    key: "public:lead-submit:minute",
    limit: 5,
    windowMs: 60 * 1000,
    redirectTo: baseRedirect,
    email: payload.email,
  });
  await enforceActionRateLimit({
    key: "public:lead-submit:hour",
    limit: 30,
    windowMs: 60 * 60 * 1000,
    redirectTo: baseRedirect,
    email: payload.email,
  });

  if (isSupabaseServerConfigured()) {
    const admin = createSupabaseAdminClient();
    if (!admin) {
      redirect(successRedirect);
    }

    let funnelQuery = admin
      .from("funnels")
      .select("id, user_id, workspace_id, campaign_id, slug, is_published")
      .eq("slug", payload.funnelSlug)
      .eq("is_published", true);

    if (payload.funnelId) {
      funnelQuery = funnelQuery.eq("id", payload.funnelId);
    }

    const funnelResult = await funnelQuery.maybeSingle();
    const funnel = funnelResult.data as {
      id: string;
      user_id: string;
      workspace_id: string | null;
      campaign_id: string;
      slug: string;
      is_published: boolean;
    } | null;

    if (funnelResult.error || !funnel) {
      redirect(errorRedirect);
    }

    const campaignResult = await admin
      .from("campaigns")
      .select("id, user_id, workspace_id, name, status")
      .eq("id", funnel.campaign_id)
      .maybeSingle();
    const campaign = campaignResult.data as {
      id: string;
      user_id: string;
      workspace_id: string | null;
      name: string | null;
      status: string | null;
    } | null;

    if (
      campaignResult.error ||
      !campaign ||
      (payload.campaignId && payload.campaignId !== campaign.id) ||
      (funnel.workspace_id && campaign.workspace_id && funnel.workspace_id !== campaign.workspace_id) ||
      campaign.status !== "published"
    ) {
      redirect(errorRedirect);
    }

    const workspaceId = campaign.workspace_id || funnel.workspace_id || null;
    const ownerUserId = campaign.user_id || funnel.user_id;
    const businessProfileResult = workspaceId
      ? await admin
          .from("business_profiles")
          .select("business_name")
          .eq("workspace_id", workspaceId)
          .maybeSingle()
      : { data: null };
    const businessName =
      typeof businessProfileResult.data?.business_name === "string" && businessProfileResult.data.business_name.trim()
        ? businessProfileResult.data.business_name.trim()
        : campaign.name || "the shop";

    const leadInsertPayload = {
      user_id: ownerUserId,
      workspace_id: workspaceId,
      campaign_id: campaign.id,
      funnel_id: funnel.id,
      source: "website_funnel",
      full_name: payload.name,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      service_interest: payload.serviceInterest,
      message: payload.message,
      normalized_fields_json: {
        ...(payload.name ? { full_name: [payload.name] } : {}),
        ...(payload.email ? { email: [payload.email] } : {}),
        ...(payload.phone ? { phone: [payload.phone] } : {}),
        ...(payload.serviceInterest ? { service_interest: [payload.serviceInterest] } : {}),
        ...(payload.message ? { message: [payload.message] } : {}),
      },
      field_data_json: [
        ...(payload.name ? [{ key: "full_name", label: "Full name", values: [payload.name] }] : []),
        ...(payload.email ? [{ key: "email", label: "Email", values: [payload.email] }] : []),
        ...(payload.phone ? [{ key: "phone", label: "Phone", values: [payload.phone] }] : []),
        ...(payload.serviceInterest ? [{ key: "service_interest", label: "Service interest", values: [payload.serviceInterest] }] : []),
        ...(payload.message ? [{ key: "message", label: "Message", values: [payload.message] }] : []),
      ],
      raw_payload_json: {
        ...payload,
        campaignId: campaign.id,
        funnelId: funnel.id,
        userId: ownerUserId,
      },
      last_synced_at: new Date().toISOString(),
      status: "new",
    };

    const insertResult = await admin.from("leads").insert(leadInsertPayload).select("*").single();
    if (insertResult.error) {
      const missingColumnMatch = insertResult.error.message.match(/Could not find the '([^']+)' column of 'leads'/i);
      if (!missingColumnMatch) {
        logActionError("public lead insert", insertResult.error);
        redirect(errorRedirect);
      }
      const fallbackInsert = await admin.from("leads").insert({
        user_id: ownerUserId,
        workspace_id: workspaceId,
        campaign_id: campaign.id,
        funnel_id: funnel.id,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        service_interest: payload.serviceInterest,
        message: payload.message,
        status: "new",
      }).select("*").single();
      if (fallbackInsert.error) {
        logActionError("public lead fallback insert", fallbackInsert.error);
        redirect(errorRedirect);
      }
      await queueLeadForCrmDelivery({
        admin,
        lead: fallbackInsert.data as typeof fallbackInsert.data & { id: string },
      });
    } else if (insertResult.data) {
      await queueLeadForCrmDelivery({
        admin,
        lead: insertResult.data as typeof insertResult.data & { id: string },
      });
    }

    const { data: followUp } = await admin
      .from("follow_up_settings")
      .select("*")
      .eq("campaign_id", campaign.id)
      .single();

    if (followUp?.email_enabled && payload.email) {
      await sendLeadConfirmationEmail({
        to: payload.email,
        businessName,
        subject: followUp.confirmation_subject,
        message: followUp.confirmation_body,
      });
    }
  }

  redirect(successRedirect);
}

export async function updateLeadStatusAction(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") || "/leads");
  const safeRedirectTo = redirectTo.startsWith("/") ? redirectTo : "/leads";
  const user = await requireAuthenticatedActionUser("/login");
  const leadIdResult = uuidSchema.safeParse(String(formData.get("leadId") || ""));
  if (!leadIdResult.success) {
    redirect(appendQueryParam(safeRedirectTo, "error", "Lead not found."));
  }

  const requestedStatus = String(formData.get("status") || "new");
  const status = getCanonicalLeadStatus(requestedStatus);
  const allowedStatuses = new Set(["new", "contacted", "qualified", "closed", "archived"]);
  if (!allowedStatuses.has(status)) {
    redirect(safeRedirectTo);
  }

  await enforceActionRateLimit({
    key: "lead:status-update",
    limit: 30,
    windowMs: 60 * 1000,
    redirectTo: safeRedirectTo,
    userId: user.id,
  });

  const admin = await requireSupabaseAdminForAction(safeRedirectTo);
  const access = await requireLeadMutationAccess({
    admin,
    leadId: leadIdResult.data,
    userId: user.id,
  });

  if (!access.ok) {
    redirect(appendQueryParam(safeRedirectTo, "error", access.message));
  }

  await admin.from("leads").update({ status }).eq("id", leadIdResult.data);

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect(safeRedirectTo);
}

export async function updateLeadNotesAction(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") || "/leads");
  const safeRedirectTo = redirectTo.startsWith("/") ? redirectTo : "/leads";
  const user = await requireAuthenticatedActionUser("/login");
  const leadIdResult = uuidSchema.safeParse(String(formData.get("leadId") || ""));
  if (!leadIdResult.success) {
    redirect(appendQueryParam(safeRedirectTo, "error", "Lead not found."));
  }

  const notes = String(formData.get("notes") || "").trim().slice(0, 5000);
  await enforceActionRateLimit({
    key: "lead:notes-update",
    limit: 30,
    windowMs: 60 * 1000,
    redirectTo: safeRedirectTo,
    userId: user.id,
  });
  const admin = await requireSupabaseAdminForAction(safeRedirectTo);
  const access = await requireLeadMutationAccess({
    admin,
    leadId: leadIdResult.data,
    userId: user.id,
  });

  if (!access.ok) {
    redirect(appendQueryParam(safeRedirectTo, "error", access.message));
  }

  await admin.from("leads").update({ notes }).eq("id", leadIdResult.data);

  revalidatePath("/leads");
  redirect(safeRedirectTo);
}

export async function syncMetaLeadsAction(formData: FormData) {
  if (!isSupabaseServerConfigured()) {
    redirect("/leads");
  }

  const redirectTo = String(formData.get("redirectTo") || "/leads");
  const safeRedirectTo = redirectTo.startsWith("/") ? redirectTo : "/leads";
  const mode = String(formData.get("mode") || "incremental") === "backfill" ? "backfill" : "incremental";
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(safeRedirectTo);
  }

  const workspaceContext = await ensureWorkspaceContextForUser(user);
  if (!workspaceContext?.activeWorkspace.id) {
    redirect("/workspaces");
  }

  try {
    await syncWorkspaceMetaLeads({
      admin,
      workspaceId: workspaceContext.activeWorkspace.id,
      mode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lead sync failed.";
    redirect(`${safeRedirectTo}${safeRedirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/performance");
  redirect(`${safeRedirectTo}${safeRedirectTo.includes("?") ? "&" : "?"}synced=1`);
}

async function getWorkspaceSettingsActionContext() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    return {
      user,
      admin: null,
      workspaceContext: null,
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      user,
      admin: null,
      workspaceContext: null,
    };
  }

  const workspaceContext = await ensureWorkspaceContextForUser(user);

  if (!workspaceContext?.activeWorkspace.id) {
    redirect("/workspaces");
  }

  return {
    user,
    admin,
    workspaceContext,
  };
}

function revalidateWorkspaceSettingsPaths() {
  revalidatePath("/workspace/settings");
  revalidatePath("/workspaces");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function updateWorkspaceGeneralAction(formData: FormData) {
  const { user, admin, workspaceContext } = await getWorkspaceSettingsActionContext();

  if (!admin || !workspaceContext) {
    redirect("/workspace/settings?section=general&saved=1");
  }

  const workspaceName = String(formData.get("workspaceName") || "").trim() || workspaceContext.activeWorkspace.name;
  const businessName = String(formData.get("businessName") || "").trim() || workspaceContext.businessProfile?.business_name || workspaceName;
  const businessEmail = String(formData.get("businessEmail") || "").trim() || workspaceContext.businessProfile?.email || user.email || "";
  const businessPhone = String(formData.get("businessPhone") || "").trim() || workspaceContext.businessProfile?.phone || "";
  const website = String(formData.get("website") || "").trim() || workspaceContext.businessProfile?.website || "";
  const industry = String(formData.get("industry") || "").trim() || workspaceContext.businessProfile?.industry || "";
  const privacyPolicyUrl =
    String(formData.get("privacyPolicyUrl") || "").trim() || workspaceContext.businessProfile?.privacy_policy_url || "";

  await Promise.all([
    updateWorkspaceIdentityRecord(admin, workspaceContext.activeWorkspace.id, {
      name: workspaceName,
    }),
    upsertWorkspaceBusinessProfile(admin, {
      user_id: user.id,
      workspace_id: workspaceContext.activeWorkspace.id,
      business_name: businessName,
      website,
      industry,
      privacy_policy_url: privacyPolicyUrl,
      location: workspaceContext.businessProfile?.location || "",
      phone: businessPhone,
      email: businessEmail,
      description: workspaceContext.businessProfile?.description || "",
      logo_url: workspaceContext.businessProfile?.logo_url || null,
      brand_color: workspaceContext.businessProfile?.brand_color || "#6D5EF8",
      default_cta: workspaceContext.businessProfile?.default_cta || "Get My Quote",
    }),
  ]);

  revalidateWorkspaceSettingsPaths();
  redirect("/workspace/settings?section=general&saved=1");
}

export async function updateWorkspaceIconAction(formData: FormData) {
  const { user, admin, workspaceContext } = await getWorkspaceSettingsActionContext();

  if (!admin || !workspaceContext) {
    redirect("/workspace/settings?section=icon&saved=1");
  }

  const logoFile = formData.get("workspaceLogo");
  const croppedLogoDataUrl = String(formData.get("workspaceLogoCroppedDataUrl") || "").trim();
  const removeLogo = String(formData.get("removeWorkspaceLogo") || formData.get("removeLogo") || "") === "1";
  const existingLogoUrl = workspaceContext.businessProfile?.logo_url || "";
  let nextLogoUrl = removeLogo ? "" : existingLogoUrl;
  let logoUploadFile: File | null = null;

  if (!removeLogo && croppedLogoDataUrl) {
    try {
      logoUploadFile = createWorkspaceLogoFileFromDataUrl(croppedLogoDataUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Workspace logo crop could not be processed.";
      redirect(`/workspace/settings?section=icon&error=${encodeURIComponent(message)}`);
    }
  } else if (logoFile instanceof File && logoFile.size > 0) {
    logoUploadFile = logoFile;
  }

  if (logoUploadFile instanceof File && logoUploadFile.size > 0) {
    if (!allowedWorkspaceLogoTypes.has(logoUploadFile.type)) {
      redirect(
        `/workspace/settings?section=icon&error=${encodeURIComponent(
          "Use a JPG, PNG, WEBP, or GIF image for your workspace logo.",
        )}`,
      );
    }

    if (logoUploadFile.size > profileAvatarMaxBytes) {
      redirect(
        `/workspace/settings?section=icon&error=${encodeURIComponent(
          "Workspace logos must be 5 MB or smaller.",
        )}`,
      );
    }

    try {
      nextLogoUrl = (await uploadAsset(logoUploadFile, `logos/workspaces/${workspaceContext.activeWorkspace.id}`)) || "";
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Workspace logo upload failed. Check Supabase storage bucket "${storageBucketName}".`;
      redirect(`/workspace/settings?section=icon&error=${encodeURIComponent(message)}`);
    }
  }

  await upsertWorkspaceBusinessProfile(admin, {
    user_id: user.id,
    workspace_id: workspaceContext.activeWorkspace.id,
    business_name: workspaceContext.businessProfile?.business_name || workspaceContext.activeWorkspace.name,
    location: workspaceContext.businessProfile?.location || "",
    phone: workspaceContext.businessProfile?.phone || "",
    email: workspaceContext.businessProfile?.email || user.email || "",
    description: workspaceContext.businessProfile?.description || "",
    logo_url: nextLogoUrl || null,
    brand_color: String(formData.get("brandColor") || workspaceContext.businessProfile?.brand_color || "#6D5EF8"),
    default_cta: workspaceContext.businessProfile?.default_cta || "Get My Quote",
  });

  revalidateWorkspaceSettingsPaths();
  redirect("/workspace/settings?section=icon&saved=1");
}

export async function updateWorkspacePreviewAction(formData: FormData) {
  const { user, admin, workspaceContext } = await getWorkspaceSettingsActionContext();

  if (!admin || !workspaceContext) {
    redirect("/workspace/settings?section=preview&saved=1");
  }

  await upsertWorkspaceBusinessProfile(admin, {
    user_id: user.id,
    workspace_id: workspaceContext.activeWorkspace.id,
    business_name: workspaceContext.businessProfile?.business_name || workspaceContext.activeWorkspace.name,
    location: String(formData.get("location") || ""),
    phone: workspaceContext.businessProfile?.phone || "",
    email: workspaceContext.businessProfile?.email || user.email || "",
    description: String(formData.get("description") || ""),
    logo_url: workspaceContext.businessProfile?.logo_url || null,
    brand_color: workspaceContext.businessProfile?.brand_color || "#6D5EF8",
    default_cta: workspaceContext.businessProfile?.default_cta || "Get My Quote",
  });

  revalidateWorkspaceSettingsPaths();
  redirect("/workspace/settings?section=preview&saved=1");
}

export async function updateWorkspaceFunnelsAction(formData: FormData) {
  const { user, admin, workspaceContext } = await getWorkspaceSettingsActionContext();

  if (!admin || !workspaceContext) {
    redirect("/workspace/settings?section=funnels&saved=1");
  }

  await upsertWorkspaceBusinessProfile(admin, {
    user_id: user.id,
    workspace_id: workspaceContext.activeWorkspace.id,
    business_name: workspaceContext.businessProfile?.business_name || workspaceContext.activeWorkspace.name,
    location: workspaceContext.businessProfile?.location || "",
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || user.email || ""),
    description: workspaceContext.businessProfile?.description || "",
    logo_url: workspaceContext.businessProfile?.logo_url || null,
    brand_color: workspaceContext.businessProfile?.brand_color || "#6D5EF8",
    default_cta: String(formData.get("defaultCta") || "Get My Quote"),
  });

  revalidateWorkspaceSettingsPaths();
  redirect("/workspace/settings?section=funnels&saved=1");
}

export async function updateSettingsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect("/settings?saved=1");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/settings?saved=1");
  }
  const workspaceContext = await ensureWorkspaceContextForUser(user);
  const activeWorkspaceId = workspaceContext?.activeWorkspace.id;
  if (!activeWorkspaceId) {
    redirect("/settings?saved=1");
  }
  const logoFile = formData.get("logo") as File;
  const logoUrl = await uploadAsset(logoFile, "logos");
  const workspaceName = String(formData.get("workspaceName") || formData.get("businessName") || "");

  await upsertWorkspaceBusinessProfile(admin, {
    user_id: user.id,
    workspace_id: activeWorkspaceId || "",
    business_name: String(formData.get("businessName") || ""),
    location: String(formData.get("location") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    description: String(formData.get("description") || ""),
    logo_url: logoUrl || workspaceContext?.businessProfile?.logo_url || null,
    brand_color: String(formData.get("brandColor") || "#6D5EF8"),
    default_cta: String(formData.get("defaultCta") || "Get My Quote"),
  });

  if (activeWorkspaceId && workspaceName) {
    await admin.from("workspaces").update({ name: workspaceName }).eq("id", activeWorkspaceId);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/workspaces");
  redirect("/settings?saved=1");
}

export async function updateProfileSettingsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect("/settings?saved=1");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/settings?saved=1");
  }

  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const avatarFile = formData.get("profilePicture");
  const croppedAvatarDataUrl = String(formData.get("profilePictureCroppedDataUrl") || "").trim();
  const removeAvatar = String(formData.get("removeProfilePicture") || "") === "1";
  const existingUserMetadata =
    "user_metadata" in user && user.user_metadata && typeof user.user_metadata === "object"
      ? user.user_metadata
      : {};
  const existingAvatarUrl =
    typeof existingUserMetadata.avatar_url === "string" && existingUserMetadata.avatar_url.trim().length
      ? existingUserMetadata.avatar_url.trim()
      : "";

  let nextAvatarUrl = removeAvatar ? "" : existingAvatarUrl;
  let avatarUploadFile: File | null = null;

  if (!removeAvatar && croppedAvatarDataUrl) {
    try {
      avatarUploadFile = createAvatarFileFromDataUrl(croppedAvatarDataUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profile picture crop could not be processed.";
      redirect(`/settings?error=${encodeURIComponent(message)}#account`);
    }
  } else if (avatarFile instanceof File && avatarFile.size > 0) {
    avatarUploadFile = avatarFile;
  }

  if (avatarUploadFile instanceof File && avatarUploadFile.size > 0) {
    if (!allowedProfileAvatarTypes.has(avatarUploadFile.type)) {
      redirect(`/settings?error=${encodeURIComponent("Use a JPG, PNG, WEBP, or GIF image for your profile picture.")}#account`);
    }

    if (avatarUploadFile.size > profileAvatarMaxBytes) {
      redirect(`/settings?error=${encodeURIComponent("Profile pictures must be 5 MB or smaller.")}#account`);
    }

    try {
      nextAvatarUrl = (await uploadAsset(avatarUploadFile, `profiles/${user.id}`)) || "";
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Profile picture upload failed. Check Supabase storage bucket "${storageBucketName}".`;
      redirect(`/settings?error=${encodeURIComponent(message)}#account`);
    }
  }

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...existingUserMetadata,
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: fullName || null,
      avatar_url: nextAvatarUrl || null,
    },
  });

  const existingProfile = await admin.from("profiles").select("role").eq("user_id", user.id).maybeSingle();

  const profilePayload = {
    user_id: user.id,
    role: existingProfile.data?.role || "user",
    first_name: firstName || null,
    last_name: lastName || null,
    avatar_url: nextAvatarUrl || null,
  };

  const fullProfileUpsert = await admin
    .from("profiles")
    .upsert(profilePayload, { onConflict: "user_id" });

  const profileError =
    fullProfileUpsert.error && fullProfileUpsert.error.message.includes("avatar_url")
      ? (
          await admin.from("profiles").upsert(
            {
              user_id: user.id,
              role: existingProfile.data?.role || "user",
              first_name: firstName || null,
              last_name: lastName || null,
            },
            { onConflict: "user_id" },
          )
        ).error
      : fullProfileUpsert.error;

  if (profileError) {
    redirect(`/settings?error=${encodeURIComponent(formatAuthErrorMessage(profileError.message))}#account`);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/workspaces");
  revalidatePath("/workspace/settings");
  revalidatePath("/", "layout");
  redirect("/settings?saved=1#account");
}

export async function refreshMetaIntegrationAssetsAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect("/workspace/settings?section=integrations&error=Supabase server access is not configured.");
  }

  if (!isMetaConfigured()) {
    redirect("/workspace/settings?section=integrations&error=Meta env vars are missing.");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/workspace/settings?section=integrations&error=Supabase server access is not configured.");
  }

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Workspace could not be loaded.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(msg)}`);
  }
  const workspaceId = workspaceContext?.activeWorkspace.id;
  if (!workspaceId) {
    redirect("/workspace/settings?section=integrations&error=No active workspace found. Ensure database migrations have been applied.");
  }

  try {
    await syncWorkspaceMetaAssets({
      admin,
      workspaceId,
      userId: user.id,
    });
    const automation = await ensureWorkspaceMetaLeadAutomation({
      admin,
      workspaceId,
    });
    if (automation.errors.length) {
      const message = automation.errors[0] || "Meta assets refreshed, but lead automation could not be finalized.";
      redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(message)}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not refresh Meta assets.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/workspace/settings");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/performance");
  redirect("/workspace/settings?section=integrations&saved=1");
}

export async function saveMetaIntegrationSelectionsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect("/workspace/settings?section=integrations&error=Supabase server access is not configured.");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/workspace/settings?section=integrations&error=Supabase server access is not configured.");
  }

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Workspace could not be loaded.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(msg)}`);
  }
  const workspaceId = workspaceContext?.activeWorkspace.id;
  if (!workspaceId) {
    redirect("/workspace/settings?section=integrations&error=No active workspace found. Ensure database migrations have been applied.");
  }

  try {
    await saveWorkspaceMetaSelections({
      admin,
      workspaceId,
      selections: {
        adAccountId: String(formData.get("adAccountId") || "").trim() || undefined,
        pageId: String(formData.get("pageId") || "").trim() || undefined,
        pixelId: String(formData.get("pixelId") || "").trim() || undefined,
        leadFormId: String(formData.get("leadFormId") || "").trim() || undefined,
        instagramActorId: String(formData.get("instagramActorId") || "").trim() || undefined,
      },
    });
    const automation = await ensureWorkspaceMetaLeadAutomation({
      admin,
      workspaceId,
    });
    if (automation.errors.length) {
      const message = automation.errors[0] || "Meta selections saved, but lead automation could not be finalized.";
      redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(message)}`);
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? formatAuthErrorMessage(error.message)
        : "Could not save integration selections.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/workspace/settings");
  revalidatePath("/templates/new");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/performance");
  redirect("/workspace/settings?section=integrations&saved=1");
}

export async function disconnectMetaIntegrationAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect("/workspace/settings?section=integrations&error=Supabase server access is not configured.");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/workspace/settings?section=integrations&error=Supabase server access is not configured.");
  }

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Workspace could not be loaded.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(msg)}`);
  }
  const workspaceId = workspaceContext?.activeWorkspace.id;
  if (!workspaceId) {
    redirect("/workspace/settings?section=integrations&error=No active workspace found. Ensure database migrations have been applied.");
  }

  try {
    await disconnectWorkspaceMetaConnection({
      admin,
      workspaceId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? formatAuthErrorMessage(error.message)
        : "Could not disconnect Meta.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/workspace/settings");
  redirect("/workspace/settings?section=integrations&saved=1");
}

export async function saveCrmConnectionAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect("/workspace/settings?section=integrations&error=Supabase%20server%20access%20is%20not%20configured.");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/workspace/settings?section=integrations&error=Supabase%20server%20access%20is%20not%20configured.");
  }

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Workspace could not be loaded.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(msg)}`);
  }

  const workspaceId = workspaceContext?.activeWorkspace.id;
  if (!workspaceId) {
    redirect("/workspace/settings?section=integrations&error=No%20active%20workspace%20found.");
  }

  const provider = String(formData.get("provider") || "").trim();
  const accessToken = String(formData.get("accessToken") || "").trim();
  const locationId = String(formData.get("locationId") || "").trim();

  if (provider === "gohighlevel") {
    redirect("/workspace/settings?section=integrations&error=Connect%20GoHighLevel%20through%20the%20OAuth%20install%20flow.");
  }

  if (!provider || !accessToken) {
    redirect("/workspace/settings?section=integrations&error=Provider%20and%20access%20token%20are%20required.");
  }

  try {
    await connectWorkspaceCrmProvider({
      admin,
      workspaceId,
      userId: user.id,
      provider: provider as "gohighlevel" | "hubspot",
      accessToken,
      metadata: locationId ? { locationId } : {},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save CRM connection.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/workspace/settings");
  revalidatePath("/dashboard");
  revalidatePath("/performance");
  redirect(`/workspace/settings?section=integrations&saved=${encodeURIComponent(`${provider} connected`)}`);
}

export async function disconnectCrmConnectionAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect("/workspace/settings?section=integrations&error=Supabase%20server%20access%20is%20not%20configured.");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/workspace/settings?section=integrations&error=Supabase%20server%20access%20is%20not%20configured.");
  }

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Workspace could not be loaded.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(msg)}`);
  }

  const workspaceId = workspaceContext?.activeWorkspace.id;
  const provider = String(formData.get("provider") || "").trim();
  if (!workspaceId || !provider) {
    redirect("/workspace/settings?section=integrations&error=Missing%20workspace%20or%20provider.");
  }

  try {
    await disconnectWorkspaceCrmProvider({
      admin,
      workspaceId,
      provider: provider as "gohighlevel" | "hubspot",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not disconnect CRM.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/workspace/settings");
  redirect(`/workspace/settings?section=integrations&saved=${encodeURIComponent(`${provider} disconnected`)}`);
}

export async function saveCrmRoutingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSupabaseServerConfigured()) {
    redirect("/workspace/settings?section=integrations&error=Supabase%20server%20access%20is%20not%20configured.");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/workspace/settings?section=integrations&error=Supabase%20server%20access%20is%20not%20configured.");
  }

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Workspace could not be loaded.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(msg)}`);
  }

  const workspaceId = workspaceContext?.activeWorkspace.id;
  const routeTarget = String(formData.get("routeTarget") || "").trim();
  const [provider, destinationAssetId] = routeTarget.split("::");
  if (!workspaceId || !provider || !destinationAssetId) {
    redirect("/workspace/settings?section=integrations&error=Choose%20a%20CRM%20destination%20before%20saving%20routing.");
  }

  try {
    await saveWorkspaceCrmRoutingRule({
      admin,
      workspaceId,
      provider: provider as "gohighlevel" | "hubspot",
      destinationAssetId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save routing.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/workspace/settings");
  revalidatePath("/dashboard");
  redirect("/workspace/settings?section=integrations&saved=Routing%20saved");
}

export async function retryCrmDeliveryAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  await enforceActionRateLimit({
    key: "crm:retry-delivery",
    limit: 10,
    windowMs: 60 * 60 * 1000,
    redirectTo: "/workspace/settings?section=integrations",
    userId: user.id,
  });

  if (!isSupabaseServerConfigured()) {
    redirect("/workspace/settings?section=integrations&error=Supabase%20server%20access%20is%20not%20configured.");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/workspace/settings?section=integrations&error=Supabase%20server%20access%20is%20not%20configured.");
  }

  const deliveryId = String(formData.get("deliveryId") || "").trim();
  if (!deliveryId) {
    redirect("/workspace/settings?section=integrations&error=Delivery%20ID%20is%20required.");
  }

  try {
    const { data: delivery, error: deliveryError } = await admin
      .from("lead_deliveries")
      .select("id, workspace_id, lead_id")
      .eq("id", deliveryId)
      .maybeSingle();

    if (deliveryError) {
      if (
        deliveryError.message.includes("Could not find the table 'public.lead_deliveries'") ||
        deliveryError.message.includes("lead_deliveries")
      ) {
        throw new Error("CRM delivery logging is not available until the latest database migration is applied.");
      }
      throw new Error(deliveryError.message);
    }

    if (!delivery?.id) {
      throw new Error("CRM delivery could not be found.");
    }

    const role = await getCurrentRole();
    const hasWorkspaceAccess =
      role === "admin" ||
      (typeof delivery.workspace_id === "string" && (await userHasWorkspaceAccess(user.id, delivery.workspace_id)));

    if (!hasWorkspaceAccess) {
      throw new Error("You do not have access to this CRM delivery.");
    }

    await processLeadCrmDelivery({
      admin,
      deliveryId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not retry delivery.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/workspace/settings");
  revalidatePath("/performance");
  redirect("/workspace/settings?section=integrations&saved=Delivery%20retried");
}

export async function retryFailedCrmDeliveriesAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  await enforceActionRateLimit({
    key: "crm:retry-failed-deliveries",
    limit: 10,
    windowMs: 60 * 60 * 1000,
    redirectTo: "/workspace/settings?section=integrations",
    userId: user.id,
  });

  if (!isSupabaseServerConfigured()) {
    redirect("/workspace/settings?section=integrations&error=Supabase%20server%20access%20is%20not%20configured.");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/workspace/settings?section=integrations&error=Supabase%20server%20access%20is%20not%20configured.");
  }

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Workspace could not be loaded.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(msg)}`);
  }

  const workspaceId = workspaceContext?.activeWorkspace.id;
  if (!workspaceId) {
    redirect("/workspace/settings?section=integrations&error=No%20active%20workspace%20found.");
  }

  try {
    const result = await retryFailedCrmDeliveriesForWorkspace({
      admin,
      workspaceId,
    });
    revalidatePath("/workspace/settings");
    revalidatePath("/performance");
    redirect(
      `/workspace/settings?section=integrations&saved=${encodeURIComponent(
        result.retried
          ? `Retried ${result.retried} failed CRM ${result.retried === 1 ? "delivery" : "deliveries"}`
          : "No failed CRM deliveries were waiting to retry",
      )}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not retry failed CRM deliveries.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(message)}`);
  }
}

export async function completeOnboardingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const selectedIndustry = String(formData.get("industry") || "");
  const templateSlug = String(formData.get("templateSlug") || "");
  const template = await getPublishedTemplateBySlug(templateSlug);

  if (!selectedIndustry || !template) {
    redirect(`/dashboard?success=${encodeURIComponent("Please choose an industry and a starting template.")}`);
  }

  if (!isSupabaseServerConfigured()) {
    redirect(`/dashboard?success=${encodeURIComponent("You're ready to start with your first template.")}`);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(`/dashboard?success=${encodeURIComponent("You're ready to start with your first template.")}`);
  }

  const { error } = await admin
    .from("profiles")
    .update({
      selected_industry: selectedIndustry,
      starting_template_id: template.id,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard?success=${encodeURIComponent("We couldn't save onboarding yet. Run the latest database migration and try again.")}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/templates");
  redirect(`/dashboard?success=${encodeURIComponent("Your workspace is ready. Pick up where you left off.")}`);
}

export async function createAdminTemplateAction(
  _: AdminTemplateActionState,
  formData: FormData,
): Promise<AdminTemplateActionState> {
  const user = await requireAdminActionUser();
  const values = buildTemplateAdminValues(formData);
  const intent = String(formData.get("intent") || "save");

  if (!values.success) {
    return {
      formError: "Some required template fields are still missing.",
      fieldErrors: getTemplateFieldErrors(values.error),
    };
  }

  if (!isSupabaseServerConfigured()) {
    return {
      formError: "Supabase server config is required for admin template management.",
      fieldErrors: {},
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      formError: "Supabase admin access is not available.",
      fieldErrors: {},
    };
  }

  let previewImageUrl = values.data.previewImageUrl || "";
  try {
    previewImageUrl = await resolveAdminTemplatePreviewImage(formData, previewImageUrl);
  } catch (error) {
    return getTemplateDbErrorState(error instanceof Error ? error.message : "Preview image upload failed.");
  }

  let placement;
  try {
    placement = await resolveTemplatePlacement(admin, {
      industryId: values.data.industryId,
      categoryId: values.data.categoryId,
      fallbackIndustry: values.data.industry,
      fallbackCategory: values.data.category,
    });
  } catch (error) {
    return getTemplateDbErrorState(error instanceof Error ? error.message : "Template placement could not be resolved.");
  }

  const templateId = `tpl-${randomUUID()}`;
  const now = new Date().toISOString();
  const resolvedStatus =
    intent === "publish" ? "published" : intent === "archive" ? "archived" : values.data.status;

  const { error } = await admin
    .from("templates")
    .insert({
      id: templateId,
      slug: values.data.slug,
      name: values.data.name,
      description: values.data.description,
      industry: placement.industryName || values.data.industry || values.data.category || "",
      industry_id: placement.industryId,
      category: placement.categoryName || values.data.category || values.data.industry || "",
      category_id: placement.categoryId,
      offer_type: values.data.offerType || null,
      preview_image_url: previewImageUrl || null,
      status: resolvedStatus,
      is_featured: values.data.isFeatured,
      version: 1,
      created_by: user.id,
      published_at: resolvedStatus === "published" ? now : null,
      archived_at: resolvedStatus === "archived" ? now : null,
      config_json: buildAdminTemplateConfig(values.data),
    });

  if (error) {
    return getTemplateDbErrorState(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  redirect(
    `/admin/templates?success=${encodeURIComponent(
      resolvedStatus === "published" ? "Template created and published." : "Template created.",
    )}`,
  );

  return emptyAdminTemplateActionState;
}

export async function updateAdminTemplateAction(
  _: AdminTemplateActionState,
  formData: FormData,
): Promise<AdminTemplateActionState> {
  await requireAdminActionUser();
  const templateId = String(formData.get("templateId") || "");
  const currentVersion = Number(formData.get("currentVersion") || 1);
  const values = buildTemplateAdminValues(formData);
  const intent = String(formData.get("intent") || "save");

  if (!templateId) {
    redirect(`/admin/templates?error=${encodeURIComponent("Template could not be found.")}`);
  }

  if (!values.success) {
    return {
      formError: "Some required template fields are still missing.",
      fieldErrors: getTemplateFieldErrors(values.error),
    };
  }

  if (!isSupabaseServerConfigured()) {
    return {
      formError: "Supabase server config is required for admin template management.",
      fieldErrors: {},
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      formError: "Supabase admin access is not available.",
      fieldErrors: {},
    };
  }

  let previewImageUrl = values.data.previewImageUrl || "";
  try {
    previewImageUrl = await resolveAdminTemplatePreviewImage(formData, previewImageUrl);
  } catch (error) {
    return getTemplateDbErrorState(error instanceof Error ? error.message : "Preview image upload failed.");
  }

  let placement;
  try {
    placement = await resolveTemplatePlacement(admin, {
      industryId: values.data.industryId,
      categoryId: values.data.categoryId,
      fallbackIndustry: values.data.industry,
      fallbackCategory: values.data.category,
    });
  } catch (error) {
    return getTemplateDbErrorState(error instanceof Error ? error.message : "Template placement could not be resolved.");
  }

  const now = new Date().toISOString();
  const resolvedStatus =
    intent === "publish" ? "published" : intent === "archive" ? "archived" : intent === "draft" ? "draft" : values.data.status;
  const { error } = await admin
    .from("templates")
    .update({
      slug: values.data.slug,
      name: values.data.name,
      description: values.data.description,
      industry: placement.industryName || values.data.industry || values.data.category || "",
      industry_id: placement.industryId,
      category: placement.categoryName || values.data.category || values.data.industry || "",
      category_id: placement.categoryId,
      offer_type: values.data.offerType || null,
      preview_image_url: previewImageUrl || null,
      status: resolvedStatus,
      is_featured: values.data.isFeatured,
      version: currentVersion + 1,
      published_at: resolvedStatus === "published" ? now : null,
      archived_at: resolvedStatus === "archived" ? now : null,
      config_json: buildAdminTemplateConfig(values.data),
    })
    .eq("id", templateId);

  if (error) {
    return getTemplateDbErrorState(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${templateId}/edit`);
  revalidatePath("/templates");
  redirect(
    `/admin/templates?success=${encodeURIComponent(
      resolvedStatus === "published"
        ? "Template updated and published."
        : resolvedStatus === "archived"
          ? "Template archived."
          : resolvedStatus === "draft"
            ? "Template saved as draft."
            : "Template updated.",
    )}`,
  );

  return emptyAdminTemplateActionState;
}

export async function duplicateAdminTemplateAction(formData: FormData) {
  await requireAdminActionUser();
  const templateId = String(formData.get("templateId") || "");

  if (!templateId) {
    redirect(`/admin/templates?error=${encodeURIComponent("Template could not be duplicated.")}`);
  }

  if (!isSupabaseServerConfigured()) {
    redirect(`/admin/templates?error=${encodeURIComponent("Supabase server config is required for admin template management.")}`);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(`/admin/templates?error=${encodeURIComponent("Supabase admin access is not available.")}`);
  }

  const { data: template, error: loadError } = await admin
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();

  if (loadError || !template) {
    redirect(`/admin/templates?error=${encodeURIComponent(loadError?.message || "Template could not be duplicated.")}`);
  }

  const baseSlug = `${template.slug}-copy`;
  const newId = `tpl-${baseSlug}-${Date.now().toString().slice(-6)}`;

  const { error } = await admin.from("templates").insert({
    ...template,
    id: newId,
    slug: `${baseSlug}-${Date.now().toString().slice(-4)}`,
    name: `${template.name} Copy`,
    status: "draft",
    is_featured: false,
    version: 1,
    published_at: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/admin/templates?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/templates");
  redirect(`/admin/templates?success=${encodeURIComponent("Template duplicated as a draft.")}`);
}

export async function createTemplateIndustryAction(formData: FormData) {
  await requireAdminActionUser();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) {
    redirect(createAdminLibraryRedirect({ error: "Industry name is required." }));
  }

  if (!isSupabaseServerConfigured()) {
    redirect(createAdminLibraryRedirect({ error: "Supabase server config is required for template library management." }));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(createAdminLibraryRedirect({ error: "Supabase admin access is not available." }));
  }

  const slug = await buildUniqueTemplateLibrarySlug(admin, "template_industries", name);
  const { data, error } = await admin
    .from("template_industries")
    .insert({
      name,
      slug,
      description: description || null,
      status: "active",
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(createAdminLibraryRedirect({ error: error?.message || "Industry could not be created." }));
  }

  revalidateTemplateLibraryPaths();
  redirect(createAdminLibraryRedirect({ industryId: data.id, success: "Industry created." }));
}

export async function updateTemplateIndustryAction(formData: FormData) {
  await requireAdminActionUser();
  const industryId = String(formData.get("industryId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!industryId || !name) {
    redirect(createAdminLibraryRedirect({ error: "Industry could not be updated." }));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(createAdminLibraryRedirect({ error: "Supabase admin access is not available." }));
  }

  const slug = await buildUniqueTemplateLibrarySlug(admin, "template_industries", name, { ignoreId: industryId });
  const { error } = await admin.from("template_industries").update({
    name,
    slug,
    description: description || null,
  }).eq("id", industryId);

  if (error) {
    redirect(createAdminLibraryRedirect({ industryId, error: error.message }));
  }

  const { error: templateError } = await admin
    .from("templates")
    .update({ industry: name })
    .eq("industry_id", industryId);

  if (templateError) {
    redirect(createAdminLibraryRedirect({ industryId, error: templateError.message }));
  }

  revalidateTemplateLibraryPaths();
  redirect(createAdminLibraryRedirect({ industryId, success: "Industry updated." }));
}

export async function deleteTemplateIndustryAction(formData: FormData) {
  await requireAdminActionUser();
  const industryId = String(formData.get("industryId") || "").trim();
  if (!industryId) {
    redirect(createAdminLibraryRedirect({ error: "Industry could not be removed." }));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(createAdminLibraryRedirect({ error: "Supabase admin access is not available." }));
  }

  const [{ count: categoryCount, error: categoryError }, { count: templateCount, error: templateError }] = await Promise.all([
    admin.from("template_categories").select("id", { count: "exact", head: true }).eq("industry_id", industryId),
    admin.from("templates").select("id", { count: "exact", head: true }).eq("industry_id", industryId),
  ]);

  if (categoryError || templateError) {
    redirect(createAdminLibraryRedirect({ industryId, error: categoryError?.message || templateError?.message || "Industry could not be removed." }));
  }

  if ((categoryCount || 0) > 0 || (templateCount || 0) > 0) {
    const now = new Date().toISOString();
    const [{ error: industryError }, { error: categoriesError }, { error: templatesError }] = await Promise.all([
      admin.from("template_industries").update({ status: "archived" }).eq("id", industryId),
      admin.from("template_categories").update({ status: "archived" }).eq("industry_id", industryId),
      admin.from("templates").update({ status: "archived", archived_at: now }).eq("industry_id", industryId),
    ]);

    if (industryError || categoriesError || templatesError) {
      redirect(createAdminLibraryRedirect({ industryId, error: industryError?.message || categoriesError?.message || templatesError?.message || "Industry could not be archived." }));
    }

    revalidateTemplateLibraryPaths();
    redirect(createAdminLibraryRedirect({ success: "Industry archived with its child library items." }));
  }

  const { error } = await admin.from("template_industries").delete().eq("id", industryId);
  if (error) {
    redirect(createAdminLibraryRedirect({ error: error.message }));
  }

  revalidateTemplateLibraryPaths();
  redirect(createAdminLibraryRedirect({ success: "Industry deleted." }));
}

export async function createTemplateCategoryAction(formData: FormData) {
  await requireAdminActionUser();
  const industryId = String(formData.get("industryId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!industryId || !name) {
    redirect(createAdminLibraryRedirect({ industryId, error: "Category name is required." }));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(createAdminLibraryRedirect({ error: "Supabase admin access is not available." }));
  }

  const slug = await buildUniqueTemplateLibrarySlug(admin, "template_categories", name, { industryId });
  const { data, error } = await admin
    .from("template_categories")
    .insert({
      industry_id: industryId,
      name,
      slug,
      description: description || null,
      status: "active",
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(createAdminLibraryRedirect({ industryId, error: error?.message || "Category could not be created." }));
  }

  revalidateTemplateLibraryPaths();
  redirect(createAdminLibraryRedirect({ industryId, categoryId: data.id, success: "Category created." }));
}

export async function updateTemplateCategoryAction(formData: FormData) {
  await requireAdminActionUser();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const industryId = String(formData.get("industryId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!categoryId || !industryId || !name) {
    redirect(createAdminLibraryRedirect({ categoryId, error: "Category could not be updated." }));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(createAdminLibraryRedirect({ error: "Supabase admin access is not available." }));
  }

  const placement = await resolveTemplatePlacement(admin, {
    industryId,
    categoryId,
  });
  const slug = await buildUniqueTemplateLibrarySlug(admin, "template_categories", name, {
    industryId,
    ignoreId: categoryId,
  });

  const { error } = await admin.from("template_categories").update({
    industry_id: industryId,
    name,
    slug,
    description: description || null,
  }).eq("id", categoryId);

  if (error) {
    redirect(createAdminLibraryRedirect({ industryId, categoryId, error: error.message }));
  }

  const { error: templateError } = await admin
    .from("templates")
    .update({
      industry_id: placement.industryId,
      industry: placement.industryName || "",
      category_id: categoryId,
      category: name,
    })
    .eq("category_id", categoryId);

  if (templateError) {
    redirect(createAdminLibraryRedirect({ industryId, categoryId, error: templateError.message }));
  }

  revalidateTemplateLibraryPaths();
  redirect(createAdminLibraryRedirect({ industryId, categoryId, success: "Category updated." }));
}

export async function deleteTemplateCategoryAction(formData: FormData) {
  await requireAdminActionUser();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const industryId = String(formData.get("industryId") || "").trim();
  if (!categoryId) {
    redirect(createAdminLibraryRedirect({ industryId, error: "Category could not be removed." }));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(createAdminLibraryRedirect({ error: "Supabase admin access is not available." }));
  }

  const { count, error: countError } = await admin
    .from("templates")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (countError) {
    redirect(createAdminLibraryRedirect({ industryId, categoryId, error: countError.message }));
  }

  if ((count || 0) > 0) {
    const now = new Date().toISOString();
    const [{ error: categoryError }, { error: templateError }] = await Promise.all([
      admin.from("template_categories").update({ status: "archived" }).eq("id", categoryId),
      admin.from("templates").update({ status: "archived", archived_at: now }).eq("category_id", categoryId),
    ]);

    if (categoryError || templateError) {
      redirect(createAdminLibraryRedirect({ industryId, categoryId, error: categoryError?.message || templateError?.message || "Category could not be archived." }));
    }

    revalidateTemplateLibraryPaths();
    redirect(createAdminLibraryRedirect({ industryId, success: "Category archived with its templates." }));
  }

  const { error } = await admin.from("template_categories").delete().eq("id", categoryId);
  if (error) {
    redirect(createAdminLibraryRedirect({ industryId, categoryId, error: error.message }));
  }

  revalidateTemplateLibraryPaths();
  redirect(createAdminLibraryRedirect({ industryId, success: "Category deleted." }));
}

export async function createTemplateFromCategoryAction(formData: FormData) {
  const user = await requireAdminActionUser();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!categoryId || !name) {
    redirect(createAdminLibraryRedirect({ categoryId, error: "Template name is required." }));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(createAdminLibraryRedirect({ error: "Supabase admin access is not available." }));
  }

  const placement = await resolveTemplatePlacement(admin, { categoryId });
  const slug = await buildUniqueTemplateLibrarySlug(admin, "templates", name);
  const templateId = `tpl-${randomUUID()}`;
  const defaults = getEmptyAdminTemplateFormData();
  const quickTemplateValues = templateAdminSchema.parse({
    ...defaults,
    name,
    slug,
    industryId: placement.industryId || "",
    categoryId: placement.categoryId || "",
    industry: placement.industryName || "",
    category: placement.categoryName || "",
    description: description || `${name} template`,
    headline: name.slice(0, 25),
    adPrimary: `${name} primary text`,
  });
  const config = buildAdminTemplateConfig(quickTemplateValues);

  const { error } = await admin.from("templates").insert({
    id: templateId,
    slug,
    name,
    description: description || `${name} template`,
    industry: placement.industryName || "",
    industry_id: placement.industryId,
    category: placement.categoryName || "",
    category_id: placement.categoryId,
    offer_type: defaults.offerType,
    preview_image_url: null,
    status: "draft",
    is_featured: false,
    version: 1,
    created_by: user.id,
    config_json: config,
  });

  if (error) {
    redirect(createAdminLibraryRedirect({ categoryId, error: error.message }));
  }

  revalidateTemplateLibraryPaths(templateId);
  redirect(`/admin/templates/${templateId}/edit?success=${encodeURIComponent("Template created. Fill in the full content next.")}`);
}

export async function updateTemplateLibraryTemplateAction(formData: FormData) {
  await requireAdminActionUser();
  const templateId = String(formData.get("templateId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const status = String(formData.get("status") || "draft").trim();
  const isFeatured = String(formData.get("isFeatured") || "") === "1";

  if (!templateId || !name || !categoryId) {
    redirect(createAdminLibraryRedirect({ templateId, error: "Template could not be updated." }));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(createAdminLibraryRedirect({ error: "Supabase admin access is not available." }));
  }

  const placement = await resolveTemplatePlacement(admin, { categoryId });
  const now = new Date().toISOString();
  const { error } = await admin.from("templates").update({
    name,
    category_id: placement.categoryId,
    category: placement.categoryName || "",
    industry_id: placement.industryId,
    industry: placement.industryName || "",
    status: status === "published" || status === "archived" ? status : "draft",
    is_featured: isFeatured,
    published_at: status === "published" ? now : null,
    archived_at: status === "archived" ? now : null,
  }).eq("id", templateId);

  if (error) {
    redirect(createAdminLibraryRedirect({ templateId, error: error.message }));
  }

  revalidateTemplateLibraryPaths(templateId);
  redirect(createAdminLibraryRedirect({
    industryId: placement.industryId,
    categoryId: placement.categoryId,
    templateId,
    success: "Template updated.",
  }));
}

export async function deleteTemplateLibraryTemplateAction(formData: FormData) {
  await requireAdminActionUser();
  const templateId = String(formData.get("templateId") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const industryId = String(formData.get("industryId") || "").trim();

  if (!templateId) {
    redirect(createAdminLibraryRedirect({ industryId, categoryId, error: "Template could not be removed." }));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(createAdminLibraryRedirect({ error: "Supabase admin access is not available." }));
  }

  const { count, error: countError } = await admin
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId);

  if (countError) {
    redirect(createAdminLibraryRedirect({ industryId, categoryId, templateId, error: countError.message }));
  }

  if ((count || 0) > 0) {
    const { error } = await admin
      .from("templates")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", templateId);

    if (error) {
      redirect(createAdminLibraryRedirect({ industryId, categoryId, templateId, error: error.message }));
    }

    revalidateTemplateLibraryPaths(templateId);
    redirect(createAdminLibraryRedirect({ industryId, categoryId, success: "Template archived because campaigns already reference it." }));
  }

  const { error } = await admin.from("templates").delete().eq("id", templateId);
  if (error) {
    redirect(createAdminLibraryRedirect({ industryId, categoryId, templateId, error: error.message }));
  }

  revalidateTemplateLibraryPaths();
  redirect(createAdminLibraryRedirect({ industryId, categoryId, success: "Template deleted." }));
}

export async function createSlugAction(name: string) {
  return slugify(name);
}
