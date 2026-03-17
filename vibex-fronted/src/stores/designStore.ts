/**
 * Design State Store
 * 全局状态管理：设计流程状态、需求澄清、领域模型、业务流程、UI结构、原型
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================== Types ====================

export type DesignStep = 
  | 'clarification'
  | 'bounded-context'
  | 'domain-model'
  | 'business-flow'
  | 'ui-generation'
  | 'prototype';

export interface ClarificationRound {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  isAccepted: boolean;
}

export interface DomainEntity {
  id: string;
  name: string;
  type: 'aggregate' | 'entity' | 'value-object' | 'domain-event';
  attributes: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
  relationships: Array<{
    target: string;
    type: string;
    description?: string;
  }>;
}

export interface BusinessFlow {
  id: string;
  name: string;
  steps: Array<{
    id: string;
    action: string;
    actor: string;
    result: string;
  }>;
  mermaidCode?: string;
}

export interface UIComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: UIComponent[];
}

export interface UIPage {
  id: string;
  name: string;
  route: string;
  components: UIComponent[];
  layout: Record<string, unknown>;
}

export interface PrototypeData {
  id: string;
  pages: UIPage[];
  theme: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

// ==================== State ====================

interface DesignState {
  // Current step
  currentStep: DesignStep;
  stepHistory: DesignStep[];
  
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Session info
  sessionId: string | null;
  projectId: string | null;
  userId: string | null;
  
  // Step data
  requirementText: string;
  clarificationRounds: ClarificationRound[];
  boundedContexts: Array<{ id: string; name: string; description: string }>;
  domainEntities: DomainEntity[];
  businessFlows: BusinessFlow[];
  uiPages: UIPage[];
  prototype: PrototypeData | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentStep: (step: DesignStep) => void;
  goBack: () => void;
  goForward: () => void;
  
  setRequirementText: (text: string) => void;
  addClarificationRound: (round: ClarificationRound) => void;
  acceptClarification: (roundId: string) => void;
  
  setBoundedContexts: (contexts: DesignState['boundedContexts']) => void;
  setDomainEntities: (entities: DomainEntity[]) => void;
  addDomainEntity: (entity: DomainEntity) => void;
  updateDomainEntity: (id: string, entity: Partial<DomainEntity>) => void;
  deleteDomainEntity: (id: string) => void;
  
  setBusinessFlows: (flows: BusinessFlow[]) => void;
  addBusinessFlow: (flow: BusinessFlow) => void;
  updateBusinessFlow: (id: string, flow: Partial<BusinessFlow>) => void;
  
  setUIPages: (pages: UIPage[]) => void;
  addUIPage: (page: UIPage) => void;
  updateUIPage: (id: string, page: Partial<UIPage>) => void;
  
  setPrototype: (prototype: PrototypeData) => void;
  
  setSession: (sessionId: string, projectId: string, userId: string) => void;
  reset: () => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// ==================== Initial State ====================

const initialState = {
  currentStep: 'clarification' as DesignStep,
  stepHistory: [] as DesignStep[],
  
  // Hydration tracking
  _hasHydrated: false,
  setHasHydrated: (state: boolean) => {},
  
  sessionId: null,
  projectId: null,
  userId: null,
  requirementText: '',
  clarificationRounds: [],
  boundedContexts: [],
  domainEntities: [],
  businessFlows: [],
  uiPages: [],
  prototype: null,
  isLoading: false,
  error: null,
};

// ==================== Store ====================

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Navigation
      setCurrentStep: (step) => {
        const { currentStep, stepHistory } = get();
        set({
          currentStep: step,
          stepHistory: [...stepHistory, currentStep],
        });
      },
      
      goBack: () => {
        const { stepHistory } = get();
        if (stepHistory.length === 0) return;
        
        const previousStep = stepHistory[stepHistory.length - 1];
        set({
          currentStep: previousStep,
          stepHistory: stepHistory.slice(0, -1),
        });
      },
      
      goForward: () => {
        const { currentStep, setCurrentStep } = get();
        const stepOrder: DesignStep[] = [
          'clarification',
          'bounded-context',
          'domain-model',
          'business-flow',
          'ui-generation',
          'prototype',
        ];
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex < stepOrder.length - 1) {
          setCurrentStep(stepOrder[currentIndex + 1]);
        }
      },
      
      // Requirements
      setRequirementText: (text) => set({ requirementText: text }),
      
      addClarificationRound: (round) => set((state) => ({
        clarificationRounds: [...state.clarificationRounds, round],
      })),
      
      acceptClarification: (roundId) => set((state) => ({
        clarificationRounds: state.clarificationRounds.map((r) =>
          r.id === roundId ? { ...r, isAccepted: true } : r
        ),
      })),
      
      // Bounded Contexts
      setBoundedContexts: (contexts) => set({ boundedContexts: contexts }),
      
      // Domain Entities
      setDomainEntities: (entities) => set({ domainEntities: entities }),
      
      addDomainEntity: (entity) => set((state) => ({
        domainEntities: [...state.domainEntities, entity],
      })),
      
      updateDomainEntity: (id, updates) => set((state) => ({
        domainEntities: state.domainEntities.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      })),
      
      deleteDomainEntity: (id) => set((state) => ({
        domainEntities: state.domainEntities.filter((e) => e.id !== id),
      })),
      
      // Business Flows
      setBusinessFlows: (flows) => set({ businessFlows: flows }),
      
      addBusinessFlow: (flow) => set((state) => ({
        businessFlows: [...state.businessFlows, flow],
      })),
      
      updateBusinessFlow: (id, updates) => set((state) => ({
        businessFlows: state.businessFlows.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        ),
      })),
      
      // UI Pages
      setUIPages: (pages) => set({ uiPages: pages }),
      
      addUIPage: (page) => set((state) => ({
        uiPages: [...state.uiPages, page],
      })),
      
      updateUIPage: (id, updates) => set((state) => ({
        uiPages: state.uiPages.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })),
      
      // Prototype
      setPrototype: (prototype) => set({ prototype }),
      
      // Session
      setSession: (sessionId, projectId, userId) => set({
        sessionId,
        projectId,
        userId,
      }),
      
      // Reset
      reset: () => set(initialState),
      
      // UI State
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'design-state',
      partialize: (state) => ({
        currentStep: state.currentStep,
        sessionId: state.sessionId,
        projectId: state.projectId,
        requirementText: state.requirementText,
        clarificationRounds: state.clarificationRounds,
        boundedContexts: state.boundedContexts,
        domainEntities: state.domainEntities,
        businessFlows: state.businessFlows,
        uiPages: state.uiPages,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate design store:', error);
        } else if (state) {
          // Mark hydration as complete
          state.setHasHydrated(true);
        }
      },
    }
  )
);

// ==================== Selectors ====================

export const selectCurrentStep = (state: DesignState) => state.currentStep;
export const selectRequirementText = (state: DesignState) => state.requirementText;
export const selectClarificationRounds = (state: DesignState) => state.clarificationRounds;
export const selectDomainEntities = (state: DesignState) => state.domainEntities;
export const selectBusinessFlows = (state: DesignState) => state.businessFlows;
export const selectUIPages = (state: DesignState) => state.uiPages;
export const selectPrototype = (state: DesignState) => state.prototype;

export default useDesignStore;
