/**
 * canvasListStore.e4-scheduled-export.test.ts — S78-E4 scheduled export & webhook
 *
 * Tests:
 * 1. parseCronNextRun — all cron expression formats (returns ISO string | null)
 * 2. isValidCronExpression — valid vs invalid expressions
 * 3. addScheduledExport — store action (requires canvas in store.canvases)
 * 4. removeScheduledExport — store action
 * 5. getScheduledExport — store action
 * 6. updateScheduledExportStatus — toggle enabled + error/success
 * 7. $reset clears scheduledExports
 *
 * Key Zustand v4 pattern: getState() returns a reactive reference.
 * After set() is called inside an action, call getState() AGAIN to read updated state.
 * The stored `store` reference is a snapshot — its properties don't auto-update.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock indexedDB before importing the store module
if (typeof globalThis.indexedDB === 'undefined') {
  globalThis.indexedDB = {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
  } as unknown as IDBDatabase;
}

// CanvasMeta fields: id, name, thumbnail, createdAt, updatedAt, archivedAt?, description?, tags?
function makeCanvas(overrides = {}) {
  return {
    id: 'canvas-123',
    name: 'My Test Canvas',
    thumbnail: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-15T09:00:00.000Z',
    ...overrides,
  };
}

// ============================================================
// CRON PARSING TESTS
// parseCronNextRun(cronExpression, from?: Date = new Date())
//   → skips i=0 (current minute) to avoid returning "now" as "next"
//   → returns ISO string | null
// ============================================================

describe('parseCronNextRun', () => {
  // Use { now } so fake Date respects UTC interpretation
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-06-15T10:00:00.000Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses every-minute wildcard (* * * * *)', async () => {
    const { parseCronNextRun } = await import('@/stores/canvasListStore');
    // from=2026-06-15T10:00Z, i=0 skipped (current minute), i=1 → 10:01
    const result = parseCronNextRun('* * * * *');
    expect(result).not.toBeNull();
    const nextDate = new Date(result!);
    expect(nextDate.getUTCHours()).toBe(10);
    expect(nextDate.getUTCMinutes()).toBe(1); // next minute, not current
  });

  it('parses hourly at minute 30 (30 * * * *)', async () => {
    const { parseCronNextRun } = await import('@/stores/canvasListStore');
    // 10:00Z → next hour with minute 30 is 11:30
    const result = parseCronNextRun('30 * * * *');
    expect(result).not.toBeNull();
    const nextDate = new Date(result!);
    expect(nextDate.getUTCHours()).toBe(11);
    expect(nextDate.getUTCMinutes()).toBe(30);
  });

  it('parses daily at 09:00 (0 9 * * *)', async () => {
    const { parseCronNextRun } = await import('@/stores/canvasListStore');
    // 09:00 already passed (10:00 now) → next day 09:00
    const result = parseCronNextRun('0 9 * * *');
    expect(result).not.toBeNull();
    const nextDate = new Date(result!);
    expect(nextDate.getUTCHours()).toBe(9);
    expect(nextDate.getUTCMinutes()).toBe(0);
    expect(nextDate.getUTCDate()).toBe(16); // next day
  });

  it('parses every-N minutes (*/15 * * * *)', async () => {
    const { parseCronNextRun } = await import('@/stores/canvasListStore');
    // 10:00Z → next */15 match is 10:15
    const result = parseCronNextRun('*/15 * * * *');
    expect(result).not.toBeNull();
    const nextDate = new Date(result!);
    expect(nextDate.getUTCHours()).toBe(10);
    expect(nextDate.getUTCMinutes()).toBe(15);
  });

  it('parses every-N hours (* */3 * * *)', async () => {
    const { parseCronNextRun } = await import('@/stores/canvasListStore');
    // 10:00Z → next */3 hour with minute 0 is 12:00
    const result = parseCronNextRun('0 */3 * * *');
    expect(result).not.toBeNull();
    const nextDate = new Date(result!);
    expect(nextDate.getUTCHours()).toBe(12);
    expect(nextDate.getUTCMinutes()).toBe(0);
  });

  it('parses comma-separated minutes (0,30 * * * *)', async () => {
    const { parseCronNextRun } = await import('@/stores/canvasListStore');
    // 10:00Z → next comma match is 10:30
    const result = parseCronNextRun('0,30 * * * *');
    expect(result).not.toBeNull();
    const nextDate = new Date(result!);
    expect(nextDate.getUTCHours()).toBe(10);
    expect(nextDate.getUTCMinutes()).toBe(30);
  });

  it('parses range (0 9-17 * * 1-5)', async () => {
    const { parseCronNextRun } = await import('@/stores/canvasListStore');
    // 10:00 on Monday → hour 10 is in 9-17 range → next minute 10:01
    const result = parseCronNextRun('0 9-17 * * 1-5');
    expect(result).not.toBeNull();
    const nextDate = new Date(result!);
    expect(nextDate.getUTCHours()).toBeGreaterThanOrEqual(9);
    expect(nextDate.getUTCHours()).toBeLessThanOrEqual(17);
    expect([1, 2, 3, 4, 5]).toContain(nextDate.getUTCDay());
  });

  it('returns null for invalid expression', async () => {
    const { parseCronNextRun } = await import('@/stores/canvasListStore');
    expect(parseCronNextRun('not-a-cron')).toBeNull();
    expect(parseCronNextRun('99 * * * *')).toBeNull();
    expect(parseCronNextRun('* 25 * * *')).toBeNull();
  });

  it('respects from parameter', async () => {
    const { parseCronNextRun } = await import('@/stores/canvasListStore');
    const from = new Date('2026-06-15T10:00:00.000Z');
    // 09:00 is before 10:00 → advance to next day 09:00
    const result = parseCronNextRun('0 9 * * *', from);
    expect(result).not.toBeNull();
    const nextDate = new Date(result!);
    expect(nextDate.getUTCHours()).toBe(9);
    expect(nextDate.getUTCMinutes()).toBe(0);
    expect(nextDate.getUTCDate()).toBe(16); // next day
  });
});

describe('isValidCronExpression', () => {
  it('returns true for valid expressions', async () => {
    const { isValidCronExpression } = await import('@/stores/canvasListStore');
    expect(isValidCronExpression('* * * * *')).toBe(true);
    expect(isValidCronExpression('0 9 * * *')).toBe(true);
    expect(isValidCronExpression('*/15 * * * *')).toBe(true);
    expect(isValidCronExpression('0 9-17 * * 1-5')).toBe(true);
    expect(isValidCronExpression('30 14 1 * *')).toBe(true);
  });

  it('returns false for invalid expressions', async () => {
    const { isValidCronExpression } = await import('@/stores/canvasListStore');
    expect(isValidCronExpression('invalid')).toBe(false);
    expect(isValidCronExpression('99 * * * *')).toBe(false);
    expect(isValidCronExpression('* 25 * * *')).toBe(false);
    expect(isValidCronExpression('')).toBe(false);
  });
});

// ============================================================
// SCHEDULED EXPORT STORE ACTION TESTS
//
// Key Zustand pattern: getState() returns a reactive reference.
// After calling an action (which calls set() internally), call getState() AGAIN
// to read the updated state. The stored `store` ref is a snapshot.
//
// CanvasMeta fields: id, name, thumbnail, createdAt, updatedAt
// Pre-populate via useCanvasListStore.setState({ canvases: [...] })
// Signature: addScheduledExport(canvasId, cronExpression, webhookUrl)
// ============================================================

describe('ScheduledExport store actions', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-06-15T10:00:00.000Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('addScheduledExport creates a new export schedule', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');

    // Reset + pre-populate canvases so addScheduledExport can find the canvas
    useCanvasListStore.setState({ canvases: [makeCanvas()], scheduledExports: {} });

    // Call the action — it calls set() internally
    const id = useCanvasListStore.getState().addScheduledExport(
      'canvas-123',
      '0 9 * * *',
      'https://example.com/webhook'
    );

    expect(id).toBeTruthy();

    // IMPORTANT: call getState() again to read the UPDATED state after set()
    const updatedState = useCanvasListStore.getState();
    const exports = updatedState.scheduledExports;
    expect(Object.keys(exports).length).toBe(1);

    const exportItem = exports[id]!;
    expect(exportItem.canvasId).toBe('canvas-123');
    expect(exportItem.canvasName).toBe('My Test Canvas');
    expect(exportItem.cronExpression).toBe('0 9 * * *');
    expect(exportItem.webhookUrl).toBe('https://example.com/webhook');
    expect(exportItem.enabled).toBe(true);
    expect(exportItem.lastRunAt).toBeNull();
    expect(exportItem.lastError).toBeNull();
    expect(exportItem.successCount).toBe(0);
    expect(exportItem.nextRunAt).not.toBeNull();

    // nextRunAt should be 09:00 next day (16th) since 09:00 already passed
    const nextDate = new Date(exportItem.nextRunAt!);
    expect(nextDate.getUTCHours()).toBe(9);
    expect(nextDate.getUTCMinutes()).toBe(0);
  });

  it('addScheduledExport throws if canvas not found', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    useCanvasListStore.setState({ canvases: [], scheduledExports: {} });

    expect(() =>
      useCanvasListStore.getState().addScheduledExport('nonexistent', '* * * * *', 'https://e.com/wh')
    ).toThrow('Canvas not found');
  });

  it('addScheduledExport throws for invalid cron', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    useCanvasListStore.setState({ canvases: [makeCanvas()], scheduledExports: {} });

    expect(() =>
      useCanvasListStore.getState().addScheduledExport('canvas-123', 'not-a-cron', 'https://e.com/wh')
    ).toThrow('Invalid cron expression');
  });

  it('removeScheduledExport deletes a schedule', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    useCanvasListStore.setState({
      canvases: [
        makeCanvas({ id: 'c1', name: 'Canvas 1' }),
        makeCanvas({ id: 'c2', name: 'Canvas 2' }),
      ],
      scheduledExports: {},
    });

    const id1 = useCanvasListStore.getState().addScheduledExport('c1', '* * * * *', 'https://e.com/wh');
    const id2 = useCanvasListStore.getState().addScheduledExport('c2', '0 9 * * *', 'https://e.com/wh2');

    // Verify both exist
    let state = useCanvasListStore.getState();
    expect(Object.keys(state.scheduledExports).length).toBe(2);

    // Remove one
    state.removeScheduledExport(id1);

    // Read updated state
    state = useCanvasListStore.getState();
    expect(Object.keys(state.scheduledExports).length).toBe(1);
    expect(state.scheduledExports[id1]).toBeUndefined();
    expect(state.scheduledExports[id2]).toBeDefined();
  });

  it('getScheduledExport returns correct schedule', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    useCanvasListStore.setState({
      canvases: [
        makeCanvas({ id: 'c1', name: 'Canvas 1' }),
        makeCanvas({ id: 'c2', name: 'Canvas 2' }),
      ],
      scheduledExports: {},
    });

    const id1 = useCanvasListStore.getState().addScheduledExport('c1', '* * * * *', 'https://e.com/wh');
    const id2 = useCanvasListStore.getState().addScheduledExport('c2', '0 9 * * *', 'https://e.com/wh2');

    const result1 = useCanvasListStore.getState().getScheduledExport(id1);
    expect(result1).not.toBeNull();
    expect(result1!.canvasId).toBe('c1');

    const result2 = useCanvasListStore.getState().getScheduledExport(id2);
    expect(result2).not.toBeNull();
    expect(result2!.canvasId).toBe('c2');

    // Non-existent ID
    expect(useCanvasListStore.getState().getScheduledExport('non-existent-id')).toBeNull();
  });

  it('updateScheduledExportStatus toggles enabled', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    useCanvasListStore.setState({
      canvases: [makeCanvas({ id: 'c1', name: 'Canvas 1' })],
      scheduledExports: {},
    });

    const id = useCanvasListStore.getState().addScheduledExport('c1', '* * * * *', 'https://e.com/wh');

    expect(useCanvasListStore.getState().scheduledExports[id]!.enabled).toBe(true);

    useCanvasListStore.getState().updateScheduledExportStatus(id, { enabled: false });
    expect(useCanvasListStore.getState().scheduledExports[id]!.enabled).toBe(false);

    useCanvasListStore.getState().updateScheduledExportStatus(id, { enabled: true });
    expect(useCanvasListStore.getState().scheduledExports[id]!.enabled).toBe(true);
  });

  it('updateScheduledExportStatus records success', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    useCanvasListStore.setState({
      canvases: [makeCanvas({ id: 'c1', name: 'Canvas 1' })],
      scheduledExports: {},
    });

    const id = useCanvasListStore.getState().addScheduledExport('c1', '* * * * *', 'https://e.com/wh');

    // Advance time to simulate a successful run
    vi.useRealTimers();
    vi.setSystemTime(new Date('2026-06-15T12:30:00.000Z'));

    useCanvasListStore.getState().updateScheduledExportStatus(id, {
      lastRunAt: new Date().toISOString(),
      lastError: null,
      successCount: 1,
    });

    let state = useCanvasListStore.getState();
    expect(state.scheduledExports[id]!.lastRunAt).not.toBeNull();
    expect(state.scheduledExports[id]!.lastError).toBeNull();
    expect(state.scheduledExports[id]!.successCount).toBe(1);

    // Second success
    useCanvasListStore.getState().updateScheduledExportStatus(id, {
      lastRunAt: new Date().toISOString(),
      lastError: null,
      successCount: 2,
    });
    expect(useCanvasListStore.getState().scheduledExports[id]!.successCount).toBe(2);
  });

  it('updateScheduledExportStatus records error', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    useCanvasListStore.setState({
      canvases: [makeCanvas({ id: 'c1', name: 'Canvas 1' })],
      scheduledExports: {},
    });

    const id = useCanvasListStore.getState().addScheduledExport('c1', '* * * * *', 'https://e.com/wh');

    useCanvasListStore.getState().updateScheduledExportStatus(id, {
      lastRunAt: new Date('2026-06-15T10:05:00.000Z').toISOString(),
      lastError: 'Webhook POST failed: 500',
      successCount: 0,
      enabled: false,
    });

    const state = useCanvasListStore.getState();
    expect(state.scheduledExports[id]!.lastError).toBe('Webhook POST failed: 500');
    expect(state.scheduledExports[id]!.lastRunAt).not.toBeNull();
    expect(state.scheduledExports[id]!.successCount).toBe(0);
    expect(state.scheduledExports[id]!.enabled).toBe(false);
  });

  it('$reset clears scheduledExports', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    useCanvasListStore.setState({
      canvases: [makeCanvas({ id: 'c1', name: 'Canvas 1' })],
      scheduledExports: {},
    });

    useCanvasListStore.getState().addScheduledExport('c1', '* * * * *', 'https://e.com/wh');

    expect(Object.keys(useCanvasListStore.getState().scheduledExports).length).toBe(1);

    useCanvasListStore.getState().$reset();

    // $reset only resets scheduledExports (not canvases)
    expect(Object.keys(useCanvasListStore.getState().scheduledExports).length).toBe(0);
  });
});
