/** Indian GST helpers: state codes, GSTIN validation, place of supply. */

export interface GstState {
  code: string;
  name: string;
  ut?: boolean;
}

export const GST_STATES: GstState[] = [
  { code: "01", name: "Jammu and Kashmir", ut: true },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh", ut: true },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu", ut: true },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep", ut: true },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry", ut: true },
  { code: "35", name: "Andaman and Nicobar Islands", ut: true },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh", ut: true },
  { code: "97", name: "Other Territory" },
  { code: "96", name: "Outside India (export)" },
];

export const EXPORT_STATE_CODE = "96";

export function stateName(code: string): string {
  return GST_STATES.find((s) => s.code === code)?.name ?? "";
}

export function stateLabel(code: string): string {
  const name = stateName(code);
  return name ? `${name} (${code})` : "";
}

/** GST slabs after the Sept 2025 rationalisation, plus special rates. Custom rates are allowed too. */
export const GST_RATES = [0, 0.25, 3, 5, 18, 40];
export const VAT_PRESET_RATES = [0, 5, 7.5, 10, 15, 20];

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][A-Z][0-9A-Z]$/;

/** Computes the GSTIN check character for the first 14 characters. */
export function gstinCheckChar(first14: string): string {
  const s = first14.toUpperCase();
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = GSTIN_CHARS.indexOf(s[i]);
    if (v < 0) return "";
    const p = v * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(p / 36) + (p % 36);
  }
  return GSTIN_CHARS[(36 - (sum % 36)) % 36];
}

export type GstinCheck =
  | { ok: true; stateCode: string; pan: string }
  | { ok: false; error: string };

export function validateGstin(raw: string): GstinCheck {
  const g = raw.trim().toUpperCase();
  if (g.length !== 15) return { ok: false, error: "A GSTIN has 15 characters." };
  if (!GSTIN_RE.test(g)) return { ok: false, error: "This does not look like a GSTIN (format 22AAAAA0000A1Z5)." };
  const state = g.slice(0, 2);
  const n = Number(state);
  if (!((n >= 1 && n <= 38) || n === 97 || n === 99)) return { ok: false, error: `Unknown state code ${state}.` };
  if (gstinCheckChar(g.slice(0, 14)) !== g[14]) return { ok: false, error: "Checksum does not match. Check for a typo." };
  return { ok: true, stateCode: state, pan: g.slice(2, 12) };
}

export function validatePan(raw: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(raw.trim().toUpperCase());
}

/**
 * Supply type for GST. Intra-state supply → CGST + SGST (UTGST in UTs without legislature).
 * Inter-state supply (or export, or unknown seller state) → IGST.
 */
export function isIntraState(sellerState: string, placeOfSupply: string): boolean {
  if (!sellerState || !placeOfSupply) return false;
  if (placeOfSupply === EXPORT_STATE_CODE) return false;
  return sellerState === placeOfSupply;
}

/** For union territories without a legislature the "state" half is called UTGST. */
export function stateTaxLabel(stateCode: string): "SGST" | "UTGST" {
  return ["04", "26", "31", "35", "38"].includes(stateCode) ? "UTGST" : "SGST";
}

/** GST invoice numbers: max 16 characters, only letters, digits, "-" and "/". */
export function checkGstInvoiceNumber(num: string): string | null {
  if (!num.trim()) return "Invoice number is required.";
  if (num.length > 16) return "GST invoice numbers can be at most 16 characters.";
  if (!/^[A-Za-z0-9/-]+$/.test(num)) return "GST invoice numbers may only use letters, digits, \"-\" and \"/\".";
  return null;
}
