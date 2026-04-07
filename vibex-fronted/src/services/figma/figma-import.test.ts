/**
 * Figma Import Service Tests
 */

import { FigmaFileInfo, FigmaPage, FigmaComponent } from '../figma-import';

describe('Figma Import Service', () => {
  describe('FigmaFileInfo', () => {
    it('should create file info object', () => {
      const fileInfo: FigmaFileInfo = {
        name: 'Test File',
        thumbnailUrl: 'https://example.com/thumb.png',
        lastModified: '2024-01-01',
        version: '123456',
      };
      expect(fileInfo.name).toBe('Test File');
    });
  });

  describe('FigmaPage', () => {
    it('should create page object', () => {
      const page: FigmaPage = {
        id: 'page-1',
        name: 'Page 1',
        type: 'CANVAS',
      };
      expect(page.id).toBe('page-1');
      expect(page.type).toBe('CANVAS');
    });
  });

  describe('FigmaComponent', () => {
    it('should create component object', () => {
      const component: FigmaComponent = {
        id: 'comp-1',
        name: 'Button',
        description: 'Primary button component',
        thumbnailUrl: 'https://example.com/button.png',
      };
      expect(component.name).toBe('Button');
      expect(component.thumbnailUrl).toBeDefined();
    });

    it('should handle optional thumbnailUrl', () => {
      const component: FigmaComponent = {
        id: 'comp-2',
        name: 'Text',
        description: 'Text component',
      };
      expect(component.thumbnailUrl).toBeUndefined();
    });
  });
});
