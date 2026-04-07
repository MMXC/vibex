/**
 * NotificationService — deduplication and delivery
 *
 * E2-T3: Prevents duplicate notifications within 30min window.
 *
 * Usage:
 *   const svc = new NotificationService(cacheDir);
 *   await svc.send({ channel, text }); // skips if duplicate
 */
// @ts-nocheck


import * as fs from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';

export interface SlackNotification {
  channel: string;
  text: string;
  token?: string;
}

export interface CachedNotification {
  hash: string;
  sentAt: number;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_FILE = 'notification_cache.json';

export class NotificationService {
  private cachePath: string;
  private ttlMs: number;
  private cache: Map<string, CachedNotification> = new Map();

  constructor(cacheDir = '/tmp/vibex-notifications', ttlMs = DEFAULT_TTL_MS) {
    this.cachePath = path.join(cacheDir, CACHE_FILE);
    this.ttlMs = ttlMs;
  }

  private async loadCache(): Promise<void> {
    try {
      const raw = await fs.readFile(this.cachePath, 'utf-8');
      const entries = JSON.parse(raw) as CachedNotification[];
      const now = Date.now();
      this.cache.clear();
      for (const entry of entries) {
        if (now - entry.sentAt < this.ttlMs) {
          this.cache.set(entry.hash, entry);
        }
      }
    } catch {
      this.cache.clear();
    }
  }

  private async saveCache(): Promise<void> {
    const dir = path.dirname(this.cachePath);
    await fs.mkdir(dir, { recursive: true });
    const entries = Array.from(this.cache.values());
    await fs.writeFile(this.cachePath, JSON.stringify(entries), 'utf-8');
  }

  private computeHash(channel: string, text: string): string {
    return crypto
      .createHash('sha256')
      .update(`${channel}:${text}`)
      .digest('hex');
  }

  /**
   * Check if a notification (channel + text) is a duplicate within TTL window.
   */
  isDuplicate(channel: string, text: string): boolean {
    const hash = this.computeHash(channel, text);
    const cached = this.cache.get(hash);
    if (!cached) return false;
    return Date.now() - cached.sentAt < this.ttlMs;
  }

  /**
   * Record that a notification was sent.
   */
  recordSent(channel: string, text: string): void {
    const hash = this.computeHash(channel, text);
    this.cache.set(hash, { hash, sentAt: Date.now() });
  }

  /**
   * Send a notification if not a duplicate.
   * Returns { skipped: true } if duplicate, { skipped: false, ok: true } if sent.
   */
  async send(notification: SlackNotification): Promise<{ skipped?: boolean; ok?: boolean; error?: string }> {
    await this.loadCache();

    if (this.isDuplicate(notification.channel, notification.text)) {
      return { skipped: true };
    }

    // In production, this would call the Slack API.
    // For now, we record it as sent.
    this.recordSent(notification.channel, notification.text);
    await this.saveCache();

    return { skipped: false, ok: true };
  }

  /**
   * Clear the deduplication cache (for testing).
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    await this.saveCache();
  }
}

export const notificationService = new NotificationService();
