import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { HomeFinalCta } from "@/components/home-final-cta";
import { SupportedCrmsSection } from "@/components/supported-crms-section";

export const metadata: Metadata = {
  title: "Supported CRMs | SideKick Studioss",
  description:
    "SideKick keeps new campaign leads organized in your workspace, then sends them to your connected CRM. Supported CRMs include Pipedrive, Zoho CRM, monday CRM, Keap, and Close.",
};

export default function SupportedCrmsPage() {
  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <SupportedCrmsSection className="pb-20 pt-36 sm:pb-24 sm:pt-44" showCta={false} />

      <HomeFinalCta
        title="Launch the campaign, keep the CRM you already use."
        subtitle="Apply for Done-For-You and we can help set up the lead flow, or use Self-Serve to connect your CRM yourself."
      />

      <PublicSiteFooter />
    </main>
  );
}
