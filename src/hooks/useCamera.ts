import { useEffect, useState } from "react";
import { startCamera, stopCamera } from "../features/camera/cameraService";

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function initializeCamera() {
      try {
        currentStream = await startCamera();
        setStream(currentStream);
      } catch {
        setError("Unable to access the camera.");
      }
    }

    initializeCamera();

    return () => {
      if (currentStream) {
        stopCamera(currentStream);
      }
    };
  }, []);

  return { stream, error };
}