/**
 * tests/flaky-helpers.ts — Flaky test helpers for Playwright
 *
 * Usage in test files:
 *   import { markFlaky, isFlaky } from './flaky-helpers';
 *
 * Governance:
 * - Flaky tests: skip, never delete
 * - Consecutive 5 CI runs without failure → can remove skip
 * - Update flaky-tests.json after each CI run
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FlakyOptions {
  /** Human-readable reason for flakiness */
  reason: string;
  /** Optional date to auto-remove skip (ISO date string) */
  skipAfter?: string;
  /** Expected pass rate threshold (default: 0.8) */
  passRateThreshold?: number;
}

export interface FlakyTestEntry {
  id: string;
  testFile: string;
  testName: string;
  reason: string;
  firstDetectedAt: string;
  lastFailureAt: string;
  passRate: number;
  skip: boolean;
  skipAfter?: string;
}

interface FlakyRegistry {
  generatedAt: string;
  flakyTests: FlakyTestEntry[];
}

const FLAKY_REGISTRY_PATH = path.resolve(__dirname, '..', 'flaky-tests.json');

/**
 * Load the flaky test registry
 */
export function loadRegistry(): FlakyRegistry {
  try {
    if (fs.existsSync(FLAKY_REGISTRY_PATH)) {
      return JSON.parse(fs.readFileSync(FLAKY_REGISTRY_PATH, 'utf-8'));
    }
  } catch {
    // ignore parse errors
  }
  return { generatedAt: new Date().toISOString(), flakyTests: [] };
}

/**
 * Save the flaky test registry
 */
export function saveRegistry(registry: FlakyRegistry): void {
  registry.generatedAt = new Date().toISOString();
  fs.writeFileSync(FLAKY_REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

/**
 * Generate a stable ID for a test (file-relative + title)
 */
export function testId(file: string, title: string): string {
  // Make path relative to project root
  const relative = file.replace(/.*\/(tests|e2e)\//, '$1/');
  return `${relative}::${title}`.toLowerCase().replace(/[^a-z0-9:/]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Mark a test as flaky (adds to registry, sets skip=true).
 * Use this when a test is known to be flaky but we want to keep it in CI.
 */
export function markFlaky(
  file: string,
  title: string,
  options: FlakyOptions
): void {
  const registry = loadRegistry();
  const id = testId(file, title);
  const now = new Date().toISOString();

  const existing = registry.flakyTests.find(t => t.id === id);
  if (existing) {
    existing.lastFailureAt = now;
    // Decay pass rate slightly
    existing.passRate = Math.max(0, (existing.passRate - 0.05));
  } else {
    registry.flakyTests.push({
      id,
      testFile: file,
      testName: title,
      reason: options.reason,
      firstDetectedAt: now,
      lastFailureAt: now,
      passRate: options.passRateThreshold ?? 0.65,
      skip: true,
      skipAfter: options.skipAfter,
    });
  }

  saveRegistry(registry);
}

/**
 * Check if a test is registered as flaky
 */
export function isFlaky(file: string, title: string): boolean {
  const registry = loadRegistry();
  const id = testId(file, title);
  const entry = registry.flakyTests.find(t => t.id === id);
  return entry?.skip ?? false;
}

/**
 * Get all flaky tests from registry
 */
export function getFlakyTests(): FlakyTestEntry[] {
  return loadRegistry().flakyTests;
}

/**
 * Remove a test from the flaky registry (after 5 consecutive clean CI runs)
 */
export function removeFlaky(file: string, title: string): void {
  const registry = loadRegistry();
  const id = testId(file, title);
  registry.flakyTests = registry.flakyTests.filter(t => t.id !== id);
  saveRegistry(registry);
}
