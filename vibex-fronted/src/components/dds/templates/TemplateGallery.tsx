/**
 * TemplateGallery.tsx — Canvas Template Gallery Panel
 * Sprint42 E3: Canvas 模板系统
 *
 * Displays a grid of canvas templates (preset + user-saved).
 * Clicking a template loads it into the canvas.
 */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  listTemplates,
  getTemplate,
  seedPresets,
  PRESET_TEMPLATES,
  type CanvasTemplateSummary,
} from '@/lib/canvas/templateStore';
import { useTemplateStore } from '@/stores/templateStore';
import { downloadTemplatesAsFile } from '@/lib/canvas/templateExport';
import { TemplateImportDialog } from './TemplateImportDialog';
import { CategoryTab, type CanvasCategory } from './CategoryTab';
import { deserializeThreeTrees, restoreStore } from '@/lib/canvas/serialize';
import { searchTemplates } from '@/lib/canvas/templateSearch';
import styles from './TemplateGallery.module.css';

interface TemplateGalleryProps {
  /** Whether the gallery is visible */
  isOpen: boolean;
  /** Called when user closes the gallery */
  onClose: () => void;
  /** Called after a template is loaded into the canvas */
  onTemplateApplied?: (templateId: string) => void;
}

const TAG_COLORS: Record<string, string> = {
  blank: '#6b7280',
  flow: '#3b82f6',
  process: '#3b82f6',
  matrix: '#f59e0b',
  analysis: '#f59e0b',
  mindmap: '#8b5cf6',
  brainstorm: '#8b5cf6',
  swot: '#10b981',
  strategy: '#10b981',
};

export function TemplateGallery({ isOpen, onClose, onTemplateApplied }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<CanvasTemplateSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const templateStore = useTemplateStore();

// categories removed (now via CategoryTab)

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      // Seed preset templates on first open
      await seedPresets(PRESET_TEMPLATES);
      const all = await listTemplates(true);
      setTemplates(all);
    } catch (err) {
      console.error('[TemplateGallery] Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  // E4: Fuse.js search + category filter
  const filtered = templates.filter((t) => {
    const matchSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    // Category filter (canvas layout category from IndexedDB)
    const cat = t.category || 'other';
    const matchCat =
      selectedCategory === 'all' ||
      (selectedCategory === cat);
    return matchCat;
  });

  const applyTemplate = async (templateId: string) => {
    setApplying(templateId);
    try {
      const template = await getTemplate(templateId);
      if (!template) return;
      const snapshot = JSON.parse(template.snapshot);
      const result = deserializeThreeTrees(JSON.stringify(snapshot));
      restoreStore(result);
      onTemplateApplied?.(templateId);
      onClose();
    } catch (err) {
      console.error('[TemplateGallery] Failed to apply template:', err);
    } finally {
      setApplying(null);
    }
  };

  const handleExportAll = () => {
    const data = templateStore.exportTemplates();
    downloadTemplatesAsFile(data.templates);
  };

  const handleImport = (importedTemplates: import('@/data/templates').RequirementTemplate[], _strategy: 'skip' | 'overwrite' | 'rename') => {
    // Merge into store via JSON round-trip
    const json = JSON.stringify({ version: '1.0', templates: importedTemplates });
    templateStore.importTemplates(json, 'skip');
    loadTemplates();
    setImportDialogOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="模板画廊">
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>📋 模板画廊</h2>
          <div className={styles.headerActions}>
            <button type="button" className={styles.actionBtn} onClick={handleExportAll} title="导出全部">
              ⬇️ 导出
            </button>
            <button type="button" className={styles.actionBtn} onClick={() => setImportDialogOpen(true)} title="导入模板">
              ⬆️ 导入
            </button>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchRow}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="搜索模板"
          />
        </div>

        {/* Category tabs (E4: CategoryTab component) */}
        <CategoryTab
          selected={selectedCategory as CanvasCategory | 'all' | 'favorites'}
          onSelect={(cat) => setSelectedCategory(cat)}
        />

        {/* Template grid */}
        <div className={styles.grid}>
          {loading && <p className={styles.loading}>加载中...</p>}
          {!loading && filtered.length === 0 && (
            <p className={styles.empty}>没有找到匹配的模板</p>
          )}
          {!loading &&
            filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.card} ${applying === t.id ? styles.cardApplying : ''}`}
                onClick={() => applyTemplate(t.id)}
                disabled={applying !== null}
                aria-label={`应用模板: ${t.name}`}
              >
                <span className={styles.cardIcon}>{t.icon}</span>
                <span className={styles.cardName}>{t.name}</span>
                <span className={styles.cardDesc}>{t.description}</span>
                <div className={styles.cardTags}>
                  {t.isPreset && <span className={styles.presetBadge}>预设</span>}
                  {t.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className={styles.tagBadge}
                      style={{ backgroundColor: `${TAG_COLORS[tag] ?? '#6b7280'}22`, color: TAG_COLORS[tag] ?? '#6b7280' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
        </div>

        {/* E4: Import Dialog */}
        <TemplateImportDialog
          isOpen={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onImport={handleImport}
          existingTemplates={templateStore.templates}
        />
      </div>
    </div>
  );
}
