'use client';

/**
 * NotificationPreferencesSection — S87-E1: 通知偏好设置面板（Settings 集成版）
 *
 * 将通知偏好设置集成到 Settings 页面，作为一个标准的 settings section。
 * 复用 Settings 页面的 section 样式，展示通知渠道和通知类型的开关。
 *
 * S87-E1 变更说明：
 * - 新增 Settings 页面通知偏好设置区块
 * - 支持应用内/浏览器渠道开关
 * - 支持 6 种通知类型开关
 * - 变更实时保存到 IndexedDB（通过 notificationStore）
 * - 提供"恢复默认设置"按钮
 */
import React, { useCallback } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationPreferences } from '@/stores/notificationStore';
import styles from './settings.module.css';

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

export function NotificationPreferencesSection() {
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
    <section className={styles.section} data-testid="notification-preferences-section">
      <h2 className={styles.sectionTitle}>Notifications</h2>

      {/* 推送渠道 */}
      <div className={styles.field}>
        <p className={styles.subTitle}>推送渠道</p>
        {CHANNEL_ITEMS.map((item) => {
          const pref = getPreference(item.key);
          const enabled = pref?.enabled ?? true;
          return (
            <div key={item.key} className={styles.toggleRow}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={enabled}
                  onChange={() => handleToggle(item.key)}
                  data-testid={`channel-${item.key}`}
                />
                <span>{item.label}</span>
              </label>
              <span className={styles.toggleDesc}>{item.description}</span>
            </div>
          );
        })}
      </div>

      {/* 通知类型 */}
      <div className={styles.field}>
        <p className={styles.subTitle}>通知类型</p>
        <div className={styles.typeGrid}>
          {TYPE_ITEMS.map((item) => {
            const pref = getPreference(item.key);
            const enabled = pref?.enabled ?? true;
            return (
              <div key={item.key} className={styles.typeItem}>
                <label className={styles.typeLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={enabled}
                    onChange={() => handleToggle(item.key)}
                    data-testid={`type-${item.key}`}
                  />
                  <span className={styles.typeIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.field}>
        <button
          type="button"
          className={styles.resetBtn}
          onClick={handleReset}
          data-testid="reset-notification-prefs"
        >
          恢复默认设置
        </button>
      </div>
    </section>
  );
}
