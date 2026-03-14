import React from 'react';
import styles from './PreviewArea.module.css';
import type { PreviewAreaProps } from '../types';

export const PreviewArea: React.FC<PreviewAreaProps> = ({
  content = '',
  isLoading = false,
  onRefresh,
}) => {
  return (
    <div className={styles.previewArea}>
      <div className={styles.header}>
        <span className={styles.title}>预览</span>
        <button 
          className={styles.refreshButton}
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? '加载中...' : '🔄'}
        </button>
      </div>
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>加载中...</div>
        ) : content ? (
          <div className={styles.previewContent}>{content}</div>
        ) : (
          <div className={styles.placeholder}>暂无预览内容</div>
        )}
      </div>
    </div>
  );
};

export default PreviewArea;
