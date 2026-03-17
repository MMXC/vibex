import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Storage version for migration
const STORAGE_VERSION = 1;
const STORAGE_KEY = 'confirmation-flow-storage';

export type ConfirmationStep =
  | 'input'
  | 'context'
  | 'model'
  | 'flow'
  | 'success';

// Snapshot type for undo/redo
export interface ConfirmationSnapshot {
  step: ConfirmationStep;
  requirementText: string;
  boundedContexts: BoundedContext[];
  selectedContextIds: string[];
  contextMermaidCode: string;
  domainModels: DomainModel[];
  modelMermaidCode: string;
  businessFlow: BusinessFlow;
  flowMermaidCode: string;
  timestamp: number;
  /** Version note/description */
  note?: string;
}

export interface BoundedContext {
  id: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  relationships: ContextRelationship[];
}

export interface ContextRelationship {
  id: string;
  fromContextId: string;
  toContextId: string;
  type: 'upstream' | 'downstream' | 'symmetric';
  description: string;
}

export interface DomainModel {
  id: string;
  name: string;
  contextId: string;
  type: 'aggregate_root' | 'entity' | 'value_object';
  properties: DomainProperty[];
  methods: string[];
}

export interface DomainProperty {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface BusinessFlow {
  id: string;
  name: string;
  states: FlowState[];
  transitions: FlowTransition[];
}

export interface FlowState {
  id: string;
  name: string;
  type: 'initial' | 'intermediate' | 'final';
  description: string;
}

export interface FlowTransition {
  id: string;
  fromStateId: string;
  toStateId: string;
  event: string;
  condition?: string;
}

export interface ConfirmationFlowState {
  // Current step
  currentStep: ConfirmationStep;
  stepHistory: ConfirmationStep[];

  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Step 1: Input
  requirementText: string;

  // Step 2: Bounded Context
  boundedContexts: BoundedContext[];
  selectedContextIds: string[];
  contextMermaidCode: string;

  // Step 3: Domain Model
  domainModels: DomainModel[];
  modelMermaidCode: string;

  // Step 4: Business Flow
  businessFlow: BusinessFlow;
  flowMermaidCode: string;

  // Project created
  createdProjectId: string | null;

  // History for undo/redo
  history: ConfirmationSnapshot[];
  historyIndex: number;

  // Actions
  setCurrentStep: (step: ConfirmationStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  setRequirementText: (text: string) => void;

  setBoundedContexts: (contexts: BoundedContext[]) => void;
  setSelectedContextIds: (ids: string[]) => void;
  setContextMermaidCode: (code: string) => void;

  setDomainModels: (models: DomainModel[]) => void;
  setModelMermaidCode: (code: string) => void;

  setBusinessFlow: (flow: BusinessFlow) => void;
  setFlowMermaidCode: (code: string) => void;

  setCreatedProjectId: (id: string) => void;

  // Undo/Redo actions
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  jumpToSnapshot: (index: number) => void;
  clearHistory: () => void;
  /** Update note for a specific snapshot */
  setSnapshotNote: (index: number, note: string) => void;
  /** Get note for a specific snapshot */
  getSnapshotNote: (index: number) => string | undefined;

  reset: () => void;
}

const initialState = {
  currentStep: 'input' as ConfirmationStep,
  stepHistory: [] as ConfirmationStep[],

  // Hydration tracking
  _hasHydrated: false,
  setHasHydrated: (state: boolean) => {},

  requirementText: '',

  boundedContexts: [],
  selectedContextIds: [],
  contextMermaidCode: '',

  domainModels: [],
  modelMermaidCode: '',

  businessFlow: {
    id: '',
    name: '',
    states: [],
    transitions: [],
  },
  flowMermaidCode: '',

  createdProjectId: null,

  // History
  history: [] as ConfirmationSnapshot[],
  historyIndex: -1,
};

export const useConfirmationStore = create<ConfirmationFlowState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentStep: (step) => {
        const current = get().currentStep;
        set((state) => ({
          currentStep: step,
          stepHistory: [...state.stepHistory, current],
        }));
      },

      goToNextStep: () => {
        const { currentStep } = get();
        const stepOrder: ConfirmationStep[] = [
          'input',
          'context',
          'model',
          'flow',
          'success',
        ];
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex < stepOrder.length - 1) {
          const nextStep = stepOrder[currentIndex + 1];
          set((state) => ({
            currentStep: nextStep,
            stepHistory: [...state.stepHistory, currentStep],
          }));
        }
      },

      goToPreviousStep: () => {
        const { stepHistory } = get();
        if (stepHistory.length > 0) {
          const previousStep = stepHistory[stepHistory.length - 1];
          set((state) => ({
            currentStep: previousStep,
            stepHistory: stepHistory.slice(0, -1),
          }));
        }
      },

      setRequirementText: (text) => set({ requirementText: text }),

      setBoundedContexts: (contexts) => set({ boundedContexts: contexts }),
      setSelectedContextIds: (ids) => set({ selectedContextIds: ids }),
      setContextMermaidCode: (code) => set({ contextMermaidCode: code }),

      setDomainModels: (models) => set({ domainModels: models }),
      setModelMermaidCode: (code) => set({ modelMermaidCode: code }),

      setBusinessFlow: (flow) => set({ businessFlow: flow }),
      setFlowMermaidCode: (code) => set({ flowMermaidCode: code }),

      setCreatedProjectId: (id) => set({ createdProjectId: id }),

      // Save current state to history
      saveSnapshot: () => {
        const state = get();
        const snapshot: ConfirmationSnapshot = {
          step: state.currentStep,
          requirementText: state.requirementText,
          boundedContexts: state.boundedContexts,
          selectedContextIds: state.selectedContextIds,
          contextMermaidCode: state.contextMermaidCode,
          domainModels: state.domainModels,
          modelMermaidCode: state.modelMermaidCode,
          businessFlow: state.businessFlow,
          flowMermaidCode: state.flowMermaidCode,
          timestamp: Date.now(),
        };

        // Remove any redo states
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(snapshot);

        // Keep only last 20 snapshots (PRD requirement)
        if (newHistory.length > 20) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      // Undo to previous state
      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const prevSnapshot = history[historyIndex - 1];
          set({
            currentStep: prevSnapshot.step,
            requirementText: prevSnapshot.requirementText,
            boundedContexts: prevSnapshot.boundedContexts,
            selectedContextIds: prevSnapshot.selectedContextIds,
            contextMermaidCode: prevSnapshot.contextMermaidCode,
            domainModels: prevSnapshot.domainModels,
            modelMermaidCode: prevSnapshot.modelMermaidCode,
            businessFlow: prevSnapshot.businessFlow,
            flowMermaidCode: prevSnapshot.flowMermaidCode,
            historyIndex: historyIndex - 1,
          });
        }
      },

      // Redo to next state
      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const nextSnapshot = history[historyIndex + 1];
          set({
            currentStep: nextSnapshot.step,
            requirementText: nextSnapshot.requirementText,
            boundedContexts: nextSnapshot.boundedContexts,
            selectedContextIds: nextSnapshot.selectedContextIds,
            contextMermaidCode: nextSnapshot.contextMermaidCode,
            domainModels: nextSnapshot.domainModels,
            modelMermaidCode: nextSnapshot.modelMermaidCode,
            businessFlow: nextSnapshot.businessFlow,
            flowMermaidCode: nextSnapshot.flowMermaidCode,
            historyIndex: historyIndex + 1,
          });
        }
      },

      // Check if undo is available
      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },

      // Check if redo is available
      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },

      // Jump to a specific snapshot index
      jumpToSnapshot: (index: number) => {
        const { history, currentStep, requirementText, boundedContexts, selectedContextIds, contextMermaidCode, domainModels, modelMermaidCode, businessFlow, flowMermaidCode, createdProjectId } = get();
        
        if (index < 0 || index >= history.length) return;
        
        const snapshot = history[index];
        
        set({
          currentStep: snapshot.step,
          requirementText: snapshot.requirementText,
          boundedContexts: snapshot.boundedContexts,
          selectedContextIds: snapshot.selectedContextIds,
          contextMermaidCode: snapshot.contextMermaidCode,
          domainModels: snapshot.domainModels,
          modelMermaidCode: snapshot.modelMermaidCode,
          businessFlow: snapshot.businessFlow,
          flowMermaidCode: snapshot.flowMermaidCode,
          historyIndex: index,
        });
      },

      // Clear all history
      clearHistory: () => {
        set({ history: [], historyIndex: -1 });
      },

      // Update note for a specific snapshot
      setSnapshotNote: (index: number, note: string) => {
        const { history } = get();
        if (index < 0 || index >= history.length) return;
        
        const newHistory = [...history];
        newHistory[index] = { ...newHistory[index], note };
        set({ history: newHistory });
      },

      // Get note for a specific snapshot
      getSnapshotNote: (index: number) => {
        const { history } = get();
        if (index < 0 || index >= history.length) return undefined;
        return history[index].note;
      },

      reset: () => set(initialState),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state: ConfirmationFlowState) => ({
        // Persist only essential state for recovery
        currentStep: state.currentStep,
        stepHistory: state.stepHistory,
        requirementText: state.requirementText,
        boundedContexts: state.boundedContexts,
        selectedContextIds: state.selectedContextIds,
        contextMermaidCode: state.contextMermaidCode,
        domainModels: state.domainModels,
        modelMermaidCode: state.modelMermaidCode,
        businessFlow: state.businessFlow,
        flowMermaidCode: state.flowMermaidCode,
        createdProjectId: state.createdProjectId,
      }),
      version: STORAGE_VERSION,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate confirmation store:', error);
        } else if (state) {
          // Mark hydration as complete
          state.setHasHydrated(true);
        }
      },
      migrate: (
        persistedState: unknown,
        oldVersion: number
      ): ConfirmationFlowState => {
        if (oldVersion < 1) {
          // Version 1 migration: Add any new fields with defaults
          console.log(
            'Migrating confirmation store from version',
            oldVersion,
            'to',
            STORAGE_VERSION
          );
        }
        return persistedState as ConfirmationFlowState;
      },
    }
  )
);
