export const LANE_COUNT = 7;
export const LANE_SPACING = 1.3;
export const BLOCK_SIZE = 1.1;
export const ROW_SPACING = 1.1;
export const BASE_SPEED = 3.0;
export const MAX_SPEED = 10.0;
export const SPEED_INCREASE_RATE = 0.5;
export const DASH_SPEED_MULT = 3.5;
export const DASH_DURATION = 0.25;
export const DASH_COOLDOWN = 0.8;
export const PLAYER_SIZE = 0.65;
export const GENERATE_AHEAD = 35;
export const REMOVE_BEHIND = 15;
export const INITIAL_EMPTY_ROWS = 6;
export const CAMERA_OFFSET_Y = 3;
export const CAMERA_OFFSET_Z = 14;
export const CAMERA_LOOK_AHEAD = 5;
export const CAMERA_SMOOTH = 0.06;
export const SHAFT_HALF_WIDTH = ((LANE_COUNT - 1) / 2) * LANE_SPACING + LANE_SPACING * 0.7;

export enum BlockType {
  EMPTY = 0,
  SOFT = 1,
  HARD = 2,
  GEM = 3,
  POWERUP_SHIELD = 4,
  POWERUP_MAGNET = 5,
  POWERUP_SPEED = 6,
}

export enum GameEvent {
  NONE = 'none',
  GEM_RUSH = 'gem_rush',
  SPEED_TUNNEL = 'speed_tunnel',
  LOW_GRAVITY = 'low_gravity',
  TREASURE_POCKET = 'treasure_pocket',
  ROCK_RAIN = 'rock_rain',
}

export interface LayerColors {
  background: [number, number, number];
  fog: [number, number, number];
  fogNear: number;
  fogFar: number;
  ambient: [number, number, number];
  ambientIntensity: number;
  directional: [number, number, number];
  softBlock: [number, number, number];
  hardBlock: [number, number, number];
  wallColor: [number, number, number];
  emissive: [number, number, number];
  emissiveIntensity: number;
}

export const LAYER_CONFIGS: LayerColors[] = [
  {
    background: [0.18, 0.12, 0.08],
    fog: [0.15, 0.1, 0.07],
    fogNear: 8,
    fogFar: 30,
    ambient: [1.0, 0.9, 0.7],
    ambientIntensity: 0.6,
    directional: [1.0, 0.95, 0.8],
    softBlock: [0.55, 0.35, 0.18],
    hardBlock: [0.3, 0.22, 0.12],
    wallColor: [0.25, 0.18, 0.1],
    emissive: [0.0, 0.0, 0.0],
    emissiveIntensity: 0,
  },
  {
    background: [0.06, 0.07, 0.12],
    fog: [0.05, 0.06, 0.1],
    fogNear: 6,
    fogFar: 25,
    ambient: [0.4, 0.5, 0.8],
    ambientIntensity: 0.4,
    directional: [0.5, 0.6, 0.9],
    softBlock: [0.38, 0.38, 0.45],
    hardBlock: [0.18, 0.18, 0.25],
    wallColor: [0.12, 0.13, 0.2],
    emissive: [0.0, 0.0, 0.0],
    emissiveIntensity: 0,
  },
  {
    background: [0.15, 0.03, 0.02],
    fog: [0.18, 0.04, 0.02],
    fogNear: 5,
    fogFar: 22,
    ambient: [1.0, 0.35, 0.1],
    ambientIntensity: 0.5,
    directional: [1.0, 0.45, 0.15],
    softBlock: [0.55, 0.18, 0.06],
    hardBlock: [0.22, 0.06, 0.03],
    wallColor: [0.3, 0.06, 0.02],
    emissive: [1.0, 0.3, 0.0],
    emissiveIntensity: 0.15,
  },
  {
    background: [0.02, 0.02, 0.08],
    fog: [0.02, 0.01, 0.06],
    fogNear: 5,
    fogFar: 24,
    ambient: [0.3, 0.4, 1.0],
    ambientIntensity: 0.5,
    directional: [0.4, 0.3, 1.0],
    softBlock: [0.15, 0.3, 0.55],
    hardBlock: [0.08, 0.1, 0.28],
    wallColor: [0.04, 0.06, 0.18],
    emissive: [0.2, 0.4, 1.0],
    emissiveIntensity: 0.3,
  },
];

function lerpVal(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerpVal(a[0], b[0], t), lerpVal(a[1], b[1], t), lerpVal(a[2], b[2], t)];
}

export function getLayerColors(depth: number): LayerColors {
  let index: number;
  let t: number;

  if (depth < 100) {
    index = 0;
    t = depth / 100;
  } else if (depth < 300) {
    index = 1;
    t = (depth - 100) / 200;
  } else if (depth < 600) {
    index = 2;
    t = (depth - 300) / 300;
  } else {
    return LAYER_CONFIGS[3];
  }

  const cur = LAYER_CONFIGS[index];
  const nxt = LAYER_CONFIGS[Math.min(index + 1, 3)];

  return {
    background: lerpColor(cur.background, nxt.background, t),
    fog: lerpColor(cur.fog, nxt.fog, t),
    fogNear: lerpVal(cur.fogNear, nxt.fogNear, t),
    fogFar: lerpVal(cur.fogFar, nxt.fogFar, t),
    ambient: lerpColor(cur.ambient, nxt.ambient, t),
    ambientIntensity: lerpVal(cur.ambientIntensity, nxt.ambientIntensity, t),
    directional: lerpColor(cur.directional, nxt.directional, t),
    softBlock: lerpColor(cur.softBlock, nxt.softBlock, t),
    hardBlock: lerpColor(cur.hardBlock, nxt.hardBlock, t),
    wallColor: lerpColor(cur.wallColor, nxt.wallColor, t),
    emissive: lerpColor(cur.emissive, nxt.emissive, t),
    emissiveIntensity: lerpVal(cur.emissiveIntensity, nxt.emissiveIntensity, t),
  };
}

export function getLaneX(lane: number): number {
  return (lane - (LANE_COUNT - 1) / 2) * LANE_SPACING;
}

export function getRowY(row: number): number {
  return -row * ROW_SPACING;
}
