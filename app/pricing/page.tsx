import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PricingBase } from "@/components/ui/pricing-base";

export default function PricingPage() {
  return (
    <main className="public-site min-h-screen">
      <MarketingNav />
      <PricingBase />

      <PublicSiteFooter />
    </main>
  );
}
