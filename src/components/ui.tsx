"use client";

import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { IconCheck, IconDown, IconX } from "./icons";

export function Field({
  label,
  hint,
  error,
  children,
  className = "",
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

/** Text input bound to a string value. */
export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  type = "text",
  className = "",
  inputClassName = "",
  maxLength,
  autoComplete,
  inputMode,
  upper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  error?: string | null;
  type?: string;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "url";
  upper?: boolean;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} className={className} htmlFor={id}>
      <input
        id={id}
        type={type}
        className={`field ${inputClassName}`}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete ?? "off"}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(upper ? e.target.value.toUpperCase() : e.target.value)}
      />
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} className={className} htmlFor={id}>
      <textarea id={id} className="field resize-y" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

/** Number input that keeps the user's text while typing ("1." / "") and reports numbers. */
export function NumberInput({
  value,
  onChange,
  className = "",
  min,
  step = "any",
  ariaLabel,
  placeholder,
  id,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  min?: number;
  step?: string;
  ariaLabel?: string;
  placeholder?: string;
  id?: string;
}) {
  const [text, setText] = useState(Number.isFinite(value) ? String(value) : "");
  const [focused, setFocused] = useState(false);
  const shown = focused ? text : Number.isFinite(value) ? String(value) : "";
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={`field tabular-nums ${className}`}
      value={shown}
      onFocus={() => {
        setText(Number.isFinite(value) ? String(value) : "");
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d.,-]/g, "");
        setText(t);
        const n = Number(t.replace(/,/g, ""));
        if (t === "" || t === "-") onChange(0);
        else if (Number.isFinite(n)) onChange(min !== undefined ? Math.max(min, n) : n);
      }}
      data-step={step}
    />
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} className={className} htmlFor={id}>
      <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
          checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition ${checked ? "left-[18px]" : "left-0.5"}`} />
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm">
        <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
        {hint && <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </label>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            value === o.value
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  defaultOpen = true,
  right,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  right?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="card">
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" className="flex flex-1 items-center gap-2 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={id}>
          <IconDown className={`size-4 text-slate-400 transition ${open ? "" : "-rotate-90"}`} />
          <span>
            <span className="block text-sm font-semibold">{title}</span>
            {description && <span className="block text-xs text-slate-500 dark:text-slate-400">{description}</span>}
          </span>
        </button>
        {right}
      </div>
      {open && (
        <div id={id} className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
          {children}
        </div>
      )}
    </section>
  );
}

/* ---------------- Toasts ---------------- */

interface ToastMsg {
  id: number;
  text: string;
  kind: "ok" | "error";
}
let toasts: ToastMsg[] = [];
const toastListeners = new Set<() => void>();
let toastId = 0;

export function toast(text: string, kind: ToastMsg["kind"] = "ok") {
  const id = ++toastId;
  toasts = [...toasts, { id, text, kind }];
  toastListeners.forEach((l) => l());
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    toastListeners.forEach((l) => l());
  }, kind === "error" ? 6000 : 3000);
}

export function Toaster() {
  const list = useSyncExternalStore(
    (l) => {
      toastListeners.add(l);
      return () => toastListeners.delete(l);
    },
    () => toasts,
    () => toasts,
  );
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      {list.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            t.kind === "error" ? "bg-rose-600" : "bg-slate-900 dark:bg-slate-700"
          }`}
        >
          {t.kind === "error" ? <IconX className="size-4" /> : <IconCheck className="size-4" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}

/** Returns true after the first client render (for client-only bits). */
export function useMounted() {
  const [m, setM] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setM(true), []);
  return m;
}
