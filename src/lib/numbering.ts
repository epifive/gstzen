import type { NumberingRule } from "./types";

/** Indian financial year (April–March) for a date: { full: "2026-27", short: "26-27" }. */
export function financialYear(date: Date | string): { full: string; short: string; start: number } {
  const d = typeof date === "string" ? parseDate(date) : date;
  const y = d.getFullYear();
  const start = d.getMonth() >= 3 ? y : y - 1;
  const end = (start + 1) % 100;
  return {
    full: `${start}-${String(end).padStart(2, "0")}`,
    short: `${String(start % 100).padStart(2, "0")}-${String(end).padStart(2, "0")}`,
    start,
  };
}

export function parseDate(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
  if (!m) return new Date();
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Formats a document number. Tokens: {FY} 2026-27, {FYS} 26-27, {YYYY}, {YY}, {MM}, {N} (padded). */
export function formatDocNumber(rule: Pick<NumberingRule, "format" | "pad">, n: number, date: Date | string = new Date()): string {
  const d = typeof date === "string" ? parseDate(date) : date;
  const fy = financialYear(d);
  const padded = String(Math.max(0, Math.floor(n))).padStart(Math.min(Math.max(rule.pad, 1), 10), "0");
  const format = rule.format.includes("{N}") ? rule.format : `${rule.format}{N}`;
  return format
    .replace(/\{FY\}/g, fy.full)
    .replace(/\{FYS\}/g, fy.short)
    .replace(/\{YYYY\}/g, String(d.getFullYear()))
    .replace(/\{YY\}/g, String(d.getFullYear() % 100).padStart(2, "0"))
    .replace(/\{MM\}/g, String(d.getMonth() + 1).padStart(2, "0"))
    .replace(/\{N\}/g, padded);
}

export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** 01 Nov 2026 */
export function displayDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso || "")) return "";
  const d = parseDate(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
