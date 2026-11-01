export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  decimals: number;
  major: string; // plural name used in "amount in words"
  minor: string; // plural minor unit name ("" = none)
}

export const CURRENCIES: Currency[] = [
  { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN", decimals: 2, major: "Rupees", minor: "Paise" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US", decimals: 2, major: "US Dollars", minor: "Cents" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "en-IE", decimals: 2, major: "Euros", minor: "Cents" },
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB", decimals: 2, major: "Pounds", minor: "Pence" },
  { code: "AED", name: "UAE Dirham", symbol: "AED", locale: "en-AE", decimals: 2, major: "UAE Dirhams", minor: "Fils" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", locale: "en-SA", decimals: 2, major: "Saudi Riyals", minor: "Halalas" },
  { code: "QAR", name: "Qatari Riyal", symbol: "QAR", locale: "en-QA", decimals: 2, major: "Qatari Riyals", minor: "Dirhams" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU", decimals: 2, major: "Australian Dollars", minor: "Cents" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", locale: "en-CA", decimals: 2, major: "Canadian Dollars", minor: "Cents" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", locale: "en-NZ", decimals: 2, major: "New Zealand Dollars", minor: "Cents" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", locale: "en-SG", decimals: 2, major: "Singapore Dollars", minor: "Cents" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", locale: "en-MY", decimals: 2, major: "Ringgit", minor: "Sen" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", locale: "de-CH", decimals: 2, major: "Swiss Francs", minor: "Centimes" },
  { code: "ZAR", name: "South African Rand", symbol: "R", locale: "en-ZA", decimals: 2, major: "Rand", minor: "Cents" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", locale: "en-NG", decimals: 2, major: "Naira", minor: "Kobo" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", locale: "en-KE", decimals: 2, major: "Kenyan Shillings", minor: "Cents" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", locale: "en-IN", decimals: 2, major: "Taka", minor: "Poisha" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "Rs", locale: "en-IN", decimals: 2, major: "Nepalese Rupees", minor: "Paisa" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs", locale: "en-LK", decimals: 2, major: "Sri Lankan Rupees", minor: "Cents" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "Rs", locale: "en-PK", decimals: 2, major: "Pakistani Rupees", minor: "Paisa" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", locale: "en-PH", decimals: 2, major: "Pesos", minor: "Centavos" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP", decimals: 0, major: "Yen", minor: "" },
];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/** Rounds to the currency's minor unit, avoiding binary float drift (1.005 → 1.01). */
export function roundTo(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const f = 10 ** decimals;
  const scaled = Number((Math.abs(value) * f).toPrecision(15));
  const r = Math.round(scaled) / f;
  return value < 0 ? -r : r;
}

export function round2(value: number): number {
  return roundTo(value, 2);
}

const formatters = new Map<string, Intl.NumberFormat>();

/** Formats an amount: "₹1,23,456.00" for INR (Indian grouping), "$123,456.00" for USD etc. */
export function formatMoney(value: number, code: string, opts: { symbol?: boolean } = {}): string {
  const c = getCurrency(code);
  const key = `${c.code}|${opts.symbol === false ? 0 : 1}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(c.locale, {
      minimumFractionDigits: c.decimals,
      maximumFractionDigits: c.decimals,
    });
    formatters.set(key, f);
  }
  const num = f.format(Math.abs(value) < 0.0000001 ? 0 : value);
  if (opts.symbol === false) return num;
  const sep = c.symbol.length > 1 && /[A-Za-z]$/.test(c.symbol) ? " " : "";
  return value < 0 ? `-${c.symbol}${sep}${num.replace("-", "")}` : `${c.symbol}${sep}${num}`;
}

/** Plain number with grouping per currency locale (used in tables). */
export function formatNumber(value: number, code: string): string {
  return formatMoney(value, code, { symbol: false });
}

/** Parse user input like "1,234.50" safely. */
export function parseAmount(input: string): number {
  const n = Number(String(input).replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
