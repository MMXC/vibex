/**
 * MermaidInit - Mermaid 初始化管理模块
 * 
 * F2.1: 预初始化 - 提供预加载能力
 * F2.2: 初始化优化 - 统一初始化逻辑
 * 
 * 使用方式:
 * - 在 layout 中使用 MermaidInitializer 组件进行预初始化
 * - 组件中使用 useMermaidReady hook 检查初始化状态
 */

import mermaid from 'mermaid';

// 初始化配置
const MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'dark' as const,
  securityLevel: 'loose' as const,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis' as const,
  },
};

// 预初始化 Promise
let initPromise: Promise<void> | null = null;
let isInitialized = false;

// 初始化函数
const doInitialize = async (): Promise<void> => {
  if (isInitialized) return;
  
  mermaid.initialize(MERMAID_CONFIG);
  isInitialized = true;
};

// 预初始化 - 异步
export const preInitialize = async (): Promise<void> => {
  if (initPromise) return initPromise;
  
  initPromise = doInitialize();
  return initPromise;
};

// 获取 mermaid 实例（确保已初始化）
export const getMermaid = async () => {
  await preInitialize();
  return mermaid;
};

// 检查是否已初始化
export const isReady = () => isInitialized;

// 配置（供外部使用）
export const config = MERMAID_CONFIG;
