/**
 * NotificationService — deduplication and delivery
 *
 * E2-T3: Prevents duplicate notifications within 5-minute dedup window.
 *
 * Usage:
 *   const svc = new NotificationService(env);
 *   await svc.send({ channel, text }); // skips if duplicate
 */

import crypto from 'crypto';
import type { CloudflareEnv } from '../lib/env.js';

export interface SlackNotification {
  channel: string;
  text: string;
  token?: string;
}

interface CacheEntry {
  sentAt: number;
}

const DEFAULT_DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export class NotificationService {
  private kv: CloudflareEnv['NOTIFICATION_KV'];
  private memoryCache: Map<string, number> = new Map();
  private ttlMs: number;

  constructor(env: CloudflareEnv, ttlMs = DEFAULT_DEDUP_WINDOW_MS) {
    this.kv = env.NOTIFICATION_KV;
    this.ttlMs = ttlMs;
  }

  private hash(channel: string, text: string): string {
    return crypto
      .createHash('sha256')
      .update(`${channel}:${text}`)
      .digest('hex');
  }

  private kvKey(hash: string): string {
    return `notif:${hash}`;
  }

  /**
   * Check if a notification (channel + text) is a duplicate within TTL window.
   */
  async isDuplicate(channel: string, text: string): Promise<boolean> {
    const h = this.hash(channel, text);

    // Try KV first
    if (this.kv) {
      const val = await this.kv.get(this.kvKey(h));
      if (val && typeof val === 'string') {
        const entry = JSON.parse(val) as CacheEntry;
        if (Date.now() - entry.sentAt < this.ttlMs) {
          return true;
        }
      }
    }

    // Fallback to memory cache
    const memTs = this.memoryCache.get(h);
    if (memTs !== undefined && Date.now() - memTs < this.ttlMs) {
      return true;
    }

    return false;
  }

  /**
   * Record that a notification was sent.
   */
  async recordSent(channel: string, text: string): Promise<void> {
    const h = this.hash(channel, text);
    const now = Date.now();

    // Always update memory cache
    this.memoryCache.set(h, now);

    // Persist to KV if available (5-min TTL via KV's built-in expiration)
    if (this.kv) {
      await this.kv.put(this.kvKey(h), JSON.stringify({ sentAt: now }), {
        expirationTtl: Math.ceil(this.ttlMs / 1000),
      });
    }
  }

  /**
   * Send a notification if not a duplicate.
   * Returns { skipped: true } if duplicate, { skipped: false, ok: true } if sent.
   */
  async send(notification: SlackNotification): Promise<{
    skipped?: boolean;
    ok?: boolean;
    error?: string;
  }> {
    if (await this.isDuplicate(notification.channel, notification.text)) {
      return { skipped: true };
    }

    // In production, this would call the Slack API.
    // For now, we record it as sent.
    await this.recordSent(notification.channel, notification.text);
    return { skipped: false, ok: true };
  }

  /**
   * Clear the deduplication cache (for testing).
   */
  async clearCache(): Promise<void> {
    this.memoryCache.clear();
    // Note: KV entries will expire naturally via TTL
  }
}
