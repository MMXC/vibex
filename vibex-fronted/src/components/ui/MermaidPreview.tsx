/**
 * MermaidPreview Component - Mermaid 图表预览
 *
 * 用于渲染 Mermaid 代码为可视化图表
 *
 * Usage:
 * <MermaidPreview code={mermaidCode} diagramType="graph" />
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
// 移除静态导入: import mermaid from 'mermaid';
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

// 动态加载并初始化 Mermaid 的辅助函数
let mermaidInstance: any = null;

const getMermaid = async () => {
  // 如果已经初始化过，直接返回实例
  if (mermaidInstance) return mermaidInstance;

  // 动态导入 mermaid 核心库
  const mermaid = (await import('mermaid')).default;

  // 执行初始化配置
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    themeVariables: {
      primaryColor: '#00ffff',
      primaryTextColor: '#f0f0f5',
      primaryBorderColor: '#00ffff',
      lineColor: '#606070',
      secondaryColor: '#8b5cf6',
      tertiaryColor: '#12121a',
      background: '#0a0a0f',
      mainBkg: '#12121a',
      nodeBorder: '#00ffff',
      clusterBkg: '#1a1a24',
      edgeLabelBackground: '#12121a',
    },
  });

  mermaidInstance = mermaid;
  return mermaidInstance;
};

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 生成唯一 ID
  const id = useCallback(
    () => `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  // 渲染图表
  const renderChart = useCallback(async () => {
    if (!code.trim()) {
      setSvg('');
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. 动态获取 mermaid 实例 (关键修改点)
      const mermaid = await getMermaid();

      // 添加布局方向指示
      let processedCode = code;
      if (diagramType === 'graph' || diagramType === 'flowchart') {
        if (!code.toLowerCase().includes('direction')) {
          processedCode = `flowchart ${layout}\n${code.replace(/^(flowchart|graph)/i, '')}`;
        }
      }

      const chartId = id();
      
      // 2. 使用动态加载的实例进行渲染
      const { svg: renderedSvg } = await mermaid.render(chartId, processedCode);
      setSvg(renderedSvg);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '图表渲染失败';
      setError(errorMessage);
      setSvg('');
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [code, diagramType, layout, id, onError]);

  // 当代码变化时重新渲染
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      renderChart();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [renderChart]);

  // 加载状态
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
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
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
          <span>渲染中...</span>
        </div>
        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
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
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
        <div
          style={{
            color: 'var(--color-error)',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          图表渲染失败
        </div>
        <div
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '12px',
            marginTop: '8px',
            maxWidth: '100%',
            overflow: 'auto',
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  // 空状态
  if (!svg && !error) {
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

  // 正常渲染
  return (
    <div
      ref={containerRef}
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

