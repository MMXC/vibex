/**
 * ComponentTree — 组件树组件
 * Epic 4: F4.1 (AI生成) + F4.2 (预览) + F4.3 (编辑) + F4.4 (确认) + F4.6 (上游联动)
 *
 * 实现要点：
 * - 垂直列表布局，每个页面一个根节点卡片
 * - 根卡片展开后显示组件列表
 * - 节点状态：pending(黄框) / confirmed(绿框) / error(红框)
 * - CRUD 操作连接 canvasStore
 * - "AI生成"按钮调用 mock API 基于 flow 生成组件节点
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import type { ComponentNode } from '@/lib/canvas/types';
import styles from './canvas.module.css';

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

  // F3.2: Click to jump — open previewUrl or construct file path
  const handleNodeClick = useCallback(() => {
    if (readonly) return;
    let targetUrl: string | undefined;
    if (node.previewUrl) {
      targetUrl = node.previewUrl;
    } else if (node.api?.path) {
      // Construct editor deep link from API path
      // e.g., /api/users -> vscode://file/{cwd}/src/app/users/page.tsx
      const apiPath = node.api.path.replace(/^\//, '').replace(/\//g, '-');
      targetUrl = `vscode://file/root/.openclaw/vibex/vibex-fronted/src/app/${apiPath}`;
    }
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  }, [readonly, node.previewUrl, node.api]);

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
            style={{ cursor: node.previewUrl || node.api?.path ? 'pointer' : 'default' }}
            title={
              node.previewUrl
                ? `跳转到 ${node.previewUrl}`
                : node.api?.path
                  ? `跳转到组件代码 (${node.api.path})`
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
    <div className={styles.componentTree} aria-label="组件树">
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

      {/* Node List */}
      <div
        className={styles.componentNodeList}
        role="list"
        aria-label="组件节点列表"
      >
        {hasNodes ? (
          componentNodes.map((node) => (
            <ComponentCard
              key={node.nodeId}
              node={node}
              onConfirm={confirmComponentNode}
              onEdit={editComponentNode}
              onDelete={deleteComponentNode}
              readonly={readonly}
            />
          ))
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
