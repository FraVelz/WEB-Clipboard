"use client";

import { useEffect, useRef } from "react";
import {
  MaximizeIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/components/icons";
import { useImageViewer } from "@/hooks/useImageViewer";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import type { CaptureRecord } from "@/lib/captures-db";

type CaptureLightboxProps = {
  capture: CaptureRecord | null;
  onClose: () => void;
};

export function CaptureLightbox({ capture, onClose }: CaptureLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const src = useObjectUrl(capture?.blob);
  const open = Boolean(capture && src);

  const {
    viewportRef,
    natural,
    fitScale,
    viewer,
    zoomPercent,
    nativePercent,
    resetToFit,
    zoomAt,
    zoomByStep,
    setNativeSize,
    onPointerDown,
    onPointerMove,
    endPointer,
    onImageLoad,
    consumeSuppressClick,
  } = useImageViewer({ enabled: open, onClose });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  const title = capture?.title || "Captura a pantalla completa";

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-0 bg-black/90 p-0 text-inherit open:block"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {capture && src ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:p-3">
            <div className="bg-surface/90 text-muted pointer-events-none max-w-full min-w-0 rounded-lg px-3 py-2 text-sm backdrop-blur sm:max-w-[min(50%,24rem)]">
              <p className="text-text truncate font-medium">
                {capture.title || "Sin título"}
              </p>
              <p className="truncate text-xs">
                {natural.width && natural.height
                  ? `${natural.width}×${natural.height}px · vista ${zoomPercent}% · nativo ${nativePercent}%`
                  : "Cargando…"}
              </p>
            </div>

            <div className="pointer-events-auto flex flex-wrap items-center gap-1 self-end sm:justify-end">
              <div
                className="bg-surface/95 border-border flex items-center gap-0.5 rounded-lg border p-1 shadow-lg backdrop-blur sm:gap-1"
                role="toolbar"
                aria-label="Controles de zoom"
              >
                <button
                  type="button"
                  aria-label="Alejar"
                  title="Alejar (−)"
                  className="hover:bg-surface-hover rounded-md p-2"
                  onClick={() => zoomByStep(-1)}
                >
                  <ZoomOutIcon className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Acercar"
                  title="Acercar (+)"
                  className="hover:bg-surface-hover rounded-md p-2"
                  onClick={() => zoomByStep(1)}
                >
                  <ZoomInIcon className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Ajustar a la pantalla"
                  title="Ajustar (0)"
                  className="hover:bg-surface-hover rounded-md p-2"
                  onClick={resetToFit}
                >
                  <MaximizeIcon className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Tamaño real 100 por ciento"
                  title="Tamaño real (1)"
                  className="hover:bg-surface-hover rounded-md px-2 py-1 text-xs font-semibold"
                  onClick={setNativeSize}
                >
                  1:1
                </button>
              </div>

              <button
                type="button"
                aria-label="Cerrar"
                className="bg-surface/95 border-border hover:bg-surface-hover rounded-lg border p-2 shadow-lg backdrop-blur"
                onClick={onClose}
              >
                <XIcon className="size-5" />
              </button>
            </div>
          </div>

          <div
            ref={viewportRef}
            role="presentation"
            className="absolute inset-0 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onDoubleClick={(event) => {
              if (Math.abs(viewer.scale - fitScale) < 0.02) {
                zoomAt(event.clientX, event.clientY, Math.max(fitScale * 2, 1));
              } else {
                resetToFit();
              }
            }}
            onClick={(event) => {
              if (consumeSuppressClick()) return;
              if (event.target === event.currentTarget) onClose();
            }}
          >
            <div
              className="flex h-full w-full cursor-grab items-center justify-center active:cursor-grabbing"
              style={{
                transform: `translate(${viewer.x}px, ${viewer.y}px)`,
              }}
            >
              {/* Object URLs from IndexedDB blobs are not static assets. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={capture.title || "Captura"}
                draggable={false}
                className="max-w-none cursor-grab select-none active:cursor-grabbing"
                style={{
                  width: natural.width
                    ? natural.width * viewer.scale
                    : undefined,
                  height: natural.height
                    ? natural.height * viewer.scale
                    : undefined,
                }}
                onLoad={(event) => {
                  const img = event.currentTarget;
                  onImageLoad(img.naturalWidth, img.naturalHeight);
                }}
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          </div>

          <p className="text-muted pointer-events-none absolute inset-x-0 bottom-3 z-20 px-3 pb-[env(safe-area-inset-bottom)] text-center text-xs">
            <span className="sm:hidden">
              Arrastra para mover · pellizca para zoom
            </span>
            <span className="hidden sm:inline">
              Arrastra la imagen para moverla · rueda suave o pellizco para zoom ·
              botones o +/− en el teclado
            </span>
          </p>
        </>
      ) : null}
    </dialog>
  );
}
