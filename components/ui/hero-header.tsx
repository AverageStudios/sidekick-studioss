"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { publicProductGroups } from "@/data/public-product-pages";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Pricing", href: "/pricing" },
  { label: "Academy", href: "/academy" },
  { label: "FAQ", href: "/faq" },
];

export function HeroHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const productMenuRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 14);
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
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300",
        isScrolled || mobileOpen
          ? "border-b border-[rgba(15,17,22,0.08)] bg-[rgba(248,247,243,0.85)] shadow-[0_1px_2px_rgba(15,17,22,0.03)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="site-container flex h-16 items-center justify-between gap-4">
        <Logo tone="dark" markOnly className="shrink-0 min-[420px]:hidden" />
        <Logo tone="dark" className="hidden shrink-0 min-[420px]:inline-flex" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
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
              className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-[rgba(15,17,22,0.72)] transition-colors hover:text-[var(--public-text)]"
            >
              Product
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  productMenuOpen && "rotate-180",
                )}
              />
            </button>

            <AnimatePresence>
              {productMenuOpen ? (
                <motion.div
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-1/2 top-full z-50 w-[34rem] -translate-x-1/2 pt-3"
                >
                  <div className="overflow-hidden rounded-2xl border border-[rgba(15,17,22,0.1)] bg-white shadow-[0_2px_6px_rgba(15,17,22,0.05),0_24px_64px_-12px_rgba(21,16,31,0.22)]">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-3">
                      {publicProductGroups.flatMap((group) =>
                        group.items.map((item) => {
                          const Icon = item.icon;

                          return (
                            <Link
                              key={item.slug}
                              href={item.href}
                              onClick={() => setProductMenuOpen(false)}
                              className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[rgba(15,17,22,0.035)]"
                            >
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-[rgba(15,17,22,0.08)] bg-white text-[var(--public-accent)] shadow-[0_1px_2px_rgba(15,17,22,0.04)]">
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[13px] font-semibold text-[var(--public-text)]">
                                  {item.shortTitle}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-[rgba(15,17,22,0.55)]">
                                  {item.description}
                                </span>
                              </span>
                            </Link>
                          );
                        }),
                      )}
                    </div>
                    <Link
                      href="/product"
                      onClick={() => setProductMenuOpen(false)}
                      className="flex items-center justify-between border-t border-[rgba(15,17,22,0.07)] bg-[#fbfafd] px-5 py-3 text-[13px] font-semibold text-[rgba(15,17,22,0.72)] transition-colors hover:text-[var(--public-text)]"
                    >
                      See the product overview
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-[rgba(15,17,22,0.72)] transition-colors hover:text-[var(--public-text)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-[rgba(15,17,22,0.72)] transition-colors hover:text-[var(--public-text)]"
          >
            Log in
          </Link>
          <Link href="/pricing" className="site-cta-primary !h-10 !px-4 text-sm">
            Start free trial
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/pricing" className="site-cta-primary !h-9 !px-3.5 !text-[13px]">
            Start free trial
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(15,17,22,0.1)] bg-white text-[var(--public-text)]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[rgba(15,17,22,0.07)] lg:hidden"
          >
            <div className="site-container max-h-[calc(100vh-4rem)] overflow-y-auto pb-6 pt-4">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-[rgba(15,17,22,0.45)]">
                Product
              </p>
              <div className="mt-2 grid gap-0.5">
                {publicProductGroups.flatMap((group) =>
                  group.items.map((item) => (
                    <Link
                      key={item.slug}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--public-text)]"
                    >
                      {item.shortTitle}
                    </Link>
                  )),
                )}
              </div>

              <div className="mt-4 grid gap-0.5 border-t border-[rgba(15,17,22,0.07)] pt-4">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--public-text)]"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--public-text)]"
                >
                  Log in
                </Link>
              </div>

              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="site-cta-primary mt-4 w-full"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
