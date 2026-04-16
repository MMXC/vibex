/**
 * canvasApi.test.ts
 *
 * E1-U1: handleResponseError async/await fix
 * Tests that backend error messages are correctly propagated through canvasApi methods.
 * Verifies: res.json() is awaited so backend error.message is thrown, not defaultMsg.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { canvasApi } from './canvasApi';

// ─── Mock fetch ───────────────────────────────────────────────────────────────
// json() is called twice: once by API method body read, once by handleResponseError
// So we store body and return it on each call
function mockFetch(jsonBody: unknown, status = 400) {
  let body = jsonBody;
  const res = {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    blob: async () => new Blob([JSON.stringify(jsonBody)], { type: 'application/json' }),
    text: async () => JSON.stringify(jsonBody),
  } as unknown as Response;

  global.fetch = vi.fn().mockResolvedValue(res);
  return res;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function mockApiUrl() {
  vi.stubGlobal('window', {
    ...window,
    location: { pathname: '/canvas', href: 'http://test/canvas' },
    sessionStorage: { getItem: () => null, removeItem: () => {} },
    localStorage: { getItem: () => null, removeItem: () => {} },
    dispatchEvent: vi.fn(),
  });
}

describe('E1-U1: handleResponseError — backend error message propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiUrl();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── AC1: 400 + { error: "..." } → throws backend error, not defaultMsg ─
  it('createProject: throws backend error field instead of defaultMsg', async () => {
    mockFetch({ error: '缺少必填字段 name' }, 400);

    let thrown: Error | undefined;
    try {
      await canvasApi.createProject({ name: '', description: '' });
    } catch (e) {
      thrown = e as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toBe('缺少必填字段 name');
    expect(thrown!.message).not.toContain('创建项目失败: 400');
  });

  it('listSnapshots: throws backend error field instead of defaultMsg', async () => {
    // Use 400 (not 404) to test JSON path; 404 has special handling that skips JSON
    mockFetch({ error: '快照不存在' }, 400);

    let thrown: Error | undefined;
    try {
      await canvasApi.listSnapshots('proj-1');
    } catch (e) {
      thrown = e as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toBe('快照不存在');
  });

  it('getSnapshot: throws backend error field instead of defaultMsg', async () => {
    mockFetch({ error: 'snapshot_id 无效' }, 400);

    let thrown: Error | undefined;
    try {
      await canvasApi.getSnapshot('invalid-id');
    } catch (e) {
      thrown = e as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toBe('snapshot_id 无效');
  });

  it('restoreSnapshot: throws backend error field instead of defaultMsg', async () => {
    mockFetch({ error: '无法恢复到旧版本' }, 409);

    let thrown: Error | undefined;
    try {
      await canvasApi.restoreSnapshot('snap-old');
    } catch (e) {
      thrown = e as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toBe('无法恢复到旧版本');
  });

  // ── AC1b: { message: "..." } fallback ─────────────────────────────────
  it('createProject: falls back to message field when error field absent', async () => {
    mockFetch({ message: '后端业务错误：会话已过期' }, 400);

    let thrown: Error | undefined;
    try {
      await canvasApi.createProject({ name: '', description: '' });
    } catch (e) {
      thrown = e as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toBe('后端业务错误：会话已过期');
  });

  it('createProject: falls back to details field when error+message absent', async () => {
    mockFetch({ details: '缺少 contextIds 参数' }, 400);

    let thrown: Error | undefined;
    try {
      await canvasApi.createProject({ name: '', description: '' });
    } catch (e) {
      thrown = e as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toBe('缺少 contextIds 参数');
  });

  // ── AC2: Non-JSON 400 → fallback to HTTP status ─────────────────────────
  it('createProject: non-JSON body → falls back to HTTP status', async () => {
    // Non-JSON: errData stays as default { error: `HTTP ${res.status}` }
    const nonJsonRes = {
      ok: false,
      status: 400,
      json: async () => { throw new Error('parse error'); },
    } as unknown as Response;
    global.fetch = vi.fn().mockResolvedValue(nonJsonRes);

    let thrown: Error | undefined;
    try {
      await canvasApi.createProject({ name: '', description: '' });
    } catch (e) {
      thrown = e as Error;
    }

    expect(thrown).toBeDefined();
    // Non-JSON: errData.error = 'HTTP 400', so message = 'HTTP 400' (defaultMsg not reached)
    expect(thrown!.message).toBe('HTTP 400');
  });

  // ── Regression: 404 still throws fixed message ──────────────────────────
  it('listSnapshots: 404 throws fixed message, not JSON body', async () => {
    mockFetch({ error: 'should not see this' }, 404);

    let thrown: Error | undefined;
    try {
      await canvasApi.listSnapshots('proj-1');
    } catch (e) {
      thrown = e as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown!.message).toBe('历史功能维护中，请稍后再试');
  });
});
