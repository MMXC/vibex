/**
 * CollapseHandle - 底部面板收起手柄
 * 规格: 30px 高度，居中文字
 */
import React from 'react';
import styles from './CollapseHandle.module.css';

export interface CollapseHandleProps {
  /** 是否收起状态 */
  isCollapsed?: boolean;
  /** 收起回调 */
  onToggle?: () => void;
}

export function CollapseHandle({ isCollapsed = false, onToggle }: CollapseHandleProps) {
  return (
    <div
      className={styles.handle}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle?.(); }}
      data-testid="collapse-handle"
      title={isCollapsed ? '展开面板' : '收起面板'}
    >
      <span className={styles.icon}>{isCollapsed ? '⬇️' : '⬆️'}</span>
      <span className={styles.label}>{isCollapsed ? '展开' : '拖动收起'}</span>
    </div>
  );
}

export default CollapseHandle;
