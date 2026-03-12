/**
 * Model Slice - 领域模型状态分片
 * 专门管理领域模型相关的状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================== Types ====================

export interface DomainModelProperty {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface DomainModel {
  id: string;
  name: string;
  contextId: string;
  type: 'aggregate_root' | 'entity' | 'value_object';
  properties: DomainModelProperty[];
  methods?: string[];
  description?: string;
}

export interface ModelState {
  // Data
  domainModels: DomainModel[];
  modelMermaidCode: string;
  
  // Selection
  selectedModelIds: string[];
  
  // UI State
  isModelPanelOpen: boolean;
  
  // Actions
  setDomainModels: (models: DomainModel[]) => void;
  addDomainModel: (model: DomainModel) => void;
  updateDomainModel: (id: string, updates: Partial<DomainModel>) => void;
  removeDomainModel: (id: string) => void;
  clearDomainModels: () => void;
  
  setModelMermaidCode: (code: string) => void;
  
  selectModel: (id: string) => void;
  deselectModel: (id: string) => void;
  toggleModelSelection: (id: string) => void;
  clearModelSelection: () => void;
  
  setModelPanelOpen: (open: boolean) => void;
  toggleModelPanel: () => void;
}

// ==================== Store ====================

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      // Initial state
      domainModels: [],
      modelMermaidCode: '',
      selectedModelIds: [],
      isModelPanelOpen: true,
      
      // Actions
      setDomainModels: (models) => set({ domainModels: models }),
      
      addDomainModel: (model) => 
        set((state) => ({ 
          domainModels: [...state.domainModels, model] 
        })),
      
      updateDomainModel: (id, updates) =>
        set((state) => ({
          domainModels: state.domainModels.map((model) =>
            model.id === id ? { ...model, ...updates } : model
          ),
        })),
      
      removeDomainModel: (id) =>
        set((state) => ({
          domainModels: state.domainModels.filter((model) => model.id !== id),
          selectedModelIds: state.selectedModelIds.filter((modelId) => modelId !== id),
        })),
      
      clearDomainModels: () => set({ 
        domainModels: [], 
        modelMermaidCode: '',
        selectedModelIds: [] 
      }),
      
      setModelMermaidCode: (code) => set({ modelMermaidCode: code }),
      
      selectModel: (id) =>
        set((state) => ({
          selectedModelIds: state.selectedModelIds.includes(id)
            ? state.selectedModelIds
            : [...state.selectedModelIds, id],
        })),
      
      deselectModel: (id) =>
        set((state) => ({
          selectedModelIds: state.selectedModelIds.filter((modelId) => modelId !== id),
        })),
      
      toggleModelSelection: (id) =>
        set((state) => ({
          selectedModelIds: state.selectedModelIds.includes(id)
            ? state.selectedModelIds.filter((modelId) => modelId !== id)
            : [...state.selectedModelIds, id],
        })),
      
      clearModelSelection: () => set({ selectedModelIds: [] }),
      
      setModelPanelOpen: (open) => set({ isModelPanelOpen: open }),
      toggleModelPanel: () => 
        set((state) => ({ isModelPanelOpen: !state.isModelPanelOpen })),
    }),
    {
      name: 'vibex-model',
      partialize: (state) => ({
        domainModels: state.domainModels,
        modelMermaidCode: state.modelMermaidCode,
        selectedModelIds: state.selectedModelIds,
      }),
    }
  )
);

// ==================== Selectors ====================

export const selectDomainModels = (state: ModelState) => state.domainModels;
export const selectSelectedModels = (state: ModelState) => 
  state.domainModels.filter(model => state.selectedModelIds.includes(model.id));
export const selectAggregateRoots = (state: ModelState) => 
  state.domainModels.filter(model => model.type === 'aggregate_root');
export const selectEntities = (state: ModelState) => 
  state.domainModels.filter(model => model.type === 'entity');
export const selectValueObjects = (state: ModelState) => 
  state.domainModels.filter(model => model.type === 'value_object');
export const selectModelsByContextId = (contextId: string) => (state: ModelState) => 
  state.domainModels.filter(model => model.contextId === contextId);
export const selectModelMermaidCode = (state: ModelState) => state.modelMermaidCode;
export const selectIsModelPanelOpen = (state: ModelState) => state.isModelPanelOpen;
