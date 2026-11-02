import { describe, expect, it } from "vitest";
import { mergeStores, migrateLegacyStorage, normalizeStore, parseBackup, serializeBackup } from "@/lib/storage";
import { LEGACY_EXPORT_KIND, LEGACY_STORAGE_KEY, LEGACY_THEME_KEY, STORAGE_KEY, THEME_KEY } from "@/lib/keys";
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

describe("legacy key migration", () => {
  const mem = (init: Record<string, string>) => {
    const m = new Map(Object.entries(init));
    return {
      getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
      dump: () => Object.fromEntries(m),
    };
  };
  it("moves pre-rename data and theme to the new keys once", () => {
    const ls = mem({ [LEGACY_STORAGE_KEY]: "{\"docs\":[]}", [LEGACY_THEME_KEY]: "dark" });
    migrateLegacyStorage(ls);
    expect(ls.dump()).toEqual({ [STORAGE_KEY]: "{\"docs\":[]}", [THEME_KEY]: "dark" });
    migrateLegacyStorage(ls);
    expect(ls.dump()).toEqual({ [STORAGE_KEY]: "{\"docs\":[]}", [THEME_KEY]: "dark" });
  });
  it("keeps newer data under the current key", () => {
    const ls = mem({ [LEGACY_STORAGE_KEY]: "old", [STORAGE_KEY]: "new" });
    migrateLegacyStorage(ls);
    expect(ls.dump()).toEqual({ [STORAGE_KEY]: "new" });
  });
  it("imports backups made before the rename", () => {
    const s = sampleStore(new Date(2026, 10, 1));
    const old = JSON.parse(serializeBackup(s));
    old.kind = LEGACY_EXPORT_KIND;
    expect(parseBackup(JSON.stringify(old)).docs.length).toBe(s.docs.length);
  });
});
