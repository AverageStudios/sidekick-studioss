import Link from "next/link";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/actions";
import { AuthCard } from "@/components/auth-card";
import { ConfigNotice } from "@/components/config-notice";
import { getCurrentUser } from "@/lib/auth";
import { authSuccessMessages } from "@/lib/auth-messages";
import { getSupabaseFallbackMessage, isSupabasePublicConfigured } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const { error, success } = await searchParams;
  const supabaseFallbackMessage = getSupabaseFallbackMessage();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(109,94,248,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(14,165,164,0.08),transparent_24%)]" />
      <div className="relative z-10 flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="max-w-lg space-y-5 sm:space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">SideKick Studioss</p>
          <h1 className="text-4xl font-semibold tracking-[-0.07em] text-[var(--ink)] sm:text-5xl">
            Launch faster without starting from scratch
          </h1>
          <p className="text-lg leading-8 text-[var(--muted-strong)]">
            Sign in to manage your detail campaigns, funnels, and leads in one calm workspace.
          </p>
          {!isSupabasePublicConfigured() && supabaseFallbackMessage ? (
            <ConfigNotice title="Supabase auth not configured" message={supabaseFallbackMessage} />
          ) : null}
          <Link href="/" className="inline-flex text-sm font-medium text-[var(--brand)]">
            Back to site
          </Link>
        </div>
        <AuthCard
          title="Welcome back"
          description="Use your email and password to get back into your campaign launcher."
          action={signInAction}
          submitLabel="Sign in"
          pendingLabel="Signing in..."
          footerLabel="Need an account?"
          footerHref="/signup"
          footerLinkLabel="Start free trial"
          error={error}
          success={success === authSuccessMessages.confirmed ? "Email confirmed. You can sign in now." : success}
        />
      </div>
    </div>
  );
}
