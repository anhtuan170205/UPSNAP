import { afterEach, describe, expect, it, vi } from "vitest";
import { addSessionSticker, createPhotoSession, replaceSessionPhoto, updateSessionSticker } from "../../types/photoSession";
import { getLayoutDefinition, type LayoutId } from "../editor/layoutDefinitions";
import { downloadPng, getCenterCoverCrop, getCompositionFilename, renderComposition } from "./compositionService";

afterEach(() => {
  vi.unstubAllGlobals();
});

function installCanvasMock() {
  const strokeRect = vi.fn();
  const drawImage = vi.fn();
  const getImageData = vi.fn(() => ({ data: new Uint8ClampedArray(600 * 600 * 4) }) as ImageData);
  const putImageData = vi.fn();
  const context = {
    fillStyle: "",
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage,
    strokeStyle: "",
    lineWidth: 0,
    strokeRect,
    getImageData,
    putImageData,
  } as unknown as CanvasRenderingContext2D;
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
  return { canvas, context, drawImage, getImageData, putImageData, strokeRect };
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
  it("cleans up the download URL even when the browser rejects the download", () => {
    const revokeObjectURL = vi.fn();
    const schedule = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:download", revokeObjectURL });
    vi.stubGlobal("window", { setTimeout: schedule });
    vi.stubGlobal("document", { createElement: () => ({ click: () => { throw new Error("blocked"); } }) });
    expect(() => downloadPng(new Blob(["png"]), "print.png")).toThrow("blocked");
    expect(schedule).toHaveBeenCalledWith(expect.any(Function), 0);
    schedule.mock.calls[0][0]();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:download");
  });
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

  it("paints the selected template, adapts photo pixels, and draws its border after them", async () => {
    const { context, getImageData, putImageData, strokeRect } = installCanvasMock();
    const session = {
      ...createCompleteSession("grid-2x2"),
      selectedPresetId: "cinestill-800t" as const,
      selectedTemplateId: "classic-red" as const,
    };

    await renderComposition(session);

    expect(context.fillStyle).toBe("#c92332");
    expect(getImageData).toHaveBeenCalledTimes(4);
    expect(putImageData).toHaveBeenCalledTimes(4);
    expect(context.strokeStyle).toBe("#c92332");
    expect(context.lineWidth).toBe(22);
    expect(strokeRect).toHaveBeenCalledTimes(4);
    expect(strokeRect.mock.calls[0]).toEqual([59, 59, 578, 578]);
  });

  it("draws deterministic diagonal stripes for the stripe template", async () => {
    const { canvas, context } = installCanvasMock();
    const session = { ...createCompleteSession("grid-2x2"), selectedTemplateId: "stripe" as const };

    await renderComposition(session);

    expect(context.fillRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    expect(context.save).toHaveBeenCalledOnce();
    expect(context.translate).toHaveBeenCalledWith(canvas.width / 2, canvas.height / 2);
    expect(context.rotate).toHaveBeenCalledWith(-Math.PI / 4);
    expect(context.restore).toHaveBeenCalledOnce();
    expect(context.strokeStyle).toBe("#ffffff");
  });

  it("draws session stickers after photo borders using normalized placement", async () => {
    const { drawImage, strokeRect } = installCanvasMock();
    let session = addSessionSticker(createCompleteSession("grid-2x2"), "heart");
    session = updateSessionSticker(session, "sticker-1", { x: 0.5, y: 0.5, width: 0.2 });

    await renderComposition(session);

    expect(drawImage).toHaveBeenCalledTimes(5);
    expect(drawImage).toHaveBeenLastCalledWith(expect.anything(), 528, 528, 264, 264);
    expect(strokeRect.mock.invocationCallOrder[3]).toBeLessThan(drawImage.mock.invocationCallOrder[4]);
  });
});
