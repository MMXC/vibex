'use client';

/**
 * Templates Page
 * 
 * 模板市场页面 - 展示所有可用模板
 * 
 * E2: 集成了完整的模板选择流程
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/** Dev-only logger */
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
};
import { TemplateGallery, TemplateDetail } from '@/components/templates';
import type { Template } from '@/types/template';
import styles from './templates.module.css';

export default function TemplatesPage() {
  const router = useRouter();

  // 状态
  const [galleryOpen, setGalleryOpen] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // 处理模板选择（点击卡片）
  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setDetailOpen(true);
  }, []);

  // 处理模板详情关闭
  const handleDetailClose = useCallback(() => {
    setDetailOpen(false);
    setSelectedTemplate(null);
  }, []);

  // 处理模板应用
  const handleApply = useCallback((template: Template) => {
    devLog('Applying template:', template.name);
    alert(`已选择模板: ${template.name}\n点击"使用此模板"开始创建项目！\n\n模板包含 ${template.pages.length} 个页面。`);
    setDetailOpen(false);
    setSelectedTemplate(null);
    // TODO: 导航到项目创建流程，传递模板 ID
    router.push('/');
  }, [router]);

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

      {/* E2: 模板详情弹窗 */}
      {detailOpen && selectedTemplate && (
        <TemplateDetail
          template={selectedTemplate}
          onClose={handleDetailClose}
          onApply={handleApply}
        />
      )}
    </div>
  );
}
