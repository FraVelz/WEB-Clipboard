"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addCapture,
  deleteCapture,
  listCaptures,
  reorderCaptures,
  updateCaptureTitle,
  type CaptureRecord,
} from "@/lib/captures-db";

export function useCaptures() {
  const [captures, setCaptures] = useState<CaptureRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const items = await listCaptures();
        if (!cancelled) {
          setCaptures(items);
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar las capturas",
          );
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(
    async (input: { title: string; blob: Blob; mimeType: string }) => {
      const record = await addCapture(input);
      setCaptures((current) => [
        record,
        ...current.map((item) => ({
          ...item,
          position: item.position + 1,
        })),
      ]);
      return record;
    },
    [],
  );

  const rename = useCallback(async (id: string, title: string) => {
    await updateCaptureTitle(id, title);
    setCaptures((current) =>
      current.map((item) => (item.id === id ? { ...item, title } : item)),
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteCapture(id);
    setCaptures((current) => current.filter((item) => item.id !== id));
  }, []);

  const reorder = useCallback(async (orderedIds: string[]) => {
    setCaptures((current) => {
      const byId = new Map(current.map((item) => [item.id, item]));
      return orderedIds
        .map((id, position) => {
          const item = byId.get(id);
          return item ? { ...item, position } : null;
        })
        .filter((item): item is CaptureRecord => item !== null);
    });
    await reorderCaptures(orderedIds);
  }, []);

  return { captures, ready, error, save, rename, remove, reorder };
}
