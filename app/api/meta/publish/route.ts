import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { ensureCampaignDraft } from "@/lib/campaign-drafts";
import {
  buildPublishRequestPayloadSummary,
  markMetaPublishJobResult,
  publishMetaFromPreflight,
  runMetaPreflightAndCreateJob,
} from "@/lib/meta-launch";

const publishRequestSchema = z.object({
  campaignId: z.string().uuid(),
  templateSlug: z.string().min(1).optional(),
  state: z.record(z.string(), z.any()).optional(),
  mode: z.enum(["draft", "live"]),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = publishRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid publish payload." },
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

  let jobId: string | null = null;
  try {
    let campaignId = parsed.data.campaignId;
    if (parsed.data.templateSlug && parsed.data.state) {
      const ensured = await ensureCampaignDraft({
        admin,
        userId: user.id,
        draftId: parsed.data.campaignId,
        templateSlug: parsed.data.templateSlug,
        state: parsed.data.state,
      });
      campaignId = ensured.draftId;
    }

    const preflightContext = await runMetaPreflightAndCreateJob({
      admin,
      campaignId,
      userId: user.id,
      mode: parsed.data.mode,
    });
    const { preflight } = preflightContext;
    jobId = preflightContext.jobId;

    if (preflight.blockingIssues.length) {
      return NextResponse.json(
        {
          preflight,
          jobId,
          error: "Preflight has blocking issues.",
        },
        { status: 400 },
      );
    }

    await markMetaPublishJobResult({
      admin,
      jobId,
      status: "publishing",
      metaRequest: buildPublishRequestPayloadSummary(preflight),
      metaResponse: {},
      externalIds: {},
      warnings: preflight.warnings,
    });

    const publishResult = await publishMetaFromPreflight({
      admin,
      campaignId,
      userId: user.id,
      mode: parsed.data.mode,
      preflight,
    });

    await markMetaPublishJobResult({
      admin,
      jobId,
      status: "published",
      metaRequest: buildPublishRequestPayloadSummary(preflight),
      metaResponse: {
        response: publishResult.metaResponses,
      },
      externalIds: publishResult.externalIds,
      warnings: publishResult.warnings,
    });

    if (parsed.data.mode === "live") {
      await admin
        .from("campaigns")
        .update({
          status: "published",
        })
        .eq("id", campaignId);
    }

    return NextResponse.json({
      jobId,
      preflight,
      publish: publishResult,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Publish failed.";
    if (jobId) {
      await markMetaPublishJobResult({
        admin,
        jobId,
        status: "failed",
        errorMessage: message,
      }).catch(() => null);
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
