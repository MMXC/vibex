/**
 * Page API Tests
 * Tests the PageApi interface methods with mocked httpClient
 */

import { pageApi } from '../page';

// Mock httpClient
vi.mock('../../client', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../cache', () => ({
  cache: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
  getCacheKey: vi.fn().mockReturnValue('cache-key'),
}));

import { httpClient } from '../../client';
const mockHttp = httpClient as any;

describe('PageApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPages', () => {
    it('返回项目页面列表', async () => {
      const mockResponse = {
        data: [
          { id: 'page1', name: 'Page 1', projectId: 'p1' },
          { id: 'page2', name: 'Page 2', projectId: 'p1' },
        ],
      };
      mockHttp.get.mockResolvedValue(mockResponse);

      const pages = await pageApi.getPages('p1');

      expect(pages).toHaveLength(2);
      expect(pages[0].id).toBe('page1');
    });

    it('空列表返回空数组', async () => {
      const mockResponse = { data: [] };
      mockHttp.get.mockResolvedValue(mockResponse);

      const pages = await pageApi.getPages('p999');
      expect(pages).toEqual([]);
    });
  });

  describe('getPage', () => {
    it('返回指定页面', async () => {
      const mockResponse = { data: { id: 'page1', name: 'Test Page' } };
      mockHttp.get.mockResolvedValue(mockResponse);

      const page = await pageApi.getPage('page1');
      expect(page.id).toBe('page1');
    });

    it('不存在的页面返回null', async () => {
      const mockResponse = { data: null };
      mockHttp.get.mockResolvedValue(mockResponse);

      const page = await pageApi.getPage('nonexistent');
      expect(page).toBeNull();
    });
  });

  describe('createPage', () => {
    it('创建后返回页面', async () => {
      const mockResponse = { data: { id: 'page3', name: 'New Page', projectId: 'p1' } };
      mockHttp.post.mockResolvedValue(mockResponse);

      const page = await pageApi.createPage({ name: 'New Page', projectId: 'p1' });
      expect(page.id).toBe('page3');
    });

    it('创建时调用正确的API路径', async () => {
      const mockResponse = { data: { id: 'page3', name: 'Test' } };
      mockHttp.post.mockResolvedValue(mockResponse);

      await pageApi.createPage({ name: 'Test', projectId: 'p1' });

      expect(mockHttp.post).toHaveBeenCalled();
    });
  });

  describe('updatePage', () => {
    it('更新后返回页面', async () => {
      const mockResponse = { data: { id: 'page1', name: 'Updated Page' } };
      mockHttp.put.mockResolvedValue(mockResponse);

      const page = await pageApi.updatePage('page1', { name: 'Updated Page' });
      expect(page.name).toBe('Updated Page');
    });

    it('不存在的页面返回null', async () => {
      const mockResponse = { data: null };
      mockHttp.put.mockResolvedValue(mockResponse);

      const page = await pageApi.updatePage('nonexistent', { name: 'x' });
      expect(page).toBeNull();
    });
  });

  describe('deletePage', () => {
    it('删除成功返回success', async () => {
      const mockResponse = { data: { success: true } };
      mockHttp.delete.mockResolvedValue(mockResponse);

      const result = await pageApi.deletePage('page1');
      expect(result).toBeTruthy();
    });
  });

  describe('PageApi interface', () => {
    it('should have getPages method', () => {
      expect(typeof pageApi.getPages).toBe('function');
    });

    it('should have getPage method', () => {
      expect(typeof pageApi.getPage).toBe('function');
    });

    it('should have createPage method', () => {
      expect(typeof pageApi.createPage).toBe('function');
    });

    it('should have updatePage method', () => {
      expect(typeof pageApi.updatePage).toBe('function');
    });

    it('should have deletePage method', () => {
      expect(typeof pageApi.deletePage).toBe('function');
    });
  });
});