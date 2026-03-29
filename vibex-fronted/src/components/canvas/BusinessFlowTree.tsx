/**
 * BusinessFlowTree — 业务流程树组件
 * Epic 3: S3.1 (AI生成) + S3.2 (拖拽排序) + S3.3 (编辑/确认) + S3.4 (级联标记)
 *
 * 实现要点：
 * - 垂直列表布局，每个 BusinessFlow 一个卡片
 * - 每个卡片展开后显示 FlowStep 列表
 * - Steps 支持拖拽排序、编辑、确认
 * - 节点状态：pending(黄框) / confirmed(绿框) / error(红框)
 * - CRUD 操作连接 canvasStore
 * - "AI生成"按钮：仅在无 flow 时可用（flow 由 context confirm 自动生成）
 */
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import { CheckboxIcon } from '@/components/common/CheckboxIcon';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BusinessFlowNode, FlowStep, ComponentNode, BoundedContextNode } from '@/lib/canvas/types';
import { SortableTreeItem } from './features/SortableTreeItem';
import { getHistoryStore } from '@/lib/canvas/historySlice';
import { useDragSelection, useModifierKey } from '@/hooks/canvas/useDragSelection';
import styles from './canvas.module.css';

// =============================================================================
// Types
// =============================================================================

interface BusinessFlowTreeProps {
  /** 是否为只读模式 */
  readonly?: boolean;
  /** 是否为激活状态 */
  isActive?: boolean;
}

// =============================================================================
// Sortable Step Row (Draggable)
// =============================================================================

interface SortableStepRowProps {
  step: FlowStep;
  index: number;
  totalSteps?: number;
  readonly?: boolean;
  onConfirm: (stepId: string) => void;
  onEdit: (stepId: string, data: Partial<FlowStep>) => void;
  onDelete: (stepId: string) => void;
}

function SortableStepRow({
  step,
  index,
  totalSteps: _totalSteps,
  readonly,
  onConfirm,
  onEdit,
  onDelete,
}: SortableStepRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: step.stepId,
    disabled: readonly,
  });

  const [editing, setEditing] = useState(false);
  const [editState, setEditState] = useState({
    name: step.name,
    actor: step.actor,
    description: step.description || '',
  });

  const handleSave = useCallback(() => {
    onEdit(step.stepId, {
      name: editState.name,
      actor: editState.actor,
      description: editState.description,
    });
    setEditing(false);
  }, [step.stepId, editState, onEdit]);

  const handleCancel = useCallback(() => {
    setEditState({ name: step.name, actor: step.actor, description: step.description || '' });
    setEditing(false);
  }, [step]);

  const statusClass =
    step.status === 'confirmed'
      ? styles.nodeConfirmed
      : step.status === 'error'
        ? styles.nodeError
        : styles.nodePending;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
      }}
      className={`${styles.stepRow} ${statusClass}`}
      data-step-id={step.stepId}
    >
      {/* Drag handle — P1-T3: SVG replaces emoji ⋮⋮ */}
      {!readonly && (
        <div className={styles.stepDragHandle} {...attributes} {...listeners} title="拖拽排序" aria-label="拖拽排序">
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
            <circle cx="3" cy="3" r="1.5" fill="currentColor" />
            <circle cx="7" cy="3" r="1.5" fill="currentColor" />
            <circle cx="3" cy="8" r="1.5" fill="currentColor" />
            <circle cx="7" cy="8" r="1.5" fill="currentColor" />
            <circle cx="3" cy="13" r="1.5" fill="currentColor" />
            <circle cx="7" cy="13" r="1.5" fill="currentColor" />
          </svg>
        </div>
      )}

      {/* Order number */}
      <span className={styles.stepOrder}>{index + 1}</span>

      {/* P1-T3: Step type icon — SVG replaces emoji 🔀 🔁 */}
      {step.type && (
        <span
          className={`${styles.flowStepTypeIcon} ${step.type === 'branch' ? styles['flowStepTypeIcon--branch'] : step.type === 'loop' ? styles['flowStepTypeIcon--loop'] : styles['flowStepTypeIcon--normal']}`}
          data-testid="flow-step-icon"
          title={step.type === 'branch' ? '分支步骤' : step.type === 'loop' ? '循环步骤' : '普通步骤'}
          aria-label={step.type === 'branch' ? '分支步骤' : step.type === 'loop' ? '循环步骤' : '普通步骤'}
        >
          {step.type === 'branch' ? (
            /* Branch icon — two diverging paths */
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 2h4v3H4v3h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 2v5a3 3 0 003 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : step.type === 'loop' ? (
            /* Loop icon — circular arrow */
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M9.5 2.5A3.5 3.5 0 104 6h1.5L4 8l2.5-2.5H4A4.5 4.5 0 018.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
      )}

      {/* Step content */}
      {editing ? (
        <div className={styles.stepEditForm}>
          <input
            className={styles.stepInput}
            value={editState.name}
            onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
            placeholder="步骤名称"
            autoFocus
          />
          <input
            className={styles.stepInput}
            value={editState.actor}
            onChange={(e) => setEditState((s) => ({ ...s, actor: e.target.value }))}
            placeholder="执行者"
          />
          <textarea
            className={styles.stepTextarea}
            value={editState.description}
            onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
            placeholder="描述（可选）"
            rows={2}
          />
          <div className={styles.stepEditActions}>
            <button className={styles.btnSave} onClick={handleSave}>
              保存
            </button>
            <button className={styles.btnCancel} onClick={handleCancel}>
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.stepContent}>
            <span className={styles.stepName}>{step.name}</span>
            <span className={styles.stepActor}>[{step.actor}]</span>
            {step.description && (
              <span className={styles.stepDesc}>{step.description}</span>
            )}
          </div>

          {!readonly && (
            <div className={styles.stepActions}>
              {/* Edit — P1-T2: SVG replaces emoji ✎ */}
              <button
                className={`${styles.iconBtn} ${styles['iconBtn--edit']}`}
                onClick={() => setEditing(true)}
                title="编辑步骤"
                aria-label="编辑步骤"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              {/* Delete — P1-T2: SVG replaces emoji × */}
              <button
                className={`${styles.iconBtn} ${styles['iconBtn--delete']}`}
                onClick={() => onDelete(step.stepId)}
                title="删除步骤"
                aria-label="删除步骤"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </button>
              {/* Confirm */}
              {!step.confirmed && (
                <button
                  className={`${styles.stepActionBtn} ${styles.btnConfirmStep}`}
                  onClick={() => onConfirm(step.stepId)}
                  title="确认"
                  aria-label="确认步骤"
                >
                  <CheckboxIcon checked size="sm" aria-label="确认" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// Flow Node Card (with Sortable Steps)
// =============================================================================

interface FlowCardProps {
  node: BusinessFlowNode;
  readonly?: boolean;
  onEdit: (nodeId: string, data: Partial<BusinessFlowNode>) => void;
  onDelete: (nodeId: string) => void;
  onConfirm: (nodeId: string) => void;
  // Step actions
  onAddStep: (flowNodeId: string, data: { name: string; actor?: string; description?: string }) => void;
  onConfirmStep: (flowNodeId: string, stepId: string) => void;
  onEditStep: (flowNodeId: string, stepId: string, data: Partial<FlowStep>) => void;
  onDeleteStep: (flowNodeId: string, stepId: string) => void;
  onReorderSteps: (flowNodeId: string, fromIndex: number, toIndex: number) => void;
  /** F3-F10: Multi-select state */
  selected?: boolean;
  /** F3-F10: Multi-select toggle */
  onToggleSelect?: (nodeId: string) => void;
}

function FlowCard({
  node,
  readonly,
  onEdit,
  onDelete,
  onConfirm,
  onAddStep,
  onConfirmStep,
  onEditStep,
  onDeleteStep,
  onReorderSteps,
  selected,
  onToggleSelect,
}: FlowCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editState, setEditState] = useState({
    name: node.name,
  });
  const isModifierRef = useModifierKey();

  // F4: Ctrl/Cmd+click on header toggles multi-selection
  const handleHeaderClick = useCallback(
    (e: React.MouseEvent) => {
      if (editing) return;
      // Don't intercept clicks on checkbox or expand button
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'BUTTON') return;
      if (e.ctrlKey || e.metaKey || isModifierRef.current) {
        e.stopPropagation();
        onToggleSelect?.(node.nodeId);
      }
    },
    [editing, node.nodeId, onToggleSelect, isModifierRef]
  );

  // DnD sensors for step drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // 5px threshold to prevent accidental drag
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = node.steps.findIndex((s) => s.stepId === active.id);
      const newIndex = node.steps.findIndex((s) => s.stepId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderSteps(node.nodeId, oldIndex, newIndex);
      }
    },
    [node.steps, node.nodeId, onReorderSteps]
  );

  const handleSave = useCallback(() => {
    onEdit(node.nodeId, { name: editState.name });
    setEditing(false);
  }, [node.nodeId, editState, onEdit]);

  const handleCancel = useCallback(() => {
    setEditState({ name: node.name });
    setEditing(false);
  }, [node.name]);

  const confirmedSteps = node.steps.filter((s) => s.confirmed).length;
  const totalSteps = node.steps.length;
  const stepIds = node.steps.map((s) => s.stepId);

  const statusClass =
    node.status === 'confirmed'
      ? styles.nodeConfirmed
      : node.status === 'error'
        ? styles.nodeError
        : styles.nodePending;

  return (
    <div className={`${styles.flowCard} ${statusClass} ${selected ? styles.nodeCardSelected : ''}`} data-testid="flow-card" data-node-id={node.nodeId}>
      {/* Card header */}
      <div className={styles.flowCardHeader} onClick={handleHeaderClick}>
        {/* F3-F10: Selection checkbox */}
        {onToggleSelect && (
          <input
            type="checkbox"
            className={styles.flowCardCheckbox}
            checked={selected ?? false}
            onChange={() => onToggleSelect(node.nodeId)}
            aria-label={`选择流程 ${node.name}`}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <button
          className={styles.expandBtn}
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-label={expanded ? '收起步骤' : '展开步骤'}
        >
          {expanded ? '▼' : '▶'}
        </button>

        {editing ? (
          <div className={styles.flowEditForm}>
            <input
              className={styles.flowNameInput}
              value={editState.name}
              onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
              placeholder="流程名称"
              autoFocus
            />
            <button className={styles.btnSave} onClick={handleSave}>
              保存
            </button>
            <button className={styles.btnCancel} onClick={handleCancel}>
              取消
            </button>
          </div>
        ) : (
          <>
            <span className={styles.flowName}>{node.name}</span>
            <span className={styles.flowProgress}>
              {confirmedSteps}/{totalSteps} 步骤
            </span>
          </>
        )}

        {!readonly && !editing && (
          <div className={styles.flowCardActions}>
            <button
              className={`${styles.iconBtn} ${styles['iconBtn--edit']}`}
              onClick={() => setEditing(true)}
              title="编辑流程"
              aria-label="编辑流程"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className={`${styles.iconBtn} ${styles['iconBtn--delete']}`}
              onClick={() => onDelete(node.nodeId)}
              title="删除流程"
              aria-label="删除流程"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </button>
            {!node.confirmed && (
              <button
                className={`${styles.btnIcon} ${styles.btnConfirm}`}
                onClick={() => onConfirm(node.nodeId)}
                title="确认流程"
                aria-label="确认流程"
              >
                <CheckboxIcon checked size="sm" aria-label="确认流程" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Steps list (expandable, drag-to-sort) */}
      {expanded && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.stepsList}>
            {node.steps.length === 0 ? (
              <div className={styles.emptySteps}>暂无步骤（拖拽下方按钮添加）</div>
            ) : (
              <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
                {node.steps.map((step, i) => (
                  <SortableStepRow
                    key={step.stepId}
                    step={step}
                    index={i}
                    totalSteps={node.steps.length}
                    readonly={readonly}
                    onConfirm={(stepId) => onConfirmStep(node.nodeId, stepId)}
                    onEdit={(stepId, data) => onEditStep(node.nodeId, stepId, data)}
                    onDelete={(stepId) => onDeleteStep(node.nodeId, stepId)}
                  />
                ))}
              </SortableContext>
            )}
            {/* Add step button */}
            {!readonly && (
              <button
                className={styles.btnAddStep}
                onClick={() => {
                  const name = window.prompt('步骤名称：');
                  if (name && name.trim()) {
                    onAddStep(node.nodeId, { name: name.trim(), actor: '待定', description: '' });
                  }
                }}
                title="添加步骤"
              >
                + 添加步骤
              </button>
            )}
          </div>
        </DndContext>
      )}
    </div>
  );
}

// =============================================================================
// BusinessFlowTree Panel
// =============================================================================

export function BusinessFlowTree({ readonly = false, isActive = true }: BusinessFlowTreeProps) {
  // === Store ===
  const flowNodes = useCanvasStore((s) => s.flowNodes);
  const contextNodes = useCanvasStore((s) => s.contextNodes);
  const editFlowNode = useCanvasStore((s) => s.editFlowNode);
  const deleteFlowNode = useCanvasStore((s) => s.deleteFlowNode);
  const confirmFlowNode = useCanvasStore((s) => s.confirmFlowNode);
  const confirmStep = useCanvasStore((s) => s.confirmStep);
  const editStep = useCanvasStore((s) => s.editStep);
  const deleteStep = useCanvasStore((s) => s.deleteStep);
  const reorderSteps = useCanvasStore((s) => s.reorderSteps);
  const addFlowNode = useCanvasStore((s) => s.addFlowNode);
  const addStepToFlow = useCanvasStore((s) => s.addStepToFlow);
  const autoGenerateFlows = useCanvasStore((s) => s.autoGenerateFlows);
  const flowGenerating = useCanvasStore((s) => s.flowGenerating);
  const setComponentNodes = useCanvasStore((s) => s.setComponentNodes);
  const setFlowNodes = useCanvasStore((s) => s.setFlowNodes);
  const setPhase = useCanvasStore((s) => s.setPhase);
  const projectId = useCanvasStore((s) => s.projectId);

  // === E2-F7: Flow card drag sensors ===
  const flowSensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  // === E3-F2: Multi-select state ===
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const toggleNodeSelect = useCanvasStore((s) => s.toggleNodeSelect);
  const selectAllNodes = useCanvasStore((s) => s.selectAllNodes);
  const clearNodeSelection = useCanvasStore((s) => s.clearNodeSelection);
  const deleteSelectedNodes = useCanvasStore((s) => s.deleteSelectedNodes);

  const selectedIds = new Set(selectedNodeIds.flow);
  const selectedCount = selectedIds.size;

  // F4: Drag selection (框选) for flow tree
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectionBox } = useDragSelection({
    onSelectionChange: (nodeIds) => {
      nodeIds.forEach((id) => {
        if (!selectedIds.has(id)) {
          toggleNodeSelect('flow', id);
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
    enabled: !readonly && flowNodes.length > 0,
  });

  // E2-F7: Reorder flow cards on drag end
  const handleFlowCardDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = flowNodes.findIndex((n) => n.nodeId === active.id);
      const newIndex = flowNodes.findIndex((n) => n.nodeId === over.id);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      // Record undo snapshot before reordering
      const historyStore = getHistoryStore();
      historyStore.recordSnapshot('flow', flowNodes);

      // Reorder nodes
      const newNodes = [...flowNodes];
      const [moved] = newNodes.splice(oldIndex, 1);
      newNodes.splice(newIndex, 0, moved);
      setFlowNodes(newNodes);
    },
    [flowNodes, setFlowNodes]
  );

  // === Local UI State ===
  // S1.3: 防重复提交锁
  const [componentGenerating, setComponentGenerating] = useState(false);

  // === Check if auto-gen should show ===
  // All contexts confirmed + no flows yet = show auto-gen hint
  const allContextsConfirmed = contextNodes.length > 0 && contextNodes.every((c) => c.confirmed);

  // S1.1: 零上下文状态也可添加流程（独立流程入口）
  const handleManualAdd = useCallback(() => {
    // 优先找第一个未确认的上下文；无上下文时使用空 contextId
    const unconfirmedCtx = contextNodes.find((c) => !c.confirmed);
    const targetCtx = unconfirmedCtx ?? contextNodes[0];
    if (targetCtx) {
      addFlowNode({
        contextId: targetCtx.nodeId,
        name: `${targetCtx.name}业务流程`,
        steps: [],
      });
    } else {
      // 无任何上下文时，直接创建空流程
      addFlowNode({
        contextId: '',
        name: '新业务流程',
        steps: [],
      });
    }
  }, [contextNodes, addFlowNode]);

  // Bug4a: 重新生成流程树
  const handleRegenerate = useCallback(() => {
    if (flowGenerating) return;
    autoGenerateFlows(contextNodes);
  }, [flowGenerating, contextNodes, autoGenerateFlows]);

  // S1.3: 继续·组件树 — 调用 fetchComponentTree API，参数包含 flowData
  const handleContinueToComponents = useCallback(async () => {
    // 防重复提交：flowData 为空或正在生成时禁用
    if (componentGenerating || flowNodes.length === 0) return;
    setComponentGenerating(true);

    try {
      const sessionId = projectId ?? `session-${Date.now()}`;

      // Map context nodes to API format
      const mappedContexts: Array<{ id: string; name: string; description: string; type: string }> =
        contextNodes.map((ctx: BoundedContextNode) => ({
          id: ctx.nodeId,
          name: ctx.name,
          description: ctx.description ?? '',
          type: ctx.type,
        }));

      // Map flow nodes (flowData) to API format
      const mappedFlows: Array<{ name: string; contextId: string; steps: Array<{ name: string; actor: string }> }> =
        flowNodes.map((f: BusinessFlowNode) => ({
          name: f.name,
          contextId: f.contextId,
          steps: f.steps.map((step: FlowStep) => ({
            name: step.name,
            actor: step.actor,
          })),
        }));

      // S1.3: Call fetchComponentTree with flowData in parameters
      const componentNodes: ComponentNode[] = await canvasApi.fetchComponentTree({
        contexts: mappedContexts,
        flows: mappedFlows,
        sessionId,
      });

      // S1.4: Store 渲染 — 更新 componentNodes 并切换 phase
      setComponentNodes(componentNodes);
      setPhase('component');
    } catch (err) {
      console.error('[BusinessFlowTree] handleContinueToComponents error:', err);
    } finally {
      setComponentGenerating(false);
    }
  }, [componentGenerating, flowNodes, contextNodes, projectId, setComponentNodes, setPhase]);

  if (!isActive) {
    return (
      <div className={styles.inactivePanel}>
        <p>请先完成上下文树后解锁</p>
      </div>
    );
  }

  return (
    <div className={styles.flowTreePanel} data-testid="flow-tree" ref={containerRef} style={{ position: 'relative' }}>
      {/* Header with add button */}
      <div className={styles.treeHeader}>
        {/* S1.1: 始终显示添加流程按钮（零上下文状态也支持） */}
        <button className={styles.btnAddFlow} onClick={handleManualAdd}>
          + 添加流程
        </button>
        {flowNodes.length > 0 && (
          <button
            className={styles.secondaryButton}
            onClick={handleRegenerate}
            disabled={flowGenerating}
            title="基于已确认的上下文重新生成流程树"
          >
            {flowGenerating ? '◌ 重新生成中...' : '🔄 重新生成流程树'}
          </button>
        )}
        {/* S1.1 & S1.2: 继续·组件树按钮 — flowData 为空时 disabled */}
        {flowNodes.length > 0 && (
          <button
            className={styles.secondaryButton}
            onClick={handleContinueToComponents}
            disabled={componentGenerating}
            aria-label="继续到组件树"
            title="基于流程树数据生成组件树"
          >
            {componentGenerating ? '◌ 生成中...' : '继续·组件树'}
          </button>
        )}
        {allContextsConfirmed && flowNodes.length === 0 && (
          <span className={styles.autoGenHint}>
            上下文已全部确认，流程树将自动生成
          </span>
        )}

        {/* E3-F2: Multi-select controls */}
        {flowNodes.length > 0 && (
          <div className={styles.multiSelectControls}>
            {selectedCount > 0 ? (
              <>
                <span className={styles.selectionCount}>{selectedCount} 已选</span>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => clearNodeSelection('flow')}
                  aria-label="取消选择"
                >
                  取消选择
                </button>
                {!readonly && (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => deleteSelectedNodes('flow')}
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
                onClick={() => selectAllNodes('flow')}
                aria-label="全选"
              >
                全选
              </button>
            )}
          </div>
        )}
      </div>

      {/* Flow list */}
      {flowNodes.length === 0 ? (
        <div className={styles.emptyFlowList}>
          <p>暂无业务流程</p>
          {allContextsConfirmed ? (
            <p className={styles.hint}>确认上下文后自动生成业务流程</p>
          ) : (
            <p className={styles.hint}>请先完成上下文树的编辑和确认</p>
          )}
        </div>
      ) : (
        <DndContext
          sensors={flowSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleFlowCardDragEnd}
        >
          <SortableContext
            items={flowNodes.map((n) => n.nodeId)}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles.flowList} style={{ position: 'relative' }}>
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
              {flowNodes.map((node) => (
                <SortableTreeItem
                  key={node.nodeId}
                  options={{ id: node.nodeId, disabled: readonly }}
                  treeType="flow"
                  label={node.name}
                >
                  <FlowCard
                    node={node}
                    readonly={readonly}
                    onEdit={editFlowNode}
                    onDelete={deleteFlowNode}
                    onConfirm={confirmFlowNode}
                    onAddStep={addStepToFlow}
                    onConfirmStep={confirmStep}
                    onEditStep={editStep}
                    onDeleteStep={deleteStep}
                    onReorderSteps={reorderSteps}
                    selected={selectedIds.has(node.nodeId)}
                    onToggleSelect={(nodeId) => toggleNodeSelect('flow', nodeId)}
                  />
                </SortableTreeItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
