'use client';

/**
 * Templates Page
 * 
 * 模板市场页面 - 展示所有可用模板
 */

import { useState, useCallback } from 'react';

/** Dev-only logger */
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
};
import { TemplateGallery, TemplatePreview } from '@/components/templates';
import type { Template } from '@/types/template';
import styles from './templates.module.css';

export default function TemplatesPage() {
  // 状态
  const [galleryOpen, setGalleryOpen] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // 处理模板选择
  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  }, []);

  // 处理模板预览关闭
  const handlePreviewClose = useCallback(() => {
    setPreviewOpen(false);
    setSelectedTemplate(null);
  }, []);

  // 处理模板应用
  const handleApply = useCallback((template: Template) => {
    devLog('Applying template:', template.name);
    alert(`已选择模板: ${template.name}\n点击"使用此模板"开始创建项目！`);
    setPreviewOpen(false);
    setSelectedTemplate(null);
  }, []);

  return (
    <div className={styles.page}>
      {/* 页面头部 */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>模板市场</h1>
          <p className={styles.subtitle}>
            从预置模板开始，快速创建你的项目
          </p>
        </div>
      </header>

      {/* 模板画廊 */}
      <main className={styles.main}>
        <TemplateGallery
          isOpen={galleryOpen}
          onSelect={handleTemplateSelect}
          onClose={() => setGalleryOpen(false)}
        />
      </main>

      {/* 模板预览弹窗 */}
      {previewOpen && selectedTemplate && (
        <div className={styles.previewOverlay}>
          <TemplatePreview
            template={selectedTemplate}
            onClose={handlePreviewClose}
            onApply={handleApply}
          />
        </div>
      )}
    </div>
  );
}
