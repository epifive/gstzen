"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BRAND } from "@/lib/brand";
import { APP_NAV } from "@/lib/nav";
import { IconGithub, IconSparkles, IconX } from "./icons";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const navLink = "rounded-md px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white";

export function SiteHeader() {
  const path = usePathname() || "/";
  const inApp = path.startsWith("/app");
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/app/" ? path === "/app/" || path === "/app" || path.startsWith("/app/edit") : path.startsWith(href.replace(/\/$/, ""));

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label={`${BRAND.name} home`}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {inApp ? (
            APP_NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  isActive(n.href)
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-100"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            ))
          ) : (
            <>
              <a href="#features" className={navLink}>
                Features
              </a>
              <a href="#pricing" className={navLink}>
                Free vs Pro
              </a>
              <a href="#faq" className={navLink}>
                FAQ
              </a>
            </>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a href={BRAND.repoUrl} className="btn-ghost hidden px-2.5 sm:inline-flex" aria-label="Source code on GitHub" target="_blank" rel="noopener">
            <IconGithub className="size-4" />
          </a>
          <ThemeToggle />
          <a href={BRAND.proUrl} target="_blank" rel="noopener" className="btn-secondary hidden sm:inline-flex">
            <IconSparkles className="size-4 text-amber-500" /> Get Pro
          </a>
          {!inApp && (
            <Link href="/app/" className="btn-primary">
              Open app
            </Link>
          )}
          {inApp && (
            <button type="button" className="btn-ghost md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
              {open ? <IconX className="size-5" /> : <span className="text-sm font-medium">Menu</span>}
            </button>
          )}
        </div>
      </div>
      {inApp && open && (
        <nav className="border-t border-slate-200 px-4 py-2 md:hidden dark:border-slate-800" aria-label="Mobile">
          {APP_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {n.label}
            </Link>
          ))}
          <a href={BRAND.proUrl} className="block rounded-md px-3 py-2 text-sm font-medium text-brand-600" target="_blank" rel="noopener">
            Get Pro
          </a>
        </nav>
      )}
    </header>
  );
}
