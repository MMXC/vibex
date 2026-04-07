/**
 * NodeTreeSelector - 节点树选择器组件
 * 
 * 功能：
 * - 显示页面/组件/功能节点树
 * - 支持勾选/取消勾选
 * - 支持全选/取消全选
 * - 显示选中数量
 */
import React, { useState, useCallback } from 'react';
import styles from './NodeTreeSelector.module.css';

export interface PageTreeNode {
  id: string;
  name: string;
  type: 'page' | 'component' | 'feature' | 'context' | 'entity';
  selected: boolean;
  description?: string;
  children?: PageTreeNode[];
}

export interface NodeTreeSelectorProps {
  /** 节点数据 */
  nodes: PageTreeNode[];
  /** 选中的节点 ID 集合 */
  selectedIds: Set<string>;
  /** 选中变化回调 */
  onSelectionChange: (nodeIds: string[]) => void;
  /** 展开/收起切换 */
  onToggle?: () => void;
  /** 是否展开 */
  defaultExpanded?: boolean;
}

/**
 * 递归渲染树节点
 */
const TreeNode: React.FC<{
  node: PageTreeNode;
  level: number;
  selectedIds: Set<string>;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string, selected: boolean) => void;
}> = ({ node, level, selectedIds, onToggle, onSelect }) => {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedIds.has(node.id);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(node.id, e.target.checked);
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page': return '📄';
      case 'component': return '🧩';
      case 'feature': return '⚡';
      case 'context': return '🎯';
      case 'entity': return '📦';
      default: return '📌';
    }
  };

  return (
    <div className={styles.treeNodeContainer}>
      <div 
        className={`${styles.treeNode} ${isSelected ? styles.selected : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* 展开/收起按钮 */}
        <button 
          className={`${styles.expandBtn} ${hasChildren ? styles.visible : ''}`}
          onClick={handleExpandClick}
        >
          {expanded ? '▼' : '▶'}
        </button>

        {/* 复选框 */}
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
          />
          <span className={styles.checkmark}></span>
        </label>

        {/* 类型图标 */}
        <span className={styles.typeIcon}>{getTypeIcon(node.type)}</span>

        {/* 节点名称 */}
        <span className={styles.nodeName}>{node.name}</span>

        {/* 描述（仅在选中时显示） */}
        {node.description && isSelected && (
          <span className={styles.nodeDesc}>{node.description}</span>
        )}
      </div>

      {/* 子节点 */}
      {hasChildren && expanded && (
        <div className={styles.children}>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedIds={selectedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const NodeTreeSelector: React.FC<NodeTreeSelectorProps> = ({
  nodes,
  selectedIds,
  onSelectionChange,
  onToggle,
  defaultExpanded = true,
}) => {
  // 处理单个节点选择
  const handleNodeSelect = useCallback((nodeId: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(nodeId);
    } else {
      newSelected.delete(nodeId);
    }
    onSelectionChange(Array.from(newSelected));
  }, [selectedIds, onSelectionChange]);

  // 全选
  const handleSelectAll = useCallback(() => {
    const allIds: string[] = [];
    const collectIds = (nodeList: PageTreeNode[]) => {
      nodeList.forEach(node => {
        allIds.push(node.id);
        if (node.children) collectIds(node.children);
      });
    };
    collectIds(nodes);
    onSelectionChange(allIds);
  }, [nodes, onSelectionChange]);

  // 取消全选
  const handleDeselectAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // 计算总节点数
  const countTotalNodes = (nodeList: PageTreeNode[]): number => {
    return nodeList.reduce((count, node) => {
      return count + 1 + (node.children ? countTotalNodes(node.children) : 0);
    }, 0);
  };

  const totalCount = countTotalNodes(nodes);
  const selectedCount = selectedIds.size;

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>🌳 页面组件选择</span>
          <span className={styles.count}>
            已选择 {selectedCount} / {totalCount} 个节点
          </span>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.actionBtn}
            onClick={handleSelectAll}
          >
            全选
          </button>
          <button 
            className={styles.actionBtn}
            onClick={handleDeselectAll}
          >
            清除
          </button>
          {onToggle && (
            <button 
              className={styles.toggleBtn}
              onClick={onToggle}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 节点列表 */}
      <div className={styles.nodeList}>
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            selectedIds={selectedIds}
            onToggle={() => {}}
            onSelect={handleNodeSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default NodeTreeSelector;
