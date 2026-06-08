/**
 * NotificationPreferencesPanel — E1 (Sprint80): 统一通知中心管理面板
 *
 * 通知偏好设置面板，支持：
 * - 推送渠道开关（应用内、浏览器）
 * - 通知类型开关（mention / reply / system / info / template_update / comment_reply）
 * - 偏好持久化到 IndexedDB
 * - 恢复默认设置
 *
 * E1 (Sprint80) 架构决策：
 * - 使用统一的 setPreference / getPreference 接口
 * - 偏好变更实时保存到 IndexedDB notification_prefs 表
 */
'use client';

import React, { useCallback } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationPreferences } from '@/stores/notificationStore';
import styles from './NotificationPreferencesPanel.module.css';

const CHANNEL_ITEMS: {
  key: keyof NotificationPreferences['channels'];
  label: string;
  description: string;
}[] = [
  {
    key: 'inApp',
    label: '应用内通知',
    description: '在通知中心内显示提醒',
  },
  {
    key: 'browser',
    label: '浏览器推送',
    description: '浏览器弹出通知提醒（需浏览器授权）',
  },
];

const TYPE_ITEMS: {
  key: keyof NotificationPreferences['types'];
  label: string;
  icon: string;
}[] = [
  { key: 'mention', label: '@提及', icon: '@' },
  { key: 'reply', label: '回复', icon: '↩' },
  { key: 'system', label: '系统', icon: '⚙' },
  { key: 'info', label: '通知', icon: 'ℹ' },
  { key: 'template_update', label: '模板更新', icon: '📋' },
  { key: 'comment_reply', label: '评论回复', icon: '💬' },
];

interface NotificationPreferencesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPreferencesPanel({
  isOpen,
  onClose,
}: NotificationPreferencesPanelProps) {
  if (!isOpen) return null;
  const getPreference = useNotificationStore((s) => s.getPreference);
  const setPreference = useNotificationStore((s) => s.setPreference);
  const resetPreferences = useNotificationStore((s) => s.resetPreferences);

  const handleToggle = useCallback(
    (key: string) => {
      const current = getPreference(key);
      if (current !== undefined) {
        setPreference(key, !current.enabled);
      }
    },
    [getPreference, setPreference]
  );

  const handleReset = useCallback(() => {
    if (window.confirm('确定要恢复默认设置吗？')) {
      resetPreferences();
    }
  }, [resetPreferences]);

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>通知偏好设置</h2>
        {onClose && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        )}
      </header>

      <div className={styles.content}>
        {/* 推送渠道 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>推送渠道</h3>
          <div className={styles.toggles}>
            {CHANNEL_ITEMS.map((item) => {
              const pref = getPreference(item.key);
              const enabled = pref?.enabled ?? true;
              return (
                <div key={item.key} className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleLabel}>{item.label}</span>
                    <span className={styles.toggleDesc}>{item.description}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`${item.label}: ${enabled ? '开启' : '关闭'}`}
                    className={`${styles.toggle} ${enabled ? styles.toggleOn : styles.toggleOff}`}
                    onClick={() => handleToggle(item.key)}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 通知类型 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>通知类型</h3>
          <div className={styles.toggles}>
            {TYPE_ITEMS.map((item) => {
              const pref = getPreference(item.key);
              const enabled = pref?.enabled ?? true;
              return (
                <div key={item.key} className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleIcon}>{item.icon}</span>
                    <span className={styles.toggleLabel}>{item.label}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`${item.label}: ${enabled ? '开启' : '关闭'}`}
                    className={`${styles.toggle} ${enabled ? styles.toggleOn : styles.toggleOff}`}
                    onClick={() => handleToggle(item.key)}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.resetBtn}
          onClick={handleReset}
        >
          恢复默认设置
        </button>
      </footer>
    </div>
  );
}
