/**
 * PublishTemplateDialog.tsx — Sprint85 E5: 模板发布与评分系统
 *
 * Dialog for publishing the current canvas as a community template.
 * Collects: name (required), description, tags, and captures a thumbnail.
 *
 * data-testid="publish-template-dialog"
 */
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';
import { useTemplateStore } from '@/stores/templateStore';
import { getUserId } from '@/lib/auth-token';
import styles from './PublishTemplateDialog.module.css';

export interface PublishTemplateDialogProps {
  isOpen: boolean;
  canvasId?: string;
  onClose: () => void;
  /** Called after successful publish with the new template ID */
  onPublished?: (templateId: string) => void;
}

const PRESET_TAGS = [
  '电商', '教育', '医疗', '金融', '社交', '游戏', '物联网',
  '企业', '移动', '内容', '物流', 'API设计', '数据建模', '流程图',
];

export function PublishTemplateDialog({
  isOpen,
  canvasId,
  onClose,
  onPublished,
}: PublishTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const publishTemplate = useTemplateStore((s) => s.publishTemplate);
  const getCanvasName = useDDSCanvasStore((s) => s.projectName);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName(getCanvasName || '');
      setDescription('');
      setSelectedTags([]);
      setThumbnail(undefined);
      setLoading(false);
      setError(null);
      setPublished(false);
      setPublishedId(null);
    }
  }, [isOpen, getCanvasName]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handlePublish = useCallback(async () => {
    if (!name.trim()) {
      setError('请输入模板名称');
      return;
    }
    setLoading(true);
    setError(null);

    const result = await publishTemplate({
      name: name.trim(),
      description: description.trim(),
      tags: selectedTags,
      thumbnail,
      canvasId,
    });

    setLoading(false);
    if (result.ok && result.templateId) {
      setPublished(true);
      setPublishedId(result.templateId);
      onPublished?.(result.templateId);
    } else {
      setError(result.error || '发布失败，请重试');
    }
  }, [name, description, selectedTags, thumbnail, canvasId, publishTemplate, onPublished]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.dialog} data-testid="publish-template-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-title">
        {/* Header */}
        <div className={styles.header}>
          <h2 id="publish-title" className={styles.title}>发布为模板</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">✕</button>
        </div>

        {published ? (
          /* Success state */
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <h3 className={styles.successTitle}>发布成功！</h3>
            <p className={styles.successMsg}>你的模板已发布到社区</p>
            {publishedId && (
              <p className={styles.successId}>模板ID: {publishedId.slice(0, 8)}...</p>
            )}
            <button className={styles.primaryBtn} onClick={onClose}>完成</button>
          </div>
        ) : (
          /* Form */
          <div className={styles.body}>
            {/* Template name */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="tpl-name">
                模板名称 <span className={styles.required}>*</span>
              </label>
              <input
                id="tpl-name"
                className={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：电商产品需求分析模板"
                maxLength={200}
                autoFocus
              />
              <span className={styles.hint}>{name.length}/200</span>
            </div>

            {/* Description */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="tpl-desc">描述</label>
              <textarea
                id="tpl-desc"
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述这个模板的用途和使用场景"
                maxLength={500}
                rows={3}
              />
            </div>

            {/* Tags */}
            <div className={styles.field}>
              <label className={styles.label}>标签（可多选）</label>
              <div className={styles.tagGrid}>
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.tagChip} ${selectedTags.includes(tag) ? styles.tagActive : ''}`}
                    onClick={() => toggleTag(tag)}
                    aria-pressed={selectedTags.includes(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbnail preview */}
            <div className={styles.field}>
              <label className={styles.label}>封面缩略图</label>
              {thumbnail ? (
                <div className={styles.thumbnailPreview}>
                  <img src={thumbnail} alt="模板封面预览" className={styles.thumbnailImg} />
                  <button
                    type="button"
                    className={styles.removeThumb}
                    onClick={() => setThumbnail(undefined)}
                  >
                    移除
                  </button>
                </div>
              ) : (
                <div className={styles.thumbnailPlaceholder}>
                  <span>将从画布自动生成</span>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className={styles.errorMsg} role="alert">{error}</div>
            )}
          </div>
        )}

        {/* Footer */}
        {!published && (
          <div className={styles.footer}>
            <button className={styles.secondaryBtn} onClick={onClose} disabled={loading}>
              取消
            </button>
            <button
              className={styles.primaryBtn}
              onClick={handlePublish}
              disabled={loading || !name.trim()}
            >
              {loading ? '发布中...' : '发布模板'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
