/**
 * Flow List Component
 * 流程列表切换：切换流程、当前高亮
 */
// @ts-nocheck


'use client';

import { useState, useCallback } from 'react';
import styles from './FlowList.module.css';

export interface Flow {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed';
  nodeCount: number;
  updatedAt: string;
}

export interface FlowListProps {
  flows: Flow[];
  currentFlowId?: string;
  onSelect?: (flowId: string) => void;
  onDelete?: (flowId: string) => void;
  onDuplicate?: (flowId: string) => void;
}

export function FlowList({
  flows,
  currentFlowId,
  onSelect,
  onDelete,
  onDuplicate,
}: FlowListProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(currentFlowId);

  const handleSelect = useCallback((flowId: string) => {
    setSelectedId(flowId);
    onSelect?.(flowId);
  }, [onSelect]);

  const getStatusColor = (status: Flow['status']) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'active': return '#3b82f6';
      case 'draft': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>流程列表</h3>
        <span className={styles.count}>{flows.length} 个流程</span>
      </div>

      <ul className={styles.list}>
        {flows.length === 0 ? (
          <li className={styles.empty}>暂无流程</li>
        ) : (
          flows.map((flow) => (
            <li
              key={flow.id}
              className={`${styles.item} ${selectedId === flow.id ? styles.selected : ''}`}
              onClick={() => handleSelect(flow.id)}
            >
              <div className={styles.itemContent}>
                <div className={styles.itemHeader}>
                  <span 
                    className={styles.statusDot}
                    style={{ backgroundColor: getStatusColor(flow.status) }}
                  />
                  <span className={styles.itemName}>{flow.name}</span>
                </div>
                {flow.description && (
                  <p className={styles.itemDescription}>{flow.description}</p>
                )}
                <div className={styles.itemMeta}>
                  <span className={styles.nodeCount}>{flow.nodeCount} 个节点</span>
                  <span className={styles.updatedAt}>
                    {new Date(flow.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>

              <div className={styles.itemActions}>
                {onDuplicate && (
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(flow.id);
                    }}
                    title="复制"
                  >
                    📋
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(flow.id);
                    }}
                    title="删除"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default FlowList;
