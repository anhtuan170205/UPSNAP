// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PhotoEditor } from "./PhotoEditor";
import { createPhotoSession, addSessionSticker } from "../../types/photoSession";
import { downloadPng, renderComposition } from "../export/compositionService";

vi.mock("../export/compositionService", () => ({ renderComposition: vi.fn(), downloadPng: vi.fn(), getCompositionFilename: () => "print.png" }));
const png = new Blob(["png"]);
function props() {
  const session = addSessionSticker(createPhotoSession(), "star");
  session.photos = session.photos.map((_, slotIndex) => ({ slotIndex, dataUrl: `data:image/png;base64,${slotIndex}`, capturedAt: slotIndex }));
  return { session, onBackToReview: vi.fn(), onLayoutChange: vi.fn(), onPresetChange: vi.fn(), onTemplateChange: vi.fn(), onAddSticker: vi.fn(), onUpdateSticker: vi.fn(), onRemoveSticker: vi.fn(), onPlaceLayoutPhoto: vi.fn(), onReorderLayoutPhotos: vi.fn(), onNewSession: vi.fn() };
}
beforeEach(() => {
  vi.mocked(renderComposition).mockReset().mockResolvedValue(png);
  vi.mocked(downloadPng).mockReset();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:print") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);

it("downloads the preview Blob and preserves photos after a download failure", async () => {
  const callbacks = props();
  render(<PhotoEditor {...callbacks} />);
  const download = await screen.findByRole("button", { name: "Download PNG ↓" });
  expect(screen.getByAltText("Final 2 × 2 grid composition")).toHaveAttribute("src", "blob:print");
  expect(URL.createObjectURL).toHaveBeenCalledWith(png);
  vi.mocked(downloadPng).mockImplementationOnce(() => { throw new Error("blocked"); });
  fireEvent.click(download);
  expect(screen.getByRole("alert")).toHaveTextContent("couldn’t start your download");
  expect(callbacks.onNewSession).not.toHaveBeenCalled();
  expect(screen.getAllByRole("button", { name: /Use photo/ })).toHaveLength(8);
  fireEvent.click(download);
  expect(downloadPng).toHaveBeenLastCalledWith(png, "print.png");
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByText(/Download started/)).toBeInTheDocument();
});

it("provides keyboard tabs, contextual sticker controls, and photo placement without dragging", async () => {
  const callbacks = props();
  render(<PhotoEditor {...callbacks} />);
  await screen.findByRole("button", { name: "Download PNG ↓" });
  fireEvent.click(screen.getByRole("button", { name: "Position 2, photo 2" }));
  fireEvent.click(screen.getByRole("button", { name: "Use photo 8 in position 2" }));
  expect(callbacks.onPlaceLayoutPhoto).toHaveBeenCalledWith(1, 7);
  const layoutTab = screen.getByRole("tab", { name: "Layout & photos" });
  fireEvent.keyDown(layoutTab, { key: "ArrowRight" });
  expect(screen.getByRole("tab", { name: "Style" })).toHaveFocus();
  expect(screen.queryByRole("button", { name: /Position 2/ })).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "Stickers" }));
  expect(screen.queryByRole("slider")).toBeNull();
  const sticker = screen.getByRole("button", { name: /Star sticker/ });
  fireEvent.focus(sticker);
  fireEvent.change(screen.getByRole("slider", { name: "Sticker size" }), { target: { value: ".3" } });
  expect(callbacks.onUpdateSticker).toHaveBeenCalledWith("sticker-1", { width: .3 });
  fireEvent.keyDown(sticker, { key: "ArrowRight" });
  expect(callbacks.onUpdateSticker).toHaveBeenLastCalledWith("sticker-1", { x: .52 });
  fireEvent.click(screen.getByRole("button", { name: "Remove sticker" }));
  expect(callbacks.onRemoveSticker).toHaveBeenCalledWith("sticker-1");
});

it("preserves drag reordering and confirms destructive new-session actions", async () => {
  const callbacks = props();
  render(<PhotoEditor {...callbacks} />);
  await screen.findByRole("button", { name: "Download PNG ↓" });
  fireEvent.drop(screen.getByRole("button", { name: "Position 3, photo 3" }), { dataTransfer: { getData: (type: string) => type.includes("layout-slot") ? "0" : "" } });
  expect(callbacks.onReorderLayoutPhotos).toHaveBeenCalledWith(0, 2);
  fireEvent.click(screen.getByText("More"));
  fireEvent.click(screen.getByRole("button", { name: "New session" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Keep photos" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(callbacks.onNewSession).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "New session" }));
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: true, cancelable: true }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
