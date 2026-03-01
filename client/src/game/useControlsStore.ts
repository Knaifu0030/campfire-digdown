import { create } from 'zustand';

export interface ControlBinding {
  action: string;
  label: string;
  keys: string[];
}

interface ControlsStore {
  bindings: ControlBinding[];
  rebindingAction: string | null;
  setRebinding: (action: string | null) => void;
  updateBinding: (action: string, newKey: string) => void;
  resetDefaults: () => void;
}

const DEFAULT_BINDINGS: ControlBinding[] = [
  { action: 'left', label: 'Move Left', keys: ['ArrowLeft', 'KeyA'] },
  { action: 'right', label: 'Move Right', keys: ['ArrowRight', 'KeyD'] },
  { action: 'dash', label: 'Dash', keys: ['Space'] },
];

function cloneBindings(b: ControlBinding[]): ControlBinding[] {
  return b.map((x) => ({ ...x, keys: [...x.keys] }));
}

export const useControlsStore = create<ControlsStore>((set) => ({
  bindings: cloneBindings(DEFAULT_BINDINGS),
  rebindingAction: null,

  setRebinding: (action) => set({ rebindingAction: action }),

  updateBinding: (action, newKey) =>
    set((state) => {
      const next = cloneBindings(state.bindings);
      const binding = next.find((b) => b.action === action);
      if (binding) {
        binding.keys = [newKey];
      }
      return { bindings: next, rebindingAction: null };
    }),

  resetDefaults: () =>
    set({ bindings: cloneBindings(DEFAULT_BINDINGS), rebindingAction: null }),
}));

export function getKeyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code === 'Space') return 'SPACE';
  if (code === 'ArrowLeft') return '\u2190';
  if (code === 'ArrowRight') return '\u2192';
  if (code === 'ArrowUp') return '\u2191';
  if (code === 'ArrowDown') return '\u2193';
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'SHIFT';
  if (code === 'ControlLeft' || code === 'ControlRight') return 'CTRL';
  return code.replace('Key', '');
}
