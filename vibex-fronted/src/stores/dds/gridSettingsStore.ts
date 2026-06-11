/**
 * VibeX gridSettingsStore — Zustand Store for Canvas Grid Settings
 * S88-E1: Canvas Zoom & Navigation Enhancement
 *
 * Responsibilities:
 * - Track canvas grid spacing (small/medium/large/none)
 * - Persist preference to sessionStorage
 * - Provide grid size presets: small=10, medium=20, large=40
 *
 * Integration:
 * - DDSCanvasPage reads gridSize → applies to ReactFlow background gap prop
 * - ZoomControls uses gridSettingsStore for E1-F2 grid spacing switch
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type GridSize = 'small' | 'medium' | 'large' | 'none';

/** Grid spacing in pixels per the DoD E1-F2 spec */
export const GRID_SIZES: Record<GridSize, number | null> = {
  small: 10,
  medium: 20,
  large: 40,
  none: null,
};

interface GridSettingsStore {
  /** Current grid size selection */
  gridSize: GridSize;

  /** Set grid size */
  setGridSize: (size: GridSize) => void;

  /** Cycle to next grid size option */
  cycleGridSize: () => void;
}

const GRID_SIZE_ORDER: GridSize[] = ['medium', 'small', 'large', 'none'];

export const useGridSettingsStore = create<GridSettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        gridSize: 'medium',

        setGridSize: (size) =>
          set({ gridSize: size }, false, 'setGridSize'),

        cycleGridSize: () => {
          const current = get().gridSize;
          const idx = GRID_SIZE_ORDER.indexOf(current);
          const next = GRID_SIZE_ORDER[(idx + 1) % GRID_SIZE_ORDER.length];
          set({ gridSize: next }, false, 'cycleGridSize');
        },
      }),
      {
        name: 'gridSettingsStore',
        storage: {
          getItem: (name) => {
            try {
              const value = sessionStorage.getItem(name);
              return value ? JSON.parse(value) : null;
            } catch {
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              sessionStorage.setItem(name, JSON.stringify(value));
            } catch {
              // sessionStorage unavailable (e.g., SSR)
            }
          },
          removeItem: (name) => {
            try {
              sessionStorage.removeItem(name);
            } catch {
              // ignore
            }
          },
        },
      }
    ),
    { name: 'gridSettingsStore' }
  )
);

/** Singleton accessor for imperative use in tests */
export const gridSettingsStore = useGridSettingsStore;
