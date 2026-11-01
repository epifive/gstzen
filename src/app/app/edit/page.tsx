"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Editor } from "@/components/Editor";
import { useStore } from "@/lib/store";

function EditInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const store = useStore();
  if (!store) return <div className="p-10 text-center text-sm text-slate-500">Loading…</div>;
  const doc = store.docs.find((d) => d.id === id);
  if (!doc)
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-xl font-semibold">Document not found</h1>
        <p className="mt-2 text-sm text-slate-500">It may have been deleted, or it was created in another browser. Documents are stored only in the browser where you made them.</p>
        <Link href="/app/" className="btn-primary mt-6">
          Back to documents
        </Link>
      </div>
    );
  return <Editor key={doc.id} initial={doc} />;
}

export default function EditPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading…</div>}>
      <EditInner />
    </Suspense>
  );
}
