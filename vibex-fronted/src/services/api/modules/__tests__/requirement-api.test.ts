/**
 * Requirement API Tests
 */

import { requirementApi } from '../requirement';

// Mock httpClient
jest.mock('../../client', () => ({
  httpClient: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
  },
}));

import { httpClient } from '../../client';
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('RequirementApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRequirements', () => {
    it('should call httpClient.get with userId', async () => {
      const mockRequirements = [{ id: 'req1' }, { id: 'req2' }];
      mockHttpClient.get.mockResolvedValue(mockRequirements);

      const result = await requirementApi.getRequirements('user1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/requirements', {"params": {"userId": "user1"}});
      expect(result).toEqual(mockRequirements);
    });
  });

  describe('getRequirement', () => {
    it('should call httpClient.get with requirementId', async () => {
      const mockRequirement = { id: 'req1', title: 'Test' };
      mockHttpClient.get.mockResolvedValue(mockRequirement);

      const result = await requirementApi.getRequirement('req1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/requirements/req1');
      expect(result).toEqual(mockRequirement);
    });
  });

  describe('createRequirement', () => {
    it('should call httpClient.post with requirement data', async () => {
      const newRequirement = { title: 'New Requirement', description: 'Test' };
      const mockResponse = { id: 'req1', ...newRequirement };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await requirementApi.createRequirement(newRequirement);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/requirements', newRequirement);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateRequirement', () => {
    it('should call httpClient.put with updates', async () => {
      const updates = { title: 'Updated Title' };
      const mockResponse = { id: 'req1', ...updates };
      mockHttpClient.put.mockResolvedValue(mockResponse);

      const result = await requirementApi.updateRequirement('req1', updates, 'user1');

      expect(mockHttpClient.put).toHaveBeenCalledWith('/requirements/req1', updates);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteRequirement', () => {
    it('should call httpClient.delete with requirementId and userId', async () => {
      mockHttpClient.delete.mockResolvedValue({ success: true });

      const result = await requirementApi.deleteRequirement('req1', 'user1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/requirements/req1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('analyzeRequirement', () => {
    it('should call httpClient.post to analyze requirement', async () => {
      const mockResponse = { id: 'req1', analysis: { entities: [] } };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await requirementApi.analyzeRequirement('req1');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/requirements/req1/analyze');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('reanalyzeRequirement', () => {
    it('should call httpClient.post with context', async () => {
      const mockResponse = { id: 'req1', analysis: { entities: [] } };
      const context = { force: true };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await requirementApi.reanalyzeRequirement('req1', context);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/requirements/req1/reanalyze', context);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAnalysisResult', () => {
    it('should call httpClient.get for analysis result', async () => {
      const mockResult = { entities: [], relationships: [] };
      mockHttpClient.get.mockResolvedValue(mockResult);

      const result = await requirementApi.getAnalysisResult('req1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/requirements/req1/analysis');
      expect(result).toEqual(mockResult);
    });
  });
});
