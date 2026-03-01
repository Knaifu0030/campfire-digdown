import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GameEvent } from './constants';

interface GameStore {
  phase: 'menu' | 'playing' | 'gameover';
  paused: boolean;
  menuTransition: number;
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
  togglePause: () => void;
  setPaused: (p: boolean) => void;
  setMenuTransition: (v: number) => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set) => ({
    phase: 'menu' as const,
    paused: false,
    menuTransition: 0,
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
        paused: false,
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
        paused: false,
        highScore: Math.max(state.highScore, Math.floor(state.depth)),
      })),

    restart: () => set({ phase: 'menu', paused: false, menuTransition: 0 }),

    togglePause: () =>
      set((state) => {
        if (state.phase !== 'playing') return {};
        return { paused: !state.paused };
      }),

    setPaused: (p) => set({ paused: p }),

    setMenuTransition: (v) => set({ menuTransition: v }),
  })),
);
