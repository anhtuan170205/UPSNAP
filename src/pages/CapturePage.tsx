import { useCallback, useEffect, useRef, useState } from "react";
import "./CapturePage.css";
import { Countdown } from "../components/Countdown/Countdown";
import { PhotoEditor } from "../features/editor/PhotoEditor";
import { BoothHeader } from "../components/BoothHeader";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CameraPreview } from "../features/camera/CameraPreview";
import { CapturedPhotoPreview } from "../features/capture/CapturedPhotoPreview";
import { capturePhoto } from "../features/capture/captureService";
import { SessionReview } from "../features/session/SessionReview";
import { useCamera } from "../hooks/useCamera";
import { addSessionSticker, createPhotoSession, getNextEmptySlot, isSessionComplete, placeLayoutPhoto, removeSessionSticker, reorderLayoutPhotos, replaceSessionPhoto, selectSessionLayout, selectSessionPreset, selectSessionTemplate, updateSessionSticker, type PhotoSession } from "../types/photoSession";
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
    setHasStartedSequence(false);
    setCaptureError(null);
    setIsRestartDialogOpen(false);
    setStage("capture");
  }
  function handleNewSession() {
    setSession(createPhotoSession());
    setActiveSlot(null);
    setCapturedPhoto(null);
    setHasStartedSequence(false);
    setStage("ready");
  }

  if (stage === "review") {
    return <main className="capture-page">
      <BoothHeader stage="review" />
      <SessionReview session={session} onRetakePhoto={beginCapture} onRetakeAll={() => setIsRestartDialogOpen(true)} onContinue={() => setStage("editor")} />
      {isRestartDialogOpen && <ConfirmDialog title="Retake all photos?" confirmLabel="Retake all photos" onCancel={() => setIsRestartDialogOpen(false)} onConfirm={handleRestartAll}>This clears your {session.requiredPhotoCount} photos and edits and starts a fresh capture.</ConfirmDialog>}
    </main>;
  }

  if (stage === "editor") {
    return <main className="capture-page"><BoothHeader stage="create" /><PhotoEditor session={session} onBackToReview={() => setStage("review")} onLayoutChange={(layoutId: LayoutId) => setSession((current) => selectSessionLayout(current, layoutId))} onPresetChange={(presetId) => setSession((current) => selectSessionPreset(current, presetId))} onTemplateChange={(templateId) => setSession((current) => selectSessionTemplate(current, templateId))} onAddSticker={(stickerId) => setSession((current) => addSessionSticker(current, stickerId))} onUpdateSticker={(instanceId, update) => setSession((current) => updateSessionSticker(current, instanceId, update))} onRemoveSticker={(instanceId) => setSession((current) => removeSessionSticker(current, instanceId))} onPlaceLayoutPhoto={(layoutSlotIndex, sourceSlotIndex) => setSession((current) => placeLayoutPhoto(current, layoutSlotIndex, sourceSlotIndex))} onReorderLayoutPhotos={(fromLayoutSlotIndex, toLayoutSlotIndex) => setSession((current) => reorderLayoutPhotos(current, fromLayoutSlotIndex, toLayoutSlotIndex))} onNewSession={handleNewSession} /></main>;
  }

  if (stage === "ready") {
    return <main className="capture-page">
      <BoothHeader stage="capture" />
      <section className="capture-ready" aria-labelledby="ready-heading">
        <div className="ready-copy"><p className="eyebrow">A little photo booth, just for us.</p>
        <h1 id="ready-heading">You and me.<br />A silly face.<br /><span className="accent">A moment to keep.</span></h1>
        <p>Make a face. Lean a little closer. Turn {session.requiredPhotoCount} tiny moments together into a print we’ll smile at later.</p>
        <button className="primary" type="button" onClick={() => beginCapture()}>Start camera <span aria-hidden="true">↗</span></button>
        <p className="privacy-note">No sign-up. No uploads. Just us.</p></div>
        <div className="booth-art" aria-hidden="true"><div className="souvenir-stamp">US, TODAY<br />♥<br />FOR KEEPS</div><div className="sample-strip"><div>☺</div><div>♥</div><div>✌</div><span>YOU + ME · RIGHT NOW</span></div><span className="art-caption">our little piece of today.</span></div>
      </section>
      <div className="ready-footer"><span>01 &nbsp; GET CLOSE</span><span>02 &nbsp; MAKE A MEMORY</span><span>03 &nbsp; KEEP IT FOREVER</span></div>
    </main>;
  }

  return <main className="capture-page">
    <BoothHeader stage="capture" />
    <div className="capture-heading"><p className="eyebrow">You look like my favorite memory</p><h1>{stage === "preview" ? "One to keep forever?" : "Come a little closer."}</h1></div>
    <p className="photo-progress">{isReplacingPhoto ? `Replacing photo ${(targetSlot ?? 0) + 1}` : `Photo ${(targetSlot ?? 0) + 1} / ${session.requiredPhotoCount}`}</p>
    {stage === "preview" && capturedPhoto ? <CapturedPhotoPreview photo={capturedPhoto} onRetake={handleCandidateRetake} onAccept={handleAccept} onBackToReview={isReplacingPhoto ? handleBackToReview : undefined} /> : <>
      {cameraError && <p className="capture-error" role="alert">{cameraError}</p>}
      {captureError && <p className="capture-error" role="alert">{captureError}</p>}
      {stream ? <>
        <div className="camera-container"><CameraPreview stream={stream} videoRef={videoRef} />{countdown !== null && <Countdown value={countdown} />}</div>
        <div className="capture-actions">
        {isReplacingPhoto ? <>
          <button className="capture-button primary" type="button" onClick={handleCapture} disabled={isCountingDown}>{isCountingDown ? "Get ready..." : "Take replacement"}</button>
          <button type="button" className="back-to-review" onClick={handleBackToReview} disabled={isCountingDown}>Back to review</button>
        </> : hasStartedSequence ? <p className="automatic-capture-status" role="status">{isCountingDown ? "Get ready..." : "Next photo starts in 1 second."}</p> : <button className="capture-button primary" type="button" onClick={handleCapture} disabled={isCountingDown}>Start photos</button>}
        </div>
      </> : !cameraError ? <p role="status">Starting camera...</p> : <button type="button" onClick={() => setStage("ready")}>Try again</button>}
    </>}
  </main>;
}
