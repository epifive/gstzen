"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const PAGE_PX = 793.7; // 210mm at 96 dpi

/** Shows an A4 page scaled to fit its container width. */
export function PaperPreview({ children, maxScale = 1 }: { children: ReactNode; maxScale?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [height, setHeight] = useState(1123);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const ro = new ResizeObserver(() => {
      setScale(Math.min(maxScale, o.clientWidth / PAGE_PX));
      setHeight(i.offsetHeight);
    });
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [maxScale]);

  return (
    <div ref={outer} className="w-full overflow-hidden" style={{ height: height * scale }}>
      <div
        ref={inner}
        className="origin-top-left overflow-hidden rounded-sm shadow-[0_1px_3px_rgba(0,0,0,.08),0_12px_40px_-12px_rgba(15,23,42,.35)]"
        style={{ width: PAGE_PX, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

/** Renders children into <body> for printing only (#print-root). */
export function PrintPortal({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const div = document.createElement("div");
    div.id = "print-root";
    document.body.appendChild(div);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEl(div);
    return () => {
      div.remove();
    };
  }, []);
  return el ? createPortal(children, el) : null;
}
