#!/usr/bin/env node
/**
 * Vulnerability Report Generator
 * 生成 Markdown 漏洞报告并支持 Slack 通知
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const VULN_DIR = path.join(PROJECT_ROOT, 'test-results', 'vulnerabilities');
const REPORT_JSON = path.join(VULN_DIR, 'vulnerability-report.json');
const REPORT_MD = path.join(VULN_DIR, 'vulnerability-report.md');

/**
 * 修复建议映射
 */
const FIX_SUGGESTIONS = {
  'axios': '升级到最新版本: npm install axios@latest',
  'next': '升级到最新 LTS 版本: npm install next@latest',
  'react': '升级到最新版本: npm install react@latest react-dom@latest',
  'mermaid': '升级到最新版本: npm install mermaid@latest',
  'default': '运行 npm update 更新所有依赖',
};

/**
 * 获取修复建议
 */
function getFixSuggestion(pkg) {
  for (const [key, suggestion] of Object.entries(FIX_SUGGESTIONS)) {
    if (pkg.toLowerCase().includes(key)) {
      return suggestion;
    }
  }
  return FIX_SUGGESTIONS.default;
}

/**
 * 生成 Markdown 报告
 */
function generateMarkdownReport(data) {
  const { summary, vulnerabilities, metadata } = data;
  
  const lines = [
    '# 🔒 依赖漏洞扫描报告',
    '',
    `**扫描时间**: ${new Date(metadata.scannedAt).toLocaleString('zh-CN')}`,
    `**项目版本**: ${metadata.version || 'N/A'}`,
    '',
    '## 📊 漏洞概览',
    '',
    '| 严重程度 | 数量 |',
    '|---------|------|',
    `| 🔴 Critical | ${summary.critical} |`,
    `| 🟠 High | ${summary.high} |`,
    `| 🟡 Moderate | ${summary.moderate} |`,
    `| 🟢 Low | ${summary.low} |`,
    '',
  ];
  
  if (vulnerabilities.length > 0) {
    lines.push('## 🔍 漏洞详情', '');
    lines.push('| 包名 | 严重程度 | 标题 | 修复建议 |');
    lines.push('|------|---------|------|---------|');
    
    for (const vuln of vulnerabilities) {
      const fix = getFixSuggestion(vuln.package);
      lines.push(`| \`${vuln.package}\` | ${vuln.severity} | ${vuln.title} | ${fix} |`);
    }
    
    lines.push('');
    lines.push('## 🛠️ 修复步骤', '');
    lines.push('```bash');
    lines.push('# 更新所有依赖');
    lines.push('npm update');
    lines.push('');
    lines.push('# 或更新特定包');
    lines.push('npm install <package-name>@latest');
    lines.push('```');
  } else {
    lines.push('✅ **未发现漏洞！**');
  }
  
  lines.push('');
  lines.push('---');
  lines.push('*此报告由自动化漏洞扫描系统生成*');
  
  return lines.join('\n');
}

/**
 * 生成 Slack 消息
 */
function generateSlackMessage(data) {
  const { summary } = data;
  
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔒 依赖漏洞扫描报告',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Critical:*\n${summary.critical}`,
        },
        {
          type: 'mrkdwn',
          text: `*High:*\n${summary.high}`,
        },
        {
          type: 'mrkdwn',
          text: `*Moderate:*\n${summary.moderate}`,
        },
        {
          type: 'mrkdwn',
          text: `*Low:*\n${summary.low}`,
        },
      ],
    },
  ];
  
  if (summary.total > 0) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '查看完整报告',
            emoji: true,
          },
          url: `${process.env.CI_PIPELINE_URL || '#'}/test-results/vulnerabilities/vulnerability-report.md`,
        },
      ],
    });
  }
  
  return blocks;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const format = args.includes('--slack') ? 'slack' : 'markdown';
  
  // 读取 JSON 报告
  if (!fs.existsSync(REPORT_JSON)) {
    console.error('❌ 未找到漏洞报告，请先运行 npm run scan:vuln');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(REPORT_JSON, 'utf-8'));
  
  if (format === 'markdown') {
    const md = generateMarkdownReport(data);
    fs.writeFileSync(REPORT_MD, md);
    console.log(`📄 报告已生成: ${REPORT_MD}`);
  } else if (format === 'slack') {
    const slack = generateSlackMessage(data);
    console.log(JSON.stringify(slack, null, 2));
  }
}

main();
