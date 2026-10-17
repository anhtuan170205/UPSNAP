import { LAYOUT_DEFINITIONS, getLayoutDefinition, type LayoutId } from "../features/editor/layoutDefinitions";
import type { PresetId, TemplateId } from "../features/editor/styleDefinitions";
import { getStickerDefinition, type StickerId } from "../features/editor/stickerDefinitions";

export const MAX_STICKERS = 12;
const DEFAULT_STICKER_WIDTH = 0.18;
const MIN_STICKER_WIDTH = 0.06;

export interface CapturedPhoto {
  slotIndex: number;
  dataUrl: string;
  capturedAt: number;
}

export type LayoutPhotoSelections = Record<LayoutId, number[]>;

export interface StickerPlacement {
  id: string;
  stickerId: StickerId;
  x: number;
  y: number;
  width: number;
}

export interface PhotoSession {
  requiredPhotoCount: number;
  photos: Array<CapturedPhoto | null>;
  selectedLayoutId: LayoutId;
  layoutPhotoSelections: LayoutPhotoSelections;
  selectedPresetId: PresetId;
  selectedTemplateId: TemplateId;
  stickers: StickerPlacement[];
}

export const REQUIRED_PHOTO_COUNT = 8;

function createDefaultLayoutPhotoSelections(): LayoutPhotoSelections {
  return Object.fromEntries(
    LAYOUT_DEFINITIONS.map((layout) => [
      layout.id,
      Array.from({ length: layout.capacity }, (_, index) => index),
    ]),
  ) as LayoutPhotoSelections;
}

export function createPhotoSession(): PhotoSession {
  return {
    requiredPhotoCount: REQUIRED_PHOTO_COUNT,
    photos: Array.from({ length: REQUIRED_PHOTO_COUNT }, () => null),
    selectedLayoutId: "grid-2x2",
    layoutPhotoSelections: createDefaultLayoutPhotoSelections(),
    selectedPresetId: "normal",
    selectedTemplateId: "white",
    stickers: [],
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

export function selectSessionLayout(session: PhotoSession, layoutId: LayoutId): PhotoSession {
  return { ...session, selectedLayoutId: layoutId };
}

export function selectSessionPreset(session: PhotoSession, presetId: PresetId): PhotoSession {
  return { ...session, selectedPresetId: presetId };
}

export function selectSessionTemplate(session: PhotoSession, templateId: TemplateId): PhotoSession {
  return { ...session, selectedTemplateId: templateId };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function getClampedStickerPlacement(
  session: PhotoSession,
  stickerId: StickerId,
  placement: Pick<StickerPlacement, "x" | "y" | "width">,
): Pick<StickerPlacement, "x" | "y" | "width"> {
  const sticker = getStickerDefinition(stickerId);
  const layout = getLayoutDefinition(session.selectedLayoutId);
  const maxWidthForHeight = sticker.aspectRatio * (layout.canvasHeight / layout.canvasWidth) * 0.92;
  const width = clamp(placement.width, MIN_STICKER_WIDTH, Math.min(0.6, maxWidthForHeight));
  const halfHeight = (width / sticker.aspectRatio) * (layout.canvasWidth / layout.canvasHeight) / 2;
  return {
    width,
    x: clamp(placement.x, width / 2, 1 - width / 2),
    y: clamp(placement.y, halfHeight, 1 - halfHeight),
  };
}

function getNextStickerInstanceId(stickers: readonly StickerPlacement[]): string {
  let index = stickers.length + 1;
  while (stickers.some((sticker) => sticker.id === `sticker-${index}`)) index += 1;
  return `sticker-${index}`;
}

export function addSessionSticker(session: PhotoSession, stickerId: StickerId): PhotoSession {
  if (session.stickers.length >= MAX_STICKERS) return session;
  const offset = (session.stickers.length % 4) * 0.045;
  const placement = getClampedStickerPlacement(session, stickerId, {
    x: 0.5 + offset,
    y: 0.5 + offset,
    width: DEFAULT_STICKER_WIDTH,
  });
  return { ...session, stickers: [...session.stickers, { id: getNextStickerInstanceId(session.stickers), stickerId, ...placement }] };
}

export function updateSessionSticker(
  session: PhotoSession,
  instanceId: string,
  update: Partial<Pick<StickerPlacement, "x" | "y" | "width">>,
): PhotoSession {
  const existing = session.stickers.find((sticker) => sticker.id === instanceId);
  if (!existing) return session;
  const placement = getClampedStickerPlacement(session, existing.stickerId, { ...existing, ...update });
  return { ...session, stickers: session.stickers.map((sticker) => sticker.id === instanceId ? { ...sticker, ...placement } : sticker) };
}

export function removeSessionSticker(session: PhotoSession, instanceId: string): PhotoSession {
  const stickers = session.stickers.filter((sticker) => sticker.id !== instanceId);
  return stickers.length === session.stickers.length ? session : { ...session, stickers };
}

export function placeLayoutPhoto(
  session: PhotoSession,
  layoutSlotIndex: number,
  sourceSlotIndex: number,
): PhotoSession {
  const selection = session.layoutPhotoSelections[session.selectedLayoutId];
  const layout = getLayoutDefinition(session.selectedLayoutId);
  const existingLayoutSlotIndex = selection.indexOf(sourceSlotIndex);

  if (
    layoutSlotIndex < 0 ||
    layoutSlotIndex >= layout.capacity ||
    sourceSlotIndex < 0 ||
    sourceSlotIndex >= session.requiredPhotoCount
  ) {
    return session;
  }

  const nextSelection = [...selection];
  if (existingLayoutSlotIndex === -1) {
    nextSelection[layoutSlotIndex] = sourceSlotIndex;
  } else {
    [nextSelection[layoutSlotIndex], nextSelection[existingLayoutSlotIndex]] = [nextSelection[existingLayoutSlotIndex], nextSelection[layoutSlotIndex]];
  }
  return {
    ...session,
    layoutPhotoSelections: {
      ...session.layoutPhotoSelections,
      [session.selectedLayoutId]: nextSelection,
    },
  };
}

export function reorderLayoutPhotos(
  session: PhotoSession,
  fromLayoutSlotIndex: number,
  toLayoutSlotIndex: number,
): PhotoSession {
  const selection = session.layoutPhotoSelections[session.selectedLayoutId];

  if (
    fromLayoutSlotIndex < 0 ||
    fromLayoutSlotIndex >= selection.length ||
    toLayoutSlotIndex < 0 ||
    toLayoutSlotIndex >= selection.length ||
    fromLayoutSlotIndex === toLayoutSlotIndex
  ) {
    return session;
  }

  const nextSelection = [...selection];
  const [movedPhoto] = nextSelection.splice(fromLayoutSlotIndex, 1);
  nextSelection.splice(toLayoutSlotIndex, 0, movedPhoto);
  return {
    ...session,
    layoutPhotoSelections: {
      ...session.layoutPhotoSelections,
      [session.selectedLayoutId]: nextSelection,
    },
  };
}
