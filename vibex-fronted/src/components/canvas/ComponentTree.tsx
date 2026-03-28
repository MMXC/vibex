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

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { useToast } from '@/components/ui/Toast';
import type { ComponentNode, BusinessFlowNode } from '@/lib/canvas/types';
import { ComponentGroupOverlay } from './groups/ComponentGroupOverlay';
import type { ComponentGroupBBox } from './groups/ComponentGroupOverlay';
import styles from './canvas.module.css';

// =============================================================================
// E2: Common Component 工具函数
// =============================================================================

/** Common component flowId values that indicate a reusable/generic component */
const COMMON_FLOW_IDS = new Set(['mock', 'manual', 'common', '__ungrouped__', '']);

/**
 * E2.1: 推断组件是否为通用组件
 * 规则：flowId 为 mock/manual/common/空 或 类型为通用组件类型时视为通用组件
 */
function inferIsCommon(node: ComponentNode): boolean {
  // flowId 为通用标识
  if (COMMON_FLOW_IDS.has(node.flowId) || !node.flowId) {
    return true;
  }
  // 类型为 modal 通常是通用组件
  if (node.type === 'modal') {
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

const GROUP_COLOR = '#10b981';

interface ComponentGroup {
  groupId: string;
  label: string;
  color: string;
  nodes: ComponentNode[];
  isCommon?: boolean;
}

/** 从 flowNodes 中查找页面名称，找不到时返回 "未知页面" */
function getPageLabel(flowId: string, flowNodes: BusinessFlowNode[]): string {
  if (!flowId || flowId === 'mock' || flowId === 'manual' || flowId === 'common') {
    return '未知页面';
  }
  const found = flowNodes.find((f) => f.nodeId === flowId);
  return found ? `📄 ${found.name}` : '未知页面';
}

/**
 * E2.1: 按 flowId 对组件节点分组，通用组件单独置顶分组
 * 规则：
 * - isCommon=true 的组件归入通用组件组（置顶）
 * - 其他组件按 flowId 分组
 */
function groupByFlowId(
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

  // Sort non-common groups: actual flow names first, then unknown pages
  const nonCommonGroups = result.filter(g => !g.isCommon);
  nonCommonGroups.sort((a, b) => {
    const aUnknown = a.label === '未知页面';
    const bUnknown = b.label === '未知页面';
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
  onConfirm: (nodeId: string) => void;
  onEdit: (nodeId: string, data: Partial<ComponentNode>) => void;
  onDelete: (nodeId: string) => void;
  readonly?: boolean;
}

// =============================================================================
// Component Card
// =============================================================================

function ComponentCard({ node, onConfirm, onEdit, onDelete, readonly }: ComponentCardProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [editState, setEditState] = useState({
    name: node.name,
    description: node.props?.['description'] as string || '',
    type: node.type,
  });
  const toast = useToast();

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

  // F3.2: Click to jump — open previewUrl or show toast if unavailable
  const handleNodeClick = useCallback(() => {
    if (readonly) return;
    if (node.previewUrl) {
      window.open(node.previewUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.showToast('该组件暂无预览链接，请先配置 previewUrl', 'error');
    }
  }, [readonly, node.previewUrl, toast]);

  const statusClass =
    node.status === 'confirmed'
      ? styles.nodeConfirmed
      : node.status === 'error'
        ? styles.nodeError
        : node.status === 'generating'
          ? styles.nodeGenerating
          : styles.nodeUnconfirmed;

  const typeColor =
    node.type === 'page'
      ? '#3b82f6'
      : node.type === 'list'
        ? '#8b5cf6'
        : node.type === 'form'
          ? '#f59e0b'
          : node.type === 'detail'
            ? '#10b981'
            : '#ef4444';

  // F3.4: Subtree count for collapsed nodes
  const childCount = node.children?.length ?? 0;
  const hasChildren = childCount > 0;

  return (
    <div
      className={`${styles.nodeCard} ${statusClass} ${hovered ? styles.hovered : ''}`}
      data-node-id={node.nodeId}
      data-status={node.status}
      data-type={node.type}
      data-testid={`component-node-${node.nodeId}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleNodeClick}
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
          <div className={styles.nodeCardHeader}>
            <div className={styles.nodeTypeBadge} style={{ background: typeColor }}>
              {node.type === 'page' ? '页面' : node.type === 'list' ? '列表' : node.type === 'form' ? '表单' : node.type === 'detail' ? '详情' : '弹窗'}
            </div>
            {node.confirmed && (
              <span className={styles.confirmedBadge} aria-label="已确认">✓</span>
            )}
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
              {!node.confirmed && (
                <button
                  type="button"
                  className={styles.confirmButton}
                  onClick={() => onConfirm(node.nodeId)}
                  aria-label={`确认 ${node.name}`}
                >
                  ✓ 确认
                </button>
              )}
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
  const componentNodes = useCanvasStore((s) => s.componentNodes);
  const addComponentNode = useCanvasStore((s) => s.addComponentNode);
  const editComponentNode = useCanvasStore((s) => s.editComponentNode);
  const deleteComponentNode = useCanvasStore((s) => s.deleteComponentNode);
  const confirmComponentNode = useCanvasStore((s) => s.confirmComponentNode);
  const setComponentNodes = useCanvasStore((s) => s.setComponentNodes);
  const flowNodes = useCanvasStore((s) => s.flowNodes);
  const setPhase = useCanvasStore((s) => s.setPhase);

  const [generating, setGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

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

  const handleGenerate = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    // Mock AI generation: simulate API delay
    await new Promise((r) => setTimeout(r, 1200));
    const drafts = mockGenerateComponents(flowNodes.length);
    const newNodes: ComponentNode[] = drafts.map((d, i) => ({
      ...d,
      nodeId: `comp-${Date.now()}-${i}`,
      confirmed: false,
      status: 'pending' as const,
      children: [],
    }));
    setComponentNodes(newNodes);
    setGenerating(false);
  }, [generating, flowNodes.length, setComponentNodes]);

  const handleAdd = useCallback(
    (data: Omit<ComponentNode, 'nodeId' | 'status' | 'confirmed' | 'children'>) => {
      addComponentNode(data);
      setShowAddForm(false);
    },
    [addComponentNode]
  );

  const handleConfirmAll = useCallback(() => {
    componentNodes.forEach((n) => {
      if (!n.confirmed) confirmComponentNode(n.nodeId);
    });
    // When all confirmed, enable project creation phase
    const allConfirmed = componentNodes.every((n) => n.confirmed);
    if (allConfirmed && componentNodes.length > 0) {
      setPhase('prototype');
    }
  }, [componentNodes, confirmComponentNode, setPhase]);

  const allConfirmed = componentNodes.length > 0 && componentNodes.every((n) => n.confirmed);
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
        {allConfirmed && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleConfirmAll}
            aria-label="继续到原型生成"
          >
            继续 → 原型生成
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

                {/* Grouped node cards */}
                <div
                  className={styles.componentGroupCards}
                  data-component-group={group.groupId}
                >
                  {group.nodes.map((node) => (
                    <ComponentCard
                      key={node.nodeId}
                      node={node}
                      onConfirm={confirmComponentNode}
                      onEdit={editComponentNode}
                      onDelete={deleteComponentNode}
                      readonly={readonly}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className={styles.contextTreeEmpty}>
            <span className={styles.emptyIcon}>▣</span>
            <p className={styles.emptyText}>暂无组件</p>
            <p className={styles.emptySubtext}>
              点击「AI 生成组件」自动生成，或手动新增节点
            </p>
          </div>
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
