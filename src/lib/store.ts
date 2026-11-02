"use client";

import { useSyncExternalStore } from "react";
import { createDoc, emptyStore } from "./defaults";
import { formatDocNumber } from "./numbering";
import { sampleStore } from "./sample";
import { migrateLegacyStorage, normalizeStore, STORAGE_KEY } from "./storage";
import type { Doc, DocType, Settings, StoreData } from "./types";

type Listener = () => void;

let state: StoreData | null = null;
let lastError = "";
const listeners = new Set<Listener>();

const DEMO_SEED = process.env.NEXT_PUBLIC_DEMO_SEED === "1";

function read(): StoreData {
  if (typeof window === "undefined") return emptyStore();
  try {
    migrateLegacyStorage(window.localStorage);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeStore(JSON.parse(raw)) ?? emptyStore();
    if (DEMO_SEED) {
      const seeded = sampleStore();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
  } catch {
    // corrupted storage: start clean but do not overwrite until the user saves
  }
  return emptyStore();
}

function ensure(): StoreData {
  if (!state) state = read();
  return state;
}

function emit() {
  listeners.forEach((l) => l());
}

function persist(next: StoreData) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    lastError = "";
  } catch {
    lastError = "Your browser storage is full. Export a backup and delete old documents or use a smaller logo.";
  }
  emit();
}

function subscribe(l: Listener) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = read();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns null during server render / hydration, then the store. */
export function useStore(): StoreData | null {
  return useSyncExternalStore(subscribe, ensure, () => null);
}

export function getStore(): StoreData {
  return ensure();
}

export function storageError(): string {
  return lastError;
}

export function update(fn: (s: StoreData) => StoreData) {
  persist(fn(ensure()));
}

export function replaceStore(next: StoreData) {
  persist(next);
}

export function saveSettings(settings: Settings) {
  update((s) => ({ ...s, settings }));
}

export function getDoc(id: string): Doc | undefined {
  return ensure().docs.find((d) => d.id === id);
}

/** Creates a document, assigns the next number and bumps the counter. */
export function addNewDoc(type: DocType): Doc {
  const s = ensure();
  const doc = createDoc(type, s.settings);
  const rule = s.settings.numbering[type];
  // skip numbers that already exist
  let n = rule.next;
  const taken = new Set(s.docs.filter((d) => d.type === type).map((d) => d.number));
  while (taken.has(formatDocNumber(rule, n, doc.date))) n++;
  doc.number = formatDocNumber(rule, n, doc.date);
  persist({
    ...s,
    docs: [doc, ...s.docs],
    settings: { ...s.settings, numbering: { ...s.settings.numbering, [type]: { ...rule, next: n + 1 } } },
  });
  return doc;
}

export function saveDoc(doc: Doc) {
  update((s) => ({
    ...s,
    docs: s.docs.some((d) => d.id === doc.id)
      ? s.docs.map((d) => (d.id === doc.id ? { ...doc, updatedAt: new Date().toISOString() } : d))
      : [doc, ...s.docs],
  }));
}

export function deleteDoc(id: string) {
  update((s) => ({ ...s, docs: s.docs.filter((d) => d.id !== id) }));
}

export function loadSample() {
  const sample = sampleStore();
  const s = ensure();
  const hasBusiness = !!s.settings.business.name;
  persist({
    ...s,
    settings: hasBusiness ? s.settings : sample.settings,
    docs: [...sample.docs, ...s.docs.filter((d) => !d.sample)],
  });
}

export function clearSample() {
  update((s) => {
    const settings = s.settings.business.name.endsWith("(Sample)")
      ? { ...emptyStore().settings }
      : s.settings;
    return { ...s, settings, docs: s.docs.filter((d) => !d.sample) };
  });
}

export function clearAll() {
  persist(emptyStore());
}
