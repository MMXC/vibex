/**
 * Figma Import Service Tests
 */

import {
  parseFigmaUrl,
  fetchFigmaFileFromUrl,
} from '../figma-import';

describe('Figma Import Service', () => {
  describe('parseFigmaUrl', () => {
    it('should parse Figma file URL', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123/Project-Name');
      expect(result).toEqual({ fileKey: 'ABC123', nodeId: undefined });
    });

    it('should parse Figma design URL', () => {
      const result = parseFigmaUrl('https://www.figma.com/design/ABC123/Project-Name');
      expect(result).toEqual({ fileKey: 'ABC123', nodeId: undefined });
    });

    it('should parse Figma URL without project name', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123');
      expect(result).toEqual({ fileKey: 'ABC123', nodeId: undefined });
    });

    it('should return null for invalid URL', () => {
      const result = parseFigmaUrl('https://example.com/file/ABC123');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseFigmaUrl('');
      expect(result).toBeNull();
    });

    it('should handle URL with query params (non node-id)', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123?other-param=foo');
      expect(result).toEqual({ fileKey: 'ABC123', nodeId: undefined });
    });

    it('should handle URL with node-id query param', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123?node-id=1:2');
      expect(result).toEqual({ fileKey: 'ABC123', nodeId: '1:2' });
    });

    it('should handle URL with node-id and other params', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123?node-id=3:4&t=abc');
      expect(result).toEqual({ fileKey: 'ABC123', nodeId: '3:4' });
    });

    it('should handle URL with fragment after node-id', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123?node-id=5:6#section');
      expect(result).toEqual({ fileKey: 'ABC123', nodeId: '5:6' });
    });

    it('should handle URL with trailing slash', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123/');
      expect(result).toEqual({ fileKey: 'ABC123', nodeId: undefined });
    });

    it('should handle URL with fragment', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123/Project#section');
      expect(result).toEqual({ fileKey: 'ABC123', nodeId: undefined });
    });

    it('should handle alphanumeric file keys', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/AbC123XyZ/Project');
      expect(result).toEqual({ fileKey: 'AbC123XyZ', nodeId: undefined });
    });

    it('should return null for non-figma URLs', () => {
      const result = parseFigmaUrl('https://www.google.com');
      expect(result).toBeNull();
    });
  });

  describe('fetchFigmaFileFromUrl', () => {
    const originalEnv = process.env.NEXT_PUBLIC_FIGMA_TOKEN;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.NEXT_PUBLIC_FIGMA_TOKEN = originalEnv;
      } else {
        delete process.env.NEXT_PUBLIC_FIGMA_TOKEN;
      }
    });

    it('returns error when token is missing', async () => {
      delete process.env.NEXT_PUBLIC_FIGMA_TOKEN;
      const result = await fetchFigmaFileFromUrl('https://www.figma.com/file/abc');
      expect(result.success).toBe(false);
      expect(result.error).toContain('FIGMA_ACCESS_TOKEN');
    });

    it('returns error for invalid Figma URL', async () => {
      process.env.NEXT_PUBLIC_FIGMA_TOKEN = 'fake-token';
      const result = await fetchFigmaFileFromUrl('https://www.google.com');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Figma URL 格式无效');
    });

    it('returns error for empty URL', async () => {
      process.env.NEXT_PUBLIC_FIGMA_TOKEN = 'fake-token';
      const result = await fetchFigmaFileFromUrl('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Figma URL 格式无效');
    });
  });
});
