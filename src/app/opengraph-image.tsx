import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "EpiFive GST Invoice: GST & VAT invoice maker with UPI QR";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #312e81 0%, #4f46e5 45%, #0d9488 100%)",
          color: "#fff",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 700 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", fontSize: 34 }}>
              ₹
            </div>
            EpiFive GST Invoice
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05 }}>GST invoices with a UPI QR</div>
            <div style={{ fontSize: 28, marginTop: 20, opacity: 0.88 }}>Invoices · Quotations · Receipts · VAT · PDF</div>
          </div>
          <div style={{ fontSize: 24, opacity: 0.8 }}>Free &amp; open source · Runs in your browser</div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            width: 360,
            height: 486,
            background: "#fff",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            padding: 28,
            color: "#111827",
            boxShadow: "0 30px 60px rgba(0,0,0,.35)",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: "#4f46e5", letterSpacing: 2 }}>TAX INVOICE</div>
          <div style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>INV/26-27/001</div>
          {[70, 90, 60, 80].map((w, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginTop: i === 0 ? 28 : 14 }}>
              <div style={{ height: 12, width: `${w}%`, background: "#e5e7eb", borderRadius: 6 }} />
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, fontSize: 18 }}>
            <span>CGST 9%</span>
            <span>₹1,620.00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 18 }}>
            <span>SGST 9%</span>
            <span>₹1,620.00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, padding: "10px 12px", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 20, fontWeight: 700 }}>
            <span>Total</span>
            <span>₹21,240</span>
          </div>
          <div style={{ display: "flex", marginTop: "auto", alignItems: "center", gap: 14 }}>
            <div style={{ width: 84, height: 84, display: "flex", flexWrap: "wrap", border: "6px solid #111827", borderRadius: 6, padding: 6, gap: 4 }}>
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} style={{ width: 13, height: 13, background: [0, 2, 5, 7, 8, 11, 13, 14].includes(i) ? "#111827" : "#fff" }} />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 16 }}>
              <span style={{ fontWeight: 700, color: "#0d9488" }}>Scan to pay</span>
              <span style={{ color: "#6b7280" }}>any UPI app</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
