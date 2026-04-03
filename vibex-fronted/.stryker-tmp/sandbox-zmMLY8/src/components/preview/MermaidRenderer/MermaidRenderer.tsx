/**
 * MermaidRenderer Component - Epic 4: Mermaid 渲染组件
 * 
 * 功能：
 * - ST-4.3: Mermaid 渲染 (4种类型)
 * - ST-4.4: 缩放控制 (通过 scale prop)
 * - ST-4.5: 拖拽平移
 * 
 * 使用 CSS Modules 进行样式隔离
 */
// @ts-nocheck

'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { mermaidManager } from '@/lib/mermaid/MermaidManager';
import styles from './MermaidRenderer.module.css';

export type MermaidType = 'context' | 'model' | 'flow' | 'components';

export interface MermaidRendererProps {
  /** Mermaid 代码 */
  code: string;
  /** 图表类型 */
  type?: MermaidType;
  /** 缩放比例 (0.5 - 2.0) */
  scale?: number;
  /** 是否加载中 */
  isLoading?: boolean;
  /** 错误回调 */
  onError?: (error: string) => void;
  /** 渲染完成回调 */
  onRenderComplete?: () => void;
  /** 自定义类名 */
  className?: string;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  translateX: number;
  translateY: number;
}

/**
 * MermaidRenderer - Mermaid 图表渲染组件
 * 
 * 支持：
 * - 4种图表类型渲染
 * - 缩放控制
 * - 拖拽平移
 * - 错误降级显示
 */
export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  code,
  type = 'flow',
  scale = 1,
  isLoading = false,
  onError,
  onRenderComplete,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    translateX: 0,
    translateY: 0,
  });

  // 防抖渲染
  useEffect(() => {
    if (!code.trim()) {
      setSvg('');
      setError('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsRendering(true);
      try {
        const rendered = await mermaidManager.render(code);
        setSvg(rendered);
        setError('');
        onRenderComplete?.();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setSvg('');
        onError?.(message);
      } finally {
        setIsRendering(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [code, onError, onRenderComplete]);

  // ST-4.5: 拖拽平移处理
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // 只响应左键
      e.preventDefault();

      setDragState((prev) => ({
        ...prev,
        isDragging: true,
        startX: e.clientX - prev.translateX,
        startY: e.clientY - prev.translateY,
      }));
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.isDragging) return;

      setDragState((prev) => ({
        ...prev,
        translateX: e.clientX - prev.startX,
        translateY: e.clientY - prev.startY,
      }));
    },
    [dragState.isDragging, dragState.startX, dragState.startY]
  );

  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      isDragging: false,
    }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      isDragging: false,
    }));
  }, []);

  // 双击重置位置
  const handleDoubleClick = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      translateX: 0,
      translateY: 0,
    }));
  }, []);

  // 计算变换样式
  const transformStyle = useMemo(
    () => ({
      transform: `translate(${dragState.translateX}px, ${dragState.translateY}px) scale(${scale})`,
      cursor: dragState.isDragging ? 'grabbing' : 'grab',
    }),
    [dragState.translateX, dragState.translateY, scale, dragState.isDragging]
  );

  // 空状态
  if (!code.trim() && !isLoading && !isRendering) {
    return (
      <div
        className={`${styles.mermaidRenderer} ${styles.empty} ${className}`}
        data-testid="mermaid-empty"
        data-type={type}
      >
        <div className={styles.emptyContent}>
          <span className={styles.emptyIcon}>📊</span>
          <p className={styles.emptyText}>输入需求后预览将显示在这里</p>
          <p className={styles.emptyHint}>支持上下文图、模型图、流程图、组件图</p>
        </div>
      </div>
    );
  }

  // 加载状态
  if (isLoading || isRendering) {
    return (
      <div
        className={`${styles.mermaidRenderer} ${styles.loading} ${className}`}
        data-testid="mermaid-loading"
        data-type={type}
      >
        <div className={styles.spinner} data-testid="preview-skeleton" />
        <span className={styles.loadingText}>渲染中...</span>
      </div>
    );
  }

  // 错误状态 - ST-4.3: 降级显示原始代码
  if (error) {
    return (
      <div
        className={`${styles.mermaidRenderer} ${styles.error} ${className}`}
        data-testid="mermaid-error"
        data-type={type}
      >
        <div className={styles.errorContent}>
          <span className={styles.errorIcon}>⚠️</span>
          <p className={styles.errorMessage}>{error}</p>
          <details className={styles.errorDetails}>
            <summary>查看原始代码</summary>
            <pre className={styles.rawCode}>{code}</pre>
          </details>
        </div>
      </div>
    );
  }

  // 正常渲染 - ST-4.3 + ST-4.5
  return (
    <div
      ref={containerRef}
      className={`${styles.mermaidRenderer} ${className}`}
      data-testid={`mermaid-${type}`}
      data-type={type}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
    >
      <div className={styles.canvas} style={transformStyle}>
        <div
          className={styles.svgContainer}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      
      {/* 拖拽提示 */}
      <div className={styles.dragHint}>
        拖拽平移 · 双击重置
      </div>
    </div>
  );
};

export default MermaidRenderer;
