/**
 * API Change Notifier
 * Sends notifications for API changes via GitHub PR comments and Slack
 */

import fs from 'fs';
import path from 'path';

import { devLog, safeError } from '@/lib/log-sanitizer';

interface ChangeReport {
  baseline: string;
  current: string;
  timestamp: string;
  summary: {
    breaking: number;
    nonBreaking: number;
    info: number;
  };
  changes: Array<{
    type: 'BREAKING' | 'NON_BREAKING' | 'INFO';
    category: string;
    path: string;
    description: string;
    before?: string;
    after?: string;
  }>;
}

interface NotificationConfig {
  github?: {
    owner: string;
    repo: string;
    token: string;
    prNumber?: number;
  };
  slack?: {
    webhookUrl: string;
    channel: string;
  };
}

// ==================== GitHub PR Comment ====================

async function createGitHubPRComment(
  config: NotificationConfig['github'],
  report: ChangeReport
): Promise<void> {
  if (!config || !config.owner || !config.repo || !config.token) {
    devLog('⚠️ GitHub config not provided, skipping PR comment');
    return;
  }

  const body = generatePRCommentBody(report);
  
  const url = config.prNumber
    ? `https://api.github.com/repos/${config.owner}/${config.repo}/issues/${config.prNumber}/comments`
    : `https://api.github.com/repos/${config.owner}/${config.repo}/pulls/${config.prNumber}/comments`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    devLog(`✅ PR comment created: ${result.html_url}`);
  } catch (error) {
    safeError('❌ Failed to create PR comment:', error);
    throw error;
  }
}

function generatePRCommentBody(report: ChangeReport): string {
  const { summary, changes } = report;
  
  let body = `## 📊 API 变更报告
  
**生成时间**: ${new Date(report.timestamp).toLocaleString()}

### 📈 变更摘要

| 类型 | 数量 |
|------|------|
| 🔴 Breaking Changes | ${summary.breaking} |
| 🟢 Non-Breaking Changes | ${summary.nonBreaking} |
| 🔵 Info Changes | ${summary.info} |

`;

  if (changes.length === 0) {
    body += `### ✅ 无变更检测到

未发现 API 变更，您的更改是向后兼容的。
`;
  } else {
    // Group changes by type
    const breaking = changes.filter(c => c.type === 'BREAKING');
    const nonBreaking = changes.filter(c => c.type === 'NON_BREAKING');
    const info = changes.filter(c => c.type === 'INFO');

    if (breaking.length > 0) {
      body += `### 🔴 Breaking Changes (${breaking.length})

| 路径 | 描述 |
|------|-------|
`;
      for (const change of breaking.slice(0, 10)) {
        body += `| \`${change.path}\` | ${change.description} |\n`;
      }
      if (breaking.length > 10) {
        body += `\n*...还有 ${breaking.length - 10} 个变更*\n`;
      }
      body += '\n';
    }

    if (nonBreaking.length > 0) {
      body += `### 🟢 Non-Breaking Changes (${nonBreaking.length})

`;
      for (const change of nonBreaking.slice(0, 5)) {
        body += `- ${change.description}\n`;
      }
      if (nonBreaking.length > 5) {
        body += `\n*...还有 ${nonBreaking.length - 5} 个变更*\n`;
      }
      body += '\n';
    }

    if (info.length > 0) {
      body += `### 🔵 Info Changes (${info.length})

`;
      for (const change of info.slice(0, 3)) {
        body += `- ${change.description}\n`;
      }
      body += '\n';
    }
  }

  body += `---
*此报告由 VibeX API Change Tracker 自动生成*`;

  return body;
}

// ==================== Slack Notification ====================

async function sendSlackNotification(
  config: NotificationConfig['slack'],
  report: ChangeReport
): Promise<void> {
  if (!config || !config.webhookUrl) {
    devLog('⚠️ Slack config not provided, skipping notification');
    return;
  }

  const { summary, changes } = report;
  
  // Build Slack message
  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 API 变更报告',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*🔴 Breaking Changes:*\n${summary.breaking}`,
        },
        {
          type: 'mrkdwn',
          text: `*🟢 Non-Breaking:*\n${summary.nonBreaking}`,
        },
      ],
    },
  ];

  // Add breaking changes section if any
  const breaking = changes.filter(c => c.type === 'BREAKING');
  if (breaking.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🔴 Breaking Changes (${breaking.length}):*\n${breaking.slice(0, 5).map(c => `• ${c.description}`).join('\n')}${breaking.length > 5 ? `\n...还有 ${breaking.length - 5} 个` : ''}`,
      },
    });
  }

  // Add footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `生成时间: ${new Date(report.timestamp).toLocaleString()} | 由 VibeX API Change Tracker 自动生成`,
      },
    ],
  });

  // Color for attachment
  const color = summary.breaking > 0 ? 'danger' : summary.nonBreaking > 0 ? 'warning' : 'good';

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attachments: [
          {
            color,
            blocks,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Slack API error: ${response.status} - ${error}`);
    }

    devLog('✅ Slack notification sent');
  } catch (error) {
    safeError('❌ Failed to send Slack notification:', error);
    throw error;
  }
}

// ==================== Main Notifier ====================

export async function notifyChanges(
  reportPath: string,
  config: NotificationConfig
): Promise<void> {
  // Load report
  const report: ChangeReport = JSON.parse(
    fs.readFileSync(reportPath, 'utf-8')
  );

  devLog('📤 Sending notifications...');
  devLog(`  Breaking: ${report.summary.breaking}`);
  devLog(`  Non-Breaking: ${report.summary.nonBreaking}`);
  devLog(`  Info: ${report.summary.info}`);

  // Send GitHub PR comment
  if (config.github) {
    await createGitHubPRComment(config.github, report);
  }

  // Send Slack notification
  if (config.slack) {
    await sendSlackNotification(config.slack, report);
  }

  devLog('✅ All notifications sent');
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    devLog('Usage: node notifier.js <report.json> [config.json]');
    devLog('');
    devLog('Example:');
    devLog('  node notifier.js change-report.json config.json');
    process.exit(1);
  }

  const [reportPath, configPath] = args;
  
  // Load config
  const config: NotificationConfig = configPath
    ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    : {};

  notifyChanges(reportPath, config).catch((error) => {
    safeError('❌ Notification failed:', error);
    process.exit(1);
  });
}

export { notifyChanges, createGitHubPRComment, sendSlackNotification };
export type { ChangeReport, NotificationConfig };
