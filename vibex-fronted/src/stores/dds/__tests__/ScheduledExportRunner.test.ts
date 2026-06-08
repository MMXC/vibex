import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock ZipExporter so exportWithWebhook is a no-op in jsdom
vi.mock('@/services/export/ZipExporter', () => ({
  ZipExporter: class {
    async exportWithWebhook() {
      return { zipBlob: new Blob(), postStatus: 200 };
    }
  },
}));

// ── helpers ───────────────────────────────────────────────────────────────────
function makeExport(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    id: overrides.id ?? 'e1',
    name: 'Daily Backup',
    canvasId: 'canvas-1',
    format: 'json',
    frequency: 'daily',
    enabled: true,
    webhookUrl: 'https://example.com/webhook',
    nextRunAt: new Date(Date.now() + 3_600_000).toISOString(),
    lastRunAt: null,
    successCount: 0,
    errorCount: 0,
    lastError: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Live store state shared between runner and tests
const liveScheduledExports: Record<string, any> = {};

describe('ScheduledExportRunner', () => {
  beforeEach(async () => {
    Object.keys(liveScheduledExports).forEach((k) => delete liveScheduledExports[k]);

    const { resetRunnerInstance } = await import(
      '../../../services/export/ScheduledExportRunner'
    );
    resetRunnerInstance();
  });

  afterEach(async () => {
    const { resetRunnerInstance, stopScheduler } = await import(
      '../../../services/export/ScheduledExportRunner'
    );
    stopScheduler();
    resetRunnerInstance();
    vi.clearAllMocks();
  });

  // ── isDue unit tests ──────────────────────────────────────────────────────
  it('1. isDue returns true for past nextRunAt (enabled)', async () => {
    const { isDue } = await import(
      '../../../services/export/ScheduledExportRunner'
    );
    const past = new Date(Date.now() - 60_000);
    expect(isDue({ enabled: true, nextRunAt: past })).toBe(true);
  });

  it('2. isDue returns false for future nextRunAt', async () => {
    const { isDue } = await import(
      '../../../services/export/ScheduledExportRunner'
    );
    const future = new Date(Date.now() + 3_600_000);
    expect(isDue({ enabled: true, nextRunAt: future })).toBe(false);
  });

  it('3. isDue returns false when enabled=false', async () => {
    const { isDue } = await import(
      '../../../services/export/ScheduledExportRunner'
    );
    const past = new Date(Date.now() - 60_000);
    expect(isDue({ enabled: false, nextRunAt: past })).toBe(false);
  });

  it('4. isDue returns false when nextRunAt is null', async () => {
    const { isDue } = await import(
      '../../../services/export/ScheduledExportRunner'
    );
    expect(isDue({ enabled: true, nextRunAt: null })).toBe(false);
  });

  it('5. computeNextHour returns ISO string roughly 1h in future', async () => {
    const { computeNextHour } = await import(
      '../../../services/export/ScheduledExportRunner'
    );
    const result = computeNextHour();
    const resultMs = new Date(result).getTime();
    const now = Date.now();
    const diff = resultMs - now;
    expect(diff).toBeGreaterThanOrEqual(59 * 60 * 1000);
    expect(diff).toBeLessThanOrEqual(61 * 60 * 1000);
  });

  // ── Singleton ─────────────────────────────────────────────────────────────
  it('6. getInstance returns same instance', async () => {
    const { ScheduledExportRunner } = await import(
      '../../../services/export/ScheduledExportRunner'
    );
    const a = ScheduledExportRunner.getInstance();
    const b = ScheduledExportRunner.getInstance();
    expect(a).toBe(b);
  });

  it('7. resetRunnerInstance clears singleton', async () => {
    const { ScheduledExportRunner, resetRunnerInstance } = await import(
      '../../../services/export/ScheduledExportRunner'
    );
    const a = ScheduledExportRunner.getInstance();
    resetRunnerInstance();
    const b = ScheduledExportRunner.getInstance();
    expect(a).not.toBe(b);
  });

  // ── pollAndExecute integration tests ──────────────────────────────────────
  // Intercept useCanvasListStore.getState to return live mock state
  async function spyOnStore(mockUpdateStatus: ReturnType<typeof vi.fn>) {
    const { useCanvasListStore } = await import('@/stores/canvasListStore');
    const orig = useCanvasListStore.getState;
    const debugOrig = orig();
    console.log('[spy] orig() keys:', Object.keys(debugOrig));
    console.log('[spy] orig().scheduledExports keys:', Object.keys(debugOrig.scheduledExports ?? {}));
    // Patch useCanvasListStore so getState returns our state with liveScheduledExports
    (useCanvasListStore as any).getState = () => ({
      ...orig(),
      scheduledExports: liveScheduledExports,
      updateScheduledExportStatus: mockUpdateStatus,
    });
    return () => {
      (useCanvasListStore as any).getState = orig;
    };
  }

  it('8. pollAndExecute calls updateScheduledExportStatus for a due export', async () => {
    const mockUpdateStatus = vi.fn();
    const restore = await spyOnStore(mockUpdateStatus);
    try {
      const past = new Date(Date.now() - 60_000).toISOString();
      liveScheduledExports['e1'] = makeExport({ id: 'e1', nextRunAt: past });

      const { startScheduler } = await import(
        '../../../services/export/ScheduledExportRunner'
      );
      await startScheduler();

      expect(mockUpdateStatus).toHaveBeenCalledTimes(1);
      const [id, updates] = mockUpdateStatus.mock.calls[0] as [string, any];
      expect(id).toBe('e1');
      expect(updates).toHaveProperty('lastRunAt');
      expect(updates).toHaveProperty('nextRunAt');
    } finally {
      restore();
    }
  });

  it('9. pollAndExecute skips future exports', async () => {
    const mockUpdateStatus = vi.fn();
    const restore = await spyOnStore(mockUpdateStatus);
    try {
      const past = new Date(Date.now() - 60_000).toISOString();
      const future = new Date(Date.now() + 3_600_000).toISOString();
      liveScheduledExports['e1'] = makeExport({ id: 'e1', nextRunAt: future });
      liveScheduledExports['e2'] = makeExport({ id: 'e2', nextRunAt: past });

      const { startScheduler } = await import(
        '../../../services/export/ScheduledExportRunner'
      );
      await startScheduler();

      expect(mockUpdateStatus).toHaveBeenCalledTimes(1);
      const [id] = mockUpdateStatus.mock.calls[0] as [string, any];
      expect(id).toBe('e2');
    } finally {
      restore();
    }
  });

  it('10. pollAndExecute skips disabled exports', async () => {
    const mockUpdateStatus = vi.fn();
    const restore = await spyOnStore(mockUpdateStatus);
    try {
      const past = new Date(Date.now() - 60_000).toISOString();
      liveScheduledExports['e1'] = makeExport({
        id: 'e1',
        nextRunAt: past,
        enabled: false,
      });

      const { startScheduler } = await import(
        '../../../services/export/ScheduledExportRunner'
      );
      await startScheduler();

      expect(mockUpdateStatus).not.toHaveBeenCalled();
    } finally {
      restore();
    }
  });


  it('11. pollAndExecute processes multiple due exports', async () => {
    const calls: [string, any][] = [];
    const mockUpdateStatus = (id: string, updates: any) => {
      // Debug: log all entries in liveScheduledExports
      console.log('[mock] called with id:', id, 'entries:', Object.entries(liveScheduledExports).map(([k,v]) => k+'='+v.id));
      calls.push([id, updates]);
    };
    const restore = await spyOnStore(mockUpdateStatus as any);
    try {
      const past = new Date(Date.now() - 60_000).toISOString();
      liveScheduledExports['e1'] = makeExport({ id: 'e1', nextRunAt: past });
      liveScheduledExports['e2'] = makeExport({ id: 'e2', nextRunAt: past });

      const { startScheduler } = await import(
        '../../../services/export/ScheduledExportRunner'
      );
      await startScheduler();

      expect(calls.length).toBe(2);
      expect(calls[0][0]).toBe('e1');
      expect(calls[1][0]).toBe('e2');
    } finally {
      restore();
    }
  });

  it('12. pollAndExecute increments successCount on success', async () => {
    const mockUpdateStatus = vi.fn();
    const restore = await spyOnStore(mockUpdateStatus);
    try {
      const past = new Date(Date.now() - 60_000).toISOString();
      liveScheduledExports['e1'] = makeExport({
        id: 'e1',
        nextRunAt: past,
        successCount: 3,
      });

      const { startScheduler } = await import(
        '../../../services/export/ScheduledExportRunner'
      );
      await startScheduler();

      expect(mockUpdateStatus).toHaveBeenCalledTimes(1);
      const [, updates] = mockUpdateStatus.mock.calls[0] as [string, any];
      expect(updates.successCount).toBe(4);
    } finally {
      restore();
    }
  });
});
