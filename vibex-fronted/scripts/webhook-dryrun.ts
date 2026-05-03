/**
 * webhook-dryrun.ts — Validate Slack webhook URL is reachable
 *
 * Usage:
 *   pnpm run webhook:dryrun
 *
 * Environment Variables:
 *   SLACK_WEBHOOK_URL — Slack incoming webhook URL
 *
 * Exit Codes:
 *   0 — webhook is valid and reachable
 *   1 — webhook URL not set or unreachable
 *
 * This script is used by CI to validate SLACK_WEBHOOK_URL before running
 * any workflow that depends on it.
 */

interface SlackWebhookResponse {
  ok: boolean;
  error?: string;
}

async function validateWebhook(): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('[webhook-dryrun] ERROR: SLACK_WEBHOOK_URL is not set');
    console.error('[webhook-dryrun] Set the SLACK_WEBHOOK_URL environment variable');
    process.exit(1);
  }

  // Validate URL format
  try {
    new URL(webhookUrl);
  } catch {
    console.error('[webhook-dryrun] ERROR: SLACK_WEBHOOK_URL is not a valid URL');
    process.exit(1);
  }

  // Basic format check: must be hooks.slack.com
  if (!webhookUrl.includes('hooks.slack.com')) {
    console.error('[webhook-dryrun] ERROR: SLACK_WEBHOOK_URL does not look like a Slack webhook URL');
    console.error('[webhook-dryrun] Expected format: https://hooks.slack.com/services/...');
    process.exit(1);
  }

  console.log('[webhook-dryrun] Validating Slack webhook URL...');
  console.log(`[webhook-dryrun] URL: ${webhookUrl.replace(/services\/[^/]+\//, 'services/XXXXX/')}`);

  try {
    // Send a minimal test payload to validate the webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '[VibeX] Webhook dry-run test — connection verified',
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMsg = `HTTP ${response.status}`;
      try {
        const json = JSON.parse(text) as SlackWebhookResponse;
        if (json.error) errorMsg = json.error;
      } catch {
        // Use raw text if not JSON
        if (text) errorMsg = text.slice(0, 100);
      }
      console.error(`[webhook-dryrun] ERROR: Slack webhook validation failed — ${errorMsg}`);
      process.exit(1);
    }

    console.log('[webhook-dryrun] ✅ Slack webhook URL is valid and reachable');
    process.exit(0);
  } catch (err) {
    console.error('[webhook-dryrun] ERROR: Failed to reach Slack webhook URL');
    console.error('[webhook-dryrun] Network error:', err);
    process.exit(1);
  }
}

validateWebhook().catch((err) => {
  console.error('[webhook-dryrun] Unhandled error:', err);
  process.exit(1);
});