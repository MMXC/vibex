/**
 * canvasAIStore — S94-E1: Canvas AI Insights
 *
 * Manages AI insights panel state: health score, layout suggestions, and isolated nodes.
 * Provides actions to fetch insights and apply layout optimization.
 */

import { create } from 'zustand';

export interface CanvasInsights {
  score: number;
  suggestions: string[];
  isolatedNodes: string[];
}

interface CanvasAIState {
  /** Current insights data */
  insights: CanvasInsights | null;
  /** Whether insights are currently being fetched */
  isLoading: boolean;
  /** Error message if last fetch/optimize failed */
  error: string | null;
  /** Whether the AI Insights panel is open */
  isOpen: boolean;
  /** Whether an optimize operation is in progress */
  isOptimizing: boolean;

  /** Open the AI Insights panel */
  openPanel: () => void;
  /** Close the AI Insights panel */
  closePanel: () => void;
  /** Toggle panel open/closed */
  togglePanel: () => void;

  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error message */
  setError: (error: string | null) => void;
  /** Set insights data */
  setInsights: (insights: CanvasInsights) => void;
  /** Clear insights */
  clearInsights: () => void;

  /** Set optimizing state */
  setOptimizing: (optimizing: boolean) => void;
}

export const useCanvasAIStore = create<CanvasAIState>((set) => ({
  insights: null,
  isLoading: false,
  error: null,
  isOpen: false,
  isOptimizing: false,

  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setInsights: (insights) => set({ insights, error: null }),
  clearInsights: () => set({ insights: null }),

  setOptimizing: (isOptimizing) => set({ isOptimizing }),
}));
