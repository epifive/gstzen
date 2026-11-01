import { describe, expect, it } from "vitest";
import { buildUpiUri, isValidVpa } from "@/lib/upi";
import { qrMatrix, qrSvg } from "@/lib/qr";

describe("UPI", () => {
  it("validates VPAs", () => {
    expect(isValidVpa("shop.name@okhdfc")).toBe(true);
    expect(isValidVpa("9876543210@ybl")).toBe(true);
    expect(isValidVpa("no-at-sign")).toBe(false);
    expect(isValidVpa("a@1bank")).toBe(false);
  });
  it("builds a upi://pay URI with amount and note", () => {
    const uri = buildUpiUri({ vpa: "shop@okhdfc", name: "Indigo & Co", amount: 1234.5, note: "Invoice INV/26-27/001" });
    expect(uri).toBe("upi://pay?pa=shop%40okhdfc&pn=Indigo%20%26%20Co&am=1234.50&cu=INR&tn=Invoice%20INV%2F26-27%2F001");
  });
  it("omits a zero amount", () => {
    expect(buildUpiUri({ vpa: "shop@okhdfc" })).toBe("upi://pay?pa=shop%40okhdfc&cu=INR");
  });
});

describe("QR", () => {
  it("encodes to a square matrix", () => {
    const m = qrMatrix("upi://pay?pa=shop@okhdfc&am=10.00&cu=INR");
    expect(m).not.toBeNull();
    expect(m!.size).toBeGreaterThanOrEqual(21);
    expect(m!.path.startsWith("M0 0h7")).toBe(true); // finder pattern, top-left
  });
  it("returns null for empty input and renders SVG", () => {
    expect(qrMatrix("")).toBeNull();
    expect(qrSvg("hello")).toContain("<svg");
  });
});
