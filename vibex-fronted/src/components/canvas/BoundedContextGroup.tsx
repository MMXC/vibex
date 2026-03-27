/**
 * BoundedContextGroup — 领域虚线框分组组件
 * Epic 1: BC卡片布局虚线领域框分组
 *
 * 实现要点：
 * - 用虚线边框包裹同一领域的上下文卡片
 * - 支持四种领域类型：core(核心)、supporting(支撑)、generic(通用)、external(外部)
 * - 左侧显示领域标签
 */
'use client';

import React from 'react';
import type { BoundedContextNode } from '@/lib/canvas/types';
import styles from './canvas.module.css';

interface BoundedContextGroupProps {
  /** 领域类型 */
  type: BoundedContextNode['type'];
  /** 该领域下的上下文节点 */
  nodes: BoundedContextNode[];
  /** 是否只读模式 */
  readonly?: boolean;
  /** 确认回调 */
  onConfirm: (nodeId: string) => void;
  /** 编辑回调 */
  onEdit: (nodeId: string, data: Partial<BoundedContextNode>) => void;
  /** 删除回调 */
  onDelete: (nodeId: string) => void;
  /** 子组件渲染函数 */
  renderCard: (props: {
    node: BoundedContextNode;
    onConfirm: (nodeId: string) => void;
    onEdit: (nodeId: string, data: Partial<BoundedContextNode>) => void;
    onDelete: (nodeId: string) => void;
    readonly?: boolean;
  }) => React.ReactNode;
}

const DOMAIN_CONFIG = {
  core: {
    label: '核心域',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.05)',
  },
  supporting: {
    label: '支撑域',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.05)',
  },
  generic: {
    label: '通用域',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.05)',
  },
  external: {
    label: '外部域',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.05)',
  },
} as const;

export function BoundedContextGroup({
  type,
  nodes,
  readonly,
  onConfirm,
  onEdit,
  onDelete,
  renderCard,
}: BoundedContextGroupProps) {
  const config = DOMAIN_CONFIG[type];

  if (nodes.length === 0) return null;

  return (
    <div
      className={styles.boundedContextGroup}
      data-testid="bounded-context-group"
      data-domain-type={type}
      style={{
        borderColor: config.color,
        backgroundColor: config.bgColor,
      }}
    >
      {/* Domain Label */}
      <div
        className={styles.domainLabel}
        data-testid="domain-label"
        style={{ color: config.color, borderColor: config.color }}
      >
        {config.label}
        <span className={styles.domainCount}>{nodes.length}</span>
      </div>

      {/* Grouped Cards */}
      <div className={styles.groupedCards} role="list" aria-label={`${config.label}节点列表`}>
        {nodes.map((node) => (
          <div key={node.nodeId} role="listitem">
            {renderCard({ node, onConfirm, onEdit, onDelete, readonly })}
          </div>
        ))}
      </div>
    </div>
  );
}
