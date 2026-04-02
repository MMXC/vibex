/**
 * SaveIndicator — Canvas Save Status Indicator
 * E3-S2: 视觉反馈 — shows saving/saved/error state
 *
 * 遵守 AGENTS.md E3 约束:
 * - 状态指示器: 保存中/已保存/保存失败
 * - 非阻塞 UI — 不影响主流程
 */
import React from 'react'
import type { SaveStatus } from '@/hooks/canvas/useAutoSave'
import styles from './SaveIndicator.module.css'

interface SaveIndicatorProps {
  status: SaveStatus
  lastSavedAt: Date | null
  onSaveNow?: () => void
}

function formatRelative(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleDateString('zh-CN')
}

export function SaveIndicator({ status, lastSavedAt, onSaveNow }: SaveIndicatorProps) {
  if (status === 'idle' && !lastSavedAt) {
    return null
  }

  return (
    <div
      className={`${styles.indicator} ${styles[status]}`}
      role="status"
      aria-live="polite"
      aria-label={
        status === 'saving'
          ? '保存中'
          : status === 'saved'
          ? '已保存'
          : status === 'error'
          ? '保存失败'
          : lastSavedAt
          ? `已保存于 ${formatRelative(lastSavedAt)}`
          : ''
      }
    >
      {status === 'saving' && (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          <span>保存中...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <span aria-hidden="true">✅</span>
          <span>已保存</span>
        </>
      )}

      {status === 'error' && (
        <>
          <span aria-hidden="true">⚠️</span>
          <span>保存失败</span>
          {onSaveNow && (
            <button
              type="button"
              className={styles.retryBtn}
              onClick={onSaveNow}
              aria-label="重试保存"
            >
              重试
            </button>
          )}
        </>
      )}

      {status === 'idle' && lastSavedAt && (
        <>
          <span aria-hidden="true">💾</span>
          <span className={styles.savedTime}>已保存 {formatRelative(lastSavedAt)}</span>
        </>
      )}
    </div>
  )
}
