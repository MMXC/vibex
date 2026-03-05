import { Page, PageCreate, PageUpdate } from '../types/page';
import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';

// ==================== 接口定义 ====================

export interface PageApi {
  getPages(projectId?: string): Promise<Page[]>;
  getPage(pageId: string): Promise<Page>;
  createPage(page: PageCreate): Promise<Page>;
  updatePage(pageId: string, data: PageUpdate): Promise<Page>;
  deletePage(pageId: string): Promise<SuccessResponse>;
}

// ==================== 实现 ====================

class PageApiImpl implements PageApi {
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  async getPages(projectId?: string): Promise<Page[]> {
    const cacheKey = getCacheKey('pages', projectId || 'all');
    const cached = cache.get<Page[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<{ pages: Page[] }>('/pages', { params: { projectId } });
    });
    const pages: Page[] = (result as any).pages || result;
    cache.set(cacheKey, pages);
    return pages;
  }

  async getPage(pageId: string): Promise<Page> {
    const cacheKey = getCacheKey('page', pageId);
    const cached = cache.get<Page>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<{ page: Page }>(`/pages/${pageId}`);
    });
    const page: Page = (result as any).page || result;
    cache.set(cacheKey, page);
    return page;
  }

  async createPage(page: PageCreate): Promise<Page> {
    const result = await retry.execute(async () => {
      return await httpClient.post<{ page: Page }>('/pages', page);
    });
    const created: Page = (result as any).page || result;
    if (page.projectId) {
      cache.remove(getCacheKey('pages', page.projectId));
    }
    return created;
  }

  async updatePage(pageId: string, data: PageUpdate): Promise<Page> {
    const result = await retry.execute(async () => {
      return await httpClient.put<{ page: Page }>(`/pages/${pageId}`, data);
    });
    const page: Page = (result as any).page || result;
    cache.remove(getCacheKey('page', pageId));
    return page;
  }

  async deletePage(pageId: string): Promise<SuccessResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.delete<SuccessResponse>(`/pages/${pageId}`);
    });
    return result;
  }
}

// ==================== 工厂函数 ====================

export function createPageApi(): PageApi {
  return new PageApiImpl();
}

// ==================== 单例导出 ====================

export const pageApi = createPageApi();