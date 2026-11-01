import { isIntraState, stateTaxLabel } from "./gst";
import { getCurrency, roundTo } from "./money";
import type { Doc, LineItem } from "./types";

export interface LineCalc {
  id: string;
  gross: number; // qty × rate
  lineDiscount: number;
  net: number; // after line discount (what the line "Amount" column shows)
  docDiscount: number; // share of the document-level discount
  taxable: number; // taxable value (excl. tax)
  tax: number;
  total: number; // taxable + tax
}

export interface TaxRow {
  key: string; // rate (and HSN for HSN summary)
  hsn: string;
  rate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
}

export interface Totals {
  lines: LineCalc[];
  subtotal: number; // sum of line nets (incl. tax when prices include tax)
  lineDiscount: number;
  docDiscount: number;
  discount: number; // line + document discounts
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number; // total tax (VAT/GST)
  beforeRound: number;
  roundOff: number;
  total: number;
  paid: number;
  balance: number;
  intraState: boolean;
  stateTaxName: "SGST" | "UTGST";
  byRate: TaxRow[];
  byHsn: TaxRow[];
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);

function lineNet(item: LineItem) {
  const qty = num(item.qty);
  const rate = num(item.rate);
  const gross = qty * rate;
  const pct = Math.min(Math.max(num(item.discountPct), 0), 100);
  const lineDiscount = (gross * pct) / 100;
  return { gross, lineDiscount, net: gross - lineDiscount };
}

/**
 * Computes all totals for a document. Rules:
 * - Line discount % reduces the line amount.
 * - The document discount (percent or flat) is spread across lines in proportion to their amount,
 *   so it reduces the taxable value of each line (as on a GST invoice).
 * - When prices include tax, tax is extracted: taxable = amount / (1 + rate).
 * - GST: intra-state → CGST + SGST (half each), otherwise IGST. Each component is rounded per rate.
 */
export function computeTotals(doc: Pick<Doc, "items" | "discount" | "taxMode" | "pricesIncludeTax" | "roundOff" | "currency" | "placeOfSupply" | "type" | "payment"> & { from: { stateCode: string } }): Totals {
  const dec = getCurrency(doc.currency).decimals;
  const r = (v: number) => roundTo(v, dec);
  const taxOn = doc.taxMode !== "none";
  const intra = doc.taxMode === "gst" && isIntraState(doc.from.stateCode, doc.placeOfSupply);

  const base = doc.items.map(lineNet);
  const netSum = base.reduce((s, b) => s + b.net, 0);

  // Document-level discount, capped at the net sum, distributed pro rata.
  const dv = Math.max(num(doc.discount?.value), 0);
  let docDiscountTotal = doc.discount?.type === "percent" ? (netSum * Math.min(dv, 100)) / 100 : Math.min(dv, Math.max(netSum, 0));
  docDiscountTotal = r(docDiscountTotal);
  let allocated = 0;

  const lines: LineCalc[] = doc.items.map((item, i) => {
    const b = base[i];
    let share = 0;
    if (docDiscountTotal > 0 && netSum > 0) {
      const isLast = i === doc.items.length - 1;
      share = isLast ? docDiscountTotal - allocated : r((docDiscountTotal * b.net) / netSum);
      allocated += share;
    }
    const after = b.net - share;
    const rate = taxOn ? Math.max(num(item.taxRate), 0) : 0;
    let taxable: number;
    let tax: number;
    if (doc.pricesIncludeTax && rate > 0) {
      taxable = after / (1 + rate / 100);
      tax = after - taxable;
    } else {
      taxable = after;
      tax = (after * rate) / 100;
    }
    return {
      id: item.id,
      gross: b.gross,
      lineDiscount: b.lineDiscount,
      net: b.net,
      docDiscount: share,
      taxable,
      tax,
      total: taxable + tax,
    };
  });

  const group = (keyOf: (item: LineItem) => string): TaxRow[] => {
    const map = new Map<string, TaxRow>();
    doc.items.forEach((item, i) => {
      const rate = taxOn ? Math.max(num(item.taxRate), 0) : 0;
      const key = keyOf(item);
      const row = map.get(key) ?? { key, hsn: item.hsn?.trim() ?? "", rate, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 };
      row.taxable += lines[i].taxable;
      row.tax += lines[i].tax;
      map.set(key, row);
    });
    return [...map.values()].map((row) => {
      const taxable = r(row.taxable);
      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let tax = r(row.tax);
      if (doc.taxMode === "gst") {
        if (intra) {
          cgst = r(row.tax / 2);
          sgst = cgst;
          tax = cgst + sgst;
        } else {
          igst = tax;
        }
      }
      return { ...row, taxable, cgst, sgst, igst, tax: r(tax) };
    });
  };

  const byRate = group((it) => String(taxOn ? Math.max(num(it.taxRate), 0) : 0)).sort((a, b) => a.rate - b.rate);
  const byHsn = group((it) => `${(it.hsn || "").trim().toUpperCase()}|${taxOn ? Math.max(num(it.taxRate), 0) : 0}`);

  const subtotal = r(base.reduce((s, b) => s + b.net, 0));
  const lineDiscount = r(base.reduce((s, b) => s + b.lineDiscount, 0));
  const taxable = r(byRate.reduce((s, x) => s + x.taxable, 0));
  const cgst = r(byRate.reduce((s, x) => s + x.cgst, 0));
  const sgst = r(byRate.reduce((s, x) => s + x.sgst, 0));
  const igst = r(byRate.reduce((s, x) => s + x.igst, 0));
  const tax = r(byRate.reduce((s, x) => s + x.tax, 0));
  const beforeRound = r(taxable + tax);
  const total = doc.roundOff ? Math.round(beforeRound) : beforeRound;
  const roundOff = r(total - beforeRound);

  let paid = 0;
  if (doc.type === "receipt") {
    const p = doc.payment?.amountPaid;
    paid = p === null || p === undefined || Number.isNaN(Number(p)) ? total : r(num(p));
  } else if (doc.type === "invoice" && doc.payment?.amountPaid) {
    paid = r(num(doc.payment.amountPaid));
  }

  return {
    lines,
    subtotal,
    lineDiscount,
    docDiscount: docDiscountTotal,
    discount: r(lineDiscount + docDiscountTotal),
    taxable,
    cgst,
    sgst,
    igst,
    tax,
    beforeRound,
    roundOff,
    total,
    paid,
    balance: r(total - paid),
    intraState: intra,
    stateTaxName: stateTaxLabel(doc.from.stateCode),
    byRate,
    byHsn,
  };
}
