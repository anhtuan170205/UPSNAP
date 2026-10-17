// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createPhotoSession } from "../../types/photoSession";
import { SessionReview } from "./SessionReview";
afterEach(cleanup);
it("shows one contextual retake and retains Customize and Retake all", () => {
  const retake = vi.fn(), all = vi.fn(), next = vi.fn();
  render(<SessionReview session={createPhotoSession()} onRetakePhoto={retake} onRetakeAll={all} onContinue={next} />);
  expect(screen.queryByRole("button", { name: /Retake photo/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Select photo 3" }));
  fireEvent.click(screen.getByRole("button", { name: "Select photo 6" }));
  expect(screen.getAllByRole("button", { name: /Retake photo/ })).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Retake photo 6" }));
  expect(retake).toHaveBeenCalledWith(5);
  fireEvent.click(screen.getByRole("button", { name: /Customize/ }));
  expect(next).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByText("More"));
  fireEvent.click(screen.getByRole("button", { name: "Retake all" }));
  expect(all).toHaveBeenCalledOnce();
});
