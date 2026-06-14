import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { ensureCampaignDraft } from "@/lib/campaign-drafts";
import { logRouteError, readJsonBody } from "@/lib/api-security";
import { checkRateLimit, createRateLimitResponse, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";
import {
  buildPublishRequestPayloadSummary,
  markMetaPublishJobResult,
  publishMetaFromPreflight,
  summarizeMetaError,
  type MetaLaunchPreflight,
  runMetaPreflightAndCreateJob,
} from "@/lib/meta-launch";

const optionalCampaignColumns = new Set([
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
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
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

const publishRequestSchema = z.object({
  campaignId: z.string().uuid(),
  templateSlug: z.string().trim().min(1).max(160).optional(),
  state: z.record(z.string(), z.any()).optional(),
  mode: z.enum(["draft", "live"]),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getIpFromRequest(request);
  const rateLimit = await checkRateLimit({
    key: "api:meta-publish",
    limit: 5,
    windowMs: 60 * 1000,
    identifiers: { ip, userId: user.id },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({
      key: "api:meta-publish",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      matchedOn: rateLimit.matchedOn,
      ip,
      userId: user.id,
    });
    return createRateLimitResponse(undefined, rateLimit.retryAfterSeconds);
  }

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = publishRequestSchema.safeParse(body);
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
  let preflight: MetaLaunchPreflight | null = null;
  let campaignId = parsed.data.campaignId;
  try {
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
    preflight = preflightContext.preflight;
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
      const persistedIds = {
        meta_campaign_id:
          typeof publishResult.externalIds?.campaign_id === "string" ? publishResult.externalIds.campaign_id : null,
        meta_adset_id:
          typeof publishResult.externalIds?.adset_id === "string" ? publishResult.externalIds.adset_id : null,
        meta_ad_id:
          typeof publishResult.externalIds?.ad_id === "string" ? publishResult.externalIds.ad_id : null,
        meta_lead_form_id:
          typeof publishResult.externalIds?.lead_form_id === "string" ? publishResult.externalIds.lead_form_id : null,
        meta_creative_id:
          typeof publishResult.externalIds?.creative_id === "string" ? publishResult.externalIds.creative_id : null,
      };
      await updateCampaignWithSchemaFallback(admin, campaignId, {
          status: "published",
          ...persistedIds,
      });

      console.info("[meta publish] campaign record updated after publish", {
        campaignId,
        persistedIds,
      });
    }

    return NextResponse.json({
      jobId,
      preflight,
      publish: publishResult,
    });
  } catch (error) {
    const metaError = summarizeMetaError(error);
    const blameField = Array.isArray(metaError.blameFieldSpecs) && metaError.blameFieldSpecs.length
      ? metaError.blameFieldSpecs[0].join(".")
      : null;
    const metaDetail =
      metaError.userTitle && metaError.userMessage
        ? `${metaError.userTitle}: ${metaError.userMessage}`
        : metaError.userMessage || metaError.userTitle || metaError.message;
    const message =
      metaError.subcode === 1892019
        ? "Meta rejected the lead form name because it already exists. The app now generates unique lead form names automatically, so retry the launch."
        : metaError.stage === "campaign_create" && metaError.subcode
          ? `Meta rejected campaign creation (${metaError.subcode}): ${metaDetail}`
          : metaError.stage === "campaign_create" && metaDetail
            ? `Meta rejected campaign creation: ${metaDetail}`
        : metaError.stage === "adset_create" && /location/i.test(metaError.message)
          ? `Meta rejected ad set targeting: ${metaDetail}`
        : metaError.stage === "adset_create" && metaDetail
            ? `Meta rejected ad set creation: ${metaDetail}`
        : blameField && /invalid parameter/i.test(metaError.message)
        ? `Meta rejected the publish payload at ${metaError.stage || "publish"} (${blameField}). Review the highlighted launch settings and try again.`
        : "Publish failed. Review the launch settings and try again.";
    logRouteError("meta publish", error);
    if (jobId) {
      await markMetaPublishJobResult({
        admin,
        jobId,
        status: "failed",
        metaRequest: preflight ? buildPublishRequestPayloadSummary(preflight) : undefined,
        metaResponse: {
          error: metaError,
        },
        errorMessage: message,
      }).catch(() => null);
    }
    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 },
    );
  }
}
