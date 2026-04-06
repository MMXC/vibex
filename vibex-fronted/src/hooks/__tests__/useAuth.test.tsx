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
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockGetCurrentUser = vi.fn();

vi.mock('@/services/api', () => ({
  apiService: {
    login: (...args: any[]) => mockLogin(...args),
    register: (...args: any[]) => mockRegister(...args),
    logout: (...args: any[]) => mockLogout(...args),
    getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
  },
}));

// Mock localStorage and sessionStorage
// Note: useAuth now uses sessionStorage (secure) as primary storage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('useAuth', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Both localStorage and sessionStorage must return null initially
    // to prevent initAuth from calling getCurrentUser unexpectedly
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockReturnValue();
    localStorageMock.removeItem.mockReturnValue();
    localStorageMock.clear.mockReturnValue();
    sessionStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.setItem.mockReturnValue();
    sessionStorageMock.removeItem.mockReturnValue();
    sessionStorageMock.clear.mockReturnValue();
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

    it('should store token in sessionStorage on successful login', async () => {
      mockLogin.mockResolvedValue({ token: 'test-token', user: mockUser });
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      // useAuth uses sessionStorage as primary secure storage
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
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

    it('should clear sessionStorage on logout', async () => {
      mockLogout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.logout();
      });

      // useAuth clears sessionStorage (primary) and localStorage (legacy compat)
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
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
