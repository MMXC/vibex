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

import React, { useState, useCallback, useRef } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { RelationshipConnector } from './edges/RelationshipConnector';
import type { BoundedContextNode, BoundedContextDraft } from '@/lib/canvas/types';
import styles from './canvas.module.css';

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
  onConfirm: (nodeId: string) => void;
  onEdit: (nodeId: string, data: Partial<BoundedContextNode>) => void;
  onDelete: (nodeId: string) => void;
  readonly?: boolean;
}

function ContextCard({ node, onConfirm, onEdit, onDelete, readonly }: ContextCardProps) {
  const [editing, setEditing] = useState(false);
  const [editState, setEditState] = useState<NodeEditState>({
    nodeId: node.nodeId,
    name: node.name,
    description: node.description,
  });

  const handleSave = useCallback(() => {
    onEdit(node.nodeId, { name: editState.name, description: editState.description });
    setEditing(false);
  }, [node.nodeId, editState, onEdit]);

  const handleCancel = useCallback(() => {
    setEditState({ nodeId: node.nodeId, name: node.name, description: node.description });
    setEditing(false);
  }, [node]);

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
      className={`${styles.nodeCard} ${statusClass}`}
      data-node-id={node.nodeId}
      data-status={node.status}
      data-type={node.type}
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
          <div className={styles.nodeCardHeader}>
            <div className={styles.nodeTypeBadge} style={{ background: typeColor }}>
              {node.type === 'core'
                ? '核心'
                : node.type === 'supporting'
                  ? '支撑'
                  : node.type === 'generic'
                    ? '通用'
                    : '外部'}
            </div>
            {node.confirmed && (
              <span className={styles.confirmedBadge} aria-label="已确认">✓</span>
            )}
          </div>
          <h4 className={styles.nodeCardTitle}>{node.name}</h4>
          <p className={styles.nodeCardDesc}>{node.description}</p>
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
  const confirmContextNode = useCanvasStore((s) => s.confirmContextNode);
  const setContextNodes = useCanvasStore((s) => s.setContextNodes);
  const advancePhase = useCanvasStore((s) => s.advancePhase);

  const [generating, setGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    contextNodes.forEach((n) => {
      if (!n.confirmed) confirmContextNode(n.nodeId);
    });
    // Advance to next phase when all confirmed
    const allConfirmed = contextNodes.every((n) => n.confirmed);
    if (allConfirmed && contextNodes.length > 0) {
      advancePhase();
    }
  }, [contextNodes, confirmContextNode, advancePhase]);

  const allConfirmed = contextNodes.length > 0 && contextNodes.every((n) => n.confirmed);
  const hasNodes = contextNodes.length > 0;

  return (
    <div className={styles.boundedContextTree} aria-label="限界上下文树" ref={containerRef}>
      {/* Generation Controls */}
      <div className={styles.contextTreeControls}>
        <button
          type="button"
          className={`${styles.primaryButton} ${generating ? styles.buttonLoading : ''}`}
          onClick={handleGenerate}
          disabled={generating || readonly}
          aria-label="AI 生成限界上下文"
        >
          {generating ? '◌ 生成中...' : '◈ AI 生成上下文'}
        </button>
        {allConfirmed && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleConfirmAll}
            aria-label="继续到流程树"
          >
            继续 → 流程树
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
        {hasNodes ? (
          <>
            {/* SVG Relationship Connector Overlay */}
            <RelationshipConnector nodes={contextNodes} containerRef={containerRef} />
            {contextNodes.map((node) => (
              <ContextCard
                key={node.nodeId}
                node={node}
                onConfirm={confirmContextNode}
                onEdit={editContextNode}
                onDelete={deleteContextNode}
                readonly={readonly}
              />
            ))}
          </>
        ) : (
          <div className={styles.contextTreeEmpty}>
            <span className={styles.emptyIcon}>◇</span>
            <p className={styles.emptyText}>暂无限界上下文</p>
            <p className={styles.emptySubtext}>
              点击「AI 生成上下文」自动生成，或手动新增节点
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
