import { useEffect, useState } from "react";
import type { PhotoSession } from "../../types/photoSession";
import { downloadPng, getCompositionFilename, renderComposition } from "./compositionService";
import "./FinalPreview.css";

interface FinalPreviewProps {
  session: PhotoSession;
  onBackToEditor: () => void;
  onNewSession: () => void;
}

export function FinalPreview({ session, onBackToEditor, onNewSession }: FinalPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [png, setPng] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    let createdUrl: string | null = null;

    void renderComposition(session)
      .then((blob) => {
        if (!isCurrent) return;
        createdUrl = URL.createObjectURL(blob);
        setPng(blob);
        setPreviewUrl(createdUrl);
        setError(null);
      })
      .catch(() => {
        if (isCurrent) {
          setError("We could not create the final image. Your photos are still available to edit.");
        }
      });

    return () => {
      isCurrent = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [session]);

  function handleDownload() {
    if (!png) return;
    try {
      downloadPng(png, getCompositionFilename(session));
    } catch {
      setError("We could not start your download. Please try again.");
    }
  }

  return (
    <section className="final-preview" aria-labelledby="final-preview-heading">
      <p className="stage-label">Final preview</p>
      <h2 id="final-preview-heading">Your composition is ready</h2>
      <p>This is the exact PNG that will be downloaded.</p>
      {error && <p className="final-preview__error" role="alert">{error}</p>}
      {previewUrl ? <img className="final-preview__image" src={previewUrl} alt={`Final ${session.selectedLayoutId} composition`} /> : !error && <p role="status">Rendering your final image...</p>}
      <div className="final-preview__actions">
        <button type="button" onClick={onBackToEditor}>Back to edit</button>
        <button type="button" onClick={handleDownload} disabled={!png}>Download PNG</button>
        <button type="button" className="secondary-action" onClick={onNewSession}>New session</button>
      </div>
    </section>
  );
}
