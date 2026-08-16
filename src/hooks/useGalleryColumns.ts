"use client";

import { useCallback, useSyncExternalStore } from "react";

export type GalleryColumns = 3 | 4 | 5;

const STORAGE_KEY = "web-clipboard.gallery-columns";
const DEFAULT_COLUMNS: GalleryColumns = 3;

const listeners = new Set<() => void>();

function parseColumns(value: string | null): GalleryColumns | null {
  if (value === "3" || value === "4" || value === "5") {
    return Number(value) as GalleryColumns;
  }
  return null;
}

function getSnapshot(): GalleryColumns {
  return parseColumns(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_COLUMNS;
}

function getServerSnapshot(): GalleryColumns {
  return DEFAULT_COLUMNS;
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function useGalleryColumns() {
  const columns = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setColumns = useCallback((next: GalleryColumns) => {
    localStorage.setItem(STORAGE_KEY, String(next));
    emit();
  }, []);

  return { columns, setColumns };
}
