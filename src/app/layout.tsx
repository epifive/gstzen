import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { themeScript } from "@/components/ThemeToggle";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const description =
  "Free GST invoice generator: make GST/VAT invoices, quotations and receipts with HSN/SAC, CGST/SGST/IGST, amount in words and a UPI QR. Print or download PDF. Works offline in your browser. Open source.";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: {
    default: `${BRAND.name}: free GST invoice generator with UPI QR`,
    template: `%s · ${BRAND.name}`,
  },
  description,
  keywords: [
    "gst invoice generator",
    "invoice generator",
    "gst invoice format",
    "quotation generator",
    "receipt maker",
    "upi qr invoice",
    "vat invoice",
    "open source invoice",
  ],
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    title: `${BRAND.name}: GST & VAT invoices with UPI QR`,
    description,
    siteName: BRAND.name,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: `${BRAND.name}: GST & VAT invoices with UPI QR`, description },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
