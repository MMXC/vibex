/**
 * RoutingDrawer — Left Drawer with Page List
 *
 * Shows all pages (routes) from the prototype store.
 * Allows adding/removing pages and navigating.
 *
 * Epic1-E3: S3.1 页面列表视图 + S3.2 路由导航跳转
 */

'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
import { usePrototypeStore } from '@/stores/prototypeStore';
import styles from './ProtoEditor.module.css';

// ==================== Props ====================

export interface RoutingDrawerProps {
  className?: string;
}

// ==================== Component ====================

export const RoutingDrawer = memo(function RoutingDrawer({
  className = '',
}: RoutingDrawerProps) {
  const { pages, nodes, edges, addPage, removePage, addEdge, removeEdge, selectedNodeId, selectNode } =
    usePrototypeStore();

  const [addingPage, setAddingPage] = useState(false);
  const [newRoute, setNewRoute] = useState('');
  const [newName, setNewName] = useState('');
  // E1-U2: Edge creation modal
  const [addingEdge, setAddingEdge] = useState(false);
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');

  // Count nodes per page (MVP: all nodes belong to first page)
  const getNodeCount = useCallback(
    (_pageId: string) => {
      // MVP: all nodes are on the same page
      return nodes.length;
    },
    [nodes]
  );

  const handleAddPage = useCallback(() => {
    if (!newRoute.trim()) return;
    addPage(newRoute.trim(), newName.trim() || newRoute.trim());
    setNewRoute('');
    setNewName('');
    setAddingPage(false);
  }, [newRoute, newName, addPage]);

  const handleRemovePage = useCallback(
    (e: React.MouseEvent, pageId: string) => {
      e.stopPropagation();
      if (pages.length <= 1) return;
      removePage(pageId);
    },
    [pages.length, removePage]
  );

  // E1-U2: Edge creation
  const handleAddEdge = useCallback(() => {
    if (!edgeSource || !edgeTarget || edgeSource === edgeTarget) return;
    addEdge(edgeSource, edgeTarget);
    setEdgeSource('');
    setEdgeTarget('');
    setAddingEdge(false);
  }, [edgeSource, edgeTarget, addEdge]);

  const handleRemoveEdge = useCallback(
    (e: React.MouseEvent, edgeId: string) => {
      e.stopPropagation();
      removeEdge(edgeId);
    },
    [removeEdge]
  );

  // Build a map from node/page id to page name for edge labels
  const pageNameMap = useMemo(
    () => Object.fromEntries(pages.map((p) => [p.id, p.name || p.route])),
    [pages]
  );

  // For edge display: source/target are node IDs, but user sees page names.
  // For MVP, show "source → target" using page name if found, else raw id.
  const getEdgeLabel = (edge: { source: string; target: string }) =>
    `${pageNameMap[edge.source] ?? edge.source} → ${pageNameMap[edge.target] ?? edge.target}`;

  return (
    <div className={`${styles.routingDrawer} ${className}`}>
      <div className={styles.drawerHeader}>
        <span className={styles.drawerTitle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          页面
        </span>
      </div>

      <div className={styles.drawerBody}>
        {pages.length === 0 ? (
          <div className={styles.drawerEmpty}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span>暂无页面</span>
          </div>
        ) : (
          pages.map((page) => {
            const count = getNodeCount(page.id);
            return (
              <div
                key={page.id}
                className={`${styles.pageItem} ${selectedNodeId ? '' : ''}`}
                onClick={() => selectNode(null)}
                title={page.route}
              >
                <span className={styles.pageItemRoute}>{page.route}</span>
                <span className={styles.pageItemCount}>{count}</span>
                {pages.length > 1 && (
                  <button
                    className={styles.iconBtn}
                    onClick={(e) => handleRemovePage(e, page.id)}
                    title="删除页面"
                    style={{ width: 20, height: 20, fontSize: 12 }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* E1-U2: Edge list section */}
      <div className={styles.drawerSectionHeader}>
        <span>连线</span>
        <button
          className={styles.addPageBtn}
          onClick={() => setAddingEdge(true)}
          disabled={pages.length < 2}
          title={pages.length < 2 ? '需要至少两个页面' : '添加连线'}
          style={{ fontSize: 10, padding: '2px 6px' }}
        >
          + 添加连线
        </button>
      </div>

      {edges.length > 0 && (
        <div className={styles.edgeList}>
          {edges.map((edge) => (
            <div key={edge.id} className={styles.edgeItem}>
              <span className={styles.edgeLabel}>{getEdgeLabel(edge)}</span>
              <button
                className={styles.iconBtn}
                onClick={(e) => handleRemoveEdge(e, edge.id)}
                title="删除连线"
                style={{ width: 16, height: 16, fontSize: 11 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {addingEdge && (
        <div className={styles.edgeModal}>
          <div className={styles.edgeModalTitle}>添加连线</div>
          <select
            value={edgeSource}
            onChange={(e) => setEdgeSource(e.target.value)}
            className={styles.edgeSelect}
          >
            <option value="">选择源页面</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>{p.name || p.route}</option>
            ))}
          </select>
          <span style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>→</span>
          <select
            value={edgeTarget}
            onChange={(e) => setEdgeTarget(e.target.value)}
            className={styles.edgeSelect}
          >
            <option value="">选择目标页面</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>{p.name || p.route}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <button
              onClick={handleAddEdge}
              disabled={!edgeSource || !edgeTarget || edgeSource === edgeTarget}
              className={styles.addPageBtn}
              style={{ flex: 1, fontSize: 11 }}
            >
              确定
            </button>
            <button
              onClick={() => { setAddingEdge(false); setEdgeSource(''); setEdgeTarget(''); }}
              className={styles.addPageBtn}
              style={{ flex: 1, fontSize: 11, opacity: 0.6 }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className={styles.drawerFooter}>
        {addingPage ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type="text"
              placeholder="路由, 如 /home"
              value={newRoute}
              onChange={(e) => setNewRoute(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddPage();
                if (e.key === 'Escape') setAddingPage(false);
              }}
              autoFocus
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 5,
                padding: '5px 8px',
                color: '#fff',
                fontSize: 12,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={handleAddPage}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  background: 'rgba(99,102,241,0.2)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: 5,
                  color: '#818cf8',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                添加
              </button>
              <button
                onClick={() => setAddingPage(false)}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 5,
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button className={styles.addPageBtn} onClick={() => setAddingPage(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加页面
          </button>
        )}
      </div>
    </div>
  );
});
