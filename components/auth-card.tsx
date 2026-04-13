import Link from "next/link";
import { Logo } from "@/components/logo";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuthCard({
  title,
  description,
  action,
  submitLabel,
  pendingLabel,
  footerLabel,
  footerHref,
  footerLinkLabel,
  error,
  success,
}: {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  pendingLabel: string;
  footerLabel: string;
  footerHref: string;
  footerLinkLabel: string;
  error?: string;
  success?: string;
}) {
  return (
    <Card className="w-full max-w-md p-6 sm:p-7">
      <Logo className="mb-7 sm:mb-8" />
      <div className="space-y-[0.625rem]">
        <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{title}</h1>
        <p className="text-sm leading-6 text-[var(--muted-strong)]">{description}</p>
      </div>
      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}
      <form action={action} className="mt-6 space-y-[1.125rem]">
        <div className="space-y-[0.625rem]">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="email">
            Email
          </label>
          <Input id="email" type="email" name="email" placeholder="name@shop.com" required />
        </div>
        <div className="space-y-[0.625rem]">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="password">
            Password
          </label>
          <Input id="password" type="password" name="password" placeholder="At least 6 characters" required />
        </div>
        <AuthSubmitButton label={submitLabel} pendingLabel={pendingLabel} />
      </form>
      <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
        {footerLabel}{" "}
        <Link href={footerHref} className="font-medium text-[var(--brand)]">
          {footerLinkLabel}
        </Link>
      </p>
    </Card>
  );
}
