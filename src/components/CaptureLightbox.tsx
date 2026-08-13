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
      className="fixed inset-0 z-50 cursor-pointer overflow-auto bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={capture.title || "Captura"}
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="bg-surface text-text hover:bg-surface-hover fixed top-4 right-4 z-10 rounded-full p-2"
        onClick={onClose}
      >
        <XIcon className="size-5" />
      </button>
      <div className="flex min-h-full items-center justify-center py-10">
        {/* Object URLs from IndexedDB blobs are not static assets. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={capture.title || "Captura"}
          className="h-auto max-h-[90vh] w-auto max-w-[min(100%,90vw)] cursor-default object-contain"
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  );
}
