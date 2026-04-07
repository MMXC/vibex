/**
 * Context Slice - 上下文状态分片
 * 专门管理限界上下文相关的状态
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { BoundedContext } from '@/services/api/types/prototype/domain';

// ==================== Types ====================

export interface ContextRelationship {
  id: string;
  fromContextId: string;
  toContextId: string;
  type: 'upstream' | 'downstream' | 'symmetric';
  description: string;
}

export interface ContextState {
  // Data
  boundedContexts: BoundedContext[];
  contextMermaidCode: string;
  
  // Selection
  selectedContextIds: string[];
  
  // UI State
  isContextPanelOpen: boolean;
  
  // Actions
  setBoundedContexts: (contexts: BoundedContext[]) => void;
  addBoundedContext: (context: BoundedContext) => void;
  updateBoundedContext: (id: string, updates: Partial<BoundedContext>) => void;
  removeBoundedContext: (id: string) => void;
  clearBoundedContexts: () => void;
  
  setContextMermaidCode: (code: string) => void;
  
  selectContext: (id: string) => void;
  deselectContext: (id: string) => void;
  toggleContextSelection: (id: string) => void;
  clearSelection: () => void;
  
  setContextPanelOpen: (open: boolean) => void;
  toggleContextPanel: () => void;

  // E2: Cross-slice state sync — batch set selection IDs from sessionStorage restore
  setSelectedContextIds: (ids: string[]) => void;
}

// ==================== Store ====================

export const useContextStore = create<ContextState>()(
  devtools(
    persist(
    (set) => ({
      // Initial state
      boundedContexts: [],
      contextMermaidCode: '',
      selectedContextIds: [],
      isContextPanelOpen: true,
      
      // Actions with null protection
      // F1.3: 防护非法 payload — 必须是数组
      setBoundedContexts: (contexts) => {
        if (!Array.isArray(contexts)) return;
        // 过滤脏数据（无 id 的条目）
        const valid = contexts.filter((c): c is NonNullable<typeof c> => c?.id != null);
        set({ boundedContexts: valid });
      },
      
      addBoundedContext: (context) => 
        set((state) => ({ 
          boundedContexts: [...(state.boundedContexts ?? []), context] 
        })),
      
      updateBoundedContext: (id, updates) =>
        set((state) => ({
          boundedContexts: (state.boundedContexts ?? []).map((ctx) =>
            ctx.id === id ? { ...ctx, ...updates } : ctx
          ),
        })),
      
      removeBoundedContext: (id) =>
        set((state) => ({
          boundedContexts: (state.boundedContexts ?? []).filter((ctx) => ctx.id !== id),
          selectedContextIds: (state.selectedContextIds ?? []).filter((ctxId) => ctxId !== id),
        })),
      
      clearBoundedContexts: () => set({ 
        boundedContexts: [], 
        contextMermaidCode: '',
        selectedContextIds: [] 
      }),
      
      setContextMermaidCode: (code) => set({ contextMermaidCode: code }),
      
      selectContext: (id) =>
        set((state) => ({
          selectedContextIds: (state.selectedContextIds ?? []).includes(id)
            ? state.selectedContextIds
            : [...(state.selectedContextIds ?? []), id],
        })),
      
      deselectContext: (id) =>
        set((state) => ({
          selectedContextIds: (state.selectedContextIds ?? []).filter((ctxId) => ctxId !== id),
        })),
      
      toggleContextSelection: (id) =>
        set((state) => ({
          selectedContextIds: (state.selectedContextIds ?? []).includes(id)
            ? (state.selectedContextIds ?? []).filter((ctxId) => ctxId !== id)
            : [...(state.selectedContextIds ?? []), id],
        })),
      
      clearSelection: () => set({ selectedContextIds: [] }),
      
      setContextPanelOpen: (open) => set({ isContextPanelOpen: open }),
      toggleContextPanel: () => 
        set((state) => ({ isContextPanelOpen: !state.isContextPanelOpen })),

      // E2: Batch set selection IDs (used by sessionStorage restore)
      setSelectedContextIds: (ids) => {
        if (!Array.isArray(ids)) return;
        set({ selectedContextIds: ids });
      },
    }),
    {
      name: 'vibex-context',
      partialize: (state) => ({
        boundedContexts: state.boundedContexts,
        contextMermaidCode: state.contextMermaidCode,
        selectedContextIds: state.selectedContextIds,
      }),
    }
  ),
  { name: 'ContextSlice' }
  )
);

// ==================== Selectors with null protection ====================

export const selectBoundedContexts = (state: ContextState) => state.boundedContexts ?? [];
export const selectSelectedContexts = (state: ContextState) => 
  (state.boundedContexts ?? []).filter(ctx => (state.selectedContextIds ?? []).includes(ctx.id));
export const selectCoreContexts = (state: ContextState) => 
  (state.boundedContexts ?? []).filter(ctx => ctx.type === 'core');
export const selectSupportingContexts = (state: ContextState) => 
  (state.boundedContexts ?? []).filter(ctx => ctx.type === 'supporting');
export const selectGenericContexts = (state: ContextState) => 
  (state.boundedContexts ?? []).filter(ctx => ctx.type === 'generic');
export const selectExternalContexts = (state: ContextState) => 
  (state.boundedContexts ?? []).filter(ctx => ctx.type === 'external');
export const selectContextMermaidCode = (state: ContextState) => state.contextMermaidCode ?? '';
export const selectIsContextPanelOpen = (state: ContextState) => state.isContextPanelOpen ?? false;
