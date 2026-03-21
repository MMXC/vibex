/**
 * PreviewHeader Component - Epic 4: 预览区头部
 * 
 * 功能：
 * - ST-4.4: 缩放控制 (50%–200%)
 * - ST-4.6: 导出按钮 (PNG / SVG)
 * 
 * 使用 CSS Modules 进行样式隔离
 */
'use client';

import React, { useCallback } from 'react';
import styles from './PreviewHeader.module.css';

export interface PreviewHeaderProps {
  /** 当前缩放值 (0.5 - 2.0) */
  scale: number;
  /** 缩放变化回调 */
  onScaleChange: (scale: number) => void;
  /** 导出 PNG 回调 */
  onExportPNG: () => void;
  /** 导出 SVG 回调 */
  onExportSVG: () => void;
  /** 是否正在导出 */
  isExporting?: boolean;
  /** 当前图表类型 */
  diagramType?: 'context' | 'model' | 'flow' | 'components';
  /** 自定义类名 */
  className?: string;
}

// 缩放选项
const SCALE_OPTIONS = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
  { value: 2, label: '200%' },
] as const;

/**
 * PreviewHeader - 预览区头部组件
 * 
 * 提供：
 * - 缩放滑块控制 (50% - 200%)
 * - 导出按钮 (PNG / SVG)
 */
export const PreviewHeader: React.FC<PreviewHeaderProps> = ({
  scale,
  onScaleChange,
  onExportPNG,
  onExportSVG,
  isExporting = false,
  diagramType,
  className = '',
}) => {
  // ST-4.4: 缩放滑块变化处理
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newScale = parseFloat(e.target.value);
      onScaleChange(newScale);
    },
    [onScaleChange]
  );

  // 快速缩放选项点击
  const handleScaleOptionClick = useCallback(
    (value: number) => {
      onScaleChange(value);
    },
    [onScaleChange]
  );

  // 缩放百分比显示
  const scalePercent = Math.round(scale * 100);

  return (
    <div className={`${styles.previewHeader} ${className}`} data-testid="preview-header">
      {/* 图表类型标签 */}
      {diagramType && (
        <span className={styles.diagramType} data-testid="diagram-type">
          {diagramType === 'context' && '📦 限界上下文'}
          {diagramType === 'model' && '🏗️ 领域模型'}
          {diagramType === 'flow' && '📝 业务流程'}
          {diagramType === 'components' && '🧩 组件图'}
        </span>
      )}

      {/* ST-4.4: 缩放控制 */}
      <div className={styles.scaleControl} data-testid="scale-control">
        <span className={styles.scaleLabel}>缩放</span>
        
        {/* 快速缩放选项 */}
        <div className={styles.scaleOptions}>
          {SCALE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.scaleOption} ${
                Math.abs(scale - opt.value) < 0.01 ? styles.scaleOptionActive : ''
              }`}
              onClick={() => handleScaleOptionClick(opt.value)}
              data-testid={`scale-option-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 缩放滑块 */}
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={scale}
          onChange={handleSliderChange}
          className={styles.scaleSlider}
          data-testid="scale-slider"
          aria-label="缩放比例"
        />

        {/* 缩放百分比 */}
        <span className={styles.scaleValue} data-testid="scale-value">
          {scalePercent}%
        </span>
      </div>

      {/* ST-4.6: 导出按钮 */}
      <div className={styles.exportControls} data-testid="export-controls">
        <button
          className={styles.exportButton}
          onClick={onExportPNG}
          disabled={isExporting}
          data-testid="export-png-button"
          title="导出为 PNG"
        >
          {isExporting ? '导出中...' : '📷 PNG'}
        </button>
        <button
          className={styles.exportButton}
          onClick={onExportSVG}
          disabled={isExporting}
          data-testid="export-svg-button"
          title="导出为 SVG"
        >
          {isExporting ? '导出中...' : '🎨 SVG'}
        </button>
      </div>
    </div>
  );
};

export default PreviewHeader;
