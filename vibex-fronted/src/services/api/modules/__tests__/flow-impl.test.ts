/**
 * Flow API Tests - Real Implementation Tests
 * Tests the actual API implementation by mocking the httpClient
 */

import { flowApi } from '@/services/api/modules/flow';
import { httpClient } from '@/services/api/client';
import { cache } from '@/services/api/cache';

// Mock dependencies
vi.mock('@/services/api/client', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/services/api/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
  getCacheKey: vi.fn((...args) => args.join(':')),
}));

const mockHttpClient = httpClient as any<typeof httpClient>;
const mockCache = cache as any<typeof cache>;

describe('FlowApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  describe('getFlow', () => {
    it('should fetch flow from API', async () => {
      const mockFlow = {
        id: 'flow-1',
        name: 'Test Flow',
        nodes: [],
        edges: [],
      };
      mockHttpClient.get.mockResolvedValue(mockFlow);
      mockCache.get.mockReturnValue(undefined);

      const result = await flowApi.getFlow('flow-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/flows/flow-1');
      expect(result).toEqual(mockFlow);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return cached flow when offline', async () => {
      const cachedFlow = { id: 'flow-1', name: 'Cached', nodes: [], edges: [] };
      
      Object.defineProperty(global.navigator, 'onLine', { value: false });
      mockCache.get.mockReturnValue(cachedFlow);

      const result = await flowApi.getFlow('flow-1');

      expect(result).toEqual(cachedFlow);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('updateFlow', () => {
    it('should update flow via API', async () => {
      const updates = { name: 'Updated Flow' };
      const updatedFlow = { id: 'flow-1', name: 'Updated Flow', nodes: [], edges: [] };
      mockHttpClient.put.mockResolvedValue(updatedFlow);

      const result = await flowApi.updateFlow('flow-1', updates);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/flows/flow-1', updates);
      expect(result).toEqual(updatedFlow);
      expect(mockCache.remove).toHaveBeenCalled();
    });
  });

  describe('generateFlow', () => {
    it('should generate flow via API', async () => {
      const generatedFlow = { id: 'flow-1', name: 'Generated', nodes: [], edges: [] };
      mockHttpClient.post.mockResolvedValue(generatedFlow);

      const result = await flowApi.generateFlow('Create a login flow');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/flows/generate', {
        description: 'Create a login flow',
      });
      expect(result).toEqual(generatedFlow);
    });
  });

  describe('deleteFlow', () => {
    it('should delete flow via API', async () => {
      mockHttpClient.delete.mockResolvedValue({ success: true });

      const result = await flowApi.deleteFlow('flow-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/flows/flow-1');
      expect(result).toEqual({ success: true });
    });
  });
});