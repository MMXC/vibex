/**
 * Module Detail Modal Component
 * 打开、关闭、切换模块功能
 */
// @ts-nocheck


'use client';

import { useEffect, useCallback } from 'react';
import styles from './ModuleDetailModal.module.css';

export interface ModuleDetail {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface ModuleDetailModalProps {
  isOpen: boolean;
  module: ModuleDetail | null;
  onClose?: () => void;
  onSwitch?: (moduleId: string) => void;
}

export function ModuleDetailModal({ isOpen, module, onClose, onSwitch }: ModuleDetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const handleSwitch = useCallback(() => {
    if (module) {
      onSwitch?.(module.id);
    }
  }, [module, onSwitch]);

  if (!isOpen || !module) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{module.name}</h2>
            <span className={`${styles.status} ${styles[module.status]}`}>
              {module.status === 'completed' ? '✓ 完成' : 
               module.status === 'in-progress' ? '⟳ 进行中' : 
               module.status === 'error' ? '✗ 错误' : '○ 待处理'}
            </span>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {module.description && (
            <div className={styles.section}>
              <h3>描述</h3>
              <p>{module.description}</p>
            </div>
          )}
          
          {module.content && (
            <div className={styles.section}>
              <h3>内容</h3>
              <div className={styles.contentBox}>{module.content}</div>
            </div>
          )}

          {module.metadata && Object.keys(module.metadata).length > 0 && (
            <div className={styles.section}>
              <h3>元数据</h3>
              <pre className={styles.metadata}>
                {JSON.stringify(module.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.switchButton} onClick={handleSwitch}>
            切换到该模块
          </button>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModuleDetailModal;
