import { describe, expect, it } from "vitest";
import { mergeStores, normalizeStore, parseBackup, serializeBackup } from "@/lib/storage";
import { sampleStore } from "@/lib/sample";
import { validateGstin } from "@/lib/gst";
import { computeTotals } from "@/lib/calc";

describe("storage", () => {
  it("round-trips a backup", () => {
    const s = sampleStore(new Date(2026, 10, 1));
    const back = parseBackup(serializeBackup(s));
    expect(back.docs.length).toBe(s.docs.length);
    expect(back.settings.business.name).toBe(s.settings.business.name);
    expect(back.docs[0].items[0].hsn).toBe("6302");
    expect(back.settings.numbering.invoice.next).toBe(4);
  });
  it("rejects junk", () => {
    expect(() => parseBackup("not json")).toThrow(/JSON/);
    expect(() => parseBackup("[1,2]")).toThrow(/backup/);
  });
  it("fills missing fields and drops invalid docs", () => {
    const s = normalizeStore({ settings: { business: { name: "X" } }, docs: [{ id: "a", type: "invoice" }, { type: "nope" }] });
    expect(s?.settings.business.name).toBe("X");
    expect(s?.settings.numbering.invoice.format).toContain("{N}");
    expect(s?.docs.length).toBe(1);
    expect(s?.docs[0].items).toEqual([]);
  });
  it("merges by id", () => {
    const a = sampleStore();
    const b = { ...a, docs: [{ ...a.docs[0], number: "CHANGED" }] };
    const m = mergeStores(a, b);
    expect(m.docs.length).toBe(a.docs.length);
    expect(m.docs.find((d) => d.id === a.docs[0].id)?.number).toBe("CHANGED");
  });
  it("ships valid, flagged sample data", () => {
    const s = sampleStore();
    expect(validateGstin(s.settings.business.gstin).ok).toBe(true);
    for (const d of s.docs) {
      expect(d.sample).toBe(true);
      expect(computeTotals(d).total).toBeGreaterThan(0);
      if (d.client.gstin) expect(validateGstin(d.client.gstin).ok).toBe(true);
    }
  });
});
