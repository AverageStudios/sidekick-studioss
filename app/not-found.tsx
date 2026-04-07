import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-lg p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">Not found</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--ink)]">
          This page is not here
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted-strong)]">
          The link may be old, unpublished, or just typed incorrectly.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Back home</Link>
        </Button>
      </Card>
    </div>
  );
}
