import { AppShell } from "@/components/app-shell";
import { DeleteAccountButton } from "@/components/account-management-actions";
import { CancelSubscriptionPortalButton, ManageBillingButton, StartTrialButton } from "@/components/billing-action-buttons";
import { InitialsAvatar } from "@/components/initials-avatar";
import { ProfilePictureField } from "@/components/profile-picture-field";
import Link from "next/link";
import { AlertTriangle, BookOpenText, CreditCard, LifeBuoy } from "lucide-react";
import { signOutAction, updateProfileSettingsAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentProfile, getUserAvatarUrl, requireUser } from "@/lib/auth";
import { getUserBillingStatus } from "@/lib/billing";
import { getCurrentWorkspaceContext, getUserDisplayNameFromProfile, getUserInitialsFromProfile } from "@/lib/workspaces";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const [{ saved, error }, workspaceContext, accountProfile] = await Promise.all([
    searchParams,
    getCurrentWorkspaceContext(),
    getCurrentProfile(),
  ]);
  const billingStatus = await getUserBillingStatus(user.id);
  const resolvedProfile = accountProfile || workspaceContext?.profile || null;
  const resolvedName =
    getUserDisplayNameFromProfile(resolvedProfile, user) ||
    workspaceContext?.userDisplayName ||
    "User";
  const resolvedInitials =
    getUserInitialsFromProfile(resolvedProfile, user) ||
    workspaceContext?.userInitials ||
    "U";
  const resolvedEmail = user.email || workspaceContext?.userEmail || "";
  const resolvedAvatarUrl = getUserAvatarUrl(resolvedProfile, user);
  const savedMessage = saved && saved !== "1" ? saved : saved ? "Settings saved." : "";
  const hasActiveBilling = billingStatus.hasAccess;
  const subscriptionLabel =
    billingStatus.subscriptionStatus === "none"
      ? "Not started"
      : billingStatus.subscriptionStatus.replaceAll("_", " ");

  return (
    <AppShell currentPath="/settings">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Account</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Profile settings</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Personal profile details for your account inside this workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/workspace/settings">Open workspace settings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/academy">
              <BookOpenText className="h-4 w-4" />
              View Academy
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/support/new?from=/settings">
              <LifeBuoy className="h-4 w-4" />
              Get Support
            </Link>
          </Button>
        </div>
      </div>

      {savedMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {savedMessage}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section id="account">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">Account</p>
          <h2 className="mt-1 text-base font-semibold text-[var(--ink)]">Your profile</h2>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Your personal account inside this workspace.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] px-3.5 py-3">
              <InitialsAvatar initials={resolvedInitials} label={resolvedName} src={resolvedAvatarUrl} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--ink)]">{resolvedName}</p>
                <p className="truncate text-xs text-[var(--muted)]">{resolvedEmail || "Signed-in user"}</p>
              </div>
            </div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Profile info</p>
            <form action={updateProfileSettingsAction} encType="multipart/form-data">
              <ProfilePictureField currentAvatarUrl={resolvedAvatarUrl} initials={resolvedInitials} label={resolvedName} />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Input name="firstName" defaultValue={resolvedProfile?.first_name || ""} placeholder="First name" />
                <Input name="lastName" defaultValue={resolvedProfile?.last_name || ""} placeholder="Last name" />
                <div className="sm:col-span-2">
                  <Input value={resolvedEmail} placeholder="Email" readOnly disabled />
                </div>
              </div>
            </form>
            <div className="mt-3">
              <form action={signOutAction}>
                <Button type="submit" variant="outline">
                  Sign out
                </Button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Account notes</p>
            <div className="mt-4 space-y-2.5">
              {[
                "Your profile name appears in the account dropdown.",
                "Workspace/company settings now live in the dedicated workspace settings page.",
                "Email is controlled by your authentication account.",
              ].map((tip) => (
                <p key={tip} className="text-xs leading-5 text-[var(--muted)]">
                  — {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="account-controls" className="pt-2">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">Billing & account</p>
          <h2 className="mt-1 text-base font-semibold text-[var(--ink)]">Billing & account controls</h2>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Subscription cancellation and permanent account removal live here so they are easy to find when you need them.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-amber-200 bg-[linear-gradient(180deg,#fffdf5_0%,#fff9e7_100%)] p-5 shadow-[0_8px_24px_rgba(120,53,15,0.06)]">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Billing</p>
                  <h3 className="mt-1 text-lg font-semibold text-[var(--ink)]">SideKick Core</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                    Billing belongs to your user account, not to individual workspaces. One paid account unlocks SideKick across every workspace you create or belong to.
                  </p>
                  <div className="mt-4 grid gap-3 rounded-2xl border border-amber-200/60 bg-white/75 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Price</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--ink)]">$97/month</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Workspaces</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--ink)]">Unlimited</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Status</p>
                      <p className="mt-1 text-sm font-semibold capitalize text-[var(--ink)]">{subscriptionLabel}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Trial / period end</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                        {billingStatus.trialEndsAt
                          ? new Date(billingStatus.trialEndsAt).toLocaleDateString()
                          : billingStatus.currentPeriodEnd
                            ? new Date(billingStatus.currentPeriodEnd).toLocaleDateString()
                            : "Not started"}
                      </p>
                    </div>
                  </div>
                  {billingStatus.cancelAtPeriodEnd ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      This subscription is set to cancel at the end of the current billing period.
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {billingStatus.stripeCustomerId ? (
                      <>
                        <ManageBillingButton />
                        <CancelSubscriptionPortalButton hasActiveBilling={hasActiveBilling} />
                      </>
                    ) : (
                      <StartTrialButton loggedIn nextPath="/settings#account-controls" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-[linear-gradient(180deg,#fff7f7_0%,#fff1f1_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Danger zone</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-white/75 px-4 py-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-sm leading-6 text-rose-900">
                  Deleting your account is permanent. It removes your SideKick profile, workspaces, campaigns, leads,
                  support history, and connected accounts.
                </p>
              </div>
              <p className="text-xs leading-5 text-[var(--muted)]">
                Cancel any active trial or subscription in Stripe before deleting the account if you do not want billing to continue.
              </p>
              <div className="pt-2">
                <DeleteAccountButton hasActiveBilling={hasActiveBilling} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
