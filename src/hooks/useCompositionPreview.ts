import { useEffect, useRef, useState } from "react";
import type { PhotoSession } from "../types/photoSession";
import { renderComposition } from "../features/export/compositionService";

type Result = { session: PhotoSession; attempt: number; blob: Blob | null; url: string | null; error: string | null };

export function useCompositionPreview(session: PhotoSession) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const activeUrl = useRef<string | null>(null);
  useEffect(() => () => {
    if (activeUrl.current) URL.revokeObjectURL(activeUrl.current);
    activeUrl.current = null;
  }, []);
  useEffect(() => {
    let current = true;
    void renderComposition(session).then((blob) => {
      if (!current) return;
      const url = URL.createObjectURL(blob);
      if (activeUrl.current) URL.revokeObjectURL(activeUrl.current);
      activeUrl.current = url;
      setResult({ session, attempt, blob, url, error: null });
    }).catch(() => {
      if (current) setResult({ session, attempt, blob: null, url: activeUrl.current, error: "We couldn’t create your image. Your photos are safe here. Try again." });
    });
    return () => { current = false; };
  }, [session, attempt]);
  const valid = result?.session === session && result.attempt === attempt;
  return {
    blob: valid ? result.blob : null,
    url: result?.url ?? null,
    error: valid ? result.error : null,
    isRendering: !valid,
    retry: () => setAttempt((value) => value + 1),
  };
}
