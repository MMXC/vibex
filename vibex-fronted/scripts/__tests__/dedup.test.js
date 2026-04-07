/**
 * Tests for dedup.js - E1 Test Notification Deduplication
 *
 * Covers:
 * - simpleHash: deterministic, 32-bit, positive base36
 * - generateKey: format 'test:{status}:{hash}'
 * - checkDedup: skip if within 5min, allow if expired
 * - recordSend: stores timestamp, cleans up expired
 * - cache corruption: auto-rebuilds from empty
 */

const path = require('path');
const fs = require('fs');

// Use a temp cache file to avoid polluting the real one
const TEST_CACHE_FILE = path.join(__dirname, '__dedup_test_cache__.json');
process.env.DEDUP_CACHE_FILE = TEST_CACHE_FILE;
const { simpleHash, generateKey, checkDedup, recordSend } = require('../dedup');

describe('simpleHash', () => {
  it('returns a non-empty string', () => {
    const result = simpleHash('hello');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('is deterministic', () => {
    const h1 = simpleHash('test message');
    const h2 = simpleHash('test message');
    expect(h1).toBe(h2);
  });

  it('different inputs produce different hashes', () => {
    const h1 = simpleHash('foo');
    const h2 = simpleHash('bar');
    expect(h1).not.toBe(h2);
  });

  it('handles empty string', () => {
    const result = simpleHash('');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('produces positive integer in base36', () => {
    const result = simpleHash('test');
    // Result should be parseable as a positive number in base 36
    expect(parseInt(result, 36)).toBeGreaterThan(0);
  });
});

describe('generateKey', () => {
  it('returns a key with test: prefix', () => {
    const key = generateKey('passed');
    expect(key.startsWith('test:passed:')).toBe(true);
  });

  it('includes hash of message', () => {
    const key1 = generateKey('failed', 'error A');
    const key2 = generateKey('failed', 'error B');
    expect(key1).not.toBe(key2);
  });

  it('same status+message produces same key', () => {
    const key1 = generateKey('passed', 'all good');
    const key2 = generateKey('passed', 'all good');
    expect(key1).toBe(key2);
  });

  it('truncates message to 50 chars', () => {
    const long = 'a'.repeat(100);
    const key1 = generateKey('passed', long);
    const key2 = generateKey('passed', long.substring(0, 50));
    expect(key1).toBe(key2);
  });

  it('handles undefined message', () => {
    const key = generateKey('passed');
    expect(key.startsWith('test:passed:')).toBe(true);
  });
});

describe('checkDedup', () => {
  beforeEach(() => {
    // Clean up test cache
    if (fs.existsSync(TEST_CACHE_FILE)) fs.unlinkSync(TEST_CACHE_FILE);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_CACHE_FILE)) fs.unlinkSync(TEST_CACHE_FILE);
  });

  it('returns skipped=false for new key', () => {
    const key = generateKey('passed', 'fresh');
    const result = checkDedup(key);
    expect(result.skipped).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns skipped=true immediately after recordSend', () => {
    const key = generateKey('passed', 'dup');
    recordSend(key);
    const result = checkDedup(key);
    expect(result.skipped).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
    expect(result.remaining).toBeLessThanOrEqual(300);
  });

  it('skipped=false after expiry (mock time)', async () => {
    const key = generateKey('passed', 'expiry');

    // Write a cache entry that expired 1 second ago
    const expiredTime = Date.now() - (5 * 60 * 1000) - 1000;
    fs.writeFileSync(TEST_CACHE_FILE, JSON.stringify({ [key]: expiredTime }), 'utf8');

    const result = checkDedup(key);
    expect(result.skipped).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe('recordSend', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_CACHE_FILE)) fs.unlinkSync(TEST_CACHE_FILE);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_CACHE_FILE)) fs.unlinkSync(TEST_CACHE_FILE);
  });

  it('creates cache file after recording', () => {
    const key = generateKey('passed', 'new');
    expect(fs.existsSync(TEST_CACHE_FILE)).toBe(false);
    recordSend(key);
    expect(fs.existsSync(TEST_CACHE_FILE)).toBe(true);
  });

  it('records current timestamp', () => {
    const key = generateKey('passed', 'timestamp');
    const before = Date.now();
    recordSend(key);
    const after = Date.now();

    const cache = JSON.parse(fs.readFileSync(TEST_CACHE_FILE, 'utf8'));
    expect(cache[key]).toBeGreaterThanOrEqual(before);
    expect(cache[key]).toBeLessThanOrEqual(after);
  });

  it('cleans up expired entries', () => {
    const activeKey = generateKey('passed', 'active');
    const expiredKey = 'test:expired:00000';

    const now = Date.now();
    const cacheData = {
      [activeKey]: now,
      [expiredKey]: now - (5 * 60 * 1000) - 1000, // expired
    };
    fs.writeFileSync(TEST_CACHE_FILE, JSON.stringify(cacheData), 'utf8');

    recordSend(activeKey);

    const cache = JSON.parse(fs.readFileSync(TEST_CACHE_FILE, 'utf8'));
    expect(cache[expiredKey]).toBeUndefined(); // cleaned up
    expect(cache[activeKey]).toBeDefined(); // still present
  });
});

describe('cache corruption handling', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_CACHE_FILE)) fs.unlinkSync(TEST_CACHE_FILE);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_CACHE_FILE)) fs.unlinkSync(TEST_CACHE_FILE);
  });

  it('rebuilds cache from empty if file is empty', () => {
    fs.writeFileSync(TEST_CACHE_FILE, '', 'utf8');
    const key = generateKey('passed', 'empty');
    const result = checkDedup(key);
    expect(result.skipped).toBe(false);
  });

  it('rebuilds cache from empty if file is corrupt JSON', () => {
    fs.writeFileSync(TEST_CACHE_FILE, '{ invalid json }', 'utf8');
    const key = generateKey('passed', 'corrupt');
    const result = checkDedup(key);
    expect(result.skipped).toBe(false);
    expect(fs.existsSync(TEST_CACHE_FILE)).toBe(false); // deleted
  });
});
