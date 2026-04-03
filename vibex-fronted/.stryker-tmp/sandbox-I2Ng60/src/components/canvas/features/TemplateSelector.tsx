// @ts-nocheck
'use client';

/**
 * TemplateSelector — 需求模板选择器
 * E4-F10: 需求模板库
 *
 * 在输入阶段显示模板卡片列表，点击选择后自动填充三树数据
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { loadTemplateList, type TemplateMeta } from '@/lib/canvas/templateLoader';
import styles from './TemplateSelector.module.css';

interface TemplateSelectorProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

export function TemplateSelector({ open, onClose }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const setContextNodes = useCanvasStore((s) => s.setContextNodes);
  const setFlowNodes = useCanvasStore((s) => s.setFlowNodes);
  const setComponentNodes = useCanvasStore((s) => s.setComponentNodes);
  const setPhase = useCanvasStore((s) => s.setPhase);
  const setActiveTree = useCanvasStore((s) => s.setActiveTree);

  // Load template list on open
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    loadTemplateList()
      .then((list) => {
        setTemplates(list);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [open]);

  const handleApplyTemplate = useCallback(async () => {
    if (!selectedId || applying) return;
    setApplying(true);

    try {
      const { loadTemplate } = await import('@/lib/canvas/templateLoader');
      const template = await loadTemplate(selectedId);
      if (template) {
        // Apply template data to canvas store
        setContextNodes(template.contextNodes);
        setFlowNodes(template.flowNodes);
        setComponentNodes(template.componentNodes);
        setPhase('context');
        setActiveTree('context');
        onClose();
      }
    } catch (err) {
      console.error('[TemplateSelector] Failed to apply template:', err);
    } finally {
      setApplying(false);
    }
  }, [selectedId, applying, setContextNodes, setFlowNodes, setComponentNodes, setPhase, setActiveTree, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="选择模板">
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>📋 选择需求模板</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <p className={styles.subtitle}>
          选择一个模板作为起点，模板将自动填充三树数据，您可以在此基础上修改
        </p>

        {loading ? (
          <div className={styles.loading}>
            <span className={styles.spinner} aria-hidden="true" />
            加载模板...
          </div>
        ) : (
          <>
            <div className={styles.grid} role="listbox" aria-label="模板列表">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="option"
                  aria-selected={selectedId === t.id}
                  className={`${styles.card} ${selectedId === t.id ? styles.cardSelected : ''}`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <span className={styles.cardIcon} aria-hidden="true">{t.icon}</span>
                  <span className={styles.cardName}>{t.name}</span>
                  <span className={styles.cardDesc}>{t.description}</span>
                </button>
              ))}
            </div>

            <div className={styles.footer}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
              >
                取消
              </button>
              <button
                type="button"
                className={styles.applyBtn}
                onClick={handleApplyTemplate}
                disabled={!selectedId || applying}
              >
                {applying ? (
                  <>
                    <span className={styles.spinner} aria-hidden="true" />
                    应用中...
                  </>
                ) : (
                  <>应用模板 →</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
