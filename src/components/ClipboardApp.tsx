"use client";

import { useState } from "react";
import { CaptureComposer } from "@/components/CaptureComposer";
import { CaptureGallery } from "@/components/CaptureGallery";
import { CaptureLightbox } from "@/components/CaptureLightbox";
import { useCaptures } from "@/hooks/useCaptures";
import type { CaptureRecord } from "@/lib/captures-db";

export function ClipboardApp() {
  const { captures, ready, error, save, rename, remove, reorder } =
    useCaptures();
  const [open, setOpen] = useState<CaptureRecord | null>(null);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">WEB-Clipboard</h1>
        <p className="text-muted mt-1">
          Pega capturas del portapapeles. Se guardan solo en este navegador.
          Arrastra el asa para reordenar.
        </p>
      </header>

      <CaptureComposer onSave={save} />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <CaptureGallery
        captures={captures}
        ready={ready}
        onOpen={setOpen}
        onRename={rename}
        onDelete={async (id) => {
          await remove(id);
          if (open?.id === id) setOpen(null);
        }}
        onReorder={reorder}
      />

      <CaptureLightbox capture={open} onClose={() => setOpen(null)} />
    </main>
  );
}
