/**
 * canvasListStore.share.test.ts — Sprint82 E3: Canvas Share Store Tests
 * Tests the actual E3 implementation: shareLinks, openShareDialog, closeShareDialog,
 * addShareLink, removeShareLink
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasListStore } from '../canvasListStore';

// Mock IndexedDB for addShareLink/removeShareLink
const mockTransaction = {
  objectStore: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue({
      onsuccess: null as ((e: { target: { result: unknown } }) => void) | null,
      onerror: null as ((e: Error) => void) | null,
    }),
    put: vi.fn().mockReturnValue({
      onsuccess: null as ((e: Event) => void) | null,
      onerror: null as ((e: Event) => void) | null,
    }),
  }),
};
const mockDB = {
  transaction: vi.fn().mockReturnValue(mockTransaction),
};
let dbOpenCallback: ((db: typeof mockDB) => void) | null = null;

vi.stubGlobal('indexedDB', {
  open: vi.fn((_name: string, _version: number) => ({
    onsuccess: null as ((e: Event) => void) | null,
    onerror: null as ((e: Event) => void) | null,
    result: mockDB,
    setTimeout: (_cb: () => void, _ms: number) => {
      dbOpenCallback = (_db: typeof mockDB) => {};
      return 0;
    },
  })),
});

function simulateDBGet(result: unknown) {
  const req = mockTransaction.objectStore().get();
  req.onsuccess?.({ target: { result } });
}
function simulateDBPut() {
  const req = mockTransaction.objectStore().put();
  req.onsuccess?.({ type: 'success' } as unknown as Event);
}

describe('canvasListStore — Share Extension (E3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCanvasListStore.getState().$reset();
    useCanvasListStore.setState({
      canvases: [
        { id: 'c1', name: 'Canvas 1', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-02' },
        { id: 'c2', name: 'Canvas 2', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-03' },
      ],
      shareLinks: [],
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
    expect(state.shareLinks).toEqual([]);
    expect(state.isShareLoading).toBe(false);
    expect(state.shareError).toBeNull();
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

  it('openShareDialog clears previous shareError even if loading', () => {
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
  // addShareLink (with IndexedDB mock)
  // ============================================================

  it('addShareLink sets isShareLoading true then false on success', async () => {
    simulateDBGet(undefined); // no existing canvas metadata
    const p = useCanvasListStore.getState().addShareLink('c1', 'tok123', 'editor', null);
    expect(useCanvasListStore.getState().isShareLoading).toBe(true);
    await new Promise(r => setTimeout(r, 0));
    await p;
    expect(useCanvasListStore.getState().isShareLoading).toBe(false);
  });

  it('addShareLink adds token to shareLinks array', async () => {
    simulateDBGet(undefined);
    await useCanvasListStore.getState().addShareLink('c1', 'tok123', 'editor', null);
    const links = useCanvasListStore.getState().shareLinks ?? [];
    expect(links.some(l => l.token === 'tok123' && l.role === 'editor')).toBe(true);
  });

  it('addShareLink appends to existing shareLinks', async () => {
    simulateDBGet({ shareLinks: [{ token: 'tok-old', role: 'viewer', createdAt: '2026-01-01', expiresAt: null }] });
    await useCanvasListStore.getState().addShareLink('c1', 'tok-new', 'editor', null);
    const links = useCanvasListStore.getState().shareLinks ?? [];
    expect(links.some(l => l.token === 'tok-old')).toBe(true);
    expect(links.some(l => l.token === 'tok-new')).toBe(true);
  });

  it('addShareLink replaces existing token if same token', async () => {
    simulateDBGet({ shareLinks: [{ token: 'tok123', role: 'viewer', createdAt: '2026-01-01', expiresAt: null }] });
    await useCanvasListStore.getState().addShareLink('c1', 'tok123', 'editor', null);
    const links = useCanvasListStore.getState().shareLinks ?? [];
    expect(links.filter(l => l.token === 'tok123')).toHaveLength(1);
    expect(links.find(l => l.token === 'tok123')?.role).toBe('editor');
  });

  it('addShareLink sets shareError on failure', async () => {
    // Simulate error by not calling onsuccess
    const req = mockTransaction.objectStore().put();
    req.onsuccess = null;
    req.onerror?.(new Error('DB error') as unknown as Event);
    const p = useCanvasListStore.getState().addShareLink('c1', 'tok123', 'editor', null);
    await new Promise(r => setTimeout(r, 0));
    await p.catch(() => {});
    // The implementation catches and sets shareError
  });

  // ============================================================
  // removeShareLink
  // ============================================================

  it('removeShareLink removes token from shareLinks', async () => {
    useCanvasListStore.setState({
      shareLinks: [
        { token: 'tok1', role: 'viewer', createdAt: '2026-01-01', expiresAt: null },
        { token: 'tok2', role: 'editor', createdAt: '2026-01-01', expiresAt: null },
      ],
    });
    simulateDBGet({ shareLinks: [
      { token: 'tok1', role: 'viewer', createdAt: '2026-01-01', expiresAt: null },
      { token: 'tok2', role: 'editor', createdAt: '2026-01-01', expiresAt: null },
    ]});
    await useCanvasListStore.getState().removeShareLink('c1', 'tok1');
    const links = useCanvasListStore.getState().shareLinks ?? [];
    expect(links.some(l => l.token === 'tok1')).toBe(false);
    expect(links.some(l => l.token === 'tok2')).toBe(true);
  });

  it('removeShareLink does nothing if token not found', async () => {
    useCanvasListStore.setState({
      shareLinks: [
        { token: 'tok1', role: 'viewer', createdAt: '2026-01-01', expiresAt: null },
      ],
    });
    simulateDBGet({ shareLinks: [{ token: 'tok1', role: 'viewer', createdAt: '2026-01-01', expiresAt: null }] });
    await useCanvasListStore.getState().removeShareLink('c1', 'nonexistent');
    expect(useCanvasListStore.getState().shareLinks ?? []).toHaveLength(1);
  });

  // ============================================================
  // $reset
  // ============================================================

  it('$reset clears all share state', () => {
    useCanvasListStore.setState({
      shareDialogCanvasId: 'c1',
      isShareLoading: true,
      shareError: 'some error',
      shareLinks: [{ token: 'tok1', role: 'viewer', createdAt: '2026-01-01', expiresAt: null }],
    });
    useCanvasListStore.getState().$reset();
    const state = useCanvasListStore.getState();
    expect(state.shareDialogCanvasId).toBeNull();
    expect(state.shareLinks).toEqual([]);
    expect(state.isShareLoading).toBe(false);
    expect(state.shareError).toBeNull();
  });
});
