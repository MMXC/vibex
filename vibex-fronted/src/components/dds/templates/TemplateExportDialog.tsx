/**
 * TemplateExportDialog.tsx — S68-E1: Template Gallery Enhancement
 * 
 * Preview templates before export, with options to select which templates
 * to include and download as .vbtmpl JSON file.
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { downloadTemplatesAsFile } from '@/lib/canvas/templateExport';
import type { RequirementTemplate } from '@/data/templates';
import styles from './TemplateExportDialog.module.css';

interface TemplateExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** All templates available for export (from templateStore.templates) */
  templates: RequirementTemplate[];
  /** Currently favorited template IDs */
  favoriteIds: string[];
}

type ExportScope = 'all' | 'favorites' | 'selected';

export function TemplateExportDialog({ isOpen, onClose, templates, favoriteIds }: TemplateExportDialogProps) {
  const [scope, setScope] = useState<ExportScope>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filename, setFilename] = useState('vibex-templates.vbtmpl');

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const previewTemplates = useMemo(() => {
    switch (scope) {
      case 'all':
        return templates;
      case 'favorites':
        return templates.filter(t => favoriteSet.has(t.id));
      case 'selected':
        return templates.filter(t => selectedIds.has(t.id));
      default:
        return [];
    }
  }, [scope, templates, favoriteSet, selectedIds]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    downloadTemplatesAsFile(previewTemplates, filename.endsWith('.vbtmpl') ? filename : `${filename}.vbtmpl`);
    onClose();
  }, [previewTemplates, filename, onClose]);

  if (!isOpen) return null;

  const totalTemplates = templates.length;
  const totalFavorites = favoriteIds.length;
  const presetCount = previewTemplates.filter(t => t.isPreset).length;
  const userCount = previewTemplates.filter(t => !t.isPreset).length;

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="export-dialog-title">
        {/* Header */}
        <div className={styles.header}>
          <h2 id="export-dialog-title" className={styles.title}>⬇️ 导出模板</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">✕</button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Scope selector */}
          <div className={styles.section}>
            <label className={styles.label}>导出范围</label>
            <div className={styles.scopeGroup}>
              <label className={styles.scopeOption}>
                <input
                  type="radio"
                  name="exportScope"
                  value="all"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                />
                <span>全部模板</span>
                <span className={styles.badge}>{totalTemplates}</span>
              </label>
              <label className={styles.scopeOption}>
                <input
                  type="radio"
                  name="exportScope"
                  value="favorites"
                  checked={scope === 'favorites'}
                  onChange={() => setScope('favorites')}
                />
                <span>仅收藏</span>
                <span className={styles.badge}>{totalFavorites}</span>
              </label>
              <label className={styles.scopeOption}>
                <input
                  type="radio"
                  name="exportScope"
                  value="selected"
                  checked={scope === 'selected'}
                  onChange={() => setScope('selected')}
                />
                <span>手动选择</span>
                <span className={styles.badge}>{selectedIds.size}</span>
              </label>
            </div>
          </div>

          {/* Filename input */}
          <div className={styles.section}>
            <label className={styles.label} htmlFor="export-filename">文件名</label>
            <input
              id="export-filename"
              type="text"
              className={styles.filenameInput}
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="vibex-templates.vbtmpl"
            />
          </div>

          {/* Preview stats */}
          <div className={styles.statsRow}>
            <span className={styles.stat}>
              📋 {previewTemplates.length} 个模板
            </span>
            <span className={styles.stat}>
              ⭐ {presetCount} 预设
            </span>
            <span className={styles.stat}>
              👤 {userCount} 用户
            </span>
          </div>

          {/* Template list preview (only when scope=selected) */}
          {scope === 'selected' && (
            <div className={styles.previewList}>
              <div className={styles.previewHeader}>
                <span>选择模板（{selectedIds.size}/{templates.length}）</span>
                <button
                  type="button"
                  className={styles.selectAllBtn}
                  onClick={() => setSelectedIds(new Set(templates.map(t => t.id)))}
                >
                  全选
                </button>
              </div>
              <div className={styles.templateScroll}>
                {templates.map(t => (
                  <label key={t.id} className={styles.templateItem}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(t.id)}
                      onChange={() => handleToggleSelect(t.id)}
                    />
                    <span className={styles.templateIcon}>{t.icon}</span>
                    <span className={styles.templateName}>{t.name}</span>
                    {favoriteSet.has(t.id) && <span className={styles.favStar}>⭐</span>}
                    {t.isPreset && <span className={styles.presetBadge}>预设</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Export format hint */}
          <p className={styles.hint}>
            导出为 .vbtmpl JSON 文件，可通过「导入」功能恢复模板
          </p>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExport}
            disabled={previewTemplates.length === 0}
          >
            ⬇️ 导出 {previewTemplates.length} 个模板
          </button>
        </div>
      </div>
    </div>
  );
}
