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
import { TagSelector } from './TagSelector';
import { DateRangePicker } from './DateRangePicker';
import { deserializeThreeTrees, restoreStore } from '@/lib/canvas/serialize';
import { searchTemplates } from '@/lib/canvas/templateSearch';
import { TEMPLATE_USE_CASE_TAGS, type TemplateTag } from '@/data/templates';
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
  // ---- E5: 标签过滤状态 ----
  const [selectedTags, setSelectedTags] = useState<TemplateTag[]>([]);
  // ---- E4: 日期范围过滤状态 ----
  const [dateRange, setDateRange] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });
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

  // ---- E4: URL 参数化 — 从 URL 恢复过滤状态 ----
  useEffect(() => {
    if (!isOpen) return;
    const params = new URLSearchParams(window.location.search);
    const tags = params.get('tags');
    const start = params.get('start');
    const end = params.get('end');
    const q = params.get('q');
    const cat = params.get('cat');
    if (tags) setSelectedTags(tags.split(',') as TemplateTag[]);
    if (start) setDateRange(d => ({ ...d, start: parseInt(start, 10) }));
    if (end) setDateRange(d => ({ ...d, end: parseInt(end, 10) }));
    if (q) setSearchQuery(q);
    if (cat) setSelectedCategory(cat);
  }, [isOpen]);

  // ---- E4: URL 参数化 — 写入 URL（过滤器变化时） ----
  useEffect(() => {
    if (!isOpen) return;
    const params = new URLSearchParams();
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (dateRange.start !== null) params.set('start', String(dateRange.start));
    if (dateRange.end !== null) params.set('end', String(dateRange.end));
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('cat', selectedCategory);
    const search = params.toString();
    const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [isOpen, selectedTags, dateRange, searchQuery, selectedCategory]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  // E5: Fuse.js search + category filter + 标签交集过滤
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
    if (!matchCat) return false;
    // ---- E5: 标签交集过滤 + ---- E4: 日期范围过滤 ----
    if (selectedTags.length > 0) {
      const templateTags: string[] = t.tags ?? [];
      const matchTags = selectedTags.every(tag => templateTags.includes(tag));
      if (!matchTags) return false;
    }
    // ---- E4: 日期范围过滤（基于模板的 createdAt 或 metadata.createdAt）----
    if (dateRange.start !== null || dateRange.end !== null) {
      // Use template's metadata.createdAt or fall back to template id timestamp as proxy
      const createdAt = (t as { createdAt?: number }).createdAt ?? 0;
      if (dateRange.start !== null && createdAt < dateRange.start) return false;
      if (dateRange.end !== null && createdAt > dateRange.end) return false;
    }
    return true;
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

        {/* ---- E5: 使用场景标签过滤 ---- */}
        <div className={styles.tagFilterRow} role="group" aria-label="使用场景标签">
          {TEMPLATE_USE_CASE_TAGS.map(({ value, label, color }) => {
            const active = selectedTags.includes(value);
            return (
              <button
                key={value}
                type="button"
                className={`${styles.tagFilterBtn} ${active ? styles.tagFilterBtnActive : ''}`}
                style={active ? { backgroundColor: `${color}22`, color, borderColor: color } : {}}
                onClick={() => {
                  setSelectedTags(
                    active
                      ? selectedTags.filter(t => t !== value)
                      : [...selectedTags, value]
                  );
                }}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              type="button"
              className={styles.tagFilterClear}
              onClick={() => setSelectedTags([])}
            >
              清除
            </button>
          )}
        </div>

        {/* ---- E4: Advanced filter row: TagSelector + DateRangePicker ---- */}
        <div className={styles.filterRow}>
          <TagSelector
            selected={selectedTags}
            onChange={setSelectedTags}
            placeholder="标签过滤..."
          />
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="日期范围..."
          />
          {selectedTags.length > 0 || dateRange.start !== null || dateRange.end !== null ? (
            <button
              type="button"
              className={styles.clearFiltersBtn}
              onClick={() => {
                setSelectedTags([]);
                setDateRange({ start: null, end: null });
              }}
            >
              清除过滤
            </button>
          ) : null}
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
