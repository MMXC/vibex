/**
 * TemplateStore Subscription Tests - Sprint78 E2 Template Subscription Notify
 *
 * Tests for: subscribeTemplate, unsubscribeTemplate, subscribeAuthor,
 *            unsubscribeAuthor, getTemplateUpdates, subscribedTemplates state
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useTemplateStore } from '../templateStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('TemplateStore - S78-E2 Subscription', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useTemplateStore.setState({
      subscribedTemplates: {},
      subscribedAuthors: {},
      templates: [
        { id: 't1', name: 'SaaS Platform', description: 'SaaS app', category: 'saas', tags: [], displayName: 'SaaS', content: '', scenes: [], entities: [], features: [], items: [] },
        { id: 't2', name: 'Ecommerce', description: 'Ecommerce app', category: 'ecommerce', tags: [], displayName: '电商', content: '', scenes: [], entities: [], features: [], items: [] },
      ],
      filteredTemplates: [],
      selectedCategory: 'all',
      searchQuery: '',
    });
  });

  describe('subscribeTemplate', () => {
    it('should add template to subscribedTemplates', () => {
      const before = Object.keys(useTemplateStore.getState().subscribedTemplates);
      expect(before).not.toContain('t1');

      useTemplateStore.getState().subscribeTemplate('t1');

      const sub = useTemplateStore.getState().subscribedTemplates['t1'];
      expect(sub).toBeDefined();
      expect(sub.templateId).toBe('t1');
      expect(sub.subscribedAt).toBeGreaterThan(0);
      expect(sub.lastUpdateCheck).toBeGreaterThan(0);
    });

    it('should not duplicate subscription if already subscribed', () => {
      useTemplateStore.getState().subscribeTemplate('t1');
      const firstSubscribedAt = useTemplateStore.getState().subscribedTemplates['t1'].subscribedAt;

      // Wait a tiny bit to ensure timestamp would differ
      useTemplateStore.getState().subscribeTemplate('t1');

      // Should still be one entry
      expect(Object.keys(useTemplateStore.getState().subscribedTemplates)).toHaveLength(1);
      expect(useTemplateStore.getState().subscribedTemplates['t1'].subscribedAt).toBe(firstSubscribedAt);
    });
  });

  describe('unsubscribeTemplate', () => {
    it('should remove template from subscribedTemplates', () => {
      useTemplateStore.getState().subscribeTemplate('t1');
      expect(useTemplateStore.getState().subscribedTemplates['t1']).toBeDefined();

      useTemplateStore.getState().unsubscribeTemplate('t1');

      expect(useTemplateStore.getState().subscribedTemplates['t1']).toBeUndefined();
    });

    it('should be safe to call when not subscribed', () => {
      expect(() => useTemplateStore.getState().unsubscribeTemplate('t1')).not.toThrow();
      expect(Object.keys(useTemplateStore.getState().subscribedTemplates)).toHaveLength(0);
    });
  });

  describe('subscribeAuthor / unsubscribeAuthor', () => {
    it('should add author to subscribedAuthors', () => {
      useTemplateStore.getState().subscribeAuthor('author-1');

      const sub = useTemplateStore.getState().subscribedAuthors['author-1'];
      expect(sub).toBeDefined();
      expect(sub.authorId).toBe('author-1');
      expect(sub.subscribedAt).toBeGreaterThan(0);
    });

    it('should remove author from subscribedAuthors', () => {
      useTemplateStore.getState().subscribeAuthor('author-1');
      expect(useTemplateStore.getState().subscribedAuthors['author-1']).toBeDefined();

      useTemplateStore.getState().unsubscribeAuthor('author-1');

      expect(useTemplateStore.getState().subscribedAuthors['author-1']).toBeUndefined();
    });

    it('should not duplicate author subscription', () => {
      useTemplateStore.getState().subscribeAuthor('author-1');
      useTemplateStore.getState().subscribeAuthor('author-1');
      expect(Object.keys(useTemplateStore.getState().subscribedAuthors)).toHaveLength(1);
    });
  });

  describe('getTemplateUpdates', () => {
    it('should return empty array when no subscriptions', () => {
      const updates = useTemplateStore.getState().getTemplateUpdates();
      expect(updates).toEqual([]);
    });

    it('should return empty array when templates have no updatedAt', () => {
      useTemplateStore.getState().subscribeTemplate('t1');
      const updates = useTemplateStore.getState().getTemplateUpdates();
      // Templates don't have updatedAt, so no updates detected
      expect(updates).toEqual([]);
    });
  });
});
