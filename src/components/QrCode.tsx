import { qrMatrix } from "@/lib/qr";

export function QrCode({ value, size = 96, fg = "#111827", title }: { value: string; size?: number; fg?: string; title?: string }) {
  const m = qrMatrix(value);
  if (!m) return null;
  const q = 2;
  const s = m.size + q * 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${s} ${s}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title ?? "QR code"}
    >
      <rect width={s} height={s} fill="#fff" />
      <path transform={`translate(${q} ${q})`} fill={fg} d={m.path} />
    </svg>
  );
}
