import { describe, expect, it } from "vitest";
import { amountInWords, indianWords, internationalWords } from "@/lib/words";

describe("amount in words", () => {
  it("uses the Indian system", () => {
    expect(indianWords(0)).toBe("Zero");
    expect(indianWords(15)).toBe("Fifteen");
    expect(indianWords(101)).toBe("One Hundred One");
    expect(indianWords(123456)).toBe("One Lakh Twenty-Three Thousand Four Hundred Fifty-Six");
    expect(indianWords(10000000)).toBe("One Crore");
    expect(indianWords(987654321)).toBe("Ninety-Eight Crore Seventy-Six Lakh Fifty-Four Thousand Three Hundred Twenty-One");
    expect(indianWords(1000000000000)).toBe("One Lakh Crore");
  });
  it("uses the international system", () => {
    expect(internationalWords(1000000)).toBe("One Million");
    expect(internationalWords(1234567)).toBe("One Million Two Hundred Thirty-Four Thousand Five Hundred Sixty-Seven");
  });
  it("formats rupees and paise", () => {
    expect(amountInWords(123456.78, "INR")).toBe(
      "Rupees One Lakh Twenty-Three Thousand Four Hundred Fifty-Six and Seventy-Eight Paise Only",
    );
    expect(amountInWords(500, "INR")).toBe("Rupees Five Hundred Only");
    expect(amountInWords(0.5, "INR")).toBe("Rupees Zero and Fifty Paise Only");
  });
  it("formats other currencies", () => {
    expect(amountInWords(1200.05, "USD")).toBe("US Dollars One Thousand Two Hundred and Five Cents Only");
    expect(amountInWords(1500, "JPY")).toBe("Yen One Thousand Five Hundred Only");
  });
  it("rounds to the minor unit", () => {
    expect(amountInWords(10.999, "INR")).toBe("Rupees Eleven Only");
  });
});
