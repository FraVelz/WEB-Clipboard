"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import {
  CheckIcon,
  EllipsisIcon,
  GripVerticalIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from "@/components/icons";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { cn } from "@/lib/cn";
import type { CaptureRecord } from "@/lib/captures-db";

type CaptureCardProps = {
  capture: CaptureRecord;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onOpen: () => void;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
};

export function CaptureCard({
  capture,
  isDragging = false,
  isDropTarget = false,
  onOpen,
  onRename,
  onDelete,
  onDragStart,
  onDragEnd,
}: CaptureCardProps) {
  const src = useObjectUrl(capture.blob);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(capture.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const formatted = new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(capture.createdAt));

  async function saveTitle() {
    await onRename(draft.trim());
    setEditing(false);
  }

  return (
    <article
      className={cn(
        "border-border bg-surface overflow-hidden rounded-xl border",
        isDragging && "opacity-50",
        isDropTarget && "ring-accent ring-offset-bg ring-2 ring-offset-2",
      )}
    >
      <div className="border-border flex items-center gap-1 border-b px-2 py-1.5">
        <button
          type="button"
          draggable
          aria-label="Reordenar captura"
          title="Arrastra para reordenar"
          className="text-muted hover:bg-surface-hover hover:text-text cursor-grab rounded-md p-1.5 active:cursor-grabbing"
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <GripVerticalIcon className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="border-border bg-bg min-w-0 flex-1 rounded-md border px-2 py-1 text-sm"
                aria-label="Editar título"
                autoFocus
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
            <div className="min-w-0">
              <h2 className="truncate text-sm font-medium">
                {capture.title || "Sin título"}
              </h2>
              <p className="text-muted truncate text-xs">{formatted}</p>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Más acciones"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            className="text-muted hover:bg-surface-hover hover:text-text rounded-md p-1.5"
            onClick={() => {
              setMenuOpen((open) => !open);
              setConfirmDelete(false);
            }}
          >
            <EllipsisIcon className="size-4" />
          </button>

          {menuOpen ? (
            <div
              id={menuId}
              role="menu"
              className="border-border bg-surface absolute top-full right-0 z-20 mt-1 min-w-40 rounded-lg border p-1 shadow-lg"
            >
              {confirmDelete ? (
                <div className="space-y-1 px-2 py-1.5 text-sm">
                  <p>¿Borrar captura?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      role="menuitem"
                      className="bg-accent-soft text-accent rounded-md px-2 py-1"
                      onClick={() => void onDelete()}
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="text-muted hover:bg-surface-hover rounded-md px-2 py-1"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    className="hover:bg-surface-hover flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
                    onClick={() => {
                      setDraft(capture.title);
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    <PencilIcon className="size-4" />
                    Editar título
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="hover:bg-surface-hover flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-red-300"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <TrashIcon className="size-4" />
                    Borrar
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="bg-bg flex w-full items-center justify-center p-2"
        aria-label={`Ver ${capture.title || "captura sin título"} a tamaño completo`}
      >
        {src ? (
          // Object URLs from IndexedDB blobs are not static assets.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={capture.title || "Captura sin título"}
            className="mx-auto h-auto max-h-[28rem] w-auto max-w-full object-contain"
          />
        ) : (
          <div className="bg-bg min-h-40" />
        )}
      </button>
    </article>
  );
}
