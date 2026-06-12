import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { HomeHero } from "@/components/home-hero";
import { HomeStatement } from "@/components/home-statement";
import { HomeHowItWorks } from "@/components/home-how-it-works";
import { HomeWhyTemplates } from "@/components/home-why-templates";
import { HomeShowcase } from "@/components/home-showcase";
import { HomeCrmFlow } from "@/components/home-crm-flow";
import { HomeFinalCta } from "@/components/home-final-cta";

export default function HomePage() {
  return (
    <main className="public-site min-h-screen">
      <MarketingNav />
      <HomeHero />
      <HomeStatement />
      <HomeHowItWorks />
      <HomeWhyTemplates />
      <HomeShowcase />
      <HomeCrmFlow />
      <HomeFinalCta />
      <PublicSiteFooter />
    </main>
  );
}
