import { getCurrency, roundTo } from "./money";

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below100(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS[t]}-${ONES[o]}` : TENS[t];
}

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (r) parts.push(below100(r));
  return parts.join(" ");
}

/** Indian system: Thousand, Lakh, Crore (crores repeat for very large numbers). */
export function indianWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000);
  const rest = n % 10000000;
  const lakh = Math.floor(rest / 100000);
  const thousand = Math.floor((rest % 100000) / 1000);
  const hundreds = rest % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${indianWords(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thousand) parts.push(`${below100(thousand)} Thousand`);
  if (hundreds) parts.push(below1000(hundreds));
  return parts.join(" ");
}

const SCALES = ["", "Thousand", "Million", "Billion", "Trillion", "Quadrillion"];

/** International system: Thousand, Million, Billion... */
export function internationalWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";
  const parts: string[] = [];
  let i = 0;
  while (n > 0 && i < SCALES.length) {
    const chunk = n % 1000;
    if (chunk) parts.unshift(SCALES[i] ? `${below1000(chunk)} ${SCALES[i]}` : below1000(chunk));
    n = Math.floor(n / 1000);
    i++;
  }
  return parts.join(" ");
}

/**
 * "Rupees One Lakh Twenty-Three Thousand Four Hundred Fifty-Six and Seventy-Eight Paise Only"
 * "US Dollars One Thousand Two Hundred and Five Cents Only"
 */
export function amountInWords(amount: number, currencyCode = "INR"): string {
  const c = getCurrency(currencyCode);
  const value = roundTo(Math.abs(amount), c.decimals);
  const major = Math.floor(value);
  const minor = c.decimals ? Math.round((value - major) * 10 ** c.decimals) : 0;
  const words = c.code === "INR" || c.locale === "en-IN" ? indianWords : internationalWords;
  let out = `${c.major} ${words(major)}`;
  if (minor > 0 && c.minor) out += ` and ${words(minor)} ${c.minor}`;
  out += " Only";
  return amount < 0 ? `Minus ${out}` : out;
}
