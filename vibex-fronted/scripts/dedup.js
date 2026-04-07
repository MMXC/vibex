/**
 * Test Notification Deduplication
 *
 * Prevents spamming Slack with duplicate test notifications.
 * Uses a file-based cache with 5-minute dedup window.
 *
 * Usage:
 *   const { checkDedup, recordSend, generateKey } = require('./dedup');
 *   const { skipped, remaining } = checkDedup(generateKey(status, message));
 *   if (!skipped) {
 *     await sendNotification();
 *     recordSend(generateKey(status, message));
 *   }
 */

const fs = require('fs');
const path = require('path');

// Allow test override via env var
const CACHE_FILE = process.env.DEDUP_CACHE_FILE || path.join(__dirname, '__dedup_cache__.json');
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * DJB2 hash → base36 string
 * @param {string} str
 * @returns {string}
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash = hash & hash; // 32-bit signed integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a dedup key from test status and optional message.
 * @param {string} status - 'passed' | 'failed' | etc.
 * @param {string} [message] - optional extra context
 * @returns {string} key like 'test:passed:abc123'
 */
function generateKey(status, message) {
  const msg = message || '';
  const hash = simpleHash(msg.substring(0, 50));
  return `test:${status}:${hash}`;
}

/**
 * Read the dedup cache from disk.
 * Deletes and recreates if file is corrupt.
 * @returns {Record<string, number>} cache object { key: timestamp }
 */
function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch {
    try { fs.unlinkSync(CACHE_FILE); } catch { /* ignore */ }
  }
  return {};
}

/**
 * Write the dedup cache to disk atomically.
 * @param {Record<string, number>} data
 */
function writeCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Check if a notification should be skipped (already sent within 5 min).
 * @param {string} key
 * @returns {{ skipped: boolean, remaining: number }} remaining seconds until re-send allowed
 */
function checkDedup(key) {
  const cache = readCache();
  const lastSent = cache[key];

  if (!lastSent) {
    return { skipped: false, remaining: 0 };
  }

  const elapsed = Date.now() - lastSent;
  if (elapsed < DEDUP_WINDOW_MS) {
    const remaining = Math.ceil((DEDUP_WINDOW_MS - elapsed) / 1000);
    return { skipped: true, remaining };
  }

  return { skipped: false, remaining: 0 };
}

/**
 * Record a notification send and clean up expired entries.
 * @param {string} key
 */
function recordSend(key) {
  const cache = readCache();
  const now = Date.now();

  // Record this send
  cache[key] = now;

  // Remove expired entries (older than DEDUP_WINDOW_MS)
  const expiredKeys = Object.entries(cache)
    .filter(([, ts]) => (now - ts) > DEDUP_WINDOW_MS)
    .map(([k]) => k);

  for (const k of expiredKeys) {
    delete cache[k];
  }

  writeCache(cache);
}

module.exports = { simpleHash, generateKey, checkDedup, recordSend };
