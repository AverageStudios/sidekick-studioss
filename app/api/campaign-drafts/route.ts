import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";
import { getPublishedTemplateBySlug } from "@/lib/template-repository";
import { createCampaignBlueprint } from "@/lib/template-engine";
import { normalizeCampaignLaunchState, getTemplateSetupValuesFromLaunchState } from "@/lib/campaign-launch";
import { persistCampaignLaunchSnapshot } from "@/lib/campaign-snapshots";
import { slugify } from "@/lib/utils";

const draftRequestSchema = z.object({
  draftId: z.string().uuid().optional(),
  templateSlug: z.string().min(1),
  state: z.record(z.string(), z.any()).default({}),
});

function buildDraftSlug(base: string) {
  return `${slugify(base)}-${randomUUID().slice(0, 8)}`;
}

function throwIfSupabaseError(
  result: unknown,
  contextLabel: string,
) {
  if (!result || typeof result !== "object" || !("error" in result)) return;
  const error = (result as { error?: { message?: string } }).error;
  if (error?.message) {
    throw new Error(`${contextLabel}: ${error.message}`);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = draftRequestSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid campaign draft payload." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase admin access is not available." }, { status: 500 });
  }

  const template = await getPublishedTemplateBySlug(parsedBody.data.templateSlug);
  if (!template) {
    return NextResponse.json({ error: "Template could not be found." }, { status: 404 });
  }

  const workspaceContext = await ensureWorkspaceContextForUser(user);
  const workspaceId = workspaceContext?.activeWorkspace.id || null;
  const launchState = normalizeCampaignLaunchState(parsedBody.data.state, template, workspaceContext?.businessProfile || null);
  const templateValues = getTemplateSetupValuesFromLaunchState(template, launchState, workspaceContext?.businessProfile || null);
  const blueprint = createCampaignBlueprint(template, templateValues, {
    logoUrl: workspaceContext?.businessProfile?.logo_url || null,
    beforeImageUrls: [],
    afterImageUrls: [],
  });

  const baseCampaignName = launchState.advanced.campaignName || blueprint.campaignName;

  if (parsedBody.data.draftId) {
    const { data: existingDraft } = await admin
      .from("campaigns")
      .select("id, slug")
      .eq("id", parsedBody.data.draftId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingDraft) {
      return NextResponse.json({ error: "Campaign draft could not be found." }, { status: 404 });
    }

    const { error: campaignError } = await admin
      .from("campaigns")
      .update({
        workspace_id: workspaceId,
        template_id: template.id,
        launch_platform: launchState.platform,
        launch_category: launchState.category || template.category,
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
      })
      .eq("id", existingDraft.id)
      .eq("user_id", user.id);

    if (campaignError) {
      return NextResponse.json({ error: campaignError.message }, { status: 500 });
    }

    try {
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
          .eq("user_id", user.id),
        admin.from("follow_up_settings").upsert(
          {
            user_id: user.id,
            workspace_id: workspaceId,
            campaign_id: existingDraft.id,
            email_enabled: true,
            sms_enabled: false,
            confirmation_subject: `Thanks for contacting ${templateValues.businessName}`,
            confirmation_body: `We got your request and will follow up shortly.`,
          },
          { onConflict: "campaign_id" },
        ),
        persistCampaignLaunchSnapshot({
          admin,
          campaignId: existingDraft.id,
          workspaceId,
          templateSlug: template.slug,
          state: launchState,
          createdBy: user.id,
        }),
      ]);
      throwIfSupabaseError(results[0], "Funnel update failed");
      throwIfSupabaseError(results[1], "Follow-up settings update failed");
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Campaign draft snapshot could not be saved.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ draftId: existingDraft.id, saved: true });
  }

  const slug = buildDraftSlug(baseCampaignName || `${template.name} draft`);

  const { data: campaign, error: campaignError } = await admin
    .from("campaigns")
    .insert({
      user_id: user.id,
      workspace_id: workspaceId,
      template_id: template.id,
      launch_platform: launchState.platform,
      launch_category: launchState.category || template.category,
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
    })
    .select("id")
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: campaignError?.message || "Campaign draft could not be created." }, { status: 500 });
  }

  try {
    const results = await Promise.all([
      admin.from("funnels").insert({
        user_id: user.id,
        workspace_id: workspaceId,
        campaign_id: campaign.id,
        slug,
        is_published: false,
        published_at: null,
        config_json: blueprint.funnelConfig,
      }),
      admin.from("follow_up_settings").upsert(
        {
          user_id: user.id,
          workspace_id: workspaceId,
          campaign_id: campaign.id,
          email_enabled: true,
          sms_enabled: false,
          confirmation_subject: `Thanks for contacting ${templateValues.businessName}`,
          confirmation_body: `We got your request and will follow up shortly.`,
        },
        { onConflict: "campaign_id" },
      ),
      persistCampaignLaunchSnapshot({
        admin,
        campaignId: campaign.id,
        workspaceId,
        templateSlug: template.slug,
        state: launchState,
        createdBy: user.id,
      }),
    ]);
    throwIfSupabaseError(results[0], "Funnel create failed");
    throwIfSupabaseError(results[1], "Follow-up settings create failed");
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Campaign draft snapshot could not be saved.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ draftId: campaign.id, saved: true });
}
