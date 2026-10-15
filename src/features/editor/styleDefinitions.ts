export type PresetId = "normal" | "kodak-portra-400" | "kodak-gold-200" | "fujifilm-classic-chrome" | "ilford-hp5-plus" | "cinestill-800t";
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
