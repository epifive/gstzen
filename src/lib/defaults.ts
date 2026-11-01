import { uid } from "./id";
import { addDaysISO, formatDocNumber, todayISO } from "./numbering";
import type { Business, Defaults, Doc, DocType, LineItem, Party, Settings, StoreData, TaxMode } from "./types";

export const DOC_TYPES: { type: DocType; label: string; plural: string }[] = [
  { type: "invoice", label: "Invoice", plural: "Invoices" },
  { type: "quote", label: "Quotation", plural: "Quotations" },
  { type: "receipt", label: "Receipt", plural: "Receipts" },
];

export const DOC_TITLES: Record<DocType, string[]> = {
  invoice: ["Tax Invoice", "Invoice", "Bill of Supply", "Proforma Invoice", "Export Invoice", "Commercial Invoice"],
  quote: ["Quotation", "Estimate", "Proforma Invoice", "Price Quote"],
  receipt: ["Payment Receipt", "Receipt", "Cash Receipt", "Cash Memo"],
};

export function defaultTitle(type: DocType, taxMode: TaxMode): string {
  if (type === "invoice") return taxMode === "gst" ? "Tax Invoice" : "Invoice";
  if (type === "quote") return "Quotation";
  return "Payment Receipt";
}

export const PAYMENT_MODES = ["UPI", "Bank transfer", "Cash", "Card", "Cheque", "Online", "Other"];

export const UNITS = ["Nos", "Pcs", "Hrs", "Days", "Kg", "g", "Ltr", "m", "Box", "Set", "Pair", "Month", "Job"];

export const ACCENTS = ["#4f46e5", "#0d9488", "#0f172a", "#dc2626", "#ea580c", "#7c3aed"];

export function emptyBusiness(): Business {
  return {
    name: "",
    address: "",
    stateCode: "",
    country: "India",
    gstin: "",
    pan: "",
    taxId: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
    signature: "",
    bank: { accountName: "", accountNumber: "", ifsc: "", bankName: "", branch: "", swift: "" },
    upiId: "",
    upiName: "",
  };
}

export function emptyParty(): Party {
  return { name: "", address: "", stateCode: "", country: "India", gstin: "", taxId: "", phone: "", email: "", shipTo: "" };
}

export function defaultDefaults(): Defaults {
  return {
    taxMode: "gst",
    taxLabel: "VAT",
    currency: "INR",
    template: "classic",
    accent: ACCENTS[0],
    pricesIncludeTax: false,
    roundOff: true,
    dueDays: 15,
    quoteValidDays: 30,
    notes: "Thank you for your business!",
    terms: "Payment due within 15 days. Goods once sold will not be taken back.",
    showUpiQr: true,
    showBank: true,
    showSignature: true,
    defaultTaxRate: 18,
  };
}

export function defaultSettings(): Settings {
  return {
    business: emptyBusiness(),
    defaults: defaultDefaults(),
    numbering: {
      invoice: { format: "INV/{FYS}/{N}", next: 1, pad: 3 },
      quote: { format: "QT/{FYS}/{N}", next: 1, pad: 3 },
      receipt: { format: "RCPT/{FYS}/{N}", next: 1, pad: 3 },
    },
  };
}

export function emptyStore(): StoreData {
  return { version: 1, settings: defaultSettings(), docs: [] };
}

export function newItem(taxRate = 18): LineItem {
  return { id: uid("li_"), description: "", hsn: "", qty: 1, unit: "Nos", rate: 0, discountPct: 0, taxRate };
}

/** Creates a new document from settings. Does not change the counter (the store does that on save). */
export function createDoc(type: DocType, settings: Settings, now = new Date()): Doc {
  const d = settings.defaults;
  const date = todayISO(now);
  const rule = settings.numbering[type];
  const stamp = now.toISOString();
  const taxRate = d.taxMode === "none" ? 0 : d.defaultTaxRate;
  return {
    id: uid("doc_"),
    type,
    title: defaultTitle(type, d.taxMode),
    number: formatDocNumber(rule, rule.next, now),
    date,
    dueDate: type === "invoice" ? addDaysISO(date, d.dueDays) : type === "quote" ? addDaysISO(date, d.quoteValidDays) : "",
    poNumber: "",
    from: structuredClone(settings.business),
    client: emptyParty(),
    placeOfSupply: settings.business.stateCode,
    reverseCharge: false,
    taxMode: d.taxMode,
    taxLabel: d.taxLabel,
    currency: d.taxMode === "gst" ? "INR" : d.currency,
    pricesIncludeTax: d.pricesIncludeTax,
    roundOff: d.roundOff,
    items: [newItem(taxRate)],
    discount: { type: "percent", value: 0 },
    notes: d.notes,
    terms: type === "receipt" ? "" : d.terms,
    showUpiQr: type !== "receipt" && d.showUpiQr,
    showBank: type !== "receipt" && d.showBank,
    showSignature: d.showSignature,
    template: d.template,
    accent: d.accent,
    payment: { mode: "UPI", reference: "", date: type === "receipt" ? date : "", amountPaid: null },
    createdAt: stamp,
    updatedAt: stamp,
  };
}
