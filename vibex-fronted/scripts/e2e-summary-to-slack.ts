/**
 * e2e-summary-to-slack.ts — E2E summary report for Slack (Block Kit format)
 *
 * Reads test results from playwright-report/results.json and test-results/
 * and posts a Block Kit payload to Slack webhook.
 *
 * Usage:
 *   pnpm run e2e:summary:slack
 *
 * Environment Variables:
 *   SLACK_WEBHOOK_URL     — Slack incoming webhook URL
 *   GITHUB_RUN_NUMBER     — CI run number
 *   GITHUB_ARTIFACT_URL   — URL to uploaded HTML report
 *   CI                    — Set to "true" in CI to enable posting
 *
 * Constraints (AGENTS.md E1):
 *   - Must use Block Kit (section + context blocks), not plain text
 *   - Must include pass/fail summary
 *   - Must list failed test names when failed > 0
 *   - Must NOT throw (catch and log error; CI job exit code unchanged)
 */

interface TestStats {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

interface E2EReportPayload {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  artifactsUrl: string;
  runUrl: string;
  timestamp: string;
  failedTests: string[];
}

interface PlaywrightJsonResult {
  stats: TestStats;
  suites?: Array<{
    title?: string;
    tests?: Array<{ title?: string; status?: string }>;
  }>;
}

async function loadTestResults(): Promise<E2EReportPayload> {
  const resultsPath = './vibex-fronted/playwright-report/results.json';
  const defaultPayload: E2EReportPayload = {
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    artifactsUrl: '',
    runUrl: '',
    timestamp: new Date().toISOString(),
    failedTests: [],
  };

  try {
    const fs = await import('fs');
    if (!fs.existsSync(resultsPath)) {
      console.warn('[e2e-summary] results.json not found — returning zero stats');
      return defaultPayload;
    }

    const raw = JSON.parse(fs.readFileSync(resultsPath, 'utf-8')) as PlaywrightJsonResult;
    const stats = raw.stats ?? {};
    const failedTests: string[] = [];

    // Extract failed test titles from suites
    if (raw.suites) {
      for (const suite of raw.suites) {
        if (suite.tests) {
          for (const test of suite.tests) {
            if (test.status === 'failed') {
              failedTests.push(test.title ?? 'unknown test');
            }
          }
        }
      }
    }

    return {
      passed: stats.passed ?? 0,
      failed: stats.failed ?? 0,
      skipped: stats.skipped ?? 0,
      duration: stats.duration ?? 0,
      artifactsUrl: process.env.GITHUB_ARTIFACT_URL ?? '',
      runUrl: process.env.GITHUB_RUN_URL ?? '',
      timestamp: new Date().toISOString(),
      failedTests,
    };
  } catch (err) {
    console.error('[e2e-summary] Error reading results:', err);
    return defaultPayload;
  }
}

function buildSlackPayload(result: E2EReportPayload): object {
  const isFailure = result.failed > 0;
  const statusEmoji = isFailure ? ':x:' : ':white_check_mark:';
  const statusText = isFailure ? 'E2E Failed' : 'E2E Passed';
  const durationSec = (result.duration / 1000).toFixed(1);
  const runLabel = process.env.GITHUB_RUN_NUMBER ?? 'local';
  const runUrl = result.runUrl || null;

  // Build header block
  const headerText = runUrl
    ? `<${runUrl}|*${statusText}* — Run #${runLabel}>`
    : `*${statusText}* — Run #${runLabel}`;

  const blocks: object[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: statusText, emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${statusEmoji} *E2E Test Summary*   |   Run #${runLabel}`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Passed:* ${result.passed}`,
        },
        {
          type: 'mrkdwn',
          text: `*Failed:* ${result.failed}`,
        },
        {
          type: 'mrkdwn',
          text: `*Skipped:* ${result.skipped}`,
        },
        {
          type: 'mrkdwn',
          text: `*Duration:* ${durationSec}s`,
        },
      ],
    },
  ];

  // Add failed tests list
  if (result.failedTests.length > 0) {
    const failedLines = result.failedTests
      .slice(0, 20) // Cap at 20 to avoid payload size limit
      .map((t) => `• \`${t}\``)
      .join('\n');
    const overflow = result.failedTests.length > 20
      ? `\n_…and ${result.failedTests.length - 20} more_`
      : '';

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Failed Tests:*\n${failedLines}${overflow}`,
      },
    });
  }

  // Add artifact link if available
  if (result.artifactsUrl) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `<${result.artifactsUrl}|:link: View HTML Report>`,
        },
      ],
    });
  }

  // Add timestamp footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Report generated: ${result.timestamp}`,
      },
    ],
  });

  return { blocks };
}

async function postToSlack(payload: object): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[e2e-summary] SLACK_WEBHOOK_URL not set — skipping Slack notification');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[e2e-summary] Slack webhook failed: ${response.status} — ${text}`);
    } else {
      console.log('[e2e-summary] Slack notification sent successfully');
    }
  } catch (err) {
    // E1 constraint: NEVER throw — log only
    console.error('[e2e-summary] Error posting to Slack:', err);
  }
}

async function main(): Promise<void> {
  console.log('[e2e-summary] Loading test results...');
  const result = await loadTestResults();

  const payload = buildSlackPayload(result);

  // Log summary to console
  const durationSec = (result.duration / 1000).toFixed(1);
  console.log(`[e2e-summary] Results: passed=${result.passed} failed=${result.failed} skipped=${result.skipped} duration=${durationSec}s`);
  if (result.failedTests.length > 0) {
    console.log(`[e2e-summary] Failed tests: ${result.failedTests.join(', ')}`);
  }

  // Only post to Slack in CI
  if (process.env.CI === 'true') {
    console.log('[e2e-summary] Posting to Slack...');
    await postToSlack(payload);
  } else {
    console.log('[e2e-summary] Not in CI — skipping Slack post. Set CI=true to enable.');
  }
}

// E1 constraint: never let this script crash the CI job
main().catch((err) => {
  console.error('[e2e-summary] Unhandled error:', err);
  process.exit(0); // Exit 0 — CI job must not fail due to reporting
});
