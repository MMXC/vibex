/**
 * TemplateDetail - 模板详情组件 (市场模板版)
 *
 * 展示 Template 类型模板的完整信息，支持预览、选择、使用
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { Template } from '@/types/template';
import { useTemplateStore } from '@/stores/templateStore';
import { TemplateRating } from './TemplateRating';
import styles from './TemplateDetail.module.css';

export interface TemplateDetailProps {
  /** 模板数据 */
  template: Template;
  /** 关闭回调 */
  onClose?: () => void;
  /** 应用回调 */
  onApply?: (template: Template) => void;
  /** 加载状态 */
  loading?: boolean;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
};

const PRICE_LABELS: Record<string, string> = {
  free: '免费',
  premium: '付费',
};

export function TemplateDetail({
  template,
  onClose,
  onApply,
  loading = false,
}: TemplateDetailProps) {
  const [activePreview, setActivePreview] = useState(0);
  const previews = template.previewImages.length > 0
    ? template.previewImages
    : template.thumbnail ? [template.thumbnail] : [];

  const handleApply = () => {
    onApply?.(template);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>{template.name}</h2>
              <div className={styles.badges}>
                <span className={`${styles.badge} ${styles[template.price]}`}>
                  {PRICE_LABELS[template.price]}
                </span>
                {template.featured && (
                  <span className={`${styles.badge} ${styles.featured}`}>
                    推荐
                  </span>
                )}
              </div>
            </div>
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <span className={styles.metaIcon}>◈</span>
                {template.author.name}
              </span>
              <span className={styles.metaItem}>
                <span className={styles.metaIcon}>⬇</span>
                {template.downloads.toLocaleString()} 下载
              </span>
              <span className={styles.metaItem}>
                <span className={styles.metaIcon}>⭐</span>
                {template.rating} ({Math.round(template.rating * 10)} 条评分)
              </span>
              <span className={styles.metaItem}>
                <span className={styles.metaIcon}>📄</span>
                {template.pages.length} 个页面
              </span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="关闭">
            ✕
          </button>
        </header>

        {/* 内容 */}
        <div className={styles.content}>
          {/* 左侧：预览 */}
          <div className={styles.preview}>
            {/* 主预览图 */}
            <div className={styles.mainPreview}>
              {previews[activePreview] ? (
                <img
                  src={previews[activePreview]}
                  alt={`${template.name} 预览 ${activePreview + 1}`}
                  className={styles.previewImg}
                />
              ) : (
                <div className={styles.previewPlaceholder}>
                  <span className={styles.placeholderIcon}>📄</span>
                  <span className={styles.placeholderText}>暂无预览图</span>
                </div>
              )}
            </div>

            {/* 缩略图列表 */}
            {previews.length > 1 && (
              <div className={styles.thumbnails}>
                {previews.map((img, idx) => (
                  <button
                    key={idx}
                    className={`${styles.thumb} ${idx === activePreview ? styles.thumbActive : ''}`}
                    onClick={() => setActivePreview(idx)}
                  >
                    <img src={img} alt={`预览 ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：详情 */}
          <div className={styles.details}>
            {/* 描述 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>描述</h3>
              <p className={styles.desc}>{template.description}</p>
            </section>

            {/* 难度 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>难度</h3>
              <span className={`${styles.difficulty} ${styles[template.difficulty]}`}>
                {DIFFICULTY_LABELS[template.difficulty]}
              </span>
            </section>

            {/* 标签 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>标签</h3>
              <div className={styles.tags}>
                {template.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </section>

            {/* 页面列表 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                包含页面 <span className={styles.count}>({template.pages.length})</span>
              </h3>
              <div className={styles.pageList}>
                {template.pages.map((page) => (
                  <div key={page.id} className={styles.pageItem}>
                    <span className={styles.pageIcon}>📄</span>
                    <div className={styles.pageInfo}>
                      <span className={styles.pageName}>{page.name}</span>
                      <span className={styles.pageRoute}>{page.route}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 评分 (E5) */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>评分</h3>
              <TemplateRatingSection template={template} />
            </section>

            {/* 技术信息 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>技术信息</h3>
              <div className={styles.techInfo}>
                <span className={styles.techItem}>
                  创建于 {template.createdAt
                    ? new Date(template.createdAt).toLocaleDateString('zh-CN')
                    : '-'}
                </span>
                <span className={styles.techItem}>
                  更新于 {template.updatedAt
                    ? new Date(template.updatedAt).toLocaleDateString('zh-CN')
                    : '-'}
                </span>
              </div>
            </section>
          </div>
        </div>

        {/* 底部操作 */}
        <footer className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            取消
          </button>
          <button className={styles.applyBtn} onClick={handleApply} disabled={loading}>
            {loading ? '创建中...' : '使用此模板'}
          </button>
        </footer>
      </div>
    </div>
  );
}

// ---- E5: 模板评分组件 ----

interface CommentInputProps {
  templateId: string;
  onSubmitted?: () => void;
}

function CommentInput({ templateId, onSubmitted }: CommentInputProps) {
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submitRating = useTemplateStore((s) => s.submitRating);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;
    setSubmitting(true);
    await submitRating(templateId, rating, comment);
    setSubmitting(false);
    setDone(true);
    onSubmitted?.();
  }, [rating, comment, templateId, submitRating, onSubmitted]);

  if (done) {
    return (
      <div className={styles.commentDone}>
        感谢你的评分！
      </div>
    );
  }

  return (
    <div className={styles.commentForm}>
      <TemplateRating value={rating} onChange={setRating} size="large" />
      <textarea
        className={styles.commentInput}
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 200))}
        placeholder="简短评论（可选，最多200字）"
        rows={2}
      />
      <span className={styles.charCount}>{comment.length}/200</span>
      <button
        className={styles.submitRatingBtn}
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
      >
        {submitting ? '提交中...' : '提交评分'}
      </button>
    </div>
  );
}

function TemplateRatingSection({ template }: { template: Template }) {
  const [showComment, setShowComment] = useState(false);
  const stats = useTemplateStore((s) =>
    template.id ? s.getTemplateStats(template.id) : null
  );

  const avgRating = stats?.avgRating ?? template.rating ?? 0;
  const ratingCount = stats?.ratingCount ?? 0;

  return (
    <div className={styles.ratingSection}>
      <TemplateRating
        average={avgRating}
        count={ratingCount}
        readonly
        size="medium"
      />
      <button
        className={styles.rateBtn}
        onClick={() => setShowComment((v) => !v)}
      >
        {showComment ? '取消' : '我要评分'}
      </button>
      {showComment && (
        <CommentInput templateId={template.id} />
      )}
    </div>
  );
}

export default TemplateDetail;
