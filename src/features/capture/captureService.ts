export function capturePhoto(video: HTMLVideoElement): string {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    throw new Error("Camera is not ready.");
  }

  const canvas = document.createElement("canvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  context.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/png");
}