/**
 * HTTP Client Tests
 */

import axios from 'axios';
import { createHttpClient, transformError } from '@/services/api/client';

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  };
  
  return {
    __esModule: true,
    create: vi.fn(() => mockAxiosInstance),
    isAxiosError: vi.fn(),
    default: {
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn(),
    },
    __mockInstance: mockAxiosInstance,
  };
});

// Get the mock instance
const mockInstance = (axios as any).__mockInstance;

describe('HTTP Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  describe('createHttpClient', () => {
    it('should create HTTP client with default config', () => {
      const client = createHttpClient();
      
      expect(client).toBeDefined();
      expect(client.instance).toBeDefined();
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
    });

    it('should create HTTP client with custom config', () => {
      // Create a fresh client by resetting the module
      vi.resetModules();
      const { createHttpClient } = require('@/services/api/client');
      
      const client = createHttpClient({ baseURL: 'https://api.test.com' });
      
      expect(client).toBeDefined();
      expect(client.instance).toBeDefined();
    });

    it('should reuse existing client instance', () => {
      const client1 = createHttpClient();
      const client2 = createHttpClient();
      
      expect(client1).toBe(client2);
    });
  });

  describe('HTTP methods', () => {
    let client: ReturnType<typeof createHttpClient>;

    beforeEach(() => {
      client = createHttpClient();
    });

    it('should make GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockInstance.get.mockResolvedValue({ data: mockData });

      const result = await client.get('/test');

      expect(mockInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual(mockData);
    });

    it('should make GET request with config', async () => {
      const mockData = [{ id: 1 }];
      mockInstance.get.mockResolvedValue({ data: mockData });

      const result = await client.get('/test', { params: { page: 1 } });

      expect(mockInstance.get).toHaveBeenCalledWith('/test', { params: { page: 1 } });
      expect(result).toEqual(mockData);
    });

    it('should make POST request', async () => {
      const mockData = { id: 1, name: 'Created' };
      mockInstance.post.mockResolvedValue({ data: mockData });

      const result = await client.post('/test', { name: 'Test' });

      expect(mockInstance.post).toHaveBeenCalledWith('/test', { name: 'Test' }, undefined);
      expect(result).toEqual(mockData);
    });

    it('should make PUT request', async () => {
      const mockData = { id: 1, name: 'Updated' };
      mockInstance.put.mockResolvedValue({ data: mockData });

      const result = await client.put('/test/1', { name: 'Updated' });

      expect(mockInstance.put).toHaveBeenCalledWith('/test/1', { name: 'Updated' }, undefined);
      expect(result).toEqual(mockData);
    });

    it('should make PATCH request', async () => {
      const mockData = { id: 1, name: 'Patched' };
      mockInstance.patch.mockResolvedValue({ data: mockData });

      const result = await client.patch('/test/1', { name: 'Patched' });

      expect(mockInstance.patch).toHaveBeenCalledWith('/test/1', { name: 'Patched' }, undefined);
      expect(result).toEqual(mockData);
    });

    it('should make DELETE request', async () => {
      mockInstance.delete.mockResolvedValue({ data: { success: true } });

      const result = await client.delete('/test/1');

      expect(mockInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toEqual({ success: true });
    });
  });

  describe('transformError', () => {
    it('should transform 400 error', () => {
      (axios.isAxiosError as any).mockReturnValue(true);
      const error = {
        response: {
          status: 400,
          data: { error: 'Invalid request' },
        },
      };

      const result = transformError(error as any);

      expect(result.message).toBe('Invalid request');
    });

    it('should transform 401 error', () => {
      (axios.isAxiosError as any).mockReturnValue(true);
      const error = {
        response: { status: 401 },
      };

      const result = transformError(error as any);

      expect(result.message).toBe('登录已过期，请重新登录');
    });

    it('should transform 403 error', () => {
      (axios.isAxiosError as any).mockReturnValue(true);
      const error = {
        response: { status: 403 },
      };

      const result = transformError(error as any);

      expect(result.message).toBe('没有权限执行此操作');
    });

    it('should transform 404 error', () => {
      (axios.isAxiosError as any).mockReturnValue(true);
      const error = {
        response: { status: 404 },
      };

      const result = transformError(error as any);

      expect(result.message).toBe('请求的资源不存在');
    });

    it('should transform 409 error (email already exists)', () => {
      (axios.isAxiosError as any).mockReturnValue(true);
      const error = {
        response: { status: 409, data: { error: '该邮箱已被注册' } },
      };

      const result = transformError(error as any);

      expect(result.message).toBe('该邮箱已被注册');
    });

    it('should transform default error with message', () => {
      (axios.isAxiosError as any).mockReturnValue(true);
      const error = {
        response: { status: 418, data: { error: 'Custom error' } },
      };

      const result = transformError(error as any);

      expect(result.message).toBe('Custom error');
    });

    it('should transform default error without message', () => {
      (axios.isAxiosError as any).mockReturnValue(true);
      const error = {
        response: { status: 418 },
      };

      const result = transformError(error as any);

      expect(result.message).toBe('网络错误，请检查网络连接');
    });

    it('should transform network error', () => {
      (axios.isAxiosError as any).mockReturnValue(true);
      const error = {
        request: {},
        message: 'Network Error',
      };

      const result = transformError(error as any);

      expect(result.message).toBe('网络错误，请检查网络连接');
    });

    it('should transform unknown error', () => {
      // When it's not an axios error, return the original error
      (axios.isAxiosError as any).mockReturnValue(false);
      const error = new Error('Unknown error');

      const result = transformError(error);

      // Non-axios errors are returned as-is
      expect(result).toBe(error);
    });
  });
});