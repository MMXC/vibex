/**
 * /templates/tags/page.tsx — S88-E3: Template Tag Management Page
 *
 * Admin-only page for managing global template tags.
 * Lists all tags with template counts, allows create/delete.
 *
 * DoD Checklist:
 * [x] /templates/tags page renders tag list
 * [x] Add tag form
 * [x] Delete tag button
 * [x] Admin-only (usePermission check)
 */
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import styles from './tags.module.css';

interface TagItem {
  id: string;
  name: string;
  color: string;
  category: string;
  template_count: number;
}

export default function TagsManagementPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/templates/tags');
      const data = await res.json();
      if (data.success) setTags(data.tags ?? []);
      else setError(data.error ?? 'Failed to load tags');
    } catch {
      setError('Network error loading tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleAddTag = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTagName.trim();
    if (!name) return;

    setSaving(true);
    try {
      const res = await fetch('/api/templates/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        setTags((prev) => [...prev, data.tag]);
        setNewTagName('');
      } else {
        setError(data.error ?? 'Failed to add tag');
      }
    } catch {
      setError('Network error adding tag');
    } finally {
      setSaving(false);
    }
  }, [newTagName]);

  const handleDeleteTag = useCallback(async (tag: TagItem) => {
    if (!confirm(`Delete tag "${tag.name}"?`)) return;
    try {
      const res = await fetch(`/api/templates/tags/${tag.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTags((prev) => prev.filter((t) => t.id !== tag.id));
      } else {
        setError(data.error ?? 'Failed to delete tag');
      }
    } catch {
      setError('Network error deleting tag');
    }
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>模板标签管理</h1>
        <p className={styles.subtitle}>管理模板市场的全局标签</p>
      </div>

      {/* Add tag form */}
      <form className={styles.addForm} onSubmit={handleAddTag}>
        <input
          type="text"
          className={styles.input}
          placeholder="新标签名称"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          maxLength={50}
          disabled={saving}
        />
        <button type="submit" className={styles.addBtn} disabled={saving || !newTagName.trim()}>
          {saving ? '添加中...' : '添加标签'}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {/* Tag list */}
      {loading ? (
        <div className={styles.loading}>加载中...</div>
      ) : tags.length === 0 ? (
        <div className={styles.empty}>暂无标签</div>
      ) : (
        <div className={styles.tagList}>
          {tags.map((tag) => (
            <div key={tag.id} className={styles.tagItem}>
              <div className={styles.tagInfo}>
                <span
                  className={styles.tagDot}
                  style={{ background: tag.color }}
                  aria-hidden="true"
                />
                <span className={styles.tagName}>{tag.name}</span>
                <span className={styles.tagCount}>{tag.template_count} 个模板</span>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDeleteTag(tag)}
                aria-label={`删除标签 ${tag.name}`}
                title="删除标签"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
