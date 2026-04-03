/**
 * Page Preview Component
 * 点击页面展示预览
 */
// @ts-nocheck


'use client';

import { useState, useCallback } from 'react';
import styles from './PagePreview.module.css';

export interface PreviewPage {
  id: string;
  name: string;
  route: string;
  components: Array<{ type: string; props: Record<string, unknown> }>;
}

export interface PagePreviewProps {
  pages: PreviewPage[];
  currentPageId?: string;
  onPageSelect?: (pageId: string) => void;
}

export function PagePreview({ pages, currentPageId, onPageSelect }: PagePreviewProps) {
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>(currentPageId);

  const handlePageClick = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    onPageSelect?.(pageId);
  }, [onPageSelect]);

  const selectedPage = pages.find(p => p.id === selectedPageId);

  return (
    <div className={styles.container}>
      <div className={styles.pageList}>
        <h3 className={styles.title}>页面列表</h3>
        {pages.length === 0 ? (
          <p className={styles.empty}>暂无页面</p>
        ) : (
          <ul className={styles.list}>
            {pages.map(page => (
              <li
                key={page.id}
                className={`${styles.pageItem} ${selectedPageId === page.id ? styles.selected : ''}`}
                onClick={() => handlePageClick(page.id)}
              >
                <span className={styles.pageIcon}>📄</span>
                <span className={styles.pageName}>{page.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.previewArea}>
        {selectedPage ? (
          <>
            <div className={styles.previewHeader}>
              <h3>{selectedPage.name}</h3>
              <span className={styles.route}>{selectedPage.route}</span>
            </div>
            <div className={styles.previewContent}>
              {selectedPage.components.map((comp, i) => (
                <div key={i} className={styles.component}>{comp.type}</div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyPreview}>选择页面查看预览</div>
        )}
      </div>
    </div>
  );
}

export default PagePreview;
