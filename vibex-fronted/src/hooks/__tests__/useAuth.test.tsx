/**
 * useAuth Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import {
  AuthProvider,
  useAuth,
  useIsAuthenticated,
  useCurrentUser,
  User,
} from '../useAuth';

// Mock apiService
const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockLogout = jest.fn();
const mockGetCurrentUser = jest.fn();

jest.mock('@/services/api', () => ({
  apiService: {
    login: (...args: any[]) => mockLogin(...args),
    register: (...args: any[]) => mockRegister(...args),
    logout: (...args: any[]) => mockLogout(...args),
    getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useAuth', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockReturnValue();
    localStorageMock.removeItem.mockReturnValue();
  });

  describe('login', () => {
    it('should call login API', async () => {
      mockLogin.mockResolvedValue({ token: 'test-token', user: mockUser });
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should store token on successful login', async () => {
      mockLogin.mockResolvedValue({ token: 'test-token', user: mockUser });
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth_token',
        'test-token'
      );
    });
  });

  describe('register', () => {
    it('should call register API', async () => {
      mockRegister.mockResolvedValue({ token: 'test-token', user: mockUser });
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.register(
          'Test User',
          'test@example.com',
          'password'
        );
      });

      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
      });
    });
  });

  describe('logout', () => {
    it('should call logout API', async () => {
      mockLogout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
    });

    it('should clear localStorage on logout', async () => {
      mockLogout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('refreshUser', () => {
    it('should call getCurrentUser when refreshing', async () => {
      mockLogin.mockResolvedValue({ token: 'test-token', user: mockUser });
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetCurrentUser.mockResolvedValueOnce({
        ...mockUser,
        name: 'Updated',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(mockGetCurrentUser).toHaveBeenCalled();
    });

    it('should not call API when no token', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(mockGetCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('exports', () => {
    it('should export useIsAuthenticated', () => {
      expect(typeof useIsAuthenticated).toBe('function');
    });

    it('should export useCurrentUser', () => {
      expect(typeof useCurrentUser).toBe('function');
    });
  });
});
