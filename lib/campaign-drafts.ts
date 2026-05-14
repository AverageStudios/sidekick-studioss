import { randomUUID } from "crypto";
import { getPublishedTemplateBySlug } from "@/lib/template-repository";
import { createCampaignBlueprint } from "@/lib/template-engine";
import { getTemplateSetupValuesFromLaunchState, normalizeCampaignLaunchState } from "@/lib/campaign-launch";
import { persistCampaignLaunchSnapshot } from "@/lib/campaign-snapshots";
import { slugify } from "@/lib/utils";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";
import { CampaignLaunchState } from "@/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

const optionalCampaignColumns = new Set([
  "workspace_id",
  "launch_platform",
  "launch_category",
  "launch_industry",
  "launch_offer_type",
  "launch_state_json",
]);

function buildDraftSlug(base: string) {
  return `${slugify(base)}-${randomUUID().slice(0, 8)}`;
}

function throwIfSupabaseError(result: unknown, contextLabel: string) {
  if (!result || typeof result !== "object" || !("error" in result)) return;
  const error = (result as { error?: { message?: string } }).error;
  if (error?.message) {
    throw new Error(`${contextLabel}: ${error.message}`);
  }
}

function getMissingSchemaColumn(message?: string) {
  if (!message) return null;
  const match = message.match(/Could not find the '([^']+)' column of 'campaigns'/i);
  return match?.[1] || null;
}

async function updateCampaignWithSchemaFallback(
  admin: SupabaseAdmin,
  campaignId: string,
  userId: string,
  payload: Record<string, unknown>,
) {
  const nextPayload = { ...payload };

  while (true) {
    const { error } = await admin
      .from("campaigns")
      .update(nextPayload)
      .eq("id", campaignId)
      .eq("user_id", userId);

    if (!error) {
      return;
    }

    const missingColumn = getMissingSchemaColumn(error.message);
    if (!missingColumn || !optionalCampaignColumns.has(missingColumn) || !(missingColumn in nextPayload)) {
      throw new Error(error.message);
    }

    delete nextPayload[missingColumn];
  }
}

async function insertCampaignWithSchemaFallback(
  admin: SupabaseAdmin,
  payload: Record<string, unknown>,
) {
  const nextPayload = { ...payload };

  while (true) {
    const result = await admin
      .from("campaigns")
      .insert(nextPayload)
      .select("id")
      .single();

    if (!result.error && result.data) {
      return result.data;
    }

    const missingColumn = getMissingSchemaColumn(result.error?.message);
    if (!missingColumn || !optionalCampaignColumns.has(missingColumn) || !(missingColumn in nextPayload)) {
      throw new Error(result.error?.message || "Campaign draft could not be created.");
    }

    delete nextPayload[missingColumn];
  }
}

export async function ensureCampaignDraft({
  admin,
  userId,
  draftId,
  templateSlug,
  state,
}: {
  admin: SupabaseAdmin;
  userId: string;
  draftId?: string | null;
  templateSlug: string;
  state: Record<string, unknown>;
}) {
  const template = await getPublishedTemplateBySlug(templateSlug);
  if (!template) {
    throw new Error("Template could not be found.");
  }

  const workspaceContext = await ensureWorkspaceContextForUser({ id: userId } as { id: string });
  const workspaceId = workspaceContext?.activeWorkspace.id || null;
  const launchState = normalizeCampaignLaunchState(
    state,
    template,
    workspaceContext?.businessProfile || null,
  );
  const templateValues = getTemplateSetupValuesFromLaunchState(
    template,
    launchState,
    workspaceContext?.businessProfile || null,
  );
  const blueprint = createCampaignBlueprint(template, templateValues, {
    logoUrl: workspaceContext?.businessProfile?.logo_url || null,
    beforeImageUrls: [],
    afterImageUrls: [],
  });
  const baseCampaignName = launchState.campaign.name || blueprint.campaignName;

  if (draftId) {
    const { data: existingDraft } = await admin
      .from("campaigns")
      .select("id, slug")
      .eq("id", draftId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingDraft) {
      throw new Error("Campaign draft could not be found.");
    }

    await updateCampaignWithSchemaFallback(admin, existingDraft.id, userId, {
      workspace_id: workspaceId,
      template_id: template.id,
      launch_platform: launchState.platform,
      launch_category: launchState.selection.category || template.industry || template.category,
      launch_industry: launchState.selection.industry || template.industry || template.category,
      launch_offer_type: launchState.selection.offerType || template.offerType || null,
      name: baseCampaignName,
      offer_price: Number(templateValues.offerPrice) || null,
      regular_price: Number(templateValues.regularPrice) || null,
      cta_text: templateValues.ctaText,
      headline: blueprint.funnelConfig.headline,
      subheadline: blueprint.funnelConfig.subheadline,
      business_description: templateValues.businessDescription,
      testimonial_text: blueprint.funnelConfig.testimonialText,
      before_images_json: blueprint.funnelConfig.beforeImageUrls,
      after_images_json: blueprint.funnelConfig.afterImageUrls,
      ad_copy_json: blueprint.adCopy,
      launch_state_json: launchState,
      status: "draft",
    });

    const results = await Promise.all([
      admin
        .from("funnels")
        .update({
          workspace_id: workspaceId,
          config_json: blueprint.funnelConfig,
          is_published: false,
          published_at: null,
        })
        .eq("campaign_id", existingDraft.id)
        .eq("user_id", userId),
      admin.from("follow_up_settings").upsert(
        {
          user_id: userId,
          workspace_id: workspaceId,
          campaign_id: existingDraft.id,
          email_enabled: true,
          sms_enabled: false,
          confirmation_subject: `Thanks for contacting ${templateValues.businessName}`,
          confirmation_body: "We got your request and will follow up shortly.",
        },
        { onConflict: "campaign_id" },
      ),
      persistCampaignLaunchSnapshot({
        admin,
        campaignId: existingDraft.id,
        workspaceId,
        templateSlug: template.slug,
        state: launchState as CampaignLaunchState,
        createdBy: userId,
      }),
    ]);
    throwIfSupabaseError(results[0], "Funnel update failed");
    throwIfSupabaseError(results[1], "Follow-up settings update failed");

    return { draftId: existingDraft.id, launchState, template };
  }

  const slug = buildDraftSlug(baseCampaignName || `${template.name} draft`);

  const campaign = await insertCampaignWithSchemaFallback(admin, {
    user_id: userId,
    workspace_id: workspaceId,
    template_id: template.id,
    launch_platform: launchState.platform,
    launch_category: launchState.selection.category || template.industry || template.category,
    launch_industry: launchState.selection.industry || template.industry || template.category,
    launch_offer_type: launchState.selection.offerType || template.offerType || null,
    name: baseCampaignName,
    slug,
    offer_price: Number(templateValues.offerPrice) || null,
    regular_price: Number(templateValues.regularPrice) || null,
    cta_text: templateValues.ctaText,
    headline: blueprint.funnelConfig.headline,
    subheadline: blueprint.funnelConfig.subheadline,
    business_description: templateValues.businessDescription,
    testimonial_text: blueprint.funnelConfig.testimonialText,
    before_images_json: blueprint.funnelConfig.beforeImageUrls,
    after_images_json: blueprint.funnelConfig.afterImageUrls,
    ad_copy_json: blueprint.adCopy,
    launch_state_json: launchState,
    status: "draft",
  });

  const results = await Promise.all([
    admin.from("funnels").insert({
      user_id: userId,
      workspace_id: workspaceId,
      campaign_id: campaign.id,
      slug,
      is_published: false,
      published_at: null,
      config_json: blueprint.funnelConfig,
    }),
    admin.from("follow_up_settings").upsert(
      {
        user_id: userId,
        workspace_id: workspaceId,
        campaign_id: campaign.id,
        email_enabled: true,
        sms_enabled: false,
        confirmation_subject: `Thanks for contacting ${templateValues.businessName}`,
        confirmation_body: "We got your request and will follow up shortly.",
      },
      { onConflict: "campaign_id" },
    ),
    persistCampaignLaunchSnapshot({
      admin,
      campaignId: campaign.id,
      workspaceId,
      templateSlug: template.slug,
      state: launchState as CampaignLaunchState,
      createdBy: userId,
    }),
  ]);
  throwIfSupabaseError(results[0], "Funnel create failed");
  throwIfSupabaseError(results[1], "Follow-up settings create failed");

  return { draftId: campaign.id, launchState, template };
}
