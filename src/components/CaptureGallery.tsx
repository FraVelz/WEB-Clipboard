"use client";

import { CaptureCard } from "@/components/CaptureCard";
import { ImageIcon } from "@/components/icons";
import type { CaptureRecord } from "@/lib/captures-db";

type CaptureGalleryProps = {
  captures: CaptureRecord[];
  ready: boolean;
  onOpen: (capture: CaptureRecord) => void;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function CaptureGallery({
  captures,
  ready,
  onOpen,
  onRename,
  onDelete,
}: CaptureGalleryProps) {
  if (!ready) {
    return <p className="text-muted">Cargando capturas…</p>;
  }

  if (captures.length === 0) {
    return (
      <div
        data-testid="empty-gallery"
        className="border-border text-muted flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center"
      >
        <ImageIcon className="size-8" />
        <p>Aún no hay capturas. Pega una imagen del portapapeles.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {captures.map((capture) => (
        <li key={capture.id}>
          <CaptureCard
            capture={capture}
            onOpen={() => onOpen(capture)}
            onRename={(title) => onRename(capture.id, title)}
            onDelete={() => onDelete(capture.id)}
          />
        </li>
      ))}
    </ul>
  );
}
