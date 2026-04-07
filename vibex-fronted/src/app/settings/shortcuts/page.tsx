/**
 * Shortcut Settings Page - 快捷键配置页面
 * 路由: /settings/shortcuts
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useShortcutStore, type ShortcutCategory as CategoryType } from '@/stores/shortcutStore';
import {
  ShortcutCategory,
  ShortcutEditModal,
} from '@/components/shortcuts';
import { ArrowLeft, RotateCcw, Info } from 'lucide-react';
import styles from './shortcuts.module.css';

const CATEGORIES: { id: CategoryType; title: string }[] = [
  { id: 'navigation', title: '导航' },
  { id: 'edit', title: '编辑' },
  { id: 'view', title: '视图' },
  { id: 'phase', title: 'Phase 切换' },
];

export default function ShortcutSettingsPage() {
  const { resetAll } = useShortcutStore();

  const handleResetAll = () => {
    if (confirm('确定要重置所有快捷键到默认值吗？此操作不可撤销。')) {
      resetAll();
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/user-settings" className={styles.backBtn}>
            <ArrowLeft size={20} />
            返回设置
          </Link>
        </div>
        <h1 className={styles.title}>快捷键配置</h1>
        <div className={styles.headerRight} />
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>自定义快捷键</h2>
          <p className={styles.pageSubtitle}>
            自定义您习惯的快捷键映射。所有更改将自动保存并跨会话保持。
          </p>
        </div>

        {/* Tips */}
        <div className={styles.tips}>
          <h4 className={styles.tipsTitle}>
            <Info size={16} />
            使用提示
          </h4>
          <ul className={styles.tipsList}>
            <li>点击编辑按钮进入编辑模式，然后按下新的快捷键组合</li>
            <li>如果快捷键与其他操作冲突，会显示警告并阻止保存</li>
            <li>点击重置按钮可恢复单个快捷键的默认值</li>
            <li>使用 Cmd/Ctrl 作为修饰键时，请注意跨平台兼容性</li>
          </ul>
        </div>

        {/* Actions */}
        <div className={styles.actionsRow}>
          <button className={styles.resetAllBtn} onClick={handleResetAll}>
            <RotateCcw size={14} />
            重置为默认
          </button>
        </div>

        {/* Categories */}
        <div className={styles.categories}>
          {CATEGORIES.map((category) => (
            <ShortcutCategory
              key={category.id}
              id={category.id}
              title={category.title}
            />
          ))}
        </div>
      </main>

      {/* Edit Modal */}
      <ShortcutEditModal />
    </div>
  );
}
