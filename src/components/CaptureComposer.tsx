"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardPasteIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import {
  clipboardEventHasImage,
  extractImageFromClipboardEvent,
  extractImageFromClipboardItems,
} from "@/lib/clipboard";

type CaptureComposerProps = {
  onSave: (input: {
    title: string;
    blob: Blob;
    mimeType: string;
  }) => Promise<unknown>;
};

export function CaptureComposer({ onSave }: CaptureComposerProps) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const saveImage = useCallback(
    async (blob: Blob, mimeType: string) => {
      setBusy(true);
      setMessage(null);
      try {
        await onSave({ title: title.trim(), blob, mimeType });
        setTitle("");
        setMessage("Captura guardada");
        inputRef.current?.focus();
      } catch {
        setMessage("No se pudo guardar la captura");
      } finally {
        setBusy(false);
      }
    },
    [onSave, title],
  );

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (!clipboardEventHasImage(event)) return;
      event.preventDefault();
      void extractImageFromClipboardEvent(event).then((image) => {
        if (image) return saveImage(image.blob, image.mimeType);
      });
    };

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [saveImage]);

  async function onPasteClick() {
    if (!navigator.clipboard?.read) {
      setMessage("Este navegador no permite leer el portapapeles. Usa Ctrl+V.");
      return;
    }

    try {
      const items = await navigator.clipboard.read();
      const image = await extractImageFromClipboardItems(items);
      if (!image) {
        setMessage("No hay una imagen en el portapapeles");
        return;
      }
      await saveImage(image.blob, image.mimeType);
    } catch {
      setMessage("No se pudo leer el portapapeles. Prueba Ctrl+V.");
    }
  }

  return (
    <section className="border-border bg-surface rounded-xl border p-3 sm:p-4">
      <label htmlFor="capture-title" className="block text-sm font-medium">
        Título (opcional)
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="capture-title"
          ref={inputRef}
          data-testid="capture-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Escribe un título y pega la captura"
          disabled={busy}
          className={cn(
            "border-border bg-bg text-text min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-base sm:py-2 sm:text-sm",
            "placeholder:text-muted",
          )}
        />
        <button
          type="button"
          data-testid="paste-button"
          onClick={() => void onPasteClick()}
          disabled={busy}
          className="bg-accent inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-60 sm:min-h-0 sm:py-2"
        >
          <ClipboardPasteIcon className="size-4" />
          Pegar
        </button>
      </div>
      <p className="text-muted mt-2 text-sm">
        <span className="sm:hidden">
          Pega desde el portapapeles. Si el título está vacío, se guarda sin
          título.
        </span>
        <span className="hidden sm:inline">
          Pega con Ctrl+V o Cmd+V. Si el título está vacío, se guarda sin
          título.
        </span>
      </p>
      {message ? (
        <p className="text-muted mt-2 text-sm" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
