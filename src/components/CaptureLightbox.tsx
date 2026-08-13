"use client";

import { useEffect } from "react";
import { XIcon } from "@/components/icons";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import type { CaptureRecord } from "@/lib/captures-db";

type CaptureLightboxProps = {
  capture: CaptureRecord | null;
  onClose: () => void;
};

export function CaptureLightbox({ capture, onClose }: CaptureLightboxProps) {
  const src = useObjectUrl(capture?.blob);

  useEffect(() => {
    if (!capture) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [capture, onClose]);

  if (!capture || !src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={capture.title || "Captura"}
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="bg-surface text-text hover:bg-surface-hover absolute top-4 right-4 rounded-full p-2"
        onClick={onClose}
      >
        <XIcon className="size-5" />
      </button>
      {/* Object URLs from IndexedDB blobs are not static assets. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={capture.title || "Captura"}
        className="max-h-[90vh] max-w-full object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
