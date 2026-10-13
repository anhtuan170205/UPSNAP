import type { PresetDefinition } from "./styleDefinitions";

type Rgb = readonly [number, number, number];

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function mix(color: Rgb, tint: Rgb, amount: number): Rgb {
  return [
    color[0] + (tint[0] - color[0]) * amount,
    color[1] + (tint[1] - color[1]) * amount,
    color[2] + (tint[2] - color[2]) * amount,
  ];
}

function applyToneCurve(value: number, points: PresetDefinition["toneCurve"]): number {
  if (!points) return value;
  const point = value * 255;
  for (let index = 1; index < points.length; index += 1) {
    const [previousX, previousY] = points[index - 1];
    const [nextX, nextY] = points[index];
    if (point <= nextX) {
      const progress = (point - previousX) / (nextX - previousX);
      return clamp((previousY + (nextY - previousY) * progress) / 255);
    }
  }
  return value;
}

function deterministicNoise(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

export function applyPresetToImageData(imageData: ImageData, preset: PresetDefinition, seed: number): void {
  const { data } = imageData;
  const exposure = 2 ** preset.exposure;

  for (let index = 0; index < data.length; index += 4) {
    let color: Rgb = [data[index] / 255, data[index + 1] / 255, data[index + 2] / 255];
    color = [clamp(color[0] * exposure), clamp(color[1] * exposure), clamp(color[2] * exposure)];
    color = [
      clamp((color[0] - .5) * preset.contrast + .5),
      clamp((color[1] - .5) * preset.contrast + .5),
      clamp((color[2] - .5) * preset.contrast + .5),
    ];

    const luminance = color[0] * .2126 + color[1] * .7152 + color[2] * .0722;
    if (preset.monochrome) {
      color = [luminance, luminance, luminance];
    } else {
      color = [
        clamp(luminance + (color[0] - luminance) * preset.saturation),
        clamp(luminance + (color[1] - luminance) * preset.saturation),
        clamp(luminance + (color[2] - luminance) * preset.saturation),
      ];
    }

    color = [applyToneCurve(color[0], preset.toneCurve), applyToneCurve(color[1], preset.toneCurve), applyToneCurve(color[2], preset.toneCurve)];
    if (!preset.monochrome && preset.shadowTint) color = mix(color, preset.shadowTint.color, (1 - luminance) ** 2 * preset.shadowTint.amount);
    if (!preset.monochrome && preset.highlightTint) color = mix(color, preset.highlightTint.color, luminance ** 2 * preset.highlightTint.amount);

    const grain = (deterministicNoise(seed + index) - .5) * preset.grain;
    data[index] = Math.round(clamp(color[0] + grain) * 255);
    data[index + 1] = Math.round(clamp(color[1] + grain) * 255);
    data[index + 2] = Math.round(clamp(color[2] + grain) * 255);
  }
}
