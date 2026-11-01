import { computeTotals } from "./calc";
import { stateName } from "./gst";
import type { Doc } from "./types";

export function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  // Prevent spreadsheet formula injection
  const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** One row per document (free export; never locked). */
export function documentsCsv(docs: Doc[]): string {
  const head = [
    "Type",
    "Title",
    "Number",
    "Date",
    "Due/valid until",
    "Client",
    "Client GSTIN",
    "Place of supply",
    "Currency",
    "Taxable value",
    "CGST",
    "SGST/UTGST",
    "IGST",
    "Other tax",
    "Round off",
    "Total",
    "Paid",
    "Balance",
  ];
  const rows = docs.map((d) => {
    const t = computeTotals(d);
    return [
      d.type,
      d.title,
      d.number,
      d.date,
      d.dueDate,
      d.client.name,
      d.client.gstin,
      d.taxMode === "gst" ? stateName(d.placeOfSupply) : "",
      d.currency,
      t.taxable.toFixed(2),
      t.cgst.toFixed(2),
      t.sgst.toFixed(2),
      t.igst.toFixed(2),
      d.taxMode === "vat" ? t.tax.toFixed(2) : "0.00",
      t.roundOff.toFixed(2),
      t.total.toFixed(2),
      t.paid.toFixed(2),
      t.balance.toFixed(2),
    ];
  });
  return toCsv([head, ...rows]);
}

export function downloadText(fileName: string, text: string, mime = "text/plain") {
  const blob = new Blob([mime.startsWith("text/csv") ? "\uFEFF" + text : text], { type: `${mime};charset=utf-8` });
  downloadBlob(fileName, blob);
}

export function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
