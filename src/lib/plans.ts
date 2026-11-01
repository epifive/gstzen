export const PRO_PRICE = { inr: "₹1,999", usd: "$29" };

/** [feature, free, pro] — true = included, string = details */
export const COMPARISON: [string, boolean | string, boolean | string][] = [
  ["GST invoices, quotations and receipts", true, true],
  ["CGST/SGST vs IGST by place of supply, HSN/SAC tax summary", true, true],
  ["UPI QR with the exact amount, bank details, signature", true, true],
  ["Amount in words (lakh/crore), round-off, discounts", true, true],
  ["VAT / sales-tax / no-tax mode, 20+ currencies", true, true],
  ["Print and PDF (A4), unlimited documents", true, true],
  ["JSON backup/restore and documents CSV", true, true],
  ["Templates", "3 templates, 6 colours", "13 templates, any colour"],
  ["Business profiles / branches", "1", "Unlimited, own numbering each"],
  ["Client and product library with autofill", false, true],
  ["Duplicate, convert quote → invoice, recurring invoices", false, true],
  ["Payment status, partial payments, overdue list", false, true],
  ["Reports + GSTR-1 style export (B2B, B2CL, B2CS, HSN)", false, true],
  ["Excel (.xlsx) and line-item CSV export", false, true],
  ["WhatsApp / email share and payment reminders", false, true],
  ["Payment link (Razorpay, Stripe, PayPal) on the invoice", false, true],
  ["White-label: your name, logo and domain, no EpiFive branding", false, true],
  ["Licence", "MIT", "Commercial, 1 year of updates + support"],
];
