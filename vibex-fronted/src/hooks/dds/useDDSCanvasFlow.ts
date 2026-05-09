/**
 * useDDSCanvasFlow Hook
 * 封装 React Flow 的 useNodesEdges，处理 data → view 单向同步
 *
 * 职责：
 * - 从 DDSCanvasStore 读取 cards/edges
 * - 转换为 React Flow 的 nodes/edges 格式
 * - 处理 onConnect（创建新边）→ store.addEdge / store.addCrossChapterEdge
 * - 处理 onNodesChange（位置变更）→ store.updateCard
 * - E1-U5: 根据 collapsedGroups 过滤节点可见性
 *
 * Epic 1: F3
 * Epic 4-U1: 跨章节 DAG 边检测
 * Epic 1-U5: 折叠可见性过滤
 * 参考: specs/dds-canvas-state.md §2.3
 */

import { useCallback, useMemo } from 'react';
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
import { useDDSCanvasStore, ddsChapterActions, getVisibleNodes } from '@/stores/dds/DDSCanvasStore';
import type { ChapterType, DDSCard, DDSEdge, ChapterData } from '@/types/dds';

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
  /** 未过滤的原始节点（React Flow state） */
  rawNodes: Node[];
  /** 根据 collapsedGroups 过滤后的可见节点 */
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

  // E1-U5: 读取折叠状态
  const collapsedGroups = useDDSCanvasStore((s) => s.collapsedGroups);

  // E4-U1: 获取所有章节的所有卡片，用于判断跨章节连接
  const allCards = useDDSCanvasStore(
    (s) =>
      (Object.values(s.chapters) as ChapterData[]).flatMap((c) => c.cards) as DDSCard[]
  );

  // React Flow state — 存储原始节点（含被折叠隐藏的）
  const [rawNodes, setNodes] = useNodesState(
    initialNodes ?? toReactFlowNodes(chapterData.cards)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges ?? toReactFlowEdges(chapterData.edges)
  );

  // React Flow 实例（用于 fitView 等）
  useReactFlow();

  // E1-U5: 计算可见节点（根据折叠状态过滤）
  const nodes = useMemo(
    () => getVisibleNodes(rawNodes, collapsedGroups),
    [rawNodes, collapsedGroups]
  );

  // onConnect: 创建新边（E4-U1: 跨章节检测）
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const sourceCard = allCards.find((c) => c.id === connection.source);
      const targetCard = allCards.find((c) => c.id === connection.target);

      if (!sourceCard || !targetCard) return;

      const sourceChapter = (sourceCard as DDSCard & { chapter?: ChapterType }).chapter ?? chapter;
      const targetChapter = (targetCard as DDSCard & { chapter?: ChapterType }).chapter ?? chapter;

      // E4-U1: 判断是否跨章节
      if (sourceChapter !== targetChapter) {
        // 跨章节边：添加到全局 crossChapterEdges
        const newEdge: DDSEdge = {
          id: crypto.randomUUID(),
          source: connection.source,
          target: connection.target,
          type: 'smoothstep',
          animated: true,
          sourceChapter,
          targetChapter,
        };
        ddsChapterActions.addCrossChapterEdge(newEdge);
      } else {
        // 同章节边：添加到 chapter edges（现有行为）
        const newEdge: DDSEdge = {
          id: crypto.randomUUID(),
          source: connection.source,
          target: connection.target,
          type: 'smoothstep',
          animated: true,
        };
        ddsChapterActions.addEdge(chapter, newEdge);

        // 同步到 React Flow
        setEdges((eds) => [
          ...eds,
          {
            ...newEdge,
            source: newEdge.source,
            target: newEdge.target,
          },
        ]);
      }
    },
    [chapter, allCards, setEdges]
  );

  // onNodesChange: 处理节点位置变更
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // 1. 让 React Flow 处理变更（更新本地 nodes state）
      const nextNodes = applyNodeChanges(changes, rawNodes);
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
    [chapter, rawNodes, setNodes]
  );

  return {
    rawNodes,
    nodes,
    edges,
    onNodesChange: handleNodesChange,
    onEdgesChange,
    onConnect: handleConnect,
  };
}

// ==================== Standalone 导出转换函数（供测试/其他 hook 使用）================

export { toReactFlowNode, toReactFlowNodes, toReactFlowEdge, toReactFlowEdges };