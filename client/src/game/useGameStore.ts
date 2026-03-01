import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GameEvent } from './constants';

interface GameStore {
  phase: 'menu' | 'playing' | 'gameover';
  depth: number;
  gems: number;
  highScore: number;
  shieldActive: boolean;
  magnetActive: boolean;
  speedBurstActive: boolean;
  powerupTimer: number;
  activeEvent: GameEvent;
  eventTimeLeft: number;
  dashCooldownPct: number;

  startGame: () => void;
  endGame: () => void;
  restart: () => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set) => ({
    phase: 'menu' as const,
    depth: 0,
    gems: 0,
    highScore: 0,
    shieldActive: false,
    magnetActive: false,
    speedBurstActive: false,
    powerupTimer: 0,
    activeEvent: GameEvent.NONE,
    eventTimeLeft: 0,
    dashCooldownPct: 0,

    startGame: () =>
      set({
        phase: 'playing',
        depth: 0,
        gems: 0,
        shieldActive: false,
        magnetActive: false,
        speedBurstActive: false,
        powerupTimer: 0,
        activeEvent: GameEvent.NONE,
        eventTimeLeft: 0,
        dashCooldownPct: 0,
      }),

    endGame: () =>
      set((state) => ({
        phase: 'gameover',
        highScore: Math.max(state.highScore, Math.floor(state.depth)),
      })),

    restart: () => set({ phase: 'menu' }),
  })),
);
