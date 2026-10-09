import { describe, expect, it } from "vitest";
import { getLayoutDefinition } from "../features/editor/layoutDefinitions";
import { createPhotoSession, isSessionComplete, placeLayoutPhoto, reorderLayoutPhotos, replaceSessionPhoto, selectSessionBackground, selectSessionFilter, selectSessionFrame, selectSessionLayout } from "./photoSession";

describe("photo sessions", () => {
  it("creates an eight-photo session with default selections for every layout", () => {
    const session = createPhotoSession();

    expect(session.requiredPhotoCount).toBe(8);
    expect(session.photos).toHaveLength(8);
    expect(session.selectedLayoutId).toBe("grid-2x2");
    expect(session.selectedFilterId).toBe("normal");
    expect(session.selectedBackgroundId).toBe("white");
    expect(session.selectedFrameId).toBe("none");
    expect(session.layoutPhotoSelections["grid-2x2"]).toEqual([0, 1, 2, 3]);
    expect(session.layoutPhotoSelections["strip-1x4"]).toEqual([0, 1, 2, 3]);
    expect(session.layoutPhotoSelections["grid-2x3"]).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("only completes after eight accepted photos", () => {
    let session = createPhotoSession();
    for (let slotIndex = 0; slotIndex < 7; slotIndex += 1) {
      session = replaceSessionPhoto(session, { slotIndex, dataUrl: `photo-${slotIndex}`, capturedAt: slotIndex });
    }
    expect(isSessionComplete(session)).toBe(false);

    session = replaceSessionPhoto(session, { slotIndex: 7, dataUrl: "photo-7", capturedAt: 7 });
    expect(isSessionComplete(session)).toBe(true);
  });

  it("keeps each layout selection independent and swaps already-selected tray photos", () => {
    let session = createPhotoSession();
    session = placeLayoutPhoto(session, 0, 6);
    session = selectSessionLayout(session, "grid-2x3");
    session = placeLayoutPhoto(session, 5, 7);
    session = placeLayoutPhoto(session, 1, 7);

    expect(session.layoutPhotoSelections["grid-2x2"]).toEqual([6, 1, 2, 3]);
    expect(session.layoutPhotoSelections["grid-2x3"]).toEqual([0, 7, 2, 3, 4, 1]);
  });

  it("moves a dragged photo to its dropped position and preserves all selected photos", () => {
    const session = reorderLayoutPhotos(createPhotoSession(), 0, 3);

    expect(session.layoutPhotoSelections["grid-2x2"]).toEqual([1, 2, 3, 0]);
    expect(session.photos).toEqual(Array.from({ length: 8 }, () => null));
  });

  it("updates global composition styles without changing layout or photos", () => {
    const original = createPhotoSession();
    const styled = selectSessionFrame(
      selectSessionBackground(selectSessionFilter(original, "vintage"), "classic-red"),
      "black-border",
    );

    expect(styled).toMatchObject({
      selectedFilterId: "vintage",
      selectedBackgroundId: "classic-red",
      selectedFrameId: "black-border",
      selectedLayoutId: "grid-2x2",
    });
    expect(styled.photos).toBe(original.photos);
    expect(original.selectedFilterId).toBe("normal");
  });
});

describe("layout definitions", () => {
  it("derives deterministic canvas geometry for each layout", () => {
    const grid = getLayoutDefinition("grid-2x2");
    const strip = getLayoutDefinition("strip-1x4");
    const sixPhotoGrid = getLayoutDefinition("grid-2x3");

    expect(grid.canvasWidth).toBe(1320);
    expect(grid.canvasHeight).toBe(1320);
    expect(strip.canvasWidth).toBe(696);
    expect(strip.canvasHeight).toBe(2568);
    expect(sixPhotoGrid.slots[5]).toMatchObject({ x: 672, y: 1296, width: 600, height: 600 });
  });
});
