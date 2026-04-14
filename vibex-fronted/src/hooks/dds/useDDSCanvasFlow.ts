/**
 * useDDSCanvasFlow Hook
 * 封装 React Flow 的 useNodesEdges，处理 data → view 单向同步
 *
 * 职责：
 * - 从 DDSCanvasStore 读取 cards/edges
 * - 转换为 React Flow 的 nodes/edges 格式
 * - 处理 onConnect（创建新边）→ store.addEdge
 * - 处理 onNodesChange（位置变更）→ store.updateCard
 *
 * Epic 1: F3
 * 参考: specs/dds-canvas-state.md §2.3
 */

import { useCallback } from 'react';
import {
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
} from '@xyflow/react';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds/DDSCanvasStore';
import type { ChapterType, DDSCard, DDSEdge } from '@/types/dds';

// ==================== Card → Node 转换 ====================

function toReactFlowNode(card: DDSCard): Node {
  return {
    id: card.id,
    type: card.type,
    position: card.position,
    data: { ...card },
  };
}

function toReactFlowNodes(cards: DDSCard[]): Node[] {
  return cards.map(toReactFlowNode);
}

// ==================== Edge → React Flow Edge 转换 ====================

function toReactFlowEdge(edge: DDSEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type ?? 'smoothstep',
    animated: edge.animated ?? false,
  };
}

function toReactFlowEdges(edges: DDSEdge[]): Edge[] {
  return edges.map(toReactFlowEdge);
}

// ==================== Hook ====================

export interface UseDDSCanvasFlowResult {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
}

/**
 * useDDSCanvasFlow
 *
 * @param chapter - 当前章节类型
 * @param initialNodes - 初始节点（可选，用于 SSR/hydration）
 * @param initialEdges - 初始边（可选）
 */
export function useDDSCanvasFlow(
  chapter: ChapterType,
  initialNodes?: Node[],
  initialEdges?: Edge[]
): UseDDSCanvasFlowResult {
  // 从 store 读取 chapter 数据
  const chapterData = useDDSCanvasStore((s) => s.chapters[chapter]);

  // React Flow state
  const [nodes, setNodes] = useNodesState(
    initialNodes ?? toReactFlowNodes(chapterData.cards)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges ?? toReactFlowEdges(chapterData.edges)
  );

  // React Flow 实例（用于 fitView 等）
  useReactFlow();

  // 同步 store → view（当 store 数据变化时更新 React Flow nodes）
  // 注意：这是单向同步 data → view，view 变化通过 onNodesChange 回写 store

  // onConnect: 创建新边
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const newEdge: DDSEdge = {
        id: crypto.randomUUID(),
        source: connection.source,
        target: connection.target,
        type: 'smoothstep',
        animated: true, // 新创建的边标记为 animated
      };

      // 写入 store
      ddsChapterActions.addEdge(chapter, newEdge);

      // 同步到 React Flow（通过 edges state 更新）
      setEdges((eds) => [
        ...eds,
        {
          ...newEdge,
          source: newEdge.source,
          target: newEdge.target,
        },
      ]);
    },
    [chapter, setEdges]
  );

  // onNodesChange: 处理节点位置变更
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // 1. 让 React Flow 处理变更（更新本地 nodes state）
      const nextNodes = applyNodeChanges(changes, nodes);
      setNodes(nextNodes);

      // 2. 提取 position 变更，回写到 store
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          ddsChapterActions.updateCard(chapter, change.id, {
            position: change.position,
          });
        }
      });
    },
    [chapter, nodes, setNodes]
  );

  return {
    nodes,
    edges,
    onNodesChange: handleNodesChange,
    onEdgesChange,
    onConnect: handleConnect,
  };
}

// ==================== Standalone 导出转换函数（供测试/其他 hook 使用）================

export { toReactFlowNode, toReactFlowNodes, toReactFlowEdge, toReactFlowEdges };
