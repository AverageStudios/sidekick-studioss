import { LeadRecord, LeadStatus } from "@/types";

export const leadStatusOptions = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "closed", label: "Closed" },
  { id: "archived", label: "Archived" },
] as const satisfies ReadonlyArray<{ id: Exclude<LeadStatus, "booked">; label: string }>;

export type CanonicalLeadStatus = typeof leadStatusOptions[number]["id"];

export type LeadFieldAnswer = {
  key: string;
  label: string;
  values: string[];
};

export function getCanonicalLeadStatus(status: LeadStatus | string | null | undefined): CanonicalLeadStatus {
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

export function getLeadStatusLabel(status: LeadStatus | string | null | undefined) {
  const canonical = getCanonicalLeadStatus(status);
  return leadStatusOptions.find((option) => option.id === canonical)?.label || "New";
}

export function getLeadDisplayName(lead: Pick<LeadRecord, "full_name" | "name" | "email" | "phone" | "meta_lead_id">) {
  return (
    lead.full_name?.trim() ||
    lead.name?.trim() ||
    lead.email?.trim() ||
    lead.phone?.trim() ||
    (lead.meta_lead_id ? `Lead ${lead.meta_lead_id}` : "Unnamed lead")
  );
}

export function getLeadSubmittedAt(lead: Pick<LeadRecord, "meta_created_time" | "created_at">) {
  return lead.meta_created_time || lead.created_at;
}

export function getLeadContactSummary(lead: Pick<LeadRecord, "email" | "phone">) {
  return [lead.email?.trim(), lead.phone?.trim()].filter(Boolean).join(" • ");
}

export function coerceFieldAnswers(value: unknown): LeadFieldAnswer[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const key = typeof record.key === "string" ? record.key : typeof record.name === "string" ? record.name : "";
      const label = typeof record.label === "string" ? record.label : key;
      const values = Array.isArray(record.values)
        ? record.values.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
        : [];

      if (!key && !label && !values.length) return null;

      return {
        key: key || label || "field",
        label: label || key || "Field",
        values,
      } satisfies LeadFieldAnswer;
    })
    .filter((entry): entry is LeadFieldAnswer => Boolean(entry));
}

export function formatLeadSearchValue(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}
