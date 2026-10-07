import "./CapturedPhotoPreview.css";

interface CapturedPhotoPreviewProps {
  photo: string;
  onRetake: () => void;
  onAccept: () => void;
  onBackToReview?: () => void;
}

export function CapturedPhotoPreview({
  photo,
  onRetake,
  onAccept,
  onBackToReview,
}: CapturedPhotoPreviewProps) {
  return (
    <div className="captured-photo-preview">
      <img src={photo} alt="Captured" />

      <div className="captured-photo-actions">
        {onBackToReview && <button type="button" onClick={onBackToReview}>Back to review</button>}
        <button onClick={onRetake}>
          Retake
        </button>

        <button onClick={onAccept}>
          Accept
        </button>
      </div>
    </div>
  );
}
