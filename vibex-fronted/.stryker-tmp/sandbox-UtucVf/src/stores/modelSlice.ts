/**
 * Model Slice - 领域模型状态分片
 * 专门管理领域模型相关的状态
 */
// @ts-nocheck


import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

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

  // E2: Cross-slice state sync — batch set selection IDs from sessionStorage restore
  setSelectedModelIds: (ids: string[]) => void;
}

// ==================== Store ====================

export const useModelStore = create<ModelState>()(
  devtools(
    persist(
    (set) => ({
      // Initial state
      domainModels: [],
      modelMermaidCode: '',
      selectedModelIds: [],
      isModelPanelOpen: true,
      
      // F1.3: 防护非法 payload — 必须是数组
      setDomainModels: (models) => {
        if (!Array.isArray(models)) return;
        // 过滤脏数据（无 id 的条目）
        const valid = models.filter((m): m is NonNullable<typeof m> => m?.id != null);
        set({ domainModels: valid });
      },
      
      addDomainModel: (model) => 
        set((state) => ({ 
          domainModels: [...(state.domainModels ?? []), model] 
        })),
      
      updateDomainModel: (id, updates) =>
        set((state) => ({
          domainModels: (state.domainModels ?? []).map((model) =>
            model.id === id ? { ...model, ...updates } : model
          ),
        })),
      
      removeDomainModel: (id) =>
        set((state) => ({
          domainModels: (state.domainModels ?? []).filter((model) => model.id !== id),
          selectedModelIds: (state.selectedModelIds ?? []).filter((modelId) => modelId !== id),
        })),
      
      clearDomainModels: () => set({ 
        domainModels: [], 
        modelMermaidCode: '',
        selectedModelIds: [] 
      }),
      
      setModelMermaidCode: (code) => set({ modelMermaidCode: code }),
      
      selectModel: (id) =>
        set((state) => ({
          selectedModelIds: (state.selectedModelIds ?? []).includes(id)
            ? state.selectedModelIds
            : [...(state.selectedModelIds ?? []), id],
        })),
      
      deselectModel: (id) =>
        set((state) => ({
          selectedModelIds: (state.selectedModelIds ?? []).filter((modelId) => modelId !== id),
        })),
      
      toggleModelSelection: (id) =>
        set((state) => ({
          selectedModelIds: (state.selectedModelIds ?? []).includes(id)
            ? (state.selectedModelIds ?? []).filter((modelId) => modelId !== id)
            : [...(state.selectedModelIds ?? []), id],
        })),
      
      clearModelSelection: () => set({ selectedModelIds: [] }),
      
      setModelPanelOpen: (open) => set({ isModelPanelOpen: open }),
      toggleModelPanel: () => 
        set((state) => ({ isModelPanelOpen: !state.isModelPanelOpen })),

      // E2: Batch set selection IDs (used by sessionStorage restore)
      setSelectedModelIds: (ids) => {
        if (!Array.isArray(ids)) return;
        set({ selectedModelIds: ids });
      },
    }),
    {
      name: 'vibex-model',
      partialize: (state) => ({
        domainModels: state.domainModels,
        modelMermaidCode: state.modelMermaidCode,
        selectedModelIds: state.selectedModelIds,
      }),
    }
  ),
  { name: 'ModelSlice' }
  )
);

// ==================== Selectors with null protection ====================

export const selectDomainModels = (state: ModelState) => state.domainModels ?? [];
export const selectSelectedModels = (state: ModelState) => {
  const selectedIds = new Set(state.selectedModelIds ?? []);
  return (state.domainModels ?? []).filter(model => selectedIds.has(model.id));
};
export const selectAggregateRoots = (state: ModelState) => 
  (state.domainModels ?? []).filter(model => model.type === 'aggregate_root');
export const selectEntities = (state: ModelState) => 
  (state.domainModels ?? []).filter(model => model.type === 'entity');
export const selectValueObjects = (state: ModelState) => 
  (state.domainModels ?? []).filter(model => model.type === 'value_object');
export const selectModelsByContextId = (contextId: string) => (state: ModelState) => 
  (state.domainModels ?? []).filter(model => model.contextId === contextId);
export const selectModelMermaidCode = (state: ModelState) => state.modelMermaidCode ?? '';
export const selectIsModelPanelOpen = (state: ModelState) => state.isModelPanelOpen ?? false;
