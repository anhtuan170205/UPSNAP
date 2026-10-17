export type PresetId = "normal" | "kodak-portra-400" | "kodak-gold-200" | "fujifilm-classic-chrome" | "ilford-hp5-plus" | "cinestill-800t" | "golden-hour" | "soft-matte" | "teal-and-orange" | "moody-forest" | "dreamy-pastel" | "clean-bright" | "desert-sun" | "faded-film" | "high-contrast-bw" | "noir";
export type TemplateId = "white" | "black" | "classic-red" | "stripe";

export interface PresetDefinition {
  id: PresetId;
  label: string;
  source: string | null;
  exposure: number;
  contrast: number;
  saturation: number;
  monochrome?: boolean;
  shadowTint?: { color: readonly [number, number, number]; amount: number };
  highlightTint?: { color: readonly [number, number, number]; amount: number };
  toneCurve?: readonly (readonly [number, number])[];
  grain: number;
}

export interface TemplateDefinition {
  id: TemplateId;
  label: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  stripeColor?: string;
  stripeWidth?: number;
}

export const PRESET_DEFINITIONS = [
  { id: "normal", label: "Normal", source: null, exposure: 0, contrast: 1, saturation: 1, grain: 0 },
  { id: "kodak-portra-400", label: "Kodak Portra 400", source: "Color-Negative/Kodak Portra 400.xmp", exposure: .18, contrast: .95, saturation: .92, shadowTint: { color: [.36, .62, .82], amount: .08 }, highlightTint: { color: [1, .72, .46], amount: .12 }, grain: .025 },
  { id: "kodak-gold-200", label: "Kodak Gold 200", source: "Color-Negative/Kodak Gold 200.xmp", exposure: .08, contrast: .9, saturation: 1.06, shadowTint: { color: [.34, .62, .82], amount: .12 }, highlightTint: { color: [1, .68, .28], amount: .16 }, grain: .032 },
  { id: "fujifilm-classic-chrome", label: "Fujifilm Classic Chrome", source: "Color-Negative/Fujifilm Classic Chrome.xmp", exposure: 0, contrast: 1.12, saturation: .8, shadowTint: { color: [.28, .55, .72], amount: .08 }, highlightTint: { color: [1, .72, .48], amount: .045 }, grain: .02 },
  { id: "ilford-hp5-plus", label: "Ilford HP5 Plus", source: "Black-White/Ilford HP5 Plus.xmp", exposure: .04, contrast: 1.08, saturation: 0, monochrome: true, grain: .04 },
  { id: "cinestill-800t", label: "CineStill 800T", source: "Creative/Cinestill 800T.xmp", exposure: .2, contrast: 1.1, saturation: .94, shadowTint: { color: [.12, .48, .78], amount: .22 }, highlightTint: { color: [1, .48, .22], amount: .11 }, toneCurve: [[0, 20], [64, 55], [128, 128], [192, 196], [255, 235]], grain: .045 },
  { id: "golden-hour", label: "Golden Hour", source: "Creative/Golden Hour.xmp", exposure: .16, contrast: .92, saturation: 1.08, shadowTint: { color: [.4, .55, .7], amount: .06 }, highlightTint: { color: [1, .62, .24], amount: .2 }, grain: .018 },
  { id: "soft-matte", label: "Soft Matte", source: "Creative/Soft Matte.xmp", exposure: .1, contrast: .82, saturation: .86, toneCurve: [[0, 22], [64, 72], [128, 136], [192, 194], [255, 242]], grain: .028 },
  { id: "teal-and-orange", label: "Teal & Orange", source: "Creative/Teal and Orange.xmp", exposure: .05, contrast: 1.14, saturation: 1.04, shadowTint: { color: [.08, .55, .62], amount: .18 }, highlightTint: { color: [1, .42, .12], amount: .15 }, grain: .016 },
  { id: "moody-forest", label: "Moody Forest", source: "Creative/Moody Forest.xmp", exposure: -.18, contrast: 1.12, saturation: .74, shadowTint: { color: [.12, .32, .24], amount: .2 }, highlightTint: { color: [.78, .68, .38], amount: .07 }, toneCurve: [[0, 12], [64, 48], [128, 122], [192, 190], [255, 238]], grain: .024 },
  { id: "dreamy-pastel", label: "Dreamy Pastel", source: "Creative/Dreamy Pastel.xmp", exposure: .22, contrast: .78, saturation: .78, shadowTint: { color: [.6, .72, 1], amount: .12 }, highlightTint: { color: [1, .68, .76], amount: .12 }, grain: .012 },
  { id: "clean-bright", label: "Clean & Bright", source: "Creative/Clean and Bright.xmp", exposure: .3, contrast: .94, saturation: .96, highlightTint: { color: [1, .94, .82], amount: .05 }, grain: 0 },
  { id: "desert-sun", label: "Desert Sun", source: "Creative/Desert Sun.xmp", exposure: .08, contrast: 1.02, saturation: .9, shadowTint: { color: [.32, .54, .58], amount: .1 }, highlightTint: { color: [1, .56, .26], amount: .18 }, toneCurve: [[0, 10], [64, 60], [128, 134], [192, 202], [255, 246]], grain: .02 },
  { id: "faded-film", label: "Faded Film", source: "Creative/Faded Film.xmp", exposure: -.04, contrast: .84, saturation: .72, toneCurve: [[0, 28], [64, 77], [128, 137], [192, 192], [255, 235]], grain: .05 },
  { id: "high-contrast-bw", label: "High Contrast B&W", source: "Black-White/High Contrast B&W.xmp", exposure: .02, contrast: 1.32, saturation: 0, monochrome: true, toneCurve: [[0, 0], [64, 40], [128, 132], [192, 220], [255, 255]], grain: .018 },
  { id: "noir", label: "Noir", source: "Black-White/Noir.xmp", exposure: -.12, contrast: 1.2, saturation: 0, monochrome: true, toneCurve: [[0, 5], [64, 42], [128, 118], [192, 202], [255, 246]], grain: .055 },
] as const satisfies readonly PresetDefinition[];

export const TEMPLATE_DEFINITIONS = [
  { id: "white", label: "White", backgroundColor: "#ffffff", borderColor: "#ffffff", borderWidth: 22 },
  { id: "black", label: "Black", backgroundColor: "#151515", borderColor: "#151515", borderWidth: 22 },
  { id: "classic-red", label: "Classic Red", backgroundColor: "#c92332", borderColor: "#c92332", borderWidth: 22 },
  { id: "stripe", label: "Stripe", backgroundColor: "#151515", borderColor: "#ffffff", borderWidth: 22, stripeColor: "#ffffff", stripeWidth: 48 },
] as const satisfies readonly TemplateDefinition[];

function getDefinition<T extends { id: string }>(definitions: readonly T[], id: T["id"], kind: string): T {
  const definition = definitions.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown ${kind}: ${id}`);
  return definition;
}

export function getPresetDefinition(id: PresetId): PresetDefinition {
  return getDefinition(PRESET_DEFINITIONS, id, "preset");
}

export function getTemplateDefinition(id: TemplateId): TemplateDefinition {
  return getDefinition(TEMPLATE_DEFINITIONS, id, "template");
}
