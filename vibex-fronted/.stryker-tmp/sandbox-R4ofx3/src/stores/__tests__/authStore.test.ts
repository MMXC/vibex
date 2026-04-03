/**
 * AuthStore Tests
 */
// @ts-nocheck


import { useAuthStore } from '../authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    // Clear localStorage mock
    useAuthStore.getState().logout?.();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have null user initially', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('should have null token initially', () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
    });

    it('should not be authenticated initially', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user', () => {
      const { setUser } = useAuthStore.getState();
      const mockUser = { id: '1', email: 'test@test.com' };
      
      setUser(mockUser);
      
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  describe('setToken', () => {
    it('should set token and update isAuthenticated', () => {
      const { setToken } = useAuthStore.getState();
      
      setToken('test-token');
      
      expect(useAuthStore.getState().token).toBe('test-token');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should set isAuthenticated to false when token is null', () => {
      const { setToken } = useAuthStore.getState();
      setToken('test-token');
      
      setToken(null);
      
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const { setLoading } = useAuthStore.getState();
      
      setLoading(false);
      
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('should set token, user, and isAuthenticated', () => {
      const { login } = useAuthStore.getState();
      const token = 'test-token';
      const user = { id: '1', email: 'test@test.com' };
      
      login(token, user);
      
      expect(useAuthStore.getState().token).toBe(token);
      expect(useAuthStore.getState().user).toEqual(user);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      const { login, logout } = useAuthStore.getState();
      login('token', { id: '1', email: 'test@test.com' });
      
      logout();
      
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
