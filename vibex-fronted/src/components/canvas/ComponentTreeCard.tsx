/**
 * ComponentTreeCard — 组件树卡片渲染组件
 *
 * S1.4: 订阅 componentTree store (componentNodes)，渲染组件树卡片列表
 *
 * 职责：
 * - 从 useCanvasStore 订阅 componentNodes
 * - 渲染每个组件节点为可交互卡片
 * - 节点状态：pending(黄框) / confirmed(绿框) / error(红框)
 */
'use client';

import React, { useCallback, useState } from 'react';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useToast } from '@/components/ui/Toast';
import type { ComponentNode } from '@/lib/canvas/types';
import styles from './canvas.module.css';

interface ComponentTreeCardProps {
  /** 是否为只读模式 */
  readonly?: boolean;
}

/**
 * 单个组件卡片 — 展示组件节点信息
 */
function ComponentCardItem({ node, onEdit, onDelete, readonly }: {
  node: ComponentNode;
  onEdit: (nodeId: string, data: Partial<ComponentNode>) => void;
  onDelete: (nodeId: string) => void;
  readonly?: boolean;
}) {
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

  // Click to open preview
  const handleNodeClick = useCallback(() => {
    if (readonly) return;
    if (node.previewUrl) {
      window.open(node.previewUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.showToast('该组件暂无预览链接', 'error');
    }
  }, [readonly, node.previewUrl, toast]);

  const statusClass =
    node.status === 'confirmed'
      ? styles.nodeConfirmed
      : node.status === 'error'
        ? styles.nodeError
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

  const childCount = node.children?.length ?? 0;
  const hasChildren = childCount > 0;

  return (
    <div
      className={`${styles.nodeCard} ${statusClass} ${hovered ? styles.hovered : ''}`}
      data-node-id={node.nodeId}
      data-status={node.status}
      data-type={node.type}
      data-testid={`component-card-${node.nodeId}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleNodeClick}
    >
      {editing ? (
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
        <>
          <div className={styles.nodeCardHeader}>
            <div className={styles.nodeTypeBadge} style={{ background: typeColor }}>
              {node.type === 'page' ? '页面' : node.type === 'list' ? '列表' : node.type === 'form' ? '表单' : node.type === 'detail' ? '详情' : '弹窗'}
            </div>
            {node.isActive !== false && (
              <span className={styles.activeBadge} aria-label="已确认">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
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

/**
 * ComponentTreeCard — 组件树卡片容器
 *
 * S1.4: 订阅 componentTree (componentNodes from useCanvasStore)，
 * 渲染组件树卡片列表，支持 CRUD 和确认操作
 */
export function ComponentTreeCard({ readonly = false }: ComponentTreeCardProps) {
  // S1.4: 订阅 componentTree store
  const componentNodes = useComponentStore((s) => s.componentNodes);
  const editComponentNode = useComponentStore((s) => s.editComponentNode);
  const deleteComponentNode = useComponentStore((s) => s.deleteComponentNode);

  const hasNodes = componentNodes.length > 0;

  return (
    <div className={styles.componentTree} aria-label="组件树" data-testid="component-tree-card">
      {/* Node List */}
      <div
        className={styles.componentNodeList}
        role="list"
        aria-label="组件节点列表"
      >
        {hasNodes ? (
          componentNodes.map((node) => (
            <ComponentCardItem
              key={node.nodeId}
              node={node}
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
              点击「继续·组件树」从流程树生成组件
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
