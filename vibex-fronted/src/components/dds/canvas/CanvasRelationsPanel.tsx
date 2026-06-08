'use client';

/**
 * CanvasRelationsPanel — S78-E5: 画布关系追踪
 *
 * Displays all relations for the currently active canvas.
 * Includes: relation list, add/remove relations, relation type filtering.
 * Integrated as a Tab inside the Canvas detail drawer or as a standalone panel.
 */
import React, { memo, useState, useCallback } from 'react';
import type { CanvasRelation, RelationType } from '@/stores/canvasListStore';
import { useCanvasListStore } from '@/stores/canvasListStore';
import styles from './CanvasRelationsPanel.module.css';

const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  derives_from: '派生于',
  copied_to: '副本',
  archived_backup_of: '备份',
  parent: '父画布',
  child: '子画布',
  related: '相关',
};

const RELATION_TYPE_ICONS: Record<RelationType, string> = {
  derives_from: '🔀',
  copied_to: '📋',
  archived_backup_of: '💾',
  parent: '⬆️',
  child: '⬇️',
  related: '🔗',
};

interface RelationItemProps {
  relation: CanvasRelation;
  targetName: string;
  onRemove: (id: string) => void;
  onNavigate: (canvasId: string) => void;
}

const RelationItem = memo(function RelationItem({
  relation,
  targetName,
  onRemove,
  onNavigate,
}: RelationItemProps) {
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove(relation.id);
    },
    [relation.id, onRemove],
  );

  const handleNavigate = useCallback(() => {
    onNavigate(relation.targetCanvasId);
  }, [relation.targetCanvasId, onNavigate]);

  const dateStr = new Date(relation.createdAt).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={styles.relationItem} onClick={handleNavigate} role="button" tabIndex={0}>
      <div
        className={styles.relationIcon}
        style={{ backgroundColor: 'var(--color-bg-secondary, #f3f4f6)' }}
      >
        {RELATION_TYPE_ICONS[relation.type]}
      </div>
      <div className={styles.relationInfo}>
        <div className={styles.relationName}>{targetName}</div>
        <div className={styles.relationMeta}>
          <span className={styles.typeTag}>{RELATION_TYPE_LABELS[relation.type]}</span>
          <span className={styles.dateText}>{dateStr}</span>
        </div>
      </div>
      <button
        className={styles.removeBtn}
        onClick={handleRemove}
        title="移除关系"
        aria-label="移除关系"
      >
        ✕
      </button>
    </div>
  );
});

interface AddRelationDialogProps {
  canvasId: string;
  existingTargetIds: Set<string>;
  onClose: () => void;
  onAdd: (targetId: string, type: RelationType) => void;
}

const AddRelationDialog = memo(function AddRelationDialog({
  canvasId,
  existingTargetIds,
  onClose,
  onAdd,
}: AddRelationDialogProps) {
  const canvases = useCanvasListStore((s) => s.canvases);
  const [selectedType, setSelectedType] = useState<RelationType>('related');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const availableTargets = canvases.filter(
    (c) => c.id !== canvasId && !existingTargetIds.has(c.id),
  );

  const handleSubmit = useCallback(() => {
    if (!selectedTargetId) {
      setError('请选择一个目标画布');
      return;
    }
    try {
      onAdd(selectedTargetId, selectedType);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败');
    }
  }, [selectedTargetId, selectedType, onAdd, onClose]);

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <h3 className={styles.dialogTitle}>添加画布关系</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        <div className={styles.dialogBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>关系类型</label>
            <select
              className={styles.formSelect}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as RelationType)}
            >
              {(Object.keys(RELATION_TYPE_LABELS) as RelationType[]).map((t) => (
                <option key={t} value={t}>
                  {RELATION_TYPE_ICONS[t]} {RELATION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>目标画布</label>
            {availableTargets.length === 0 ? (
              <div className={styles.emptyState} style={{ height: 'auto', padding: '16px' }}>
                没有可关联的画布
              </div>
            ) : (
              <div className={styles.canvasList}>
                {availableTargets.map((canvas) => (
                  <label
                    key={canvas.id}
                    className={`${styles.canvasOption} ${selectedTargetId === canvas.id ? styles.selected : ''}`}
                  >
                    <input
                      type="radio"
                      name="targetCanvas"
                      value={canvas.id}
                      checked={selectedTargetId === canvas.id}
                      onChange={() => setSelectedTargetId(canvas.id)}
                    />
                    {canvas.name}
                  </label>
                ))}
              </div>
            )}
          </div>
          {error && <div className={styles.errorMsg}>{error}</div>}
        </div>
        <div className={styles.dialogFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            取消
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={!selectedTargetId}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
});

interface CanvasRelationsPanelProps {
  /** ID of the canvas to show relations for */
  canvasId: string;
  /** Whether the panel is open */
  open: boolean;
  /** Called when panel requests to close */
  onClose: () => void;
  /** Called when user wants to navigate to another canvas */
  onNavigate: (canvasId: string) => void;
}

export const CanvasRelationsPanel = memo(function CanvasRelationsPanel({
  canvasId,
  open,
  onClose,
  onNavigate,
}: CanvasRelationsPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const canvases = useCanvasListStore((s) => s.canvases);
  const relations = useCanvasListStore((s) => s.getCanvasRelations(canvasId));
  const stats = useCanvasListStore((s) => s.getRelationStats(canvasId));
  const addRelation = useCanvasListStore((s) => s.addCanvasRelation);
  const removeRelation = useCanvasListStore((s) => s.removeCanvasRelation);

  const canvasName = canvases.find((c) => c.id === canvasId)?.name ?? '未知画布';

  const existingTargetIds = new Set(relations.map((r) => r.targetCanvasId));

  const handleRemove = useCallback(
    (relationId: string) => {
      removeRelation(relationId);
    },
    [removeRelation],
  );

  const handleAdd = useCallback(
    (targetId: string, type: RelationType) => {
      addRelation(canvasId, targetId, type);
    },
    [canvasId, addRelation],
  );

  if (!open) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>画布关系 — {canvasName}</h2>
        <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
          ✕
        </button>
      </div>

      <div className={styles.statsBar}>
        <span className={styles.statBadge}>
          📊 {stats.total} 个关系
        </span>
        {Object.entries(stats.byType)
          .filter(([, count]) => count > 0)
          .map(([type, count]) => (
            <span key={type} className={styles.statBadge}>
              {RELATION_TYPE_ICONS[type as RelationType]} {count}
            </span>
          ))}
      </div>

      <div className={styles.body}>
        {relations.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔗</div>
            <p className={styles.emptyText}>
              还没有画布关系<br />
              点击下方按钮添加关联
            </p>
          </div>
        ) : (
          relations.map((rel) => {
            const target = canvases.find((c) => c.id === rel.targetCanvasId);
            return (
              <RelationItem
                key={rel.id}
                relation={rel}
                targetName={target?.name ?? '未知画布'}
                onRemove={handleRemove}
                onNavigate={onNavigate}
              />
            );
          })
        )}
      </div>

      <button
        className={styles.addBtn}
        onClick={() => setShowAddDialog(true)}
      >
        + 添加关系
      </button>

      {showAddDialog && (
        <AddRelationDialog
          canvasId={canvasId}
          existingTargetIds={existingTargetIds}
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
});
