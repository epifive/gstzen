import { describe, expect, it } from "vitest";
import { checkGstInvoiceNumber, gstinCheckChar, isIntraState, stateTaxLabel, validateGstin, validatePan } from "@/lib/gst";

describe("GSTIN", () => {
  it("accepts a known valid GSTIN", () => {
    const r = validateGstin("27AAPFU0939F1ZV");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.stateCode).toBe("27");
      expect(r.pan).toBe("AAPFU0939F");
    }
  });
  it("is case and whitespace tolerant", () => {
    expect(validateGstin(" 27aapfu0939f1zv ").ok).toBe(true);
  });
  it("rejects a wrong checksum", () => {
    const r = validateGstin("27AAPFU0939F1ZA");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Checksum/);
  });
  it("rejects bad length, format and state", () => {
    expect(validateGstin("27AAPFU0939F1Z").ok).toBe(false);
    expect(validateGstin("2AAAPFU0939F1ZV").ok).toBe(false);
    const first = "55AAPFU0939F1Z";
    expect(validateGstin(first + gstinCheckChar(first)).ok).toBe(false);
  });
  it("computes check chars that validate", () => {
    for (const f of ["29AAFFB1234K1Z", "07ABCDE1234F2Z", "33AABCT1332L1Z"]) {
      expect(validateGstin(f + gstinCheckChar(f)).ok).toBe(true);
    }
  });
  it("validates PAN", () => {
    expect(validatePan("ABCDE1234F")).toBe(true);
    expect(validatePan("ABCD1234F")).toBe(false);
  });
});

describe("place of supply", () => {
  it("same state is intra-state", () => {
    expect(isIntraState("27", "27")).toBe(true);
    expect(isIntraState("27", "29")).toBe(false);
  });
  it("exports and unknown seller state are inter-state", () => {
    expect(isIntraState("27", "96")).toBe(false);
    expect(isIntraState("", "27")).toBe(false);
  });
  it("UTs without legislature use UTGST", () => {
    expect(stateTaxLabel("04")).toBe("UTGST");
    expect(stateTaxLabel("07")).toBe("SGST");
  });
  it("checks invoice number rules", () => {
    expect(checkGstInvoiceNumber("INV/26-27/001")).toBeNull();
    expect(checkGstInvoiceNumber("INV 001")).toMatch(/letters/);
    expect(checkGstInvoiceNumber("INVOICE/2026-27/00001")).toMatch(/16/);
    expect(checkGstInvoiceNumber("")).toMatch(/required/);
  });
});
