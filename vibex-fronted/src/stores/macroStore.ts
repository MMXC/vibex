/**
 * macroStore — Sprint92 E1: Canvas Workflow Automation
 *
 * Zustand store for macro recording, playback, and management.
 * Macros are sequences of canvas operations that can be recorded,
 * saved, and replayed on demand.
 *
 * Persistence: Zustand persist middleware → localStorage
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ==================== Types ====================

export type MacroStepType =
  | 'create-node'
  | 'update-node'
  | 'delete-node'
  | 'move-node'
  | 'add-edge'
  | 'remove-edge';

export interface MacroStep {
  type: MacroStepType;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface CanvasMacro {
  id: string;
  userId: string;
  name: string;
  description: string;
  steps: MacroStep[];
  shareToken: string | null;
  createdAt: number;
  updatedAt: number;
  stepCount: number;
}

export type RecordingState = 'idle' | 'recording' | 'paused';

export interface MacroReplayResult {
  macroId: string;
  canvasId: string;
  ok: boolean;
  stepsExecuted?: number;
  error?: string;
}

// ==================== State ====================

interface MacroState {
  // Macro list (synced from backend)
  macros: CanvasMacro[];
  loading: boolean;
  error: string | null;

  // Recording
  recordingState: RecordingState;
  currentSteps: MacroStep[];
  recordingCanvasId: string | null;

  // Actions — API
  fetchMacros: () => Promise<void>;
  createMacro: (name: string, description: string) => Promise<CanvasMacro | null>;
  deleteMacro: (id: string) => Promise<void>;
  replayMacro: (
    macroId: string,
    canvasId: string,
    params?: Record<string, unknown>
  ) => Promise<MacroReplayResult>;

  // Actions — Recording
  startRecording: (canvasId: string) => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => MacroStep[];
  discardRecording: () => void;
  addStep: (step: MacroStep) => void;
}

// ==================== Store ====================

const STORAGE_KEY = 'vibex-macro-storage';

export const useMacroStore = create<MacroState>()(
  persist(
    (set, get) => ({
      macros: [],
      loading: false,
      error: null,
      recordingState: 'idle',
      currentSteps: [],
      recordingCanvasId: null,

      fetchMacros: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch('/api/canvas/macros', {
            credentials: 'include',
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json() as { ok: boolean; macros: CanvasMacro[] };
          set({ macros: data.macros || [], loading: false });
        } catch (err) {
          set({ error: String(err), loading: false });
        }
      },

      createMacro: async (name, description) => {
        const { currentSteps } = get();
        try {
          const res = await fetch('/api/canvas/macros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, description, steps: currentSteps }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json() as { ok: boolean; macro: CanvasMacro };
          set(state => ({ macros: [data.macro, ...state.macros], currentSteps: [] }));
          return data.macro;
        } catch (err) {
          set({ error: String(err) });
          return null;
        }
      },

      deleteMacro: async (id) => {
        try {
          const res = await fetch(`/api/canvas/macros/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          set(state => ({ macros: state.macros.filter(m => m.id !== id) }));
        } catch (err) {
          set({ error: String(err) });
        }
      },

      replayMacro: async (macroId, canvasId, params) => {
        try {
          const res = await fetch('/api/canvas/macros/replay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ macroId, canvasId, params }),
          });
          const data = await res.json() as { ok: boolean; stepsExecuted?: number; error?: string };
          return { macroId, canvasId, ok: data.ok, stepsExecuted: data.stepsExecuted, error: data.error };
        } catch (err) {
          return { macroId, canvasId, ok: false, error: String(err) };
        }
      },

      startRecording: (canvasId) => {
        set({
          recordingState: 'recording',
          currentSteps: [],
          recordingCanvasId: canvasId,
        });
      },

      pauseRecording: () => {
        set({ recordingState: 'paused' });
      },

      resumeRecording: () => {
        set({ recordingState: 'recording' });
      },

      stopRecording: () => {
        const steps = get().currentSteps;
        set({ recordingState: 'idle', currentSteps: [] });
        return steps;
      },

      discardRecording: () => {
        set({ recordingState: 'idle', currentSteps: [], currentSteps: [] });
      },

      addStep: (step) => {
        set(state => ({
          currentSteps: [...state.currentSteps, step],
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        macros: state.macros,
      }),
    }
  )
);
