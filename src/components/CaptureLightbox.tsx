"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  MaximizeIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/components/icons";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import type { CaptureRecord } from "@/lib/captures-db";

type CaptureLightboxProps = {
  capture: CaptureRecord | null;
  onClose: () => void;
};

type ViewerState = {
  scale: number;
  x: number;
  y: number;
};

const ZOOM_STEP = 1.2;
const MIN_SCALE_FACTOR = 0.2;
const MAX_SCALE_FACTOR = 8;
const WHEEL_ZOOM_SENSITIVITY = 0.001;
const WHEEL_FACTOR_MIN = 0.92;
const WHEEL_FACTOR_MAX = 1.08;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function CaptureLightbox({ capture, onClose }: CaptureLightboxProps) {
  const src = useObjectUrl(capture?.blob);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [fitScale, setFitScale] = useState(1);
  const [viewer, setViewer] = useState<ViewerState>({ scale: 1, x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    startDistance: number;
    startScale: number;
    startX: number;
    startY: number;
    midpointX: number;
    midpointY: number;
  } | null>(null);
  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const minScale = fitScale * MIN_SCALE_FACTOR;
  const maxScale = Math.max(fitScale * MAX_SCALE_FACTOR, 4);

  const computeFitScale = useCallback((width: number, height: number) => {
    const viewport = viewportRef.current;
    if (!viewport || width <= 0 || height <= 0) return 1;
    const padding = 32;
    const availW = Math.max(viewport.clientWidth - padding, 1);
    const availH = Math.max(viewport.clientHeight - padding, 1);
    return Math.min(availW / width, availH / height);
  }, []);

  const resetToFit = useCallback(() => {
    if (!natural.width || !natural.height) return;
    const nextFit = computeFitScale(natural.width, natural.height);
    setFitScale(nextFit);
    setViewer({ scale: nextFit, x: 0, y: 0 });
  }, [computeFitScale, natural.height, natural.width]);

  useEffect(() => {
    if (!capture) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setViewer((current) => ({
          ...current,
          scale: clamp(current.scale * ZOOM_STEP, minScale, maxScale),
        }));
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        setViewer((current) => ({
          ...current,
          scale: clamp(current.scale / ZOOM_STEP, minScale, maxScale),
        }));
      }
      if (event.key === "0") {
        event.preventDefault();
        resetToFit();
      }
      if (event.key === "1") {
        event.preventDefault();
        setViewer({ scale: 1, x: 0, y: 0 });
      }
    };

    const onResize = () => {
      if (!natural.width || !natural.height) return;
      const nextFit = computeFitScale(natural.width, natural.height);
      setFitScale(nextFit);
      setViewer((current) => {
        const wasFit = Math.abs(current.scale - fitScale) < 0.01;
        return wasFit
          ? { scale: nextFit, x: 0, y: 0 }
          : {
              ...current,
              scale: clamp(current.scale, nextFit * MIN_SCALE_FACTOR, maxScale),
            };
      });
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [
    capture,
    computeFitScale,
    fitScale,
    maxScale,
    minScale,
    natural.height,
    natural.width,
    onClose,
    resetToFit,
  ]);

  const zoomAt = useCallback(
    (clientX: number, clientY: number, nextScale: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const clamped = clamp(nextScale, minScale, maxScale);

      setViewer((current) => {
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;
        const contentX = (offsetX - rect.width / 2 - current.x) / current.scale;
        const contentY =
          (offsetY - rect.height / 2 - current.y) / current.scale;
        return {
          scale: clamped,
          x: offsetX - rect.width / 2 - contentX * clamped,
          y: offsetY - rect.height / 2 - contentY * clamped,
        };
      });
    },
    [maxScale, minScale],
  );

  useEffect(() => {
    if (!capture) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onNativeWheel = (event: WheelEvent) => {
      event.preventDefault();

      // Trackpads send many tiny deltas; discrete notches are larger. Scale
      // proportionally so a small flick never jumps to max zoom.
      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      if (event.deltaMode === 2) delta *= 400;
      delta = clamp(delta, -100, 100);

      const factor = clamp(
        Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY),
        WHEEL_FACTOR_MIN,
        WHEEL_FACTOR_MAX,
      );

      setViewer((current) => {
        const nextScale = clamp(current.scale * factor, minScale, maxScale);
        if (Math.abs(nextScale - current.scale) < 0.0001) return current;
        const rect = viewport.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        const contentX = (offsetX - rect.width / 2 - current.x) / current.scale;
        const contentY =
          (offsetY - rect.height / 2 - current.y) / current.scale;
        return {
          scale: nextScale,
          x: offsetX - rect.width / 2 - contentX * nextScale,
          y: offsetY - rect.height / 2 - contentY * nextScale,
        };
      });
    };

    viewport.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onNativeWheel);
  }, [capture, maxScale, minScale]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;

    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      if (!a || !b) return;
      pinchRef.current = {
        startDistance: Math.max(distance(a, b), 1),
        startScale: viewer.scale,
        startX: viewer.x,
        startY: viewer.y,
        midpointX: (a.x + b.x) / 2,
        midpointY: (a.y + b.y) / 2,
      };
      panRef.current = null;
      return;
    }

    suppressClickRef.current = false;
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewer.x,
      originY: viewer.y,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()];
      if (!a || !b) return;
      const pinch = pinchRef.current;
      const ratio = distance(a, b) / pinch.startDistance;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const nextScale = clamp(pinch.startScale * ratio, minScale, maxScale);
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const offsetX = midX - rect.left;
      const offsetY = midY - rect.top;
      const contentX =
        (pinch.midpointX - rect.left - rect.width / 2 - pinch.startX) /
        pinch.startScale;
      const contentY =
        (pinch.midpointY - rect.top - rect.height / 2 - pinch.startY) /
        pinch.startScale;
      setViewer({
        scale: nextScale,
        x: offsetX - rect.width / 2 - contentX * nextScale,
        y: offsetY - rect.height / 2 - contentY * nextScale,
      });
      return;
    }

    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;

    const dx = event.clientX - pan.startX;
    const dy = event.clientY - pan.startY;
    if (!pan.moved && Math.hypot(dx, dy) > 3) {
      pan.moved = true;
      suppressClickRef.current = true;
    }

    setViewer((current) => ({
      ...current,
      x: pan.originX + dx,
      y: pan.originY + dy,
    }));
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (panRef.current?.pointerId === event.pointerId) {
      if (panRef.current.moved) suppressClickRef.current = true;
      panRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (!capture || !src) return null;

  const zoomPercent = Math.round(
    (viewer.scale / Math.max(fitScale, 0.0001)) * 100,
  );
  const nativePercent = Math.round(viewer.scale * 100);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={capture.title || "Captura a pantalla completa"}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3">
        <div className="bg-surface/90 text-muted pointer-events-none max-w-[50%] rounded-lg px-3 py-2 text-sm backdrop-blur">
          <p className="text-text truncate font-medium">
            {capture.title || "Sin título"}
          </p>
          <p className="truncate text-xs">
            {natural.width && natural.height
              ? `${natural.width}×${natural.height}px · vista ${zoomPercent}% · nativo ${nativePercent}%`
              : "Cargando…"}
          </p>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1">
          <div
            className="bg-surface/95 border-border flex items-center gap-1 rounded-lg border p-1 shadow-lg backdrop-blur"
            role="toolbar"
            aria-label="Controles de zoom"
          >
            <button
              type="button"
              aria-label="Alejar"
              title="Alejar (−)"
              className="hover:bg-surface-hover rounded-md p-2"
              onClick={() =>
                setViewer((current) => ({
                  ...current,
                  scale: clamp(current.scale / ZOOM_STEP, minScale, maxScale),
                }))
              }
            >
              <ZoomOutIcon className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Acercar"
              title="Acercar (+)"
              className="hover:bg-surface-hover rounded-md p-2"
              onClick={() =>
                setViewer((current) => ({
                  ...current,
                  scale: clamp(current.scale * ZOOM_STEP, minScale, maxScale),
                }))
              }
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
              onClick={() => setViewer({ scale: 1, x: 0, y: 0 })}
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
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
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
              width: natural.width ? natural.width * viewer.scale : undefined,
              height: natural.height
                ? natural.height * viewer.scale
                : undefined,
            }}
            onLoad={(event) => {
              const img = event.currentTarget;
              const width = img.naturalWidth;
              const height = img.naturalHeight;
              setNatural({ width, height });
              const nextFit = computeFitScale(width, height);
              setFitScale(nextFit);
              setViewer({ scale: nextFit, x: 0, y: 0 });
            }}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      </div>

      <p className="text-muted pointer-events-none absolute inset-x-0 bottom-3 z-20 text-center text-xs">
        Arrastra la imagen para moverla · rueda suave o pellizco para zoom ·
        botones o +/− en el teclado
      </p>
    </div>
  );
}
