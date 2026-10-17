import type { PhotoSession } from "../../types/photoSession";
import { useState } from "react";
import "./SessionReview.css";

interface SessionReviewProps {
  session: PhotoSession;
  onRetakePhoto: (slotIndex: number) => void;
  onRetakeAll: () => void;
  onContinue: () => void;
}

export function SessionReview({ session, onRetakePhoto, onRetakeAll, onContinue }: SessionReviewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  return (
    <section className="session-review" aria-labelledby="review-heading">
      <div className="screen-heading"><div><p className="eyebrow">A few sweet little moments.</p>
      <h1 id="review-heading">Us, right here<span className="accent">.</span></h1>
      <p className="review-intro">Pick your favorites and let’s turn them into something to keep. Select any photo for a retake.</p></div>
      <details className="more-actions"><summary>More</summary><button onClick={onRetakeAll}>Retake all</button></details></div>
      <div className="photo-review-grid">
        {session.photos.map((photo, slotIndex) => (
          <button type="button" className="review-photo-card" key={slotIndex} aria-label={`Select photo ${slotIndex + 1}`} aria-pressed={selectedPhoto === slotIndex} onClick={() => setSelectedPhoto(slotIndex)}>
            {photo ? <img src={photo.dataUrl} alt={`Captured photo ${slotIndex + 1}`} /> : <div className="missing-photo">Photo missing</div>}
            <span className="slot-label">NO. {String(slotIndex + 1).padStart(2, "0")}<span>{selectedPhoto === slotIndex ? "SELECTED" : "US"}</span></span>
          </button>
        ))}
      </div>
      <div className="review-actions">
        <div>{selectedPhoto !== null ? <button type="button" onClick={() => onRetakePhoto(selectedPhoto)}>Retake photo {selectedPhoto + 1}</button> : <p className="tool-hint">{session.requiredPhotoCount} little memories, ready for your finishing touch.</p>}</div>
        <button type="button" className="primary" onClick={onContinue}>Customize <span aria-hidden="true">↗</span></button>
      </div>
    </section>
  );
}
