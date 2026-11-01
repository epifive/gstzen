"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { computeTotals } from "@/lib/calc";
import { ACCENTS, DOC_TITLES, DOC_TYPES, PAYMENT_MODES, defaultTitle } from "@/lib/defaults";
import { EXPORT_STATE_CODE, checkGstInvoiceNumber, stateName } from "@/lib/gst";
import { CURRENCIES, formatMoney } from "@/lib/money";
import { docFileName, downloadPdf, printDocument } from "@/lib/pdf";
import { deleteDoc, getStore, saveDoc, saveSettings } from "@/lib/store";
import type { Doc, TaxMode } from "@/lib/types";
import { isValidVpa } from "@/lib/upi";
import { BRAND } from "@/lib/brand";
import { DocView } from "./DocView";
import { Disclaimer } from "./Disclaimer";
import { IconArrowRight, IconCheck, IconDownload, IconPrinter, IconSparkles, IconTrash } from "./icons";
import { ItemsEditor } from "./ItemsEditor";
import { PaperPreview, PrintPortal } from "./PaperPreview";
import { BusinessFields, PartyFields, STATE_OPTIONS } from "./PartyFields";
import { TEMPLATES } from "./templates/specs";
import { NumberInput, Section, Segmented, Select, TextArea, TextInput, Toggle, toast } from "./ui";

export function Editor({ initial }: { initial: Doc }) {
  const router = useRouter();
  const [doc, setDoc] = useState<Doc>(initial);
  const [saved, setSaved] = useState(true);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const latest = useRef(doc);

  const totals = useMemo(() => computeTotals(doc), [doc]);
  const typeLabel = DOC_TYPES.find((d) => d.type === doc.type)?.label ?? "Document";
  const settings = getStore().settings;

  // Debounced autosave to localStorage
  const change = (patch: Partial<Doc> | ((d: Doc) => Doc)) => {
    setDoc((d) => {
      const next = typeof patch === "function" ? patch(d) : { ...d, ...patch };
      latest.current = next;
      return next;
    });
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveDoc(latest.current);
      setSaved(true);
    }, 400);
  };

  // Flush on unmount
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        saveDoc(latest.current);
      }
    },
    [],
  );

  const fileName = docFileName([doc.title, doc.number, doc.client.name]);
  const numberError = doc.taxMode === "gst" && doc.type === "invoice" ? checkGstInvoiceNumber(doc.number) : !doc.number.trim() ? "Number is required." : null;
  const duplicateNumber = getStore().docs.some((d) => d.id !== doc.id && d.type === doc.type && d.number === doc.number);

  const setTaxMode = (mode: TaxMode) =>
    change((d) => {
      const titles = DOC_TITLES[d.type];
      const autoTitle = titles.includes(d.title) && (d.title === defaultTitle(d.type, d.taxMode) || d.title === defaultTitle(d.type, mode));
      return {
        ...d,
        taxMode: mode,
        currency: mode === "gst" ? "INR" : d.currency,
        title: autoTitle ? defaultTitle(d.type, mode) : d.title,
        items: mode === "none" ? d.items : d.items.map((it) => ({ ...it, taxRate: it.taxRate || 0 })),
      };
    });

  const supplyHint =
    doc.taxMode === "gst"
      ? !doc.from.stateCode
        ? "Set your business state to decide CGST/SGST vs IGST."
        : doc.placeOfSupply === EXPORT_STATE_CODE
          ? "Export: IGST applies (0% if supplied under LUT)."
          : totals.intraState
            ? `Intra-state (${stateName(doc.from.stateCode)}): CGST + ${totals.stateTaxName}`
            : `Inter-state: IGST (from ${stateName(doc.from.stateCode)} to ${stateName(doc.placeOfSupply) || "…"})`
      : null;

  const upiWarn =
    doc.showUpiQr && doc.type !== "receipt"
      ? doc.currency !== "INR"
        ? "UPI QR is only shown for INR documents."
        : !isValidVpa(doc.from.upiId)
          ? "Add your UPI ID under “Your business” to show the QR."
          : null
      : null;

  const onPdf = async () => {
    if (!pageRef.current) return;
    const page = pageRef.current.querySelector<HTMLElement>("[data-doc-page]");
    if (!page) return;
    setBusy(true);
    try {
      await downloadPdf(page, fileName);
      toast("PDF downloaded");
    } catch (e) {
      console.error(e);
      toast("Could not create the PDF here. Use Print → Save as PDF instead.", "error");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = () => {
    if (!confirm(`Delete ${typeLabel.toLowerCase()} ${doc.number}? This cannot be undone.`)) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    deleteDoc(doc.id);
    toast(`${typeLabel} deleted`);
    router.push("/app/");
  };

  const preview = <DocView doc={doc} totals={totals} />;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 pb-16 sm:px-6">
      {/* Toolbar */}
      <div className="no-print sticky top-14 z-30 -mx-3 mb-4 border-b border-slate-200 bg-white/90 px-3 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/app/" className="btn-ghost px-2 text-sm">
            ← Documents
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {doc.title} <span className="text-slate-500">{doc.number}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500" aria-live="polite">
              {saved ? (
                <>
                  <IconCheck className="size-3 text-emerald-600" /> Saved in this browser
                </>
              ) : (
                "Saving…"
              )}
              <span className="mx-1">·</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatMoney(totals.total, doc.currency)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-danger px-2.5" onClick={onDelete} aria-label="Delete document">
              <IconTrash className="size-4" />
            </button>
            <button type="button" className="btn-secondary" onClick={() => printDocument(fileName)}>
              <IconPrinter className="size-4" /> <span className="hidden sm:inline">Print</span>
            </button>
            <button type="button" className="btn-primary" onClick={onPdf} disabled={busy}>
              <IconDownload className="size-4" /> {busy ? "Creating…" : "Download PDF"}
            </button>
          </div>
        </div>
        <div className="mt-2 lg:hidden">
          <Segmented
            ariaLabel="View"
            value={tab}
            onChange={setTab}
            options={[
              { value: "edit", label: "Edit" },
              { value: "preview", label: "Preview" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Form */}
        <div className={`no-print space-y-4 ${tab === "preview" ? "hidden lg:block" : ""}`}>
          <Section title={`${typeLabel} details`} description="Number, dates and title">
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Title"
                value={DOC_TITLES[doc.type].includes(doc.title) ? doc.title : "__custom"}
                onChange={(v) => change({ title: v === "__custom" ? "" : v })}
                options={[...DOC_TITLES[doc.type].map((t) => ({ value: t, label: t })), { value: "__custom", label: "Custom title…" }]}
              />
              <TextInput
                label={`${typeLabel} number`}
                value={doc.number}
                onChange={(v) => change({ number: v })}
                error={numberError}
                hint={duplicateNumber ? "Another document already uses this number." : undefined}
                maxLength={40}
              />
              {!DOC_TITLES[doc.type].includes(doc.title) && (
                <TextInput className="sm:col-span-2" label="Custom title" value={doc.title} onChange={(v) => change({ title: v })} maxLength={40} placeholder="e.g. Delivery Challan" />
              )}
              <TextInput label={doc.type === "receipt" ? "Receipt date" : "Date"} type="date" value={doc.date} onChange={(v) => change({ date: v })} />
              {doc.type !== "receipt" && (
                <TextInput label={doc.type === "quote" ? "Valid until" : "Due date"} type="date" value={doc.dueDate} onChange={(v) => change({ dueDate: v })} />
              )}
              <TextInput label="PO / reference (optional)" value={doc.poNumber} onChange={(v) => change({ poNumber: v })} />
            </div>
          </Section>

          <Section title="Tax & currency" description={doc.taxMode === "gst" ? "GST (India)" : doc.taxMode === "vat" ? `${doc.taxLabel || "VAT"} · ${doc.currency}` : `No tax · ${doc.currency}`}>
            <div className="space-y-4">
              <Segmented
                ariaLabel="Tax mode"
                value={doc.taxMode}
                onChange={setTaxMode}
                options={[
                  { value: "gst", label: "GST (India)" },
                  { value: "vat", label: "VAT / Sales tax" },
                  { value: "none", label: "No tax" },
                ]}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {doc.taxMode === "gst" ? (
                  <>
                    <Select
                      label="Place of supply"
                      value={doc.placeOfSupply}
                      onChange={(v) => change({ placeOfSupply: v })}
                      options={STATE_OPTIONS}
                      hint={supplyHint}
                    />
                    <div className="flex items-end pb-2">
                      <Toggle label="Reverse charge" checked={doc.reverseCharge} onChange={(v) => change({ reverseCharge: v })} />
                    </div>
                  </>
                ) : (
                  <>
                    <Select
                      label="Currency"
                      value={doc.currency}
                      onChange={(v) => change({ currency: v })}
                      options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` }))}
                    />
                    {doc.taxMode === "vat" && <TextInput label="Tax name" value={doc.taxLabel} onChange={(v) => change({ taxLabel: v })} placeholder="VAT, Sales tax, GST…" maxLength={16} />}
                  </>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {doc.taxMode !== "none" && (
                  <Toggle label="Prices include tax" hint="Tax is worked out backwards from the rate" checked={doc.pricesIncludeTax} onChange={(v) => change({ pricesIncludeTax: v })} />
                )}
                <Toggle label="Round off total" hint="To the nearest whole unit" checked={doc.roundOff} onChange={(v) => change({ roundOff: v })} />
              </div>
            </div>
          </Section>

          <Section
            title="Your business"
            description={doc.from.name || "Not set yet"}
            defaultOpen={!doc.from.name}
            right={
              <button
                type="button"
                className="btn-ghost px-2 py-1 text-xs"
                onClick={() => {
                  saveSettings({ ...getStore().settings, business: doc.from });
                  toast("Saved as your default business profile");
                }}
              >
                Save as default
              </button>
            }
          >
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              Changes here apply to this document only.
              <button type="button" className="font-medium text-brand-600 hover:underline" onClick={() => change({ from: structuredClone(settings.business), placeOfSupply: doc.placeOfSupply || settings.business.stateCode })}>
                Reload from Settings
              </button>
            </div>
            <BusinessFields value={doc.from} onChange={(from) => change({ from })} taxMode={doc.taxMode} />
          </Section>

          <Section title={doc.type === "receipt" ? "Received from" : "Bill to"} description={doc.client.name || "Client details"}>
            <PartyFields
              value={doc.client}
              taxMode={doc.taxMode}
              onChange={(client) => change({ client })}
              onStateFromGstin={(code) => change((d) => ({ ...d, placeOfSupply: code }))}
            />
          </Section>

          <Section title="Items" description={`${doc.items.length} line${doc.items.length === 1 ? "" : "s"} · ${formatMoney(totals.total, doc.currency)}`}>
            <ItemsEditor
              items={doc.items}
              onChange={(items) => change({ items })}
              taxMode={doc.taxMode}
              currency={doc.currency}
              totals={totals}
              defaultTaxRate={settings.defaults.defaultTaxRate}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-end">
              <div>
                <span className="label">Extra discount</span>
                <Segmented
                  ariaLabel="Discount type"
                  value={doc.discount.type}
                  onChange={(type) => change({ discount: { ...doc.discount, type } })}
                  options={[
                    { value: "percent", label: "%" },
                    { value: "amount", label: doc.currency },
                  ]}
                />
              </div>
              <NumberInput value={doc.discount.value} min={0} onChange={(value) => change({ discount: { ...doc.discount, value } })} ariaLabel="Discount value" />
            </div>
          </Section>

          <Section title={doc.type === "receipt" ? "Payment received" : "Payment"} description={doc.type === "receipt" ? doc.payment.mode : totals.paid > 0 ? `Paid ${formatMoney(totals.paid, doc.currency)}` : "UPI QR, bank details"}>
            <div className="space-y-4">
              {doc.type === "receipt" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select label="Payment mode" value={doc.payment.mode} onChange={(mode) => change({ payment: { ...doc.payment, mode } })} options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))} />
                  <TextInput label="Payment date" type="date" value={doc.payment.date} onChange={(date) => change({ payment: { ...doc.payment, date } })} />
                  <TextInput label="Reference (UTR, cheque no.)" value={doc.payment.reference} onChange={(reference) => change({ payment: { ...doc.payment, reference } })} />
                  <div>
                    <label className="label" htmlFor="amount-received">
                      Amount received
                    </label>
                    <NumberInput
                      id="amount-received"
                      value={doc.payment.amountPaid ?? totals.total}
                      min={0}
                      onChange={(v) => change({ payment: { ...doc.payment, amountPaid: v } })}
                    />
                    <p className="mt-1 text-xs text-slate-500">Defaults to the full total.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {doc.type === "invoice" && (
                    <div>
                      <label className="label" htmlFor="amount-paid">
                        Amount already paid (optional)
                      </label>
                      <NumberInput id="amount-paid" value={doc.payment.amountPaid ?? 0} min={0} onChange={(v) => change({ payment: { ...doc.payment, amountPaid: v || null } })} />
                      <p className="mt-1 text-xs text-slate-500">Shows “Balance due” on the invoice.</p>
                    </div>
                  )}
                  <div className="space-y-3 sm:col-span-2">
                    <Toggle
                      label="Show UPI QR code"
                      hint={upiWarn ?? "Clients scan to pay the exact amount with any UPI app"}
                      checked={doc.showUpiQr}
                      onChange={(v) => change({ showUpiQr: v })}
                    />
                    <Toggle label="Show bank details" checked={doc.showBank} onChange={(v) => change({ showBank: v })} />
                  </div>
                </div>
              )}
              <Toggle label="Show signature block" checked={doc.showSignature} onChange={(v) => change({ showSignature: v })} />
            </div>
          </Section>

          <Section title="Notes & terms" defaultOpen={false} description="Shown at the bottom of the document">
            <div className="space-y-3">
              <TextArea label="Notes" value={doc.notes} onChange={(notes) => change({ notes })} rows={2} />
              <TextArea label="Terms & conditions" value={doc.terms} onChange={(terms) => change({ terms })} rows={3} />
            </div>
          </Section>

          <Section title="Design" description={`${TEMPLATES.find((t) => t.id === doc.template)?.name ?? "Classic"} template`}>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => change({ template: t.id })}
                  aria-pressed={doc.template === t.id}
                  className={`rounded-lg border p-3 text-left text-sm transition ${
                    doc.template === t.id
                      ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:bg-brand-500/10"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <span className="block font-semibold">{t.name}</span>
                  <span className="block text-xs text-slate-500">{t.description}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <span className="label">Accent colour</span>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => change({ accent: a })}
                    aria-label={`Accent ${a}`}
                    aria-pressed={doc.accent === a}
                    className={`size-8 rounded-full ring-offset-2 transition dark:ring-offset-slate-900 ${doc.accent === a ? "ring-2 ring-slate-900 dark:ring-white" : ""}`}
                    style={{ background: a }}
                  />
                ))}
                <a href={BRAND.proUrl} target="_blank" rel="noopener" className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-600">
                  <IconSparkles className="size-3.5 text-amber-500" /> Custom colours &amp; 10 more templates in Pro
                </a>
              </div>
            </div>
          </Section>

          <Disclaimer compact />

          <div className="flex justify-end">
            <Link href="/app/" className="btn-secondary">
              Done <IconArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* Preview */}
        <div className={`${tab === "edit" ? "hidden lg:block" : ""}`}>
          <div className="lg:sticky lg:top-[7.5rem] lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto lg:rounded-xl">
            <div ref={pageRef} className="rounded-xl bg-slate-100 p-3 sm:p-5 dark:bg-slate-900">
              <PaperPreview>{preview}</PaperPreview>
            </div>
            <p className="no-print mt-2 text-center text-xs text-slate-500">A4 preview · Print uses vector text; Download PDF creates an image-based file.</p>
          </div>
        </div>
      </div>
      <PrintPortal>{preview}</PrintPortal>
    </div>
  );
}
