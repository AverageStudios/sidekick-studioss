import { CampaignRecord } from "@/types";

export type CampaignMetaIdentifiers = {
  campaignId: string | null;
  adSetId: string | null;
  adId: string | null;
  leadFormId: string | null;
};

export type CampaignLifecycleState = "draft" | "active" | "paused" | "archived";

export function getCampaignMetaIdentifiers(campaign: Pick<CampaignRecord, "external_ids_json">): CampaignMetaIdentifiers {
  const externalIds =
    campaign.external_ids_json && typeof campaign.external_ids_json === "object"
      ? (campaign.external_ids_json as Record<string, unknown>)
      : {};

  return {
    campaignId: typeof externalIds.campaign_id === "string" ? externalIds.campaign_id : null,
    adSetId: typeof externalIds.adset_id === "string" ? externalIds.adset_id : null,
    adId: typeof externalIds.ad_id === "string" ? externalIds.ad_id : null,
    leadFormId: typeof externalIds.lead_form_id === "string" ? externalIds.lead_form_id : null,
  };
}

export function getCampaignLifecycleState(
  campaign: Pick<CampaignRecord, "status" | "external_publish_status" | "archived_at">,
): CampaignLifecycleState {
  if (campaign.status === "archived" || campaign.archived_at) {
    return "archived";
  }

  if (campaign.status === "draft") {
    return "draft";
  }

  const externalStatus = (campaign.external_publish_status || "").toLowerCase();
  if (externalStatus === "archived") {
    return "archived";
  }
  if (externalStatus === "paused" || externalStatus === "draft_paused") {
    return "paused";
  }

  return "active";
}

export function getCampaignLifecycleLabel(campaign: Pick<CampaignRecord, "status" | "external_publish_status" | "archived_at">) {
  const state = getCampaignLifecycleState(campaign);
  switch (state) {
    case "draft":
      return "Draft";
    case "paused":
      return "Paused";
    case "archived":
      return "Archived";
    case "active":
    default:
      return "Active";
  }
}
