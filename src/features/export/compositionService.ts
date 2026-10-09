import { getLayoutDefinition } from "../editor/layoutDefinitions";
import { getBackgroundDefinition, getFilterDefinition, getFrameDefinition } from "../editor/styleDefinitions";
import type { PhotoSession } from "../../types/photoSession";

interface SourceDimensions {
  width: number;
  height: number;
}

export interface CoverCrop {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
}

export function getCenterCoverCrop(
  source: SourceDimensions,
  destination: SourceDimensions,
): CoverCrop {
  if (source.width <= 0 || source.height <= 0 || destination.width <= 0 || destination.height <= 0) {
    throw new Error("Image dimensions must be greater than zero.");
  }

  const sourceAspectRatio = source.width / source.height;
  const destinationAspectRatio = destination.width / destination.height;

  if (sourceAspectRatio > destinationAspectRatio) {
    const sourceWidth = source.height * destinationAspectRatio;
    return {
      sourceX: (source.width - sourceWidth) / 2,
      sourceY: 0,
      sourceWidth,
      sourceHeight: source.height,
    };
  }

  const sourceHeight = source.width / destinationAspectRatio;
  return {
    sourceX: 0,
    sourceY: (source.height - sourceHeight) / 2,
    sourceWidth: source.width,
    sourceHeight,
  };
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("A selected photo could not be loaded."));
    image.src = source;
  });
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("The final image could not be encoded as a PNG."));
      }
    }, "image/png");
  });
}

export async function renderComposition(session: PhotoSession): Promise<Blob> {
  const layout = getLayoutDefinition(session.selectedLayoutId);
  const background = getBackgroundDefinition(session.selectedBackgroundId);
  const filter = getFilterDefinition(session.selectedFilterId);
  const frame = getFrameDefinition(session.selectedFrameId);
  const selection = session.layoutPhotoSelections[layout.id];

  if (selection.length !== layout.capacity) {
    throw new Error("The selected layout is incomplete.");
  }

  const selectedPhotos = selection.map((sourceSlotIndex) => {
    const photo = session.photos[sourceSlotIndex];
    if (!photo) {
      throw new Error("The selected layout contains a missing photo.");
    }
    return photo;
  });
  const images = await Promise.all(selectedPhotos.map((photo) => loadImage(photo.dataUrl)));
  const canvas = document.createElement("canvas");
  canvas.width = layout.canvasWidth;
  canvas.height = layout.canvasHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not create the final image.");
  }

  context.fillStyle = background.color;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.filter = filter.canvasFilter;
  images.forEach((image, index) => {
    const slot = layout.slots[index];
    const crop = getCenterCoverCrop(
      { width: image.naturalWidth || image.width, height: image.naturalHeight || image.height },
      { width: slot.width, height: slot.height },
    );
    context.drawImage(
      image,
      crop.sourceX,
      crop.sourceY,
      crop.sourceWidth,
      crop.sourceHeight,
      slot.x,
      slot.y,
      slot.width,
      slot.height,
    );
  });
  context.filter = "none";

  if (frame.color && frame.width > 0) {
    context.strokeStyle = frame.color;
    context.lineWidth = frame.width;
    layout.slots.forEach((slot) => {
      const inset = frame.width / 2;
      context.strokeRect(slot.x + inset, slot.y + inset, slot.width - frame.width, slot.height - frame.width);
    });
  }

  return canvasToPng(canvas);
}

export function getCompositionFilename(session: PhotoSession): string {
  return `upsnap-${session.selectedLayoutId}.png`;
}

export function downloadPng(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
