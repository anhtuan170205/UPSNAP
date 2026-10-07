import { useRef, useState } from "react";

import { CameraPreview } from "../features/camera/CameraPreview";
import { CapturedPhotoPreview } from "../features/capture/CapturedPhotoPreview";
import { capturePhoto } from "../features/capture/captureService";
import { useCamera } from "../hooks/useCamera";

export function CapturePage() {
  const { stream, error } = useCamera();

  const videoRef = useRef<HTMLVideoElement>(null);

  const [capturedPhoto, setCapturedPhoto] =
    useState<string | null>(null);

  function handleCapture() {
    if (!videoRef.current) {
      return;
    }

    try {
      const photo = capturePhoto(videoRef.current);
      setCapturedPhoto(photo);
    } catch (error) {
      console.error("Failed to capture photo:", error);
    }
  }

  function handleRetake() {
    setCapturedPhoto(null);
  }

  function handleAccept() {
    if (!capturedPhoto) {
      return;
    }

    console.log("Photo accepted");
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!stream) {
    return <p>Starting camera...</p>;
  }

  return (
    <main>
      <h1>UPSNAP</h1>

      {capturedPhoto ? (
        <CapturedPhotoPreview
          photo={capturedPhoto}
          onRetake={handleRetake}
          onAccept={handleAccept}
        />
      ) : (
        <>
          <CameraPreview
            stream={stream}
            videoRef={videoRef}
          />

          <button onClick={handleCapture}>
            Capture
          </button>
        </>
      )}
    </main>
  );
}