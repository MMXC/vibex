/**
 * clipboardStore — Unit Tests
 * S46-E3: 画布节点复制/粘贴
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClipboardStore } from '../clipboardStore';
import type { DDSCard } from '@/types/dds';

const makeCard = (id: string, title = 'Card'): DDSCard =>
  ({
    id,
    title,
    description: '',
    type: 'requirement' as const,
    parentId: null,
    children: [],
    position: { x: 100, y: 200 },
    status: 'draft' as const,
    priority: 'medium' as const,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    collapsed: false,
    isLocked: false,
    isFavorite: false,
    confirmed: false,
    metadata: {},
  });

describe('clipboardStore — S46-E3 copy/paste', () => {
  beforeEach(() => {
    useClipboardStore.setState({ entry: null });
  });

  it('starts with null entry', () => {
    expect(useClipboardStore.getState().entry).toBeNull();
  });

  it('copyCards stores cards with timestamp and sourceChapter', () => {
    const cards = [makeCard('c1'), makeCard('c2')];
    useClipboardStore.getState().copyCards(cards, 'requirement');

    const entry = useClipboardStore.getState().entry;
    expect(entry).not.toBeNull();
    expect(entry!.cards).toHaveLength(2);
    expect(entry!.sourceChapter).toBe('requirement');
    expect(entry!.pasteCount).toBe(0);
    expect(entry!.timestamp).toBeGreaterThan(0);
  });

  it('copyCards does NOT mutate original cards', () => {
    const card = makeCard('c1');
    useClipboardStore.getState().copyCards([card], 'flow');

    const entry = useClipboardStore.getState().entry!;
    entry.cards[0].title = 'Modified';
    expect(card.title).toBe('Card');
  });

  it('pasteCards returns null when empty', () => {
    const result = useClipboardStore.getState().pasteCards();
    expect(result).toBeNull();
  });

  it('pasteCards returns entry and increments pasteCount', () => {
    const cards = [makeCard('c1')];
    useClipboardStore.getState().copyCards(cards, 'requirement');

    const entry1 = useClipboardStore.getState().pasteCards();
    expect(entry1).not.toBeNull();
    expect(entry1!.pasteCount).toBe(1);

    const entry2 = useClipboardStore.getState().pasteCards();
    expect(entry2!.pasteCount).toBe(2);
  });

  it('pasteCards refreshes TTL on each paste', () => {
    const cards = [makeCard('c1')];
    useClipboardStore.getState().copyCards(cards, 'context');
    const ts1 = useClipboardStore.getState().entry!.timestamp;

    useClipboardStore.getState().pasteCards();
    const ts2 = useClipboardStore.getState().entry!.timestamp;
    expect(ts2).toBeGreaterThanOrEqual(ts1);
  });

  it('isValid returns false when empty', () => {
    expect(useClipboardStore.getState().isValid()).toBe(false);
  });

  it('isValid returns true for fresh entry', () => {
    useClipboardStore.getState().copyCards([makeCard('c1')], 'flow');
    expect(useClipboardStore.getState().isValid()).toBe(true);
  });

  it('isValid returns false when TTL exceeded', () => {
    useClipboardStore.getState().copyCards([makeCard('c1')], 'flow');
    // Manually expire
    useClipboardStore.setState((s) => ({
      entry: s.entry ? { ...s.entry, timestamp: Date.now() - 6 * 60 * 1000 } : null,
    }));
    expect(useClipboardStore.getState().isValid()).toBe(false);
  });

  it('pasteCards returns null when expired', () => {
    useClipboardStore.getState().copyCards([makeCard('c1')], 'flow');
    useClipboardStore.setState((s) => ({
      entry: s.entry ? { ...s.entry, timestamp: Date.now() - 6 * 60 * 1000 } : null,
    }));
    const result = useClipboardStore.getState().pasteCards();
    expect(result).toBeNull();
  });

  it('clearClipboard resets entry', () => {
    useClipboardStore.getState().copyCards([makeCard('c1')], 'flow');
    useClipboardStore.getState().clearClipboard();
    expect(useClipboardStore.getState().entry).toBeNull();
    expect(useClipboardStore.getState().isValid()).toBe(false);
  });
});
