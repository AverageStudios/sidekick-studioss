import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { runMetaLaunchPreflight } from "@/lib/meta-launch";

const preflightRequestSchema = z.object({
  campaignId: z.string().uuid(),
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
    const preflight = await runMetaLaunchPreflight({
      admin,
      campaignId: parsed.data.campaignId,
      userId: user.id,
      mode: parsed.data.mode,
    });
    return NextResponse.json(preflight);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Preflight could not be completed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
