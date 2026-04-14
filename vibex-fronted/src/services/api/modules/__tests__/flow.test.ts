/**
 * Flow API Tests
 */

import { flowApi } from '../flow';

// Mock httpClient
vi.mock('../../client', () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

import { httpClient } from '../../client';
const mockHttpClient = httpClient as any;

describe('FlowApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateFlow', () => {
    const mockResponse = {
      id: 'flow1',
      name: 'User Flow',
      steps: [
        { id: 'step1', name: 'Start', type: 'start' },
      ],
    };

    it('should call httpClient.post with description', async () => {
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await flowApi.generateFlow('create user registration flow');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/flows/generate',
        { description: 'create user registration flow' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getFlow', () => {
    it('should call httpClient.get with flowId', async () => {
      const mockFlow = { id: 'flow1', name: 'Test Flow' };
      mockHttpClient.get.mockResolvedValue(mockFlow);

      const result = await flowApi.getFlow('flow1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/flows/flow1');
      expect(result).toEqual(mockFlow);
    });
  });

  describe('updateFlow', () => {
    it('should call httpClient.put with flow updates', async () => {
      const updates = { name: 'Updated Flow' };
      const mockResponse = { id: 'flow1', ...updates };
      mockHttpClient.put.mockResolvedValue(mockResponse);

      const result = await flowApi.updateFlow('flow1', updates);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/flows/flow1', updates);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteFlow', () => {
    it('should call httpClient.delete with flowId', async () => {
      mockHttpClient.delete.mockResolvedValue({ success: true });

      const result = await flowApi.deleteFlow('flow1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/flows/flow1');
      expect(result).toEqual({ success: true });
    });
  });
});
