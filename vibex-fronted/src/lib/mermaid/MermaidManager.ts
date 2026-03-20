/**
 * MermaidManager - 统一 Mermaid 初始化和渲染管理
 * 单例模式，确保全局只有一个 mermaid 初始化状态
 * 
 * Phase 1: F1.1 单例模式、F1.2 预初始化、F1.3 统一配置
 */

'use client';

import DOMPurify from 'dompurify';

// ==================== 类型定义 ====================

export interface IMermaidManager {
  initialize(): Promise<void>;
  render(code: string, containerId?: string): Promise<string>;
  isInitialized(): boolean;
}

export interface MermaidRenderResult {
  svg: string;
  containerId: string;
}

// ==================== MermaidManager 单例 ====================

class MermaidManagerImpl implements IMermaidManager {
  private static _instance: MermaidManagerImpl | null = null;

  // LRU 缓存（50 条）
  private cache: Map<string, string> = new Map();
  private static readonly MAX_CACHE_SIZE = 50;

  // 初始化状态
  private initPromise: Promise<void> | null = null;
  private initialized = false;

  // 初始化配置
  private static readonly MERMAID_CONFIG = {
    startOnLoad: false,
    theme: 'dark' as const,
    securityLevel: 'loose' as const,
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis' as const,
    },
    sequence: {
      useMaxWidth: true,
    },
  };

  private constructor() {}

  // F1.1: 单例获取
  static getInstance(): MermaidManagerImpl {
    if (!MermaidManagerImpl._instance) {
      MermaidManagerImpl._instance = new MermaidManagerImpl();
    }
    return MermaidManagerImpl._instance;
  }

  // F1.2: 初始化（幂等）
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    await this.initPromise;
    this.initialized = true;
  }

  private async doInitialize(): Promise<void> {
    const mermaid = (await import('mermaid')).default;
    mermaid.initialize(MermaidManagerImpl.MERMAID_CONFIG);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // F1.3: 统一 render
  async render(code: string, containerId?: string): Promise<string> {
    if (!code.trim()) return '';

    // 缓存命中
    const cached = this.cache.get(code);
    if (cached) return cached;

    // 未初始化则先初始化
    if (!this.initialized) {
      await this.initialize();
    }

    const mermaid = (await import('mermaid')).default;
    const id = containerId || `mermaid-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const { svg } = await mermaid.render(id, code);
      const sanitized = DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true },
        ADD_TAGS: ['foreignObject'],
      });

      // 缓存
      this.addToCache(code, sanitized);

      return sanitized;
    } catch (err) {
      // 降级：返回原始代码的 SVG 包装
      const fallback = `<div style="color:#ef4444;font-size:12px;padding:8px;">渲染失败: ${err instanceof Error ? err.message : String(err)}</div>`;
      throw err;
    }
  }

  // LRU 缓存
  private addToCache(key: string, value: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= MermaidManagerImpl.MAX_CACHE_SIZE) {
      // 删除最老的
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// 导出单例访问器
export const mermaidManager = MermaidManagerImpl.getInstance();
export default mermaidManager;
