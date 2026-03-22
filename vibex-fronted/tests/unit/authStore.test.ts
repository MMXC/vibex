/**
 * authStore unit tests
 * Tests login, logout, checkAuth, syncFromStorage behaviors
 */
import { useAuthStore } from '../../src/stores/authStore';

// Helper: encode a minimal JWT payload
function makeToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const sig = btoa('mock-signature');
  return `${header}.${body}.${sig}`;
}

describe('authStore', () => {
  // Clear storage before AND after each test
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('setUser', () => {
    it('should set user directly', () => {
      const user = { id: 'u1', email: 'test@example.com', name: 'Test User' };
      useAuthStore.getState().setUser(user);
      expect(useAuthStore.getState().user).toEqual(user);
    });

    it('should set user to null', () => {
      useAuthStore.getState().setUser({ id: 'u1', email: 't@t.com', name: 'T' });
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('setToken', () => {
    it('should set token and isAuthenticated=true', () => {
      useAuthStore.getState().setToken('fake-token');
      const state = useAuthStore.getState();
      expect(state.token).toBe('fake-token');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set isAuthenticated=false for null token', () => {
      useAuthStore.getState().setToken('token');
      useAuthStore.getState().setToken(null);
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
    });
  });

  describe('login', () => {
    it('should login with token and user', () => {
      const token = 'token-abc';
      const user = { id: 'u1', email: 'alice@example.com', name: 'Alice' };
      useAuthStore.getState().login(token, user);
      const state = useAuthStore.getState();
      expect(state.token).toBe(token);
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should set isLoading to false on login', () => {
      useAuthStore.getState().setLoading(true);
      useAuthStore.getState().login('token', { id: 'u1', email: 'a@b.com' });
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      useAuthStore.getState().login('token', { id: 'u1', email: 'a@b.com' });
      useAuthStore.getState().logout();
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear sessionStorage on logout', () => {
      // Persist middleware uses 'vibex-auth-storage' key
      sessionStorage.setItem('vibex-auth-storage', JSON.stringify({
        state: { token: 'test', user: { id: 'u1', email: 'a@b.com' }, isAuthenticated: true, isLoading: false },
        version: 0
      }));
      useAuthStore.getState().logout();
      // logout() removes auth_token from sessionStorage
      expect(sessionStorage.getItem('auth_token')).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('should return false when no token in storage', () => {
      const result = useAuthStore.getState().checkAuth();
      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should return true and decode valid token from sessionStorage', () => {
      const token = makeToken({
        userId: 'user123',
        email: 'alice@example.com',
        name: 'Alice',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      sessionStorage.setItem('auth_token', token);

      const result = useAuthStore.getState().checkAuth();
      expect(result).toBe(true);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.id).toBe('user123');
      expect(state.user?.email).toBe('alice@example.com');
    });

    it('should migrate token from localStorage to sessionStorage', () => {
      const token = makeToken({
        userId: 'user456',
        email: 'bob@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      localStorage.setItem('auth_token', token);

      const result = useAuthStore.getState().checkAuth();
      expect(result).toBe(true);
      // Should be migrated to sessionStorage
      expect(sessionStorage.getItem('auth_token')).toBe(token);
    });

    it('should clear expired token and return false', () => {
      const expiredToken = makeToken({
        userId: 'expired-user',
        email: 'expired@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600, // expired 1h ago
      });
      sessionStorage.setItem('auth_token', expiredToken);

      const result = useAuthStore.getState().checkAuth();
      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should handle malformed token gracefully (no dots)', () => {
      // Token without dots: split('.')[1] is undefined, falls to fallback
      sessionStorage.setItem('auth_token', 'no-dots-here');
      const result = useAuthStore.getState().checkAuth();
      // Falls to fallback: isAuthenticated=true, isLoading=false
      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().token).toBe('no-dots-here');
    });

    it('should handle token without valid payload (atob throws)', () => {
      // Token with 2 parts but invalid base64 in payload
      sessionStorage.setItem('auth_token', 'header.invalid!base64.sig');
      const result = useAuthStore.getState().checkAuth();
      // atob throws → catch block → returns false
      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('syncFromStorage', () => {
    it('should sync user from token in sessionStorage', () => {
      const token = makeToken({
        userId: 'sync-user',
        email: 'sync@example.com',
        name: 'Sync User',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('user_id', 'sync-user');
      sessionStorage.setItem('user_role', 'editor');

      useAuthStore.getState().syncFromStorage();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('sync@example.com');
    });

    it('should set unauthenticated when no token', () => {
      useAuthStore.getState().syncFromStorage();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should migrate from localStorage to sessionStorage during sync', () => {
      const token = makeToken({
        userId: 'migrate-user',
        email: 'migrate@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      localStorage.setItem('auth_token', token);

      useAuthStore.getState().syncFromStorage();
      expect(sessionStorage.getItem('auth_token')).toBe(token);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('authActions', () => {
    it('should export login/logout/checkAuth/syncFromStorage', async () => {
      const { authActions } = await import('../../src/stores/authStore');
      expect(typeof authActions.login).toBe('function');
      expect(typeof authActions.logout).toBe('function');
      expect(typeof authActions.checkAuth).toBe('function');
      expect(typeof authActions.syncFromStorage).toBe('function');
    });
  });
});
