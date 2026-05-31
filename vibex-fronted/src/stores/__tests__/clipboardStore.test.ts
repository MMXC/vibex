/**
 * clipboardStore — Unit Tests
 * S46-E3: 画布节点复制/粘贴
 * S48-E5: 剪贴板跨画布粘贴
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClipboardStore } from '../clipboardStore';
import { canvasStoreRegistry } from '@/lib/canvas/canvasStoreRegistry';
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

describe('clipboardStore — S48-E5 cross-canvas paste', () => {
  beforeEach(() => {
    useClipboardStore.setState({ entry: null });
    // Clear all registry entries
    for (const key of canvasStoreRegistry.keys()) {
      canvasStoreRegistry.delete(key);
    }
    // Mock quickSave to avoid localStorage errors in tests
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(),
      getItem: vi.fn(() => null),
      removeItem: vi.fn(),
    });
  });

  it('crossCanvasPaste returns 0 when clipboard is empty', () => {
    const count = useClipboardStore.getState().crossCanvasPaste('canvas-1', 'Canvas 1');
    expect(count).toBe(0);
  });

  it('crossCanvasPaste returns 0 when clipboard is expired', () => {
    useClipboardStore.getState().copyCards([makeCard('c1')], 'requirement');
    useClipboardStore.setState((s) => ({
      entry: s.entry ? { ...s.entry, timestamp: Date.now() - 6 * 60 * 1000 } : null,
    }));
    const count = useClipboardStore.getState().crossCanvasPaste('canvas-1', 'Canvas 1');
    expect(count).toBe(0);
  });

  it('crossCanvasPaste adds cards to target canvas in registry', () => {
    useClipboardStore.getState().copyCards([makeCard('c1'), makeCard('c2')], 'flow');

    const count = useClipboardStore.getState().crossCanvasPaste('target-canvas', 'Target Canvas');

    expect(count).toBe(2);
    const canvasData = canvasStoreRegistry.get('target-canvas');
    expect(canvasData).toBeDefined();
    expect(canvasData!.chapters.requirement.cards).toHaveLength(2);
    // Cards should be copies (new IDs), not references
    expect(canvasData!.chapters.requirement.cards[0].id).not.toBe('c1');
    expect(canvasData!.chapters.requirement.cards[0].title).toBe('Card');
  });

  it('crossCanvasPaste applies offset on subsequent pastes', () => {
    useClipboardStore.getState().copyCards([makeCard('c1')], 'flow');

    // First paste
    useClipboardStore.getState().crossCanvasPaste('canvas-1', 'Canvas 1');
    // Second paste
    const entry = useClipboardStore.getState().pasteCards();
    useClipboardStore.getState().crossCanvasPaste('canvas-1', 'Canvas 1');

    const canvasData = canvasStoreRegistry.get('canvas-1');
    // Second paste should have offset of 30px (pasteCount=1 → offset=30)
    const pastedCards = canvasData!.chapters.requirement.cards;
    expect(pastedCards).toHaveLength(2);
    expect(pastedCards[1].position.x - pastedCards[0].position.x).toBe(30);
    expect(pastedCards[1].position.y - pastedCards[0].position.y).toBe(30);
  });

  it('crossCanvasPaste generates new IDs for pasted cards', () => {
    useClipboardStore.getState().copyCards([makeCard('original-id', 'My Card')], 'requirement');

    useClipboardStore.getState().crossCanvasPaste('canvas-x', 'Canvas X');

    const canvasData = canvasStoreRegistry.get('canvas-x')!;
    const pasted = canvasData.chapters.requirement.cards[0];
    expect(pasted.id).not.toBe('original-id');
    expect(pasted.title).toBe('My Card');
    expect(pasted.createdAt).toBeTruthy();
  });

  it('crossCanvasPaste does not modify source canvas (if present)', () => {
    useClipboardStore.getState().copyCards([makeCard('c1')], 'flow');

    useClipboardStore.getState().crossCanvasPaste('source-canvas', 'Source');
    useClipboardStore.getState().crossCanvasPaste('target-canvas', 'Target');

    const source = canvasStoreRegistry.get('source-canvas');
    const target = canvasStoreRegistry.get('target-canvas');
    // Each canvas should have its own cards
    expect(source!.chapters.requirement.cards).toHaveLength(1);
    expect(target!.chapters.requirement.cards).toHaveLength(1);
    expect(source!.chapters.requirement.cards[0].id).not.toBe(target!.chapters.requirement.cards[0].id);
  });
});
