import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit document",
  robots: { index: false, follow: false },
};

export default function EditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
