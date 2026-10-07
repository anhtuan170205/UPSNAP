import { CameraPreview } from "../features/camera/CameraPreview";
import { useCamera } from "../hooks/useCamera";

export function CapturePage() {
  const { stream, error } = useCamera();

  if (error) {
    return <p>{error}</p>;
  }

  if (!stream) {
    return <p>Starting camera...</p>;
  }

  return (
    <main>
      <h1>UPSNAP</h1>

      <CameraPreview stream={stream} />
    </main>
  );
}