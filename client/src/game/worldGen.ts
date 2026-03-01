import {
  LANE_COUNT,
  BlockType,
  GameEvent,
  INITIAL_EMPTY_ROWS,
} from './constants';
import { setBlock } from './gameState';

export function generateRow(row: number, activeEvent: string): void {
  if (row < INITIAL_EMPTY_ROWS) return;

  const depth = row;
  const isTreasure = activeEvent === GameEvent.TREASURE_POCKET;
  const isRockRain = activeEvent === GameEvent.ROCK_RAIN;
  const hardBase = isRockRain
    ? Math.min(0.45 + depth * 0.0004, 0.65)
    : isTreasure ? 0.05 : Math.min(0.25 + depth * 0.0004, 0.5);
  const gemBase = (activeEvent === GameEvent.GEM_RUSH || isTreasure) ? 0.35 : 0.08;
  const emptyBase = isTreasure ? 0.05 : 0.12 + Math.min(depth * 0.0001, 0.08);
  const powerupChance = isTreasure ? 0.08 : depth > 30 ? 0.015 : 0;

  const cells: BlockType[] = [];

  for (let lane = 0; lane < LANE_COUNT; lane++) {
    const r = Math.random();
    if (r < emptyBase) {
      cells.push(BlockType.EMPTY);
    } else if (r < emptyBase + hardBase) {
      cells.push(BlockType.HARD);
    } else if (r < emptyBase + hardBase + gemBase) {
      cells.push(BlockType.GEM);
    } else if (r < emptyBase + hardBase + gemBase + powerupChance) {
      const pt = Math.random();
      if (pt < 0.33) cells.push(BlockType.POWERUP_SHIELD);
      else if (pt < 0.66) cells.push(BlockType.POWERUP_MAGNET);
      else cells.push(BlockType.POWERUP_SPEED);
    } else {
      cells.push(BlockType.SOFT);
    }
  }

  let passableCount = 0;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== BlockType.HARD) passableCount++;
  }

  if (passableCount < 2) {
    const hardIndices: number[] = [];
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] === BlockType.HARD) hardIndices.push(i);
    }
    const needed = 2 - passableCount;
    for (let i = 0; i < needed && hardIndices.length > 0; i++) {
      const pick = Math.floor(Math.random() * hardIndices.length);
      cells[hardIndices[pick]] = BlockType.SOFT;
      hardIndices.splice(pick, 1);
    }
  }

  let maxConsecutiveHard = 0;
  let consecutive = 0;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === BlockType.HARD) {
      consecutive++;
      maxConsecutiveHard = Math.max(maxConsecutiveHard, consecutive);
    } else {
      consecutive = 0;
    }
  }
  if (maxConsecutiveHard >= 5) {
    const mid = Math.floor(LANE_COUNT / 2);
    if (cells[mid] === BlockType.HARD) {
      cells[mid] = BlockType.SOFT;
    }
  }

  for (let lane = 0; lane < LANE_COUNT; lane++) {
    if (cells[lane] !== BlockType.EMPTY) {
      setBlock(lane, row, { type: cells[lane], broken: false });
    }
  }
}
