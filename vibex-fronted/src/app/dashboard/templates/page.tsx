'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/auth-token';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { templateApi, IndustryTemplate } from '@/services/api/modules/template';
import styles from './templates.module.css';

// ==================== Types ====================

interface TemplateFormData {
  name: string;
  description: string;
  industry: string;
  icon: string;
  sampleRequirement: string;
  tags: string;
}

// ==================== Constants ====================

const INDUSTRY_OPTIONS = [
  { value: 'saas', label: 'SaaS' },
  { value: 'ecommerce', label: '电商' },
  { value: 'social', label: '社交' },
];

const CATEGORY_LABELS: Record<string, string> = {
  saas: 'SaaS',
  ecommerce: '电商',
  social: '社交',
};

// ==================== Template Card ====================

function TemplateCard({
  template,
  onEdit,
  onDelete,
  onExport,
}: {
  template: IndustryTemplate;
  onEdit: (t: IndustryTemplate) => void;
  onDelete: (t: IndustryTemplate) => void;
  onExport: (t: IndustryTemplate) => void;
}) {
  const category = CATEGORY_LABELS[template.industry] ?? template.industry;
  const icon = template.icon ?? '📄';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>{icon}</span>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardName}>{template.name}</h3>
          <span className={styles.cardCategory}>{category}</span>
        </div>
      </div>

      <p className={styles.cardDescription}>{template.description}</p>

      {template.tags && template.tags.length > 0 && (
        <div className={styles.cardTags}>
          {template.tags.slice(0, 5).map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      <div className={styles.cardMeta}>
        <span className={styles.cardDates}>
          更新于 {new Date(template.updatedAt).toLocaleDateString('zh-CN')}
        </span>
        <div className={styles.cardActions}>
          <button
            className={styles.iconBtn}
            onClick={() => onExport(template)}
            title="导出"
            type="button"
          >
            ↓
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => onEdit(template)}
            title="编辑"
            type="button"
          >
            ✎
          </button>
          <button
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={() => onDelete(template)}
            title="删除"
            type="button"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Template Form Modal ====================

function TemplateFormModal({
  open,
  template,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  template: IndustryTemplate | null;
  onClose: () => void;
  onSubmit: (data: TemplateFormData) => void;
  isSubmitting: boolean;
}) {
  const isEdit = !!template;

  const [form, setForm] = useState<TemplateFormData>({
    name: '',
    description: '',
    industry: 'saas',
    icon: '📄',
    sampleRequirement: '',
    tags: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: template?.name ?? '',
        description: template?.description ?? '',
        industry: template?.industry ?? 'saas',
        icon: template?.icon ?? '📄',
        sampleRequirement: template?.sampleRequirement ?? '',
        tags: template?.tags?.join(', ') ?? '',
      });
    }
  }, [open, template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? '编辑模板' : '创建模板'}
      width={480}
      maskClosable={!isSubmitting}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>模板名称 *</label>
          <input
            className={styles.formInput}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="例如：SaaS 产品开发模板"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>描述 *</label>
          <textarea
            className={styles.formTextarea}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="描述这个模板的用途和适用场景..."
            required
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>行业</label>
          <select
            className={styles.formSelect}
            value={form.industry}
            onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
            disabled={isSubmitting}
          >
            {INDUSTRY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>图标</label>
          <input
            className={styles.formInput}
            value={form.icon}
            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
            placeholder="例如：☁️"
            maxLength={4}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>标签（逗号分隔）</label>
          <input
            className={styles.formInput}
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="例如：feature, saas, new"
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>需求示例</label>
          <textarea
            className={styles.formTextarea}
            value={form.sampleRequirement}
            onChange={e => setForm(f => ({ ...f, sampleRequirement: e.target.value }))}
            placeholder="填写一个示例需求提示..."
            disabled={isSubmitting}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
          >
            {isEdit ? '保存' : '创建'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ==================== Delete Confirm Modal ====================

function DeleteConfirmModal({
  open,
  template,
  onClose,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  template: IndustryTemplate | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="删除模板"
      width={400}
      maskClosable={!isDeleting}
    >
      <div style={{ padding: '8px 0 16px' }}>
        <p style={{ margin: '0 0 16px', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          确定要删除模板「<strong>{template?.name}</strong>」吗？此操作不可撤销。
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isDeleting}>
            取消
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={isDeleting}>
            删除
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ==================== Import Modal ====================

function ImportModal({
  open,
  onClose,
  onImport,
  isImporting,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
  isImporting: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleImport = () => {
    if (selectedFile) onImport(selectedFile);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="导入模板"
      width={480}
      maskClosable={!isImporting}
    >
      <div className={styles.form}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div
          className={styles.importArea}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
        >
          <div className={styles.importIcon}>
            {selectedFile ? '📋' : '📁'}
          </div>
          <p className={styles.importText}>
            {selectedFile ? selectedFile.name : '点击选择 JSON 文件，或拖拽文件到这里'}
          </p>
          <p className={styles.importHint}>
            支持 VibeX 模板格式的 .json 文件
          </p>
        </div>

        {selectedFile && (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
            已选择: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isImporting}>
            取消
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleImport}
            loading={isImporting}
            disabled={!selectedFile}
          >
            导入
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ==================== Main Page ====================

export default function TemplatesPage() {
  const router = useRouter();

  const [templates, setTemplates] = useState<IndustryTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<IndustryTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<IndustryTemplate | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Auth check
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await templateApi.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (token) loadTemplates();
  }, [loadTemplates]);

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesFilter = filter === 'all' || t.industry === filter;
    const matchesSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Stats
  const stats = {
    total: templates.length,
    byIndustry: {
      saas: templates.filter(t => t.industry === 'saas').length,
      ecommerce: templates.filter(t => t.industry === 'ecommerce').length,
      social: templates.filter(t => t.industry === 'social').length,
    },
  };

  // Create
  const handleCreate = async (formData: TemplateFormData) => {
    setIsSubmitting(true);
    try {
      const created = await templateApi.createTemplate({
        name: formData.name,
        description: formData.description,
        industry: formData.industry,
        icon: formData.icon,
        sampleRequirement: formData.sampleRequirement,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      } as Partial<IndustryTemplate>);
      setTemplates(prev => [...prev, created]);
      setShowCreateModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update
  const handleUpdate = async (formData: TemplateFormData) => {
    if (!editTemplate) return;
    setIsSubmitting(true);
    try {
      const updated = await templateApi.updateTemplate(editTemplate.id, {
        name: formData.name,
        description: formData.description,
        industry: formData.industry,
        icon: formData.icon,
        sampleRequirement: formData.sampleRequirement,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      } as Partial<IndustryTemplate>);
      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditTemplate(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTemplate) return;
    setIsDeleting(true);
    try {
      await templateApi.deleteTemplate(deleteTemplate.id);
      setTemplates(prev => prev.filter(t => t.id !== deleteTemplate.id));
      setDeleteTemplate(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export single
  const handleExport = (template: IndustryTemplate) => {
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}-${template.name.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export all
  const handleExportAll = async () => {
    try {
      await templateApi.exportTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : '导出失败');
    }
  };

  // Import
  const handleImport = async (file: File) => {
    setIsImporting(true);
    try {
      const imported = await templateApi.importTemplate(file);
      setTemplates(prev => [...prev, imported]);
      setShowImportModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : '导入失败');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>📋 模板管理</h1>
          </div>
          <p className={styles.subtitle}>
            管理您的需求分析模板，支持导入导出
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
            导入
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportAll}>
            导出全部
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            + 新建模板
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <button
          className={`${styles.filterChip} ${filter === 'all' ? styles.filterChipActive : ''}`}
          onClick={() => setFilter('all')}
          type="button"
        >
          全部 ({stats.total})
        </button>
        <button
          className={`${styles.filterChip} ${filter === 'saas' ? styles.filterChipActive : ''}`}
          onClick={() => setFilter('saas')}
          type="button"
        >
          SaaS ({stats.byIndustry.saas})
        </button>
        <button
          className={`${styles.filterChip} ${filter === 'ecommerce' ? styles.filterChipActive : ''}`}
          onClick={() => setFilter('ecommerce')}
          type="button"
        >
          电商 ({stats.byIndustry.ecommerce})
        </button>
        <button
          className={`${styles.filterChip} ${filter === 'social' ? styles.filterChipActive : ''}`}
          onClick={() => setFilter('social')}
          type="button"
        >
          社交 ({stats.byIndustry.social})
        </button>

        <input
          className={styles.searchInput}
          type="search"
          placeholder="搜索模板..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>模板总数</span>
          <span className={styles.statValue}>{stats.total}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>SaaS</span>
          <span className={styles.statValue}>{stats.byIndustry.saas}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>电商</span>
          <span className={styles.statValue}>{stats.byIndustry.ecommerce}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>社交</span>
          <span className={styles.statValue}>{stats.byIndustry.social}</span>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Skeleton variant="rect" width="100%" height={160} />
          <Skeleton variant="rect" width="100%" height={160} />
          <Skeleton variant="rect" width="100%" height={160} />
        </div>
      ) : error ? (
        <div className={styles.emptyContainer}>
          <EmptyState
            variant="error"
            title="加载失败"
            description={error}
          />
          <Button variant="secondary" onClick={loadTemplates}>重试</Button>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>📋</div>
          <h3 className={styles.emptyTitle}>暂无模板</h3>
          <p className={styles.emptyText}>
            {search || filter !== 'all'
              ? '没有找到匹配的模板，请尝试调整筛选条件'
              : '还没有创建任何模板，点击"新建模板"开始创建'}
          </p>
          {!search && filter === 'all' && (
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              + 新建模板
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredTemplates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={setEditTemplate}
              onDelete={setDeleteTemplate}
              onExport={handleExport}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TemplateFormModal
        open={showCreateModal}
        template={null}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />

      <TemplateFormModal
        open={!!editTemplate}
        template={editTemplate}
        onClose={() => setEditTemplate(null)}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmModal
        open={!!deleteTemplate}
        template={deleteTemplate}
        onClose={() => setDeleteTemplate(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <ImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        isImporting={isImporting}
      />
    </div>
  );
}
