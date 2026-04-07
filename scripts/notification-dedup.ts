/**
 * NotificationDedup - Prevents duplicate notifications within 5min window
 * E1-T1: Production fix for notification deduplication
 */

const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface DedupEntry {
  taskId: string;
  timestamp: number;
  channel: string;
}

export class NotificationDedup {
  private cache: Map<string, DedupEntry> = new Map();

  /**
   * Check if notification should be skipped (duplicate within 5min)
   */
  shouldSkip(taskId: string, channel: string): boolean {
    const key = this.makeKey(taskId, channel);
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    if (age < DEDUP_WINDOW_MS) {
      return true; // Still within dedup window
    }

    // Expired, remove
    this.cache.delete(key);
    return false;
  }

  /**
   * Record that a notification was sent
   */
  record(taskId: string, channel: string): void {
    const key = this.makeKey(taskId, channel);
    this.cache.set(key, {
      taskId,
      channel,
      timestamp: Date.now(),
    });
  }

  /**
   * Check existing queue state — returns "SKIP" if no change
   */
  checkExisting(taskId: string): { skip: boolean; reason: string } {
    // Check if any entry exists for this task
    for (const [, entry] of this.cache.entries()) {
      if (entry.taskId === taskId) {
        const age = Date.now() - entry.timestamp;
        if (age < DEDUP_WINDOW_MS) {
          return { skip: true, reason: `DUPLICATE: ${taskId} notified ${Math.round(age / 1000)}s ago` };
        }
      }
    }
    return { skip: false, reason: 'OK' };
  }

  private makeKey(taskId: string, channel: string): string {
    return `${channel}:${taskId}`;
  }
}

export const notificationDedup = new NotificationDedup();
