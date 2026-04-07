import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// Storage version for migration
const STORAGE_VERSION = 1;
const STORAGE_KEY = 'vibex-homepage-session';

// Dev-only logger
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') canvasLogger.default.debug('[homePageStore]', ...args);
};

// Step type - 4-step homepage flow (Epic 3)
export type HomePageStep = 'step1' | 'step2' | 'step3' | 'step4';

// Mermaid codes for each step
export interface MermaidCodes {
  context: string;
  model: string;
  flow: string;
  components: string;
}

// HomePage Snapshot for undo/redo (max 5 as per PRD ST-9.2)
export interface HomePageSnapshot {
  step: HomePageStep;
  requirementText: string;
  mermaidCodes: MermaidCodes;
  timestamp: number;
  note?: string;
}

// HomePage State interface
export interface HomePageState {
  // Current step
  currentStep: HomePageStep;
  completedSteps: HomePageStep[];

  // Step 1: Input
  requirementText: string;

  // Mermaid codes from various steps
  mermaidCodes: MermaidCodes;

  // Snapshots for undo/redo (max 5 per PRD ST-9.2)
  snapshots: HomePageSnapshot[];
  snapshotsIndex: number;

  // SSE connection state
  sseConnected: boolean;
  sseConnecting: boolean;

  // Hydration tracking
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Actions - Step navigation
  setCurrentStep: (step: HomePageStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  markStepCompleted: (step: HomePageStep) => void;

  // Actions - Data
  setRequirementText: (text: string) => void;
  setMermaidCode: (key: keyof MermaidCodes, code: string) => void;

  // Actions - Snapshots (max 5)
  saveSnapshot: (note?: string) => void;
  restoreSnapshot: (index: number) => void;
  clearSnapshots: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;

  // Actions - SSE connection management (ST-9.3)
  setSSEConnected: (connected: boolean) => void;
  setSSEConnecting: (connecting: boolean) => void;

  // Actions - Reset
  reset: () => void;
}

const initialState = {
  currentStep: 'step1' as HomePageStep,
  completedSteps: [] as HomePageStep[],

  requirementText: '',

  mermaidCodes: {
    context: '',
    model: '',
    flow: '',
    components: '',
  },

  snapshots: [] as HomePageSnapshot[],
  snapshotsIndex: -1,

  sseConnected: false,
  sseConnecting: false,

  _hasHydrated: false,
  setHasHydrated: (state: boolean) => {},
};

// Step order for navigation - 4 steps (Epic 3)
const STEP_ORDER: HomePageStep[] = ['step1', 'step2', 'step3', 'step4'];

export const useHomePageStore = create<HomePageState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),

      goToNextStep: () => {
        const { currentStep } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex < STEP_ORDER.length - 1) {
          const nextStep = STEP_ORDER[currentIndex + 1];
          set((state) => ({
            currentStep: nextStep,
            completedSteps: state.completedSteps.includes(currentStep)
              ? state.completedSteps
              : [...state.completedSteps, currentStep],
          }));
        }
      },

      goToPreviousStep: () => {
        const { currentStep } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex > 0) {
          set({ currentStep: STEP_ORDER[currentIndex - 1] });
        }
      },

      markStepCompleted: (step) => {
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        }));
      },

      setRequirementText: (text) => set({ requirementText: text }),

      setMermaidCode: (key, code) => {
        devLog(`Set mermaid code for ${key}`);
        set((state) => ({
          mermaidCodes: { ...state.mermaidCodes, [key]: code },
        }));
      },

      // Save snapshot (max 5 per PRD ST-9.2)
      saveSnapshot: (note) => {
        const state = get();
        const snapshot: HomePageSnapshot = {
          step: state.currentStep,
          requirementText: state.requirementText,
          mermaidCodes: { ...state.mermaidCodes },
          timestamp: Date.now(),
          note,
        };

        // Remove any redo states and add new snapshot
        let newSnapshots = state.snapshots.slice(0, state.snapshotsIndex + 1);
        newSnapshots.push(snapshot);

        // Keep only last 5 snapshots (PRD ST-9.2)
        if (newSnapshots.length > 5) {
          newSnapshots = newSnapshots.slice(-5);
        }

        set({
          snapshots: newSnapshots,
          snapshotsIndex: newSnapshots.length - 1,
        });

        devLog(`Snapshot saved. Total: ${newSnapshots.length}`);
      },

      restoreSnapshot: (index) => {
        const { snapshots } = get();
        if (index < 0 || index >= snapshots.length) {
          devLog('Invalid snapshot index:', index);
          return;
        }

        const snapshot = snapshots[index];
        set({
          currentStep: snapshot.step,
          requirementText: snapshot.requirementText,
          mermaidCodes: { ...snapshot.mermaidCodes },
          snapshotsIndex: index,
        });

        devLog(`Restored snapshot at index ${index}`);
      },

      clearSnapshots: () => {
        set({ snapshots: [], snapshotsIndex: -1 });
        devLog('Snapshots cleared');
      },

      canUndo: () => {
        const { snapshotsIndex } = get();
        return snapshotsIndex > 0;
      },

      canRedo: () => {
        const { snapshots, snapshotsIndex } = get();
        return snapshotsIndex < snapshots.length - 1;
      },

      undo: () => {
        const { snapshotsIndex, snapshots } = get();
        if (snapshotsIndex > 0) {
          const prevSnapshot = snapshots[snapshotsIndex - 1];
          set({
            currentStep: prevSnapshot.step,
            requirementText: prevSnapshot.requirementText,
            mermaidCodes: { ...prevSnapshot.mermaidCodes },
            snapshotsIndex: snapshotsIndex - 1,
          });
          devLog('Undo to snapshot', snapshotsIndex - 1);
        }
      },

      redo: () => {
        const { snapshotsIndex, snapshots } = get();
        if (snapshotsIndex < snapshots.length - 1) {
          const nextSnapshot = snapshots[snapshotsIndex + 1];
          set({
            currentStep: nextSnapshot.step,
            requirementText: nextSnapshot.requirementText,
            mermaidCodes: { ...nextSnapshot.mermaidCodes },
            snapshotsIndex: snapshotsIndex + 1,
          });
          devLog('Redo to snapshot', snapshotsIndex + 1);
        }
      },

      // SSE connection management (ST-9.3)
      setSSEConnected: (connected) => {
        devLog('SSE connected:', connected);
        set({ sseConnected: connected, sseConnecting: false });
      },

      setSSEConnecting: (connecting) => {
        devLog('SSE connecting:', connecting);
        set({ sseConnecting: connecting });
      },

      reset: () => set(initialState),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state: HomePageState) => ({
        // Persist essential state for recovery (ST-9.1)
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        requirementText: state.requirementText,
        mermaidCodes: state.mermaidCodes,
        snapshots: state.snapshots.slice(-5), // Keep max 5 snapshots
      }),
      version: STORAGE_VERSION,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          canvasLogger.default.error('Failed to rehydrate homePage store:', error);
        } else if (state) {
          state.setHasHydrated(true);
        }
      },
      migrate: (
        persistedState: unknown,
        oldVersion: number
      ): HomePageState => {
        if (oldVersion < 1) {
          devLog(
            'Migrating homePage store from version',
            oldVersion,
            'to',
            STORAGE_VERSION
          );
        }
        return persistedState as HomePageState;
      },
    }
  )
);

// Selector hooks for common use cases
export const useCurrentStep = () => useHomePageStore((state) => state.currentStep);
export const useCompletedSteps = () => useHomePageStore((state) => state.completedSteps);
export const useRequirementText = () => useHomePageStore((state) => state.requirementText);
export const useSSEState = () => useHomePageStore((state) => ({
  connected: state.sseConnected,
  connecting: state.sseConnecting,
}));
