import { describe, expect, it } from "vitest";
import { computeTotals } from "@/lib/calc";
import { createDoc, defaultSettings } from "@/lib/defaults";
import type { Doc, LineItem } from "@/lib/types";

let n = 0;
const li = (qty: number, rate: number, taxRate: number, discountPct = 0, hsn = ""): LineItem => ({
  id: `l${n++}`,
  description: "x",
  hsn,
  qty,
  unit: "Nos",
  rate,
  taxRate,
  discountPct,
});

function doc(patch: Partial<Doc>): Doc {
  const s = defaultSettings();
  s.business.stateCode = "27";
  const d = createDoc("invoice", s, new Date(2026, 10, 1));
  return { ...d, roundOff: false, ...patch };
}

describe("computeTotals", () => {
  it("splits CGST/SGST for intra-state supply", () => {
    const t = computeTotals(doc({ placeOfSupply: "27", items: [li(2, 500, 18)] }));
    expect(t.intraState).toBe(true);
    expect(t.taxable).toBe(1000);
    expect(t.cgst).toBe(90);
    expect(t.sgst).toBe(90);
    expect(t.igst).toBe(0);
    expect(t.total).toBe(1180);
  });
  it("uses IGST for inter-state supply", () => {
    const t = computeTotals(doc({ placeOfSupply: "29", items: [li(2, 500, 18)] }));
    expect(t.intraState).toBe(false);
    expect(t.igst).toBe(180);
    expect(t.cgst).toBe(0);
    expect(t.total).toBe(1180);
  });
  it("applies line and document discounts before tax", () => {
    const t = computeTotals(
      doc({ placeOfSupply: "29", items: [li(1, 1000, 18, 10), li(1, 1000, 5)], discount: { type: "amount", value: 190 } }),
    );
    expect(t.subtotal).toBe(1900);
    expect(t.lineDiscount).toBe(100);
    expect(t.docDiscount).toBe(190);
    expect(t.taxable).toBe(1710);
    // 900-90=810 @18% = 145.8 ; 1000-100=900 @5% = 45
    expect(t.igst).toBe(190.8);
    expect(t.total).toBe(1900.8);
  });
  it("caps a percent discount at 100", () => {
    const t = computeTotals(doc({ items: [li(1, 100, 0)], discount: { type: "percent", value: 150 } }));
    expect(t.total).toBe(0);
  });
  it("extracts tax from tax-inclusive prices", () => {
    const t = computeTotals(doc({ placeOfSupply: "27", pricesIncludeTax: true, items: [li(1, 1180, 18)] }));
    expect(t.taxable).toBe(1000);
    expect(t.tax).toBe(180);
    expect(t.total).toBe(1180);
  });
  it("rounds off to the nearest rupee", () => {
    const t = computeTotals(doc({ placeOfSupply: "29", roundOff: true, items: [li(1, 99.9, 5)] }));
    expect(t.beforeRound).toBe(104.9);
    expect(t.total).toBe(105);
    expect(t.roundOff).toBe(0.1);
  });
  it("groups the tax summary by rate and by HSN", () => {
    const t = computeTotals(
      doc({ placeOfSupply: "27", items: [li(1, 100, 5, 0, "6302"), li(1, 200, 5, 0, "6302"), li(1, 300, 18, 0, "9983")] }),
    );
    expect(t.byRate.map((r) => [r.rate, r.taxable])).toEqual([
      [5, 300],
      [18, 300],
    ]);
    expect(t.byHsn.find((r) => r.hsn === "6302")?.cgst).toBe(7.5);
  });
  it("ignores tax in no-tax mode and supports VAT mode", () => {
    expect(computeTotals(doc({ taxMode: "none", items: [li(3, 10, 18)] })).total).toBe(30);
    const v = computeTotals(doc({ taxMode: "vat", currency: "AED", items: [li(1, 200, 5)] }));
    expect(v.tax).toBe(10);
    expect(v.cgst + v.igst).toBe(0);
    expect(v.total).toBe(210);
  });
  it("handles receipts and partial payments", () => {
    const base = doc({ items: [li(1, 1000, 0)], placeOfSupply: "27" });
    expect(computeTotals({ ...base, type: "receipt" }).paid).toBe(1000);
    const t = computeTotals({ ...base, payment: { ...base.payment, amountPaid: 400 } });
    expect(t.paid).toBe(400);
    expect(t.balance).toBe(600);
  });
  it("survives empty and garbage input", () => {
    const t = computeTotals(doc({ items: [{ ...li(1, 1, 18), qty: NaN, rate: "abc" as unknown as number }] }));
    expect(t.total).toBe(0);
    expect(computeTotals(doc({ items: [] })).total).toBe(0);
  });
});
