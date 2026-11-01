import Link from "next/link";
import { DocView } from "@/components/DocView";
import {
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconGlobe,
  IconInvoice,
  IconLock,
  IconQr,
  IconReceipt,
  IconShield,
  IconSparkles,
  IconX,
} from "@/components/icons";
import { DISCLAIMER_TEXT } from "@/components/Disclaimer";
import { BRAND } from "@/lib/brand";
import { COMPARISON, PRO_PRICE } from "@/lib/plans";
import { sampleStore } from "@/lib/sample";

const FEATURES = [
  { icon: IconInvoice, title: "GST-ready in one click", body: "GSTIN check, place of supply, CGST + SGST or IGST worked out for you, reverse charge and HSN/SAC tax summary." },
  { icon: IconQr, title: "UPI QR on every invoice", body: "A upi://pay QR with the exact amount and invoice number. Clients scan with GPay, PhonePe, Paytm or BHIM. Generated offline." },
  { icon: IconReceipt, title: "Invoices, quotes and receipts", body: "Tax invoice, bill of supply, proforma, quotation, estimate and payment receipt with a PAID stamp. Auto-numbered per financial year." },
  { icon: IconDownload, title: "Clean A4 PDF and print", body: "Print with crisp vector text or download a PDF. Logo, signature, bank details, notes and terms. Three good-looking templates." },
  { icon: IconGlobe, title: "Works outside India too", body: "Switch to VAT/sales-tax or no-tax mode in 20+ currencies (USD, EUR, GBP, AED…) with international number words." },
  { icon: IconLock, title: "Private by design", body: "No sign-up, no server, no trackers. Everything is saved in your browser. Export a JSON backup or CSV any time." },
];

const FAQ: [string, string][] = [
  ["Is it really free?", `Yes. ${BRAND.name} is open source under the MIT licence. Make unlimited invoices with no watermark. Pro is an optional one-time purchase for business features like a client library, recurring invoices and GSTR-1 style exports.`],
  ["Is this GST e-invoicing (IRN)?", DISCLAIMER_TEXT],
  ["Where is my data stored?", "In your browser's local storage on this device. Nothing is uploaded. Clearing browser data deletes it, so download a JSON backup from Settings regularly. You can import it on another device."],
  ["How does the UPI QR work?", "Add your UPI ID (like yourname@okhdfc) in Settings. Each invoice shows a QR that opens any UPI app with your name, the amount due and the invoice number filled in. The money goes straight to your account; we never see it."],
  ["When is CGST + SGST used instead of IGST?", "When your state (from your GSTIN) and the place of supply are the same, the supply is intra-state and tax is split into CGST and SGST (UTGST in some union territories). Otherwise IGST applies. Exports use IGST or 0% under LUT."],
  ["Can I use it for VAT or without tax?", "Yes. Choose VAT / Sales tax (rename it, e.g. \"Sales tax\") or No tax, and pick from 20+ currencies. The UPI QR only appears for INR."],
  ["Can I self-host it?", "Yes. It is a static Next.js site. Build it once and host the out/ folder on Cloudflare Pages, Netlify, Vercel, GitHub Pages or any web server."],
  ["What does Pro add?", "Multiple businesses, a client and product library, duplicate and recurring invoices, payment tracking, reports, GSTR-1 style CSV, Excel export, WhatsApp/email sharing, payment links, 10 extra templates with custom colours, and white-label branding."],
];

function Check({ v }: { v: boolean | string }) {
  if (v === true) return <IconCheck className="mx-auto size-5 text-emerald-600" aria-label="Included" />;
  if (v === false) return <IconX className="mx-auto size-4 text-slate-300 dark:text-slate-600" aria-label="Not included" />;
  return <span className="text-sm">{v}</span>;
}

export default function Home() {
  const sample = sampleStore(new Date());
  const heroDoc = { ...sample.docs[0], sample: false, template: "modern" };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: BRAND.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: "Free GST & VAT invoice, quotation and receipt maker with UPI QR. Runs in the browser.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        url: BRAND.siteUrl,
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_10%_-10%,rgba(79,70,229,.14),transparent),radial-gradient(40rem_24rem_at_100%_10%,rgba(20,184,166,.14),transparent)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Free &amp; open source · No sign-up
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              GST invoices with a <span className="bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">UPI QR</span>, in 60 seconds.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
              Make clean GST or VAT invoices, quotations and receipts. CGST/SGST/IGST, HSN/SAC, amount in words and a scan-to-pay UPI QR, then print or download a PDF. Everything stays in your browser.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app/" className="btn-primary px-5 py-3 text-base">
                Create an invoice <IconArrowRight className="size-4" />
              </Link>
              <a href={BRAND.repoUrl} target="_blank" rel="noopener" className="btn-secondary px-5 py-3 text-base">
                View source on GitHub
              </a>
            </div>
            <ul className="mt-8 grid max-w-lg grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
              {["Works offline", "No watermark", "Data stays on your device", "MIT licence"].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <IconCheck className="size-4 text-emerald-600" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-200/50 to-teal-200/50 blur-2xl dark:from-indigo-500/20 dark:to-teal-500/20" />
            <div className="relative h-[460px] overflow-hidden rounded-xl border border-slate-200 shadow-2xl sm:h-[640px] dark:border-slate-700" aria-label="Sample invoice preview" role="img">
              <div className="w-[794px] origin-top-left scale-[0.42] sm:scale-[0.655]">
                <DocView doc={heroDoc} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">Everything a small business needs to bill properly</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Built for Indian GST rules first, and flexible enough for VAT and no-tax invoices anywhere.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-100">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            ["1", "Add your business once", "GSTIN, address, logo, signature, bank and UPI ID. State and PAN fill in from the GSTIN."],
            ["2", "Fill in the client and items", "Pick GST rates (0, 5, 18, 40% or custom). Tax split, totals and words update live."],
            ["3", "Print, download or share", "Save a vector PDF from the print dialog, or download a PDF file. Clients pay by scanning the QR."],
          ].map(([n, t, b]) => (
            <div key={n} className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">{n}</span>
              <div>
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{b}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Free vs Pro */}
      <section id="pricing" className="scroll-mt-20 border-y border-slate-200 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Free vs Pro</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Free finishes the job. Pro adds the business tools: a one-time {PRO_PRICE.inr} / {PRO_PRICE.usd}, no subscription.
            </p>
          </div>
          <div className="card mt-10 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-4 font-medium text-slate-500">Feature</th>
                  <th className="w-40 px-5 py-4 text-center font-semibold">Free</th>
                  <th className="w-48 px-5 py-4 text-center font-semibold text-brand-600">
                    <span className="inline-flex items-center gap-1">
                      <IconSparkles className="size-4 text-amber-500" /> Pro
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {COMPARISON.map(([f, a, b]) => (
                  <tr key={f}>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{f}</td>
                    <td className="px-5 py-3 text-center">
                      <Check v={a} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Check v={b} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-5 py-5" />
                  <td className="px-5 py-5 text-center">
                    <Link href="/app/" className="btn-secondary">
                      Use free
                    </Link>
                  </td>
                  <td className="px-5 py-5 text-center">
                    <a href={BRAND.proUrl} target="_blank" rel="noopener" className="btn-primary">
                      Get Pro · {PRO_PRICE.inr}
                    </a>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">Pro is self-hosted source code with 1 year of updates and support. Your data export is never locked in either edition.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight">Questions</h2>
        <div className="mt-10 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {q}
                <span className="text-slate-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-600 px-6 py-12 text-center text-white">
          <IconShield className="size-8 opacity-80" />
          <h2 className="text-2xl font-semibold sm:text-3xl">Your next invoice is a minute away.</h2>
          <p className="max-w-xl text-white/85">No account, no upload, no watermark. Open the app, add your business and bill your first client.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/app/" className="btn bg-white px-5 py-3 text-base text-indigo-700 hover:bg-indigo-50">
              Create an invoice
            </Link>
            <a href={BRAND.proUrl} target="_blank" rel="noopener" className="btn border border-white/40 px-5 py-3 text-base text-white hover:bg-white/10">
              Get Pro
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
