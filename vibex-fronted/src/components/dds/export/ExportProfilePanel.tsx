/**
 * ExportProfilePanel.tsx — S95-E4: Export Profile Templates
 *
 * Renders inside the CanvasSettingsDrawer export-profiles tab.
 * Provides template management: list + create + delete.
 *
 * Usage: <ExportProfilePanel canvasId={canvasId} />
 */
'use client';

import React, { memo, useCallback } from 'react';
import { useExportProfileStore, ExportProfileFormat } from '@/stores/exportProfileStore';
import styles from './ExportProfilePanel.module.css';

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.spinner}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ==================== Format helpers ====================

const FORMAT_LABELS: Record<ExportProfileFormat, string> = {
  react: 'React',
  svg: 'SVG',
  md: 'Markdown',
  json: 'JSON',
};

// ==================== Profile Card ====================

interface ProfileCardProps {
  profile: {
    id: string;
    name: string;
    format: ExportProfileFormat;
    scale: number;
    includeNodes: boolean;
    includeEdges: boolean;
  };
  isActive: boolean;
  onDelete: (id: string) => void;
}

const ProfileCard = memo(function ProfileCard({ profile, isActive, onDelete }: ProfileCardProps) {
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(profile.id);
    },
    [onDelete, profile.id]
  );

  return (
    <div
      className={`${styles.profileCard} ${isActive ? styles.profileCardActive : ''}`}
      role="listitem"
    >
      <div className={styles.profileInfo}>
        <div className={styles.profileName}>{profile.name}</div>
        <div className={styles.profileMeta}>
          <span className={styles.profileFormat}>{FORMAT_LABELS[profile.format]}</span>
          <span className={styles.profileScale}>{profile.scale}×</span>
          {!profile.includeNodes && <span className={styles.profileBadge}>无节点</span>}
          {!profile.includeEdges && <span className={styles.profileBadge}>无连线</span>}
        </div>
      </div>

      <button
        className={`${styles.deleteBtn} ${styles.iconButtonDanger}`}
        onClick={handleDelete}
        aria-label={`Delete profile ${profile.name}`}
        title="Delete profile"
        type="button"
      >
        <DeleteIcon />
      </button>
    </div>
  );
});

// ==================== Main Component ====================

export interface ExportProfilePanelProps {
  /** Canvas ID for API calls */
  canvasId: string;
}

const FORMATS: { value: ExportProfileFormat; label: string }[] = [
  { value: 'react', label: 'React' },
  { value: 'svg', label: 'SVG' },
  { value: 'md', label: 'Markdown' },
  { value: 'json', label: 'JSON' },
];

const SCALES = [25, 50, 100, 150, 200];

/**
 * ExportProfilePanel — Export Profile Template Management
 * Renders as a section inside CanvasSettingsDrawer export-profiles tab.
 */
export const ExportProfilePanel = memo(function ExportProfilePanel({ canvasId }: ExportProfilePanelProps) {
  const {
    isOpen,
    profiles,
    isLoading,
    error,
    formName,
    formFormat,
    formScale,
    formIncludeNodes,
    formIncludeEdges,
    openPanel,
    closePanel,
    loadProfiles,
    createProfile,
    deleteProfile,
    setFormName,
    setFormFormat,
    setFormScale,
    setFormIncludeNodes,
    setFormIncludeEdges,
  } = useExportProfileStore();

  // Open panel on mount, close on unmount
  React.useEffect(() => {
    openPanel(canvasId);
    return () => { closePanel(); };
  }, [canvasId, openPanel, closePanel]);

  const handleDeleteProfile = useCallback(
    (id: string) => {
      deleteProfile(canvasId, id);
    },
    [deleteProfile, canvasId]
  );

  const handleCreateSubmit = useCallback(async () => {
    await createProfile(canvasId);
  }, [createProfile, canvasId]);

  // Reset form fields to defaults
  const handleReset = useCallback(() => {
    setFormName('');
    setFormFormat('react');
    setFormScale(100);
    setFormIncludeNodes(true);
    setFormIncludeEdges(true);
  }, [setFormName, setFormFormat, setFormScale, setFormIncludeNodes, setFormIncludeEdges]);

  if (!isOpen) return null;

  return (
    <div className={styles.container}>
      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Profile List */}
      <div className={styles.profileList} aria-label="Saved profiles" role="list">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>已保存模板</span>
          {profiles.length > 0 && <span className={styles.count}>{profiles.length}</span>}
        </div>

        {isLoading && profiles.length === 0 && (
          <div className={styles.loadingState}>
            <SpinnerIcon />
            <span>加载中...</span>
          </div>
        )}

        {!isLoading && profiles.length === 0 && (
          <div className={styles.emptyState}>
            <span>暂无保存的模板</span>
            <span>在下方创建一个模板以保存导出配置</span>
          </div>
        )}

        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={`${styles.profileCard} ${profile.id === profiles[0]?.id ? styles.profileCardActive : ''}`}
            role="listitem"
          >
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{profile.name}</div>
              <div className={styles.profileMeta}>
                <span className={styles.profileFormat}>{FORMAT_LABELS[profile.format]}</span>
                <span className={styles.profileScale}>{profile.scale}%</span>
                {!profile.includeNodes && <span className={styles.profileBadge}>无节点</span>}
                {!profile.includeEdges && <span className={styles.profileBadge}>无连线</span>}
              </div>
            </div>

            <button
              className={styles.deleteBtn}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteProfile(profile.id);
              }}
              aria-label={`Delete profile ${profile.name}`}
              title="删除模板"
              type="button"
            >
              <DeleteIcon />
            </button>
          </div>
        ))}
      </div>

      {/* Create Form */}
      <div className={styles.createSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>新建模板</span>
          <button
            className={styles.resetBtn}
            onClick={handleReset}
            type="button"
            title="重置表单"
          >
            重置
          </button>
        </div>

        <div className={styles.form}>
          {/* Name */}
          <div className={styles.formField}>
            <label className={styles.label} htmlFor="profile-name">模板名称</label>
            <input
              id="profile-name"
              className={styles.input}
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="例如：高清 PNG 导出"
              maxLength={100}
            />
          </div>

          {/* Format */}
          <div className={styles.formField}>
            <label className={styles.label}>导出格式</label>
            <div className={styles.formatGrid}>
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  className={`${styles.formatBtn} ${formFormat === f.value ? styles.formatBtnActive : ''}`}
                  onClick={() => setFormFormat(f.value)}
                  type="button"
                  aria-pressed={formFormat === f.value}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div className={styles.formField}>
            <label className={styles.label}>缩放比例</label>
            <div className={styles.scaleRow}>
              {SCALES.map((s) => (
                <button
                  key={s}
                  className={`${styles.scaleBtn} ${formScale === s ? styles.scaleBtnActive : ''}`}
                  onClick={() => setFormScale(s)}
                  type="button"
                  aria-pressed={formScale === s}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className={styles.toggleRow}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={formIncludeNodes}
                onChange={(e) => setFormIncludeNodes(e.target.checked)}
              />
              <span>包含节点</span>
            </label>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={formIncludeEdges}
                onChange={(e) => setFormIncludeEdges(e.target.checked)}
              />
              <span>包含连线</span>
            </label>
          </div>

          {/* Submit */}
          <button
            className={styles.createBtn}
            onClick={handleCreateSubmit}
            disabled={isLoading || !formName.trim()}
            type="button"
          >
            {isLoading ? <SpinnerIcon /> : null}
            <span>{isLoading ? '保存中...' : '保存模板'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});
