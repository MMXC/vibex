/**
 * OfflineBanner — 网络离线状态提示
 * E05-S4: 离线时显示 banner，重新上线后自动隐藏
 */
'use client';

import { useState, useEffect } from 'react';
import styles from './OfflineBanner.module.css';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // 延迟 5s 隐藏 banner
      setTimeout(() => setHidden(true), 5000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setHidden(false);
    };

    // 初始状态
    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (hidden || !isOffline) return null;

  return (
    <div className={styles.banner} role="alert" aria-live="polite">
      <span className={styles.icon}>📡</span>
      <span className={styles.text}>离线模式，部分功能可能不可用</span>
    </div>
  );
}