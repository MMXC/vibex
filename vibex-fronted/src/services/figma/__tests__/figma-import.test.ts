/**
 * Figma Import Service Tests
 */

import {
  parseFigmaUrl,
} from '../figma-import';

// Note: We only test pure functions here since fetch-based functions
// require complex mocking that causes test flakiness

describe('Figma Import Service', () => {
  describe('parseFigmaUrl', () => {
    it('should parse Figma file URL', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123/Project-Name');
      expect(result).toEqual({ fileKey: 'ABC123' });
    });

    it('should parse Figma design URL', () => {
      const result = parseFigmaUrl('https://www.figma.com/design/ABC123/Project-Name');
      expect(result).toEqual({ fileKey: 'ABC123' });
    });

    it('should parse Figma URL without project name', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123');
      expect(result).toEqual({ fileKey: 'ABC123' });
    });

    it('should return null for invalid URL', () => {
      const result = parseFigmaUrl('https://example.com/file/ABC123');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseFigmaUrl('');
      expect(result).toBeNull();
    });

    it('should handle URL with query params', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123?node-id=1:2');
      expect(result).toEqual({ fileKey: 'ABC123' });
    });

    it('should handle alphanumeric file keys', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/AbC123XyZ/Project');
      expect(result).toEqual({ fileKey: 'AbC123XyZ' });
    });

    it('should return null for non-figma URLs', () => {
      const result = parseFigmaUrl('https://www.google.com');
      expect(result).toBeNull();
    });

    it('should handle URL with trailing slash', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123/');
      expect(result).toEqual({ fileKey: 'ABC123' });
    });

    it('should handle URL with fragment', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/ABC123/Project#section');
      expect(result).toEqual({ fileKey: 'ABC123' });
    });
  });
});