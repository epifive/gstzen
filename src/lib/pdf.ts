"use client";

/** A file-system friendly name: "Tax-Invoice_INV-26-27-001_Client" */
export function docFileName(parts: string[]): string {
  return (
    parts
      .filter(Boolean)
      .join("_")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120) || "document"
  );
}

/** Opens the browser print dialog for the #print-root element (Save as PDF gives a vector A4 PDF). */
export function printDocument(fileName: string) {
  const prev = document.title;
  document.title = fileName;
  const restore = () => {
    document.title = prev;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
  setTimeout(restore, 3000);
}

const A4_W_MM = 210;
const A4_H_MM = 297;
const MARGIN_MM = 10; // top/bottom margin used on continuation pages

/**
 * Renders the A4 page element to a PDF file and downloads it.
 * Long documents are split across pages at row boundaries ([data-pdf-row]) so text lines are never cut.
 */
export async function downloadPdf(page: HTMLElement, fileName: string): Promise<void> {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  const scale = 2;
  const cssWidth = page.offsetWidth;
  const cssHeight = page.scrollHeight;
  const canvas = await toCanvas(page, {
    pixelRatio: scale,
    backgroundColor: "#ffffff",
    width: cssWidth,
    height: cssHeight,
    cacheBust: true,
    filter: (node) => !(node instanceof HTMLElement && node.dataset.sampleBadge !== undefined),
  });

  const pxPerMm = cssWidth / A4_W_MM; // CSS px per mm
  const pageHpx = A4_H_MM * pxPerMm;
  const contHpx = (A4_H_MM - MARGIN_MM * 2) * pxPerMm;

  // Candidate break points: bottoms of rows (relative to the page element)
  const top = page.getBoundingClientRect().top;
  const zoom = page.getBoundingClientRect().height / page.offsetHeight || 1;
  const breaks = Array.from(page.querySelectorAll<HTMLElement>("[data-pdf-row]"))
    .map((el) => (el.getBoundingClientRect().bottom - top) / zoom)
    .concat([cssHeight])
    .sort((a, b) => a - b);

  const slices: [number, number][] = [];
  let start = 0;
  let first = true;
  while (start < cssHeight - 1) {
    const avail = first ? pageHpx - MARGIN_MM * pxPerMm : contHpx;
    const limit = start + avail;
    if (cssHeight <= start + (first ? pageHpx : contHpx) + 3) {
      slices.push([start, cssHeight]);
      break;
    }
    const candidates = breaks.filter((b) => b > start + 40 && b <= limit);
    const end = candidates.length ? candidates[candidates.length - 1] : limit;
    slices.push([start, end]);
    start = end;
    first = false;
  }

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  slices.forEach(([s, e], i) => {
    const h = e - s;
    const c = document.createElement("canvas");
    c.width = canvas.width;
    c.height = Math.max(1, Math.round(h * scale));
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(canvas, 0, Math.round(s * scale), canvas.width, c.height, 0, 0, c.width, c.height);
    const img = c.toDataURL("image/jpeg", 0.92);
    if (i > 0) pdf.addPage();
    const y = i === 0 ? 0 : MARGIN_MM;
    pdf.addImage(img, "JPEG", 0, y, A4_W_MM, h / pxPerMm, undefined, "FAST");
    if (slices.length > 1) {
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`Page ${i + 1} of ${slices.length}`, A4_W_MM - 12, A4_H_MM - 5, { align: "right" });
    }
  });
  pdf.save(`${fileName}.pdf`);
}
