import { useCallback, useEffect, useRef, useState } from "react";
import "./CapturePage.css";
import { Countdown } from "../components/Countdown/Countdown";
import { EditorPlaceholder } from "../features/editor/EditorPlaceholder";
import { CameraPreview } from "../features/camera/CameraPreview";
import { CapturedPhotoPreview } from "../features/capture/CapturedPhotoPreview";
import { capturePhoto } from "../features/capture/captureService";
import { SessionReview } from "../features/session/SessionReview";
import { useCamera } from "../hooks/useCamera";
import { createPhotoSession, getNextEmptySlot, isSessionComplete, placeLayoutPhoto, reorderLayoutPhotos, replaceSessionPhoto, selectSessionLayout, type PhotoSession } from "../types/photoSession";
import type { LayoutId } from "../features/editor/layoutDefinitions";

const COUNTDOWN_SECONDS = 3;
type CaptureStage = "ready" | "capture" | "preview" | "review" | "editor";

export function CapturePage() {
  const [stage, setStage] = useState<CaptureStage>("ready");
  const [session, setSession] = useState<PhotoSession>(createPhotoSession);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [hasStartedSequence, setHasStartedSequence] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isRestartDialogOpen, setIsRestartDialogOpen] = useState(false);
  const { stream, error: cameraError } = useCamera(stage === "capture");
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetSlot = activeSlot ?? getNextEmptySlot(session);
  const isReplacingPhoto = activeSlot !== null && session.photos[activeSlot] !== null;

  function beginCapture(slotIndex: number | null = null) {
    setActiveSlot(slotIndex);
    setCapturedPhoto(null);
    setCaptureError(null);
    setStage("capture");
  }

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || isCountingDown || targetSlot === null) return;
    setIsCountingDown(true);
    setCaptureError(null);
    for (let value = COUNTDOWN_SECONDS; value > 0; value -= 1) {
      setCountdown(value);
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }
    setCountdown(null);
    try {
      const photo = capturePhoto(videoRef.current);

      if (isReplacingPhoto) {
        setCapturedPhoto(photo);
        setStage("preview");
        return;
      }

      const updatedSession = replaceSessionPhoto(session, {
        slotIndex: targetSlot,
        dataUrl: photo,
        capturedAt: Date.now(),
      });
      setHasStartedSequence(true);
      setSession(updatedSession);
      if (isSessionComplete(updatedSession)) {
        setStage("review");
      }
    } catch {
      setCaptureError("We could not capture that photo. Please try again.");
    } finally {
      setIsCountingDown(false);
    }
  }, [isCountingDown, isReplacingPhoto, session, targetSlot]);

  useEffect(() => {
    if (!stream || stage !== "capture" || !hasStartedSequence || isReplacingPhoto || isCountingDown || targetSlot === null) {
      return undefined;
    }

    const nextCaptureTimer = window.setTimeout(() => {
      void handleCapture();
    }, 1000);

    return () => window.clearTimeout(nextCaptureTimer);
  }, [handleCapture, hasStartedSequence, isCountingDown, isReplacingPhoto, stage, stream, targetSlot]);

  function handleAccept() {
    if (!capturedPhoto || targetSlot === null) return;
    const updatedSession = replaceSessionPhoto(session, { slotIndex: targetSlot, dataUrl: capturedPhoto, capturedAt: Date.now() });
    setSession(updatedSession);
    setCapturedPhoto(null);
    setHasStartedSequence(false);
    setActiveSlot(null);
    setStage(isSessionComplete(updatedSession) ? "review" : "capture");
  }

  function handleCandidateRetake() { setCapturedPhoto(null); setStage("capture"); }
  function handleBackToReview() { setCapturedPhoto(null); setActiveSlot(null); setStage("review"); }
  function handleRestartAll() {
    setSession(createPhotoSession());
    setActiveSlot(null);
    setCapturedPhoto(null);
    setIsRestartDialogOpen(false);
    setStage("capture");
  }

  if (stage === "review") {
    return <main className="capture-page">
      <h1>UPSNAP</h1>
      <SessionReview session={session} onRetakePhoto={beginCapture} onRetakeAll={() => setIsRestartDialogOpen(true)} onContinue={() => setStage("editor")} />
      {isRestartDialogOpen && <div className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="restart-heading">
        <div className="confirmation-dialog__content">
          <h2 id="restart-heading">Retake all photos?</h2>
          <p>This clears the {session.requiredPhotoCount} accepted photos and starts a new session.</p>
          <div className="captured-photo-actions">
            <button type="button" onClick={() => setIsRestartDialogOpen(false)}>Keep photos</button>
            <button type="button" onClick={handleRestartAll}>Retake all photos</button>
          </div>
        </div>
      </div>}
    </main>;
  }

  if (stage === "editor") {
    return <main className="capture-page"><h1>UPSNAP</h1><EditorPlaceholder session={session} onBackToReview={() => setStage("review")} onLayoutChange={(layoutId: LayoutId) => setSession((current) => selectSessionLayout(current, layoutId))} onPlaceLayoutPhoto={(layoutSlotIndex, sourceSlotIndex) => setSession((current) => placeLayoutPhoto(current, layoutSlotIndex, sourceSlotIndex))} onReorderLayoutPhotos={(fromLayoutSlotIndex, toLayoutSlotIndex) => setSession((current) => reorderLayoutPhotos(current, fromLayoutSlotIndex, toLayoutSlotIndex))} /></main>;
  }

  if (stage === "ready") {
    return <main className="capture-page">
      <h1>UPSNAP</h1>
      <section className="capture-ready" aria-labelledby="ready-heading">
        <h2 id="ready-heading">Ready for your {session.requiredPhotoCount}-photo session?</h2>
        <p>Your camera will only start after you choose to begin.</p>
        <button type="button" onClick={() => beginCapture()}>Start camera</button>
      </section>
    </main>;
  }

  return <main className="capture-page">
    <h1>UPSNAP</h1>
    <p className="photo-progress">{isReplacingPhoto ? `Replacing photo ${(targetSlot ?? 0) + 1}` : `Photo ${(targetSlot ?? 0) + 1} / ${session.requiredPhotoCount}`}</p>
    {stage === "preview" && capturedPhoto ? <CapturedPhotoPreview photo={capturedPhoto} onRetake={handleCandidateRetake} onAccept={handleAccept} onBackToReview={isReplacingPhoto ? handleBackToReview : undefined} /> : <>
      {cameraError && <p className="capture-error" role="alert">{cameraError}</p>}
      {captureError && <p className="capture-error" role="alert">{captureError}</p>}
      {stream ? <>
        <div className="camera-container"><CameraPreview stream={stream} videoRef={videoRef} />{countdown !== null && <Countdown value={countdown} />}</div>
        {isReplacingPhoto ? <>
          <button className="capture-button" type="button" onClick={handleCapture} disabled={isCountingDown}>{isCountingDown ? "Get ready..." : "Take replacement"}</button>
          <button type="button" className="back-to-review" onClick={handleBackToReview} disabled={isCountingDown}>Back to review</button>
        </> : hasStartedSequence ? <p className="automatic-capture-status" role="status">{isCountingDown ? "Get ready..." : "Next photo starts in 1 second."}</p> : <button className="capture-button" type="button" onClick={handleCapture} disabled={isCountingDown}>Start photo sequence</button>}
      </> : !cameraError ? <p role="status">Starting camera...</p> : <button type="button" onClick={() => setStage("ready")}>Try again</button>}
    </>}
  </main>;
}
