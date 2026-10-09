import { afterEach, describe, expect, it, vi } from "vitest";
import { createPhotoSession, replaceSessionPhoto } from "../../types/photoSession";
import { getLayoutDefinition, type LayoutId } from "../editor/layoutDefinitions";
import { getCenterCoverCrop, getCompositionFilename, renderComposition } from "./compositionService";

afterEach(() => {
  vi.unstubAllGlobals();
});

function installCanvasMock() {
  const filterHistory: string[] = [];
  let activeFilter = "";
  const strokeRect = vi.fn();
  const context = {
    fillStyle: "",
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    strokeStyle: "",
    lineWidth: 0,
    strokeRect,
  } as unknown as CanvasRenderingContext2D;
  Object.defineProperty(context, "filter", {
    get: () => activeFilter,
    set: (value: string) => {
      activeFilter = value;
      filterHistory.push(value);
    },
  });
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    toBlob: (callback: BlobCallback) => callback(new Blob(["png"], { type: "image/png" })),
  } as unknown as HTMLCanvasElement;

  class FakeImage {
    naturalWidth = 1600;
    naturalHeight = 900;
    width = 1600;
    height = 900;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(_source: string) {
      this.onload?.();
    }
  }

  vi.stubGlobal("document", { createElement: vi.fn(() => canvas) });
  vi.stubGlobal("Image", FakeImage);
  return { canvas, context, filterHistory, strokeRect };
}

function createCompleteSession(layoutId: LayoutId) {
  let session = createPhotoSession();
  for (let slotIndex = 0; slotIndex < session.requiredPhotoCount; slotIndex += 1) {
    session = replaceSessionPhoto(session, { slotIndex, dataUrl: `photo-${slotIndex}`, capturedAt: slotIndex });
  }
  return { ...session, selectedLayoutId: layoutId };
}

describe("getCenterCoverCrop", () => {
  it("crops equally from the left and right for a landscape source in a square slot", () => {
    expect(getCenterCoverCrop({ width: 1600, height: 900 }, { width: 600, height: 600 })).toEqual({
      sourceX: 350,
      sourceY: 0,
      sourceWidth: 900,
      sourceHeight: 900,
    });
  });

  it("crops equally from the top and bottom for a portrait source in a square slot", () => {
    expect(getCenterCoverCrop({ width: 900, height: 1600 }, { width: 600, height: 600 })).toEqual({
      sourceX: 0,
      sourceY: 350,
      sourceWidth: 900,
      sourceHeight: 900,
    });
  });

  it("rejects invalid source or destination dimensions", () => {
    expect(() => getCenterCoverCrop({ width: 0, height: 900 }, { width: 600, height: 600 })).toThrow();
  });
});

describe("composition export", () => {
  it("uses a filename that identifies the selected layout", () => {
    expect(getCompositionFilename(createPhotoSession())).toBe("upsnap-grid-2x2.png");
  });

  it("rejects a composition when a selected photo is missing", async () => {
    let session = createPhotoSession();
    session = replaceSessionPhoto(session, { slotIndex: 0, dataUrl: "photo-0", capturedAt: 0 });

    await expect(renderComposition(session)).rejects.toThrow("missing photo");
  });

  it.each(["grid-2x2", "strip-1x4", "grid-2x3"] as const)("renders the exact slots for %s", async (layoutId) => {
    const { canvas, context } = installCanvasMock();
    const layout = getLayoutDefinition(layoutId);

    await expect(renderComposition(createCompleteSession(layoutId))).resolves.toBeInstanceOf(Blob);

    expect(canvas.width).toBe(layout.canvasWidth);
    expect(canvas.height).toBe(layout.canvasHeight);
    expect(context.fillStyle).toBe("#ffffff");
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, layout.canvasWidth, layout.canvasHeight);
    expect(context.drawImage).toHaveBeenCalledTimes(layout.capacity);
    expect(context.drawImage).toHaveBeenLastCalledWith(
      expect.anything(),
      350,
      0,
      900,
      900,
      layout.slots[layout.capacity - 1].x,
      layout.slots[layout.capacity - 1].y,
      600,
      600,
    );
  });

  it("paints the selected background, filters photos, and draws a frame after them", async () => {
    const { context, filterHistory, strokeRect } = installCanvasMock();
    const session = {
      ...createCompleteSession("grid-2x2"),
      selectedBackgroundId: "classic-red" as const,
      selectedFilterId: "vintage" as const,
      selectedFrameId: "black-border" as const,
    };

    await renderComposition(session);

    expect(context.fillStyle).toBe("#c92332");
    expect(filterHistory).toEqual(["sepia(.35) saturate(.78) contrast(.9) brightness(1.08)", "none"]);
    expect(context.strokeStyle).toBe("#151515");
    expect(context.lineWidth).toBe(22);
    expect(strokeRect).toHaveBeenCalledTimes(4);
    expect(strokeRect.mock.calls[0]).toEqual([59, 59, 578, 578]);
  });
});
