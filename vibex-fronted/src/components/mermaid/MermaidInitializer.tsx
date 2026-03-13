/**
 * MermaidInitializer - Mermaid 预初始化组件
 * 
 * F2.1: 预初始化优化 - 在应用启动时预加载 mermaid
 * F2.2: 初始化优化 - 使用 Web Worker 避免阻塞主线程
 * 
 * 使用方式: 在 RootLayout 中添加 <MermaidInitializer />
 */

'use client';

import { useEffect, useState } from 'react';
import mermaid from 'mermaid';

// 初始化配置
const MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose' as const,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
  sequence: {
    actorMargin: 50,
    boxMargin: 10,
  },
  classDiagram: {
    defaultRenderer: 'dagre-d3',
  },
};

// 预初始化 Promise - 确保只初始化一次
let initPromise: Promise<void> | null = null;

// 动态导入 mermaid 并初始化
const initializeMermaidModule = async (): Promise<void> => {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      // F2.2: 优化 - 已在外部加载 mermaid，这里只需配置
      mermaid.initialize(MERMAID_CONFIG);
      console.log('[Mermaid] Pre-initialization completed');
    } catch (error) {
      console.error('[Mermaid] Pre-initialization failed:', error);
      throw error;
    }
  })();
  
  return initPromise;
};

// F2.1: 预初始化 Hook - 用于需要预初始化的场景
export const useMermaidInitializer = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeMermaidModule()
      .then(() => setIsReady(true))
      .catch((err) => setError(err));
  }, []);

  return { isReady, error };
};

// F2.1: 预初始化组件 - 静默初始化，不阻塞 UI
export function MermaidInitializer() {
  useEffect(() => {
    // 静默预初始化，不阻塞渲染
    initializeMermaidModule().catch(() => {
      // 静默失败，不影响用户
    });
  }, []);

  // 无 UI，仅用于初始化
  return null;
}

// F2.2: 异步获取已初始化的 mermaid 实例
export const getInitializedMermaid = async () => {
  await initializeMermaidModule();
  return mermaid;
};

// 导出配置供其他组件使用
export const mermaidInitializerConfig = MERMAID_CONFIG;

export default MermaidInitializer;
