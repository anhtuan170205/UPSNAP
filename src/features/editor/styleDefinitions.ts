export type FilterId = "normal" | "black-and-white" | "warm" | "cool" | "vintage";
export type BackgroundId = "white" | "black" | "classic-red";
export type FrameId = "none" | "white-border" | "black-border" | "red-border";

export interface FilterDefinition {
  id: FilterId;
  label: string;
  canvasFilter: string;
}

export interface BackgroundDefinition {
  id: BackgroundId;
  label: string;
  color: string;
}

export interface FrameDefinition {
  id: FrameId;
  label: string;
  color: string | null;
  width: number;
}

export const FILTER_DEFINITIONS = [
  { id: "normal", label: "Normal", canvasFilter: "none" },
  { id: "black-and-white", label: "Black & White", canvasFilter: "grayscale(1)" },
  { id: "warm", label: "Warm", canvasFilter: "sepia(.18) saturate(1.12) brightness(1.04)" },
  { id: "cool", label: "Cool", canvasFilter: "saturate(.88) hue-rotate(165deg) brightness(1.03)" },
  { id: "vintage", label: "Vintage", canvasFilter: "sepia(.35) saturate(.78) contrast(.9) brightness(1.08)" },
] as const satisfies readonly FilterDefinition[];

export const BACKGROUND_DEFINITIONS = [
  { id: "white", label: "White", color: "#ffffff" },
  { id: "black", label: "Black", color: "#151515" },
  { id: "classic-red", label: "Classic Red", color: "#c92332" },
] as const satisfies readonly BackgroundDefinition[];

export const FRAME_DEFINITIONS = [
  { id: "none", label: "None", color: null, width: 0 },
  { id: "white-border", label: "White Border", color: "#ffffff", width: 22 },
  { id: "black-border", label: "Black Border", color: "#151515", width: 22 },
  { id: "red-border", label: "Red Border", color: "#c92332", width: 22 },
] as const satisfies readonly FrameDefinition[];

function getDefinition<T extends { id: string }>(definitions: readonly T[], id: T["id"], kind: string): T {
  const definition = definitions.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown ${kind}: ${id}`);
  return definition;
}

export function getFilterDefinition(id: FilterId): FilterDefinition {
  return getDefinition(FILTER_DEFINITIONS, id, "filter");
}

export function getBackgroundDefinition(id: BackgroundId): BackgroundDefinition {
  return getDefinition(BACKGROUND_DEFINITIONS, id, "background");
}

export function getFrameDefinition(id: FrameId): FrameDefinition {
  return getDefinition(FRAME_DEFINITIONS, id, "frame");
}
