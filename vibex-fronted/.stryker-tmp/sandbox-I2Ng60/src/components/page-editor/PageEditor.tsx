/**
 * Page Editor Component
 * 添加/删除页面
 */
// @ts-nocheck


'use client';

import { useState, useCallback } from 'react';
import styles from './PageEditor.module.css';

export interface PageItem {
  id: string;
  name: string;
  route: string;
}

export interface PageEditorProps {
  pages: PageItem[];
  onAdd?: (page: Omit<PageItem, 'id'>) => void;
  onDelete?: (pageId: string) => void;
  onUpdate?: (pageId: string, updates: Partial<PageItem>) => void;
}

export function PageEditor({ pages, onAdd, onDelete, onUpdate }: PageEditorProps) {
  const [newPageName, setNewPageName] = useState('');
  const [newPageRoute, setNewPageRoute] = useState('');

  const handleAdd = useCallback(() => {
    if (!newPageName.trim() || !newPageRoute.trim()) return;
    onAdd?.({ name: newPageName, route: newPageRoute });
    setNewPageName('');
    setNewPageRoute('');
  }, [newPageName, newPageRoute, onAdd]);

  return (
    <div className={styles.container}>
      <div className={styles.addForm}>
        <h3 className={styles.title}>添加页面</h3>
        <div className={styles.formRow}>
          <input type="text" className={styles.input} value={newPageName} onChange={e => setNewPageName(e.target.value)} placeholder="页面名称" />
          <input type="text" className={styles.input} value={newPageRoute} onChange={e => setNewPageRoute(e.target.value)} placeholder="/page" />
          <button type="button" className={styles.addButton} onClick={handleAdd}>添加</button>
        </div>
      </div>
      <div className={styles.pageList}>
        <h3 className={styles.title}>页面列表 ({pages.length})</h3>
        {pages.length === 0 ? (
          <p className={styles.empty}>暂无页面</p>
        ) : (
          <ul className={styles.list}>
            {pages.map(page => (
              <li key={page.id} className={styles.pageItem}>
                <span className={styles.pageName}>{page.name}</span>
                <span className={styles.pageRoute}>{page.route}</span>
                <button type="button" className={styles.deleteButton} onClick={() => onDelete?.(page.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default PageEditor;
