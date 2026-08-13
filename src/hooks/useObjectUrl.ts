"use client";

import { useEffect, useState } from "react";

/**
 * Creates a blob: object URL for the given Blob and revokes it on cleanup.
 * createObjectURL must run in an effect (not render); setState here syncs
 * that external URL into React state.
 */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- object URL is an external browser resource
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return url;
}
