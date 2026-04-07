import { redirect } from "next/navigation";
import { signUpAction } from "@/app/actions";
import { AuthCard } from "@/components/auth-card";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage({
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
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">Start simple</p>
          <h1 className="text-5xl font-semibold tracking-[-0.07em] text-[var(--ink)]">
            Get your first detailing campaign live fast
          </h1>
          <p className="text-lg leading-8 text-[var(--muted-strong)]">
            Create an account, choose a template, customize a few fields, and publish your first funnel.
          </p>
        </div>
        <AuthCard
          title="Create account"
          description="Supabase auth is wired in for production, with demo mode available if env vars are still missing."
          action={signUpAction}
          submitLabel="Create account"
          footerLabel="Already have an account?"
          footerHref="/login"
          footerLinkLabel="Sign in"
          error={error}
        />
      </div>
    </div>
  );
}

