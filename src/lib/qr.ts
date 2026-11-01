import QRCode from "qrcode";

export interface QrMatrix {
  size: number;
  path: string; // SVG path for dark modules, 1 unit per module
}

/** Encodes text into a QR matrix and an SVG path (synchronous, fully local). */
export function qrMatrix(text: string, ecl: "L" | "M" | "Q" | "H" = "M"): QrMatrix | null {
  if (!text) return null;
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: ecl });
    const size = qr.modules.size;
    const data = qr.modules.data;
    let path = "";
    for (let y = 0; y < size; y++) {
      let x = 0;
      while (x < size) {
        if (data[y * size + x]) {
          let run = 1;
          while (x + run < size && data[y * size + x + run]) run++;
          path += `M${x} ${y}h${run}v1h-${run}z`;
          x += run;
        } else x++;
      }
    }
    return { size, path };
  } catch {
    return null;
  }
}

/** A standalone SVG string (with a 4-module quiet zone). */
export function qrSvg(text: string, opts: { fg?: string; bg?: string } = {}): string {
  const m = qrMatrix(text);
  if (!m) return "";
  const q = 4;
  const s = m.size + q * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges"><rect width="${s}" height="${s}" fill="${opts.bg ?? "#fff"}"/><path transform="translate(${q} ${q})" fill="${opts.fg ?? "#000"}" d="${m.path}"/></svg>`;
}
