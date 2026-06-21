export type SupportedCrm = {
  name: string;
  description: string;
  logoPath: string;
  shortCode: string;
};

// The CRMs SideKick currently supports on the public website. This mirrors the
// providers marked `visibleInSelection !== false` in lib/crm-providers.ts. The
// public site shows these as "Supported"; the logged-in app shows per-workspace
// connection state ("Not connected") based on lib/crm-providers + workspace data.
export const supportedCrms: SupportedCrm[] = [
  {
    name: "Pipedrive",
    description: "Create people and leads inside your Pipedrive sales pipeline.",
    logoPath: "/crm-logos/pipedrive.png",
    shortCode: "PD",
  },
  {
    name: "Zoho CRM",
    description: "Create new leads inside Zoho CRM.",
    logoPath: "/crm-logos/zoho-crm.svg",
    shortCode: "ZO",
  },
  {
    name: "monday CRM",
    description: "Create lead items inside a selected monday board.",
    logoPath: "/crm-logos/monday-crm.svg",
    shortCode: "M",
  },
  {
    name: "Keap",
    description: "Send new leads into Keap contacts.",
    logoPath: "/crm-logos/keap.png",
    shortCode: "K",
  },
  {
    name: "Close CRM",
    description: "Create Close leads with contact details from SideKick.",
    logoPath: "/crm-logos/close-crm.svg",
    shortCode: "C",
  },
];

// Reusable sentence fragment for inline copy across the public site.
export const supportedCrmsSentence =
  "Pipedrive, Zoho CRM, monday CRM, Keap, and Close";
