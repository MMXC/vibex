/**
 * TemplateSaveDialog.tsx — Save Canvas as Template Dialog
 * Sprint42 E3: Canvas 模板系统
 * Sprint49 E2: 支持编辑现有模板名称
 *
 * Saves the current canvas state as a new template in IndexedDB.
 * If `editTemplate` is provided, enters edit mode (rename existing template).
 */
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { createTemplate, updateTemplate, getTemplate, type CanvasTemplateData } from '@/lib/canvas/templateStore';
import { useTemplateStore } from '@/stores/templateStore';
import { serializeThreeTrees, serializeToJson } from '@/lib/canvas/serialize';
import styles from './TemplateSaveDialog.module.css';

interface TemplateSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (templateId: string) => void;
  /** 编辑现有模板（只填 name） */
  editTemplate?: { id: string; name: string; description?: string; icon?: string } | null;
}

const ICON_OPTIONS = ['📝', '📋', '🎯', '💡', '🚀', '⚡', '🔧', '🎨'];

export function TemplateSaveDialog({ isOpen, onClose, onSaved, editTemplate }: TemplateSaveDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📝');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const renameTemplate = useTemplateStore(s => s.renameTemplate);

  const isEditMode = !!editTemplate;

  // Pre-fill when opening in edit mode
  useEffect(() => {
    if (isOpen && editTemplate) {
      setName(editTemplate.name);
      setDescription(editTemplate.description ?? '');
      setSelectedIcon(editTemplate.icon ?? '📝');
    }
  }, [isOpen, editTemplate]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError('请输入模板名称');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isEditMode && editTemplate) {
        // E2: 编辑模式 — 重命名模板
        const renamed = renameTemplate(editTemplate.id, name.trim());
        if (!renamed) {
          setError('模板不存在或重命名失败');
          setSaving(false);
          return;
        }
        onSaved?.(editTemplate.id);
        onClose();
      } else {
        // 创建新模板
        const snapshot = serializeThreeTrees();
        const snapshotStr = serializeToJson(snapshot);
        const id = `user-${Date.now()}`;
        const template: CanvasTemplateData = {
          id,
          name: name.trim(),
          description: description.trim(),
          icon: selectedIcon,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          snapshot: snapshotStr,
          tags: ['custom'],
          isPreset: false,
          isUserCreated: true,
        };
        await createTemplate(template);
        onSaved?.(id);
        setName('');
        setDescription('');
        setSelectedIcon('📝');
        onClose();
      }
    } catch (err) {
      console.error('[TemplateSaveDialog] Save failed:', err);
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }, [name, description, selectedIcon, onClose, onSaved, isEditMode, editTemplate, renameTemplate]);

  const handleClose = useCallback(() => {
    setName('');
    setDescription('');
    setSelectedIcon('📝');
    setError('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={isEditMode ? '编辑模板' : '保存模板'}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {isEditMode ? '✏️ 编辑模板' : '💾 保存为模板'}
          </h3>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {/* Icon picker — only for create mode */}
          {!isEditMode && (
            <div className={styles.field}>
              <label className={styles.label}>图标</label>
              <div className={styles.iconPicker}>
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`${styles.iconBtn} ${selectedIcon === icon ? styles.iconBtnActive : ''}`}
                    onClick={() => setSelectedIcon(icon)}
                    aria-label={icon}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div className={styles.field}>
            <label htmlFor="template-name" className={styles.label}>
              模板名称 <span className={styles.required}>*</span>
            </label>
            <input
              id="template-name"
              type="text"
              className={styles.input}
              placeholder={isEditMode ? '输入新名称...' : '例如：电商模块设计模板'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Description — only for create mode */}
          {!isEditMode && (
            <div className={styles.field}>
              <label htmlFor="template-desc" className={styles.label}>
                描述
              </label>
              <textarea
                id="template-desc"
                className={styles.textarea}
                placeholder="简要描述这个模板的用途..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={200}
              />
            </div>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={handleClose} disabled={saving}>
            取消
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving ? '保存中...' : isEditMode ? '确认修改' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
