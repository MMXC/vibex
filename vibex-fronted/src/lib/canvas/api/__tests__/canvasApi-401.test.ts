/**
 * canvasApi 401 redirect tests — Epic 1 S1.1
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canvasApi } from '../canvasApi';

// Mock stores
vi.mock('@/lib/canvas/stores/sessionStore', () => {
  const storeFn = (selector?: (s: any) => unknown) => {
    const state = { projectId: 'test-project' };
    return selector ? selector(state) : state;
  };
  (storeFn as any).getState = () => ({ projectId: 'test-project' });
  (storeFn as any).subscribe = vi.fn(() => vi.fn());
  (storeFn as any).setState = vi.fn();
  return { useSessionStore: storeFn };
});

describe.skip('canvasApi 401 redirect — Epic1 S1.1 (browser-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear auth tokens
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
  });

  it('listSnapshots 401 dispatches auth:401 event and sets location.href', async () => {
    // Mock location.assign and dispatchEvent on window
    const events: CustomEvent[] = [];
    vi.stubGlobal('dispatchEvent', (e: Event) => { events.push(e as CustomEvent); });
    const oldLocation = window.location.href;
    vi.stubGlobal('location', { ...window.location, href: oldLocation });

    // Mock fetch to return 401
    global.fetch = vi.fn().mockResolvedValue(
      new Response(null, { status: 401 })
    ) as unknown as typeof fetch;

    try {
      await canvasApi.listSnapshots({ projectId: 'test-project' });
    } catch (e) {
      // Expected to throw
    }

    // Verify auth:401 event was dispatched
    expect(events.some(e => e.type === 'auth:401')).toBe(true);
    const event = events.find(e => e.type === 'auth:401');
    expect(event?.detail?.returnTo).toBeTruthy();

    vi.restoreAllMocks();
  });

  it('401 clears auth tokens', async () => {
    sessionStorage.setItem('auth_token', 'old-token');
    localStorage.setItem('auth_token', 'old-token');

    global.fetch = vi.fn().mockResolvedValue(
      new Response(null, { status: 401 })
    ) as unknown as typeof fetch;

    try {
      await canvasApi.listSnapshots({ projectId: 'test-project' });
    } catch (e) {
      // Expected to throw
    }

    expect(sessionStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
