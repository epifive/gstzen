"use client";

import { useRef, useState } from "react";
import { Disclaimer } from "@/components/Disclaimer";
import { IconDownload, IconUpload } from "@/components/icons";
import { BusinessFields } from "@/components/PartyFields";
import { TEMPLATES } from "@/components/templates/specs";
import { NumberInput, Section, Segmented, Select, TextArea, TextInput, Toggle, toast } from "@/components/ui";
import { documentsCsv, downloadText } from "@/lib/csv";
import { ACCENTS, DOC_TYPES } from "@/lib/defaults";
import { CURRENCIES } from "@/lib/money";
import { formatDocNumber, todayISO } from "@/lib/numbering";
import { mergeStores, parseBackup, serializeBackup } from "@/lib/storage";
import { clearAll, getStore, loadSample, replaceStore, saveSettings, useStore } from "@/lib/store";
import type { Settings } from "@/lib/types";

function SettingsForm({ initial }: { initial: Settings }) {
  const [s, setS] = useState<Settings>(initial);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");

  const set = (next: Settings) => {
    setS(next);
    setDirty(true);
  };
  const d = s.defaults;
  const setD = <K extends keyof Settings["defaults"]>(k: K, v: Settings["defaults"][K]) => set({ ...s, defaults: { ...d, [k]: v } });

  const save = () => {
    saveSettings(s);
    setDirty(false);
    toast("Settings saved");
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:border-slate-800 dark:bg-slate-950/90">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500">Used for every new document. Existing documents keep their own copy.</p>
        </div>
        <button type="button" className="btn-primary" onClick={save} disabled={!dirty}>
          {dirty ? "Save changes" : "Saved"}
        </button>
      </div>

      <div className="space-y-4">
        <Section title="Business profile" description="Seller details, logo, signature, UPI and bank">
          <BusinessFields value={s.business} onChange={(business) => set({ ...s, business })} taxMode={d.taxMode} />
        </Section>

        <Section title="Defaults for new documents" description="Tax mode, currency, template, notes">
          <div className="space-y-4">
            <div>
              <span className="label">Tax mode</span>
              <Segmented
                ariaLabel="Default tax mode"
                value={d.taxMode}
                onChange={(v) => setD("taxMode", v)}
                options={[
                  { value: "gst", label: "GST (India)" },
                  { value: "vat", label: "VAT / Sales tax" },
                  { value: "none", label: "No tax" },
                ]}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Select
                label="Currency (non-GST)"
                value={d.currency}
                onChange={(v) => setD("currency", v)}
                options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` }))}
              />
              <TextInput label="Tax name (VAT mode)" value={d.taxLabel} onChange={(v) => setD("taxLabel", v)} />
              <div>
                <label className="label" htmlFor="def-rate">
                  Default tax rate %
                </label>
                <NumberInput id="def-rate" value={d.defaultTaxRate} min={0} onChange={(v) => setD("defaultTaxRate", Math.min(v, 100))} />
              </div>
              <div>
                <label className="label" htmlFor="def-due">
                  Invoice due in (days)
                </label>
                <NumberInput id="def-due" value={d.dueDays} min={0} onChange={(v) => setD("dueDays", Math.round(v))} />
              </div>
              <div>
                <label className="label" htmlFor="def-valid">
                  Quote valid for (days)
                </label>
                <NumberInput id="def-valid" value={d.quoteValidDays} min={0} onChange={(v) => setD("quoteValidDays", Math.round(v))} />
              </div>
              <Select label="Template" value={d.template} onChange={(v) => setD("template", v)} options={TEMPLATES.map((t) => ({ value: t.id, label: t.name }))} />
            </div>
            <div>
              <span className="label">Accent colour</span>
              <div className="flex gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setD("accent", a)}
                    aria-label={`Accent ${a}`}
                    aria-pressed={d.accent === a}
                    className={`size-8 rounded-full ring-offset-2 dark:ring-offset-slate-900 ${d.accent === a ? "ring-2 ring-slate-900 dark:ring-white" : ""}`}
                    style={{ background: a }}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Prices include tax" checked={d.pricesIncludeTax} onChange={(v) => setD("pricesIncludeTax", v)} />
              <Toggle label="Round off totals" checked={d.roundOff} onChange={(v) => setD("roundOff", v)} />
              <Toggle label="Show UPI QR on invoices" checked={d.showUpiQr} onChange={(v) => setD("showUpiQr", v)} />
              <Toggle label="Show bank details" checked={d.showBank} onChange={(v) => setD("showBank", v)} />
              <Toggle label="Show signature block" checked={d.showSignature} onChange={(v) => setD("showSignature", v)} />
            </div>
            <TextArea label="Default notes" value={d.notes} onChange={(v) => setD("notes", v)} rows={2} />
            <TextArea label="Default terms & conditions" value={d.terms} onChange={(v) => setD("terms", v)} rows={3} />
          </div>
        </Section>

        <Section title="Numbering" description="Formats and next numbers">
          <p className="mb-3 text-xs text-slate-500">
            Tokens: <code>{"{FY}"}</code> 2026-27, <code>{"{FYS}"}</code> 26-27, <code>{"{YYYY}"}</code>, <code>{"{YY}"}</code>, <code>{"{MM}"}</code>, <code>{"{N}"}</code> running number. GST invoice numbers must be unique in a financial year and at most 16 characters.
          </p>
          <div className="space-y-3">
            {DOC_TYPES.map(({ type, label }) => {
              const rule = s.numbering[type];
              const setRule = (patch: Partial<typeof rule>) => set({ ...s, numbering: { ...s.numbering, [type]: { ...rule, ...patch } } });
              const preview = formatDocNumber(rule, rule.next, todayISO());
              return (
                <div key={type} className="grid items-end gap-3 sm:grid-cols-[1fr_7rem_6rem_1fr]">
                  <TextInput label={`${label} format`} value={rule.format} onChange={(v) => setRule({ format: v })} />
                  <div>
                    <label className="label" htmlFor={`next-${type}`}>
                      Next number
                    </label>
                    <NumberInput id={`next-${type}`} value={rule.next} min={1} onChange={(v) => setRule({ next: Math.max(1, Math.round(v)) })} />
                  </div>
                  <div>
                    <label className="label" htmlFor={`pad-${type}`}>
                      Digits
                    </label>
                    <NumberInput id={`pad-${type}`} value={rule.pad} min={1} onChange={(v) => setRule({ pad: Math.min(10, Math.max(1, Math.round(v))) })} />
                  </div>
                  <div className="pb-2 text-sm">
                    Next: <b className="font-mono">{preview}</b>
                    {type === "invoice" && preview.length > 16 && <span className="ml-2 text-xs text-rose-600">over 16 chars</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Your data" description="Backup, restore and reset">
          <div className="space-y-4 text-sm">
            <p className="text-slate-600 dark:text-slate-400">
              Everything lives in this browser&apos;s local storage. Download a backup regularly, and use it to move to another computer or browser.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={() => downloadText(`gst-invoice-backup-${todayISO()}.json`, serializeBackup(getStore()), "application/json")}>
                <IconDownload className="size-4" /> Download JSON backup
              </button>
              <button type="button" className="btn-secondary" onClick={() => downloadText(`gst-invoice-documents-${todayISO()}.csv`, documentsCsv(getStore().docs), "text/csv")}>
                <IconDownload className="size-4" /> Documents CSV
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                ariaLabel="Import mode"
                value={importMode}
                onChange={setImportMode}
                options={[
                  { value: "merge", label: "Merge" },
                  { value: "replace", label: "Replace all" },
                ]}
              />
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Backup file"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  try {
                    const incoming = parseBackup(await f.text());
                    if (importMode === "replace") {
                      if (!confirm("Replace ALL current data with this backup?")) return;
                      replaceStore(incoming);
                    } else {
                      replaceStore(mergeStores(getStore(), incoming));
                    }
                    setS(getStore().settings);
                    setDirty(false);
                    toast(`Imported ${incoming.docs.length} document(s)`);
                  } catch (err) {
                    toast((err as Error).message, "error");
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
                <IconUpload className="size-4" /> Import backup
              </button>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  loadSample();
                  setS(getStore().settings);
                  setDirty(false);
                  toast("Sample data loaded");
                }}
              >
                Load sample data
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (!confirm("Delete ALL documents and settings from this browser? Download a backup first.")) return;
                  clearAll();
                  setS(getStore().settings);
                  setDirty(false);
                  toast("All data deleted");
                }}
              >
                Delete all data
              </button>
            </div>
          </div>
        </Section>

        <Disclaimer />
      </div>
    </main>
  );
}

export default function SettingsPage() {
  const store = useStore();
  if (!store) return <div className="p-10 text-center text-sm text-slate-500">Loading…</div>;
  return <SettingsForm initial={store.settings} />;
}
