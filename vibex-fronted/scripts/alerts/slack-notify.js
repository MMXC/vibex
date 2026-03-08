#!/usr/bin/env node
/**
 * Slack Coverage Alert
 * 覆盖率下降时发送 Slack 告警
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CONFIG = require(path.join(PROJECT_ROOT, 'coverage.config.js'));

// 环境变量
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || '#dev';

/**
 * 发送 Slack 消息
 */
async function sendSlackMessage(message, blocks = null) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('⚠️  SLACK_WEBHOOK_URL not set, skipping notification');
    console.log('Message:', JSON.stringify(message, null, 2));
    return { ok: false, error: 'WEBHOOK_URL_NOT_SET' };
  }

  const payload = {
    text: message,
    channel: SLACK_CHANNEL,
    ...(blocks && { blocks }),
  };

  return new Promise((resolve, reject) => {
    const url = new URL(SLACK_WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch {
          resolve({ ok: res.statusCode === 200, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * 构建覆盖率下降的 Slack 消息
 */
function buildCoverageAlert(coverageResults) {
  const { results, baseline, current } = coverageResults;
  
  const lines = results.map(r => {
    const icon = r.blocked ? '🔴' : r.change < 0 ? '⚠️' : '✅';
    return `${icon} ${r.metric}: ${r.baseline.toFixed(2)}% → ${r.current.toFixed(2)}% (${r.change > 0 ? '+' : ''}${r.change}%)`;
  });

  return {
    text: `🔴 Coverage Regression Detected!`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔴 Coverage Regression Alert',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Baseline:* ${baseline}\n*Current:* ${current}`,
        },
      },
      {
        type: 'section',
        fields: results.map(r => ({
          type: 'mrkdwn',
          text: `${r.metric}: ${r.baseline.toFixed(2)}% → ${r.current.toFixed(2)}%`,
        })),
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Coverage Report',
              emoji: true,
            },
            url: `${process.env.CI_PIPELINE_URL || '#'}`,
            action_id: 'view_coverage',
          },
        ],
      },
    ],
  };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  // 检查是否需要发送告警
  const dryRun = args.includes('--dry-run');
  const message = args.includes('--message') 
    ? args[args.indexOf('--message') + 1] 
    : null;

  if (message) {
    const result = await sendSlackMessage(message);
    console.log('Result:', JSON.stringify(result, null, 2));
    return;
  }

  // 检查是否有覆盖率结果文件
  const resultsPath = path.join(PROJECT_ROOT, 'coverage', 'diff-results.json');
  
  if (fs.existsSync(resultsPath)) {
    const coverageResults = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    
    if (coverageResults.hasRegression) {
      const alert = buildCoverageAlert(coverageResults);
      
      if (dryRun) {
        console.log('📝 Dry run - would send:', JSON.stringify(alert, null, 2));
      } else {
        const result = await sendSlackMessage(alert.text, alert.blocks);
        console.log('Slack notification result:', JSON.stringify(result, null, 2));
        
        if (!result.ok) {
          process.exit(1);
        }
      }
    } else {
      console.log('✅ No coverage regression, skipping alert');
    }
  } else {
    console.log('⚠️  No coverage results found');
  }
}

main().catch(console.error);
