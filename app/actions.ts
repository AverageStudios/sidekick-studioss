"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { authSuccessMessages, formatAuthErrorMessage } from "@/lib/auth-messages";
import { createCampaignBlueprint } from "@/lib/template-engine";
import { env, isSupabasePublicConfigured, isSupabaseServerConfigured } from "@/lib/env";
import { getPublishedTemplateBySlug } from "@/lib/template-repository";
import { slugify } from "@/lib/utils";
import { sendLeadConfirmationEmail } from "@/services/follow-up";
import { uploadAsset } from "@/services/storage";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function signUpAction(formData: FormData) {
  const values = authSchema.safeParse({
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  });

  if (!values.success) {
    const message = values.error.issues[0]?.message || "Enter a valid email and password.";
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
    ...values.data,
    options: {
      emailRedirectTo: `${env.appUrl}/auth/callback?next=/login`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(formatAuthErrorMessage(error.message))}`);
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirect(`/signup/confirm?email=${encodeURIComponent(values.data.email)}`);
}

export async function signInAction(formData: FormData) {
  const values = authSchema.safeParse({
    email: String(formData.get("email") || ""),
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

export async function createCampaignAction(formData: FormData) {
  const user = await getCurrentUser();
  const templateSlug = String(formData.get("templateSlug") || "");
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

  await admin
    .from("business_profiles")
    .upsert(
      {
        user_id: user.id,
        business_name: values.businessName,
        location: values.city,
        phone: values.phone,
        email: values.email,
        description: values.businessDescription,
        logo_url: logoUrl,
        brand_color: values.brandColor,
        default_cta: values.ctaText,
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  const { data: campaign, error: campaignError } = await admin
    .from("campaigns")
    .insert({
      user_id: user.id,
      template_id: template.id,
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
      status: "published",
    })
    .select()
    .single();

  if (campaignError || !campaign) {
    redirect(`/templates/${template.slug}?error=${encodeURIComponent(campaignError?.message || "Could not create campaign")}`);
  }

  await Promise.all([
    admin.from("funnels").insert({
      user_id: user.id,
      campaign_id: campaign.id,
      slug: blueprint.slug,
      is_published: true,
      published_at: new Date().toISOString(),
      config_json: blueprint.funnelConfig,
    }),
    admin.from("follow_up_settings").upsert(
      {
        user_id: user.id,
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

    await admin.from("leads").insert({
      user_id: payload.userId,
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
  const logoFile = formData.get("logo") as File;
  const logoUrl = await uploadAsset(logoFile, "logos");

  await admin.from("business_profiles").upsert(
    {
      user_id: user.id,
      business_name: String(formData.get("businessName") || ""),
      location: String(formData.get("location") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      description: String(formData.get("description") || ""),
      logo_url: logoUrl || null,
      brand_color: String(formData.get("brandColor") || "#6D5EF8"),
      default_cta: String(formData.get("defaultCta") || "Get My Quote"),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/settings");
  redirect("/settings?saved=1");
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
