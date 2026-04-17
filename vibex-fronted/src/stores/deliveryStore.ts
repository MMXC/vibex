/**
 * Delivery Center Store
 * 统一交付中心状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProtoNode } from './prototypeStore';
import type { ChapterData, DDSCard } from '@/types/dds';

// ==================== Delivery Spec Types ====================

export interface ComponentSpec {
  id: string;
  type: string;
  name: string;
  props: Record<string, unknown>;
  position: { x: number; y: number };
  styles?: Record<string, unknown>;
  breakpoints?: import('./prototypeStore').ProtoNodeBreakpoints;
}

export interface SchemaSpec {
  projectName: string;
  chapters: Record<string, { type: string; cards: Array<{ id: string; type: string; title: string; data: unknown }> }>;
}

export type DDLOutput = string;

// ==================== Types ====================

export type DeliveryTab = 'contexts' | 'flows' | 'components' | 'prd';
export type ExportFormat = 'json' | 'markdown' | 'plantuml' | 'bpmn' | 'typescript' | 'schema' | 'zip' | 'pdf';
export type ExportType = 'context' | 'flow' | 'component' | 'prd';
export type ExportAllType = 'contexts' | 'flows' | 'components';

export interface BoundedContext {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
  relationCount: number;
}

export interface BusinessFlow {
  id: string;
  name: string;
  contextName: string;
  stepCount: number;
  decisionCount: number;
}

export interface Component {
  id: string;
  name: string;
  type: 'Service' | 'Controller' | 'Repository' | 'Entity' | 'ValueObject' | 'Event';
  description: string;
  referenceCount: number;
  methodCount: number;
}

export interface ExportProgress {
  type: ExportType;
  id: string;
  progress: number;
  status: 'pending' | 'exporting' | 'completed' | 'error';
  error?: string;
}

export interface DeliveryState {
  // Tab state
  activeTab: DeliveryTab;
  searchQuery: string;
  typeFilter: string;

  // Data
  contexts: BoundedContext[];
  flows: BusinessFlow[];
  components: Component[];

  // Export state
  exportProgress: ExportProgress | null;
  isExporting: boolean;

  // History
  exportHistory: ExportHistoryItem[];

  // Actions
  setActiveTab: (tab: DeliveryTab) => void;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: string) => void;
  loadMockData: () => void;
  toComponent: (node: ProtoNode) => ComponentSpec;
  toSchema: (chapters: Record<string, ChapterData>) => SchemaSpec;
  toDDL: (schema: SchemaSpec) => string;
  exportItem: (type: ExportType, id: string, format: ExportFormat) => Promise<void>;
  exportAll: (type: ExportAllType) => Promise<void>;
  addToHistory: (item: ExportHistoryItem) => void;
  clearHistory: () => void;
}

export interface ExportHistoryItem {
  id: string;
  type: ExportType;
  name: string;
  format: ExportFormat;
  timestamp: number;
  status: 'success' | 'error';
  error?: string;
}

// ==================== Mock Data ====================

const MOCK_CONTEXTS: BoundedContext[] = [
  {
    id: 'ctx-1',
    name: '商品域',
    description: '商品目录和库存管理',
    nodeCount: 5,
    relationCount: 3,
  },
  {
    id: 'ctx-2',
    name: '订单域',
    description: '订单处理和履约',
    nodeCount: 8,
    relationCount: 5,
  },
  {
    id: 'ctx-3',
    name: '用户域',
    description: '用户账号和权限管理',
    nodeCount: 6,
    relationCount: 4,
  },
];

const MOCK_FLOWS: BusinessFlow[] = [
  {
    id: 'flow-1',
    name: '下单流程',
    contextName: '订单域',
    stepCount: 5,
    decisionCount: 2,
  },
  {
    id: 'flow-2',
    name: '注册流程',
    contextName: '用户域',
    stepCount: 3,
    decisionCount: 1,
  },
  {
    id: 'flow-3',
    name: '支付流程',
    contextName: '订单域',
    stepCount: 4,
    decisionCount: 1,
  },
];

const MOCK_COMPONENTS: Component[] = [
  {
    id: 'comp-1',
    name: '商品服务',
    type: 'Service',
    description: '商品相关业务逻辑',
    referenceCount: 3,
    methodCount: 12,
  },
  {
    id: 'comp-2',
    name: '订单控制器',
    type: 'Controller',
    description: '订单 API 接口',
    referenceCount: 5,
    methodCount: 8,
  },
  {
    id: 'comp-3',
    name: '用户仓储',
    type: 'Repository',
    description: '用户数据持久化',
    referenceCount: 2,
    methodCount: 6,
  },
];


// ==================== Data Conversion ====================

export function toComponent(node: ProtoNode): ComponentSpec {
  return {
    id: node.id,
    type: node.data.component?.type ?? 'unknown',
    name: node.data.component?.name ?? node.data.component?.type ?? 'Unknown',
    props: node.data.component?.props ?? {},
    position: node.position,
    styles: {
      width: node.data.width,
      height: node.data.height,
      backgroundColor: node.data.backgroundColor,
      borderRadius: node.data.borderRadius,
    },
    breakpoints: node.data.breakpoints,
  };
}

export function toSchema(chapters: Record<string, ChapterData>): SchemaSpec {
  const schema: SchemaSpec = {
    projectName: '',
    chapters: {},
  };
  for (const [key, chapter] of Object.entries(chapters)) {
    schema.chapters[key] = {
      type: key,
      cards: chapter.cards.map((card: DDSCard) => ({
        id: card.id,
        type: card.type,
        title: card.title ?? '',
        data: card,
      })),
    };
  }
  return schema;
}

export function toDDL(schema: SchemaSpec): DDLOutput {
  const tables: string[] = [];
  const contexts = schema.chapters['context'];
  if (contexts?.cards) {
    for (const card of contexts.cards) {
      if (card.type === 'bounded-context') {
        const tableName = (card.title ?? 'unknown').replace(/\s+/g, '_').toLowerCase();
        tables.push(`CREATE TABLE ${tableName} (`);
        tables.push('  id BIGSERIAL PRIMARY KEY,');
        tables.push('  created_at TIMESTAMP DEFAULT NOW(),');
        tables.push('  updated_at TIMESTAMP DEFAULT NOW()');
        tables.push(');');
      }
    }
  }
  return tables.join('
') || '-- No tables defined';
}

// ==================== Store ====================
// ==================== Store ====================

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeTab: 'contexts',
      searchQuery: '',
      typeFilter: 'all',

      contexts: [],
      flows: [],
      components: [],

      exportProgress: null,
      isExporting: false,

      exportHistory: [],

      // Actions
      setActiveTab: (tab) => set({ activeTab: tab }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setTypeFilter: (type) => set({ typeFilter: type }),

      loadMockData: () => {
        set({
          contexts: MOCK_CONTEXTS,
          flows: MOCK_FLOWS,
          components: MOCK_COMPONENTS,
        });
      },

      // T2: 数据转换函数

      toComponent: (node: ProtoNode): ComponentSpec => {
        return {
          id: node.id,
          type: node.data.component?.type ?? 'unknown',
          name: node.data.component?.name ?? node.data.component?.type ?? 'Unknown',
          props: node.data.component?.props ?? {},
          position: node.position,
          styles: {
            width: node.data.width,
            height: node.data.height,
            backgroundColor: node.data.backgroundColor,
            borderRadius: node.data.borderRadius,
          },
          breakpoints: node.data.breakpoints,
        };
      },

      toSchema: (chapters: Record<string, ChapterData>): SchemaSpec => {
        const schema: SchemaSpec = {
          projectName: '',
          chapters: {},
        };

        for (const [key, chapter] of Object.entries(chapters)) {
          schema.chapters[key] = {
            type: key,
            cards: chapter.cards.map((card: DDSCard) => ({
              id: card.id,
              type: card.type,
              title: card.title ?? '',
              data: card,
            })),
          };
        }
        return schema;
      },

      toDDL: (schema: SchemaSpec): string => {
        const tables: string[] = [];

        // 从 context 章节提取 bounded-context 作为表
        const contexts = schema.chapters['context'];
        if (contexts?.cards) {
          for (const card of contexts.cards) {
            if (card.type === 'bounded-context') {
              const tableName = (card.title ?? 'unknown').replace(/\s+/g, '_').toLowerCase();
              tables.push(`CREATE TABLE ${tableName} (`);
              tables.push(`  id BIGSERIAL PRIMARY KEY,`);
              tables.push(`  created_at TIMESTAMP DEFAULT NOW(),`);
              tables.push(`  updated_at TIMESTAMP DEFAULT NOW()`);
              tables.push(`);\n`);
            }
          }
        }

        return tables.join('\n') || '-- No tables defined';
      },

      exportItem: async (type, id, format) => {
        const state = get();

        // Find item name
        let name = '';
        if (type === 'context') {
          const ctx = state.contexts.find(c => c.id === id);
          name = ctx?.name || 'Unknown';
        } else if (type === 'flow') {
          const flow = state.flows.find(f => f.id === id);
          name = flow?.name || 'Unknown';
        } else if (type === 'component') {
          const comp = state.components.find(c => c.id === id);
          name = comp?.name || 'Unknown';
        } else {
          name = 'PRD';
        }

        set({
          isExporting: true,
          exportProgress: {
            type,
            id,
            progress: 0,
            status: 'exporting',
          },
        });

        // Simulate export progress
        for (let i = 0; i <= 100; i += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          set({
            exportProgress: {
              type,
              id,
              progress: i,
              status: 'exporting',
            },
          });
        }

        // Add to history
        get().addToHistory({
          id: `export-${Date.now()}`,
          type,
          name,
          format,
          timestamp: Date.now(),
          status: 'success',
        });

        // TODO: Replace with actual API call
        // const response = await fetch('/api/delivery/export', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ type, id, format }),
        // });
        // const data = await response.json();
        // triggerDownload(data.downloadUrl, data.filename);

        set({
          isExporting: false,
          exportProgress: {
            type,
            id,
            progress: 100,
            status: 'completed',
          },
        });

        // Clear progress after 2s
        setTimeout(() => {
          set({ exportProgress: null });
        }, 2000);
      },

      exportAll: async (type) => {
        const state = get();

        set({
          isExporting: true,
          exportProgress: {
            type: type.slice(0, -1) as ExportType,
            id: 'all',
            progress: 0,
            status: 'exporting',
          },
        });

        // Simulate batch export
        const items = type === 'contexts' ? state.contexts
          : type === 'flows' ? state.flows
          : state.components;

        for (let i = 0; i <= items.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 200));
          set({
            exportProgress: {
              type: type.slice(0, -1) as ExportType,
              id: 'all',
              progress: Math.round((i / items.length) * 100),
              status: 'exporting',
            },
          });
        }

        get().addToHistory({
          id: `export-${Date.now()}`,
          type: type.slice(0, -1) as ExportType,
          name: `全部${type === 'contexts' ? '上下文' : type === 'flows' ? '流程' : '组件'}`,
          format: 'zip',
          timestamp: Date.now(),
          status: 'success',
        });

        set({
          isExporting: false,
          exportProgress: {
            type: type.slice(0, -1) as ExportType,
            id: 'all',
            progress: 100,
            status: 'completed',
          },
        });

        setTimeout(() => {
          set({ exportProgress: null });
        }, 2000);
      },

      addToHistory: (item) => {
        set((state) => ({
          exportHistory: [item, ...state.exportHistory].slice(0, 50),
        }));
      },

      clearHistory: () => set({ exportHistory: [] }),
    }),
    {
      name: 'vibex-delivery',
      partialize: (state) => ({
        exportHistory: state.exportHistory,
      }),
    }
  )
);
