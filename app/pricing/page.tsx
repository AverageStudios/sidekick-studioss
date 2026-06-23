import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PricingBase } from "@/components/ui/pricing-base";
import { getCurrentUser } from "@/lib/auth";
import { getBillingDisplayState, getUserBillingStatus, hasActiveDoneForYouAccess } from "@/lib/billing";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ startTrial?: string; checkout?: string }>;
}) {
  const user = await getCurrentUser();
  const [{ startTrial, checkout }, billingStatus, hasDoneForYouAccess] = await Promise.all([
    searchParams,
    user ? getUserBillingStatus(user.id) : Promise.resolve(null),
    user ? hasActiveDoneForYouAccess(user.id) : Promise.resolve(false),
  ]);
  const billingDisplayState = billingStatus ? getBillingDisplayState(billingStatus) : null;
  const pricingActionLabel =
    billingDisplayState?.key === "canceled"
      ? "Restart subscription"
      : billingDisplayState?.key === "incomplete"
        ? "Finish checkout"
        : "Start 14-day free trial";

  return (
    <main className="public-site min-h-screen">
      <MarketingNav />
      <PricingBase
        loggedIn={Boolean(user)}
        hasProductAccess={Boolean(billingStatus?.hasAccess || hasDoneForYouAccess)}
        autoStartTrial={Boolean(user && startTrial === "1" && !billingStatus?.hasAccess && !hasDoneForYouAccess)}
        checkoutCancelled={checkout === "cancelled"}
        pricingActionLabel={pricingActionLabel}
      />

      <PublicSiteFooter />
    </main>
  );
}
