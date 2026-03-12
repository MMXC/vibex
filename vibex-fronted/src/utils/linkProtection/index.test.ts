/**
 * Link Protection Tests
 */

import { 
  createProtectedLink, 
  getProtectedLink, 
  accessProtectedLink, 
  deleteProtectedLink,
  isLinkExpired,
  verifyPassword
} from '@/utils/linkProtection';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('linkProtection', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('createProtectedLink', () => {
    it('should create a protected link without expiration', () => {
      const link = createProtectedLink('https://example.com');
      
      expect(link.url).toBe('https://example.com');
      expect(link.expiresAt).toBeNull();
      expect(link.password).toBeNull();
      expect(link.accessCount).toBe(0);
    });

    it('should create a link with expiration', () => {
      const link = createProtectedLink('https://example.com', { expiresIn: 24 });
      
      expect(link.url).toBe('https://example.com');
      expect(link.expiresAt).not.toBeNull();
    });

    it('should create a link with password', () => {
      const link = createProtectedLink('https://example.com', { password: 'test123' });
      
      expect(link.password).toBe('test123');
    });

    it('should create a link with max access count', () => {
      const link = createProtectedLink('https://example.com', { maxAccess: 10 });
      
      expect(link.maxAccess).toBe(10);
    });
  });

  describe('getProtectedLink', () => {
    it('should retrieve an existing link', () => {
      const created = createProtectedLink('https://example.com');
      const retrieved = getProtectedLink(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return undefined for non-existent link', () => {
      const retrieved = getProtectedLink('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('isLinkExpired', () => {
    it('should return false for non-expiring link', () => {
      const link = createProtectedLink('https://example.com');
      expect(isLinkExpired(link)).toBe(false);
    });

    it('should return true for expired link', () => {
      const expiredLink = {
        id: 'test',
        url: 'https://example.com',
        expiresAt: '2020-01-01',
        password: null,
        createdAt: '2020-01-01',
        accessCount: 0,
      };
      expect(isLinkExpired(expiredLink)).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', () => {
      const link = createProtectedLink('https://example.com', { password: 'test123' });
      expect(verifyPassword(link.id, 'test123')).toBe(true);
    });

    it('should return false for incorrect password', () => {
      const link = createProtectedLink('https://example.com', { password: 'test123' });
      expect(verifyPassword(link.id, 'wrong')).toBe(false);
    });

    it('should return true for link without password', () => {
      const link = createProtectedLink('https://example.com');
      expect(verifyPassword(link.id, '')).toBe(true);
    });
  });

  describe('accessProtectedLink', () => {
    it('should increment access count', () => {
      const link = createProtectedLink('https://example.com');
      const result = accessProtectedLink(link.id);
      
      expect(result?.accessCount).toBe(1);
    });
  });

  describe('deleteProtectedLink', () => {
    it('should delete a protected link', () => {
      const link = createProtectedLink('https://example.com');
      deleteProtectedLink(link.id);
      
      const retrieved = getProtectedLink(link.id);
      expect(retrieved).toBeUndefined();
    });
  });
});