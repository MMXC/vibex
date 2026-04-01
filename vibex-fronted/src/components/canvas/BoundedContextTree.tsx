/**
 * BoundedContextTree — 限界上下文树组件
 * Epic 2: S2.1 (AI生成) + S2.2 (CRUD) + S2.3 (级联标记)
 *
 * 实现要点：
 * - 垂直列表布局，每个节点一个卡片
 * - 节点状态：pending(黄框) / confirmed(绿框) / error(红框)
 * - CRUD 操作连接 canvasStore
 * - "AI生成"按钮调用 mock API 生成上下文节点
 */
'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { RelationshipConnector } from './edges/RelationshipConnector';
import { BoundedContextGroup } from './BoundedContextGroup';
import { BoundedEdgeLayer } from './edges/BoundedEdgeLayer';
import { useModifierKey, useDragSelection } from '@/hooks/canvas/useDragSelection';
import type { BoundedContextNode, BoundedContextDraft, NodeRect, BoundedEdge } from '@/lib/canvas/types';
import styles from './canvas.module.css';

// Context card dimensions for node rect computation
const CTX_CARD_APPROX_WIDTH = 240;
const CTX_CARD_APPROX_HEIGHT = 120;

/**
 * inferBoundedEdges — Epic 2 F3.2: Auto-infer bounded context edges from domain type
 *
 * Rules:
 * - core → supporting / supporting → core: dependency
 * - core → core: calls
 * - generic → core: dependency
 * - supporting ↔ generic: association
 */
function inferBoundedEdges(contextNodes: BoundedContextNode[]): BoundedEdge[] {
  const edges: BoundedEdge[] = [];
  let idx = 0;

  for (let i = 0; i < contextNodes.length; i++) {
    for (let j = i + 1; j < contextNodes.length; j++) {
      const a = contextNodes[i];
      const b = contextNodes[j];

      let relType: BoundedEdge['type'] = 'dependency';

      // core ↔ supporting = dependency
      if ((a.type === 'core' && b.type === 'supporting') ||
          (a.type === 'supporting' && b.type === 'core')) {
        relType = 'dependency';
      }
      // generic ↔ core = dependency
      else if ((a.type === 'generic' && b.type === 'core') ||
               (a.type === 'core' && b.type === 'generic')) {
        relType = 'dependency';
      }
      // core ↔ core = calls
      else if (a.type === 'core' && b.type === 'core') {
        relType = 'dependency'; // composition relationship
      }
      // supporting ↔ generic / supporting ↔ supporting = association
      else if ((a.type === 'supporting' && b.type === 'supporting') ||
               (a.type === 'supporting' && b.type === 'generic') ||
               (a.type === 'generic' && b.type === 'supporting')) {
        relType = 'association';
      }
      // external ↔ anything = dependency
      else if (a.type === 'external' || b.type === 'external') {
        relType = 'dependency';
      }

      edges.push({
        id: `bounded-edge-${idx++}`,
        from: { groupId: a.nodeId },
        to: { groupId: b.nodeId },
        type: relType,
      });
    }
  }

  return edges;
}

// =============================================================================
// Mock AI Context Generation
// =============================================================================

const MOCK_CONTEXT_TEMPLATES: BoundedContextDraft[] = [
  { name: '患者管理', description: '管理患者基本信息、就诊记录、病历档案', type: 'core' },
  { name: '预约挂号', description: '处理患者预约、医生排班、号源管理', type: 'core' },
  { name: '在线问诊', description: '图文/视频问诊、医患聊天、处方开具', type: 'core' },
  { name: '支付结算', description: '诊金支付、医保结算、发票管理', type: 'supporting' },
  { name: '通知中心', description: '短信/推送通知、预约提醒、报告通知', type: 'supporting' },
  { name: '数据分析', description: '运营统计、就诊报表、收入分析', type: 'generic' },
];

function mockGenerateContexts(_requirement: string): BoundedContextDraft[] {
  // Mock: return 3-6 random templates
  const count = Math.floor(Math.random() * 4) + 3;
  const shuffled = [...MOCK_CONTEXT_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// =============================================================================
// Types
// =============================================================================

interface BoundedContextTreeProps {
  /** 是否为只读模式 */
  readonly?: boolean;
  /** 是否为激活状态 */
  isActive?: boolean;
}

interface NodeEditState {
  nodeId: string;
  name: string;
  description: string;
}

// =============================================================================
// Context Node Card
// =============================================================================

interface ContextCardProps {
  node: BoundedContextNode;
  onEdit: (nodeId: string, data: Partial<BoundedContextNode>) => void;
  onDelete: (nodeId: string) => void;
  readonly?: boolean;
  /** F4: 多选状态 */
  selected?: boolean;
  /** F4: 多选切换回调 */
  onToggleSelect?: (nodeId: string) => void;
}

function ContextCard({ node, onEdit, onDelete, readonly, selected, onToggleSelect }: ContextCardProps) {
  const [editing, setEditing] = useState(false);
  const [editState, setEditState] = useState<NodeEditState>({
    nodeId: node.nodeId,
    name: node.name,
    description: node.description,
  });
  const isModifierRef = useModifierKey();

  const handleSave = useCallback(() => {
    onEdit(node.nodeId, { name: editState.name, description: editState.description });
    setEditing(false);
  }, [node.nodeId, editState, onEdit]);

  const handleCancel = useCallback(() => {
    setEditState({ nodeId: node.nodeId, name: node.name, description: node.description });
    setEditing(false);
  }, [node]);

  // F4: Ctrl/Cmd+click on card body toggles multi-selection
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (editing) return;
      if (e.ctrlKey || e.metaKey || isModifierRef.current) {
        e.stopPropagation();
        onToggleSelect?.(node.nodeId);
      }
    },
    [editing, node.nodeId, onToggleSelect, isModifierRef]
  );

  const statusClass =
    node.status === 'confirmed'
      ? styles.nodeConfirmed
      : node.status === 'error'
        ? styles.nodeError
        : node.status === 'generating'
          ? styles.nodeGenerating
          : styles.nodeUnconfirmed;

  const typeColor =
    node.type === 'core'
      ? '#f59e0b'
      : node.type === 'supporting'
        ? '#3b82f6'
        : node.type === 'generic'
          ? '#6b7280'
          : '#8b5cf6';

  return (
    <div
      className={`${styles.nodeCard} ${statusClass} ${selected ? styles.nodeCardSelected : ''}`}
      data-node-id={node.nodeId}
      data-status={node.status}
      data-type={node.type}
      onClick={handleCardClick}
    >
      {editing ? (
        /* Edit mode */
        <div className={styles.nodeEditForm}>
          <input
            type="text"
            className={styles.nodeEditInput}
            value={editState.name}
            onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
            placeholder="上下文名称"
            aria-label="上下文名称"
          />
          <textarea
            className={styles.nodeEditTextarea}
            value={editState.description}
            onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
            placeholder="描述"
            rows={2}
            aria-label="上下文描述"
          />
          <div className={styles.nodeEditActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSave}
            >
              保存
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleCancel}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        /* View mode */
        <>
          {/* S1.1: Removed selection checkbox — multi-select still works via Ctrl+click on card body */}
          <div className={styles.nodeCardHeader}>
            {!readonly && (
              <input
                type="checkbox"
                checked={node.isActive !== false}
                onChange={() => onEdit(node.nodeId, { isActive: node.isActive === false ? true : false })}
                aria-label={`激活 ${node.name}`}
                className={styles.confirmCheckbox}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className={styles.nodeTypeBadge} style={{ background: typeColor }}>
              {node.type === 'core'
                ? '核心'
                : node.type === 'supporting'
                  ? '支撑'
                  : node.type === 'generic'
                    ? '通用'
                    : '外部'}
            </div>
          </div>
          <h4 className={styles.nodeCardTitle}>{node.name}</h4>
          <p className={styles.nodeCardDesc}>{node.description}</p>
          {!readonly && (
            <div className={styles.nodeCardActions}>
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

interface AddNodeFormProps {
  onAdd: (data: BoundedContextDraft) => void;
}

function AddNodeForm({ onAdd }: AddNodeFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<BoundedContextNode['type']>('core');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      onAdd({ name: name.trim(), description: description.trim(), type });
      setName('');
      setDescription('');
      setType('core');
    },
    [name, description, type, onAdd]
  );

  return (
    <form className={styles.addNodeForm} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles.nodeEditInput}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="上下文名称"
        aria-label="上下文名称"
        required
      />
      <textarea
        className={styles.nodeEditTextarea}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="描述（可选）"
        rows={2}
        aria-label="上下文描述"
      />
      <div className={styles.addNodeFormRow}>
        <select
          className={styles.typeSelect}
          value={type}
          onChange={(e) => setType(e.target.value as BoundedContextNode['type'])}
          aria-label="上下文类型"
        >
          <option value="core">核心</option>
          <option value="supporting">支撑</option>
          <option value="generic">通用</option>
          <option value="external">外部</option>
        </select>
        <button type="submit" className={styles.primaryButton}>
          + 新增节点
        </button>
      </div>
    </form>
  );
}

// =============================================================================
// BoundedContextTree
// =============================================================================

export function BoundedContextTree({ readonly = false, isActive: _isActive = true }: BoundedContextTreeProps) {
  const contextNodes = useCanvasStore((s) => s.contextNodes);
  const addContextNode = useCanvasStore((s) => s.addContextNode);
  const editContextNode = useCanvasStore((s) => s.editContextNode);
  const deleteContextNode = useCanvasStore((s) => s.deleteContextNode);
  const setContextNodes = useCanvasStore((s) => s.setContextNodes);
  const advancePhase = useCanvasStore((s) => s.advancePhase);

  // F3-F10: Multi-select state
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const toggleNodeSelect = useCanvasStore((s) => s.toggleNodeSelect);
  const clearNodeSelection = useCanvasStore((s) => s.clearNodeSelection);
  const deleteSelectedNodes = useCanvasStore((s) => s.deleteSelectedNodes);

  const selectedIds = new Set(selectedNodeIds.context);
  const selectedCount = selectedIds.size;

  const [generating, setGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // === Epic 2 F3.2: BoundedEdgeLayer integration ===
  // DOM measurement for BoundedEdgeLayer node rects
  // Compute node rects inside ResizeObserver to avoid ref access during render (ESLint react-hooks/refs)
  const [nodeRects, setNodeRects] = useState<NodeRect[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const computeRects = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const cardEls = containerRef.current.querySelectorAll<HTMLElement>('[data-node-id]');
      const rects: NodeRect[] = Array.from(cardEls)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            id: el.getAttribute('data-node-id')!,
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: el.offsetWidth || CTX_CARD_APPROX_WIDTH,
            height: el.offsetHeight || CTX_CARD_APPROX_HEIGHT,
          };
        })
        .filter((r) => contextNodes.some((n) => n.nodeId === r.id));
      setNodeRects(rects);
    };

    const observer = new ResizeObserver(() => {
      computeRects();
    });
    observer.observe(containerRef.current);
    // Initial measurement
    computeRects();
    return () => observer.disconnect();
  }, [contextNodes]);

  // Auto-infer bounded edges from context nodes (F3.2)
  const boundedEdges = useMemo(() => inferBoundedEdges(contextNodes), [contextNodes]);

  const handleGenerate = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    // Mock AI generation: simulate API delay
    await new Promise((r) => setTimeout(r, 1200));
    const drafts = mockGenerateContexts('');
    // Convert drafts to BoundedContextNodes
    const newNodes: BoundedContextNode[] = drafts.map((d, i) => ({
      nodeId: `ctx-${Date.now()}-${i}`,
      name: d.name,
      description: d.description,
      type: d.type,
      confirmed: false,
      status: 'pending' as const,
      children: [],
    }));
    setContextNodes(newNodes);
    setGenerating(false);
  }, [generating, setContextNodes]);

  const handleAdd = useCallback(
    (data: BoundedContextDraft) => {
      addContextNode(data);
      setShowAddForm(false);
    },
    [addContextNode]
  );

  const handleConfirmAll = useCallback(() => {
      // Advance phase (no confirm gating in Epic 3)
    advancePhase();
  }, [contextNodes, advancePhase]);

  const allConfirmed = contextNodes.length > 0 && contextNodes.every((n) => n.isActive !== false);
  const hasNodes = contextNodes.length > 0;

  // F4: Drag selection (框选) — uses same containerRef
  const { selectionBox } = useDragSelection({
    onSelectionChange: (nodeIds) => {
      // Add all nodes in box to selection (additive)
      nodeIds.forEach((id) => {
        if (!selectedIds.has(id)) {
          toggleNodeSelect('context', id);
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
    enabled: !readonly && hasNodes,
  });

  return (
    <div className={styles.boundedContextTree} aria-label="限界上下文树" data-testid="context-tree" ref={containerRef} style={{ position: 'relative' }}>
      {/* F3.2: BoundedEdgeLayer SVG overlay — pointer-events: none, z-index: 30 */}
      <BoundedEdgeLayer
        edges={boundedEdges}
        nodeRects={nodeRects}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        className="bounded-edge-layer"
      />
      {/* Generation Controls */}
      <div className={styles.contextTreeControls}>
        <button
          type="button"
          className={`${styles.primaryButton} ${generating ? styles.buttonLoading : ''}`}
          onClick={handleGenerate}
          disabled={generating || readonly}
          aria-label="重新执行"
        >
          {generating ? '◌ 重新执行中...' : '◈ 重新执行'}
        </button>
        {hasNodes && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleConfirmAll}
            disabled={false}
            aria-label={allConfirmed ? '已全部确认，继续到流程树' : '确认所有节点后继续'}
          >
            {allConfirmed ? '✓ 已确认 → 继续到流程树' : '确认所有 → 继续到流程树'}
          </button>
        )}
        {!readonly && !showAddForm && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setShowAddForm(true)}
            aria-label="手动新增节点"
          >
            + 手动新增
          </button>
        )}

        {/* F3-F10/S2.1: Multi-select controls — delete always visible */}
        {hasNodes && (
          <div className={styles.multiSelectControls}>
            {selectedCount > 0 ? (
              <>
                <span className={styles.selectionCount}>{selectedCount} 已选</span>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => clearNodeSelection('context')}
                  aria-label="取消选择"
                >
                  取消选择
                </button>
                {!readonly && (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => {
                      if (window.confirm(`确定删除 ${selectedCount} 个节点？`)) {
                        deleteSelectedNodes('context');
                      }
                    }}
                    aria-label={`删除 ${selectedCount} 个选中节点`}
                  >
                    删除 ({selectedCount})
                  </button>
                )}
              </>
            ) : null}
            {/* S2.1: Delete button always visible when not readonly, no pre-selection needed */}
            {!readonly && (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => {
                  if (contextNodes.length === 0) return;
                  if (window.confirm(`确定删除全部 ${contextNodes.length} 个节点？`)) {
                    // Delete all context nodes
                    contextNodes.forEach(n => deleteContextNode(n.nodeId));
                  }
                }}
                aria-label="删除全部节点"
              >
                删除全部
              </button>
            )}
            {/* S1.5: 确认所有 button */}
            {!readonly && selectedCount === 0 && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleConfirmAll}
                aria-label="确认所有节点"
              >
                确认所有
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Node Form */}
      {showAddForm && (
        <div className={styles.addNodeFormWrapper}>
          <AddNodeForm onAdd={handleAdd} />
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => setShowAddForm(false)}
          >
            取消
          </button>
        </div>
      )}

      {/* Node List */}
      <div className={styles.contextNodeList} role="list" aria-label="限界上下文节点列表">
        {/* E3-F13: SVG overlay for context relationships */}
        <RelationshipConnector
          nodes={contextNodes}
          containerRef={containerRef as React.RefObject<HTMLElement | null>}
        />
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
        {hasNodes ? (
          <>
            {/* Group nodes by domain type */}
            {(['core', 'supporting', 'generic', 'external'] as const).map((type) => {
              const groupNodes = contextNodes.filter((n) => n.type === type);
              if (groupNodes.length === 0) return null;
              return (
                <BoundedContextGroup
                  key={type}
                  type={type}
                  nodes={groupNodes}
                  readonly={readonly}
                  onEdit={editContextNode}
                  onDelete={deleteContextNode}
                  renderCard={(props) => (
                    <ContextCard
                      node={props.node}
                      onEdit={props.onEdit}
                      onDelete={props.onDelete}
                      readonly={props.readonly}
                      selected={selectedIds.has(props.node.nodeId)}
                      onToggleSelect={(nodeId) => toggleNodeSelect('context', nodeId)}
                    />
                  )}
                />
              );
            })}
          </>
        ) : (
          <div className={styles.contextTreeEmpty}>
            <span className={styles.emptyIcon}>◇</span>
            <p className={styles.emptyText}>暂无限界上下文</p>
            <p className={styles.emptySubtext}>
              点击「重新执行」自动生成，或手动新增节点
            </p>
          </div>
        )}
      </div>

      {/* Phase hint */}
      {hasNodes && !allConfirmed && (
        <p className={styles.contextTreeHint}>
          确认所有上下文节点后，将自动解锁业务流程树
        </p>
      )}
    </div>
  );
}
