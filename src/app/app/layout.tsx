import type { Metadata } from "next";
import { Toaster } from "@/components/ui";

export const metadata: Metadata = {
  title: "Free GST invoice generator",
  description: "Create a GST or VAT invoice, quotation or receipt with UPI QR in your browser. Print or download as PDF.",
  alternates: { canonical: "/app/" },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
