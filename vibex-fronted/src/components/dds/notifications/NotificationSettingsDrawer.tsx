/**
 * NotificationSettingsDrawer — S73-E3: 通知管理与历史
 *
 * 通知偏好设置抽屉面板，支持：
 * - 推送渠道开关（应用内、浏览器）
 * - 通知类型开关（@提及、回复、系统、通知）
 * - 偏好保存至 localStorage（通过 notificationStore persist middleware）
 */
'use client';

import React, { useCallback, useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationPreferences } from '@/stores/notificationStore';
import styles from './NotificationSettingsDrawer.module.css';

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
];

interface NotificationSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSettingsDrawer({
  isOpen,
  onClose,
}: NotificationSettingsDrawerProps) {
  const preferences = useNotificationStore((s) => s.preferences);
  const setChannelEnabled = useNotificationStore((s) => s.setChannelEnabled);
  const setTypeEnabled = useNotificationStore((s) => s.setTypeEnabled);
  const resetPreferences = useNotificationStore((s) => s.resetPreferences);

  // ESC 键盘关闭
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleChannelToggle = useCallback(
    (channel: keyof NotificationPreferences['channels']) => {
      const current = preferences.channels[channel];
      setChannelEnabled(channel, !current);
    },
    [preferences.channels, setChannelEnabled]
  );

  const handleTypeToggle = useCallback(
    (type: keyof NotificationPreferences['types']) => {
      const current = preferences.types[type];
      setTypeEnabled(type, !current);
    },
    [preferences.types, setTypeEnabled]
  );

  const handleReset = useCallback(() => {
    if (window.confirm('确定要恢复默认设置吗？')) {
      resetPreferences();
    }
  }, [resetPreferences]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="通知设置"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.drawer}>
        <header className={styles.header}>
          <h2 className={styles.title}>通知设置</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
          >
            →
          </button>
        </header>

        <div className={styles.content}>
          {/* 推送渠道 */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>推送渠道</h3>
            <p className={styles.sectionHint}>
              选择接收通知的方式
            </p>
            <div className={styles.optionList}>
              {CHANNEL_ITEMS.map((item) => (
                <div key={item.key} className={styles.optionRow}>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionLabel}>{item.label}</span>
                    <span className={styles.optionDesc}>{item.description}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.channels[item.key]}
                    aria-label={`${item.label}开关`}
                    className={`${styles.toggle} ${preferences.channels[item.key] ? styles.toggleOn : styles.toggleOff}`}
                    onClick={() => handleChannelToggle(item.key)}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 通知类型 */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>通知类型</h3>
            <p className={styles.sectionHint}>
              选择接收哪些类型的通知
            </p>
            <div className={styles.typeGrid}>
              {TYPE_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="switch"
                  aria-checked={preferences.types[item.key]}
                  aria-label={`${item.label}类型开关`}
                  className={`${styles.typeCard} ${preferences.types[item.key] ? styles.typeCardOn : styles.typeCardOff}`}
                  onClick={() => handleTypeToggle(item.key)}
                >
                  <span className={styles.typeIcon}>{item.icon}</span>
                  <span className={styles.typeLabel}>{item.label}</span>
                  <span className={`${styles.typeStatus} ${preferences.types[item.key] ? styles.typeStatusOn : ''}`}>
                    {preferences.types[item.key] ? '开启' : '关闭'}
                  </span>
                </button>
              ))}
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
    </div>
  );
}
