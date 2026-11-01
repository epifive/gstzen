"use client";

/* eslint-disable @next/next/no-img-element */
import { useId, useRef, useState } from "react";
import { GST_STATES, validateGstin, validatePan } from "@/lib/gst";
import { fileToDataUrl } from "@/lib/image";
import type { Business, Party, TaxMode } from "@/lib/types";
import { isValidVpa } from "@/lib/upi";
import { IconTrash, IconUpload } from "./icons";
import { Field, Select, TextArea, TextInput, toast } from "./ui";

export const STATE_OPTIONS = [{ value: "", label: "Select state…" }, ...GST_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))];

function gstinError(v: string): string | null {
  if (!v.trim()) return null;
  const r = validateGstin(v);
  return r.ok ? null : r.error;
}

export function PartyFields({
  value,
  onChange,
  taxMode,
  onStateFromGstin,
}: {
  value: Party;
  onChange: (p: Party) => void;
  taxMode: TaxMode;
  onStateFromGstin?: (code: string) => void;
}) {
  const set = <K extends keyof Party>(k: K, v: Party[K]) => onChange({ ...value, [k]: v });
  const [ship, setShip] = useState(!!value.shipTo);
  const gst = taxMode === "gst";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextInput className="sm:col-span-2" label="Client name" value={value.name} onChange={(v) => set("name", v)} placeholder="Company or person" />
      <TextArea className="sm:col-span-2" label="Billing address" rows={2} value={value.address} onChange={(v) => set("address", v)} />
      {gst ? (
        <>
          <TextInput
            label="Client GSTIN (optional for B2C)"
            value={value.gstin}
            upper
            maxLength={15}
            placeholder="29ABCDE1234F1Z5"
            error={gstinError(value.gstin)}
            onChange={(v) => {
              const next = { ...value, gstin: v };
              const r = validateGstin(v);
              if (r.ok) {
                next.stateCode = r.stateCode;
                onStateFromGstin?.(r.stateCode);
              }
              onChange(next);
            }}
          />
          <Select label="State" value={value.stateCode} onChange={(v) => set("stateCode", v)} options={STATE_OPTIONS} />
        </>
      ) : (
        <>
          <TextInput label="Tax ID / VAT no. (optional)" value={value.taxId} onChange={(v) => set("taxId", v)} />
          <TextInput label="Country" value={value.country} onChange={(v) => set("country", v)} />
        </>
      )}
      <TextInput label="Phone" value={value.phone} onChange={(v) => set("phone", v)} inputMode="tel" />
      <TextInput label="Email" value={value.email} onChange={(v) => set("email", v)} inputMode="email" type="email" />
      <div className="sm:col-span-2">
        {ship ? (
          <TextArea
            label="Shipping address"
            rows={2}
            value={value.shipTo}
            onChange={(v) => set("shipTo", v)}
            hint={
              <button
                type="button"
                className="text-rose-600 hover:underline"
                onClick={() => {
                  setShip(false);
                  set("shipTo", "");
                }}
              >
                Remove shipping address
              </button>
            }
          />
        ) : (
          <button type="button" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-500" onClick={() => setShip(true)}>
            + Add a different shipping address
          </button>
        )}
      </div>
    </div>
  );
}

function ImagePicker({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white dark:border-slate-700">
          {value ? <img src={value} alt="" className="max-h-12 max-w-[88px] object-contain" /> : <span className="text-[11px] text-slate-400">None</span>}
        </div>
        <input
          id={id}
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              onChange(await fileToDataUrl(f));
            } catch (err) {
              toast((err as Error).message, "error");
            }
          }}
        />
        <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => ref.current?.click()}>
          <IconUpload className="size-4" /> Upload
        </button>
        {value && (
          <button type="button" className="btn-ghost px-2" onClick={() => onChange("")} aria-label={`Remove ${label}`}>
            <IconTrash className="size-4" />
          </button>
        )}
      </div>
    </Field>
  );
}

export function BusinessFields({ value, onChange, taxMode = "gst" }: { value: Business; onChange: (b: Business) => void; taxMode?: TaxMode }) {
  const set = <K extends keyof Business>(k: K, v: Business[K]) => onChange({ ...value, [k]: v });
  const setBank = (k: keyof Business["bank"], v: string) => onChange({ ...value, bank: { ...value.bank, [k]: v } });
  const upiErr = value.upiId.trim() && !isValidVpa(value.upiId) ? "UPI ID looks wrong. Example: yourname@okhdfc" : null;
  const panErr = value.pan.trim() && !validatePan(value.pan) ? "PAN format is AAAAA9999A." : null;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput className="sm:col-span-2" label="Business name" value={value.name} onChange={(v) => set("name", v)} placeholder="Your company or trade name" />
        <TextArea className="sm:col-span-2" label="Address" rows={2} value={value.address} onChange={(v) => set("address", v)} />
        <TextInput
          label="GSTIN"
          value={value.gstin}
          upper
          maxLength={15}
          placeholder="27ABCDE1234F1Z5"
          error={gstinError(value.gstin)}
          hint={taxMode === "gst" ? "State and PAN fill in automatically." : undefined}
          onChange={(v) => {
            const next = { ...value, gstin: v };
            const r = validateGstin(v);
            if (r.ok) {
              next.stateCode = r.stateCode;
              if (!next.pan) next.pan = r.pan;
            }
            onChange(next);
          }}
        />
        <Select label="State (for GST)" value={value.stateCode} onChange={(v) => set("stateCode", v)} options={STATE_OPTIONS} />
        <TextInput label="PAN" value={value.pan} upper maxLength={10} onChange={(v) => set("pan", v)} error={panErr} />
        <TextInput label="VAT / Tax ID (non-GST mode)" value={value.taxId} onChange={(v) => set("taxId", v)} />
        <TextInput label="Country" value={value.country} onChange={(v) => set("country", v)} />
        <TextInput label="Phone" value={value.phone} onChange={(v) => set("phone", v)} inputMode="tel" />
        <TextInput label="Email" value={value.email} onChange={(v) => set("email", v)} type="email" />
        <TextInput label="Website" value={value.website} onChange={(v) => set("website", v)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePicker label="Logo" value={value.logo} onChange={(v) => set("logo", v)} hint="PNG/SVG with transparent background looks best." />
        <ImagePicker label="Signature or stamp" value={value.signature} onChange={(v) => set("signature", v)} hint="Shown above “Authorised signatory”." />
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">UPI (for the pay-by-QR code)</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="UPI ID (VPA)" value={value.upiId} onChange={(v) => set("upiId", v.trim())} placeholder="yourname@okhdfc" error={upiErr} />
          <TextInput label="Payee name" value={value.upiName} onChange={(v) => set("upiName", v)} placeholder="Name shown in the UPI app" />
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Bank details</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Account name" value={value.bank.accountName} onChange={(v) => setBank("accountName", v)} />
          <TextInput label="Account number" value={value.bank.accountNumber} onChange={(v) => setBank("accountNumber", v)} inputMode="numeric" />
          <TextInput label="IFSC" value={value.bank.ifsc} upper maxLength={11} onChange={(v) => setBank("ifsc", v)} />
          <TextInput label="Bank name" value={value.bank.bankName} onChange={(v) => setBank("bankName", v)} />
          <TextInput label="Branch" value={value.bank.branch} onChange={(v) => setBank("branch", v)} />
          <TextInput label="SWIFT / IBAN (international)" value={value.bank.swift} upper onChange={(v) => setBank("swift", v)} />
        </div>
      </div>
    </div>
  );
}
