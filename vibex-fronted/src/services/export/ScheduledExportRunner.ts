/**
 * ScheduledExportRunner — Singleton scheduler for timed canvas exports
 * S79-E1: 定时导出执行引擎
 *
 * Responsibilities:
 * - Singleton pattern: only one runner instance per app lifecycle
 * - Poll every 60s for due scheduled exports
 * - Call ZipExporter.exportWithWebhook for each due task
 * - Update lastRunAt / lastError / nextRunAt via canvasListStore
 * - Cleanup on stopScheduler()
 *
 * Constraints:
 * - No any types
 * - No canvasLogger.default.debug
 * - No custom setTimeout wrapping (uses native setInterval)
 */

import { ZipExporter } from './ZipExporter';
import { useCanvasListStore } from '@/stores/canvasListStore';
import type { ScheduledExport } from '@/stores/canvasListStore';

/** Minimum interval between polls (ms) */
const POLL_INTERVAL_MS = 60_000; // 60 seconds

/** Next-run-at check: is the export due to run now? */
export function isDue(export_: ScheduledExport): boolean {
  if (!export_.enabled) return false;
  if (!export_.nextRunAt) return false;
  const next = new Date(export_.nextRunAt).getTime();
  return next <= Date.now();
}

/** Compute next run time by advancing by 1 hour from now. */
export function computeNextHour(): string {
  const next = new Date();
  next.setHours(next.getHours() + 1);
  return next.toISOString();
}

let _instance: ScheduledExportRunner | null = null;
let _intervalId: ReturnType<typeof setInterval> | null = null;

/** Exported for testing — resets singleton between tests */
export function resetRunnerInstance(): void {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
  _instance = null;
}

/** Standalone start — delegates to singleton instance */
export function startScheduler(): Promise<void> {
  return ScheduledExportRunner.getInstance().startScheduler();
}

/** Standalone stop — delegates to singleton instance */
export function stopScheduler(): void {
  if (_instance) {
    _instance.stopScheduler();
  }
}

export class ScheduledExportRunner {
  private running = false;

  /** Get the singleton instance, creating it if needed */
  static getInstance(): ScheduledExportRunner {
    if (!_instance) {
      _instance = new ScheduledExportRunner();
    }
    return _instance;
  }

  /** Start polling every POLL_INTERVAL_MS */
  startScheduler(): Promise<void> {
    if (this.running) return Promise.resolve();
    this.running = true;

    // Run immediately on start
    const immediate = this.pollAndExecute().catch((err) => {
      console.error('[ScheduledExportRunner] poll error:', err);
    });

    _intervalId = setInterval(() => {
      this.pollAndExecute().catch((err) => {
        console.error('[ScheduledExportRunner] poll error:', err);
      });
    }, POLL_INTERVAL_MS);

    return immediate;
  }

  /** Stop polling and clear the interval */
  stopScheduler(): void {
    if (!_intervalId) return;
    clearInterval(_intervalId);
    _intervalId = null;
    this.running = false;
  }

  /**
   * Poll for due exports and execute each one.
   * Catches errors per-task so one failure doesn't break others.
   */
  async pollAndExecute(): Promise<void> {
    if (!this.running) return;

    const store = useCanvasListStore.getState();
    const allExports = Object.values(store.scheduledExports);

    for (let _i = 0; _i < allExports.length; _i++) {
      const export_ = allExports[_i];
      if (!isDue(export_)) continue;

      const { id, canvasId, webhookUrl } = export_;

      try {
        const zipExporter = new ZipExporter();
        await zipExporter.exportWithWebhook(
          canvasId,
          { format: 'png', scope: 'all' },
          webhookUrl,
        );

        // Update store: mark success + advance nextRunAt
        const nextRunAt = computeNextHour();
        store.updateScheduledExportStatus(id, {
          lastRunAt: new Date().toISOString(),
          lastError: null,
          successCount: (export_.successCount ?? 0) + 1,
          nextRunAt,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[ScheduledExportRunner] Export failed for ${id}:`, message);

        store.updateScheduledExportStatus(id, {
          lastRunAt: new Date().toISOString(),
          lastError: message,
          nextRunAt: computeNextHour(),
        });
      }
    }
  }

  /** Returns true if the scheduler is currently running */
  isRunning(): boolean {
    return this.running;
  }
}
