"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentRole, getCurrentUser } from "@/lib/auth";
import { authSuccessMessages, formatAuthErrorMessage } from "@/lib/auth-messages";
import { createCampaignBlueprint } from "@/lib/template-engine";
import { env, isSupabasePublicConfigured, isSupabaseServerConfigured } from "@/lib/env";
import { getPublishedTemplateBySlug } from "@/lib/template-repository";
import { slugify } from "@/lib/utils";
import { sendLeadConfirmationEmail, sendWorkspaceInvitationEmail } from "@/services/follow-up";
import { uploadAsset } from "@/services/storage";
import { storageBucketName } from "@/services/storage";
import { createWorkspaceForUser, ensureWorkspaceContextForUser } from "@/lib/workspaces";
import { isMetaConfigured } from "@/lib/meta";
import { normalizeIndustryLabel } from "@/data/template-taxonomy";
import { CampaignAdType } from "@/types";
import {
  disconnectWorkspaceMetaConnection,
  saveWorkspaceMetaSelections,
  syncWorkspaceMetaAssets,
} from "@/lib/meta-integration";
import {
  AdminTemplateActionState,
  AdminTemplateFieldName,
  emptyAdminTemplateActionState,
  getEmptyLeadFormSettings,
} from "@/lib/admin-template-form";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signUpSchema = authSchema.extend({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
});

const optionalText = z.string().trim().optional().default("");
const optionalUrl = z.union([z.literal(""), z.string().url("Enter a valid preview image URL.")]).transform((value) => value || "");

const templateAdminSchema = z.object({
  name: z.string().min(2, "Template name is required."),
  slug: optionalText,
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
  headline: optionalText,
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
    headline: String(formData.get("headline") || name),
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
    ctaDefault: values.ctaDefault,
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
      finalCta: values.ctaDefault || "Get Started",
      pageIntro: values.landingIntro,
      formCta: values.formCta || values.ctaDefault || "Request details",
      formFields: values.formFields,
      nextStepFlow: values.nextStepFlow,
    },
    creativeAssets: {
      imageUrls: values.mediaImageUrls,
      videoUrls: values.mediaVideoUrls,
    },
    leadFlowDefaults: {
      pageIntro: values.landingIntro,
      formCta: values.formCta || values.ctaDefault || "Request details",
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

  if (!isSupabasePublicConfigured()) {
    redirect("/dashboard");
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

  if (!isSupabasePublicConfigured()) {
    redirect("/dashboard");
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
  revalidatePath("/settings");
  revalidatePath("/workspaces");
  redirect(redirectTo);
}

export async function createWorkspaceAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const redirectTo = String(formData.get("redirectTo") || "/dashboard");
  await createWorkspaceForUser(user, String(formData.get("workspaceName") || ""));

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/workspaces");
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
    headline: String(formData.get("headline") || ""),
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

  await admin
    .from("business_profiles")
    .upsert(
      {
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
      },
      { onConflict: "workspace_id" },
    )
    .select()
    .single();

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
  const payload = {
    funnelSlug: String(formData.get("funnelSlug") || ""),
    campaignId: String(formData.get("campaignId") || ""),
    funnelId: String(formData.get("funnelId") || ""),
    userId: String(formData.get("userId") || ""),
    businessName: String(formData.get("businessName") || "the shop"),
    email: String(formData.get("email") || ""),
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || ""),
    serviceInterest: String(formData.get("serviceInterest") || ""),
    message: String(formData.get("message") || ""),
  };

  if (isSupabaseServerConfigured()) {
    const admin = createSupabaseAdminClient();
    if (!admin) {
      redirect(`/f/${payload.funnelSlug}?submitted=1`);
    }

    const campaignResult = await admin
      .from("campaigns")
      .select("workspace_id")
      .eq("id", payload.campaignId)
      .maybeSingle();
    const workspaceId = campaignResult.data?.workspace_id || null;

    await admin.from("leads").insert({
      user_id: payload.userId,
      workspace_id: workspaceId,
      campaign_id: payload.campaignId,
      funnel_id: payload.funnelId,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      service_interest: payload.serviceInterest,
      message: payload.message,
      status: "new",
    });

    const { data: followUp } = await admin
      .from("follow_up_settings")
      .select("*")
      .eq("campaign_id", payload.campaignId)
      .single();

    if (followUp?.email_enabled && payload.email) {
      await sendLeadConfirmationEmail({
        to: payload.email,
        businessName: payload.businessName,
        subject: followUp.confirmation_subject,
        message: followUp.confirmation_body,
      });
    }
  }

  redirect(`/f/${payload.funnelSlug}?submitted=1`);
}

export async function updateLeadStatusAction(formData: FormData) {
  if (!isSupabaseServerConfigured()) {
    redirect("/leads");
  }

  const leadId = String(formData.get("leadId") || "");
  const status = String(formData.get("status") || "new");

  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/leads");
  }
  await admin.from("leads").update({ status }).eq("id", leadId);

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect("/leads");
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

  await Promise.all([
    admin.from("workspaces").update({ name: workspaceName }).eq("id", workspaceContext.activeWorkspace.id),
    admin.from("business_profiles").upsert(
      {
        user_id: user.id,
        workspace_id: workspaceContext.activeWorkspace.id,
        business_name: businessName,
        location: workspaceContext.businessProfile?.location || "",
        phone: workspaceContext.businessProfile?.phone || "",
        email: workspaceContext.businessProfile?.email || user.email || "",
        description: workspaceContext.businessProfile?.description || "",
        logo_url: workspaceContext.businessProfile?.logo_url || null,
        brand_color: workspaceContext.businessProfile?.brand_color || "#6D5EF8",
        default_cta: workspaceContext.businessProfile?.default_cta || "Get My Quote",
      },
      { onConflict: "workspace_id" },
    ),
  ]);

  revalidateWorkspaceSettingsPaths();
  redirect("/workspace/settings?section=general&saved=1");
}

export async function updateWorkspaceIconAction(formData: FormData) {
  const { user, admin, workspaceContext } = await getWorkspaceSettingsActionContext();

  if (!admin || !workspaceContext) {
    redirect("/workspace/settings?section=icon&saved=1");
  }

  const logoFile = formData.get("logo") as File;
  const logoUrl = await uploadAsset(logoFile, "logos");
  const removeLogo = String(formData.get("removeLogo") || "") === "1";

  await admin.from("business_profiles").upsert(
    {
      user_id: user.id,
      workspace_id: workspaceContext.activeWorkspace.id,
      business_name: workspaceContext.businessProfile?.business_name || workspaceContext.activeWorkspace.name,
      location: workspaceContext.businessProfile?.location || "",
      phone: workspaceContext.businessProfile?.phone || "",
      email: workspaceContext.businessProfile?.email || user.email || "",
      description: workspaceContext.businessProfile?.description || "",
      logo_url: removeLogo ? null : logoUrl || workspaceContext.businessProfile?.logo_url || null,
      brand_color: String(formData.get("brandColor") || workspaceContext.businessProfile?.brand_color || "#6D5EF8"),
      default_cta: workspaceContext.businessProfile?.default_cta || "Get My Quote",
    },
    { onConflict: "workspace_id" },
  );

  revalidateWorkspaceSettingsPaths();
  redirect("/workspace/settings?section=icon&saved=1");
}

export async function updateWorkspacePreviewAction(formData: FormData) {
  const { user, admin, workspaceContext } = await getWorkspaceSettingsActionContext();

  if (!admin || !workspaceContext) {
    redirect("/workspace/settings?section=preview&saved=1");
  }

  await admin.from("business_profiles").upsert(
    {
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
    },
    { onConflict: "workspace_id" },
  );

  revalidateWorkspaceSettingsPaths();
  redirect("/workspace/settings?section=preview&saved=1");
}

export async function updateWorkspaceFunnelsAction(formData: FormData) {
  const { user, admin, workspaceContext } = await getWorkspaceSettingsActionContext();

  if (!admin || !workspaceContext) {
    redirect("/workspace/settings?section=funnels&saved=1");
  }

  await admin.from("business_profiles").upsert(
    {
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
    },
    { onConflict: "workspace_id" },
  );

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
  const logoFile = formData.get("logo") as File;
  const logoUrl = await uploadAsset(logoFile, "logos");
  const workspaceName = String(formData.get("workspaceName") || formData.get("businessName") || "");

  await admin.from("business_profiles").upsert(
    {
      user_id: user.id,
      workspace_id: activeWorkspaceId,
      business_name: String(formData.get("businessName") || ""),
      location: String(formData.get("location") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      description: String(formData.get("description") || ""),
      logo_url: logoUrl || workspaceContext?.businessProfile?.logo_url || null,
      brand_color: String(formData.get("brandColor") || "#6D5EF8"),
      default_cta: String(formData.get("defaultCta") || "Get My Quote"),
    },
    { onConflict: "workspace_id" },
  );

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
  const existingUserMetadata =
    "user_metadata" in user && user.user_metadata && typeof user.user_metadata === "object"
      ? user.user_metadata
      : {};

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...existingUserMetadata,
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: fullName || null,
    },
  });

  const existingProfile = await admin.from("profiles").select("role").eq("user_id", user.id).maybeSingle();

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        role: existingProfile.data?.role || "user",
        first_name: firstName || null,
        last_name: lastName || null,
      },
      { onConflict: "user_id" },
    );

  if (profileError) {
    redirect(`/settings?error=${encodeURIComponent(formatAuthErrorMessage(profileError.message))}#account`);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/workspaces");
  revalidatePath("/workspace/settings");
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not refresh Meta assets.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/workspace/settings");
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
  } catch (error) {
    const message =
      error instanceof Error
        ? formatAuthErrorMessage(error.message)
        : "Could not save integration selections.";
    redirect(`/workspace/settings?section=integrations&error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/workspace/settings");
  revalidatePath("/templates/new");
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
      category: values.data.category || values.data.industry || "",
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

  const now = new Date().toISOString();
  const resolvedStatus =
    intent === "publish" ? "published" : intent === "archive" ? "archived" : intent === "draft" ? "draft" : values.data.status;
  const { error } = await admin
    .from("templates")
    .update({
      slug: values.data.slug,
      name: values.data.name,
      description: values.data.description,
      category: values.data.category || values.data.industry || "",
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

export async function publishFunnelAction(formData: FormData) {
  const funnelId = String(formData.get("funnelId") || "");

  if (isSupabaseServerConfigured()) {
    const admin = createSupabaseAdminClient();
    if (admin) {
      await admin
      .from("funnels")
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq("id", funnelId);
    }
  }

  revalidatePath("/dashboard");
  redirect(`/funnels/${funnelId}`);
}

export async function createSlugAction(name: string) {
  return slugify(name);
}
