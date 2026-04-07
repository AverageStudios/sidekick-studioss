import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuthCard({
  title,
  description,
  action,
  submitLabel,
  footerLabel,
  footerHref,
  footerLinkLabel,
  error,
}: {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  footerLabel: string;
  footerHref: string;
  footerLinkLabel: string;
  error?: string;
}) {
  return (
    <Card className="w-full max-w-md p-7 sm:p-8">
      <Logo className="mb-8" />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{title}</h1>
        <p className="text-sm leading-6 text-[var(--muted-strong)]">{description}</p>
      </div>
      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <form action={action} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="email">
            Email
          </label>
          <Input id="email" type="email" name="email" placeholder="name@shop.com" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="password">
            Password
          </label>
          <Input id="password" type="password" name="password" placeholder="At least 6 characters" required />
        </div>
        <Button type="submit" size="lg" className="w-full">
          {submitLabel}
        </Button>
      </form>
      <p className="mt-6 text-sm text-[var(--muted)]">
        {footerLabel}{" "}
        <Link href={footerHref} className="font-medium text-[var(--brand)]">
          {footerLinkLabel}
        </Link>
      </p>
    </Card>
  );
}

