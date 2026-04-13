"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { publicProductGroups } from "@/data/public-product-pages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
];

export function HeroHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const productMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!productMenuRef.current?.contains(event.target as Node)) {
        setProductMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProductMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <div className="mx-auto w-full max-w-[86rem]">
        <div
          className={cn(
            "relative rounded-[28px] border transition-all duration-300",
            "backdrop-blur-2xl",
            isScrolled
              ? "border-[var(--public-line-strong)] bg-[rgba(255,255,255,0.9)] shadow-[0_24px_80px_rgba(15,17,22,0.08)]"
              : "border-[var(--public-line)] bg-[rgba(255,255,255,0.76)] shadow-[0_18px_60px_rgba(15,17,22,0.045)]",
          )}
        >
          <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(17,24,39,0.12),transparent)]" />
          <div className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]" />

          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-3.5 lg:px-5">
            <div className="flex min-w-0 items-center gap-3.5">
              <Logo tone="dark" className="shrink-0" />
              <div className="hidden items-center gap-2 rounded-full border border-[var(--public-line)] bg-white/78 px-3.5 py-1.5 text-[11px] font-medium tracking-[0.18em] text-[var(--public-muted-soft)] xl:inline-flex">
                <Sparkles className="h-3.5 w-3.5 text-[var(--public-accent)]" />
                Choose. Launch. Follow up.
              </div>
            </div>

            <nav className="hidden items-center gap-2 lg:flex">
              <div
                ref={productMenuRef}
                className="relative"
                onMouseEnter={() => setProductMenuOpen(true)}
                onMouseLeave={() => setProductMenuOpen(false)}
              >
                <button
                  type="button"
                  aria-expanded={productMenuOpen}
                  onClick={() => setProductMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[var(--public-muted)] transition hover:bg-[rgba(109,94,248,0.06)] hover:text-[var(--public-text)]"
                >
                  Product
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      productMenuOpen ? "rotate-180 text-[var(--public-text)]" : "",
                    )}
                  />
                </button>

                <AnimatePresence>
                  {productMenuOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-1/2 top-[calc(100%+14px)] z-50 w-[46rem] -translate-x-1/2"
                    >
                      <div className="overflow-hidden rounded-[28px] border border-[var(--public-line)] bg-[rgba(255,255,255,0.97)] p-3 shadow-[0_28px_100px_rgba(15,17,22,0.1)] backdrop-blur-2xl">
                        <div className="grid gap-3 md:grid-cols-[0.78fr_1.22fr]">
                          <div className="rounded-[24px] border border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(101,88,246,0.1),rgba(255,255,255,0.96))] px-5 py-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] public-accent-kicker">
                              Product
                            </p>
                            <p className="mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">
                              Explore the SideKick system
                            </p>
                            <p className="mt-3 text-sm leading-7 public-text-muted">
                              Choose your industry, pick a template, launch faster, and keep leads and outreach moving from one place.
                            </p>
                            <Button
                              asChild
                              variant="outline"
                              className="mt-5 w-full border-[var(--public-line)] bg-white/70 text-[var(--public-text)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
                            >
                              <Link href="/product" onClick={() => setProductMenuOpen(false)}>
                                See Product Overview
                              </Link>
                            </Button>
                          </div>

                          <div className="grid gap-3">
                            {publicProductGroups.map((group) => (
                              <div key={group.title} className="rounded-[24px] border border-[var(--public-line)] bg-white/78 p-3.5">
                                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">
                                  {group.title}
                                </p>
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                  {group.items.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                      <Link
                                        key={item.slug}
                                        href={item.href}
                                        onClick={() => setProductMenuOpen(false)}
                                        className="rounded-[20px] border border-[var(--public-line)] bg-white/84 px-4 py-4 transition hover:border-[rgba(101,88,246,0.2)] hover:bg-[rgba(101,88,246,0.045)]"
                                      >
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-[var(--public-accent-soft)] text-[var(--public-accent)]">
                                          <Icon className="h-4.5 w-4.5" />
                                        </span>
                                        <p className="mt-4 text-sm font-semibold text-[var(--public-text)]">{item.title}</p>
                                        <p className="mt-1.5 text-xs leading-6 public-text-soft">
                                          {item.description}
                                        </p>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-4 py-2.5 text-sm font-medium text-[var(--public-muted)] transition hover:bg-[rgba(109,94,248,0.06)] hover:text-[var(--public-text)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              <Button
                asChild
                variant="ghost"
                className="px-4 text-[var(--public-muted)] hover:bg-[rgba(109,94,248,0.06)] hover:text-[var(--public-text)]"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.28)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] focus-visible:ring-[rgba(159,147,255,0.8)] [&_svg]:!text-white"
              >
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Button
                asChild
                size="sm"
                className="rounded-[16px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.24)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] focus-visible:ring-[rgba(159,147,255,0.8)] [&_svg]:!text-white"
              >
                <Link href="/signup">Start Free Trial</Link>
              </Button>
              <button
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((open) => !open)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-white/72 text-[var(--public-text)] transition hover:bg-[rgba(109,94,248,0.06)]"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="border-t border-[var(--public-line)] px-3 pb-3 pt-2.5 sm:px-4 sm:pb-4"
              >
                <div className="overflow-hidden rounded-[24px] border border-[var(--public-line)] bg-[rgba(255,255,255,0.78)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.98)]">
                  <div className="rounded-[20px] border border-[var(--public-line)] bg-white/84 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] public-accent-kicker">
                      Product
                    </p>
                    <div className="mt-3 grid gap-3">
                      {publicProductGroups.map((group) => (
                        <div key={group.title}>
                          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">
                            {group.title}
                          </p>
                          <div className="mt-1 grid gap-2">
                            {group.items.map((item) => {
                              const Icon = item.icon;

                              return (
                                <Link
                                  key={item.slug}
                                  href={item.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex items-start gap-3 rounded-[18px] px-3 py-3 text-sm transition hover:bg-[rgba(109,94,248,0.05)]"
                                >
                                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-[var(--public-accent-soft)] text-[var(--public-accent)]">
                                    <Icon className="h-4 w-4" />
                                  </span>
                                  <span>
                                    <span className="block font-medium text-[var(--public-text)]">{item.shortTitle}</span>
                                    <span className="mt-1 block text-xs leading-5 public-text-soft">
                                      {item.description}
                                    </span>
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <nav className="mt-3 grid gap-1.5">
                    {navItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-[18px] px-4 py-3 text-sm font-medium text-[var(--public-muted)] transition hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-3.5 grid gap-2.5 border-t border-[var(--public-line)] pt-3.5 sm:grid-cols-2">
                    <Button
                      asChild
                      variant="ghost"
                      className="justify-center text-[var(--public-muted)] hover:bg-[rgba(109,94,248,0.06)] hover:text-[var(--public-text)]"
                    >
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="justify-center border-[var(--public-line)] bg-white/74 text-[var(--public-text)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
                    >
                      <Link href="/product/templates" onClick={() => setMobileOpen(false)}>
                        See Templates
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
