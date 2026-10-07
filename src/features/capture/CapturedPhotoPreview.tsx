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
    <div>
      <img
        src={photo}
        alt="Captured"
      />

      <div>
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