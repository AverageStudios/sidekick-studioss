import { CrmProvider } from "@/types";

export type CrmProviderMetadata = {
  key: CrmProvider;
  label: string;
  shortDescription: string;
  shortCode: string;
  logoPath?: string;
  visibleInSelection?: boolean;
  accentClassName: string;
  surfaceClassName: string;
  connectPath: string;
  requiresConfig?: boolean;
  configLabel?: string;
};

export const crmProviderMetadataList: CrmProviderMetadata[] = [
  {
    key: "gohighlevel",
    label: "GoHighLevel",
    shortDescription: "Send leads into GoHighLevel contacts and follow-up workflows.",
    shortCode: "GHL",
    logoPath: "/crm-logos/gohighlevel.png",
    visibleInSelection: false,
    accentClassName: "text-sky-700",
    surfaceClassName: "bg-sky-100",
    connectPath: "/api/integrations/crm/connect?provider=gohighlevel",
  },
  {
    key: "pipedrive",
    label: "Pipedrive",
    shortDescription: "Create people and leads inside your Pipedrive sales pipeline.",
    shortCode: "PD",
    logoPath: "/crm-logos/pipedrive.png",
    accentClassName: "text-emerald-700",
    surfaceClassName: "bg-emerald-100",
    connectPath: "/api/integrations/pipedrive/connect",
  },
  {
    key: "hubspot",
    label: "HubSpot",
    shortDescription: "Send captured leads into HubSpot as contacts.",
    shortCode: "HS",
    logoPath: "/crm-logos/hubspot.svg",
    visibleInSelection: false,
    accentClassName: "text-orange-700",
    surfaceClassName: "bg-orange-100",
    connectPath: "/api/integrations/hubspot/connect",
  },
  {
    key: "zoho",
    label: "Zoho CRM",
    shortDescription: "Create new leads inside Zoho CRM.",
    shortCode: "ZO",
    logoPath: "/crm-logos/zoho-crm.svg",
    accentClassName: "text-red-700",
    surfaceClassName: "bg-rose-100",
    connectPath: "/api/integrations/zoho/connect",
  },
  {
    key: "freshsales",
    label: "Freshsales / Freshworks CRM",
    shortDescription: "Send leads into Freshsales contacts.",
    shortCode: "FS",
    logoPath: "/crm-logos/freshworks.webp",
    visibleInSelection: false,
    accentClassName: "text-teal-700",
    surfaceClassName: "bg-teal-100",
    connectPath: "/api/integrations/freshsales/connect",
  },
  {
    key: "monday",
    label: "Monday CRM",
    shortDescription: "Create lead items inside a selected monday board.",
    shortCode: "M",
    logoPath: "/crm-logos/monday-crm.svg",
    accentClassName: "text-fuchsia-700",
    surfaceClassName: "bg-fuchsia-100",
    connectPath: "/api/integrations/monday/connect",
    requiresConfig: true,
    configLabel: "Board selection required",
  },
  {
    key: "keap",
    label: "Keap",
    shortDescription: "Send new leads into Keap contacts.",
    shortCode: "K",
    logoPath: "/crm-logos/keap.png",
    visibleInSelection: true,
    accentClassName: "text-lime-700",
    surfaceClassName: "bg-lime-100",
    connectPath: "/api/integrations/keap/connect",
  },
  {
    key: "salesforce",
    label: "Salesforce",
    shortDescription: "Create new Salesforce leads from SideKick.",
    shortCode: "SF",
    logoPath: "/crm-logos/salesforce.ico",
    accentClassName: "text-blue-700",
    surfaceClassName: "bg-blue-100",
    connectPath: "/api/integrations/salesforce/connect",
  },
];

export function getCrmProviderMetadata(provider: CrmProvider) {
  return crmProviderMetadataList.find((item) => item.key === provider) || null;
}

export function buildCrmProviderConnectHref(provider: CrmProvider, nextPath?: string | null) {
  const metadata = getCrmProviderMetadata(provider);
  if (!metadata) return "#";

  const href = new URL(metadata.connectPath, "http://localhost");
  if (nextPath?.startsWith("/")) {
    href.searchParams.set("next", nextPath);
  }

  return `${href.pathname}${href.search}`;
}

export function buildCrmProviderManageHref(provider: CrmProvider) {
  return `/workspace/settings/integrations/crm?provider=${encodeURIComponent(provider)}`;
}

export function getVisibleCrmProviderMetadataList() {
  return crmProviderMetadataList.filter((provider) => provider.visibleInSelection !== false);
}
