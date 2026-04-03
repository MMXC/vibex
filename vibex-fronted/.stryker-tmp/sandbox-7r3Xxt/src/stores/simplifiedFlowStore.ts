/**
 * Simplified Flow Store
 * 简化的3步流程状态管理
 * Step 1: 业务领域 → 业务流程
 * Step 2: 需求澄清
 * Step 3: 组件选择 → 生成项目
 */
// @ts-nocheck


'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// ==================== Types ====================

export type SimplifiedStep = 1 | 2 | 3;

export interface BusinessDomain {
  id: string;
  name: string;
  description: string;
  features: Feature[];
  isCore: boolean;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  isSelected: boolean;
}

export interface FlowNode {
  id: string;
  domainId: string;
  name: string;
  type: 'start' | 'end' | 'task' | 'decision' | 'subprocess';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: 'default' | 'success' | 'error';
  label?: string;
}

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface Clarification {
  id: string;
  question: string;
  answer?: string;
  isRequired: boolean;
  isAnswered: boolean;
}

export interface SelectedComponent {
  id: string;
  name: string;
  type: 'page' | 'component' | 'api' | 'data-model';
  description: string;
}

export interface SimplifiedFlowState {
  // 当前步骤
  currentStep: SimplifiedStep;
  
  // Step 1: 业务领域 + 流程
  step1: {
    domains: BusinessDomain[];
    flow: FlowData;
    selectedDomainIds: string[];
  };
  
  // Step 2: 需求澄清
  step2: {
    clarifications: Clarification[];
    answers: Record<string, string>;
    isComplete: boolean;
  };
  
  // Step 3: 组件选择
  step3: {
    components: SelectedComponent[];
    projectId?: string;
    projectName?: string;
    isGenerating: boolean;
  };
  
  // 错误状态
  error?: string;
  
  // Actions
  setCurrentStep: (step: SimplifiedStep) => void;
  
  // Step 1 Actions
  setDomains: (domains: BusinessDomain[]) => void;
  addDomain: (domain: Omit<BusinessDomain, 'id'>) => void;
  updateDomain: (domainId: string, updates: Partial<BusinessDomain>) => void;
  removeDomain: (domainId: string) => void;
  toggleDomainSelection: (domainId: string) => void;
  
  // Feature Actions
  toggleFeature: (domainId: string, featureId: string) => void;
  addFeature: (domainId: string, feature: Omit<Feature, 'id' | 'isSelected'>) => void;
  removeFeature: (domainId: string, featureId: string) => void;
  
  // Flow Actions
  setFlow: (flow: FlowData) => void;
  addNode: (domainId: string, node: Omit<FlowNode, 'id' | 'domainId'>) => void;
  updateNode: (nodeId: string, updates: Partial<FlowNode>) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: Omit<FlowEdge, 'id'>) => void;
  removeEdge: (edgeId: string) => void;
  editNodeName: (nodeId: string, name: string) => void;
  
  // Step 2 Actions
  setClarifications: (clarifications: Clarification[]) => void;
  answerClarification: (id: string, answer: string) => void;
  
  // Step 3 Actions
  addComponent: (component: Omit<SelectedComponent, 'id'>) => void;
  removeComponent: (componentId: string) => void;
  setProjectId: (projectId: string, projectName: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  
  // Error
  setError: (error: string | undefined) => void;
  
  // Reset
  reset: () => void;
}

// ==================== Initial State ====================

const initialState = {
  currentStep: 1 as SimplifiedStep,
  step1: {
    domains: [] as BusinessDomain[],
    flow: { nodes: [], edges: [] } as FlowData,
    selectedDomainIds: [] as string[],
  },
  step2: {
    clarifications: [] as Clarification[],
    answers: {} as Record<string, string>,
    isComplete: false,
  },
  step3: {
    components: [] as SelectedComponent[],
    projectId: undefined as string | undefined,
    projectName: undefined as string | undefined,
    isGenerating: false,
  },
  error: undefined as string | undefined,
};

// ==================== Store ====================

export const useSimplifiedFlowStore = create<SimplifiedFlowState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      // Step 1 Actions
      setDomains: (domains) => set((state) => ({
        step1: { ...state.step1, domains }
      })),
      
      addDomain: (domain) => set((state) => ({
        step1: {
          ...state.step1,
          domains: [
            ...state.step1.domains,
            { ...domain, id: uuidv4() }
          ]
        }
      })),
      
      updateDomain: (domainId, updates) => set((state) => ({
        step1: {
          ...state.step1,
          domains: state.step1.domains.map(d =>
            d.id === domainId ? { ...d, ...updates } : d
          )
        }
      })),
      
      removeDomain: (domainId) => set((state) => ({
        step1: {
          ...state.step1,
          domains: state.step1.domains.filter(d => d.id !== domainId),
          selectedDomainIds: state.step1.selectedDomainIds.filter(id => id !== domainId),
        }
      })),
      
      toggleDomainSelection: (domainId) => set((state) => {
        const isSelected = state.step1.selectedDomainIds.includes(domainId);
        return {
          step1: {
            ...state.step1,
            selectedDomainIds: isSelected
              ? state.step1.selectedDomainIds.filter(id => id !== domainId)
              : [...state.step1.selectedDomainIds, domainId]
          }
        };
      }),
      
      // Feature Actions
      toggleFeature: (domainId, featureId) => set((state) => ({
        step1: {
          ...state.step1,
          domains: state.step1.domains.map(d =>
            d.id === domainId
              ? {
                  ...d,
                  features: d.features.map(f =>
                    f.id === featureId ? { ...f, isSelected: !f.isSelected } : f
                  )
                }
              : d
          )
        }
      })),
      
      addFeature: (domainId, feature) => set((state) => ({
        step1: {
          ...state.step1,
          domains: state.step1.domains.map(d =>
            d.id === domainId
              ? {
                  ...d,
                  features: [
                    ...d.features,
                    { ...feature, id: uuidv4(), isSelected: false }
                  ]
                }
              : d
          )
        }
      })),
      
      removeFeature: (domainId, featureId) => set((state) => ({
        step1: {
          ...state.step1,
          domains: state.step1.domains.map(d =>
            d.id === domainId
              ? { ...d, features: d.features.filter(f => f.id !== featureId) }
              : d
          )
        }
      })),
      
      // Flow Actions
      setFlow: (flow) => set((state) => ({
        step1: { ...state.step1, flow }
      })),
      
      addNode: (domainId, node) => set((state) => ({
        step1: {
          ...state.step1,
          flow: {
            ...state.step1.flow,
            nodes: [
              ...state.step1.flow.nodes,
              { ...node, id: uuidv4(), domainId }
            ]
          }
        }
      })),
      
      updateNode: (nodeId, updates) => set((state) => ({
        step1: {
          ...state.step1,
          flow: {
            ...state.step1.flow,
            nodes: state.step1.flow.nodes.map(n =>
              n.id === nodeId ? { ...n, ...updates } : n
            )
          }
        }
      })),
      
      removeNode: (nodeId) => set((state) => ({
        step1: {
          ...state.step1,
          flow: {
            nodes: state.step1.flow.nodes.filter(n => n.id !== nodeId),
            edges: state.step1.flow.edges.filter(
              e => e.source !== nodeId && e.target !== nodeId
            )
          }
        }
      })),
      
      addEdge: (edge) => set((state) => ({
        step1: {
          ...state.step1,
          flow: {
            ...state.step1.flow,
            edges: [...state.step1.flow.edges, { ...edge, id: uuidv4() }]
          }
        }
      })),
      
      removeEdge: (edgeId) => set((state) => ({
        step1: {
          ...state.step1,
          flow: {
            ...state.step1.flow,
            edges: state.step1.flow.edges.filter(e => e.id !== edgeId)
          }
        }
      })),
      
      editNodeName: (nodeId, name) => set((state) => ({
        step1: {
          ...state.step1,
          flow: {
            ...state.step1.flow,
            nodes: state.step1.flow.nodes.map(n =>
              n.id === nodeId ? { ...n, name, data: { ...n.data, label: name } } : n
            )
          }
        }
      })),
      
      // Step 2 Actions
      setClarifications: (clarifications) => set((state) => ({
        step2: { ...state.step2, clarifications }
      })),
      
      answerClarification: (id, answer) => set((state) => ({
        step2: {
          ...state.step2,
          answers: { ...state.step2.answers, [id]: answer },
          clarifications: state.step2.clarifications.map(c =>
            c.id === id ? { ...c, answer, isAnswered: true } : c
          ),
          isComplete: state.step2.clarifications.every(c => 
            c.id === id ? true : c.isAnswered
          )
        }
      })),
      
      // Step 3 Actions
      addComponent: (component) => set((state) => ({
        step3: {
          ...state.step3,
          components: [...state.step3.components, { ...component, id: uuidv4() }]
        }
      })),
      
      removeComponent: (componentId) => set((state) => ({
        step3: {
          ...state.step3,
          components: state.step3.components.filter(c => c.id !== componentId)
        }
      })),
      
      setProjectId: (projectId, projectName) => set((state) => ({
        step3: { ...state.step3, projectId, projectName }
      })),
      
      setIsGenerating: (isGenerating) => set((state) => ({
        step3: { ...state.step3, isGenerating }
      })),
      
      // Error
      setError: (error) => set({ error }),
      
      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'vibex-simplified-flow',
      partialize: (state) => ({
        currentStep: state.currentStep,
        step1: state.step1,
        step2: state.step2,
        step3: state.step3,
      }),
    }
  )
);

// ==================== Selectors ====================

export const selectSimplifiedStep = (state: SimplifiedFlowState) => state.currentStep;
export const selectDomains = (state: SimplifiedFlowState) => state.step1.domains;
export const selectSelectedDomainIds = (state: SimplifiedFlowState) => state.step1.selectedDomainIds;
export const selectFlow = (state: SimplifiedFlowState) => state.step1.flow;
export const selectClarifications = (state: SimplifiedFlowState) => state.step2.clarifications;
export const selectComponents = (state: SimplifiedFlowState) => state.step3.components;
export const selectIsGenerating = (state: SimplifiedFlowState) => state.step3.isGenerating;
export const selectError = (state: SimplifiedFlowState) => state.error;

export default useSimplifiedFlowStore;
