/**
 * Flow Branch Editor Component
 * 添加/删除条件分支
 */
// @ts-nocheck


'use client';

import { useState, useCallback } from 'react';
import styles from './FlowBranchEditor.module.css';

export interface FlowBranch {
  id: string;
  nodeId: string;
  condition: string;
  targetNodeId: string;
}

export interface FlowBranchEditorProps {
  branches: FlowBranch[];
  nodeIds: string[];
  onAdd?: (branch: Omit<FlowBranch, 'id'>) => void;
  onDelete?: (branchId: string) => void;
  onUpdate?: (branchId: string, updates: Partial<FlowBranch>) => void;
}

export function FlowBranchEditor({ branches, nodeIds, onAdd, onDelete, onUpdate }: FlowBranchEditorProps) {
  const [newNodeId, setNewNodeId] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newTargetId, setNewTargetId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    if (!newNodeId || !newCondition || !newTargetId) return;
    onAdd?.({ nodeId: newNodeId, condition: newCondition, targetNodeId: newTargetId });
    setNewNodeId('');
    setNewCondition('');
    setNewTargetId('');
  }, [newNodeId, newCondition, newTargetId, onAdd]);

  const handleDelete = useCallback((id: string) => {
    onDelete?.(id);
  }, [onDelete]);

  return (
    <div className={styles.container}>
      <div className={styles.addForm}>
        <h3 className={styles.title}>添加分支</h3>
        <div className={styles.form}>
          <select className={styles.select} value={newNodeId} onChange={(e) => setNewNodeId(e.target.value)}>
            <option value="">选择源节点</option>
            {nodeIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
          <input
            type="text"
            className={styles.input}
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            placeholder="条件 (如: x > 0)"
          />
          <select className={styles.select} value={newTargetId} onChange={(e) => setNewTargetId(e.target.value)}>
            <option value="">目标节点</option>
            {nodeIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
          <button type="button" className={styles.addButton} onClick={handleAdd}>添加</button>
        </div>
      </div>

      <div className={styles.branchList}>
        <h3 className={styles.title}>分支列表 ({branches.length})</h3>
        {branches.length === 0 ? (
          <p className={styles.empty}>暂无分支</p>
        ) : (
          <ul className={styles.list}>
            {branches.map((branch) => (
              <li key={branch.id} className={styles.branchItem}>
                <span className={styles.nodeId}>{branch.nodeId}</span>
                <span className={styles.arrow}>→</span>
                <span className={styles.condition}>{branch.condition}</span>
                <span className={styles.arrow}>→</span>
                <span className={styles.targetId}>{branch.targetNodeId}</span>
                <button type="button" className={styles.deleteButton} onClick={() => handleDelete(branch.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FlowBranchEditor;
