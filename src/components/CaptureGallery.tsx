"use client";

import { useState } from "react";
import { CaptureCard } from "@/components/CaptureCard";
import { ImageIcon } from "@/components/icons";
import type { CaptureRecord } from "@/lib/captures-db";

type CaptureGalleryProps = {
  captures: CaptureRecord[];
  ready: boolean;
  onOpen: (capture: CaptureRecord) => void;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
};

function moveItem(ids: string[], fromId: string, toId: string): string[] {
  if (fromId === toId) return ids;
  const next = [...ids];
  const fromIndex = next.indexOf(fromId);
  const toIndex = next.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0) return ids;
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, fromId);
  return next;
}

export function CaptureGallery({
  captures,
  ready,
  onOpen,
  onRename,
  onDelete,
  onReorder,
}: CaptureGalleryProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

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

  const ids = captures.map((capture) => capture.id);

  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {captures.map((capture) => (
        <li
          key={capture.id}
          onDragOver={(event) => {
            if (!draggingId) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            if (dropTargetId !== capture.id) setDropTargetId(capture.id);
          }}
          onDragLeave={() => {
            if (dropTargetId === capture.id) setDropTargetId(null);
          }}
          onDrop={(event) => {
            event.preventDefault();
            const fromId =
              event.dataTransfer.getData("text/capture-id") || draggingId;
            setDraggingId(null);
            setDropTargetId(null);
            if (!fromId) return;
            const nextIds = moveItem(ids, fromId, capture.id);
            if (nextIds.join() !== ids.join()) {
              void onReorder(nextIds);
            }
          }}
        >
          <CaptureCard
            capture={capture}
            isDragging={draggingId === capture.id}
            isDropTarget={
              dropTargetId === capture.id && draggingId !== capture.id
            }
            onOpen={() => onOpen(capture)}
            onRename={(title) => onRename(capture.id, title)}
            onDelete={() => onDelete(capture.id)}
            onDragStart={(event) => {
              event.dataTransfer.setData("text/capture-id", capture.id);
              event.dataTransfer.effectAllowed = "move";
              setDraggingId(capture.id);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setDropTargetId(null);
            }}
          />
        </li>
      ))}
    </ul>
  );
}
