import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PricingBase } from "@/components/ui/pricing-base";
import { getCurrentUser } from "@/lib/auth";
import { getBillingDisplayState, getUserBillingStatus } from "@/lib/billing";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ startTrial?: string; checkout?: string }>;
}) {
  const user = await getCurrentUser();
  const [{ checkout }, billingStatus] = await Promise.all([
    searchParams,
    user ? getUserBillingStatus(user.id) : Promise.resolve(null),
  ]);
  const billingDisplayState = billingStatus ? getBillingDisplayState(billingStatus) : null;
  const pricingActionLabel = user && !billingDisplayState?.accessAllowed ? "Open dashboard" : "Start free";

  return (
    <main className="public-site min-h-screen">
      <MarketingNav />
      <PricingBase
        loggedIn={Boolean(user)}
        hasProductAccess={Boolean(billingStatus?.hasAccess)}
        checkoutCancelled={checkout === "cancelled"}
        pricingActionLabel={pricingActionLabel}
      />

      <PublicSiteFooter />
    </main>
  );
}
