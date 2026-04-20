import Link from "next/link";
import { redirect } from "next/navigation";
import { MailCheck } from "lucide-react";
import { resendConfirmationAction } from "@/app/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; success?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const { email, error, success } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(109,94,248,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(14,165,164,0.08),transparent_24%)]" />
      <Card className="relative z-10 w-full max-w-xl p-8 sm:p-10">
        <Logo className="mb-8" />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--soft-brand)] text-[var(--brand)]">
          <MailCheck className="h-7 w-7" />
        </div>
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">Check your email</p>
          <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)] sm:text-4xl">
            Confirm your account to keep going
          </h1>
          <p className="text-base leading-7 text-[var(--muted-strong)]">
            We sent a confirmation link{email ? ` to ${email}` : ""}. Open that email, confirm your account, and then sign in to reach your dashboard.
          </p>
        </div>
        <div className="mt-6 rounded-[24px] bg-[var(--soft-panel)] px-4 py-4 text-sm leading-6 text-[var(--muted-strong)]">
          If you don’t see it in a minute or two, check spam or promotions before trying again.
        </div>
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
        {email ? (
          <form action={resendConfirmationAction} className="mt-4">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="source" value="signup" />
            <Button type="submit" variant="outline" size="lg">
              Resend confirmation email
            </Button>
          </form>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">Go to login</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/signup">Use another email</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
