import { getLayoutDefinition } from "../editor/layoutDefinitions";
import { applyPresetToImageData } from "../editor/presetProcessing";
import { getPresetDefinition, getTemplateDefinition, type TemplateDefinition } from "../editor/styleDefinitions";
import { getStickerDefinition } from "../editor/stickerDefinitions";
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

function paintTemplateBackground(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  template: TemplateDefinition,
): void {
  context.fillStyle = template.backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (!template.stripeColor || !template.stripeWidth) return;

  const diagonal = Math.hypot(canvas.width, canvas.height);
  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(-Math.PI / 4);
  context.fillStyle = template.stripeColor;
  for (let offset = -diagonal; offset < diagonal; offset += template.stripeWidth * 2) {
    context.fillRect(offset, -diagonal, template.stripeWidth, diagonal * 2);
  }
  context.restore();
}

export async function renderComposition(session: PhotoSession): Promise<Blob> {
  const layout = getLayoutDefinition(session.selectedLayoutId);
  const template = getTemplateDefinition(session.selectedTemplateId);
  const preset = getPresetDefinition(session.selectedPresetId);
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
  const stickerImages = await Promise.all(session.stickers.map(async (sticker) => ({
    sticker,
    image: await loadImage(getStickerDefinition(sticker.stickerId).src),
  })));
  const canvas = document.createElement("canvas");
  canvas.width = layout.canvasWidth;
  canvas.height = layout.canvasHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not create the final image.");
  }

  paintTemplateBackground(context, canvas, template);

  images.forEach((image, index) => {
    const slot = layout.slots[index];
    const sourcePhoto = selectedPhotos[index];
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
    const imageData = context.getImageData(slot.x, slot.y, slot.width, slot.height);
    applyPresetToImageData(imageData, preset, sourcePhoto.capturedAt + slot.index * 7919);
    context.putImageData(imageData, slot.x, slot.y);
  });

  if (template.borderWidth > 0) {
    context.strokeStyle = template.borderColor;
    context.lineWidth = template.borderWidth;
    layout.slots.forEach((slot) => {
      const inset = template.borderWidth / 2;
      context.strokeRect(slot.x + inset, slot.y + inset, slot.width - template.borderWidth, slot.height - template.borderWidth);
    });
  }

  stickerImages.forEach(({ sticker, image }) => {
    const definition = getStickerDefinition(sticker.stickerId);
    const width = sticker.width * canvas.width;
    const height = width / definition.aspectRatio;
    context.drawImage(image, sticker.x * canvas.width - width / 2, sticker.y * canvas.height - height / 2, width, height);
  });

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
  try {
    link.click();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
