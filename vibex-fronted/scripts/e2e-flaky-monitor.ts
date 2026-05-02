/**
 * e2e-flaky-monitor.ts — E2E flaky test monitoring and alerting
 *
 * Reads Playwright test results from playwright-report/results.json and:
 * - Computes flaky rate for the current run
 * - Tracks recent run pass/fail history
 * - Sends Slack alerts when flaky rate exceeds threshold or 3 consecutive failures
 *
 * E2 E2E Stability — Epic2-E2E-Stability
 * C-E2-1: Integrated into CI e2e job
 */

interface TestResultStats {
  passed: number;
  failed: number;
  skipped: number;
  flaky?: number;
  duration?: number;
  retries?: number;
}

interface FlakyRegistry {
  generatedAt: string;
  runs: number;
  flakyTests: FlakyEntry[];
}

interface FlakyEntry {
  name: string;
  passRate: number;
  passes: number;
  failures: number;
  runs: number;
  skip: boolean;
  reason: string;
}

// Thresholds
const FLaky_RATE_THRESHOLD = 0.05; // 5% — alert if >5% tests fail
const RECENT_RUNS_TRACKED = 5;
const CONSECUTIVE_FAILURES_FOR_ALERT = 3;

// State file for recent run history (stored in .test-results/)
import * as fs from 'fs';
import * as path from 'path';

const STATE_FILE = path.resolve(__dirname, '../.test-results/flaky-history.json');
const RESULTS_FILE = path.resolve(__dirname, '../playwright-report/results.json');
const FLAKY_REGISTRY_FILE = path.resolve(__dirname, '../flaky-tests.json');

interface RunHistory {
  runs: Array<{ timestamp: string; passed: number; failed: number; flakyRate: number }>;
}

function loadHistory(): RunHistory {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return { runs: [] };
}

function saveHistory(history: RunHistory): void {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(history, null, 2));
}

function loadResults(): TestResultStats {
  try {
    if (fs.existsSync(RESULTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
      return data.stats ?? { passed: 0, failed: 0, skipped: 0 };
    }
  } catch {
    // ignore
  }
  return { passed: 0, failed: 0, skipped: 0 };
}

function computeFlakyRate(stats: TestResultStats): number {
  const total = stats.passed + stats.failed + stats.skipped;
  if (total === 0) return 0;
  return stats.failed / total;
}

function loadFlakyRegistry(): FlakyRegistry {
  try {
    if (fs.existsSync(FLAKY_REGISTRY_FILE)) {
      return JSON.parse(fs.readFileSync(FLAKY_REGISTRY_FILE, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return { generatedAt: '', runs: 0, flakyTests: [] };
}

function formatSlackAlert(stats: TestResultStats, flakyRate: number, history: RunHistory): string {
  const runNumber = process.env.GITHUB_RUN_NUMBER ?? 'local';
  const emoji = flakyRate > FLaky_RATE_THRESHOLD ? ':warning:' : ':x:';

  let msg = `*E2E Flaky Monitor* (Run #${runNumber})\n`;
  msg += `${emoji} Passed: ${stats.passed} | Failed: ${stats.failed} | Flaky Rate: ${(flakyRate * 100).toFixed(1)}%\n`;

  if (flakyRate > FLaky_RATE_THRESHOLD) {
    msg += `:rotating_light: Flaky rate (${(flakyRate * 100).toFixed(1)}%) exceeds threshold (5%)\n`;
  }

  // Check consecutive failures
  const recentFails = history.runs.slice(-CONSECUTIVE_FAILURES_FOR_ALERT);
  if (recentFails.length >= CONSECUTIVE_FAILURES_FOR_ALERT && recentFails.every(r => r.failed > 0)) {
    msg += `:alert: ${CONSECUTIVE_FAILURES_FOR_ALERT} consecutive failed runs detected!\n`;
  }

  // Mention flaky tests
  const registry = loadFlakyRegistry();
  if (registry.flakyTests.length > 0) {
    msg += `:skull: Known flaky: ${registry.flakyTests.map(t => t.name).join(', ')}`;
  }

  return msg;
}

async function postSlack(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[e2e-flaky-monitor] SLACK_WEBHOOK_URL not set — skipping alert');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
    if (!response.ok) {
      console.error(`[e2e-flaky-monitor] Slack webhook failed: ${response.status}`);
    } else {
      console.log('[e2e-flaky-monitor] Slack alert sent');
    }
  } catch (err) {
    console.error('[e2e-flaky-monitor] Failed to post to Slack:', err);
  }
}

async function main(): Promise<void> {
  console.log('[e2e-flaky-monitor] Starting E2E flaky monitoring...');

  // Load history first so we can always compute context
  const history = loadHistory();
  const stats = loadResults();
  const flakyRate = stats.passed + stats.failed + stats.skipped > 0
    ? computeFlakyRate(stats)
    : 0;
  const total = stats.passed + stats.failed + stats.skipped;

  console.log(`[e2e-flaky-monitor] Results: ${stats.passed} passed, ${stats.failed} failed, ${stats.skipped} skipped (total: ${total})`);
  console.log(`[e2e-flaky-monitor] Flaky rate: ${(flakyRate * 100).toFixed(1)}%`);
  console.log(`[e2e-flaky-monitor] History: ${history.runs.length} runs tracked`);

  // Skip history update if no results (avoid polluting history with zero-run entries)
  if (total === 0) {
    console.log('[e2e-flaky-monitor] No test results found — skipping history update');
    console.log('[e2e-flaky-monitor] Done');
    return;
  }

  history.runs.push({
    timestamp: new Date().toISOString(),
    passed: stats.passed,
    failed: stats.failed,
    flakyRate,
  });

  // Keep only last N runs
  if (history.runs.length > RECENT_RUNS_TRACKED) {
    history.runs = history.runs.slice(-RECENT_RUNS_TRACKED);
  }
  saveHistory(history);

  // Alert conditions:
  // - Flaky rate > 5%
  // - OR last 3 consecutive runs all had failures
  const recentFails = history.runs.slice(-3);
  const consecutiveFailures = recentFails.length >= 3 && recentFails.every(r => r.failed > 0);
  const shouldAlert = flakyRate > FLaky_RATE_THRESHOLD || consecutiveFailures;

  if (shouldAlert && process.env.CI) {
    const message = formatSlackAlert(stats, flakyRate, history);
    console.log('[e2e-flaky-monitor] Alert condition met — sending Slack notification');
    await postSlack(message);
  } else {
    console.log('[e2e-flaky-monitor] No alert needed');
  }

  console.log('[e2e-flaky-monitor] Done');
}

main().catch((err) => {
  console.error('[e2e-flaky-monitor] Fatal error:', err);
  process.exit(1);
});