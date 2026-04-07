/**
 * Test Result Notification Script
 * 
 * Sends test results to notification channels (Slack, etc.)
 * Runs after test completion without blocking the main flow.
 * 
 * Usage:
 *   node scripts/test-notify.js --status passed --duration 120s
 *   node scripts/test-notify.js --status failed --duration 120s --errors 3
 * 
 * Environment Variables:
 *   CI_NOTIFY_WEBHOOK - Slack webhook URL
 *   CI_NOTIFY_ENABLED - Enable notifications (default: false in dev, true in CI)
 */

const https = require('https');
const http = require('http');
const { checkDedup, recordSend, generateKey } = require('./dedup');

// E2: Retry config — exponential backoff
const RETRY_CONFIG = { maxAttempts: 3, delays: [1000, 2000, 4000] };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sendWithRetry(url, payload) {
  let lastError;
  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === 'https:';
  const lib = isHttps ? https : http;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts + 1; attempt++) {
    try {
      const body = JSON.stringify(payload);
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      };

      const response = await new Promise((resolve, reject) => {
        const req = lib.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode }));
        });
        req.on('error', reject);
        // E2: 5s timeout per attempt
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
        req.write(body);
        req.end();
      });

      if (response.ok) {
        return { success: true, attempts: attempt };
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
      // Don't retry on timeout
      if (err.message === 'timeout') break;
    }
    if (attempt <= RETRY_CONFIG.maxAttempts) {
      console.log(`⏳ Retry ${attempt}/${RETRY_CONFIG.maxAttempts} in ${RETRY_CONFIG.delays[attempt - 1]}ms...`);
      await sleep(RETRY_CONFIG.delays[attempt - 1]);
    }
  }
  console.error(`[Notify] All ${RETRY_CONFIG.maxAttempts + 1} attempts failed:`, lastError?.message);
  return { success: false, attempts: RETRY_CONFIG.maxAttempts + 1 };
}

// Parse command line arguments
const args = process.argv.slice(2);
const status = args.includes('--status') 
  ? args[args.indexOf('--status') + 1] 
  : 'unknown';
const duration = args.includes('--duration') 
  ? args[args.indexOf('--duration') + 1] 
  : 'N/A';
const errors = args.includes('--errors') 
  ? parseInt(args[args.indexOf('--errors') + 1]) 
  : 0;
const tests = args.includes('--tests') 
  ? parseInt(args[args.indexOf('--tests') + 1]) 
  : 0;

// Configuration
const config = {
  webhookUrl: process.env.CI_NOTIFY_WEBHOOK,
  enabled: process.env.CI_NOTIFY_ENABLED === 'true' || process.env.CI === 'true',
  projectName: process.env.CI_PROJECT_NAME || 'VibeX',
  branch: process.env.CI_BRANCH || 'main',
  commit: process.env.CI_COMMIT?.slice(0, 7) || 'unknown',
};

// Build message
const getMessage = () => {
  const emoji = status === 'passed' ? '✅' : '❌';
  const color = status === 'passed' ? '#10b981' : '#ef4444';
  
  return {
    attachments: [{
      color,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} Test ${status === 'passed' ? 'Passed' : 'Failed'}`,
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Project:*\n${config.projectName}`
            },
            {
              type: 'mrkdwn',
              text: `*Branch:*\n${config.branch}`
            },
            {
              type: 'mrkdwn',
              text: `*Duration:*\n${duration}`
            },
            {
              type: 'mrkdwn',
              text: `*Tests:*\n${tests}`
            }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Commit: \`${config.commit}\``
            }
          ]
        }
      ]
    }]
  };
};

// Send notification
const sendNotification = async () => {
  if (!config.enabled) {
    console.log('📝 CI notification disabled (CI_NOTIFY_ENABLED=false)');
    return;
  }

  if (!config.webhookUrl) {
    console.log('⚠️ CI_NOTIFY_WEBHOOK not configured, skipping notification');
    return;
  }

  // E1: Skip duplicate notifications within 5-minute window
  // dedup key must include test-specific info (tests/duration/errors)
  const message = `Test ${status}: ${tests} tests in ${duration} with ${errors} errors`;
  const dedupKey = generateKey(status, message);
  const { skipped, remaining } = checkDedup(dedupKey);
  if (skipped) {
    console.log(`⏭️  Skip duplicate notification (${remaining}s remaining)`);
    return;
  }

  const payload = getMessage();

  // E2: Use retry with exponential backoff
  const result = await sendWithRetry(config.webhookUrl, payload);
  if (result.success) {
    console.log(`✅ Test notification sent (attempt ${result.attempts})`);
    recordSend(dedupKey);
  } else {
    console.log(`⚠️ Notification failed after ${result.attempts} attempts`);
  }
};

// Main
(async () => {
  console.log(`📊 Test Result: ${status}`);
  console.log(`⏱️  Duration: ${duration}`);
  console.log(`🧪 Tests: ${tests}`);
  console.log(`❌ Errors: ${errors}`);
  
  try {
    await sendNotification();
  } catch (err) {
    console.log('⚠️ Notification skipped due to error');
  }
  
  // Exit with appropriate code
  process.exit(status === 'passed' ? 0 : 1);
})();
