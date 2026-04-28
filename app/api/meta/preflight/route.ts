import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { ensureCampaignDraft } from "@/lib/campaign-drafts";
import { runMetaLaunchPreflight } from "@/lib/meta-launch";

const preflightRequestSchema = z.object({
  campaignId: z.string().uuid().optional(),
  templateSlug: z.string().min(1).optional(),
  state: z.record(z.string(), z.any()).default({}),
  mode: z.enum(["draft", "live"]).default("draft"),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = preflightRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid preflight payload." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase admin access is not available." },
      { status: 500 },
    );
  }

  try {
    if (!parsed.data.templateSlug) {
      return NextResponse.json(
        { error: "Template is required to sync the latest launch state before preflight." },
        { status: 400 },
      );
    }

    const ensured = await ensureCampaignDraft({
      admin,
      userId: user.id,
      draftId: parsed.data.campaignId,
      templateSlug: parsed.data.templateSlug,
      state: parsed.data.state,
    });
    const campaignId = ensured.draftId;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign draft could not be created automatically." },
        { status: 400 },
      );
    }

    const preflight = await runMetaLaunchPreflight({
      admin,
      campaignId,
      userId: user.id,
      mode: parsed.data.mode,
    });
    return NextResponse.json({
      draftId: campaignId,
      ...preflight,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Preflight could not be completed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
