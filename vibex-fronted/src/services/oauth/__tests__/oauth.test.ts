/**
 * OAuth Service Tests
 */

import { getStoredToken, isConnected } from '../oauth';

describe('OAuth Service', () => {
  afterEach(() => {
    localStorage.clear();
  });

  describe('getStoredToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('github_token', 'test-token');
      const token = getStoredToken('github');
      expect(token).toBe('test-token');
    });

    it('should return null if no token', () => {
      const token = getStoredToken('github');
      expect(token).toBeNull();
    });
  });

  describe('isConnected', () => {
    it('should return true if token exists', () => {
      localStorage.setItem('github_token', 'test-token');
      expect(isConnected('github')).toBe(true);
    });

    it('should return false if no token', () => {
      expect(isConnected('github')).toBe(false);
    });
  });
});
