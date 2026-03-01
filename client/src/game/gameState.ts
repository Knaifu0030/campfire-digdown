import {
  BlockType,
  BASE_SPEED,
  LANE_COUNT,
  ROW_SPACING,
} from './constants';

export interface BlockInfo {
  type: BlockType;
  broken: boolean;
}

export const blockGrid = new Map<string, BlockInfo>();

export const playerState = {
  lane: Math.floor(LANE_COUNT / 2),
  y: 0,
  visualX: 0,
  xVelocity: 0,
  speed: BASE_SPEED,
  gapSpeedBoost: 0,
  dashActive: false,
  dashTimer: 0,
  dashCooldown: 0,
  lastCheckedRow: -1,
  alive: true,
};

export let generatedUpToRow = -1;

export function setGeneratedUpToRow(row: number) {
  generatedUpToRow = row;
}

export function blockKey(lane: number, row: number): string {
  return `${lane},${row}`;
}

export function getBlock(lane: number, row: number): BlockInfo | undefined {
  return blockGrid.get(blockKey(lane, row));
}

export function setBlock(lane: number, row: number, info: BlockInfo): void {
  blockGrid.set(blockKey(lane, row), info);
}

export function resetGameState() {
  blockGrid.clear();
  playerState.lane = Math.floor(LANE_COUNT / 2);
  playerState.y = 0;
  playerState.visualX = 0;
  playerState.xVelocity = 0;
  playerState.speed = BASE_SPEED;
  playerState.gapSpeedBoost = 0;
  playerState.dashActive = false;
  playerState.dashTimer = 0;
  playerState.dashCooldown = 0;
  playerState.lastCheckedRow = -1;
  playerState.alive = true;
  generatedUpToRow = -1;
  particles.length = 0;
  cameraShakeIntensity = 0;
  eventState.nextEventIn = 15 + Math.random() * 10;
  eventState.activeEvent = 'none';
  eventState.eventTimeLeft = 0;
}

export interface ParticleData {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  color: [number, number, number];
  size: number;
}

export const particles: ParticleData[] = [];

export function addParticles(newParticles: ParticleData[]) {
  if (particles.length + newParticles.length > 600) {
    particles.splice(0, newParticles.length);
  }
  particles.push(...newParticles);
}

export let cameraShakeIntensity = 0;

export function triggerCameraShake(intensity: number) {
  cameraShakeIntensity = Math.max(cameraShakeIntensity, intensity);
}

export function updateCameraShake(delta: number) {
  cameraShakeIntensity = Math.max(0, cameraShakeIntensity - delta * 4);
}

export const eventState = {
  nextEventIn: 15 + Math.random() * 10,
  activeEvent: 'none' as string,
  eventTimeLeft: 0,
};

export function getCurrentRow(): number {
  return Math.floor(-playerState.y / ROW_SPACING);
}
