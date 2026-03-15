export const WORLD_INITIAL_BOUNDS = {
  minX: -5000,
  maxX: 5000,
  minY: -5000,
  maxY: 5000
} as const;

export const DEFAULT_CAMERA = {
  x: 0,
  y: 0,
  zoom: 1
} as const;

export const CAMERA_LIMITS = {
  minZoom: 0.3,
  maxZoom: 2.4
} as const;

export const DEFAULT_BUBBLE_SIZE = {
  width: 160,
  height: 110
} as const;

export const BUBBLE_LIMITS = {
  minWidth: 120,
  maxWidth: 460,
  minHeight: 80,
  maxHeight: 380
} as const;

export const VIEWPORT_CULLING_MARGIN = 360;
export const CLUSTER_CELL_SIZE = 280;
export const CLUSTER_ZOOM_THRESHOLD = 0.52;
export const PRESENCE_CHANNEL = "chatlas-world-presence";
