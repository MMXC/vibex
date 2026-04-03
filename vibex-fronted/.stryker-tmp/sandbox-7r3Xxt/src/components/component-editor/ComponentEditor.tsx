/**
 * Component Editor Component
 * 添加/删除/移动组件
 */
// @ts-nocheck


'use client';

import { useState, useCallback } from 'react';
import styles from './ComponentEditor.module.css';

export interface ComponentItem {
  id: string;
  type: string;
  name: string;
}

export interface ComponentEditorProps {
  components: ComponentItem[];
  onAdd?: (comp: Omit<ComponentItem, 'id'>) => void;
  onDelete?: (compId: string) => void;
  onMove?: (compId: string, direction: 'up' | 'down') => void;
}

export function ComponentEditor({ components, onAdd, onDelete, onMove }: ComponentEditorProps) {
  const [newCompType, setNewCompType] = useState('button');
  const [newCompName, setNewCompName] = useState('');

  const handleAdd = useCallback(() => {
    if (!newCompName.trim()) return;
    onAdd?.({ type: newCompType, name: newCompName });
    setNewCompName('');
  }, [newCompType, newCompName, onAdd]);

  return (
    <div className={styles.container}>
      <div className={styles.addForm}>
        <h3 className={styles.title}>添加组件</h3>
        <div className={styles.formRow}>
          <select className={styles.select} value={newCompType} onChange={e => setNewCompType(e.target.value)}>
            <option value="button">按钮</option>
            <option value="input">输入框</option>
            <option value="card">卡片</option>
            <option value="list">列表</option>
            <option value="table">表格</option>
          </select>
          <input type="text" className={styles.input} value={newCompName} onChange={e => setNewCompName(e.target.value)} placeholder="组件名称" />
          <button type="button" className={styles.addButton} onClick={handleAdd}>添加</button>
        </div>
      </div>
      <div className={styles.componentList}>
        <h3 className={styles.title}>组件列表 ({components.length})</h3>
        {components.length === 0 ? (
          <p className={styles.empty}>暂无组件</p>
        ) : (
          <ul className={styles.list}>
            {components.map((comp, index) => (
              <li key={comp.id} className={styles.componentItem}>
                <span className={styles.componentIcon}>{comp.type === 'button' ? '🔘' : comp.type === 'input' ? '📝' : '📦'}</span>
                <span className={styles.componentName}>{comp.name}</span>
                <span className={styles.componentType}>{comp.type}</span>
                <div className={styles.actions}>
                  <button type="button" className={styles.moveButton} onClick={() => onMove?.(comp.id, 'up')} disabled={index === 0}>↑</button>
                  <button type="button" className={styles.moveButton} onClick={() => onMove?.(comp.id, 'down')} disabled={index === components.length - 1}>↓</button>
                  <button type="button" className={styles.deleteButton} onClick={() => onDelete?.(comp.id)}>×</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ComponentEditor;
