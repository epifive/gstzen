import { IconShield } from "./icons";

export const DISCLAIMER_TEXT =
  "This tool makes regular GST tax invoices, quotations and receipts. It is not a GST e-invoicing system: it does not register invoices on the Invoice Registration Portal (IRP) and does not generate an IRN or the signed e-invoice QR code. Businesses that must issue e-invoices (aggregate turnover above the notified threshold, currently ₹5 crore) have to report B2B invoices on the IRP. You are responsible for tax rates, HSN/SAC codes and place of supply; check with your tax adviser. This is not legal or tax advice.";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex gap-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 ${compact ? "p-3 text-xs" : "p-4 text-sm"}`}
      role="note"
    >
      <IconShield className="mt-0.5 size-4 shrink-0" />
      <p>
        <b>Not GST e-invoicing (IRN).</b> {DISCLAIMER_TEXT}
      </p>
    </div>
  );
}
