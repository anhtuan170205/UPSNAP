import { useRef, useState } from "react";
import "./CapturePage.css";
import { Countdown } from "../components/Countdown/Countdown";
import { CameraPreview } from "../features/camera/CameraPreview";
import { CapturedPhotoPreview } from "../features/capture/CapturedPhotoPreview";
import { capturePhoto } from "../features/capture/captureService";
import { useCamera } from "../hooks/useCamera";

const COUNTDOWN_SECONDS = 3;

export function CapturePage() {
  const { stream, error } = useCamera();

  const videoRef = useRef<HTMLVideoElement>(null);

  const [capturedPhoto, setCapturedPhoto] =
    useState<string | null>(null);

  const [countdown, setCountdown] =
    useState<number | null>(null);

  const [isCountingDown, setIsCountingDown] =
    useState(false);

  async function handleCapture() {
    if (!videoRef.current || isCountingDown) {
      return;
    }

    setIsCountingDown(true);

    for (let i = COUNTDOWN_SECONDS; i > 0; i--) {
      setCountdown(i);

      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );
    }

    setCountdown(null);

    try {
      const photo = capturePhoto(videoRef.current);
      setCapturedPhoto(photo);
    } catch (error) {
      console.error("Failed to capture photo:", error);
    } finally {
      setIsCountingDown(false);
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
  <main className="capture-page">
    <h1>UPSNAP</h1>

    {capturedPhoto ? (
      <CapturedPhotoPreview
        photo={capturedPhoto}
        onRetake={handleRetake}
        onAccept={handleAccept}
      />
    ) : (
      <>
        <div className="camera-container">
          <CameraPreview
            stream={stream}
            videoRef={videoRef}
          />

          {countdown !== null && (
            <Countdown value={countdown} />
          )}
        </div>

        <button
          className="capture-button"
          onClick={handleCapture}
          disabled={isCountingDown}
        >
          {isCountingDown ? "Get ready..." : "Take Photo"}
        </button>
      </>
    )}
  </main>
);
}