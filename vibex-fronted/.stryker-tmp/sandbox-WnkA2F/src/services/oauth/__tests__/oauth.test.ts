/**
 * OAuth Service Tests
 * 
 * Fix: All token storage operations are now async (secure storage).
 * Tests updated to handle async/await pattern and mock secure-storage
 * to avoid Web Crypto API dependency in jsdom environment.
 */
// @ts-nocheck


import { isConnected, getStoredToken, storeTokens, logout } from '../oauth';

// Mock secure-storage to avoid TextEncoder/crypto.subtle dependency in jsdom
jest.mock('@/lib/secure-storage', () => ({
  secureSet: jest.fn().mockResolvedValue(undefined),
  secureGet: jest.fn().mockResolvedValue(null),
}));

describe('OAuth Service', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('isConnected', () => {
    it('should return false when no token stored', async () => {
      const result = await isConnected('github');
      expect(result).toBe(false);
    });

    it('should return true when token is stored', async () => {
      localStorage.setItem('oauth_github_token', 'encrypted-fake-token');
      const { secureGet } = require('@/lib/secure-storage');
      secureGet.mockResolvedValueOnce('decrypted-token');
      const result = await isConnected('github');
      expect(result).toBe(true);
    });

    it('should work for figma provider', async () => {
      localStorage.setItem('oauth_figma_token', 'encrypted-fake-token');
      const { secureGet } = require('@/lib/secure-storage');
      secureGet.mockResolvedValueOnce('decrypted-token');
      const result = await isConnected('figma');
      expect(result).toBe(true);
    });

    it('should return false for empty token', async () => {
      localStorage.setItem('oauth_github_token', '');
      const result = await isConnected('github');
      expect(result).toBe(false);
    });
  });

  describe('getStoredToken', () => {
    it('should return null when no token stored', async () => {
      const result = await getStoredToken('github');
      expect(result).toBeNull();
    });

    it('should return token when stored', async () => {
      localStorage.setItem('oauth_github_token', 'encrypted-fake-token');
      // Mock secureGet to return the decrypted token
      const { secureGet } = require('@/lib/secure-storage');
      secureGet.mockResolvedValueOnce('test-token');
      
      const result = await getStoredToken('github');
      expect(result).toBe('test-token');
    });

    it('should return null when token is expired', async () => {
      localStorage.setItem('oauth_github_token', 'encrypted-fake-token');
      localStorage.setItem('oauth_github_expires', String(Date.now() - 1000));
      
      const result = await getStoredToken('github');
      expect(result).toBeNull();
    });

    it('should return token when not expired', async () => {
      localStorage.setItem('oauth_github_token', 'encrypted-fake-token');
      localStorage.setItem('oauth_github_expires', String(Date.now() + 10000));
      const { secureGet } = require('@/lib/secure-storage');
      secureGet.mockResolvedValueOnce('test-token');
      
      const result = await getStoredToken('github');
      expect(result).toBe('test-token');
    });

    it('should handle missing token gracefully', async () => {
      const result = await getStoredToken('github');
      expect(result).toBeNull();
    });

    it('should work for figma provider', async () => {
      localStorage.setItem('oauth_figma_token', 'encrypted-fake-token');
      const { secureGet } = require('@/lib/secure-storage');
      secureGet.mockResolvedValueOnce('figma-token');
      
      const result = await getStoredToken('figma');
      expect(result).toBe('figma-token');
    });
  });

  describe('storeTokens', () => {
    it('should store access token', async () => {
      const { secureSet } = require('@/lib/secure-storage');
      
      await storeTokens('github', { accessToken: 'test-token' });
      
      expect(secureSet).toHaveBeenCalledWith('oauth_github_token', 'test-token');
    });

    it('should store refresh token', async () => {
      const { secureSet } = require('@/lib/secure-storage');
      
      await storeTokens('github', { 
        accessToken: 'test-token', 
        refreshToken: 'refresh-token' 
      });
      
      expect(secureSet).toHaveBeenCalledWith('oauth_github_refresh', 'refresh-token');
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
      const { secureSet } = require('@/lib/secure-storage');
      
      await storeTokens('figma', { accessToken: 'figma-token' });
      
      expect(secureSet).toHaveBeenCalledWith('oauth_figma_token', 'figma-token');
    });

    it('should store all token properties', async () => {
      const { secureSet } = require('@/lib/secure-storage');
      
      await storeTokens('github', { 
        accessToken: 'test-token', 
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer'
      });
      
      expect(secureSet).toHaveBeenCalledWith('oauth_github_token', 'test-token');
      expect(secureSet).toHaveBeenCalledWith('oauth_github_refresh', 'refresh-token');
      expect(localStorage.getItem('oauth_github_expires')).not.toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear stored tokens even without API call', async () => {
      localStorage.setItem('oauth_github_token', 'encrypted-fake-token');
      localStorage.setItem('oauth_github_refresh', 'encrypted-refresh-token');
      localStorage.setItem('oauth_github_expires', String(Date.now() + 10000));

      await logout('github');

      expect(localStorage.getItem('oauth_github_token')).toBeNull();
      expect(localStorage.getItem('oauth_github_refresh')).toBeNull();
      expect(localStorage.getItem('oauth_github_expires')).toBeNull();
    });

    it('should handle missing token gracefully', async () => {
      await expect(logout('github')).resolves.not.toThrow();
    });

    it('should work for figma provider', async () => {
      localStorage.setItem('oauth_figma_token', 'encrypted-fake-token');
      await logout('figma');
      expect(localStorage.getItem('oauth_figma_token')).toBeNull();
    });
  });
});
