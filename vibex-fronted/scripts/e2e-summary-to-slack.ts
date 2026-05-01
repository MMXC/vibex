/**
 * e2e-summary-to-slack.ts — Generate E2E summary report for Slack
 * 
 * Reads test results from playwright-report/ and posts to Slack webhook.
 * 
 * Usage:
 *   pnpm run e2e:summary:slack
 */

interface E2EResult {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  artifactsUrl: string;
}

async function loadTestResults(): Promise<E2EResult> {
  const resultsPath = './vibex-fronted/playwright-report/results.json';
  try {
    const fs = await import('fs');
    if (!fs.existsSync(resultsPath)) {
      return { passed: 0, failed: 0, skipped: 0, duration: 0, artifactsUrl: '' };
    }
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    const stats = data.stats ?? {};
    return {
      passed: stats.passed ?? 0,
      failed: stats.failed ?? 0,
      skipped: stats.skipped ?? 0,
      duration: stats.duration ?? 0,
      artifactsUrl: process.env.GITHUB_ARTIFACT_URL ?? '',
    };
  } catch {
    return { passed: 0, failed: 0, skipped: 0, duration: 0, artifactsUrl: '' };
  }
}

function formatSlackMessage(result: E2EResult): string {
  const emoji = result.failed > 0 ? ':x:' : ':white_check_mark:';
  const durationSec = (result.duration / 1000).toFixed(1);
  
  let msg = `*E2E Test Summary* (${process.env.GITHUB_RUN_NUMBER ?? 'local'})\n`;
  msg += `${emoji} Passed: ${result.passed} | Failed: ${result.failed} | Skipped: ${result.skipped}\n`;
  msg += `:clock1: Duration: ${durationSec}s\n`;
  
  if (result.artifactsUrl) {
    msg += `:link: <${result.artifactsUrl}|View HTML Report>`;
  }
  
  return msg;
}

async function postToSlack(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[e2e-summary] SLACK_WEBHOOK_URL not set — skipping Slack notification');
    return;
  }
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });
  
  if (!response.ok) {
    console.error(`[e2e-summary] Slack webhook failed: ${response.status}`);
  }
}

async function main() {
  const result = await loadTestResults();
  const message = formatSlackMessage(result);
  
  console.log(message);
  
  // Only post to Slack in CI on failure, or every 5 consecutive passes
  if (process.env.CI) {
    const isFailure = result.failed > 0;
    const shouldNotify = isFailure || (result.passed > 0 && result.failed === 0);
    
    if (shouldNotify) {
      await postToSlack(message);
    }
  }
}

main().catch((err) => {
  console.error('[e2e-summary] Error:', err);
  process.exit(1);
});