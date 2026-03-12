/**
 * MermaidRenderer - Mermaid 流程图渲染组件
 * 
 * 支持五步构建法的流程可视化
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  chart: string;
  title?: string;
}

// 初始化 mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
});

export function MermaidRenderer({ chart, title }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const renderChart = async () => {
      if (!chart.trim()) {
        setSvg('');
        return;
      }

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError('');
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('图表渲染失败');
        setSvg('');
      }
    };

    renderChart();
  }, [chart]);

  if (!chart.trim()) {
    return null;
  }

  return (
    <div style={{ marginTop: '16px' }}>
      {title && (
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 500, 
          color: 'rgba(255,255,255,0.8)',
          marginBottom: '8px' 
        }}>
          {title}
        </div>
      )}
      <div 
        ref={containerRef}
        style={{ 
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: '16px',
          overflow: 'auto',
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {error && (
        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default MermaidRenderer;
