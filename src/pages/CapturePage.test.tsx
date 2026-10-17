// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CapturePage } from "./CapturePage";
import { capturePhoto } from "../features/capture/captureService";
import { startCamera, stopCamera } from "../features/camera/cameraService";

vi.mock("../features/camera/cameraService", () => ({ startCamera: vi.fn(), stopCamera: vi.fn() }));
vi.mock("../features/capture/captureService", () => ({ capturePhoto: vi.fn() }));
vi.mock("../features/export/compositionService", () => ({ renderComposition: vi.fn().mockResolvedValue(new Blob(["png"])), downloadPng: vi.fn(), getCompositionFilename: () => "print.png" }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(startCamera).mockReset().mockImplementation(async () => {
    const track = { readyState: "live" };
    return { getTracks: () => [track] } as unknown as MediaStream;
  });
  vi.mocked(stopCamera).mockReset();
  let photo = 0;
  vi.mocked(capturePhoto).mockReset().mockImplementation(() => `data:image/png;base64,photo${++photo}`);
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:print") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
async function click(name: string | RegExp) {
  await act(async () => { fireEvent.click(screen.getByRole("button", { name })); });
}
async function advance(ms: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

it("completes capture → review → editor; retakes preserve other slots and streams stop", async () => {
  render(<CapturePage />);
  expect(startCamera).not.toHaveBeenCalled();
  await click(/Start camera/);
  expect(startCamera).toHaveBeenCalledOnce();
  await click("Start photos");
  for (let index = 0; index < 8; index += 1) {
    if (index > 0) await advance(1000);
    await advance(3000);
  }
  expect(screen.getByRole("heading", { name: "Us, right here." })).toBeInTheDocument();
  expect(stopCamera).toHaveBeenCalledOnce();
  const original = screen.getByAltText("Captured photo 1").getAttribute("src");
  const untouched = screen.getByAltText("Captured photo 2").getAttribute("src");
  await click("Select photo 1");
  await click("Retake photo 1");
  await click("Take replacement");
  await advance(3000);
  expect(stopCamera).toHaveBeenCalledTimes(2);
  await click("Back to review");
  expect(screen.getByAltText("Captured photo 1")).toHaveAttribute("src", original);
  await click("Select photo 1");
  await click("Retake photo 1");
  await click("Take replacement");
  await advance(3000);
  await click("Use photo");
  expect(screen.getByAltText("Captured photo 1")).not.toHaveAttribute("src", original);
  expect(screen.getByAltText("Captured photo 2")).toHaveAttribute("src", untouched);
  await click(/Customize/);
  expect(screen.getByRole("heading", { name: "Make it yours." })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Download PNG ↓" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: /Preview final/ })).toBeNull();
  fireEvent.click(screen.getByText("More"));
  await click("New session");
  await click("Keep photos");
  await click("← Back to review");
  expect(screen.getByAltText("Captured photo 2")).toHaveAttribute("src", untouched);
});

it("stops the camera when capture unmounts", async () => {
  const { unmount } = render(<CapturePage />);
  await click(/Start camera/);
  unmount();
  expect(stopCamera).toHaveBeenCalledOnce();
});
