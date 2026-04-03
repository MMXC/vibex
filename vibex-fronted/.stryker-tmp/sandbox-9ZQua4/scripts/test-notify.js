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
// @ts-nocheck


const https = require('https');
const http = require('http');

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
  
  const message = getMessage();
  const payload = JSON.stringify(message);
  
  const url = new URL(config.webhookUrl);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Test notification sent successfully');
          resolve();
        } else {
          console.log(`⚠️ Notification failed: ${res.statusCode}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('⚠️ Notification error:', err.message);
      resolve(); // Don't block on notification error
    });
    
    req.write(payload);
    req.end();
  });
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
