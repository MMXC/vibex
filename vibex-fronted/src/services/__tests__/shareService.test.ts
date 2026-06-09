/**
 * shareService.test.ts — Sprint82 E3: Canvas Share Service Tests
 *
 * Tests generateShareLink, revokeShareLink, listShareLinks, validateShareToken.
 * Uses localStorage mocking for browser environment.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
});

// Mock window.location.origin
vi.stubGlobal('window', {
  location: { origin: 'https://vibex-app.pages.dev' },
});

// We need to dynamically import to avoid hoisting issues with vi.mock
// The shareService uses @/lib/shareUtils which we need to mock

// Capture navigator.clipboard for copyToClipboardShare
const clipboardWrite: string[] = [];
Object.defineProperty(globalThis, 'navigator', {
  value: {
    clipboard: {
      writeText: vi.fn((text: string) => {
        clipboardWrite.push(text);
        return Promise.resolve();
      }),
    },
  },
  configurable: true,
});

// Import after mocking
const shareService = await import('@/services/shareService');

const { generateShareLink, revokeShareLink, listShareLinks, validateShareToken } =
  shareService;

describe('shareService', () => {
  const STORAGE_KEY = 'vibex_share_links';

  beforeEach(() => {
    // Clear localStorage
    store[STORAGE_KEY] = JSON.stringify([]);
    clipboardWrite.length = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete store[STORAGE_KEY];
  });

  // ============================================================
  // generateShareLink
  // ============================================================

  describe('generateShareLink', () => {
    it('generates a token and stores it in localStorage', async () => {
      const result = await generateShareLink({
        canvasId: 'canvas-abc',
        canvasName: '测试画布',
        role: 'viewer',
      });

      expect(result.token).toHaveLength(16);
      expect(typeof result.token).toBe('string');
      expect(result.url).toContain('canvas-abc');
      expect(result.url).toContain('share=');
      expect(result.expiresAt).not.toBeNull();

      const stored = JSON.parse(store[STORAGE_KEY]);
      expect(stored).toHaveLength(1);
      expect(stored[0].canvasId).toBe('canvas-abc');
      expect(stored[0].role).toBe('viewer');
      expect(stored[0].token).toBe(result.token);
    });

    it('generates distinct tokens for each call', async () => {
      const r1 = await generateShareLink({ canvasId: 'c1', canvasName: 'N1', role: 'viewer' });
      const r2 = await generateShareLink({ canvasId: 'c2', canvasName: 'N2', role: 'editor' });
      expect(r1.token).not.toBe(r2.token);
    });

    it('respects custom ttlMs', async () => {
      const result = await generateShareLink({
        canvasId: 'c1',
        canvasName: 'N1',
        role: 'editor',
        ttlMs: 60 * 1000, // 1 minute
      });

      const stored = JSON.parse(store[STORAGE_KEY]);
      expect(stored[0].ttlMs).toBe(60 * 1000);
      const expires = new Date(result.expiresAt!);
      const now = new Date();
      expect(expires.getTime() - now.getTime()).toBeGreaterThan(55 * 1000);
    });
  });

  // ============================================================
  // revokeShareLink
  // ============================================================

  describe('revokeShareLink', () => {
    it('removes the link from localStorage', async () => {
      const result = await generateShareLink({
        canvasId: 'c1',
        canvasName: 'N1',
        role: 'viewer',
      });

      const ok = await revokeShareLink(result.token);
      expect(ok).toBe(true);

      const stored = JSON.parse(store[STORAGE_KEY]);
      expect(stored).toHaveLength(0);
    });

    it('returns false for non-existent token', async () => {
      const ok = await revokeShareLink('nonexistent-token-');
      expect(ok).toBe(false);
    });

    it('only removes the specific token', async () => {
      await generateShareLink({ canvasId: 'c1', canvasName: 'N1', role: 'viewer' });
      await generateShareLink({ canvasId: 'c2', canvasName: 'N2', role: 'editor' });

      const stored = JSON.parse(store[STORAGE_KEY]);
      const tokenToRemove = stored[0].token;

      await revokeShareLink(tokenToRemove);

      const remaining = JSON.parse(store[STORAGE_KEY]);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].token).not.toBe(tokenToRemove);
    });
  });

  // ============================================================
  // listShareLinks
  // ============================================================

  describe('listShareLinks', () => {
    it('returns all links for a canvas', async () => {
      await generateShareLink({ canvasId: 'c1', canvasName: 'N1', role: 'viewer' });
      await generateShareLink({ canvasId: 'c1', canvasName: 'N1', role: 'editor' });
      await generateShareLink({ canvasId: 'c2', canvasName: 'N2', role: 'viewer' });

      const links = await listShareLinks('c1');
      expect(links).toHaveLength(2);
      expect(links.every((l) => l.canvasId === 'c1')).toBe(true);
    });

    it('returns empty array for canvas with no links', async () => {
      const links = await listShareLinks('nonexistent-canvas');
      expect(links).toHaveLength(0);
    });

    it('removes expired links from storage', async () => {
      // Manually inject an expired link
      const expiredLink = {
        token: 'expired-link-1234',
        canvasId: 'c1',
        role: 'viewer' as const,
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // expired 5 min ago
        ttlMs: 5 * 60 * 1000,
      };
      store[STORAGE_KEY] = JSON.stringify([expiredLink]);

      const links = await listShareLinks('c1');
      expect(links).toHaveLength(0);

      // Should also be removed from storage
      const stored = JSON.parse(store[STORAGE_KEY]);
      expect(stored).toHaveLength(0);
    });

    it('preserves non-expired links', async () => {
      const validLink = {
        token: 'valid-link-12345',
        canvasId: 'c1',
        role: 'viewer' as const,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };
      store[STORAGE_KEY] = JSON.stringify([validLink]);

      const links = await listShareLinks('c1');
      expect(links).toHaveLength(1);
      expect(links[0].token).toBe('valid-link-12345');
    });

    it('returns links with null expiresAt (never expires)', async () => {
      const neverExpireLink = {
        token: 'never-expire-1234',
        canvasId: 'c1',
        role: 'editor' as const,
        createdAt: new Date().toISOString(),
        expiresAt: null,
      };
      store[STORAGE_KEY] = JSON.stringify([neverExpireLink]);

      const links = await listShareLinks('c1');
      expect(links).toHaveLength(1);
      expect(links[0].expiresAt).toBeNull();
    });
  });

  // ============================================================
  // validateShareToken
  // ============================================================

  describe('validateShareToken', () => {
    it('returns role for valid token', async () => {
      const result = await generateShareLink({
        canvasId: 'c1',
        canvasName: 'N1',
        role: 'editor',
      });

      const role = await validateShareToken(result.token, 'c1');
      expect(role).toBe('editor');
    });

    it('returns null for non-existent token', async () => {
      const role = await validateShareToken('nonexistent-12345', 'c1');
      expect(role).toBeNull();
    });

    it('returns null for token with wrong canvasId', async () => {
      const result = await generateShareLink({
        canvasId: 'c1',
        canvasName: 'N1',
        role: 'viewer',
      });

      const role = await validateShareToken(result.token, 'c2');
      expect(role).toBeNull();
    });

    it('returns null for expired token', async () => {
      const expiredLink = {
        token: 'expired-12345678',
        canvasId: 'c1',
        role: 'viewer' as const,
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      };
      store[STORAGE_KEY] = JSON.stringify([expiredLink]);

      const role = await validateShareToken('expired-12345678', 'c1');
      expect(role).toBeNull();
    });
  });

  // ============================================================
  // Token Format
  // ============================================================

  describe('token format', () => {
    it('generates alphanumeric tokens of expected length', async () => {
      const result = await generateShareLink({
        canvasId: 'c1',
        canvasName: 'N1',
        role: 'viewer',
      });

      expect(result.token).toMatch(/^[a-zA-Z0-9]{16}$/);
    });
  });
});
