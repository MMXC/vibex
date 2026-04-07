/**
 * Prototype Preview Component
 * 预览渲染、交互响应
 */
// @ts-nocheck


'use client';

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import styles from './PrototypePreview.module.css';

export interface PreviewComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: PreviewComponent[];
}

export interface PreviewPage {
  id: string;
  name: string;
  route: string;
  components: PreviewComponent[];
}

export interface PrototypePreviewProps {
  pages: PreviewPage[];
  currentPageId?: string;
  onPageChange?: (pageId: string) => void;
  interactive?: boolean;
}

export function PrototypePreview({
  pages,
  currentPageId,
  onPageChange,
  interactive = true,
}: PrototypePreviewProps) {
  const [activePageId, setActivePageId] = useState<string>(currentPageId || pages[0]?.id);
  const [interactions, setInteractions] = useState<Record<string, unknown>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activePage = pages.find(p => p.id === activePageId);

  const handlePageSelect = useCallback((pageId: string) => {
    setActivePageId(pageId);
    onPageChange?.(pageId);
  }, [onPageChange]);

  const handleInteraction = useCallback((componentId: string, action: string, data?: unknown) => {
    if (!interactive) return;
    setInteractions(prev => ({
      ...prev,
      [componentId]: { action, data, timestamp: Date.now() }
    }));
  }, [interactive]);

  const renderComponent = (component: PreviewComponent, index: number): ReactNode => {
    const isHovered = hoveredId === component.id;
    const hasInteraction = interactions[component.id];

    return (
      <div
        key={component.id || index}
        className={`${styles.component} ${isHovered ? styles.hovered : ''} ${hasInteraction ? styles.interacted : ''}`}
        onMouseEnter={() => setHoveredId(component.id)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={() => handleInteraction(component.id, 'click')}
        data-component-id={component.id}
        data-component-type={component.type}
      >
        <div className={styles.componentContent}>
          <span className={styles.componentType}>{component.type}</span>
          {!!component.props.label && (
            <span className={styles.componentLabel}>{String(component.props.label)}</span>
          )}
        </div>
        {component.children && (
          <div className={styles.componentChildren}>
            {component.children.map((child, i) => renderComponent(child, i))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Page Tabs */}
      <div className={styles.pageTabs}>
        {pages.map(page => (
          <button
            key={page.id}
            type="button"
            className={`${styles.pageTab} ${activePageId === page.id ? styles.active : ''}`}
            onClick={() => handlePageSelect(page.id)}
          >
            {page.name}
          </button>
        ))}
      </div>

      {/* Preview Area */}
      <div className={styles.previewArea}>
        {activePage ? (
          <>
            <div className={styles.previewHeader}>
              <h3 className={styles.pageName}>{activePage.name}</h3>
              <span className={styles.pageRoute}>{activePage.route}</span>
            </div>
            <div className={styles.previewContent}>
              {activePage.components.map((comp, i) => renderComponent(comp, i))}
            </div>
          </>
        ) : (
          <div className={styles.empty}>选择页面查看预览</div>
        )}
      </div>

      {/* Interaction Log */}
      {interactive && Object.keys(interactions).length > 0 && (
        <div className={styles.interactionLog}>
          <h4>交互记录</h4>
          {Object.entries(interactions).map(([id, data]: [string, unknown]) => (
            <div key={id} className={styles.logEntry}>
              <span className={styles.logId}>{id.slice(0, 8)}</span>
              <span className={styles.logAction}>{(data as { action: string }).action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PrototypePreview;
