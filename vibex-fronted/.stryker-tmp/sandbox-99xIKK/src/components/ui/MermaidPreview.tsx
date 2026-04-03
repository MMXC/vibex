/**
 * MermaidPreview Component - Mermaid 图表预览
 * 
 * Phase 2: 重构为使用 MermaidManager 单例
 * F2.1: 使用 mermaidManager.render() 统一渲染
 * F2.2: 降级显示方案 - 错误时显示原始代码
 * F2.3: 错误消息改进 - 区分语法错误 / 初始化失败 / 渲染失败
 */
// @ts-nocheck


'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { mermaidManager } from '@/lib/mermaid/MermaidManager';
import { ErrorBoundary } from './ErrorBoundary';

export type DiagramType =
  | 'graph'
  | 'classDiagram'
  | 'stateDiagram'
  | 'flowchart';
export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

export interface MermaidPreviewProps {
  /** Mermaid 代码 */
  code: string;
  /** 图表类型 */
  diagramType?: DiagramType;
  /** 布局方向 */
  layout?: LayoutDirection;
  /** 高度 */
  height?: string;
  /** 自定义样式类 */
  className?: string;
  /** 错误回调 */
  onError?: (error: string) => void;
}

export function MermaidPreview({
  code,
  diagramType = 'graph',
  layout = 'TB',
  height = '400px',
  className = '',
  onError,
}: MermaidPreviewProps) {
  return (
    <ErrorBoundary
      fallback={
        <div
          className={className}
          style={{
            height,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--color-error)',
            padding: '16px',
            color: 'var(--color-text-secondary)',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          <div style={{ fontSize: '14px' }}>图表组件出现错误</div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              marginTop: '8px',
            }}
          >
            请尝试刷新页面或重新输入图表代码
          </div>
        </div>
      }
    >
      <MermaidPreviewInner
        code={code}
        diagramType={diagramType}
        layout={layout}
        height={height}
        className={className}
        onError={onError}
      />
    </ErrorBoundary>
  );
}

function MermaidPreviewInner({
  code,
  diagramType = 'graph',
  layout = 'TB',
  height = '400px',
  className = '',
  onError,
}: MermaidPreviewProps) {
  const [svg, setSvg] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const renderCountRef = useRef(0);

  // F2.3: 生成错误消息（区分类型）
  const classifyError = useCallback((err: unknown): { type: string; message: string } => {
    const msg = err instanceof Error ? err.message : String(err);
    
    // 语法错误
    if (/syntax|syntax error|parse/i.test(msg)) {
      return { type: 'syntax', message: `语法错误: ${msg}` };
    }
    // 初始化失败
    if (/initialize|init/i.test(msg)) {
      return { type: 'init', message: `初始化失败: ${msg}` };
    }
    // 渲染失败
    return { type: 'render', message: `渲染失败: ${msg}` };
  }, []);

  // F2.1: 渲染图表
  const renderChart = useCallback(async () => {
    if (!code.trim()) {
      setSvg('');
      setErrorMessage('');
      setShowRaw(false);
      return;
    }

    renderCountRef.current += 1;
    const currentRender = renderCountRef.current;

    setIsLoading(true);
    setErrorMessage('');
    setShowRaw(false);

    try {
      // F2.1: 使用 mermaidManager.render() 统一渲染
      const rendered = await mermaidManager.render(code);
      if (currentRender !== renderCountRef.current) return; // stale
      setSvg(rendered);
    } catch (err) {
      if (currentRender !== renderCountRef.current) return; // stale
      const { type, message } = classifyError(err);
      setErrorMessage(message);
      setSvg('');
      setShowRaw(true); // F2.2: 降级显示
      onError?.(message);
    } finally {
      if (currentRender === renderCountRef.current) {
        setIsLoading(false);
      }
    }
  }, [code, classifyError, onError]);

  // 防抖：300ms
  useEffect(() => {
    const timer = setTimeout(renderChart, 300);
    return () => clearTimeout(timer);
  }, [renderChart]);

  // ===== 渲染状态 =====

  if (!code.trim()) {
    return (
      <div
        className={className}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          fontSize: '14px',
        }}
      >
        暂无图表内容
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={className}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ marginLeft: '8px' }}>渲染中...</span>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // F2.2: 错误状态 - 显示原始代码
  if (errorMessage && showRaw) {
    return (
      <div
        className={className}
        style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--color-error)',
          padding: '16px',
          overflow: 'auto',
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
        <div
          style={{
            color: 'var(--color-error)',
            fontSize: '14px',
            marginBottom: '8px',
          }}
        >
          {errorMessage}
        </div>
        <details style={{ marginTop: '8px' }}>
          <summary
            style={{
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              userSelect: 'none',
            }}
          >
            查看原始代码
          </summary>
          <pre
            style={{
              marginTop: '8px',
              padding: '8px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {code}
          </pre>
        </details>
      </div>
    );
  }

  // 正常渲染
  return (
    <div
      className={className}
      style={{
        height,
        overflow: 'auto',
        background: 'var(--color-bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        padding: '16px',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default MermaidPreview;
