export type LayoutId = "grid-2x2" | "strip-1x4" | "grid-2x3";

export interface LayoutSlot {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutDefinition {
  id: LayoutId;
  label: string;
  columns: number;
  rows: number;
  capacity: number;
  tileSize: number;
  outerMargin: number;
  gutter: number;
  canvasWidth: number;
  canvasHeight: number;
  slots: readonly LayoutSlot[];
}

const TILE_SIZE = 600;
const OUTER_MARGIN = 48;
const GUTTER = 24;

function createLayout(
  id: LayoutId,
  label: string,
  columns: number,
  rows: number,
): LayoutDefinition {
  const canvasWidth = columns * TILE_SIZE + (columns - 1) * GUTTER + OUTER_MARGIN * 2;
  const canvasHeight = rows * TILE_SIZE + (rows - 1) * GUTTER + OUTER_MARGIN * 2;

  return {
    id,
    label,
    columns,
    rows,
    capacity: columns * rows,
    tileSize: TILE_SIZE,
    outerMargin: OUTER_MARGIN,
    gutter: GUTTER,
    canvasWidth,
    canvasHeight,
    slots: Array.from({ length: columns * rows }, (_, index) => ({
      index,
      x: OUTER_MARGIN + (index % columns) * (TILE_SIZE + GUTTER),
      y: OUTER_MARGIN + Math.floor(index / columns) * (TILE_SIZE + GUTTER),
      width: TILE_SIZE,
      height: TILE_SIZE,
    })),
  };
}

export const LAYOUT_DEFINITIONS = [
  createLayout("grid-2x2", "2 × 2 grid", 2, 2),
  createLayout("strip-1x4", "1 × 4 strip", 1, 4),
  createLayout("grid-2x3", "2 × 3 grid", 2, 3),
] as const satisfies readonly LayoutDefinition[];

export function getLayoutDefinition(layoutId: LayoutId): LayoutDefinition {
  const layout = LAYOUT_DEFINITIONS.find(({ id }) => id === layoutId);

  if (!layout) {
    throw new Error(`Unknown layout: ${layoutId}`);
  }

  return layout;
}
