/**
 * Flow Node Editor Component
 * 添加/删除/移动节点
 */

'use client';

import { useState, useCallback } from 'react';
import styles from './FlowNodeEditor.module.css';

export interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'input' | 'output';
  x: number;
  y: number;
}

export interface FlowNodeEditorProps {
  nodes: FlowNode[];
  onAdd?: (node: Omit<FlowNode, 'id'>) => void;
  onDelete?: (nodeId: string) => void;
  onMove?: (nodeId: string, x: number, y: number) => void;
}

export function FlowNodeEditor({ nodes, onAdd, onDelete, onMove }: FlowNodeEditorProps) {
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState<FlowNode['type']>('process');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleAdd = useCallback(() => {
    if (!newNodeLabel.trim()) return;
    onAdd?.({
      label: newNodeLabel,
      type: newNodeType,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
    });
    setNewNodeLabel('');
  }, [newNodeLabel, newNodeType, onAdd]);

  const handleDelete = useCallback((nodeId: string) => {
    onDelete?.(nodeId);
  }, [onDelete]);

  const handleDragStart = useCallback((e: React.MouseEvent, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setDraggingId(nodeId);
      setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
    }
  }, [nodes]);

  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (draggingId) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      onMove?.(draggingId, Math.max(0, newX), Math.max(0, newY));
    }
  }, [draggingId, dragOffset, onMove]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.addForm}>
        <h3 className={styles.title}>添加节点</h3>
        <div className={styles.formRow}>
          <input
            type="text"
            className={styles.input}
            value={newNodeLabel}
            onChange={(e) => setNewNodeLabel(e.target.value)}
            placeholder="节点名称"
          />
          <select
            className={styles.select}
            value={newNodeType}
            onChange={(e) => setNewNodeType(e.target.value as FlowNode['type'])}
          >
            <option value="start">开始</option>
            <option value="process">处理</option>
            <option value="decision">判断</option>
            <option value="input">输入</option>
            <option value="output">输出</option>
            <option value="end">结束</option>
          </select>
          <button type="button" className={styles.addButton} onClick={handleAdd}>
            添加
          </button>
        </div>
      </div>

      <div className={styles.nodeList}>
        <h3 className={styles.title}>节点列表 ({nodes.length})</h3>
        {nodes.length === 0 ? (
          <p className={styles.empty}>暂无节点</p>
        ) : (
          <ul className={styles.list}>
            {nodes.map((node) => (
              <li key={node.id} className={styles.nodeItem}>
                <span className={styles.nodeLabel}>{node.label}</span>
                <span className={styles.nodeType}>{node.type}</span>
                <button
                  type="button"
                  className={styles.dragHandle}
                  onMouseDown={(e) => handleDragStart(e, node.id)}
                >
                  ⋮⋮
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDelete(node.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {draggingId && (
        <div
          className={styles.dragOverlay}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        />
      )}
    </div>
  );
}

export default FlowNodeEditor;
