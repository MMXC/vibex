'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './NodeSelector.module.css';

export interface NodeItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  icon?: string;
  recentlyUsed?: boolean;
}

export interface NodeSelectorProps {
  /** 节点列表 */
  nodes: NodeItem[];
  /** 已选中的节点 */
  selected?: string[];
  /** 多选模式 */
  multiple?: boolean;
  /** 最大选择数量 (多选模式) */
  maxSelect?: number;
  /** 搜索回调 */
  onSearch?: (query: string) => void;
  /** 选择回调 */
  onSelect?: (nodeId: string | string[]) => void;
  /** 自定义类名 */
  className?: string;
}

export function NodeSelector({
  nodes,
  selected = [],
  multiple = false,
  maxSelect,
  onSearch,
  onSelect,
  className = '',
}: NodeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showConfirm, setShowConfirm] = useState(false);

  // 提取分类
  const categories = useMemo(() => {
    const cats = new Set(nodes.map(n => n.category));
    return ['all', ...Array.from(cats)];
  }, [nodes]);

  // 过滤节点
  const filteredNodes = useMemo(() => {
    let result = nodes;

    // 按分类过滤
    if (activeCategory !== 'all') {
      result = result.filter(n => n.category === activeCategory);
    }

    // 按搜索词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.name.toLowerCase().includes(query) ||
        n.description?.toLowerCase().includes(query)
      );
    }

    // 排序：最近使用 > 名称
    return result.sort((a, b) => {
      if (a.recentlyUsed && !b.recentlyUsed) return -1;
      if (!a.recentlyUsed && b.recentlyUsed) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [nodes, activeCategory, searchQuery]);

  // 搜索处理
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  }, [onSearch]);

  // 选择节点
  const handleSelect = useCallback((nodeId: string) => {
    if (multiple) {
      const isSelected = selected.includes(nodeId);
      
      if (isSelected) {
        // 取消选择
        onSelect?.(selected.filter(id => id !== nodeId));
      } else if (!maxSelect || selected.length < maxSelect) {
        // 新增选择
        if (maxSelect && selected.length === maxSelect - 1) {
          setShowConfirm(true);
        }
        onSelect?.([...selected, nodeId]);
      }
    } else {
      onSelect?.(nodeId);
    }
  }, [multiple, selected, maxSelect, onSelect]);

  // 全选
  const handleSelectAll = useCallback(() => {
    if (!multiple) return;
    const allIds = filteredNodes.map(n => n.id);
    onSelect?.(allIds);
  }, [multiple, filteredNodes, onSelect]);

  // 反选
  const handleInvert = useCallback(() => {
    if (!multiple) return;
    const allIds = filteredNodes.map(n => n.id);
    const unselected = allIds.filter(id => !selected.includes(id));
    onSelect?.(unselected);
  }, [multiple, filteredNodes, selected, onSelect]);

  return (
    <div className={`${styles.container} ${className}`}>
      {/* 搜索栏 */}
      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索节点..."
          value={searchQuery}
          onChange={handleSearch}
        />
        {multiple && (
          <div className={styles.batchActions}>
            <button
              className={styles.batchButton}
              onClick={handleSelectAll}
              type="button"
            >
              全选
            </button>
            <button
              className={styles.batchButton}
              onClick={handleInvert}
              type="button"
            >
              反选
            </button>
          </div>
        )}
      </div>

      {/* 分类过滤 */}
      <div className={styles.categories}>
        {categories.map(cat => (
          <button
            key={cat}
            className={`${styles.categoryButton} ${activeCategory === cat ? styles.active : ''}`}
            onClick={() => setActiveCategory(cat)}
            type="button"
          >
            {cat === 'all' ? '全部' : cat}
          </button>
        ))}
      </div>

      {/* 节点列表 */}
      <div className={styles.nodeList}>
        {filteredNodes.map(node => {
          const isSelected = selected.includes(node.id);
          
          return (
            <div
              key={node.id}
              className={`${styles.nodeItem} ${isSelected ? styles.selected : ''}`}
              onClick={() => handleSelect(node.id)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSelect(node.id);
                }
              }}
            >
              <div className={styles.nodeIcon}>
                {node.icon || '📦'}
              </div>
              <div className={styles.nodeInfo}>
                <div className={styles.nodeName}>
                  {node.name}
                  {node.recentlyUsed && <span className={styles.recentBadge}>最近使用</span>}
                </div>
                {node.description && (
                  <div className={styles.nodeDesc}>{node.description}</div>
                )}
              </div>
              <div className={styles.checkbox}>
                {isSelected && '✓'}
              </div>
            </div>
          );
        })}
      </div>

      {/* 已选数量提示 */}
      {multiple && (
        <div className={styles.selectionInfo}>
          已选择 {selected.length} 个节点
          {maxSelect && ` (最多 ${maxSelect})`}
        </div>
      )}
    </div>
  );
}

// 节点选择器弹窗
interface NodeSelectorModalProps extends NodeSelectorProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function NodeSelectorModal({
  open,
  onClose,
  title = '选择节点',
  ...props
}: NodeSelectorModalProps) {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.closeButton} onClick={onClose} type="button">×</button>
        </div>
        <NodeSelector {...props} />
      </div>
    </div>
  );
}
