import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-[rgba(248,246,240,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-[var(--muted-strong)] md:flex">
          <Link href="#how-it-works">How it works</Link>
          <Link href="#templates">Templates</Link>
          <Link href="#faq">FAQ</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Start Free Trial</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

