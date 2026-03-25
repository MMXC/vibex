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

import React, { useState, useCallback } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import type { BusinessFlowNode, FlowStep } from '@/lib/canvas/types';
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
// Flow Step Row (Draggable)
// =============================================================================

interface StepRowProps {
  step: FlowStep;
  index: number;
  totalSteps: number;
  readonly?: boolean;
  onConfirm: (stepId: string) => void;
  onEdit: (stepId: string, data: Partial<FlowStep>) => void;
  onDelete: (stepId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

function StepRow({
  step,
  index,
  totalSteps,
  readonly,
  onConfirm,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: StepRowProps) {
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
    <div className={`${styles.stepRow} ${statusClass}`}>
      {/* Drag handle */}
      {!readonly && (
        <div className={styles.stepDragHandle} title="拖拽排序">
          ⋮⋮
        </div>
      )}

      {/* Order number */}
      <span className={styles.stepOrder}>{index + 1}</span>

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
              {/* Reorder buttons */}
              <button
                className={styles.stepMoveBtn}
                onClick={() => onMoveUp(index)}
                disabled={index === 0}
                title="上移"
              >
                ↑
              </button>
              <button
                className={styles.stepMoveBtn}
                onClick={() => onMoveDown(index)}
                disabled={index === totalSteps - 1}
                title="下移"
              >
                ↓
              </button>
              {/* Edit */}
              <button
                className={styles.stepActionBtn}
                onClick={() => setEditing(true)}
                title="编辑"
              >
                ✎
              </button>
              {/* Delete */}
              <button
                className={styles.stepActionBtn}
                onClick={() => onDelete(step.stepId)}
                title="删除"
              >
                ×
              </button>
              {/* Confirm */}
              {!step.confirmed && (
                <button
                  className={`${styles.stepActionBtn} ${styles.btnConfirmStep}`}
                  onClick={() => onConfirm(step.stepId)}
                  title="确认"
                >
                  ✓
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
// Flow Node Card
// =============================================================================

interface FlowCardProps {
  node: BusinessFlowNode;
  readonly?: boolean;
  onEdit: (nodeId: string, data: Partial<BusinessFlowNode>) => void;
  onDelete: (nodeId: string) => void;
  onConfirm: (nodeId: string) => void;
  // Step actions
  onConfirmStep: (flowNodeId: string, stepId: string) => void;
  onEditStep: (flowNodeId: string, stepId: string, data: Partial<FlowStep>) => void;
  onDeleteStep: (flowNodeId: string, stepId: string) => void;
  onReorderSteps: (flowNodeId: string, fromIndex: number, toIndex: number) => void;
}

function FlowCard({
  node,
  readonly,
  onEdit,
  onDelete,
  onConfirm,
  onConfirmStep,
  onEditStep,
  onDeleteStep,
  onReorderSteps,
}: FlowCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editState, setEditState] = useState({
    name: node.name,
  });

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

  const statusClass =
    node.status === 'confirmed'
      ? styles.nodeConfirmed
      : node.status === 'error'
        ? styles.nodeError
        : styles.nodePending;

  return (
    <div className={`${styles.flowCard} ${statusClass}`}>
      {/* Card header */}
      <div className={styles.flowCardHeader}>
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
              className={styles.btnIcon}
              onClick={() => setEditing(true)}
              title="编辑流程"
            >
              ✎
            </button>
            <button
              className={styles.btnIcon}
              onClick={() => onDelete(node.nodeId)}
              title="删除流程"
            >
              🗑
            </button>
            {!node.confirmed && (
              <button
                className={`${styles.btnIcon} ${styles.btnConfirm}`}
                onClick={() => onConfirm(node.nodeId)}
                title="确认流程"
              >
                ✓
              </button>
            )}
          </div>
        )}
      </div>

      {/* Steps list (expandable) */}
      {expanded && (
        <div className={styles.stepsList}>
          {node.steps.length === 0 ? (
            <div className={styles.emptySteps}>暂无步骤</div>
          ) : (
            node.steps.map((step, i) => (
              <StepRow
                key={step.stepId}
                step={step}
                index={i}
                totalSteps={node.steps.length}
                readonly={readonly}
                onConfirm={(stepId) => onConfirmStep(node.nodeId, stepId)}
                onEdit={(stepId, data) => onEditStep(node.nodeId, stepId, data)}
                onDelete={(stepId) => onDeleteStep(node.nodeId, stepId)}
                onMoveUp={(i) => onReorderSteps(node.nodeId, i, i - 1)}
                onMoveDown={(i) => onReorderSteps(node.nodeId, i, i + 1)}
              />
            ))
          )}
        </div>
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

  // === Check if auto-gen should show ===
  // All contexts confirmed + no flows yet = show auto-gen hint
  const allContextsConfirmed = contextNodes.length > 0 && contextNodes.every((c) => c.confirmed);
  const canManualAdd = contextNodes.length > 0 && !allContextsConfirmed;

  const handleManualAdd = useCallback(() => {
    // Manual add: create empty flow for first unconfirmed context
    const unconfirmedCtx = contextNodes.find((c) => !c.confirmed);
    if (unconfirmedCtx) {
      addFlowNode({
        contextId: unconfirmedCtx.nodeId,
        name: `${unconfirmedCtx.name}业务流程`,
        steps: [],
      });
    }
  }, [contextNodes, addFlowNode]);

  if (!isActive) {
    return (
      <div className={styles.inactivePanel}>
        <p>请先完成上下文树后解锁</p>
      </div>
    );
  }

  return (
    <div className={styles.flowTreePanel}>
      {/* Header with add button */}
      <div className={styles.treeHeader}>
        {canManualAdd && (
          <button className={styles.btnAddFlow} onClick={handleManualAdd}>
            + 添加流程
          </button>
        )}
        {allContextsConfirmed && flowNodes.length === 0 && (
          <span className={styles.autoGenHint}>
            上下文已全部确认，流程树将自动生成
          </span>
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
        <div className={styles.flowList}>
          {flowNodes.map((node) => (
            <FlowCard
              key={node.nodeId}
              node={node}
              readonly={readonly}
              onEdit={editFlowNode}
              onDelete={deleteFlowNode}
              onConfirm={confirmFlowNode}
              onConfirmStep={confirmStep}
              onEditStep={editStep}
              onDeleteStep={deleteStep}
              onReorderSteps={reorderSteps}
            />
          ))}
        </div>
      )}
    </div>
  );
}
