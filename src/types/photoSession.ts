export interface CapturedPhoto {
  slotIndex: number;
  dataUrl: string;
  capturedAt: number;
}

export interface PhotoSession {
  requiredPhotoCount: number;
  photos: Array<CapturedPhoto | null>;
}

export const REQUIRED_PHOTO_COUNT = 4;

export function createPhotoSession(): PhotoSession {
  return {
    requiredPhotoCount: REQUIRED_PHOTO_COUNT,
    photos: Array.from({ length: REQUIRED_PHOTO_COUNT }, () => null),
  };
}

export function getNextEmptySlot(session: PhotoSession): number | null {
  const index = session.photos.findIndex((photo) => photo === null);
  return index === -1 ? null : index;
}

export function isSessionComplete(session: PhotoSession): boolean {
  return session.photos.every((photo) => photo !== null);
}

export function replaceSessionPhoto(
  session: PhotoSession,
  photo: CapturedPhoto,
): PhotoSession {
  const photos = [...session.photos];
  photos[photo.slotIndex] = photo;
  return { ...session, photos };
}
