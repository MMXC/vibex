/**
 * OAuth Service Tests
 */

import {
  isConnected,
  getStoredToken,
  storeTokens,
  logout,
} from '../oauth';

// Note: We only test functions that don't require fetch mocking
// to avoid test flakiness

describe('OAuth Service', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('isConnected', () => {
    it('should return false when no token stored', () => {
      const result = isConnected('github');
      expect(result).toBe(false);
    });

    it('should return true when token is stored', () => {
      localStorage.setItem('oauth_github_token', btoa('test-token'));
      const result = isConnected('github');
      expect(result).toBe(true);
    });

    it('should work for figma provider', () => {
      localStorage.setItem('oauth_figma_token', btoa('test-token'));
      const result = isConnected('figma');
      expect(result).toBe(true);
    });

    it('should return false for empty token', () => {
      localStorage.setItem('oauth_github_token', '');
      const result = isConnected('github');
      expect(result).toBe(false);
    });
  });

  describe('getStoredToken', () => {
    it('should return null when no token stored', () => {
      const result = getStoredToken('github');
      expect(result).toBeNull();
    });

    it('should return token when stored', () => {
      localStorage.setItem('oauth_github_token', btoa('test-token'));
      const result = getStoredToken('github');
      expect(result).toBe('test-token');
    });

    it('should return null when token is expired', () => {
      localStorage.setItem('oauth_github_token', btoa('test-token'));
      localStorage.setItem('oauth_github_expires', String(Date.now() - 1000));
      
      const result = getStoredToken('github');
      expect(result).toBeNull();
    });

    it('should return token when not expired', () => {
      localStorage.setItem('oauth_github_token', btoa('test-token'));
      localStorage.setItem('oauth_github_expires', String(Date.now() + 10000));
      
      const result = getStoredToken('github');
      expect(result).toBe('test-token');
    });

    it('should handle invalid base64', () => {
      localStorage.setItem('oauth_github_token', 'invalid-base64!!!');
      const result = getStoredToken('github');
      expect(result).toBeNull();
    });

    it('should work for figma provider', () => {
      localStorage.setItem('oauth_figma_token', btoa('figma-token'));
      const result = getStoredToken('figma');
      expect(result).toBe('figma-token');
    });
  });

  describe('storeTokens', () => {
    it('should store access token', async () => {
      await storeTokens('github', { accessToken: 'test-token' });
      expect(localStorage.getItem('oauth_github_token')).toBe(btoa('test-token'));
    });

    it('should store refresh token', async () => {
      await storeTokens('github', { 
        accessToken: 'test-token', 
        refreshToken: 'refresh-token' 
      });
      expect(localStorage.getItem('oauth_github_refresh')).toBe(btoa('refresh-token'));
    });

    it('should store expiration time', async () => {
      await storeTokens('github', { 
        accessToken: 'test-token', 
        expiresIn: 3600 
      });
      const expires = localStorage.getItem('oauth_github_expires');
      expect(expires).not.toBeNull();
      expect(parseInt(expires!)).toBeGreaterThan(Date.now());
    });

    it('should work for figma provider', async () => {
      await storeTokens('figma', { accessToken: 'figma-token' });
      expect(localStorage.getItem('oauth_figma_token')).toBe(btoa('figma-token'));
    });

    it('should store all token properties', async () => {
      await storeTokens('github', { 
        accessToken: 'test-token', 
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer'
      });
      
      expect(localStorage.getItem('oauth_github_token')).toBe(btoa('test-token'));
      expect(localStorage.getItem('oauth_github_refresh')).toBe(btoa('refresh-token'));
      expect(localStorage.getItem('oauth_github_expires')).not.toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear stored tokens even without API call', async () => {
      localStorage.setItem('oauth_github_token', btoa('test-token'));
      localStorage.setItem('oauth_github_refresh', btoa('refresh-token'));
      localStorage.setItem('oauth_github_expires', String(Date.now() + 10000));

      // When no token, logout just clears storage
      await logout('github');

      expect(localStorage.getItem('oauth_github_token')).toBeNull();
      expect(localStorage.getItem('oauth_github_refresh')).toBeNull();
      expect(localStorage.getItem('oauth_github_expires')).toBeNull();
    });

    it('should handle missing token gracefully', async () => {
      await expect(logout('github')).resolves.not.toThrow();
    });

    it('should work for figma provider', async () => {
      localStorage.setItem('oauth_figma_token', btoa('test-token'));
      await logout('figma');
      expect(localStorage.getItem('oauth_figma_token')).toBeNull();
    });
  });
});