import { useEffect } from "react";
import type { RefObject } from "react";

import "./CameraPreview.css";

interface CameraPreviewProps {
  stream: MediaStream;
  videoRef: RefObject<HTMLVideoElement | null>;
}

export function CameraPreview({
  stream,
  videoRef,
}: CameraPreviewProps) {
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <video
      ref={videoRef}
      className="camera-preview"
      autoPlay
      playsInline
      muted
    />
  );
}