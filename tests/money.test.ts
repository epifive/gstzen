import { describe, expect, it } from "vitest";
import { formatMoney, parseAmount, roundTo } from "@/lib/money";
import { addDaysISO, displayDate, financialYear, formatDocNumber } from "@/lib/numbering";

describe("money", () => {
  it("rounds without float drift", () => {
    expect(roundTo(1.005)).toBe(1.01);
    expect(roundTo(2.675)).toBe(2.68);
    expect(roundTo(-1.005)).toBe(-1.01);
    expect(roundTo(10.5, 0)).toBe(11);
  });
  it("formats INR with Indian grouping", () => {
    expect(formatMoney(1234567.5, "INR")).toBe("₹12,34,567.50");
    expect(formatMoney(-50, "INR")).toBe("-₹50.00");
  });
  it("formats other currencies", () => {
    expect(formatMoney(1234567.5, "USD")).toBe("$1,234,567.50");
    expect(formatMoney(99, "AED")).toBe("AED 99.00");
    expect(formatMoney(1500, "JPY")).toBe("¥1,500");
  });
  it("parses user input", () => {
    expect(parseAmount("1,23,456.50")).toBe(123456.5);
    expect(parseAmount("abc")).toBe(0);
  });
});

describe("numbering", () => {
  it("computes the Indian financial year", () => {
    expect(financialYear("2026-11-01").full).toBe("2026-27");
    expect(financialYear("2027-03-31").short).toBe("26-27");
    expect(financialYear("2027-04-01").short).toBe("27-28");
  });
  it("formats document numbers with tokens", () => {
    expect(formatDocNumber({ format: "INV/{FYS}/{N}", pad: 3 }, 7, "2026-11-01")).toBe("INV/26-27/007");
    expect(formatDocNumber({ format: "{YYYY}{MM}-{N}", pad: 4 }, 12, "2026-01-15")).toBe("202601-0012");
    expect(formatDocNumber({ format: "Q-", pad: 2 }, 5, "2026-01-15")).toBe("Q-05");
  });
  it("adds days and displays dates", () => {
    expect(addDaysISO("2026-12-25", 15)).toBe("2027-01-09");
    expect(displayDate("2026-11-01")).toBe("01 Nov 2026");
    expect(displayDate("")).toBe("");
  });
});
