import { useEffect, useState } from "react";
import { startCamera, stopCamera } from "../features/camera/cameraService";

export function useCamera(enabled: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    let cancelled = false;

    if (!enabled) return undefined;

    async function initializeCamera() {
      try {
        currentStream = await startCamera();
        if (cancelled) {
          stopCamera(currentStream);
          return;
        }
        setError(null);
        setStream(currentStream);
      } catch {
        if (!cancelled) {
          setError("Unable to access the camera. Check permissions and try again.");
        }
      }
    }

    initializeCamera();

    return () => {
      cancelled = true;
      if (currentStream) {
        stopCamera(currentStream);
      }
    };
  }, [enabled]);

  const hasLiveTrack = stream?.getTracks().some((track) => track.readyState === "live");

  return {
    stream: enabled && hasLiveTrack ? stream : null,
    error: enabled ? error : null,
  };
}
