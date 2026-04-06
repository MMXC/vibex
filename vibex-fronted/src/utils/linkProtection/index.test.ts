/**
 * Link Protection Tests
 */

import { 
  createProtectedLink, 
  getLink, 
  checkLinkAccess, 
  deleteLink,
  isLinkExpired,
  verifyLinkPassword
} from '@/utils/linkProtection';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
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
    vi.clearAllMocks();
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

  describe('getLink', () => {
    it('should retrieve an existing link', () => {
      const created = createProtectedLink('https://example.com');
      const retrieved = getLink(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent link', () => {
      const retrieved = getLink('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('isLinkExpired', () => {
    it('should return false for non-expiring link', () => {
      const link = createProtectedLink('https://example.com');
      expect(isLinkExpired(link.id)).toBe(false);
    });

    it('should return true for expired link', () => {
      // Create an expired link manually in localStorage
      const expiredLink = {
        id: 'test-expired',
        url: 'https://example.com',
        expiresAt: '2020-01-01',
        password: null,
        createdAt: '2020-01-01',
        accessCount: 0,
      };
      localStorageMock.setItem('protected_links', JSON.stringify([expiredLink]));
      expect(isLinkExpired('test-expired')).toBe(true);
    });
  });

  describe('verifyLinkPassword', () => {
    it('should return true for correct password', () => {
      const link = createProtectedLink('https://example.com', { password: 'test123' });
      expect(verifyLinkPassword(link.id, 'test123')).toBe(true);
    });

    it('should return false for incorrect password', () => {
      const link = createProtectedLink('https://example.com', { password: 'test123' });
      expect(verifyLinkPassword(link.id, 'wrong')).toBe(false);
    });

    it('should return false for link without password', () => {
      const link = createProtectedLink('https://example.com');
      expect(verifyLinkPassword(link.id, '')).toBe(false);
    });
  });

  describe('checkLinkAccess', () => {
    it('should return accessible for valid link', () => {
      const link = createProtectedLink('https://example.com');
      const result = checkLinkAccess(link.id);
      
      expect(result.accessible).toBe(true);
    });

    it('should return not accessible for non-existent link', () => {
      const result = checkLinkAccess('non-existent');
      expect(result.accessible).toBe(false);
    });

    it('should increment access count', () => {
      const link = createProtectedLink('https://example.com');
      checkLinkAccess(link.id);
      
      const retrieved = getLink(link.id);
      expect(retrieved?.accessCount).toBe(1);
    });
  });

  describe('deleteLink', () => {
    it('should delete a protected link', () => {
      const link = createProtectedLink('https://example.com');
      deleteLink(link.id);
      
      const retrieved = getLink(link.id);
      expect(retrieved).toBeNull();
    });
  });
});