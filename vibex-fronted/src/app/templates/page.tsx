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
  if (process.env.NODE_ENV !== 'production') canvasLogger.default.debug(...args);
};
import { TemplateGallery, TemplateDetail } from '@/components/templates';
import type { Template } from '@/types/template';
import { getAuthToken, getUserId } from '@/lib/auth-token';
import { getApiUrl } from '@/lib/api-config';
import styles from './templates.module.css';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

export default function TemplatesPage() {
  const router = useRouter();

  // 状态
  const [galleryOpen, setGalleryOpen] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理模板选择（点击卡片）
  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setDetailOpen(true);
    setError(null);
  }, []);

  // 处理模板详情关闭
  const handleDetailClose = useCallback(() => {
    setDetailOpen(false);
    setSelectedTemplate(null);
    setError(null);
  }, []);

  // 处理模板应用 — E2: 创建项目并跳转
  const handleApply = useCallback(async (template: Template) => {
    devLog('Applying template:', template.name);
    setApplying(true);
    setError(null);

    try {
      const userId = getUserId();
      if (!userId) {
        // Not logged in — prompt login
        router.push('/login?redirect=/templates');
        return;
      }

      const response = await fetch(getApiUrl('/api/projects/from-template'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken() || ''}`,
        },
        body: JSON.stringify({
          templateId: template.id,
          userId,
          projectName: template.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `创建失败 (${response.status})`);
      }

      const data = await response.json();
      devLog('Project created:', data);

      setDetailOpen(false);
      setSelectedTemplate(null);
      // Navigate to canvas page
      router.push(`/canvas/${data.projectId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '创建项目失败';
      setError(msg);
      devLog('Error creating project from template:', err);
    } finally {
      setApplying(false);
    }
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
          loading={applying}
        />
      )}

      {/* 错误提示 */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
