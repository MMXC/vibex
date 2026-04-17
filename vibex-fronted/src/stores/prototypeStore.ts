/**
 * prototypeStore — Zustand Store for Drag-and-Drop Layout Editor
 *
 * 职责：管理 Prototype Canvas 的节点数据、选中状态、Mock数据
 * 设计决策：
 * - 独立于 DDSCanvasStore，不共享数据
 * - localStorage 持久化，MVP 阶段使用
 * - 导出的 JSON 格式为 v2.0，与 D1 schema 对齐
 *
 * Epic1: E1-U1 ~ E1-U4
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Node, Edge } from '@xyflow/react';
import type { UIComponent } from '@/lib/prototypes/ui-schema';

// ==================== Types ====================

export interface ProtoNodeData {
  /** 组件定义快照（来自 DEFAULT_COMPONENTS） */
  component: UIComponent;
  /** Mock 数据 */
  mockData?: {
    data: Record<string, unknown>;
    source: 'inline';
  };
  /** Index signature for React Flow compatibility */
  [key: string]: unknown;
}

export interface ProtoNode extends Node<ProtoNodeData> {}

export interface ProtoPage {
  id: string;
  name: string;
  route: string;
}

export interface PrototypeExportV2 {
  version: '2.0';
  nodes: ProtoNode[];
  edges: Edge[];
  pages: ProtoPage[];
  mockDataBindings: Array<{
    nodeId: string;
    data: Record<string, unknown>;
  }>;
}

// ==================== Store Interface ====================

export interface PrototypeStoreState {
  // ---- Canvas Data ----
  nodes: ProtoNode[];
  edges: Edge[];

  // ---- Selection ----
  selectedNodeId: string | null;

  // ---- Pages (E3) ----
  pages: ProtoPage[];

  // ---- Actions ----
  addNode: (component: UIComponent, position: { x: number; y: number }) => string;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: Partial<ProtoNodeData>) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  updateNodeMockData: (nodeId: string, data: Record<string, unknown>) => void;

  selectNode: (nodeId: string | null) => void;
  clearCanvas: () => void;

  // ---- Page Actions (E3) ----
  addPage: (route: string, name?: string) => void;
  removePage: (pageId: string) => void;

  // ---- Edge Actions (Sprint3 E1) ----
  addEdge: (source: string, target: string) => string;
  removeEdge: (edgeId: string) => void;

  // ---- Import / Export ----
  getExportData: () => PrototypeExportV2;
  loadFromExport: (data: PrototypeExportV2) => void;
}

// ==================== Helpers ====================

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof (crypto as unknown as { randomUUID?: () => string }).randomUUID === 'function') {
    return (crypto as unknown as { randomUUID: () => string }).randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ==================== Initial State ====================

const DEFAULT_PAGES: ProtoPage[] = [
  { id: 'page-1', name: '首页', route: '/' },
];

// ==================== Store ====================

export const usePrototypeStore = create<PrototypeStoreState>()(
  persist(
    (set, get) => ({
      // ---- Initial State ----
      nodes: [],
      edges: [],
      selectedNodeId: null,
      pages: DEFAULT_PAGES,

      // ---- Node Actions ----

      addNode: (component: UIComponent, position: { x: number; y: number }) => {
        const id = `proto-${generateId()}`;
        const newNode: ProtoNode = {
          id,
          type: 'protoNode',
          position,
          data: { component },
        };
        set((state) => ({
          nodes: [...state.nodes, newNode],
        }));
        return id;
      },

      removeNode: (nodeId: string) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        }));
      },

      updateNode: (nodeId: string, data: Partial<ProtoNodeData>) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
          ),
        }));
      },

      updateNodePosition: (nodeId: string, position: { x: number; y: number }) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, position } : n
          ),
        }));
      },

      updateNodeMockData: (nodeId: string, data: Record<string, unknown>) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, mockData: { data, source: 'inline' as const } } }
              : n
          ),
        }));
      },

      selectNode: (nodeId: string | null) => {
        set({ selectedNodeId: nodeId });
      },

      clearCanvas: () => {
        set({ nodes: [], edges: [], selectedNodeId: null });
      },

      // ---- Page Actions (E3) ----

      addPage: (route: string, name?: string) => {
        const id = `page-${generateId()}`;
        const pageName = name || route;
        set((state) => ({
          pages: [...state.pages, { id, name: pageName, route }],
        }));
      },

      removePage: (pageId: string) => {
        set((state) => ({
          pages: state.pages.filter((p) => p.id !== pageId),
        }));
      },

      // ---- Edge Actions (Sprint3 E1) ----
      addEdge: (source: string, target: string): string => {
        if (!source || !target) return '';
        const id = `edge-${generateId()}`;
        set((state) => ({
          edges: [
            ...state.edges,
            {
              id,
              source,
              target,
              type: 'smoothstep' as const,
              animated: true,
            },
          ],
        }));
        return id;
      },

      removeEdge: (edgeId: string) => {
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== edgeId),
        }));
      },

      // ---- Import / Export ----

      getExportData: (): PrototypeExportV2 => {
        const { nodes, edges, pages } = get();
        const mockDataBindings = nodes
          .filter((n) => n.data.mockData)
          .map((n) => ({
            nodeId: n.id,
            data: n.data.mockData!.data,
          }));

        return {
          version: '2.0',
          nodes,
          edges,
          pages,
          mockDataBindings,
        };
      },

      loadFromExport: (data: PrototypeExportV2) => {
        if (data.version !== '2.0') return;
        set({
          nodes: data.nodes,
          edges: data.edges,
          pages: data.pages,
          selectedNodeId: null,
        });
      },
    }),
    {
      name: 'vibex-prototype-canvas',
    }
  )
);
