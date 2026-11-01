export type DocType = "invoice" | "quote" | "receipt";
export type TaxMode = "gst" | "vat" | "none";
export type DiscountType = "percent" | "amount";

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch: string;
  swift: string;
}

/** The seller (your business). Snapshotted into every document. */
export interface Business {
  name: string;
  address: string;
  stateCode: string; // GST state code, e.g. "27" (Maharashtra). "" = not in India / not set
  country: string;
  gstin: string;
  pan: string;
  taxId: string; // VAT / TRN / EIN etc. for non-GST mode
  phone: string;
  email: string;
  website: string;
  logo: string; // data URL
  signature: string; // data URL
  bank: BankDetails;
  upiId: string;
  upiName: string;
}

/** The buyer. */
export interface Party {
  name: string;
  address: string;
  stateCode: string;
  country: string;
  gstin: string;
  taxId: string;
  phone: string;
  email: string;
  shipTo: string; // optional shipping address (multi-line)
}

export interface LineItem {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  discountPct: number;
  taxRate: number;
}

export interface PaymentInfo {
  mode: string; // UPI, Cash, Bank transfer, Card, Cheque...
  reference: string;
  date: string;
  amountPaid: number | null; // null = full amount
}

export interface Doc {
  id: string;
  type: DocType;
  title: string; // "Tax Invoice", "Quotation", ...
  number: string;
  date: string; // YYYY-MM-DD
  dueDate: string; // due date (invoice) or valid-until (quote); "" = none
  poNumber: string;
  from: Business;
  client: Party;
  placeOfSupply: string; // GST state code ("96" = other country)
  reverseCharge: boolean;
  taxMode: TaxMode;
  taxLabel: string; // e.g. "VAT", "Sales tax" (non-GST mode)
  currency: string;
  pricesIncludeTax: boolean;
  roundOff: boolean;
  items: LineItem[];
  discount: { type: DiscountType; value: number };
  notes: string;
  terms: string;
  showUpiQr: boolean;
  showBank: boolean;
  showSignature: boolean;
  template: string;
  accent: string;
  payment: PaymentInfo;
  sample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NumberingRule {
  format: string; // tokens: {FY} {FYS} {YYYY} {YY} {MM} {N}
  next: number;
  pad: number;
}

export interface Defaults {
  taxMode: TaxMode;
  taxLabel: string;
  currency: string;
  template: string;
  accent: string;
  pricesIncludeTax: boolean;
  roundOff: boolean;
  dueDays: number;
  quoteValidDays: number;
  notes: string;
  terms: string;
  showUpiQr: boolean;
  showBank: boolean;
  showSignature: boolean;
  defaultTaxRate: number;
}

export interface Settings {
  business: Business;
  defaults: Defaults;
  numbering: Record<DocType, NumberingRule>;
}

export interface StoreData {
  version: 1;
  settings: Settings;
  docs: Doc[];
}
