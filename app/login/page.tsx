import Link from "next/link";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/actions";
import { AuthCard } from "@/components/auth-card";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(109,94,248,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(14,165,164,0.08),transparent_24%)]" />
      <div className="relative z-10 flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-lg space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">SideKick Studioss</p>
          <h1 className="text-5xl font-semibold tracking-[-0.07em] text-[var(--ink)]">
            Launch faster without starting from scratch
          </h1>
          <p className="text-lg leading-8 text-[var(--muted-strong)]">
            Sign in to manage your detail campaigns, funnels, and leads in one calm workspace.
          </p>
          <Link href="/" className="inline-flex text-sm font-medium text-[var(--brand)]">
            Back to site
          </Link>
        </div>
        <AuthCard
          title="Welcome back"
          description="Use your email and password to get back into your campaign launcher."
          action={signInAction}
          submitLabel="Sign in"
          footerLabel="Need an account?"
          footerHref="/signup"
          footerLinkLabel="Start free trial"
          error={error}
        />
      </div>
    </div>
  );
}

