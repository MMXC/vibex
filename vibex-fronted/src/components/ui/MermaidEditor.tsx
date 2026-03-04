/**
 * MermaidEditor Component - Mermaid 编辑器（带预览）
 * 
 * 集成代码编辑和实时预览的组件
 * 
 * Usage:
 * <MermaidEditor 
 *   value={code} 
 *   onChange={setCode}
 *   diagramType="graph"
 * />
 */

'use client';

import { useState, useCallback } from 'react';
import MermaidCodeEditor from './MermaidCodeEditor';
import MermaidPreview, { DiagramType, LayoutDirection } from './MermaidPreview';

export interface MermaidEditorProps {
  /** 图表类型 */
  diagramType?: DiagramType;
  /** 代码值 */
  value: string;
  /** 代码变化回调 */
  onChange?: (code: string) => void;
  /** 只读模式 */
  readOnly?: boolean;
  /** 布局方向 */
  layout?: LayoutDirection;
  /** 高度 */
  height?: string;
  /** 是否显示预览 */
  showPreview?: boolean;
  /** 自定义样式类 */
  className?: string;
  /** 错误回调 */
  onError?: (error: string) => void;
}

export function MermaidEditor({
  diagramType = 'graph',
  value,
  onChange,
  readOnly = false,
  layout = 'TB',
  height = '500px',
  showPreview = true,
  className = '',
  onError,
}: MermaidEditorProps) {
  const [errors, setErrors] = useState<string[]>([]);
  
  // 处理代码变化
  const handleChange = useCallback((newValue: string) => {
    onChange?.(newValue);
  }, [onChange]);
  
  // 处理验证结果
  const handleValidate = useCallback((validationErrors: string[]) => {
    setErrors(validationErrors);
  }, []);
  
  // 编辑器和预览的高度分配
  const editorHeight = showPreview ? `calc(${height} / 2)` : height;
  const previewHeight = showPreview ? `calc(${height} / 2)` : height;
  
  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height,
      }}
    >
      {/* 编辑器部分 */}
      <div style={{ flex: showPreview ? '0 0 auto' : '1', minHeight: editorHeight }}>
        <MermaidCodeEditor
          value={value}
          onChange={handleChange}
          onValidate={handleValidate}
          readOnly={readOnly}
          height={editorHeight}
        />
      </div>
      
      {/* 预览部分 */}
      {showPreview && (
        <div style={{ flex: '1 1 auto', minHeight: previewHeight, overflow: 'hidden' }}>
          <MermaidPreview
            code={value}
            diagramType={diagramType}
            layout={layout}
            height={previewHeight}
            onError={onError}
          />
        </div>
      )}
      
      {/* 错误提示 */}
      {errors.length > 0 && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(255, 68, 102, 0.1)',
          border: '1px solid rgba(255, 68, 102, 0.3)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--color-error)',
        }}>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>语法错误:</div>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MermaidEditor;
