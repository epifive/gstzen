"use client";

import { useId, useState } from "react";
import type { Totals } from "@/lib/calc";
import { newItem, UNITS } from "@/lib/defaults";
import { GST_RATES, VAT_PRESET_RATES } from "@/lib/gst";
import { formatNumber } from "@/lib/money";
import type { LineItem, TaxMode } from "@/lib/types";
import { IconCopy, IconDown, IconPlus, IconTrash, IconUp } from "./icons";
import { NumberInput } from "./ui";

function TaxRateInput({ value, onChange, taxMode, id }: { value: number; onChange: (v: number) => void; taxMode: TaxMode; id: string }) {
  const presets = taxMode === "gst" ? GST_RATES : VAT_PRESET_RATES;
  const isPreset = presets.includes(value);
  const [custom, setCustom] = useState(!isPreset);
  if (custom || !isPreset) {
    return (
      <div className="flex gap-1">
        <NumberInput id={id} value={value} min={0} onChange={(v) => onChange(Math.min(v, 100))} className="field-sm" ariaLabel="Tax rate percent" />
        <button
          type="button"
          className="btn-ghost px-1.5 text-xs"
          title="Pick a preset rate"
          onClick={() => {
            setCustom(false);
            if (!presets.includes(value)) onChange(presets.includes(18) ? 18 : presets[presets.length - 1]);
          }}
        >
          ▾
        </button>
      </div>
    );
  }
  return (
    <select
      id={id}
      className="field field-sm"
      value={String(value)}
      onChange={(e) => {
        if (e.target.value === "custom") setCustom(true);
        else onChange(Number(e.target.value));
      }}
    >
      {presets.map((r) => (
        <option key={r} value={String(r)}>
          {r}%
        </option>
      ))}
      <option value="custom">Custom…</option>
    </select>
  );
}

function ItemRow({
  item,
  index,
  count,
  taxMode,
  currency,
  amount,
  onChange,
  onRemove,
  onMove,
  onDuplicate,
}: {
  item: LineItem;
  index: number;
  count: number;
  taxMode: TaxMode;
  currency: string;
  amount: number;
  onChange: (i: LineItem) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
}) {
  const id = useId();
  const set = <K extends keyof LineItem>(k: K, v: LineItem[K]) => onChange({ ...item, [k]: v });
  const taxOn = taxMode !== "none";
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-start gap-2">
        <span className="mt-2 w-5 shrink-0 text-xs font-semibold text-slate-400">{index + 1}</span>
        <div className="flex-1">
          <label htmlFor={`${id}-d`} className="sr-only">
            Description
          </label>
          <textarea
            id={`${id}-d`}
            rows={1}
            className="field field-sm min-h-[36px] resize-y"
            placeholder="Item or service description"
            value={item.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="flex shrink-0 items-center">
          <button type="button" className="btn-ghost px-1.5 py-1.5" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up">
            <IconUp className="size-4" />
          </button>
          <button type="button" className="btn-ghost px-1.5 py-1.5" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Move down">
            <IconDown className="size-4" />
          </button>
          <button type="button" className="btn-ghost px-1.5 py-1.5" onClick={onDuplicate} aria-label="Duplicate line">
            <IconCopy className="size-4" />
          </button>
          <button type="button" className="btn-ghost px-1.5 py-1.5 hover:text-rose-600" onClick={onRemove} aria-label="Remove line">
            <IconTrash className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 pl-7 sm:grid-cols-7">
        <div className="col-span-1">
          <label className="label" htmlFor={`${id}-h`}>
            HSN/SAC
          </label>
          <input id={`${id}-h`} className="field field-sm" value={item.hsn} maxLength={8} inputMode="numeric" onChange={(e) => set("hsn", e.target.value.replace(/\s/g, ""))} />
        </div>
        <div>
          <label className="label" htmlFor={`${id}-q`}>
            Qty
          </label>
          <NumberInput id={`${id}-q`} value={item.qty} min={0} onChange={(v) => set("qty", v)} className="field-sm" />
        </div>
        <div>
          <label className="label" htmlFor={`${id}-u`}>
            Unit
          </label>
          <input id={`${id}-u`} className="field field-sm" list="gst-invoice-units" value={item.unit} maxLength={10} onChange={(e) => set("unit", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor={`${id}-r`}>
            Rate
          </label>
          <NumberInput id={`${id}-r`} value={item.rate} onChange={(v) => set("rate", v)} className="field-sm" />
        </div>
        <div>
          <label className="label" htmlFor={`${id}-x`}>
            Disc. %
          </label>
          <NumberInput id={`${id}-x`} value={item.discountPct} min={0} onChange={(v) => set("discountPct", Math.min(v, 100))} className="field-sm" />
        </div>
        <div>
          <label className="label" htmlFor={`${id}-t`}>
            {taxMode === "gst" ? "GST %" : "Tax %"}
          </label>
          {taxOn ? (
            <TaxRateInput id={`${id}-t`} value={item.taxRate} taxMode={taxMode} onChange={(v) => set("taxRate", v)} />
          ) : (
            <div className="field field-sm text-slate-400">—</div>
          )}
        </div>
        <div className="text-right">
          <span className="label">Amount</span>
          <div className="py-1.5 text-sm font-semibold tabular-nums">{formatNumber(amount, currency)}</div>
        </div>
      </div>
    </div>
  );
}

export function ItemsEditor({
  items,
  onChange,
  taxMode,
  currency,
  totals,
  defaultTaxRate,
}: {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  taxMode: TaxMode;
  currency: string;
  totals: Totals;
  defaultTaxRate: number;
}) {
  const update = (i: number, it: LineItem) => onChange(items.map((x, j) => (j === i ? it : x)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <datalist id="gst-invoice-units">
        {UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700">
          No items yet. Add your first product or service.
        </p>
      )}
      {items.map((it, i) => (
        <ItemRow
          key={it.id}
          item={it}
          index={i}
          count={items.length}
          taxMode={taxMode}
          currency={currency}
          amount={totals.lines[i]?.net ?? 0}
          onChange={(x) => update(i, x)}
          onRemove={() => onChange(items.filter((_, j) => j !== i))}
          onMove={(d) => move(i, d)}
          onDuplicate={() => {
            const next = [...items];
            next.splice(i + 1, 0, { ...it, id: newItem().id });
            onChange(next);
          }}
        />
      ))}
      <button
        type="button"
        className="btn-secondary w-full border-dashed"
        onClick={() => onChange([...items, newItem(taxMode === "none" ? 0 : (items[items.length - 1]?.taxRate ?? defaultTaxRate))])}
      >
        <IconPlus className="size-4" /> Add line item
      </button>
    </div>
  );
}
