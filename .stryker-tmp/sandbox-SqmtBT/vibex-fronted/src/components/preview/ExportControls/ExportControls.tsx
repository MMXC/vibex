/**
 * ExportControls Component - Epic 4: 导出控制
 * 
 * 功能：
 * - ST-4.6: 导出 PNG (via html2canvas)
 * - ST-4.6: 导出 SVG (直接下载)
 * 
 * 使用 CSS Modules 进行样式隔离
 */
// @ts-nocheck

'use client';

import React, { useCallback, useState, useEffect } from 'react';
import styles from './ExportControls.module.css';

// html2canvas 类型声明
type Html2Canvas = (
  element: HTMLElement,
  options?: {
    backgroundColor?: string;
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
  }
) => Promise<HTMLCanvasElement>;

export type ExportFormat = 'png' | 'svg';

export interface ExportControlsProps {
  /** 目标容器 ref (用于 PNG 导出) */
  containerRef: React.RefObject<HTMLElement>;
  /** SVG 容器 ref (用于 SVG 导出) */
  svgRef?: React.RefObject<SVGElement | null>;
  /** 文件名前缀 */
  filenamePrefix?: string;
  /** 导出回调 */
  onExportStart?: (format: ExportFormat) => void;
  /** 导出完成回调 */
  onExportComplete?: (format: ExportFormat, blob: Blob) => void;
  /** 导出失败回调 */
  onExportError?: (format: ExportFormat, error: Error) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * ExportControls - 导出控制组件
 * 
 * 支持：
 * - PNG 导出 (使用 html2canvas)
 * - SVG 导出 (直接下载)
 */
export const ExportControls: React.FC<ExportControlsProps> = ({
  containerRef,
  svgRef,
  filenamePrefix = 'mermaid-diagram',
  onExportStart,
  onExportComplete,
  onExportError,
  disabled = false,
  className = '',
}) => {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const html2canvasRef = React.useRef<Html2Canvas | null>(null);

  // 动态加载 html2canvas
  useEffect(() => {
    const loadHtml2Canvas = async () => {
      try {
        const html2canvas = (await import('html2canvas')).default;
        html2canvasRef.current = html2canvas;
      } catch (err) {
        console.warn('html2canvas not available:', err);
      }
    };
    loadHtml2Canvas();
  }, []);

  // 格式化文件名
  const formatFilename = useCallback(
    (format: ExportFormat) => {
      const timestamp = new Date().toISOString().slice(0, 10);
      return `${filenamePrefix}-${timestamp}.${format}`;
    },
    [filenamePrefix]
  );

  // ST-4.6: 导出 PNG
  const handleExportPNG = useCallback(async () => {
    if (!containerRef.current || disabled || isExporting) return;
    if (!html2canvasRef.current) {
      onExportError?.('png', new Error('html2canvas not available'));
      return;
    }

    setIsExporting('png');
    onExportStart?.('png');

    try {
      const html2canvas = html2canvasRef.current;
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // 高清导出
        useCORS: true,
        logging: false,
      });

      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          // 下载文件
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = formatFilename('png');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          onExportComplete?.('png', blob);
        }
      }, 'image/png');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onExportError?.('png', error);
    } finally {
      setIsExporting(null);
    }
  }, [
    containerRef,
    disabled,
    isExporting,
    formatFilename,
    onExportStart,
    onExportComplete,
    onExportError,
  ]);

  // ST-4.6: 导出 SVG
  const handleExportSVG = useCallback(async () => {
    if (!svgRef?.current && !containerRef.current) return;
    if (disabled || isExporting) return;

    setIsExporting('svg');
    onExportStart?.('svg');

    try {
      // 优先使用 svgRef
      let svgElement: SVGElement | null = svgRef?.current ?? null;

      // 如果没有 svgRef，从 container 中查找 SVG
      if (!svgElement && containerRef.current) {
        svgElement = containerRef.current.querySelector('svg');
      }

      if (!svgElement) {
        throw new Error('No SVG element found');
      }

      // 克隆 SVG 并处理
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      
      // 获取 SVG 样式
      const computedStyle = getComputedStyle(svgElement);
      svgClone.setAttribute('width', computedStyle.width);
      svgClone.setAttribute('height', computedStyle.height);

      // 序列化 SVG
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgClone);

      // 添加 XML 声明
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;

      // 创建 Blob
      const blob = new Blob([svgString], { type: 'image/svg+xml' });

      // 下载文件
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = formatFilename('svg');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onExportComplete?.('svg', blob);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onExportError?.('svg', error);
    } finally {
      setIsExporting(null);
    }
  }, [
    containerRef,
    svgRef,
    disabled,
    isExporting,
    formatFilename,
    onExportStart,
    onExportComplete,
    onExportError,
  ]);

  return (
    <div className={`${styles.exportControls} ${className}`} data-testid="export-controls">
      <button
        className={styles.exportButton}
        onClick={handleExportPNG}
        disabled={disabled || isExporting !== null}
        data-testid="export-png-button"
        title="导出为 PNG 图片"
      >
        {isExporting === 'png' ? (
          <>
            <span className={styles.spinner} />
            导出中...
          </>
        ) : (
          <>
            <span className={styles.buttonIcon}>📷</span>
            PNG
          </>
        )}
      </button>

      <button
        className={styles.exportButton}
        onClick={handleExportSVG}
        disabled={disabled || isExporting !== null}
        data-testid="export-svg-button"
        title="导出为 SVG 矢量图"
      >
        {isExporting === 'svg' ? (
          <>
            <span className={styles.spinner} />
            导出中...
          </>
        ) : (
          <>
            <span className={styles.buttonIcon}>🎨</span>
            SVG
          </>
        )}
      </button>
    </div>
  );
};

export default ExportControls;
