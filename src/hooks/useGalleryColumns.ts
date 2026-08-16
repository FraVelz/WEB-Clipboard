"use client";

import { useEffect, useState } from "react";

export type GalleryColumns = 3 | 4 | 5;

const STORAGE_KEY = "web-clipboard.gallery-columns";
const DEFAULT_COLUMNS: GalleryColumns = 3;

function parseColumns(value: string | null): GalleryColumns | null {
  if (value === "3" || value === "4" || value === "5") {
    return Number(value) as GalleryColumns;
  }
  return null;
}

export function useGalleryColumns() {
  const [columns, setColumnsState] = useState<GalleryColumns>(DEFAULT_COLUMNS);

  useEffect(() => {
    setColumnsState(parseColumns(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_COLUMNS);
  }, []);

  const setColumns = (next: GalleryColumns) => {
    setColumnsState(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  return { columns, setColumns };
}
