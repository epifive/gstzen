/** UPI deep links (NPCI "upi://pay" URI). The QR is generated locally; nothing is sent anywhere. */

const VPA_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;

export function isValidVpa(vpa: string): boolean {
  return VPA_RE.test(vpa.trim());
}

export interface UpiParams {
  vpa: string;
  name?: string;
  amount?: number;
  note?: string;
  currency?: string;
}

const enc = (s: string) => encodeURIComponent(s).replace(/%20/g, "%20");

/** Builds `upi://pay?pa=..&pn=..&am=..&cu=INR&tn=..`. Amount is fixed to 2 decimals; omitted when 0. */
export function buildUpiUri({ vpa, name, amount, note, currency = "INR" }: UpiParams): string {
  const params: string[] = [`pa=${enc(vpa.trim())}`];
  if (name?.trim()) params.push(`pn=${enc(name.trim().slice(0, 50))}`);
  if (amount && amount > 0) params.push(`am=${amount.toFixed(2)}`);
  params.push(`cu=${currency}`);
  if (note?.trim()) params.push(`tn=${enc(note.trim().slice(0, 80))}`);
  return `upi://pay?${params.join("&")}`;
}
