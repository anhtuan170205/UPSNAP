import { LAYOUT_DEFINITIONS, getLayoutDefinition, type LayoutId } from "../features/editor/layoutDefinitions";
import type { BackgroundId, FilterId, FrameId } from "../features/editor/styleDefinitions";

export interface CapturedPhoto {
  slotIndex: number;
  dataUrl: string;
  capturedAt: number;
}

export type LayoutPhotoSelections = Record<LayoutId, number[]>;

export interface PhotoSession {
  requiredPhotoCount: number;
  photos: Array<CapturedPhoto | null>;
  selectedLayoutId: LayoutId;
  layoutPhotoSelections: LayoutPhotoSelections;
  selectedFilterId: FilterId;
  selectedBackgroundId: BackgroundId;
  selectedFrameId: FrameId;
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
    selectedFilterId: "normal",
    selectedBackgroundId: "white",
    selectedFrameId: "none",
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

export function selectSessionFilter(session: PhotoSession, filterId: FilterId): PhotoSession {
  return { ...session, selectedFilterId: filterId };
}

export function selectSessionBackground(session: PhotoSession, backgroundId: BackgroundId): PhotoSession {
  return { ...session, selectedBackgroundId: backgroundId };
}

export function selectSessionFrame(session: PhotoSession, frameId: FrameId): PhotoSession {
  return { ...session, selectedFrameId: frameId };
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
