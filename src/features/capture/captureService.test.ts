// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";

import { capturePhoto } from "./captureService";

afterEach(() => {
  vi.restoreAllMocks();
});

it("mirrors the captured pixels to match the live preview", () => {
  const canvas = document.createElement("canvas");
  const context = {
    drawImage: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  vi.spyOn(canvas, "getContext").mockReturnValue(context);
  vi.spyOn(canvas, "toDataURL").mockReturnValue("data:image/png;base64,mirrored");
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(
    ((tagName: string) => tagName === "canvas" ? canvas : originalCreateElement(tagName)) as typeof document.createElement,
  );

  const result = capturePhoto({ videoHeight: 480, videoWidth: 640 } as HTMLVideoElement);

  expect(context.translate).toHaveBeenCalledWith(640, 0);
  expect(context.scale).toHaveBeenCalledWith(-1, 1);
  expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 640, 480);
  expect(context.restore).toHaveBeenCalledOnce();
  expect(result).toBe("data:image/png;base64,mirrored");
});
