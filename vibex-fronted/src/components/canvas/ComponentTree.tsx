/**
 * ComponentTree — 组件树组件
 * Epic 4: F4.1 (AI生成) + F4.2 (预览) + F4.3 (编辑) + F4.4 (确认) + F4.6 (上游联动)
 * Epic E1: 组件树页面分组 — 按 flowId 用虚线框分组展示
 *
 * 实现要点：
 * - 垂直列表布局，每个页面一个根节点卡片
 * - 根卡片展开后显示组件列表
 * - 节点状态：pending(黄框) / confirmed(绿框) / error(红框)
 * - CRUD 操作连接 canvasStore
 * - "AI生成"按钮调用 mock API 基于 flow 生成组件节点
 * - E1: 按 flowId 分组，通用组件单独置顶，虚线框包裹
 */
'use client';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Layers } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useToast } from '@/components/ui/Toast';
import { SortableTreeItem } from './features/SortableTreeItem';
import { getHistoryStore } from '@/lib/canvas/historySlice';
import { useModifierKey, useDragSelection } from '@/hooks/canvas/useDragSelection';
import type { ComponentNode, BusinessFlowNode } from '@/lib/canvas/types';
import { ComponentGroupOverlay } from './groups/ComponentGroupOverlay';
import type { ComponentGroupBBox } from './groups/ComponentGroupOverlay';
import styles from './canvas.module.css';

// =============================================================================
// E2: Common Component 工具函数
// =============================================================================

/** Common component flowId values that indicate a reusable/generic component */
const COMMON_FLOW_IDS = new Set(['mock', 'manual', 'common', '__ungrouped__', '']);

/** Common component types — 通用组件类型列表 */
const COMMON_COMPONENT_TYPES = new Set([
  'modal', 'button', 'input', 'select', 'checkbox', 'radio',
  'badge', 'tag', 'tooltip', 'dropdown', 'avatar', 'spinner',
  'switch', 'slider', 'datepicker', 'timepicker', 'colorpicker',
  'tabs', 'accordion', 'breadcrumb', 'pagination', 'progress',
  'alert', 'toast', 'loading', 'skeleton',
]);

/**
 * E2.1: 推断组件是否为通用组件（多维判断）
 * 规则：
 * 1. flowId 为 mock/manual/common/空 → 通用
 * 2. 组件类型为通用类型 → 通用
 * 3. 否则 → 非通用（按 flowId 分组到具体页面）
 */
export function inferIsCommon(node: ComponentNode): boolean {
  // 1. flowId 为通用标识
  if (COMMON_FLOW_IDS.has(node.flowId) || !node.flowId) {
    return true;
  }
  // 2. 组件类型为通用组件类型
  if (COMMON_COMPONENT_TYPES.has(node.type)) {
    return true;
  }
  return false;
}

/** Common component group label */
const COMMON_GROUP_LABEL = '🔧 通用组件';

/** Common component group color - distinct from regular components */
const COMMON_GROUP_COLOR = '#8b5cf6'; // purple for common/reusable components

// =============================================================================
// E1: 分组工具函数 (已扩展支持 E2)
// =============================================================================

// E1: 分组工具函数 (已扩展支持 E2)
// =============================================================================

const GROUP_COLOR = '#10b981';

export interface ComponentGroup {
  groupId: string;
  label: string;
  color: string;
  nodes: ComponentNode[];
  isCommon?: boolean;
}

/**
 * 共享匹配函数 — 支持多级 fallback
 * 优先级：精确匹配 → prefix匹配 → 名称模糊匹配
 * 用于 getPageLabel 和其他需要 flowId→flowNode 映射的场景
 */
export function matchFlowNode(
  flowId: string,
  flowNodes: BusinessFlowNode[]
): BusinessFlowNode | null {
  // Guard: empty flowId cannot match anything
  if (!flowId) return null;

  // 1. 精确匹配 nodeId
  const exact = flowNodes.find((f) => f.nodeId === flowId);
  if (exact) return exact;

  // 2. Prefix 匹配（flowId 是 flow.nodeId 的前缀或反之）
  const prefixMatch = flowNodes.find(
    (f) => flowId.startsWith(f.nodeId + '-') || f.nodeId.startsWith(flowId + '-')
  );
  if (prefixMatch) return prefixMatch;

  // 3. 名称模糊匹配（忽略空格/中划线/下划线）
  const normalizedFlowId = flowId.toLowerCase().replace(/[\s\-_]/g, '');
  return (
    flowNodes.find((f) => {
      const normalizedName = f.name.toLowerCase().replace(/[\s\-_]/g, '');
      return (
        normalizedName.includes(normalizedFlowId) ||
        normalizedFlowId.includes(normalizedName)
      );
    }) || null
  );
}

/**
 * 从 flowNodes 中查找页面名称，支持多级 fallback 匹配
 * 优先级：精确匹配 → prefix匹配 → 名称模糊匹配 → 兜底显示 flowId
 */
export function getPageLabel(flowId: string, flowNodes: BusinessFlowNode[]): string {
  // 0. 通用组件标识 → 使用通用组件标签
  if (!flowId || COMMON_FLOW_IDS.has(flowId)) {
    return COMMON_GROUP_LABEL;
  }

  // 1. 精确匹配 nodeId
  const matched = matchFlowNode(flowId, flowNodes);
  if (matched) return `📄 ${matched.name}`;

  // 2. 兜底：显示 flowId 前缀
  const shortId = flowId.length > 12 ? flowId.slice(0, 12) + '…' : flowId;
  return `❓ ${shortId}`;
}

/**
 * E1+E2: 按 flowId 对组件节点分组，通用组件单独置顶分组
 * 规则：
 * - isCommon=true 的组件归入通用组件组（置顶）
 * - 其他组件按 flowId 分组
 */
export function groupByFlowId(
  nodes: ComponentNode[],
  flowNodes: BusinessFlowNode[]
): ComponentGroup[] {
  // E2: Separate common components from page-specific components
  const commonNodes: ComponentNode[] = [];
  const pageNodes: ComponentNode[] = [];

  for (const node of nodes) {
    if (inferIsCommon(node)) {
      commonNodes.push(node);
    } else {
      pageNodes.push(node);
    }
  }

  // Build groups for page-specific components
  const groups: Map<string, ComponentNode[]> = new Map();
  for (const node of pageNodes) {
    const key = node.flowId || '__ungrouped__';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(node);
  }

  const result: ComponentGroup[] = [];

  // E2: Add common components as first group (pinned to top)
  if (commonNodes.length > 0) {
    result.push({
      groupId: '__common__',
      label: COMMON_GROUP_LABEL,
      color: COMMON_GROUP_COLOR,
      nodes: commonNodes,
      isCommon: true,
    });
  }

  // Add page-specific groups
  groups.forEach((groupNodes, flowId) => {
    result.push({
      groupId: flowId,
      label: getPageLabel(flowId, flowNodes),
      color: GROUP_COLOR,
      nodes: groupNodes,
      isCommon: false,
    });
  });

  // Sort non-common groups: actual flow names first, then unknown pages (❓ prefix)
  const nonCommonGroups = result.filter(g => !g.isCommon);
  nonCommonGroups.sort((a, b) => {
    const aUnknown = a.label.startsWith('❓');
    const bUnknown = b.label.startsWith('❓');
    if (aUnknown && !bUnknown) return 1;
    if (!aUnknown && bUnknown) return -1;
    return 0;
  });

  // E2: Common group is already first, so rebuild result
  return [
    ...result.filter(g => g.isCommon),
    ...nonCommonGroups,
  ];
}

// =============================================================================
// Mock AI Component Generation
// =============================================================================

const MOCK_COMPONENT_TEMPLATES: Array<Omit<ComponentNode, 'nodeId' | 'status' | 'confirmed' | 'children'>> = [
  {
    flowId: 'mock',
    name: '首页',
    type: 'page',
    props: { layout: 'full-width', theme: 'light' },
    api: { method: 'GET', path: '/api/home', params: [] },
    previewUrl: undefined,
  },
  {
    flowId: 'mock',
    name: '列表页',
    type: 'list',
    props: { layout: 'container', theme: 'light' },
    api: { method: 'GET', path: '/api/list', params: [] },
    previewUrl: undefined,
  },
  {
    flowId: 'mock',
    name: '详情页',
    type: 'detail',
    props: { layout: 'container', theme: 'light' },
    api: { method: 'GET', path: '/api/detail', params: [] },
    previewUrl: undefined,
  },
  {
    flowId: 'mock',
    name: '表单页',
    type: 'form',
    props: { layout: 'full-width', theme: 'light' },
    api: { method: 'POST', path: '/api/form', params: [] },
    previewUrl: undefined,
  },
  {
    flowId: 'mock',
    name: '弹窗',
    type: 'modal',
    props: { size: 'md', overlay: true },
    api: { method: 'GET', path: '/api/modal', params: [] },
    previewUrl: undefined,
  },
];

function mockGenerateComponents(flowNodesCount: number): Array<Omit<ComponentNode, 'nodeId' | 'status' | 'confirmed' | 'children'>> {
  const count = Math.max(2, Math.min(flowNodesCount + 2, 6));
  const shuffled = [...MOCK_COMPONENT_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// =============================================================================
// Types
// =============================================================================

interface ComponentTreeProps {
  /** 是否为只读模式 */
  readonly?: boolean;
  /** 是否为激活状态 */
  isActive?: boolean;
}

interface ComponentCardProps {
  node: ComponentNode;
  onEdit: (nodeId: string, data: Partial<ComponentNode>) => void;
  onDelete: (nodeId: string) => void;
  readonly?: boolean;
  /** E3-F2: Multi-select state */
  selected?: boolean;
  /** E3-F2: Multi-select toggle */
  onToggleSelect?: (nodeId: string) => void;
}

// =============================================================================
// Component Card
// =============================================================================

function ComponentCard({ node, onEdit, onDelete, readonly, selected, onToggleSelect }: ComponentCardProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [editState, setEditState] = useState({
    name: node.name,
    description: node.props?.['description'] as string || '',
    type: node.type,
  });
  const toast = useToast();
  const isModifierRef = useModifierKey();

  const handleSave = useCallback(() => {
    onEdit(node.nodeId, {
      name: editState.name,
      type: editState.type as ComponentNode['type'],
      props: { ...node.props, description: editState.description },
    });
    setEditing(false);
  }, [node.nodeId, node.props, editState, onEdit]);

  const handleCancel = useCallback(() => {
    setEditState({ name: node.name, description: node.props?.['description'] as string || '', type: node.type });
    setEditing(false);
  }, [node]);

  // F4: Ctrl/Cmd+click on card — toggle multi-selection; otherwise navigate to preview
  const handleNodeClick = useCallback(
    (e: React.MouseEvent) => {
      if (editing) return;
      // F4: Ctrl/Cmd+click → toggle selection, no navigation
      if (e.ctrlKey || e.metaKey || isModifierRef.current) {
        e.stopPropagation();
        onToggleSelect?.(node.nodeId);
        return;
      }
      // Normal click → navigate to preview
      if (readonly) return;
      if (node.previewUrl) {
        window.open(node.previewUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.showToast('该组件暂无预览链接，请先配置 previewUrl', 'error');
      }
    },
    [editing, readonly, node.previewUrl, node.nodeId, toast, onToggleSelect, isModifierRef]
  );

  const statusClass =
    node.status === 'confirmed'
      ? styles.nodeConfirmed
      : node.status === 'error'
        ? styles.nodeError
        : node.status === 'generating'
          ? styles.nodeGenerating
          : styles.nodeUnconfirmed;

  // F3.4: Subtree count for collapsed nodes
  const childCount = node.children?.length ?? 0;
  const hasChildren = childCount > 0;

  return (
    <div
      className={`${styles.nodeCard} ${statusClass} ${hovered ? styles.hovered : ''} ${selected ? styles.nodeCardSelected : ''}`}
      data-node-id={node.nodeId}
      data-status={node.status}
      data-type={node.type}
      data-testid={`component-node-${node.nodeId}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleNodeClick}
      onKeyDown={(e) => {
        // F4: Enter/Space also triggers click when card is focused
        if (e.key === 'Enter' || e.key === ' ') {
          handleNodeClick(e as unknown as React.MouseEvent);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`组件卡片 ${node.name}${selected ? '，已选中' : ''}`}
    >
      {editing ? (
        /* Edit mode */
        <div className={styles.nodeEditForm}>
          <input
            type="text"
            className={styles.nodeEditInput}
            value={editState.name}
            onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
            placeholder="组件名称"
            aria-label="组件名称"
          />
          <textarea
            className={styles.nodeEditTextarea}
            value={editState.description}
            onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
            placeholder="描述"
            rows={2}
            aria-label="组件描述"
          />
          <div className={styles.nodeEditActions}>
            <button type="button" className={styles.primaryButton} onClick={handleSave}>
              保存
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleCancel}>
              取消
            </button>
          </div>
        </div>
      ) : (
        /* View mode */
        <>
          {/* E2: checkbox + title 同一行 */}
          <div className={styles.nodeCardHeader}>
            {onToggleSelect && (
              <input
                type="checkbox"
                className={styles.confirmCheckbox}
                checked={selected ?? false}
                onChange={() => { onToggleSelect(node.nodeId); }}
                aria-label="选择节点"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <h4
              className={styles.nodeCardTitle}
              style={{ cursor: node.previewUrl ? 'pointer' : 'default' }}
              title={
                node.previewUrl
                  ? `跳转到 ${node.previewUrl}`
                  : undefined
              }
            >
              {node.name}
            </h4>
            <button
              type="button"
              className={styles.expandButton}
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-label={expanded ? '收起' : '展开'}
              data-testid={`expand-toggle-${node.nodeId}`}
            >
              {expanded ? '▲' : `▼${hasChildren ? ` (${childCount})` : ''}`}
            </button>
          </div>

          {expanded && (
            <div className={styles.componentDetails}>
              {node.props && Object.keys(node.props).length > 0 && (
                <div className={styles.componentProps}>
                  {Object.entries(node.props).map(([key, value]) => (
                    <span key={key} className={styles.propBadge}>
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              )}
              {node.api && (
                <div className={styles.componentApi}>
                  <span className={styles.apiMethod}>{node.api.method}</span>
                  <span className={styles.apiPath}>{node.api.path}</span>
                </div>
              )}
            </div>
          )}

          {!readonly && (
            <div className={styles.nodeCardActions}>
              {/* E2-F8: Prototype preview — navigate to editor with componentId */}
              <button
                type="button"
                className={styles.previewButton}
                onClick={() => {
                  const url = `/editor?componentId=${encodeURIComponent(node.nodeId)}`;
                  window.location.href = url;
                }}
                aria-label={`预览 ${node.name} 原型`}
                title={`预览原型 (跳转 /editor?componentId=${node.nodeId})`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                预览
              </button>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setEditing(true)}
                aria-label={`编辑 ${node.name}`}
              >
                编辑
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => onDelete(node.nodeId)}
                aria-label={`删除 ${node.name}`}
              >
                删除
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// Add Node Form
// =============================================================================

interface AddComponentFormProps {
  onAdd: (data: Omit<ComponentNode, 'nodeId' | 'status' | 'confirmed' | 'children'>) => void;
}

function AddComponentForm({ onAdd }: AddComponentFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ComponentNode['type']>('page');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      onAdd({
        flowId: 'manual',
        name: name.trim(),
        type,
        props: {},
        api: { method: 'GET', path: '/api/' + name.toLowerCase().replace(/\s+/g, '-'), params: [] },
        previewUrl: undefined,
      });
      setName('');
    },
    [name, type, onAdd]
  );

  return (
    <form className={styles.addNodeForm} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles.nodeEditInput}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="组件名称"
        aria-label="组件名称"
        required
      />
      <div className={styles.addNodeFormRow}>
        <select
          className={styles.typeSelect}
          value={type}
          onChange={(e) => setType(e.target.value as ComponentNode['type'])}
          aria-label="组件类型"
        >
          <option value="page">页面</option>
          <option value="list">列表</option>
          <option value="form">表单</option>
          <option value="detail">详情</option>
          <option value="modal">弹窗</option>
        </select>
        <button type="submit" className={styles.primaryButton}>
          + 新增节点
        </button>
      </div>
    </form>
  );
}

// =============================================================================
// ComponentTree
// =============================================================================

export function ComponentTree({ readonly = false, isActive: _isActive = true }: ComponentTreeProps) {
  const comp = useComponentStore();
  const componentNodes = comp.componentNodes;
  const addComponentNode = comp.addComponentNode;
  const editComponentNode = comp.editComponentNode;
  const deleteComponentNode = comp.deleteComponentNode;
  const setComponentNodes = comp.setComponentNodes;
  const selectedNodeIds_comp = comp.selectedNodeIds;
  const toggleNodeSelect_comp = comp.toggleNodeSelect;
  const selectAllNodes_comp = comp.selectAllNodes;
  const clearNodeSelection_comp = comp.clearNodeSelection;
  const deleteSelectedNodes_comp = comp.deleteSelectedNodes;

  const flowNodes = useFlowStore((s) => s.flowNodes);
  const setPhase = useContextStore((s) => s.setPhase);

  const selectedIds = new Set(selectedNodeIds_comp);
  const selectedCount = selectedIds.size;

  const [generating, setGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const toast = useToast();

  // E1: Compute groups by flowId
  const groups = useMemo(
    () => groupByFlowId(componentNodes, flowNodes),
    [componentNodes, flowNodes]
  );

  // E1: Compute SVG overlay bounding boxes (E2: include isCommon for styling)
  const overlayGroups = useMemo<ComponentGroupBBox[]>(() => {
    return groups.map((g) => ({
      groupId: g.groupId,
      label: g.label,
      color: g.color,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      isCommon: g.isCommon,
    }));
  }, [groups]);

  const containerRef = useRef<HTMLDivElement>(null);

  // F4: Drag selection (框选) — uses same containerRef
  const { selectionBox } = useDragSelection({
    onSelectionChange: (nodeIds) => {
      nodeIds.forEach((id) => {
        if (!selectedIds.has(id)) {
          toggleNodeSelect_comp(id);
        }
      });
    },
    getNodePositions: () => {
      const container = containerRef.current;
      if (!container) return [];
      const nodeEls = container.querySelectorAll<HTMLElement>('[data-node-id]');
      return Array.from(nodeEls).map((el) => ({
        id: el.getAttribute('data-node-id')!,
        rect: el.getBoundingClientRect(),
      }));
    },
    enabled: !readonly && componentNodes.length > 0,
  });

  // E2-F7: Drag sensors — mouse and touch support
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  // E2-F7: Reorder component nodes on drag end
  const handleComponentDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = componentNodes.findIndex((n) => n.nodeId === active.id);
      const newIndex = componentNodes.findIndex((n) => n.nodeId === over.id);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      // Record undo snapshot before reordering
      const historyStore = getHistoryStore();
      historyStore.recordSnapshot('component', componentNodes);

      // Reorder nodes
      const newNodes = [...componentNodes];
      const [moved] = newNodes.splice(oldIndex, 1);
      newNodes.splice(newIndex, 0, moved);
      setComponentNodes(newNodes);
    },
    [componentNodes, setComponentNodes]
  );

  const handleGenerate = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    try {
      // Mock AI generation: simulate API delay
      await new Promise((r) => setTimeout(r, 1200));
      const drafts: Array<Omit<ComponentNode, 'nodeId' | 'status' | 'confirmed' | 'children'>> = mockGenerateComponents(flowNodes.length);
      const newNodes: ComponentNode[] = drafts.map((d, i) => ({
        ...d,
        nodeId: `comp-${Date.now()}-${i}`,
        confirmed: false,
        status: 'pending' as const,
        children: [],
      }));
      setComponentNodes(newNodes);
    } catch (err) {
      canvasLogger.ComponentTree.error(' handleGenerate error:', err);
      toast.showToast(err instanceof Error ? err.message : '生成组件失败', 'error');
    } finally {
      setGenerating(false);
    }
  }, [generating, flowNodes.length, setComponentNodes, toast]);

  const handleAdd = useCallback(
    (data: Omit<ComponentNode, 'nodeId' | 'status' | 'confirmed' | 'children'>) => {
      addComponentNode(data);
      setShowAddForm(false);
    },
    [addComponentNode]
  );



  const handleClearCanvas = useCallback(() => {
    if (window.confirm('确定清空画布？所有组件将被删除。')) {
      comp.clearComponentCanvas();
    }
  }, []);

  const allConfirmed = componentNodes.length > 0 && componentNodes.every((n) => n.isActive !== false);
  const hasNodes = componentNodes.length > 0;

  return (
    <div className={styles.componentTree} aria-label="组件树" data-testid="component-tree">
      {/* Generation Controls */}
      <div className={styles.contextTreeControls}>
        <button
          type="button"
          className={`${styles.primaryButton} ${generating ? styles.buttonLoading : ''}`}
          onClick={handleGenerate}
          disabled={generating || readonly}
          aria-label="AI 生成组件"
        >
          {generating ? '◌ 生成中...' : '◈ AI 生成组件'}
        </button>
        {/* Bug4c: 重新生成组件树按钮 */}
        {hasNodes && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleGenerate}
            disabled={generating || readonly}
            title="基于流程树重新生成组件树"
          >
            {generating ? '◌ 重新生成中...' : '🔄 重新生成组件树'}
          </button>
        )}
        {hasNodes && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setPhase('prototype')}
            aria-label="继续到原型生成"
          >
            继续到原型生成
          </button>
        )}
        {!readonly && !showAddForm && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setShowAddForm(true)}
            aria-label="手动新增组件"
          >
            + 手动新增
          </button>
        )}

        {/* F001+F002: 全选 / 取消全选 — 独立条件按钮 */}
        {hasNodes && (
          selectedCount === 0 ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => selectAllNodes_comp()}
              aria-label="全选所有组件"
            >
              ⊞ 全选
            </button>
          ) : (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => clearNodeSelection_comp()}
              aria-label="取消全选所有组件"
            >
              ⊠ 取消全选
            </button>
          )
        )}

        {/* F003: 清空画布 */}
        {hasNodes && !readonly && (
          <button
            type="button"
            className={styles.dangerButton}
            onClick={handleClearCanvas}
            aria-label="清空画布"
            title="清空画布（可撤销）"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: '4px' }}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
            清空画布
          </button>
        )}

        {/* E3-F2: Multi-select controls */}
        {hasNodes && (
          <div className={styles.multiSelectControls}>
            {selectedCount > 0 ? (
              <>
                <span className={styles.selectionCount}>{selectedCount} 已选</span>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => clearNodeSelection_comp()}
                  aria-label="取消选择"
                >
                  取消选择
                </button>
                {!readonly && (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => {
                      getHistoryStore().recordSnapshot('component', componentNodes);
                      deleteSelectedNodes_comp();
                    }}
                    aria-label={`删除 ${selectedCount} 个选中节点`}
                  >
                    删除 ({selectedCount})
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => selectAllNodes_comp()}
                aria-label="全选"
              >
                全选
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Node Form */}
      {showAddForm && (
        <div className={styles.addNodeFormWrapper}>
          <AddComponentForm onAdd={handleAdd} />
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => setShowAddForm(false)}
          >
            取消
          </button>
        </div>
      )}

      {/* Node List — E1: Grouped by flowId */}
      <div
        ref={containerRef}
        className={styles.componentNodeList}
        role="list"
        aria-label="组件节点列表"
        style={{ position: 'relative' }}
      >
        {hasNodes ? (
          <>
            {/* E1: SVG dashed border overlay */}
            {groups.length > 0 && (
              <ComponentGroupOverlay
                containerRef={containerRef}
                groups={overlayGroups}
                strokeColor={GROUP_COLOR}
              />
            )}
            {/* F4: Drag selection box overlay */}
            {selectionBox && (
              <div
                className={styles.dragSelectionBox}
                style={{
                  left: selectionBox.left,
                  top: selectionBox.top,
                  width: selectionBox.width,
                  height: selectionBox.height,
                }}
                aria-hidden="true"
              />
            )}

            {/* E1: Render each group (E2: common group pinned to top) */}
            {groups.map((group) => (
              <div
                key={group.groupId}
                data-component-group-wrapper="true"
                data-is-common={group.isCommon ? 'true' : 'false'}
                className={styles.componentGroup}
                role="group"
                aria-label={group.label}
                style={{
                  borderColor: group.color,
                  backgroundColor: `${group.color}08`,
                }}
              >
                {/* Group label (E2: add data-is-common for styling) */}
                <div
                  className={styles.componentGroupLabel}
                  data-group-label={group.label}
                  data-is-common={group.isCommon ? 'true' : 'false'}
                  style={{
                    color: group.color,
                    borderColor: group.color,
                    backgroundColor: `${group.color}15`,
                  }}
                >
                  {group.label}
                  <span
                    style={{
                      marginLeft: '6px',
                      opacity: 0.6,
                      fontSize: '10px',
                    }}
                  >
                    ({group.nodes.length})
                  </span>
                </div>

                {/* E2-F7: DndContext for this group's draggable cards */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleComponentDragEnd}
                >
                  <SortableContext
                    items={group.nodes.map((n) => n.nodeId)}
                    strategy={verticalListSortingStrategy}
                  >
                    {/* Grouped node cards */}
                    <div
                      className={styles.componentGroupCards}
                      data-component-group={group.groupId}
                    >
                      {group.nodes.map((node) => (
                        <SortableTreeItem
                          key={node.nodeId}
                          options={{ id: node.nodeId, disabled: readonly }}
                          treeType="component"
                          label={node.name}
                        >
                          <ComponentCard
                            node={node}
                            onEdit={editComponentNode}
                            onDelete={deleteComponentNode}
                            readonly={readonly}
                            selected={selectedIds.has(node.nodeId)}
                            onToggleSelect={(nodeId) => toggleNodeSelect_comp(nodeId)}
                          />
                        </SortableTreeItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            ))}
          </>
        ) : (
          <EmptyState
            icon={Layers}
            title="暂无组件"
            description="点击「AI 生成组件」自动生成，或手动新增节点"
          />
        )}
      </div>

      {/* Phase hint */}
      {hasNodes && !allConfirmed && (
        <p className={styles.contextTreeHint}>
          确认所有组件节点后，将解锁原型生成队列
        </p>
      )}
    </div>
  );
}
