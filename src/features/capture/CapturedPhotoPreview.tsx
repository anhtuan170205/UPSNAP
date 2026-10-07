import "./CapturedPhotoPreview.css";

interface CapturedPhotoPreviewProps {
  photo: string;
  onRetake: () => void;
  onAccept: () => void;
}

export function CapturedPhotoPreview({
  photo,
  onRetake,
  onAccept,
}: CapturedPhotoPreviewProps) {
  return (
    <div className="captured-photo-preview">
      <img src={photo} alt="Captured" />

      <div className="captured-photo-actions">
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