/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode } from "react";
import { computeTotals, type Totals } from "@/lib/calc";
import { stateLabel } from "@/lib/gst";
import { formatMoney, formatNumber } from "@/lib/money";
import { displayDate } from "@/lib/numbering";
import type { Doc } from "@/lib/types";
import { buildUpiUri, isValidVpa } from "@/lib/upi";
import { amountInWords } from "@/lib/words";
import { QrCode } from "./QrCode";
import { getTemplate, type TemplateSpec } from "./templates/specs";

const FONTS: Record<TemplateSpec["font"], string> = {
  sans: "var(--font-geist-sans), ui-sans-serif, system-ui, 'Segoe UI', Roboto, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', Cambria, serif",
  mono: "var(--font-geist-mono), ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
};

const pct = (n: number) => `${Number(n.toFixed(3))}%`;

export interface DocViewProps {
  doc: Doc;
  totals?: Totals;
  /** Adds the page frame (A4 size, padding). */
  paper?: boolean;
  /** Optional extra block rendered after the totals (used by Pro for payment links). */
  extra?: ReactNode;
  /** Optional footer line (Pro white-label replaces this). */
  footer?: ReactNode;
}

export function DocView({ doc, totals, paper = true, extra, footer }: DocViewProps) {
  const t = totals ?? computeTotals(doc);
  const spec = getTemplate(doc.template);
  const accent = /^#[0-9a-fA-F]{6}$/.test(doc.accent) ? doc.accent : "#4f46e5";
  const money = (v: number) => formatMoney(v, doc.currency);
  const n = (v: number) => formatNumber(v, doc.currency);
  const gst = doc.taxMode === "gst";
  const taxOn = doc.taxMode !== "none";
  const taxName = gst ? "GST" : doc.taxLabel || "Tax";
  const showHsn = gst || doc.items.some((i) => i.hsn.trim());
  const showDisc = doc.items.some((i) => Number(i.discountPct) > 0);
  const isReceipt = doc.type === "receipt";
  const f = doc.from;
  const c = doc.client;

  const upiOk =
    doc.showUpiQr && !isReceipt && doc.currency === "INR" && isValidVpa(f.upiId) && (t.balance > 0 || t.total > 0);
  const upiAmount = t.paid > 0 ? t.balance : t.total;
  const upiUri = upiOk
    ? buildUpiUri({ vpa: f.upiId, name: f.upiName || f.name, amount: upiAmount, note: `${doc.title} ${doc.number}` })
    : "";
  const bank = f.bank;
  const hasBank = doc.showBank && !isReceipt && !!(bank.accountNumber || bank.ifsc || bank.bankName);

  const style = { "--accent": accent, fontFamily: FONTS[spec.font] } as CSSProperties;
  const rounded = spec.rounded ? "rounded-lg" : "";
  const box = spec.table === "grid" ? "border border-neutral-300" : "";

  const title = (
    <div className={spec.header === "band" ? "text-white" : ""}>
      {spec.title === "pill" ? (
        <span
          className="inline-block rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-white"
          style={{ background: accent }}
        >
          {doc.title}
        </span>
      ) : (
        <h1
          className={
            spec.title === "caps"
              ? "text-[18px] font-bold uppercase tracking-[0.12em]"
              : "text-[28px] font-semibold leading-none tracking-tight"
          }
          style={{ color: spec.header === "band" ? "#fff" : accent }}
        >
          {doc.title}
        </h1>
      )}
      {doc.reverseCharge && gst && <div className="mt-1 text-[10px] font-semibold uppercase">Tax payable on reverse charge</div>}
    </div>
  );

  const metaRows: [string, string][] = [
    [isReceipt ? "Receipt No." : doc.type === "quote" ? "Quote No." : "Invoice No.", doc.number],
    [isReceipt ? "Receipt date" : "Date", displayDate(doc.date)],
  ];
  if (doc.dueDate && !isReceipt) metaRows.push([doc.type === "quote" ? "Valid until" : "Due date", displayDate(doc.dueDate)]);
  if (doc.poNumber) metaRows.push(["PO / Ref.", doc.poNumber]);
  if (gst && doc.placeOfSupply) metaRows.push(["Place of supply", stateLabel(doc.placeOfSupply)]);
  if (gst && doc.type === "invoice") metaRows.push(["Reverse charge", doc.reverseCharge ? "Yes" : "No"]);

  const meta = (
    <table className="text-[10.5px]">
      <tbody>
        {metaRows.map(([k, v]) => (
          <tr key={k}>
            <td className={`py-[1px] pr-3 ${spec.header === "band" ? "text-white/75" : "text-neutral-500"}`}>{k}</td>
            <td className={`py-[1px] text-right font-semibold ${spec.header === "band" ? "text-white" : "text-neutral-900"}`}>
              {v || "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const seller = (light = false) => (
    <div className={`text-[10.5px] leading-snug ${light ? "text-white/85" : "text-neutral-600"}`}>
      <div className={`text-[15px] font-bold leading-tight ${light ? "text-white" : "text-neutral-900"}`}>{f.name || "Your business name"}</div>
      {f.address && <div className="mt-0.5 whitespace-pre-line">{f.address}</div>}
      {gst && f.stateCode && <div>State: {stateLabel(f.stateCode)}</div>}
      {!gst && f.country && f.country !== "India" && <div>{f.country}</div>}
      <div className="mt-0.5 flex flex-wrap gap-x-3">
        {gst && f.gstin && (
          <span className="whitespace-nowrap">
            <b className={light ? "text-white" : "text-neutral-800"}>GSTIN</b> {f.gstin}
          </span>
        )}
        {gst && f.pan && (
          <span className="whitespace-nowrap">
            <b className={light ? "text-white" : "text-neutral-800"}>PAN</b> {f.pan}
          </span>
        )}
        {!gst && f.taxId && (
          <span>
            <b className={light ? "text-white" : "text-neutral-800"}>{doc.taxMode === "vat" ? `${taxName} No.` : "Tax ID"}</b> {f.taxId}
          </span>
        )}
      </div>
      {(f.phone || f.email || f.website) && <div>{[f.phone, f.email, f.website].filter(Boolean).join("  ·  ")}</div>}
    </div>
  );

  const logo = f.logo ? <img src={f.logo} alt="" className="h-14 w-auto max-w-[160px] object-contain" /> : null;

  let header: ReactNode;
  if (spec.header === "band") {
    header = (
      <div className={`-mx-[12mm] -mt-[12mm] mb-5 px-[12mm] pb-6 pt-[10mm]`} style={{ background: accent }} data-pdf-row>
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            {logo && <div className="rounded-md bg-white p-1.5">{logo}</div>}
            {seller(true)}
          </div>
          <div className="flex flex-col items-end gap-3 text-right">
            {title}
            {meta}
          </div>
        </div>
      </div>
    );
  } else if (spec.header === "centered") {
    header = (
      <div className="mb-5 text-center" data-pdf-row>
        {logo && <div className="mb-2 flex justify-center">{logo}</div>}
        <div className="flex justify-center">{seller()}</div>
        <div className="mt-4 flex items-end justify-between border-y border-neutral-300 py-2 text-left">
          {title}
          {meta}
        </div>
      </div>
    );
  } else if (spec.header === "stacked") {
    header = (
      <div className="mb-6" data-pdf-row>
        <div className="flex items-start justify-between gap-6">
          {title}
          {logo}
        </div>
        <div className="mt-5 flex items-start justify-between gap-6">
          {seller()}
          {meta}
        </div>
      </div>
    );
  } else {
    header = (
      <div className={`mb-3 ${box} ${rounded}`} data-pdf-row>
        <div className="flex items-start justify-between gap-6 p-3">
          <div className="flex items-start gap-3">
            {logo}
            {seller()}
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            {title}
            {meta}
          </div>
        </div>
      </div>
    );
  }

  const partyBlock = (label: string, body: ReactNode) => (
    <div className={`flex-1 ${spec.table === "grid" ? "border border-neutral-300 p-3" : spec.rounded ? "rounded-lg bg-neutral-50 p-3" : ""} ${rounded}`}>
      <div className="mb-1 text-[9.5px] font-bold uppercase tracking-wider" style={{ color: accent }}>
        {label}
      </div>
      {body}
    </div>
  );

  const billTo = (
    <div className="text-[10.5px] leading-snug text-neutral-600">
      <div className="text-[12.5px] font-semibold text-neutral-900">{c.name || "Client name"}</div>
      {c.address && <div className="whitespace-pre-line">{c.address}</div>}
      {gst && c.stateCode && <div>State: {stateLabel(c.stateCode)}</div>}
      {c.country && c.country !== "India" && <div>{c.country}</div>}
      {gst && c.gstin && (
        <div>
          <b className="text-neutral-800">GSTIN</b> {c.gstin}
        </div>
      )}
      {c.taxId && (
        <div>
          <b className="text-neutral-800">{doc.taxMode === "vat" ? `${taxName} No.` : "Tax ID"}</b> {c.taxId}
        </div>
      )}
      {(c.phone || c.email) && <div>{[c.phone, c.email].filter(Boolean).join("  ·  ")}</div>}
    </div>
  );

  const headCls =
    spec.table === "accent-head"
      ? "text-white"
      : spec.table === "grid"
        ? "bg-neutral-100 text-neutral-700"
        : "text-neutral-500";
  const headStyle = spec.table === "accent-head" ? { background: accent } : spec.table === "zebra" ? { borderBottom: `2px solid ${accent}` } : undefined;
  const cell = spec.table === "grid" ? "border border-neutral-300 px-2 py-1.5" : "px-2 py-1.5";
  const rowCls = (i: number) =>
    spec.table === "zebra" ? (i % 2 ? "bg-neutral-50" : "") : spec.table === "lines" || spec.table === "accent-head" ? "border-b border-neutral-200" : "";

  const items = (
    <table className="w-full border-collapse text-[10.5px]">
      <thead>
        <tr className={headCls} style={headStyle}>
          <th className={`${cell} w-6 text-left font-semibold`}>#</th>
          <th className={`${cell} text-left font-semibold`}>{isReceipt ? "Description" : "Item / Description"}</th>
          {showHsn && <th className={`${cell} text-left font-semibold`}>HSN/SAC</th>}
          <th className={`${cell} text-right font-semibold`}>Qty</th>
          <th className={`${cell} text-right font-semibold`}>Rate</th>
          {showDisc && <th className={`${cell} text-right font-semibold`}>Disc.</th>}
          {taxOn && <th className={`${cell} text-right font-semibold`}>{taxName} %</th>}
          <th className={`${cell} text-right font-semibold`}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {doc.items.length === 0 && (
          <tr>
            <td className={`${cell} text-center text-neutral-400`} colSpan={8}>
              No items yet
            </td>
          </tr>
        )}
        {doc.items.map((it, i) => (
          <tr key={it.id} className={rowCls(i)} data-pdf-row>
            <td className={`${cell} align-top text-neutral-500`}>{i + 1}</td>
            <td className={`${cell} align-top whitespace-pre-line text-neutral-900`}>{it.description || "—"}</td>
            {showHsn && <td className={`${cell} align-top text-neutral-600`}>{it.hsn}</td>}
            <td className={`${cell} align-top text-right tabular-nums`}>
              {Number(it.qty) || 0}
              {it.unit ? <span className="text-neutral-500"> {it.unit}</span> : null}
            </td>
            <td className={`${cell} align-top text-right tabular-nums`}>{n(Number(it.rate) || 0)}</td>
            {showDisc && <td className={`${cell} align-top text-right tabular-nums`}>{Number(it.discountPct) ? pct(Number(it.discountPct)) : ""}</td>}
            {taxOn && <td className={`${cell} align-top text-right tabular-nums`}>{pct(Number(it.taxRate) || 0)}</td>}
            <td className={`${cell} align-top text-right font-medium tabular-nums`}>{n(t.lines[i]?.net ?? 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const totalRows: [string, string, boolean?][] = [];
  totalRows.push([doc.pricesIncludeTax && taxOn ? "Subtotal (incl. tax)" : "Subtotal", n(t.subtotal)]);
  if (t.docDiscount > 0)
    totalRows.push([`Discount${doc.discount.type === "percent" ? ` (${pct(Math.min(doc.discount.value, 100))})` : ""}`, `- ${n(t.docDiscount)}`]);
  if (taxOn) {
    totalRows.push(["Taxable value", n(t.taxable)]);
    for (const r of t.byRate) {
      if (r.tax === 0) continue;
      if (gst && t.intraState) {
        totalRows.push([`CGST @ ${pct(r.rate / 2)}`, n(r.cgst)]);
        totalRows.push([`${t.stateTaxName} @ ${pct(r.rate / 2)}`, n(r.sgst)]);
      } else if (gst) {
        totalRows.push([`IGST @ ${pct(r.rate)}`, n(r.igst)]);
      } else {
        totalRows.push([`${taxName} @ ${pct(r.rate)}`, n(r.tax)]);
      }
    }
  }
  if (t.roundOff !== 0) totalRows.push(["Round off", `${t.roundOff > 0 ? "+" : "-"} ${n(Math.abs(t.roundOff))}`]);

  const totalsBox = (
    <div className={`w-[46%] text-[10.5px] ${spec.table === "grid" ? "border border-neutral-300" : ""} ${rounded}`}>
      <table className="w-full">
        <tbody>
          {totalRows.map(([k, v]) => (
            <tr key={k}>
              <td className="px-3 py-[3px] text-neutral-600">{k}</td>
              <td className="px-3 py-[3px] text-right tabular-nums text-neutral-900">{v}</td>
            </tr>
          ))}
          <tr className="text-white" style={{ background: accent }}>
            <td className={`px-3 py-2 text-[12px] font-bold ${spec.rounded ? "rounded-l-md" : ""}`}>
              {isReceipt ? "Total" : "Total"} ({doc.currency})
            </td>
            <td className={`px-3 py-2 text-right text-[13px] font-bold tabular-nums ${spec.rounded ? "rounded-r-md" : ""}`}>{money(t.total)}</td>
          </tr>
          {isReceipt ? (
            <tr>
              <td className="px-3 pt-2 font-semibold text-neutral-800">Amount received</td>
              <td className="px-3 pt-2 text-right font-semibold tabular-nums text-neutral-900">{money(t.paid)}</td>
            </tr>
          ) : (
            t.paid > 0 && (
              <>
                <tr>
                  <td className="px-3 pt-2 text-neutral-600">Amount paid</td>
                  <td className="px-3 pt-2 text-right tabular-nums">- {n(t.paid)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-[3px] font-semibold text-neutral-900">Balance due</td>
                  <td className="px-3 py-[3px] text-right font-semibold tabular-nums">{money(t.balance)}</td>
                </tr>
              </>
            )
          )}
          {isReceipt && t.balance > 0.004 && (
            <tr>
              <td className="px-3 py-[3px] text-neutral-600">Balance due</td>
              <td className="px-3 py-[3px] text-right tabular-nums">{money(t.balance)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const words = (
    <div className="text-[10.5px]">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-500">Amount in words</div>
      <div className="mt-0.5 font-medium text-neutral-900">{amountInWords(isReceipt ? t.paid : t.total, doc.currency)}</div>
    </div>
  );

  const hsnRows = t.byHsn.filter((r) => r.taxable !== 0 || r.tax !== 0);
  const taxSummary =
    gst && hsnRows.length > 0 && !isReceipt ? (
      <div className="mt-3" data-pdf-row>
        <div className="mb-1 text-[9.5px] font-bold uppercase tracking-wider text-neutral-500">Tax summary (HSN/SAC)</div>
        <table className="w-full border-collapse text-[9.5px]">
          <thead>
            <tr className="bg-neutral-100 text-neutral-700">
              <th className="border border-neutral-300 px-2 py-1 text-left font-semibold">HSN/SAC</th>
              <th className="border border-neutral-300 px-2 py-1 text-right font-semibold">Taxable value</th>
              {t.intraState ? (
                <>
                  <th className="border border-neutral-300 px-2 py-1 text-right font-semibold">CGST</th>
                  <th className="border border-neutral-300 px-2 py-1 text-right font-semibold">{t.stateTaxName}</th>
                </>
              ) : (
                <th className="border border-neutral-300 px-2 py-1 text-right font-semibold">IGST</th>
              )}
              <th className="border border-neutral-300 px-2 py-1 text-right font-semibold">Total tax</th>
            </tr>
          </thead>
          <tbody>
            {hsnRows.map((r) => (
              <tr key={r.key}>
                <td className="border border-neutral-300 px-2 py-1">{r.hsn || "—"}</td>
                <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">{n(r.taxable)}</td>
                {t.intraState ? (
                  <>
                    <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">
                      {n(r.cgst)} <span className="text-neutral-500">@{pct(r.rate / 2)}</span>
                    </td>
                    <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">
                      {n(r.sgst)} <span className="text-neutral-500">@{pct(r.rate / 2)}</span>
                    </td>
                  </>
                ) : (
                  <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">
                    {n(r.igst)} <span className="text-neutral-500">@{pct(r.rate)}</span>
                  </td>
                )}
                <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">{n(r.tax)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="border border-neutral-300 px-2 py-1">Total</td>
              <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">{n(t.taxable)}</td>
              {t.intraState ? (
                <>
                  <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">{n(t.cgst)}</td>
                  <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">{n(t.sgst)}</td>
                </>
              ) : (
                <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">{n(t.igst)}</td>
              )}
              <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">{n(t.tax)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    ) : null;

  const receiptBox = isReceipt ? (
    <div className={`relative mt-3 flex items-center justify-between gap-6 p-3 text-[10.5px] ${spec.rounded ? "rounded-lg bg-neutral-50" : "border border-neutral-300"}`} data-pdf-row>
      <div className="grid grid-cols-3 gap-x-8 gap-y-1">
        <div>
          <div className="text-neutral-500">Payment mode</div>
          <div className="font-semibold text-neutral-900">{doc.payment.mode || "—"}</div>
        </div>
        <div>
          <div className="text-neutral-500">Payment date</div>
          <div className="font-semibold text-neutral-900">{displayDate(doc.payment.date) || "—"}</div>
        </div>
        <div>
          <div className="text-neutral-500">Reference</div>
          <div className="font-semibold text-neutral-900">{doc.payment.reference || "—"}</div>
        </div>
      </div>
      <div
        className="rotate-[-8deg] rounded-md border-[3px] px-3 py-1 text-[18px] font-black uppercase tracking-widest"
        style={{ borderColor: t.balance > 0.004 ? "#d97706" : "#059669", color: t.balance > 0.004 ? "#d97706" : "#059669" }}
      >
        {t.balance > 0.004 ? "Part paid" : "Paid"}
      </div>
    </div>
  ) : null;

  const payBlock =
    hasBank || upiOk ? (
      <div className={`mt-3 flex items-stretch gap-4 ${spec.table === "grid" ? "border border-neutral-300 p-3" : spec.rounded ? "rounded-lg bg-neutral-50 p-3" : "border-t border-neutral-200 pt-3"}`} data-pdf-row>
        {hasBank && (
          <div className="flex-1 text-[10.5px] leading-snug text-neutral-700">
            <div className="mb-1 text-[9.5px] font-bold uppercase tracking-wider" style={{ color: accent }}>
              Bank details
            </div>
            {bank.accountName && <div>A/c name: <b className="text-neutral-900">{bank.accountName}</b></div>}
            {bank.accountNumber && <div>A/c no.: <b className="text-neutral-900">{bank.accountNumber}</b></div>}
            {bank.ifsc && <div>IFSC: <b className="text-neutral-900">{bank.ifsc}</b></div>}
            {bank.swift && <div>SWIFT: <b className="text-neutral-900">{bank.swift}</b></div>}
            {(bank.bankName || bank.branch) && <div>{[bank.bankName, bank.branch].filter(Boolean).join(", ")}</div>}
          </div>
        )}
        {upiOk && (
          <div className="flex items-center gap-3">
            <QrCode value={upiUri} size={92} title={`UPI QR for ${money(upiAmount)}`} />
            <div className="max-w-[150px] text-[10px] leading-snug text-neutral-600">
              <div className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: accent }}>
                Scan to pay with UPI
              </div>
              <div className="mt-1 text-[13px] font-bold text-neutral-900">{money(upiAmount)}</div>
              <div className="break-all">{f.upiId}</div>
              <div className="text-neutral-400">GPay · PhonePe · Paytm · BHIM</div>
            </div>
          </div>
        )}
      </div>
    ) : null;

  const shipTo = c.shipTo?.trim();

  const content = (
    <div className="relative text-neutral-900" style={style}>
      {spec.topRule && <div className="-mx-[12mm] -mt-[12mm] mb-[9mm] h-[5px]" style={{ background: accent }} />}
      {doc.sample && (
        <div className="absolute right-0 top-0 rounded bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800" data-sample-badge>
          Sample data
        </div>
      )}
      {header}

      <div className="mb-3 flex gap-3" data-pdf-row>
        {partyBlock(isReceipt ? "Received from" : "Bill to", billTo)}
        {shipTo && !isReceipt && partyBlock("Ship to", <div className="whitespace-pre-line text-[10.5px] leading-snug text-neutral-700">{shipTo}</div>)}
      </div>

      {items}

      <div className="mt-3 flex items-start justify-between gap-6" data-pdf-row>
        <div className="flex-1 space-y-3">
          {words}
          {doc.notes.trim() && (
            <div className="text-[10.5px]">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-500">Notes</div>
              <div className="mt-0.5 whitespace-pre-line text-neutral-700">{doc.notes}</div>
            </div>
          )}
        </div>
        {totalsBox}
      </div>

      {receiptBox}
      {taxSummary}
      {payBlock}
      {extra}

      <div className="mt-3 flex items-end justify-between gap-6" data-pdf-row>
        <div className="flex-1 text-[10px] text-neutral-600">
          {doc.terms.trim() && (
            <>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-500">Terms &amp; conditions</div>
              <div className="mt-0.5 whitespace-pre-line">{doc.terms}</div>
            </>
          )}
        </div>
        {doc.showSignature && (
          <div className="min-w-[170px] text-center text-[10px] text-neutral-600">
            <div className="font-semibold text-neutral-800">For {f.name || "your business"}</div>
            <div className="flex h-[44px] items-end justify-center">
              {f.signature ? <img src={f.signature} alt="Signature" className="max-h-[42px] max-w-[160px] object-contain" /> : null}
            </div>
            <div className="mt-1 border-t border-neutral-300 pt-1">Authorised signatory</div>
          </div>
        )}
      </div>

      <div className="mt-3 text-center text-[9px] text-neutral-400" data-pdf-row>
        {footer ?? "This is a computer-generated document."}
      </div>
    </div>
  );

  if (!paper) return content;
  return (
    <div className="doc-page" data-doc-page>
      {content}
    </div>
  );
}
