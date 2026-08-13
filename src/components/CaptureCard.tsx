"use client";

import { useState } from "react";
import { CheckIcon, PencilIcon, TrashIcon, XIcon } from "@/components/icons";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { cn } from "@/lib/cn";
import type { CaptureRecord } from "@/lib/captures-db";

type CaptureCardProps = {
  capture: CaptureRecord;
  onOpen: () => void;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function CaptureCard({
  capture,
  onOpen,
  onRename,
  onDelete,
}: CaptureCardProps) {
  const src = useObjectUrl(capture.blob);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(capture.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatted = new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(capture.createdAt));

  async function saveTitle() {
    await onRename(draft.trim());
    setEditing(false);
  }

  return (
    <article className="border-border bg-surface overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={onOpen}
        className="bg-bg block w-full"
        aria-label={`Ver ${capture.title || "captura sin título"}`}
      >
        {src ? (
          // Object URLs from IndexedDB blobs are not static assets.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={capture.title || "Captura sin título"}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="bg-bg aspect-video" />
        )}
      </button>

      <div className="space-y-2 p-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="border-border bg-bg min-w-0 flex-1 rounded-md border px-2 py-1 text-sm"
              aria-label="Editar título"
            />
            <button
              type="button"
              aria-label="Guardar título"
              className="text-success hover:bg-surface-hover rounded-md p-1"
              onClick={() => void saveTitle()}
            >
              <CheckIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Cancelar edición"
              className="text-muted hover:bg-surface-hover rounded-md p-1"
              onClick={() => {
                setDraft(capture.title);
                setEditing(false);
              }}
            >
              <XIcon className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-medium">
              {capture.title || "Sin título"}
            </h2>
            <button
              type="button"
              aria-label="Editar título"
              className="text-muted hover:bg-surface-hover hover:text-text rounded-md p-1"
              onClick={() => {
                setDraft(capture.title);
                setEditing(true);
              }}
            >
              <PencilIcon className="size-4" />
            </button>
          </div>
        )}

        <p className="text-muted text-xs">{formatted}</p>

        {confirmDelete ? (
          <div className="flex items-center justify-between gap-2 text-sm">
            <span>¿Borrar?</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="bg-accent-soft text-accent rounded-md px-2 py-1"
                onClick={() => void onDelete()}
              >
                Confirmar
              </button>
              <button
                type="button"
                className="text-muted hover:bg-surface-hover rounded-md px-2 py-1"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Borrar captura"
            className={cn(
              "text-muted hover:bg-surface-hover hover:text-text rounded-md p-1",
            )}
            onClick={() => setConfirmDelete(true)}
          >
            <TrashIcon className="size-4" />
          </button>
        )}
      </div>
    </article>
  );
}
