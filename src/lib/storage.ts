import { defaultSettings, emptyBusiness, emptyParty, newItem } from "./defaults";
import type { Doc, LineItem, Settings, StoreData } from "./types";

export const STORAGE_KEY = "gstzen:v1";
export const EXPORT_KIND = "gstzen-backup";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const numv = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : d);
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);

/** Deep-merges known keys of `src` onto a template, keeping types. Unknown keys are dropped. */
function mergeShape<T>(template: T, src: unknown): T {
  if (!isObj(src) || !isObj(template)) return template;
  const out: Obj = { ...(template as Obj) };
  for (const [k, tv] of Object.entries(template as Obj)) {
    const sv = src[k];
    if (sv === undefined) continue;
    if (typeof tv === "string") out[k] = str(sv, tv);
    else if (typeof tv === "number") out[k] = numv(sv, tv);
    else if (typeof tv === "boolean") out[k] = bool(sv, tv);
    else if (isObj(tv)) out[k] = mergeShape(tv, sv);
    else out[k] = sv;
  }
  return out as T;
}

export function normalizeSettings(raw: unknown): Settings {
  const s = mergeShape(defaultSettings(), raw);
  s.business = mergeShape(emptyBusiness(), isObj(raw) ? raw.business : undefined);
  return s;
}

function normalizeItem(raw: unknown): LineItem {
  const base = newItem(0);
  const it = mergeShape(base, raw);
  if (!it.id) it.id = base.id;
  return it;
}

export function normalizeDoc(raw: unknown): Doc | null {
  if (!isObj(raw)) return null;
  const type = raw.type === "quote" || raw.type === "receipt" ? raw.type : raw.type === "invoice" ? "invoice" : null;
  if (!type || typeof raw.id !== "string" || !raw.id) return null;
  const taxMode = raw.taxMode === "vat" || raw.taxMode === "none" ? raw.taxMode : "gst";
  const discount = isObj(raw.discount) ? raw.discount : {};
  const payment = isObj(raw.payment) ? raw.payment : {};
  const paid = payment.amountPaid;
  const doc: Doc = {
    id: raw.id,
    type,
    title: str(raw.title, type === "invoice" ? "Invoice" : type === "quote" ? "Quotation" : "Receipt"),
    number: str(raw.number),
    date: str(raw.date),
    dueDate: str(raw.dueDate),
    poNumber: str(raw.poNumber),
    from: mergeShape(emptyBusiness(), raw.from),
    client: mergeShape(emptyParty(), raw.client),
    placeOfSupply: str(raw.placeOfSupply),
    reverseCharge: bool(raw.reverseCharge, false),
    taxMode,
    taxLabel: str(raw.taxLabel, "VAT"),
    currency: str(raw.currency, "INR"),
    pricesIncludeTax: bool(raw.pricesIncludeTax, false),
    roundOff: bool(raw.roundOff, true),
    items: Array.isArray(raw.items) ? raw.items.map(normalizeItem) : [],
    discount: { type: discount.type === "amount" ? "amount" : "percent", value: numv(discount.value) },
    notes: str(raw.notes),
    terms: str(raw.terms),
    showUpiQr: bool(raw.showUpiQr, true),
    showBank: bool(raw.showBank, true),
    showSignature: bool(raw.showSignature, true),
    template: str(raw.template, "classic"),
    accent: str(raw.accent, "#4f46e5"),
    payment: {
      mode: str(payment.mode, "UPI"),
      reference: str(payment.reference),
      date: str(payment.date),
      amountPaid: paid === null || paid === undefined || paid === "" ? null : numv(paid, 0),
    },
    createdAt: str(raw.createdAt, new Date().toISOString()),
    updatedAt: str(raw.updatedAt, new Date().toISOString()),
  };
  if (raw.sample === true) doc.sample = true;
  return doc;
}

/** Validates and upgrades anything that looks like store data. Returns null if it is not usable. */
export function normalizeStore(raw: unknown): StoreData | null {
  if (!isObj(raw)) return null;
  const data = raw.kind === EXPORT_KIND && isObj(raw.data) ? raw.data : raw;
  if (!isObj(data.settings) && !Array.isArray(data.docs)) return null;
  const docs = Array.isArray(data.docs) ? data.docs.map(normalizeDoc).filter((d): d is Doc => d !== null) : [];
  return { version: 1, settings: normalizeSettings(data.settings), docs };
}

export function serializeBackup(data: StoreData, appVersion = "1.0.0"): string {
  return JSON.stringify({ kind: EXPORT_KIND, appVersion, exportedAt: new Date().toISOString(), data }, null, 2);
}

/** Parses a backup file. Throws a friendly Error when the file is not a Gstzen backup. */
export function parseBackup(text: string): StoreData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  const store = normalizeStore(raw);
  if (!store) throw new Error("This file is not a Gstzen backup.");
  return store;
}

/** Merge: imported documents replace documents with the same id; others are added. */
export function mergeStores(current: StoreData, incoming: StoreData): StoreData {
  const map = new Map(current.docs.map((d) => [d.id, d]));
  for (const d of incoming.docs) map.set(d.id, d);
  return { ...current, docs: [...map.values()] };
}
