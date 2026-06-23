import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { setInvitedClientPasswordAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { requireUser } from "@/lib/auth";

export default async function InviteAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(109,94,248,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(14,165,164,0.08),transparent_24%)]" />
      <Card className="relative z-10 w-full max-w-xl p-8 sm:p-10">
        <Logo className="mb-8" />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--soft-brand)] text-[var(--brand)]">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">Workspace invite</p>
          <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)] sm:text-4xl">
            Set your SideKick password
          </h1>
          <p className="text-base leading-7 text-[var(--muted-strong)]">
            Choose a password for your account. After this, you&apos;ll open your workspace and dashboard.
          </p>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <form action={setInvitedClientPasswordAction} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="password">Password</label>
            <Input id="password" name="password" type="password" minLength={8} maxLength={128} required autoComplete="new-password" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="confirmPassword">Confirm password</label>
            <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} maxLength={128} required autoComplete="new-password" />
          </div>
          <Button type="submit" size="lg" className="w-full justify-center">
            Set password and open workspace
          </Button>
        </form>

        <p className="mt-6 text-sm text-[var(--muted)]">
          Already finished setup? <Link href="/dashboard" className="font-semibold text-[var(--brand)]">Open dashboard</Link>
        </p>
      </Card>
    </div>
  );
}
