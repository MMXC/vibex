/**
 * TemplateEditDialog.tsx — Canvas Template Edit Dialog
 * Sprint52 E4: 模板管理增强（分类/标签/搜索）
 *
 * Modal dialog for editing a template's category and tags.
 * Integrates with templateStore (Zustand) and IndexedDB persistence.
 */
'use client';

import React, { memo, useState, useCallback } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import type { RequirementTemplate } from '@/data/templates';
import styles from './TemplateEditDialog.module.css';

interface TemplateEditDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Template being edited */
  template: RequirementTemplate | null;
  /** Called when dialog closes */
  onClose: () => void;
}

const CANVAS_CATEGORIES: { value: RequirementTemplate['category']; label: string }[] = [
  { value: 'saas', label: 'SaaS 产品' },
  { value: 'ecommerce', label: '电商平台' },
  { value: 'fintech', label: '金融科技' },
  { value: 'healthcare', label: '医疗健康' },
  { value: 'education', label: '在线教育' },
  { value: 'social', label: '社交网络' },
  { value: 'game', label: '游戏' },
  { value: 'iot', label: '物联网' },
  { value: 'enterprise', label: '企业服务' },
  { value: 'mobile', label: '移动应用' },
  { value: 'content', label: '内容平台' },
  { value: 'logistics', label: '物流' },
  { value: 'restaurant', label: '餐饮' },
  { value: 'custom', label: '自定义' },
];

export const TemplateEditDialog = memo<TemplateEditDialogProps>(
  ({ isOpen, template, onClose }) => {
    const { addTemplateTag, removeTemplateTag } = useTemplateStore();

    const [newTag, setNewTag] = useState('');
    const [saving, setSaving] = useState(false);

    const handleCategoryChange = useCallback(
      async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!template) return;
        setSaving(true);
        try {
          await useTemplateStore.getState().setTemplateCategory(
            template.id,
            e.target.value as RequirementTemplate['category']
          );
        } finally {
          setSaving(false);
        }
      },
      [template]
    );

    const handleAddTag = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (!template || !newTag.trim()) return;
        setSaving(true);
        try {
          await addTemplateTag(template.id, newTag.trim());
          setNewTag('');
        } finally {
          setSaving(false);
        }
      },
      [template, newTag, addTemplateTag]
    );

    const handleRemoveTag = useCallback(
      async (tag: string) => {
        if (!template) return;
        setSaving(true);
        try {
          await removeTemplateTag(template.id, tag);
        } finally {
          setSaving(false);
        }
      },
      [template, removeTemplateTag]
    );

    if (!isOpen || !template) return null;

    return (
      <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="编辑模板">
        <div className={styles.dialog}>
          <div className={styles.header}>
            <h3 className={styles.title}>编辑模板: {template.name}</h3>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>

          <div className={styles.body}>
            {/* Category selector */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="template-category">
                行业分类
              </label>
              <select
                id="template-category"
                className={styles.select}
                value={template.category}
                onChange={handleCategoryChange}
                disabled={saving}
              >
                {CANVAS_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className={styles.field}>
              <label className={styles.label}>标签</label>
              <div className={styles.tagList}>
                {(template.tags || []).map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      className={styles.tagRemove}
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`移除标签 ${tag}`}
                      disabled={saving}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              <form className={styles.tagForm} onSubmit={handleAddTag}>
                <input
                  type="text"
                  className={styles.tagInput}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="添加标签..."
                  maxLength={30}
                  disabled={saving}
                />
                <button
                  type="submit"
                  className={styles.tagAddBtn}
                  disabled={!newTag.trim() || saving}
                >
                  添加
                </button>
              </form>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.doneBtn} onClick={onClose}>
              完成
            </button>
          </div>
        </div>
      </div>
    );
  }
);

TemplateEditDialog.displayName = 'TemplateEditDialog';
