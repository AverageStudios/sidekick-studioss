import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { ensureCampaignDraft } from "@/lib/campaign-drafts";

const draftRequestSchema = z.object({
  draftId: z.string().uuid().optional(),
  templateSlug: z.string().min(1),
  state: z.record(z.string(), z.any()).default({}),
});

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

  try {
    const ensured = await ensureCampaignDraft({
      admin,
      userId: user.id,
      draftId: parsedBody.data.draftId,
      templateSlug: parsedBody.data.templateSlug,
      state: parsedBody.data.state,
    });

    return NextResponse.json({ draftId: ensured.draftId, saved: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Campaign draft could not be saved.",
      },
      { status: 500 },
    );
  }
}
