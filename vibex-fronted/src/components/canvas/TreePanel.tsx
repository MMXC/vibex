/**
 * TreePanel — 可折叠树面板容器
 * 支持折叠/展开动画，显示节点摘要
 *
 * Epic 2 E2-F12: 集成 MiniMap 导航
 *
 * 遵守 AGENTS.md 规范：
 * - Props 接口有 JSDoc
 * - 组件不直接访问 canvasStore，按需接收 props
 */
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  /** 自定义操作按钮（渲染在面板头部下方 body） */
  actions?: React.ReactNode;
  /** 自定义操作按钮（渲染在面板头部区域，紧跟在标题行下方） */
  headerActions?: React.ReactNode;
  /** 点击 MiniMap 节点时滚动到对应节点 */
  onNodeClick?: (nodeId: string) => void;
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

/** MiniMap 节点颜色映射 */
const NODE_STATUS_COLORS: Record<string, string> = {
  confirmed: '#22c55e',
  pending: '#f59e0b',
  generating: '#3b82f6',
  error: '#ef4444',
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
  headerActions,
  onNodeClick,
}: TreePanelProps) {
  const safeNodes = nodes ?? [];
  const [_isAnimating, setIsAnimating] = useState(false);
  const panelBodyRef = useRef<HTMLDivElement>(null);

  // === F1.1: Reset scrollTop when panel expands ===
  useEffect(() => {
    if (!collapsed) {
      // Panel is expanding - reset scrollTop after animation frame
      setTimeout(() => {
        if (panelBodyRef.current) {
          panelBodyRef.current.scrollTop = 0;
        }
      }, 0);
    }
  }, [collapsed]);

  const handleToggle = () => {
    setIsAnimating(true);
    onToggleCollapse();
    setTimeout(() => setIsAnimating(false), 300);
  };

  const activeCount = (nodes ?? []).filter((n) => n.isActive !== false).length;
  const activeClass = isActive ? styles.treePanelActive : styles.treePanelDimmed;
  const treeColor = TREE_COLORS[tree];
  const treeIcon = TREE_ICONS[tree];

  // E2-F12: MiniMap — scroll node into view
  const handleMinimapClick = useCallback(
    (nodeId: string) => {
      onNodeClick?.(nodeId);
      // Find the DOM node for this node and scroll it into view
      const container = panelBodyRef.current;
      if (!container) return;
      const nodeEl = container.querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`);
      nodeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    [onNodeClick]
  );

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
          {activeCount}/{safeNodes.length}
        </span>
        <span
          className={`${styles.treePanelChevron} ${collapsed ? styles.chevronCollapsed : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* E1-T1: Header actions — rendered below the header toggle button */}
      {headerActions && !collapsed && (
        <div data-testid="tree-panel-header-actions" className={styles.treePanelHeaderActions}>
          {headerActions}
        </div>
      )}

      {/* Panel Body */}
      {!collapsed && (
        <div className={styles.treePanelBody} ref={panelBodyRef}>
          {/* Summary when no nodes */}
          {safeNodes.length === 0 && (
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
          {safeNodes.length > 0 && children}

          {/* Action buttons (shown when active) */}
          {isActive && onNodeConfirm && (
            <div className={styles.treePanelActions}>
              {/* Slot for add/edit actions */}
            </div>
          )}

          {/* E2-F12: MiniMap — only show when there are nodes, hide on mobile */}
          {safeNodes.length > 0 && (
            <MiniMapWidget
              nodes={nodes}
              treeType={tree}
              onNodeClick={handleMinimapClick}
            />
          )}
        </div>
      )}

      {/* Collapsed Summary */}
      {collapsed && safeNodes.length > 0 && (
        <div className={styles.treePanelCollapsedSummary}>
          {safeNodes.slice(0, 3).map((n) => (
            <span key={n.id} className={styles.treePanelSummaryNode}>
              {n.label}
            </span>
          ))}
          {safeNodes.length > 3 && (
            <span className={styles.treePanelSummaryMore}>+{safeNodes.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// E2-F12: MiniMap Widget
// =============================================================================

interface MiniMapWidgetProps {
  nodes: TreeNode[];
  treeType: TreeType;
  onNodeClick: (nodeId: string) => void;
}

/**
 * MiniMap — 迷你导航地图
 *
 * 显示所有节点为彩色小点，点击可跳转到对应节点
 * 移动端隐藏
 */
function MiniMapWidget({ nodes, treeType, onNodeClick }: MiniMapWidgetProps) {
  const safeNodes = nodes ?? [];
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) return null;

  const treeColor = TREE_COLORS[treeType];
  const MAX_VISIBLE_DOTS = 30;
  const visibleNodes = nodes.slice(0, MAX_VISIBLE_DOTS);
  const overCount = safeNodes.length - MAX_VISIBLE_DOTS;

  // Layout dots in a grid
  const COLS = 10;
  const DOT_SIZE = 8;
  const GAP = 3;
  const PADDING = 8;
  const rows = Math.ceil(visibleNodes.length / COLS);
  const canvasWidth = COLS * (DOT_SIZE + GAP) + PADDING * 2;
  const canvasHeight = rows * (DOT_SIZE + GAP) + PADDING * 2;

  return (
    <div
      className={styles.minimapWidget}
      title={`${safeNodes.length} 个节点，点击跳转`}
      aria-label={`${treeType} 树 MiniMap，${safeNodes.length} 个节点`}
    >
      <div className={styles.minimapHeader}>
        <span
          className={styles.minimapTreeIcon}
          style={{ color: treeColor }}
          aria-hidden="true"
        >
          {TREE_ICONS[treeType]}
        </span>
        <span className={styles.minimapTitle}>导航地图</span>
        <span className={styles.minimapCount}>{safeNodes.length}</span>
      </div>

      <div
        className={styles.minimapCanvas}
        style={{ width: canvasWidth, height: canvasHeight }}
        role="list"
        aria-label="MiniMap 节点列表"
      >
        {visibleNodes.map((node, idx) => {
          const col = idx % COLS;
          const row = Math.floor(idx / COLS);
          const color = NODE_STATUS_COLORS[node.status] ?? NODE_STATUS_COLORS.pending;

          return (
            <button
              key={node.id}
              type="button"
              role="listitem"
              className={styles.minimapDot}
              style={{
                left: PADDING + col * (DOT_SIZE + GAP),
                top: PADDING + row * (DOT_SIZE + GAP),
                width: DOT_SIZE,
                height: DOT_SIZE,
                background: color,
              }}
              title={node.label}
              aria-label={`跳转到 ${node.label}`}
              onClick={() => onNodeClick(node.id)}
            />
          );
        })}
        {overCount > 0 && (
          <span
            className={styles.minimapOverCount}
            style={{
              left: PADDING,
              top: PADDING + rows * (DOT_SIZE + GAP),
            }}
          >
            +{overCount}
          </span>
        )}
      </div>

      <div className={styles.minimapLegend}>
        <span className={styles.minimapLegendItem}>
          <span className={styles.minimapLegendDot} style={{ background: '#10b981' }} />
          已确认
        </span>
        <span className={styles.minimapLegendItem}>
          <span className={styles.minimapLegendDot} style={{ background: NODE_STATUS_COLORS.pending }} />
          待确认
        </span>
        <span className={styles.minimapLegendItem}>
          <span className={styles.minimapLegendDot} style={{ background: NODE_STATUS_COLORS.error }} />
          错误
        </span>
      </div>
    </div>
  );
}
