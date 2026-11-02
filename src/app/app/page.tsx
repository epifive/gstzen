"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { IconDownload, IconInvoice, IconPlus, IconQuote, IconReceipt, IconSearch, IconSparkles, IconTrash } from "@/components/icons";
import { Segmented, toast } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import { computeTotals } from "@/lib/calc";
import { documentsCsv, downloadText } from "@/lib/csv";
import { DOC_TYPES } from "@/lib/defaults";
import { formatMoney } from "@/lib/money";
import { displayDate, financialYear, todayISO } from "@/lib/numbering";
import { serializeBackup } from "@/lib/storage";
import { addNewDoc, clearSample, deleteDoc, loadSample, useStore } from "@/lib/store";
import type { DocType } from "@/lib/types";

const TYPE_ICON = { invoice: IconInvoice, quote: IconQuote, receipt: IconReceipt };
const TYPE_BADGE: Record<DocType, string> = {
  invoice: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200",
  quote: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  receipt: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
};

export default function DocumentsPage() {
  const store = useStore();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | DocType>("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    if (!store) return [];
    const needle = q.trim().toLowerCase();
    return store.docs
      .filter((d) => filter === "all" || d.type === filter)
      .filter((d) => !needle || `${d.number} ${d.client.name} ${d.client.gstin} ${d.title}`.toLowerCase().includes(needle))
      .map((d) => ({ doc: d, totals: computeTotals(d) }))
      .sort((a, b) => (b.doc.date + b.doc.createdAt).localeCompare(a.doc.date + a.doc.createdAt));
  }, [store, filter, q]);

  const stats = useMemo(() => {
    if (!store) return null;
    const fy = financialYear(todayISO()).full;
    const inFy = store.docs.filter((d) => financialYear(d.date).full === fy && d.currency === "INR");
    const sum = (type: DocType, f: (t: ReturnType<typeof computeTotals>) => number) =>
      inFy.filter((d) => d.type === type).reduce((s, d) => s + f(computeTotals(d)), 0);
    return {
      fy,
      invoiced: sum("invoice", (t) => t.total),
      tax: sum("invoice", (t) => t.tax),
      received: sum("receipt", (t) => t.paid),
      quotes: inFy.filter((d) => d.type === "quote").length,
    };
  }, [store]);

  if (!store) return <div className="p-10 text-center text-sm text-slate-500">Loading…</div>;

  const create = (type: DocType) => {
    const doc = addNewDoc(type);
    router.push(`/app/edit/?id=${doc.id}`);
  };
  const hasSample = store.docs.some((d) => d.sample);
  const noBusiness = !store.settings.business.name.trim();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Invoices, quotations and receipts saved in this browser.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => create("invoice")}>
            <IconPlus className="size-4" /> New invoice
          </button>
          <button type="button" className="btn-secondary" onClick={() => create("quote")}>
            <IconQuote className="size-4" /> Quotation
          </button>
          <button type="button" className="btn-secondary" onClick={() => create("receipt")}>
            <IconReceipt className="size-4" /> Receipt
          </button>
        </div>
      </div>

      {hasSample && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          <p>
            <b>You are looking at sample data.</b> The business, clients and amounts are made up so you can explore. Clear it when you are ready to add your own.
          </p>
          <button
            type="button"
            className="btn-secondary shrink-0"
            onClick={() => {
              clearSample();
              toast("Sample data cleared");
            }}
          >
            Clear sample data
          </button>
        </div>
      )}

      {noBusiness && !hasSample && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-brand-500/30 dark:bg-brand-500/10">
          <p>
            <b>Start with your business profile.</b> Name, GSTIN, logo, bank and UPI ID are filled into every new document.
          </p>
          <Link href="/app/settings/" className="btn-primary shrink-0">
            Set up profile
          </Link>
        </div>
      )}

      {stats && store.docs.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: `Invoiced in FY ${stats.fy}`, v: formatMoney(stats.invoiced, "INR") },
            { k: "Tax on invoices", v: formatMoney(stats.tax, "INR") },
            { k: "Received (receipts)", v: formatMoney(stats.received, "INR") },
            { k: "Quotations", v: String(stats.quotes) },
          ].map((s) => (
            <div key={s.k} className="card p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.k}</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {store.docs.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
            <IconInvoice className="size-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No documents yet</h2>
          <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Create a GST or VAT invoice, a quotation or a receipt. Everything is saved in this browser; nothing is uploaded.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => create("invoice")}>
              <IconPlus className="size-4" /> Create your first invoice
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                loadSample();
                toast("Sample data loaded");
              }}
            >
              Load sample data
            </button>
          </div>
        </div>
      ) : (
        <div className="card mt-6 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <Segmented
              ariaLabel="Filter by type"
              value={filter}
              onChange={setFilter}
              options={[{ value: "all", label: "All" }, ...DOC_TYPES.map((t) => ({ value: t.type, label: t.plural }))]}
            />
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input className="field w-56 pl-8" placeholder="Search number or client" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search documents" />
              </div>
              <button
                type="button"
                className="btn-secondary"
                title="Download all documents as CSV"
                onClick={() => downloadText(`gst-invoice-documents-${todayISO()}.csv`, documentsCsv(store.docs), "text/csv")}
              >
                <IconDownload className="size-4" /> CSV
              </button>
              <button
                type="button"
                className="btn-secondary"
                title="Download a full JSON backup"
                onClick={() => downloadText(`gst-invoice-backup-${todayISO()}.json`, serializeBackup(store), "application/json")}
              >
                <IconDownload className="size-4" /> Backup
              </button>
            </div>
          </div>
          {rows.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">Nothing matches your search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Number</th>
                    <th className="px-4 py-2.5 font-medium">Client</th>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                    <th className="px-4 py-2.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map(({ doc, totals }) => {
                    const Icon = TYPE_ICON[doc.type];
                    return (
                      <tr key={doc.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <Link href={`/app/edit/?id=${doc.id}`} className="flex items-center gap-3">
                            <span className={`inline-flex size-8 items-center justify-center rounded-lg ${TYPE_BADGE[doc.type]}`}>
                              <Icon className="size-4" />
                            </span>
                            <span>
                              <span className="block font-medium text-slate-900 group-hover:text-brand-600 dark:text-white">{doc.number || "(no number)"}</span>
                              <span className="block text-xs text-slate-500">
                                {doc.title}
                                {doc.sample ? " · sample" : ""}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="block text-slate-800 dark:text-slate-200">{doc.client.name || "—"}</span>
                          {doc.client.gstin && <span className="block text-xs text-slate-500">{doc.client.gstin}</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">{displayDate(doc.date)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">{formatMoney(totals.total, doc.currency)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="btn-ghost px-2 opacity-60 group-hover:opacity-100 hover:text-rose-600"
                            aria-label={`Delete ${doc.number}`}
                            onClick={() => {
                              if (confirm(`Delete ${doc.number}? This cannot be undone.`)) {
                                deleteDoc(doc.id);
                                toast("Deleted");
                              }
                            }}
                          >
                            <IconTrash className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-50 to-teal-50 p-5 sm:flex-row sm:items-center dark:border-slate-800 dark:from-indigo-500/10 dark:to-teal-500/10">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <IconSparkles className="size-4 text-amber-500" /> {BRAND.name} Pro
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Client &amp; product library, recurring invoices, payment tracking, GSTR-1 style exports, Excel, 10+ templates, multiple businesses and white-label.
          </p>
        </div>
        <a href={BRAND.proUrl} target="_blank" rel="noopener" className="btn-primary shrink-0">
          Get Pro
        </a>
      </div>
    </main>
  );
}
