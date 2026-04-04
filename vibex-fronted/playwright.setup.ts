/**
 * playwright.setup.ts — Global Playwright setup for E4 Flaky Test Governance
 *
 * Responsibilities:
 * - Load flaky-tests.json and auto-skip known flaky tests
 * - Record test results for flaky detection
 * - Set up global test timeouts and reporters
 */

// Note: skipIfFlaky() and recordTestResult() are used by test files via import
import * as fs from 'fs';
import * as path from 'path';

const FLAKY_REGISTRY_PATH = path.resolve(__dirname, 'flaky-tests.json');

// ---------------------------------------------------------------------------
// Flaky test registry loader
// ---------------------------------------------------------------------------

interface FlakyEntry {
  name: string;
  passRate: number;
  passes: number;
  failures: number;
  runs: number;
  skip: boolean;
  reason: string;
}

interface FlakyRegistry {
  generatedAt: string;
  runs: number;
  flakyTests: FlakyEntry[];
}

/**
 * Load the flaky test registry.
 * Returns empty registry if file does not exist.
 */
function loadFlakyRegistry(): FlakyRegistry {
  try {
    if (fs.existsSync(FLAKY_REGISTRY_PATH)) {
      return JSON.parse(fs.readFileSync(FLAKY_REGISTRY_PATH, 'utf-8'));
    }
  } catch {
    // ignore parse errors — use empty registry
  }
  return { generatedAt: '', runs: 0, flakyTests: [] };
}

const registry = loadFlakyRegistry();

// Log registry status
if (registry.flakyTests.length > 0) {
  console.log(
    `[E4-FlakyGov] ${registry.flakyTests.length} flaky test(s) registered. ` +
    `Skipping flaky tests in CI.`
  );
} else {
  console.log(`[E4-FlakyGov] No flaky tests registered.`);
}

// ---------------------------------------------------------------------------
// Test result recording
// ---------------------------------------------------------------------------

const TEST_RESULT_FILE = path.resolve(__dirname, '.test-results', 'test-runs.json');

export function recordTestResult(testInfo: { title: string; file: string }, passed: boolean): void {
  try {
    const dir = path.dirname(TEST_RESULT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let records: Record<string, { passed: number; failed: number }> = {};
    try {
      if (fs.existsSync(TEST_RESULT_FILE)) {
        records = JSON.parse(fs.readFileSync(TEST_RESULT_FILE, 'utf-8'));
      }
    } catch {
      records = {};
    }

    const key = `${path.basename(testInfo.file)}|${testInfo.title}`;
    if (!records[key]) {
      records[key] = { passed: 0, failed: 0 };
    }
    if (passed) {
      records[key].passed++;
    } else {
      records[key].failed++;
    }

    fs.writeFileSync(TEST_RESULT_FILE, JSON.stringify(records, null, 2));
  } catch {
    // Non-fatal: recording failure should not break tests
  }
}

// ---------------------------------------------------------------------------
// Global setup
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Ensure test output directory exists
  const outputDir = path.resolve(__dirname, '.test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
});

// ---------------------------------------------------------------------------
// Global teardown
// ---------------------------------------------------------------------------

afterAll(async () => {
  // Log summary
  const flakyCount = registry.flakyTests.length;
  if (flakyCount > 0) {
    console.log(
      `[E4-FlakyGov] ${flakyCount} flaky test(s) were skipped. ` +
      `See flaky-tests.json for details.`
    );
  }
});

// ---------------------------------------------------------------------------
// Auto-skip flaky tests
// ---------------------------------------------------------------------------

/**
 * This function is called by individual test files to check if they should be skipped.
 * Usage in test files:
 *   import { skipIfFlaky } from '../../playwright.setup';
 *   const skip = skipIfFlaky(test.info());
 *   if (skip) test.skip('Known flaky test', skip.reason);
 */
export function skipIfFlaky(
  testInfo: { title: string; file: string }
): { skip: boolean; reason?: string } {
  const flakyEntry = registry.flakyTests.find(
    (ft) =>
      ft.name.includes(testInfo.title) ||
      ft.name.includes(path.basename(testInfo.file))
  );

  if (flakyEntry && flakyEntry.skip) {
    return {
      skip: true,
      reason: `[E4-FlakyGov] ${flakyEntry.reason}`,
    };
  }

  return { skip: false };
}

/**
 * Export the registry for use in test files
 */
export { registry as flakyRegistry };
