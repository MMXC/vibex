/**
 * Auth Mock Factory — centralized auth mocking utilities
 *
 * Usage:
 *   import { createAuthStoreMock, createAuthApiMock } from '@/../tests/unit/__mocks__/auth';
 *
 *   vi.mock('@/stores/authStore', () => createAuthStoreMock({
 *     isAuthenticated: true,
 *     user: { id: 'test', email: 'test@test.com', name: 'Test User' },
 *   }));
 */

import { vi } from 'vitest';

// =============================================================================
// Auth Store Mock Factory
// =============================================================================

export interface AuthStoreMockOptions {
  isAuthenticated?: boolean;
  user?: { id: string; email: string; name?: string; role?: string; avatar?: string } | null;
  token?: string | null;
  isLoading?: boolean;
}

export function createAuthStoreMock(options: AuthStoreMockOptions = {}) {
  const {
    isAuthenticated = false,
    user = null,
    token = null,
    isLoading = false,
  } = options;

  return {
    useAuthStore: (
      selector?: (state: {
        isAuthenticated: boolean;
        user: { id: string; email: string; name?: string; role?: string; avatar?: string } | null;
        token: string | null;
        isLoading: boolean;
      }) => unknown
    ) => {
      const state = { isAuthenticated, user, token, isLoading };
      return selector ? selector(state) : state;
    },
    // For tests that use getState()
    getState: () => ({ user, token, isAuthenticated, isLoading }),
  };
}

// Pre-built presets
export const authStoreMock = {
  authenticated: () =>
    createAuthStoreMock({
      isAuthenticated: true,
      user: { id: 'test-user-id', email: 'test@test.com', name: 'Test User' },
      token: 'mock-token',
      isLoading: false,
    }),
  unauthenticated: () =>
    createAuthStoreMock({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    }),
  loading: () =>
    createAuthStoreMock({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: true,
    }),
};

// =============================================================================
// Auth API Mock Factory
// =============================================================================

export interface AuthApiMockOptions {
  loginResponse?: unknown;
  registerResponse?: unknown;
  getCurrentUserResponse?: unknown;
  logoutResponse?: unknown;
}

export function createAuthApiMock(options: AuthApiMockOptions = {}) {
  const {
    loginResponse = { token: 'test-token', user: { id: '1', email: 'test@test.com' } },
    registerResponse = { id: '1' },
    getCurrentUserResponse = { id: '1', email: 'test@test.com', name: 'Test User' },
    logoutResponse = { success: true },
  } = options;

  const loginFn = vi.fn().mockResolvedValue(loginResponse);
  const registerFn = vi.fn().mockResolvedValue(registerResponse);
  const getCurrentUserFn = vi.fn().mockResolvedValue(getCurrentUserResponse);
  const logoutFn = vi.fn().mockResolvedValue(logoutResponse);

  return {
    authApi: {
      login: loginFn,
      register: registerFn,
      getCurrentUser: getCurrentUserFn,
      logout: logoutFn,
    },
    // Convenience: expose the fns directly for test assertions
    _fns: { loginFn, registerFn, getCurrentUserFn, logoutFn },
  };
}

// =============================================================================
// Session Storage Mock Helper (for E2E/Integration tests)
// =============================================================================

/**
 * Set auth token in sessionStorage (mirrors real app behavior)
 */
export function setSessionAuthToken(token: string, userId = 'test-user-id') {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('auth_token', token);
    sessionStorage.setItem('user_id', userId);
  }
}

// =============================================================================
// Tests for auth mock factory (E0.2)
// =============================================================================
// These are validated via integration — see:
//   src/components/homepage/Navbar/__tests__/Navbar.test.tsx
//   src/components/homepage/Header/Header.test.tsx
//   src/app/auth/page.test.tsx
//
// Usage pattern (Vitest):
//   import { createAuthStoreMock, createAuthApiMock } from '@/../tests/unit/__mocks__/auth';
//   vi.mock('@/stores/authStore', () => createAuthStoreMock({ isAuthenticated: true }));
//   vi.mock('@/services/api/modules/auth', () => createAuthApiMock().authApi);

/**
 * Clear auth from sessionStorage
 */
export function clearSessionAuth() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('user_role');
  }
}
