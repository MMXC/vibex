/**
 * Auth API Tests
 * Tests the AuthApi interface methods with mocked httpClient
 */

import { authApi, AuthApi } from '../auth';

// Mock httpClient
vi.mock('../../client', () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { httpClient } from '../../client';
const mockHttp = httpClient as any;

describe('AuthApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('正常登录返回用户信息和token', async () => {
      const mockResponse = {
        data: {
          token: 'jwt-token-abc',
          user: { id: 'u1', name: 'Test User', email: 'test@example.com' },
        },
      };
      mockHttp.post.mockResolvedValue(mockResponse);

      const result = await authApi.login({ email: 'test@example.com', password: 'password123' });

      expect(result.token).toBe('jwt-token-abc');
      expect(result.user.id).toBe('u1');
      expect(mockHttp.post).toHaveBeenCalledWith('/auth/login', { email: 'test@example.com', password: 'password123' });
    });

    it('网络错误触发重试后失败', async () => {
      mockHttp.post.mockRejectedValue(new Error('Network error'));

      await expect(
        authApi.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Network error');
    });

    it('用户不存在返回错误响应', async () => {
      const errorResponse = { data: { error: 'USER_NOT_FOUND', message: 'User not found' } };
      mockHttp.post.mockResolvedValue(errorResponse);

      // unwrapData returns null for error responses, so login should fail
      const result = await authApi.login({ email: 'notexist@example.com', password: 'pass' });
      // authApi.login stores token in sessionStorage only when data.token exists
      // null token means auth failed - but method doesn't throw, it returns null
      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('注册成功返回用户信息和token', async () => {
      const mockResponse = {
        data: {
          token: 'jwt-token-new',
          user: { id: 'u2', name: 'New User', email: 'new@example.com' },
        },
      };
      mockHttp.post.mockResolvedValue(mockResponse);

      const result = await authApi.register({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(result.token).toBe('jwt-token-new');
      expect(result.user.email).toBe('new@example.com');
    });
  });

  describe('getCurrentUser', () => {
    it('返回当前用户信息', async () => {
      const mockResponse = {
        data: { id: 'u1', name: 'Test User', email: 'test@example.com' },
      };
      mockHttp.get.mockResolvedValue(mockResponse);

      const user = await authApi.getCurrentUser();

      expect(user.id).toBe('u1');
      expect(mockHttp.get).toHaveBeenCalledWith('/auth/me');
    });

    it('未登录时返回null', async () => {
      const errorResponse = { data: null };
      mockHttp.get.mockResolvedValue(errorResponse);

      const user = await authApi.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('logout', () => {
    it('调用logout API并返回success', async () => {
      const mockResponse = { data: { success: true } };
      mockHttp.post.mockResolvedValue(mockResponse);

      const result = await authApi.logout();

      expect(result).toEqual({ success: true });
      expect(mockHttp.post).toHaveBeenCalledWith('/auth/logout', undefined);
    });
  });

  describe('AuthApi interface', () => {
    it('should have login method', () => {
      expect(typeof authApi.login).toBe('function');
    });

    it('should have register method', () => {
      expect(typeof authApi.register).toBe('function');
    });

    it('should have getCurrentUser method', () => {
      expect(typeof authApi.getCurrentUser).toBe('function');
    });

    it('should have logout method', () => {
      expect(typeof authApi.logout).toBe('function');
    });
  });
});