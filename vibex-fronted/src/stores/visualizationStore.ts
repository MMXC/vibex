/**
 * Visualization Store — Zustand store for unified visualization state
 *
 * Manages state for three visualization modes:
 * - 'flow': ReactFlow diagram
 * - 'mermaid': Mermaid rendering
 * - 'json': JSON tree viewer
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  VisualizationStore,
  VisualizationType,
  AnyVisualizationData,
  VisualizationState,
} from '@/types/visualization';

// ==================== Initial State ====================

const initialState: VisualizationState = {
  currentType: 'flow',
  rawData: null,
  visualizationData: null,
  isLoading: false,
  error: null,
  options: {
    zoom: 1,
    selectedNodeId: null,
    searchQuery: '',
    showMinimap: true,
  },
};

// ==================== Store ====================

export const useVisualizationStore = create<VisualizationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setType: (type: VisualizationType) =>
        set({
          currentType: type,
          error: null,
          options: { ...initialState.options },
        }),

      setData: (data: unknown) =>
        set({
          rawData: data,
          error: null,
          visualizationData: null,
          isLoading: true,
        }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: Error | null) =>
        set({
          error,
          isLoading: false,
          visualizationData: null,
        }),

      setVisualizationData: (data: AnyVisualizationData) =>
        set({
          visualizationData: data,
          isLoading: false,
          error: null,
          currentType: data.type,
        }),

      clear: () =>
        set({
          ...initialState,
          options: { ...initialState.options },
        }),

      setOption: (key, value) =>
        set((state) => ({
          options: { ...state.options, [key]: value },
        })),

      resetOptions: () =>
        set((state) => ({
          options: { ...initialState.options },
        })),
    }),
    {
      name: 'vibex-visualization',
      partialize: (state) => ({
        currentType: state.currentType,
        options: state.options,
      }),
    }
  )
);

// ==================== Selectors ====================

export const selectCurrentType = (state: VisualizationStore) => state.currentType;
export const selectVisualizationData = (state: VisualizationStore) =>
  state.visualizationData;
export const selectIsLoading = (state: VisualizationStore) => state.isLoading;
export const selectError = (state: VisualizationStore) => state.error;
export const selectOptions = (state: VisualizationStore) => state.options;
export const selectSelectedNodeId = (state: VisualizationStore) =>
  state.options.selectedNodeId;
export const selectSearchQuery = (state: VisualizationStore) =>
  state.options.searchQuery;

export default useVisualizationStore;
