import type { PhotoSession } from "../../types/photoSession";
import "./SessionReview.css";

interface SessionReviewProps {
  session: PhotoSession;
  onRetakePhoto: (slotIndex: number) => void;
  onRetakeAll: () => void;
  onContinue: () => void;
}

export function SessionReview({ session, onRetakePhoto, onRetakeAll, onContinue }: SessionReviewProps) {
  return (
    <section className="session-review" aria-labelledby="review-heading">
      <p className="stage-label">Session complete</p>
      <h2 id="review-heading">Review your {session.requiredPhotoCount} photos</h2>
      <p className="review-intro">Retake any photo you would like to replace before editing your set.</p>
      <div className="photo-review-grid">
        {session.photos.map((photo, slotIndex) => (
          <article className="review-photo-card" key={slotIndex}>
            <p className="slot-label">Photo {slotIndex + 1}</p>
            {photo ? <img src={photo.dataUrl} alt={`Captured photo ${slotIndex + 1}`} /> : <div className="missing-photo">Photo missing</div>}
            <button type="button" onClick={() => onRetakePhoto(slotIndex)}>Retake photo {slotIndex + 1}</button>
          </article>
        ))}
      </div>
      <div className="review-actions">
        <button type="button" className="secondary-action" onClick={onRetakeAll}>Retake all</button>
        <button type="button" onClick={onContinue}>Continue to edit</button>
      </div>
    </section>
  );
}
