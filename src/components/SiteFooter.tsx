import { BRAND } from "@/lib/brand";
import { Disclaimer } from "./Disclaimer";

const link = "hover:text-slate-900 dark:hover:text-white";

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-600 sm:px-6 dark:text-slate-400">
        <Disclaimer compact />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {BRAND.fullName} v{BRAND.version} · Open source (MIT) by{" "}
            <a className="font-medium text-slate-900 hover:underline dark:text-white" href={BRAND.makerUrl} target="_blank" rel="noopener">
              {BRAND.makerName}
            </a>
            . Your data stays in your browser.
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Footer">
            <a className={link} href={BRAND.repoUrl} target="_blank" rel="noopener">
              GitHub
            </a>
            <a className={link} href={BRAND.proUrl} target="_blank" rel="noopener">
              Get Pro
            </a>
            <a className={link} href={BRAND.openSourceUrl} target="_blank" rel="noopener">
              More open-source tools
            </a>
            <a className={link} href={BRAND.servicesUrl} target="_blank" rel="noopener">
              Custom app development
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
