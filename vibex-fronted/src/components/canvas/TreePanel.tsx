/**
 * TreePanel — 可折叠树面板容器
 * 支持折叠/展开动画，显示节点摘要
 *
 * 遵守 AGENTS.md 规范：
 * - Props 接口有 JSDoc
 * - 组件不直接访问 canvasStore，按需接收 props
 */
'use client';

import React, { useState } from 'react';
import type { TreeType, TreeNode } from '@/lib/canvas/types';
import styles from './canvas.module.css';

interface TreePanelProps {
  /** 树类型 */
  tree: TreeType;
  /** 树标题 */
  title: string;
  /** 节点列表 */
  nodes: TreeNode[];
  /** 是否折叠 */
  collapsed: boolean;
  /** 是否激活（上游已确认） */
  isActive: boolean;
  /** 折叠切换回调 */
  onToggleCollapse: () => void;
  /** 节点确认回调 */
  onNodeConfirm?: (nodeId: string) => void;
  /** 子组件：树渲染器 */
  children?: React.ReactNode;
  /** 自定义操作按钮（渲染在面板头部下方） */
  actions?: React.ReactNode;
}

/** 树类型对应的颜色 */
const TREE_COLORS: Record<TreeType, string> = {
  context: 'var(--color-primary)',
  flow: 'var(--color-accent)',
  component: 'var(--color-green)',
};

/** 树类型对应的图标 */
const TREE_ICONS: Record<TreeType, string> = {
  context: '◇',
  flow: '→',
  component: '▣',
};

export function TreePanel({
  tree,
  title,
  nodes,
  collapsed,
  isActive,
  onToggleCollapse,
  onNodeConfirm,
  children,
  actions,
}: TreePanelProps) {
  const [_isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    onToggleCollapse();
    setTimeout(() => setIsAnimating(false), 300);
  };

  const confirmedCount = nodes.filter((n) => n.confirmed).length;
  const activeClass = isActive ? styles.treePanelActive : styles.treePanelDimmed;
  const treeColor = TREE_COLORS[tree];
  const treeIcon = TREE_ICONS[tree];

  return (
    <div
      className={`${styles.treePanel} ${activeClass} ${
        collapsed ? styles.treePanelCollapsed : ''
      }`}
      style={{ '--tree-color': treeColor } as React.CSSProperties}
      aria-expanded={!collapsed}
      data-tree-type={tree}
    >
      {/* Panel Header */}
      <button
        type="button"
        className={styles.treePanelHeader}
        onClick={handleToggle}
        aria-label={`${collapsed ? '展开' : '折叠'}${title}面板`}
      >
        <span className={styles.treePanelIcon} aria-hidden="true">
          {treeIcon}
        </span>
        <span className={styles.treePanelTitle}>{title}</span>
        <span className={styles.treePanelBadge}>
          {confirmedCount}/{nodes.length}
        </span>
        <span
          className={`${styles.treePanelChevron} ${collapsed ? styles.chevronCollapsed : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Panel Body */}
      {!collapsed && (
        <div className={styles.treePanelBody}>
          {/* Summary when no nodes */}
          {nodes.length === 0 && (
            <div className={styles.treePanelEmpty}>
              <span style={{ color: treeColor }}>{treeIcon}</span>
              <p>暂无节点</p>
              <p className={styles.treePanelEmptyHint}>
                {tree === 'context'
                  ? '输入需求后 AI 将生成限界上下文'
                  : tree === 'flow'
                    ? '确认上下文后自动生成流程树'
                    : '确认流程后自动生成组件树'}
              </p>
            </div>
          )}

          {/* Custom action buttons */}
          {actions && <div className={styles.treePanelActions}>{actions}</div>}

          {/* Children rendered tree */}
          {nodes.length > 0 && children}

          {/* Action buttons (shown when active) */}
          {isActive && onNodeConfirm && (
            <div className={styles.treePanelActions}>
              {/* Slot for add/edit actions */}
            </div>
          )}
        </div>
      )}

      {/* Collapsed Summary */}
      {collapsed && nodes.length > 0 && (
        <div className={styles.treePanelCollapsedSummary}>
          {nodes.slice(0, 3).map((n) => (
            <span key={n.id} className={styles.treePanelSummaryNode}>
              {n.label}
            </span>
          ))}
          {nodes.length > 3 && (
            <span className={styles.treePanelSummaryMore}>+{nodes.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}
