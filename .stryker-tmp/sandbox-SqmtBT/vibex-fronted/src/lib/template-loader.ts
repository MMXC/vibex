/**
 * Template Loader
 * 
 * 模板加载器 - 负责从数据源加载模板
 */
// @ts-nocheck


import type { 
  Template, 
  TemplateFilter, 
  TemplateListResponse,
  TemplateLoadStatus 
} from '@/types/template';
import { TEMPLATE_DATA } from './template-data';

// 缓存配置
const CACHE_KEY = 'vibex-template-cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30 分钟

// 内存缓存
let memoryCache: { data: Template[]; timestamp: number } | null = null;

/**
 * 从本地数据加载模板
 */
async function loadFromLocalData(): Promise<Template[]> {
  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 100));
  return TEMPLATE_DATA;
}

/**
 * 获取内存缓存
 */
function getMemoryCache(): Template[] | null {
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
    return memoryCache.data;
  }
  return null;
}

/**
 * 设置内存缓存
 */
function setMemoryCache(templates: Template[]): void {
  memoryCache = {
    data: templates,
    timestamp: Date.now(),
  };
}

/**
 * 获取本地缓存
 */
function getLocalCache(): Template[] | null {
  try {
    if (typeof window === 'undefined') return null;
    
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 设置本地缓存
 */
function setLocalCache(templates: Template[]): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: templates,
      timestamp: Date.now(),
    }));
  } catch {
    // 忽略缓存写入错误
  }
}

/**
 * 清除缓存
 */
export function clearTemplateCache(): void {
  memoryCache = null;
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
  } catch {
    // 忽略错误
  }
}

/**
 * 筛选模板
 */
function filterTemplates(templates: Template[], filter: TemplateFilter): Template[] {
  let result = [...templates];
  
  // 按分类筛选
  if (filter.category) {
    result = result.filter(t => t.category === filter.category);
  }
  
  // 按难度筛选
  if (filter.difficulty) {
    result = result.filter(t => t.difficulty === filter.difficulty);
  }
  
  // 按价格筛选
  if (filter.price) {
    result = result.filter(t => t.price === filter.price);
  }
  
  // 按是否推荐筛选
  if (filter.featured) {
    result = result.filter(t => t.featured);
  }
  
  // 按标签筛选
  if (filter.tags && filter.tags.length > 0) {
    result = result.filter(t => 
      filter.tags!.some(tag => t.tags.includes(tag))
    );
  }
  
  // 按搜索词筛选
  if (filter.search) {
    const search = filter.search.toLowerCase();
    result = result.filter(t => 
      t.name.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search) ||
      t.tags.some(tag => tag.toLowerCase().includes(search))
    );
  }
  
  return result;
}

/**
 * 模板加载器类
 */
export class TemplateLoader {
  private status: TemplateLoadStatus = 'idle';
  private error: Error | null = null;
  
  /**
   * 获取加载状态
   */
  getStatus(): TemplateLoadStatus {
    return this.status;
  }
  
  /**
   * 获取错误信息
   */
  getError(): Error | null {
    return this.error;
  }
  
  /**
   * 加载所有模板
   */
  async loadAll(): Promise<Template[]> {
    this.status = 'loading';
    
    try {
      // 1. 尝试内存缓存
      let templates = getMemoryCache();
      
      // 2. 尝试本地存储缓存
      if (!templates) {
        templates = getLocalCache();
      }
      
      // 3. 从数据源加载
      if (!templates) {
        templates = await loadFromLocalData();
        
        // 更新缓存
        setMemoryCache(templates);
        setLocalCache(templates);
      }
      
      this.status = 'success';
      this.error = null;
      
      return templates;
    } catch (err) {
      this.status = 'error';
      this.error = err instanceof Error ? err : new Error('Failed to load templates');
      throw this.error;
    }
  }
  
  /**
   * 按筛选条件加载模板
   */
  async loadWithFilter(filter: TemplateFilter): Promise<TemplateListResponse> {
    const templates = await this.loadAll();
    const filtered = filterTemplates(templates, filter);
    
    return {
      templates: filtered,
      total: filtered.length,
      page: 1,
      pageSize: filtered.length,
      hasMore: false,
    };
  }
  
  /**
   * 根据 ID 获取模板
   */
  async getById(id: string): Promise<Template | null> {
    const templates = await this.loadAll();
    return templates.find(t => t.id === id) || null;
  }
  
  /**
   * 获取推荐模板
   */
  async getFeatured(): Promise<Template[]> {
    const templates = await this.loadAll();
    return templates.filter(t => t.featured);
  }
  
  /**
   * 获取分类模板
   */
  async getByCategory(category: string): Promise<Template[]> {
    const templates = await this.loadAll();
    return templates.filter(t => t.category === category);
  }
  
  /**
   * 搜索模板
   */
  async search(query: string): Promise<Template[]> {
    return this.loadWithFilter({ search: query }).then(r => r.templates);
  }
}

// 导出单例
export const templateLoader = new TemplateLoader();

// 导出便捷函数
export const loadTemplates = () => templateLoader.loadAll();
export const loadTemplatesWithFilter = (filter: TemplateFilter) => templateLoader.loadWithFilter(filter);
export const getTemplateById = (id: string) => templateLoader.getById(id);
export const getFeaturedTemplates = () => templateLoader.getFeatured();
export const searchTemplates = (query: string) => templateLoader.search(query);
export const clearCache = clearTemplateCache;
