type CampaignLike = {
  status: "draft" | "published" | "archived";
  archived_at?: string | null;
  external_publish_status?: string | null;
  meta_effective_status?: string | null;
  meta_configured_status?: string | null;
};

type LeadLike = {
  created_at: string;
  meta_created_time?: string | null;
  status: string;
};

type CampaignLifecycleState = "draft" | "active" | "paused" | "in_review" | "archived" | "unknown";

export type LeadStatusCounts = {
  total: number;
  newCount: number;
  contactedCount: number;
  qualifiedCount: number;
  closedCount: number;
};

export type LeadBucket = {
  label: string;
  total: number;
  newCount: number;
  contactedCount: number;
  qualifiedCount: number;
  closedCount: number;
};

export type CampaignLifecycleSummary = {
  total: number;
  active: number;
  paused: number;
  draft: number;
  archived: number;
  inReview: number;
  unknown: number;
};

function normalizeMetaLifecycleStatus(input?: string | null) {
  const normalized = (input || "").trim().toUpperCase();
  if (!normalized) return null;
  if (
    normalized.includes("ARCHIVED") ||
    normalized.includes("DELETED") ||
    normalized === "WITH_ISSUES"
  ) {
    return "archived";
  }
  if (normalized.includes("PAUSED")) {
    return "paused";
  }
  if (
    normalized === "IN_PROCESS" ||
    normalized === "PENDING_REVIEW" ||
    normalized === "PENDING_BILLING_INFO" ||
    normalized === "PREAPPROVED" ||
    normalized === "PENDING_PROCESSING"
  ) {
    return "in_review";
  }
  if (normalized === "ACTIVE") {
    return "active";
  }
  return "unknown";
}

export function getCampaignLifecycleState(campaign: CampaignLike): CampaignLifecycleState {
  if (campaign.status === "archived" || campaign.archived_at) {
    return "archived";
  }

  if (campaign.status === "draft") {
    return "draft";
  }

  const externalStatus = normalizeMetaLifecycleStatus(campaign.external_publish_status || "");
  if (externalStatus && externalStatus !== "unknown") {
    return externalStatus;
  }

  const effectiveStatus = normalizeMetaLifecycleStatus(campaign.meta_effective_status || "");
  if (effectiveStatus && effectiveStatus !== "unknown") {
    return effectiveStatus;
  }

  const configuredStatus = normalizeMetaLifecycleStatus(campaign.meta_configured_status || "");
  if (configuredStatus && configuredStatus !== "unknown") {
    return configuredStatus;
  }

  return campaign.status === "published" ? "unknown" : "active";
}

export function getCanonicalLeadStatus(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "contacted":
      return "contacted";
    case "qualified":
    case "booked":
      return "qualified";
    case "closed":
      return "closed";
    case "archived":
      return "archived";
    case "new":
    default:
      return "new";
  }
}

export function getLeadSubmittedAt(lead: Pick<LeadLike, "meta_created_time" | "created_at">) {
  return lead.meta_created_time || lead.created_at;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isFiniteDate(value: string | null | undefined) {
  if (!value) return false;
  return Number.isFinite(new Date(value).getTime());
}

export function parseMetricNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function countLeadsByStatus(leads: LeadLike[]): LeadStatusCounts {
  return leads.reduce<LeadStatusCounts>(
    (counts, lead) => {
      counts.total += 1;
      const status = getCanonicalLeadStatus(lead.status);
      if (status === "new") counts.newCount += 1;
      if (status === "contacted") counts.contactedCount += 1;
      if (status === "qualified") counts.qualifiedCount += 1;
      if (status === "closed") counts.closedCount += 1;
      return counts;
    },
    {
      total: 0,
      newCount: 0,
      contactedCount: 0,
      qualifiedCount: 0,
      closedCount: 0,
    },
  );
}

export function countLeadsInPastDays(
  leads: Pick<LeadLike, "created_at" | "meta_created_time">[],
  days: number,
  now = new Date(),
) {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return leads.filter((lead) => {
    const submittedAt = new Date(getLeadSubmittedAt(lead)).getTime();
    return Number.isFinite(submittedAt) && submittedAt >= cutoff;
  }).length;
}

export function summarizeCampaignLifecycles(campaigns: CampaignLike[]): CampaignLifecycleSummary {
  return campaigns.reduce<CampaignLifecycleSummary>(
    (summary, campaign) => {
      summary.total += 1;
      const state = getCampaignLifecycleState(campaign);
      if (state === "active") summary.active += 1;
      else if (state === "paused") summary.paused += 1;
      else if (state === "draft") summary.draft += 1;
      else if (state === "archived") summary.archived += 1;
      else if (state === "in_review") summary.inReview += 1;
      else summary.unknown += 1;
      return summary;
    },
    {
      total: 0,
      active: 0,
      paused: 0,
      draft: 0,
      archived: 0,
      inReview: 0,
      unknown: 0,
    },
  );
}

export function buildLeadBuckets(leads: LeadLike[], weeks = 8, now = new Date()): LeadBucket[] {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const currentWeekStart = startOfWeek(now);

  return Array.from({ length: weeks }, (_, index) => {
    const start = addDays(currentWeekStart, (index - (weeks - 1)) * 7);
    const end = addDays(start, 7);
    const bucketLeads = leads.filter((lead) => {
      const submittedAt = new Date(getLeadSubmittedAt(lead));
      const timestamp = submittedAt.getTime();
      return Number.isFinite(timestamp) && submittedAt >= start && submittedAt < end;
    });

    const counts = countLeadsByStatus(bucketLeads);

    return {
      label: formatter.format(start),
      total: counts.total,
      newCount: counts.newCount,
      contactedCount: counts.contactedCount,
      qualifiedCount: counts.qualifiedCount,
      closedCount: counts.closedCount,
    };
  });
}

export function getSafePercentage(numerator: number, denominator: number, digits = 0) {
  if (!denominator || denominator <= 0) return 0;
  const value = (numerator / denominator) * 100;
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function getSafeAverage(total: number, count: number, digits = 1) {
  if (!count || count <= 0) return 0;
  const value = total / count;
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function formatMetricDate(value: string | null | undefined) {
  if (!isFiniteDate(value)) return "—";
  const date = new Date(value as string);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
