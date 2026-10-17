// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createPhotoSession } from "../types/photoSession";
import { renderComposition } from "../features/export/compositionService";
import { useCompositionPreview } from "./useCompositionPreview";

vi.mock("../features/export/compositionService", () => ({ renderComposition: vi.fn() }));
const renderMock = vi.mocked(renderComposition);
beforeEach(() => {
  renderMock.mockReset();
  let index = 0;
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => `blob:preview-${++index}`) });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});
afterEach(cleanup);

it("invalidates downloads immediately, ignores obsolete renders, and releases preview URLs", async () => {
  const first = new Blob(["first"]), newest = new Blob(["newest"]);
  let resolveOld!: (blob: Blob) => void;
  let resolveNew!: (blob: Blob) => void;
  renderMock.mockResolvedValueOnce(first)
    .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
    .mockImplementationOnce(() => new Promise((resolve) => { resolveNew = resolve; }));
  const session = createPhotoSession();
  const { result, rerender, unmount } = renderHook(({ value }) => useCompositionPreview(value), { initialProps: { value: session } });
  await waitFor(() => expect(result.current.blob).toBe(first));
  expect(URL.createObjectURL).toHaveBeenCalledWith(first);
  rerender({ value: { ...session, selectedTemplateId: "black" } });
  expect(result.current.blob).toBeNull();
  expect(result.current.isRendering).toBe(true);
  expect(result.current.url).toBe("blob:preview-1");
  rerender({ value: { ...session, selectedTemplateId: "classic-red" } });
  await act(async () => resolveNew(newest));
  expect(result.current.blob).toBe(newest);
  await act(async () => resolveOld(new Blob(["obsolete"])));
  expect(result.current.blob).toBe(newest);
  expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-2");
});

it("allows retry after failure and ignores work completed after unmount", async () => {
  renderMock.mockRejectedValueOnce(new Error("encode failed")).mockResolvedValueOnce(new Blob(["retry"]));
  const session = createPhotoSession();
  const { result, unmount } = renderHook(() => useCompositionPreview(session));
  await waitFor(() => expect(result.current.error).toContain("photos are safe"));
  expect(result.current.blob).toBeNull();
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.blob).not.toBeNull());
  unmount();
  let finish!: (blob: Blob) => void;
  renderMock.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const pending = renderHook(() => useCompositionPreview(session));
  pending.unmount();
  await act(async () => finish(new Blob(["too late"])));
  expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
});
