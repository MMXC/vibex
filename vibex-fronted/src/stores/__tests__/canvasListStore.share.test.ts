/**
 * canvasListStore.share.test.ts — Sprint82 E3: Canvas Share Store Tests
 * Tests the actual E3 implementation: shareLinks field on canvas objects,
 * openShareDialog, closeShareDialog, addShareLink, removeShareLink
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasListStore } from '../canvasListStore';

// Mock IndexedDB for addShareLink/removeShareLink using setTimeout-based async resolution
vi.stubGlobal('indexedDB', {
  open: vi.fn(() => {
    const req = {
      onsuccess: null as ((() => void) | null) | null,
      onerror: null as ((() => void) | null) | null,
      result: {
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(() => {
              const r = { onsuccess: null as ((() => void) | null) | null, onerror: null as ((() => void) | null) | null };
              r.onsuccess = vi.fn(() => {});
              return r;
            }),
            put: vi.fn(() => {
              const r = {
                onsuccess: null as ((() => void) | null) | null,
                onerror: null as ((() => void) | null) | null,
              };
              r.onsuccess = vi.fn(() => {});
              setTimeout(() => { if (r.onsuccess) r.onsuccess(); }, 0);
              return r;
            }),
          })),
        })),
      },
    };
    req.onsuccess = vi.fn(() => {});
    setTimeout(() => { if (req.onsuccess) req.onsuccess(); }, 0);
    return req;
  }),
});

function getCanvasShareLinks(canvasId: string): Array<{ token: string; role: string; createdAt: string; expiresAt: string | null }> {
  const canvas = useCanvasListStore.getState().canvases.find(c => c.id === canvasId);
  return (canvas as any)?.shareLinks ?? [];
}

describe('canvasListStore — Share Extension (E3)', () => {
  beforeEach(() => {
    useCanvasListStore.getState().$reset();
    vi.clearAllMocks();
    useCanvasListStore.setState({
      canvases: [
        { id: 'c1', name: 'Canvas 1', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-02', shareLinks: [] },
        { id: 'c2', name: 'Canvas 2', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-03', shareLinks: [] },
      ],
      shareDialogCanvasId: null,
      isShareLoading: false,
      shareError: null,
    });
  });

  // ============================================================
  // Initial State
  // ============================================================

  it('has correct initial share state', () => {
    const state = useCanvasListStore.getState();
    expect(state.shareDialogCanvasId).toBeNull();
    expect(state.isShareLoading).toBe(false);
    expect(state.shareError).toBeNull();
    expect(getCanvasShareLinks('c1')).toEqual([]);
  });

  // ============================================================
  // openShareDialog / closeShareDialog
  // ============================================================

  it('openShareDialog sets shareDialogCanvasId', () => {
    useCanvasListStore.getState().openShareDialog('c1');
    expect(useCanvasListStore.getState().shareDialogCanvasId).toBe('c1');
  });

  it('openShareDialog clears previous shareError', () => {
    useCanvasListStore.setState({ shareError: 'Some error' });
    useCanvasListStore.getState().openShareDialog('c1');
    expect(useCanvasListStore.getState().shareError).toBeNull();
  });

  it('openShareDialog clears loading state', () => {
    useCanvasListStore.setState({ isShareLoading: true, shareError: 'old error' });
    useCanvasListStore.getState().openShareDialog('c1');
    const state = useCanvasListStore.getState();
    expect(state.shareError).toBeNull();
    expect(state.shareDialogCanvasId).toBe('c1');
  });

  it('closeShareDialog clears shareDialogCanvasId', () => {
    useCanvasListStore.getState().openShareDialog('c1');
    useCanvasListStore.getState().closeShareDialog();
    expect(useCanvasListStore.getState().shareDialogCanvasId).toBeNull();
  });

  it('closeShareDialog clears all share state', () => {
    useCanvasListStore.setState({
      shareDialogCanvasId: 'c1',
      shareError: 'error',
      isShareLoading: true,
    });
    useCanvasListStore.getState().closeShareDialog();
    const state = useCanvasListStore.getState();
    expect(state.shareDialogCanvasId).toBeNull();
    expect(state.shareError).toBeNull();
    expect(state.isShareLoading).toBe(false);
  });

  // ============================================================
  // addShareLink
  // ============================================================

  it('addShareLink sets isShareLoading true then false on success', async () => {
    const p = useCanvasListStore.getState().addShareLink('c1', 'tok123', 'editor', null);
    expect(useCanvasListStore.getState().isShareLoading).toBe(true);
    await new Promise(r => setTimeout(r, 20));
    await p;
    expect(useCanvasListStore.getState().isShareLoading).toBe(false);
  });

  it('addShareLink adds token to canvas shareLinks', async () => {
    await useCanvasListStore.getState().addShareLink('c1', 'tok123', 'editor', null);
    await new Promise(r => setTimeout(r, 20));
    const links = getCanvasShareLinks('c1');
    expect(links.some(l => l.token === 'tok123' && l.role === 'editor')).toBe(true);
  });

  it('addShareLink replaces existing token if same token', async () => {
    await useCanvasListStore.getState().addShareLink('c1', 'tok123', 'viewer', null);
    await new Promise(r => setTimeout(r, 20));
    await useCanvasListStore.getState().addShareLink('c1', 'tok123', 'editor', null);
    await new Promise(r => setTimeout(r, 20));
    const links = getCanvasShareLinks('c1');
    const tokLinks = links.filter(l => l.token === 'tok123');
    expect(tokLinks).toHaveLength(1);
    expect(tokLinks[0].role).toBe('editor');
  });

  it('addShareLink accumulates multiple tokens', async () => {
    await useCanvasListStore.getState().addShareLink('c1', 'tok1', 'viewer', null);
    await new Promise(r => setTimeout(r, 20));
    await useCanvasListStore.getState().addShareLink('c1', 'tok2', 'editor', null);
    await new Promise(r => setTimeout(r, 20));
    const links = getCanvasShareLinks('c1');
    expect(links.some(l => l.token === 'tok1')).toBe(true);
    expect(links.some(l => l.token === 'tok2')).toBe(true);
    expect(links).toHaveLength(2);
  });

  // ============================================================
  // removeShareLink
  // ============================================================

  it('removeShareLink removes token from canvas shareLinks', async () => {
    // Pre-populate shareLinks directly in the canvas object
    useCanvasListStore.setState({
      canvases: [
        { id: 'c1', name: 'Canvas 1', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-02',
          shareLinks: [
            { token: 'tok1', role: 'viewer', createdAt: '2026-01-01', expiresAt: null },
            { token: 'tok2', role: 'editor', createdAt: '2026-01-01', expiresAt: null },
          ] },
        { id: 'c2', name: 'Canvas 2', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-03', shareLinks: [] },
      ],
    });
    await useCanvasListStore.getState().removeShareLink('c1', 'tok1');
    await new Promise(r => setTimeout(r, 20));
    const links = getCanvasShareLinks('c1');
    expect(links.some(l => l.token === 'tok1')).toBe(false);
    expect(links.some(l => l.token === 'tok2')).toBe(true);
  });

  it('removeShareLink does nothing if token not found', async () => {
    useCanvasListStore.setState({
      canvases: [
        { id: 'c1', name: 'Canvas 1', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-02',
          shareLinks: [{ token: 'tok1', role: 'viewer', createdAt: '2026-01-01', expiresAt: null }] },
      ],
    });
    await useCanvasListStore.getState().removeShareLink('c1', 'nonexistent');
    const links = getCanvasShareLinks('c1');
    expect(links).toHaveLength(1);
  });

  // ============================================================
  // $reset
  // ============================================================

  it('$reset clears all share state', () => {
    useCanvasListStore.setState({
      shareDialogCanvasId: 'c1',
      isShareLoading: true,
      shareError: 'some error',
    });
    useCanvasListStore.getState().$reset();
    const state = useCanvasListStore.getState();
    expect(state.shareDialogCanvasId).toBeNull();
    expect(state.isShareLoading).toBe(false);
    expect(state.shareError).toBeNull();
  });
});
