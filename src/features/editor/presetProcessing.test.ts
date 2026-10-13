import { describe, expect, it } from "vitest";
import { applyPresetToImageData } from "./presetProcessing";
import { getPresetDefinition } from "./styleDefinitions";

function imageDataWithPixel(red: number, green: number, blue: number): ImageData {
  return { data: new Uint8ClampedArray([red, green, blue, 255]), width: 1, height: 1 } as ImageData;
}

describe("repository-derived preset processing", () => {
  it("leaves a Normal pixel unchanged", () => {
    const imageData = imageDataWithPixel(40, 120, 200);
    applyPresetToImageData(imageData, getPresetDefinition("normal"), 1);
    expect([...imageData.data]).toEqual([40, 120, 200, 255]);
  });

  it("converts Ilford HP5 Plus to monochrome and keeps the result deterministic", () => {
    const first = imageDataWithPixel(40, 120, 200);
    const second = imageDataWithPixel(40, 120, 200);
    const preset = getPresetDefinition("ilford-hp5-plus");
    applyPresetToImageData(first, preset, 42);
    applyPresetToImageData(second, preset, 42);
    expect(first.data[0]).toBe(first.data[1]);
    expect(first.data[1]).toBe(first.data[2]);
    expect([...first.data]).toEqual([...second.data]);
  });

  it("gives CineStill 800T cool shadows and warm highlights without hue rotation", () => {
    const preset = getPresetDefinition("cinestill-800t");
    expect(preset.shadowTint).toEqual({ color: [.12, .48, .78], amount: .22 });
    expect(preset.highlightTint).toEqual({ color: [1, .48, .22], amount: .11 });
    expect(JSON.stringify(preset)).not.toContain("hue-rotate");
  });
});
