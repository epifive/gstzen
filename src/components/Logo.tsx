import { BRAND } from "@/lib/brand";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#4f46e5" />
      <path d="M9 7h10l4 4v14H9z" fill="#fff" />
      <path d="M19 7v4h4" fill="#c7d2fe" />
      <path d="M12 15h8M12 18.5h8M12 22h5" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <LogoMark />
      <span className="text-[17px]">{BRAND.name}</span>
    </span>
  );
}
