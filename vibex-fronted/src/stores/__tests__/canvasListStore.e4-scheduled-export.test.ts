/**
 * canvasListStore.e4-scheduled-export.test.ts — S78-E4 scheduled export & webhook
 *
 * Tests:
 * 1. parseCronNextRun — all cron expression formats
 * 2. isValidCronExpression — valid vs invalid expressions
 * 3. matchCronField — individual field matching
 * 4. addScheduledExport — store action
 * 5. removeScheduledExport — store action
 * 6. getScheduledExport — store action
 * 7. updateScheduledExportStatus — toggle enabled + error/success
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================
// CRON PARSING TESTS
// ============================================================

// Dynamically import the module-level helpers from canvasListStore.ts
// They are exported from the module for testing purposes.
// We use vi.mock + dynamic import to test them without triggering IndexedDB.

describe('parseCronNextRun', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00+08:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses every-minute wildcard (* * * * *)', () => {
    const { parseCronNextRun } = require('@/stores/canvasListStore');
    const result = parseCronNextRun('* * * * *');
    // Next run = current time + 1 minute
    expect(result).toBeInstanceOf(Date);
    expect(result!.getMinutes()).toBe(1);
  });

  it('parses hourly at minute 30 (30 * * * *)', () => {
    const { parseCronNextRun } = require('@/stores/canvasListStore');
    const result = parseCronNextRun('30 * * * *');
    expect(result!.getMinutes()).toBe(30);
  });

  it('parses daily at 09:00 (0 9 * * *)', () => {
    const { parseCronNextRun } = require('@/stores/canvasListStore');
    const result = parseCronNextRun('0 9 * * *');
    expect(result!.getHours()).toBe(9);
    expect(result!.getMinutes()).toBe(0);
  });

  it('parses every-N minutes (*/15 * * * *)', () => {
    const { parseCronNextRun } = require('@/stores/canvasListStore');
    // 10:00 → next */15 is 10:15
    const result = parseCronNextRun('*/15 * * * *');
    expect(result!.getMinutes()).toBe(15);
    expect(result!.getHours()).toBe(10);
  });

  it('parses every-N hours (* */3 * * *)', () => {
    const { parseCronNextRun } = require('@/stores/canvasListStore');
    // 10:00 → next hour divisible by 3 = 12:00
    const result = parseCronNextRun('0 */3 * * *');
    expect(result!.getHours()).toBe(12);
  });

  it('parses comma-separated minutes (0,30 * * * *)', () => {
    const { parseCronNextRun } = require('@/stores/canvasListStore');
    // 10:00 → next comma match = 10:30
    const result = parseCronNextRun('0,30 * * * *');
    expect(result!.getMinutes()).toBe(30);
    expect(result!.getHours()).toBe(10);
  });

  it('parses range (0 9-17 * * 1-5)', () => {
    const { parseCronNextRun } = require('@/stores/canvasListStore');
    // Monday 2026-06-15 at 10:00 → next within 9-17 and Mon-Fri = 10:00 (already within)
    const result = parseCronNextRun('0 9-17 * * 1-5');
    expect(result!.getHours()).toBeGreaterThanOrEqual(9);
    expect(result!.getHours()).toBeLessThanOrEqual(17);
    expect([1, 2, 3, 4, 5]).toContain(result!.getDay());
  });

  it('returns null for invalid expression', () => {
    const { parseCronNextRun } = require('@/stores/canvasListStore');
    expect(parseCronNextRun('not-a-cron')).toBeNull();
    expect(parseCronNextRun('99 * * * *')).toBeNull();
    expect(parseCronNextRun('* 25 * * *')).toBeNull();
  });

  it('respects from parameter', () => {
    const { parseCronNextRun } = require('@/stores/canvasListStore');
    const from = new Date('2026-06-15T10:00:00+08:00');
    const result = parseCronNextRun('0 9 * * *', from);
    // Should find next 09:00 after "from", not system time
    // 09:00 is before 10:00 → advance to next day
    expect(result!.getHours()).toBe(9);
    expect(result!.getDate()).toBe(16);
  });
});

describe('isValidCronExpression', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for valid expressions', () => {
    const { isValidCronExpression } = require('@/stores/canvasListStore');
    expect(isValidCronExpression('* * * * *')).toBe(true);
    expect(isValidCronExpression('0 9 * * *')).toBe(true);
    expect(isValidCronExpression('*/15 * * * *')).toBe(true);
    expect(isValidCronExpression('0 9-17 * * 1-5')).toBe(true);
    expect(isValidCronExpression('30 14 1 * *')).toBe(true);
  });

  it('returns false for invalid expressions', () => {
    const { isValidCronExpression } = require('@/stores/canvasListStore');
    expect(isValidCronExpression('invalid')).toBe(false);
    expect(isValidCronExpression('99 * * * *')).toBe(false);
    expect(isValidCronExpression('* 25 * * *')).toBe(false);
    expect(isValidCronExpression('')).toBe(false);
  });
});

// ============================================================
// MATCH CRON FIELD TESTS
// ============================================================

describe('matchCronField', () => {
  const { matchCronField } = require('@/stores/canvasListStore');

  it('matches wildcard', () => {
    expect(matchCronField('*', 5, 0, 59)).toBe(true);
    expect(matchCronField('*', 12, 0, 23)).toBe(true);
  });

  it('matches exact value', () => {
    expect(matchCronField('5', 5, 0, 59)).toBe(true);
    expect(matchCronField('12', 12, 0, 23)).toBe(true);
    expect(matchCronField('5', 6, 0, 59)).toBe(false);
  });

  it('matches */n step', () => {
    expect(matchCronField('*/15', 0, 0, 59)).toBe(true);
    expect(matchCronField('*/15', 15, 0, 59)).toBe(true);
    expect(matchCronField('*/15', 30, 0, 59)).toBe(true);
    expect(matchCronField('*/15', 7, 0, 59)).toBe(false);
  });

  it('matches comma-separated', () => {
    expect(matchCronField('0,30', 0, 0, 59)).toBe(true);
    expect(matchCronField('0,30', 30, 0, 59)).toBe(true);
    expect(matchCronField('0,30', 15, 0, 59)).toBe(false);
  });

  it('matches range', () => {
    expect(matchCronField('9-17', 9, 0, 23)).toBe(true);
    expect(matchCronField('9-17', 12, 0, 23)).toBe(true);
    expect(matchCronField('9-17', 17, 0, 23)).toBe(true);
    expect(matchCronField('9-17', 8, 0, 23)).toBe(false);
    expect(matchCronField('9-17', 18, 0, 23)).toBe(false);
  });
});

// ============================================================
// SCHEDULED EXPORT STORE ACTION TESTS
// ============================================================

// Mock the entire ddsPersistence module to prevent IndexedDB calls
vi.mock('@/services/dds/ddsPersistence', () => ({
  loadLatestSnapshot: vi.fn().mockResolvedValue(null),
}));

// Mock canvasListStore itself to isolate action tests
// We test the action functions by directly manipulating the store state

describe('ScheduledExport store actions', () => {
  // We need to test the actions on the actual store
  // Since the store uses module-level singleton pattern, we use getState()
  // We mock IndexedDB availability to prevent auto-init

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00+08:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('addScheduledExport creates a new export schedule', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    const store = useCanvasListStore.getState();

    // Clear any existing schedules
    store.$reset();

    store.addScheduledExport(
      'canvas-123',
      'My Test Canvas',
      '0 9 * * *',
      'https://example.com/webhook',
      'png'
    );

    const exports = store.scheduledExports;
    expect(Object.keys(exports).length).toBe(1);

    const exportItem = Object.values(exports)[0];
    expect(exportItem.canvasId).toBe('canvas-123');
    expect(exportItem.canvasName).toBe('My Test Canvas');
    expect(exportItem.cronExpression).toBe('0 9 * * *');
    expect(exportItem.webhookUrl).toBe('https://example.com/webhook');
    expect(exportItem.format).toBe('png');
    expect(exportItem.enabled).toBe(true);
    expect(exportItem.lastRunAt).toBeNull();
    expect(exportItem.lastError).toBeNull();
    expect(exportItem.successCount).toBe(0);
    expect(exportItem.nextRunAt).toBeInstanceOf(Date);
    expect(exportItem.nextRunAt!.getHours()).toBe(9);

    // Cleanup
    store.$reset();
  });

  it('removeScheduledExport deletes a schedule', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    const store = useCanvasListStore.getState();
    store.$reset();

    store.addScheduledExport('c1', 'Canvas 1', '* * * * *', 'https://e.com/wh', 'png');
    store.addScheduledExport('c2', 'Canvas 2', '0 9 * * *', 'https://e.com/wh2', 'svg');

    const allIds = Object.keys(store.scheduledExports);
    expect(allIds.length).toBe(2);

    store.removeScheduledExport(allIds[0]!);
    expect(Object.keys(store.scheduledExports).length).toBe(1);
    expect(store.scheduledExports[allIds[0]!]).toBeUndefined();
    expect(store.scheduledExports[allIds[1]!]).toBeDefined();

    store.$reset();
  });

  it('getScheduledExport returns correct schedule', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    const store = useCanvasListStore.getState();
    store.$reset();

    store.addScheduledExport('c1', 'Canvas 1', '* * * * *', 'https://e.com/wh', 'png');
    store.addScheduledExport('c2', 'Canvas 2', '0 9 * * *', 'https://e.com/wh2', 'svg');

    const c1Id = Object.keys(store.scheduledExports).find(
      (id) => store.scheduledExports[id]!.canvasId === 'c1'
    )!;
    const c2Id = Object.keys(store.scheduledExports).find(
      (id) => store.scheduledExports[id]!.canvasId === 'c2'
    )!;

    const result1 = store.getScheduledExport(c1Id);
    expect(result1).not.toBeNull();
    expect(result1!.canvasId).toBe('c1');
    expect(result1!.format).toBe('png');

    const result2 = store.getScheduledExport(c2Id);
    expect(result2).not.toBeNull();
    expect(result2!.canvasId).toBe('c2');
    expect(result2!.format).toBe('svg');

    // Non-existent ID
    expect(store.getScheduledExport('non-existent-id')).toBeNull();

    store.$reset();
  });

  it('updateScheduledExportStatus toggles enabled', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    const store = useCanvasListStore.getState();
    store.$reset();

    store.addScheduledExport('c1', 'Canvas 1', '* * * * *', 'https://e.com/wh', 'png');

    const id = Object.keys(store.scheduledExports)[0]!;
    expect(store.scheduledExports[id]!.enabled).toBe(true);

    store.updateScheduledExportStatus(id, false);
    expect(store.scheduledExports[id]!.enabled).toBe(false);

    store.updateScheduledExportStatus(id, true);
    expect(store.scheduledExports[id]!.enabled).toBe(true);

    store.$reset();
  });

  it('updateScheduledExportStatus records success', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    const store = useCanvasListStore.getState();
    store.$reset();

    store.addScheduledExport('c1', 'Canvas 1', '* * * * *', 'https://e.com/wh', 'png');
    const id = Object.keys(store.scheduledExports)[0]!;

    vi.useRealTimers();
    vi.setSystemTime(new Date('2026-06-15T12:30:00+08:00'));

    store.updateScheduledExportStatus(id, true, undefined, 'https://e.com/wh');

    const updated = store.scheduledExports[id]!;
    expect(updated.lastRunAt).toBeInstanceOf(Date);
    expect(updated.lastError).toBeNull();
    expect(updated.successCount).toBe(1);

    // Second success
    store.updateScheduledExportStatus(id, true, undefined, 'https://e.com/wh');
    expect(store.scheduledExports[id]!.successCount).toBe(2);

    store.$reset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00+08:00'));
  });

  it('updateScheduledExportStatus records error', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    const store = useCanvasListStore.getState();
    store.$reset();

    store.addScheduledExport('c1', 'Canvas 1', '* * * * *', 'https://e.com/wh', 'png');
    const id = Object.keys(store.scheduledExports)[0]!;

    store.updateScheduledExportStatus(id, false, 'Webhook POST failed: 500');

    const updated = store.scheduledExports[id]!;
    expect(updated.lastError).toBe('Webhook POST failed: 500');
    expect(updated.lastRunAt).toBeInstanceOf(Date);
    // Error does not increment successCount
    expect(updated.successCount).toBe(0);
    // Error disables the schedule
    expect(updated.enabled).toBe(false);

    store.$reset();
  });

  it('$reset clears scheduledExports', async () => {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    const store = useCanvasListStore.getState();

    store.addScheduledExport('c1', 'Canvas 1', '* * * * *', 'https://e.com/wh', 'png');
    expect(Object.keys(store.scheduledExports).length).toBe(1);

    store.$reset();
    expect(Object.keys(store.scheduledExports).length).toBe(0);
  });
});
