/**
 * VibeX viewportBoundsStore — Zustand Store
 * P005-E1: react-virtual 安装 + viewportBounds store
 * S49-E3: 添加防抖更新 + nodeExtent 配置
 *
 * Responsibilities:
 * - Track canvas viewport bounds (x, y, width, height)
 * - Persist viewport position to sessionStorage (refresh page restores viewport)
 * - Support virtualization culling (P005-E2)
 * - Debounce viewport updates to reduce re-renders (S49-E3)
 * - Store nodeExtent config for ReactFlow bounds clamping (S49-E3)
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/** Viewport bounds in screen coordinates */
export interface ViewportBounds {
  /** Horizontal scroll offset (px) */
  x: number;
  /** Vertical scroll offset (px) */
  y: number;
  /** Visible viewport width (px) */
  width: number;
  /** Visible viewport height (px) */
  height: number;
  /** Current zoom level (default: 1) */
  zoom: number;
}

/** Node extent boundary for ReactFlow — limits node positions to a bounding box */
export type NodeExtent = [[number, number], [number, number]] | undefined;

interface ViewportBoundsStore {
  viewportBounds: ViewportBounds;
  /** Debounced viewport update — coalesces rapid viewport changes (default 50ms) */
  updateViewportBounds: (bounds: Partial<ViewportBounds>) => void;
  /** Immediately flush pending debounced update */
  flushViewportBounds: () => void;
  resetViewportBounds: () => void;

  /** nodeExtent config for ReactFlow — [[minX, minY], [maxX, maxY]] */
  nodeExtent: NodeExtent;
  setNodeExtent: (extent: NodeExtent) => void;
}

const DEFAULT_BOUNDS: ViewportBounds = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  zoom: 1,
};

/** Default node extent: ±50,000 on both axes — large enough for any real canvas */
const DEFAULT_NODE_EXTENT: NodeExtent = [
  [-50_000, -50_000],
  [50_000, 50_000],
];

/** Module-level debounce timer — persists across store instances */
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
/** Pending bounds to apply after debounce */
let _pendingBounds: Partial<ViewportBounds> = {};

export const useViewportBoundsStore = create<ViewportBoundsStore>()(
  devtools(
    persist(
      (set) => ({
        viewportBounds: DEFAULT_BOUNDS,

        updateViewportBounds: (bounds) => {
          // Merge into pending — later writes overwrite earlier ones
          _pendingBounds = { ..._pendingBounds, ...bounds };

          if (_debounceTimer !== null) {
            clearTimeout(_debounceTimer);
          }
          _debounceTimer = setTimeout(() => {
            set((state) => ({
              viewportBounds: { ...state.viewportBounds, ..._pendingBounds },
            }));
            _pendingBounds = {};
            _debounceTimer = null;
          }, 50);
        },

        flushViewportBounds: () => {
          if (_debounceTimer !== null) {
            clearTimeout(_debounceTimer);
            _debounceTimer = null;
          }
          if (Object.keys(_pendingBounds).length > 0) {
            set((state) => ({
              viewportBounds: { ...state.viewportBounds, ..._pendingBounds },
            }));
            _pendingBounds = {};
          }
        },

        resetViewportBounds: () => {
          if (_debounceTimer !== null) {
            clearTimeout(_debounceTimer);
            _debounceTimer = null;
          }
          _pendingBounds = {};
          set({ viewportBounds: DEFAULT_BOUNDS });
        },

        nodeExtent: DEFAULT_NODE_EXTENT,
        setNodeExtent: (extent) => set({ nodeExtent: extent }),
      }),
      {
        name: 'vibex-viewport-bounds',
        // Only persist in sessionStorage (cleared on tab close)
        storage: {
          getItem: (name) => {
            if (typeof sessionStorage === 'undefined') return null;
            const value = sessionStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: (name, value) => {
            if (typeof sessionStorage === 'undefined') return;
            sessionStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            if (typeof sessionStorage === 'undefined') return;
            sessionStorage.removeItem(name);
          },
        },
      }
    )
  )
);
