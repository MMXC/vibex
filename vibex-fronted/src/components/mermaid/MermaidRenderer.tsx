/**
 * MermaidRenderer - Mermaid 流程图渲染组件
 * 
 * 支持五步构建法的流程可视化
 * F1.1: useEffect 优化 - 依赖数组精确
 * F1.2: 缓存机制 - LRU 缓存
 * F2.1: 预初始化 - 使用 MermaidInitializer 预加载
 * F2.2: 初始化优化 - 使用统一的初始化逻辑
 * F3.1: 异步渲染 - cleanup 和 cancellation
 * F3.2: 非阻塞渲染 - requestIdleCallback
 */

'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import mermaid from 'mermaid';
import { preInitialize } from './mermaidInit';

// ==================== F1.2: LRU Cache ====================

class LRUCache<T> {
  private cache: Map<string, T> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    if (!this.cache.has(key)) return undefined;
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value!);
    return value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete oldest (first) item
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const mermaidCache = new LRUCache<string>(50);

// F2.2: 使用统一的初始化逻辑
let mermaidReady = false;

const initializeMermaid = async () => {
  if (mermaidReady) return;
  
  // F2.2: 使用预初始化模块
  await preInitialize();
  mermaidReady = true;
};

interface MermaidRendererProps {
  chart: string;
  title?: string;
}

// F1.1: useEffect 优化 - 使用 useMemo 计算缓存 key
const useCacheKey = (chart: string) => {
  return useMemo(() => {
    // Simple hash for cache key
    let hash = 0;
    for (let i = 0; i < chart.length; i++) {
      const char = chart.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `mermaid-${hash}`;
  }, [chart]);
};

export function MermaidRenderer({ chart, title }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // F3.1: 用于取消异步渲染
  const cancelledRef = useRef(false);
  
  // F1.1: 精确依赖数组
  const cacheKey = useCacheKey(chart);

  // F1.2: 缓存检查
  const cachedSvg = mermaidCache.get(cacheKey);

  // F3.2: 使用 requestIdleCallback 进行非阻塞渲染
  const scheduleRender = useCallback((renderFn: () => Promise<void>) => {
    // F3.2: 检查是否支持 requestIdleCallback
    if (typeof requestIdleCallback !== 'undefined') {
      const idleId = requestIdleCallback(() => {
        if (!cancelledRef.current) {
          renderFn();
        }
      }, { timeout: 100 });
      return () => cancelIdleCallback(idleId);
    } else {
      // Fallback: 使用 setTimeout
      const timeoutId = setTimeout(() => {
        if (!cancelledRef.current) {
          renderFn();
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    // F3.1: 重置取消标志
    cancelledRef.current = false;
    
    // F2.2: 使用异步初始化
    initializeMermaid();

    // F1.2: 缓存命中直接返回
    if (cachedSvg) {
      setSvg(cachedSvg);
      return;
    }

    const renderChart = async () => {
      if (!chart.trim()) {
        setSvg('');
        return;
      }

      // F3.2: 显示加载状态
      setIsLoading(true);
      
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        
        // F3.1: 检查是否已取消
        if (cancelledRef.current) return;
        
        // F1.2: 存入缓存
        mermaidCache.set(cacheKey, svg);
        
        setSvg(svg);
        setError('');
      } catch (err) {
        // F3.1: 检查是否已取消
        if (cancelledRef.current) return;
        
        console.error('Mermaid render error:', err);
        setError('图表渲染失败');
        setSvg('');
      } finally {
        if (!cancelledRef.current) {
          setIsLoading(false);
        }
      }
    };

    // F3.2: 非阻塞调度渲染
    const cleanup = scheduleRender(renderChart);
    
    // F3.1: 清理函数 - 取消异步渲染
    return () => {
      cancelledRef.current = true;
      cleanup?.();
    };
    // F1.1: 精确依赖 - 只在 chart 变化时重新渲染
  }, [chart, cacheKey, cachedSvg, scheduleRender]);

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
          minHeight: isLoading ? '100px' : undefined,
        }}
      >
        {/* F3.2: 加载状态指示 */}
        {isLoading && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '14px',
          }}>
            渲染中...
          </div>
        )}
        {!isLoading && svg && (
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        )}
      </div>
      {error && (
        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default MermaidRenderer;
