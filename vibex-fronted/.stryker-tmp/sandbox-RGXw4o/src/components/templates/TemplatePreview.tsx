/**
 * Template Preview
 * 
 * 模板预览组件 - 展示模板详细信息和预览图
 */
// @ts-nocheck


'use client';

import React, { useState } from 'react';
import type { Template } from '@/types/template';
import styles from './TemplatePreview.module.css';

export interface TemplatePreviewProps {
  /** 模板数据 */
  template: Template;
  /** 关闭回调 */
  onClose?: () => void;
  /** 应用回调 */
  onApply?: (template: Template) => void;
  /** 自定义类名 */
  className?: string;
}

export function TemplatePreview({
  template,
  onClose,
  onApply,
  className = '',
}: TemplatePreviewProps) {
  // 状态
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  // 处理缩放
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  // 处理应用
  const handleApply = () => {
    onApply?.(template);
  };

  // 获取预览图列表
  const previewImages = template.previewImages.length > 0 
    ? template.previewImages 
    : [template.thumbnail];

  return (
    <div className={`${styles.preview} ${className}`}>
      {/* 头部 */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>{template.name}</h2>
          <div className={styles.meta}>
            <span className={`${styles.price} ${template.price === 'free' ? styles.free : styles.premium}`}>
              {template.price === 'free' ? '免费' : '付费'}
            </span>
            {template.featured && <span className={styles.featured}>推荐</span>}
          </div>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      <div className={styles.content}>
        {/* 预览区 */}
        <div className={styles.previewArea}>
          {/* 缩放控制 */}
          <div className={styles.zoomControls}>
            <button onClick={handleZoomOut} title="缩小">−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} title="放大">+</button>
            <button onClick={handleZoomReset} title="重置">⟲</button>
          </div>

          {/* 主预览图 */}
          <div className={styles.mainImage} style={{ transform: `scale(${zoom})` }}>
            {previewImages[activeImageIndex] ? (
              <img 
                src={previewImages[activeImageIndex]} 
                alt={`${template.name} 预览`}
              />
            ) : (
              <div className={styles.placeholder}>
                <span>暂无预览图</span>
              </div>
            )}
          </div>

          {/* 缩略图列表 */}
          {previewImages.length > 1 && (
            <div className={styles.thumbnails}>
              {previewImages.map((img, index) => (
                <button
                  key={index}
                  className={`${styles.thumbnail} ${index === activeImageIndex ? styles.active : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={img} alt={`预览 ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 详情区 */}
        <div className={styles.details}>
          {/* 描述 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>描述</h3>
            <p className={styles.description}>{template.description}</p>
          </div>

          {/* 标签 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>标签</h3>
            <div className={styles.tags}>
              {template.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>

          {/* 页面 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>包含页面 ({template.pages.length})</h3>
            <ul className={styles.pageList}>
              {template.pages.map(page => (
                <li key={page.id} className={styles.pageItem}>
                  <span className={styles.pageName}>{page.name}</span>
                  <span className={styles.pageRoute}>{page.route}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 统计 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>统计数据</h3>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{template.downloads}</span>
                <span className={styles.statLabel}>下载量</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{template.rating}</span>
                <span className={styles.statLabel}>评分</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {template.difficulty === 'beginner' ? '入门' : 
                   template.difficulty === 'intermediate' ? '进阶' : '高级'}
                </span>
                <span className={styles.statLabel}>难度</span>
              </div>
            </div>
          </div>

          {/* 作者 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>作者</h3>
            <div className={styles.author}>
              {template.author.avatar && (
                <img 
                  src={template.author.avatar} 
                  alt={template.author.name}
                  className={styles.authorAvatar}
                />
              )}
              <span className={styles.authorName}>{template.author.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className={styles.footer}>
        <button className={styles.cancelButton} onClick={onClose}>
          取消
        </button>
        <button className={styles.applyButton} onClick={handleApply}>
          使用此模板
        </button>
      </div>
    </div>
  );
}

export default TemplatePreview;