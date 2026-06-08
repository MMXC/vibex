/**
 * ScheduledExportPanel — S78-E4: Scheduled Export & Webhook
 *
 * Responsibilities:
 * - List all scheduled exports with status (enabled/disabled, last run, next run)
 * - Add new schedule: canvas selector + cron expression + webhook URL + format
 * - Toggle enabled/disabled per schedule
 * - Delete schedule
 * - Show inline error if last run failed
 *
 * @module components/dds/toolbar/ScheduledExportPanel
 */

'use client';

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { useCanvasListStore, type ScheduledExport } from '@/stores/canvasListStore';
import { isValidCronExpression } from '@/stores/canvasListStore';
import styles from './ScheduledExportPanel.module.css';

export interface ScheduledExportPanelProps {
  open: boolean;
  onClose: () => void;
}

// ==================== Helpers ====================

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function cronHelpText(): string {
  return 'cron 格式: * * * * * (分 时 日 月 周)，支持 */n、n,m、n-m';
}

// ==================== AddScheduleForm ====================

interface AddScheduleFormProps {
  onAdd: (schedule: { canvasId: string; canvasName: string; cronExpression: string; webhookUrl: string; format: 'png' | 'svg' | 'pdf' }) => void;
  onCancel: () => void;
  canvases: Array<{ id: string; name: string }>;
}

const FORMAT_OPTIONS = [
  { value: 'png', label: 'PNG 图片' },
  { value: 'svg', label: 'SVG 矢量图' },
  { value: 'pdf', label: 'PDF 文档' },
] as const;

function AddScheduleForm({ onAdd, onCancel, canvases }: AddScheduleFormProps) {
  const [canvasId, setCanvasId] = useState('');
  const [cron, setCron] = useState('0 9 * * *'); // default: 09:00 daily
  const [webhookUrl, setWebhookUrl] = useState('');
  const [format, setFormat] = useState<'png' | 'svg' | 'pdf'>('png');
  const [cronError, setCronError] = useState('');

  const handleCronChange = useCallback((v: string) => {
    setCron(v);
    setCronError('');
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canvasId) return;
      if (!webhookUrl.trim()) return;
      if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
        return;
      }
      if (!isValidCronExpression(cron)) {
        setCronError('cron 表达式无效');
        return;
      }
      const canvas = canvases.find((c) => c.id === canvasId);
      onAdd({
        canvasId,
        canvasName: canvas?.name ?? canvasId,
        cronExpression: cron,
        webhookUrl: webhookUrl.trim(),
        format,
      });
    },
    [canvasId, cron, webhookUrl, format, canvases, onAdd]
  );

  return (
    <form className={styles.addForm} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <label className={styles.label} htmlFor="se-canvas">
          画布
        </label>
        <select
          id="se-canvas"
          className={styles.select}
          value={canvasId}
          onChange={(e) => setCanvasId(e.target.value)}
          required
        >
          <option value="">— 选择画布 —</option>
          {canvases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formRow}>
        <label className={styles.label} htmlFor="se-cron">
          Cron 表达式
        </label>
        <div className={styles.cronInput}>
          <input
            id="se-cron"
            className={`${styles.input} ${cronError ? styles.inputError : ''}`}
            type="text"
            value={cron}
            onChange={(e) => handleCronChange(e.target.value)}
            placeholder="0 9 * * *"
            required
          />
          <span className={styles.cronHint}>{cronHelpText()}</span>
          {cronError && <span className={styles.errorMsg}>{cronError}</span>}
        </div>
      </div>

      <div className={styles.formRow}>
        <label className={styles.label} htmlFor="se-webhook">
          Webhook URL
        </label>
        <input
          id="se-webhook"
          className={styles.input}
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://your-server.com/webhook"
          required
        />
      </div>

      <div className={styles.formRow}>
        <label className={styles.label} htmlFor="se-format">
          导出格式
        </label>
        <div className={styles.formatGroup}>
          {FORMAT_OPTIONS.map((opt) => (
            <label key={opt.value} className={styles.radioLabel}>
              <input
                type="radio"
                name="se-format"
                value={opt.value}
                checked={format === opt.value}
                onChange={() => setFormat(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          取消
        </button>
        <button type="submit" className={styles.submitBtn} disabled={!canvasId || !webhookUrl.trim()}>
          添加定时导出
        </button>
      </div>
    </form>
  );
}

// ==================== ScheduleItem ====================

interface ScheduleItemProps {
  schedule: ScheduledExport;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}

function ScheduleItem({ schedule, onToggle, onDelete }: ScheduleItemProps) {
  const hasError = !!schedule.lastError;
  const nextRun = schedule.nextRunAt ? formatDateTime(schedule.nextRunAt) : '—';
  const lastRun = formatDateTime(schedule.lastRunAt);

  return (
    <div className={`${styles.scheduleItem} ${hasError ? styles.scheduleError : ''}`}>
      <div className={styles.scheduleMain}>
        <div className={styles.scheduleName}>{schedule.canvasName}</div>
        <div className={styles.scheduleMeta}>
          <span className={styles.metaBadge}>{schedule.format.toUpperCase()}</span>
          <span className={styles.metaCron}>{schedule.cronExpression}</span>
        </div>
        <div className={styles.scheduleWebhook} title={schedule.webhookUrl}>
          → {schedule.webhookUrl}
        </div>
      </div>

      <div className={styles.scheduleStatus}>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>下次执行</span>
          <span className={styles.statusValue}>{nextRun}</span>
        </div>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>上次执行</span>
          <span className={styles.statusValue}>{lastRun}</span>
        </div>
        {hasError && (
          <div className={`${styles.statusRow} ${styles.errorRow}`}>
            <span className={styles.statusLabel}>错误</span>
            <span className={styles.statusValue} title={schedule.lastError}>
              {schedule.lastError}
            </span>
          </div>
        )}
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>成功次数</span>
          <span className={styles.statusValue}>{schedule.successCount}</span>
        </div>
      </div>

      <div className={styles.scheduleActions}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={schedule.enabled}
            onChange={(e) => onToggle(schedule.id, e.target.checked)}
          />
          <span className={styles.toggleTrack}>
            <span className={styles.toggleThumb} />
          </span>
        </label>
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(schedule.id)}
          title="删除定时导出"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ==================== ScheduledExportPanel ====================

export const ScheduledExportPanel = memo(function ScheduledExportPanel({
  open,
  onClose,
}: ScheduledExportPanelProps) {
  const scheduledExports = useCanvasListStore((s) => s.scheduledExports);
  const canvases = useCanvasListStore((s) => s.canvases);
  const addScheduledExport = useCanvasListStore((s) => s.addScheduledExport);
  const removeScheduledExport = useCanvasListStore((s) => s.removeScheduledExport);
  const updateScheduledExportStatus = useCanvasListStore((s) => s.updateScheduledExportStatus);

  const [showAddForm, setShowAddForm] = useState(false);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  const handleAdd = useCallback(
    (data: { canvasId: string; canvasName: string; cronExpression: string; webhookUrl: string; format: 'png' | 'svg' | 'pdf' }) => {
      addScheduledExport(data.canvasId, data.canvasName, data.cronExpression, data.webhookUrl, data.format);
      setShowAddForm(false);
    },
    [addScheduledExport]
  );

  const handleToggle = useCallback(
    (id: string, enabled: boolean) => {
      updateScheduledExportStatus(id, enabled);
    },
    [updateScheduledExportStatus]
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeScheduledExport(id);
    },
    [removeScheduledExport]
  );

  if (!open) return null;

  const exportList = Object.values(scheduledExports).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const canvasOptions = canvases.map((c) => ({ id: c.id, name: c.projectName ?? c.id }));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>定时导出 & Webhook</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {exportList.length === 0 && !showAddForm ? (
            <div className={styles.empty}>
              <p>暂无定时导出任务</p>
              <p className={styles.emptyHint}>设置后，画布将按 cron 表达式定期导出并 POST 到 webhook</p>
            </div>
          ) : showAddForm ? (
            <AddScheduleForm
              onAdd={handleAdd}
              onCancel={() => setShowAddForm(false)}
              canvases={canvasOptions}
            />
          ) : (
            <div className={styles.list}>
              {exportList.map((s) => (
                <ScheduleItem
                  key={s.id}
                  schedule={s}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showAddForm && (
          <div className={styles.footer}>
            <button
              className={styles.addBtn}
              onClick={() => setShowAddForm(true)}
            >
              + 添加定时导出
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
