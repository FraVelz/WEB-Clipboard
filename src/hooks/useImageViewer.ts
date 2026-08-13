"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

export type ViewerState = {
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

function zoomAroundPoint(
  current: ViewerState,
  nextScale: number,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
): ViewerState {
  const contentX = (offsetX - width / 2 - current.x) / current.scale;
  const contentY = (offsetY - height / 2 - current.y) / current.scale;
  return {
    scale: nextScale,
    x: offsetX - width / 2 - contentX * nextScale,
    y: offsetY - height / 2 - contentY * nextScale,
  };
}

type UseImageViewerOptions = {
  enabled: boolean;
  onClose: () => void;
};

export function useImageViewer({ enabled, onClose }: UseImageViewerOptions) {
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

  const zoomAt = useCallback(
    (clientX: number, clientY: number, nextScale: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const clamped = clamp(nextScale, minScale, maxScale);
      const offsetX = clientX - rect.left;
      const offsetY = clientY - rect.top;
      const width = rect.width;
      const height = rect.height;

      setViewer((current) =>
        zoomAroundPoint(current, clamped, offsetX, offsetY, width, height),
      );
    },
    [maxScale, minScale],
  );

  const zoomByStep = useCallback(
    (direction: 1 | -1) => {
      setViewer((current) => ({
        ...current,
        scale: clamp(
          direction > 0 ? current.scale * ZOOM_STEP : current.scale / ZOOM_STEP,
          minScale,
          maxScale,
        ),
      }));
    },
    [maxScale, minScale],
  );

  const setNativeSize = useCallback(() => {
    setViewer({ scale: 1, x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomByStep(1);
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomByStep(-1);
      }
      if (event.key === "0") {
        event.preventDefault();
        resetToFit();
      }
      if (event.key === "1") {
        event.preventDefault();
        setNativeSize();
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
              scale: clamp(
                current.scale,
                nextFit * MIN_SCALE_FACTOR,
                Math.max(nextFit * MAX_SCALE_FACTOR, 4),
              ),
            };
      });
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [
    computeFitScale,
    enabled,
    fitScale,
    natural.height,
    natural.width,
    onClose,
    resetToFit,
    setNativeSize,
    zoomByStep,
  ]);

  useEffect(() => {
    if (!enabled) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onNativeWheel = (event: WheelEvent) => {
      event.preventDefault();

      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      if (event.deltaMode === 2) delta *= 400;
      delta = clamp(delta, -100, 100);

      const factor = clamp(
        Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY),
        WHEEL_FACTOR_MIN,
        WHEEL_FACTOR_MAX,
      );

      const rect = viewport.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const width = rect.width;
      const height = rect.height;

      setViewer((current) => {
        const nextScale = clamp(current.scale * factor, minScale, maxScale);
        if (Math.abs(nextScale - current.scale) < 0.0001) return current;
        return zoomAroundPoint(
          current,
          nextScale,
          offsetX,
          offsetY,
          width,
          height,
        );
      });
    };

    viewport.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onNativeWheel);
  }, [enabled, maxScale, minScale]);

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

  const onImageLoad = (width: number, height: number) => {
    setNatural({ width, height });
    const nextFit = computeFitScale(width, height);
    setFitScale(nextFit);
    setViewer({ scale: nextFit, x: 0, y: 0 });
  };

  const consumeSuppressClick = () => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  };

  const zoomPercent = Math.round(
    (viewer.scale / Math.max(fitScale, 0.0001)) * 100,
  );
  const nativePercent = Math.round(viewer.scale * 100);

  return {
    viewportRef: viewportRef as RefObject<HTMLDivElement>,
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
  };
}
