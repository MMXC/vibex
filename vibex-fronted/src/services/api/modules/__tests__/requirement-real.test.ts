/**
 * Requirement API Tests - Real Implementation Tests
 * Tests the actual API implementation by mocking the httpClient
 */

import { requirementApi } from '@/services/api/modules/requirement';
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

const mockHttpClient = httpClient as any;
const mockCache = cache as any;

describe('RequirementApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  describe('getRequirements', () => {
    it('should fetch requirements from API', async () => {
      const mockRequirements = [
        { id: 'req-1', userId: 'user-1', content: 'Test', status: 'completed' },
      ];
      mockHttpClient.get.mockResolvedValue({ requirements: mockRequirements });
      mockCache.get.mockReturnValue(undefined);

      const result = await requirementApi.getRequirements('user-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/requirements', {
        params: { userId: 'user-1' },
      });
      expect(result).toEqual(mockRequirements);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return cached data when offline', async () => {
      const cachedRequirements = [
        { id: 'req-1', userId: 'user-1', content: 'Cached', status: 'completed' },
      ];
      
      Object.defineProperty(global.navigator, 'onLine', { value: false });
      mockCache.get.mockReturnValue(cachedRequirements);

      const result = await requirementApi.getRequirements('user-1');

      expect(result).toEqual(cachedRequirements);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getRequirement', () => {
    it('should fetch single requirement from API', async () => {
      const mockRequirement = { id: 'req-1', userId: 'user-1', content: 'Test', status: 'completed' };
      mockHttpClient.get.mockResolvedValue({ requirement: mockRequirement });
      mockCache.get.mockReturnValue(undefined);

      const result = await requirementApi.getRequirement('req-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/requirements/req-1');
      expect(result).toEqual(mockRequirement);
    });
  });

  describe('createRequirement', () => {
    it('should create requirement via API', async () => {
      const newRequirement = { userId: 'user-1', content: 'New requirement' };
      const createdRequirement = { id: 'req-1', ...newRequirement, status: 'draft' };
      mockHttpClient.post.mockResolvedValue({ requirement: createdRequirement });

      const result = await requirementApi.createRequirement(newRequirement);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/requirements', newRequirement);
      expect(result).toEqual(createdRequirement);
      expect(mockCache.remove).toHaveBeenCalled();
    });
  });

  describe('updateRequirement', () => {
    it('should update requirement via API', async () => {
      const updates = { content: 'Updated' };
      const updatedRequirement = { id: 'req-1', userId: 'user-1', content: 'Updated', status: 'completed' };
      mockHttpClient.put.mockResolvedValue({ requirement: updatedRequirement });

      const result = await requirementApi.updateRequirement('req-1', updates);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/requirements/req-1', updates);
      expect(result).toEqual(updatedRequirement);
    });
  });

  describe('deleteRequirement', () => {
    it('should delete requirement via API', async () => {
      mockHttpClient.delete.mockResolvedValue({ success: true });

      const result = await requirementApi.deleteRequirement('req-1', 'user-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/requirements/req-1');
      expect(result).toEqual({ success: true });
      expect(mockCache.remove).toHaveBeenCalled();
    });
  });

  describe('analyzeRequirement', () => {
    it('should trigger analysis via API', async () => {
      const analyzingRequirement = { id: 'req-1', userId: 'user-1', status: 'analyzing' };
      mockHttpClient.post.mockResolvedValue({ requirement: analyzingRequirement });

      const result = await requirementApi.analyzeRequirement('req-1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/requirements/req-1/analyze');
      expect(result).toEqual(analyzingRequirement);
    });
  });

  describe('reanalyzeRequirement', () => {
    it('should trigger reanalysis via API', async () => {
      const requirement = { id: 'req-1', userId: 'user-1', status: 'analyzing' };
      mockHttpClient.post.mockResolvedValue({ requirement });

      const result = await requirementApi.reanalyzeRequirement('req-1', { context: 'test' });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/requirements/req-1/reanalyze',
        { context: 'test' }
      );
      expect(result).toEqual(requirement);
    });
  });

  describe('getAnalysisResult', () => {
    it('should fetch analysis result from API', async () => {
      const analysisResult = { summary: 'Test analysis', entities: [] };
      mockHttpClient.get.mockResolvedValue({ analysisResult });
      mockCache.get.mockReturnValue(undefined);

      const result = await requirementApi.getAnalysisResult('req-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/requirements/req-1/analysis');
      expect(result).toEqual(analysisResult);
    });

    it('should return cached analysis result when available', async () => {
      const cachedResult = { summary: 'Cached', entities: [] };
      mockCache.get.mockReturnValue(cachedResult);
      Object.defineProperty(global.navigator, 'onLine', { value: false });

      const result = await requirementApi.getAnalysisResult('req-1');

      expect(result).toEqual(cachedResult);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });
});