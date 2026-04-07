# Implementation Plan: Agent 每日自检任务自动机

> **项目**: agent-self-evolution-20260330-daily
> **阶段**: Phase1 — 自检标准化 + 异常检测
> **版本**: 1.0.0
> **日期**: 2026-03-30
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex

---

## 1. 概述

本文档为 Agent 每日自检任务自动机提供详细的开发执行计划。

### 1.1 目标
- **P0**: 自检工作流标准化 + 异常检测自动化
- **P1**: 自检→提案闭环 + 每日报告自动化

### 1.2 依赖关系

```
selfcheck-template.md (新建)
    ↓
selfcheck-validator.ts (新建)
    ↓
selfcheck-validator.test.ts (新建)
    ↓
actionable-collector.ts (新建)
    ↓
zombie-alert.ts (新建)
    ↓
daily-report.ts (新建)
    ↓
cron 集成 (修改)
```

---

## 2. 文件变更详情

### 2.1 新建: `docs/templates/selfcheck-template.md`

```markdown
---
agent: [agent-name]
date: [YYYY-MM-DD]
score: [1-10]
---

# Self-check Report: [agent-name]

## 今日完成 (completed)
- [ ] 完成事项 1
- [ ] 完成事项 2

## 发现问题 (issues)
- [ ] 问题 1
- [ ] 问题 2

## 改进建议 (improvements)
- [ ] 建议 1
- [ACTIONABLE] 可执行建议（将被自动收集）

## 自检评分
- 总体评分: [score]/10
- 备注: [说明]
```

### 2.2 新建: `src/scripts/selfcheck-validator.ts`

```typescript
#!/usr/bin/env npx ts-node

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_FIELDS = ['agent:', 'date:', 'score:', 'completed', 'issues', 'improvements'];

export function validateSelfCheck(doc: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 检查格式
  const hasFrontmatter = doc.startsWith('---');
  const hasTable = doc.includes('|') && doc.includes('---');
  
  if (!hasFrontmatter && !hasTable) {
    errors.push('文档必须包含 YAML frontmatter 或 Markdown table 格式');
  }
  
  // 检查必需字段
  for (const field of REQUIRED_FIELDS) {
    if (!doc.includes(field)) {
      errors.push(`缺少必需字段: ${field}`);
    }
  }
  
  // 检查 score 范围
  const scoreMatch = doc.match(/score:\s*(\d+)/);
  if (scoreMatch) {
    const score = parseInt(scoreMatch[1], 10);
    if (score < 1 || score > 10) {
      errors.push(`score 必须在 1-10 范围内，当前: ${score}`);
    }
  }
  
  // 提取 actionable 建议
  const actionableMatches = doc.match(/\[ACTIONABLE\][^\n]+/g);
  if (actionableMatches && actionableMatches.length > 0) {
    warnings.push(`发现 ${actionableMatches.length} 个可执行建议`);
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = args[0];
  
  if (!filePath) {
    console.error('Usage: selfcheck-validator.ts <file-path>');
    process.exit(1);
  }
  
  const fs = require('fs');
  const doc = fs.readFileSync(filePath, 'utf-8');
  const result = validateSelfCheck(doc);
  
  if (result.valid) {
    console.log('✅ 验证通过');
    result.warnings.forEach(w => console.log(`⚠️ ${w}`));
    process.exit(0);
  } else {
    console.log('❌ 验证失败');
    result.errors.forEach(e => console.log(`  - ${e}`));
    process.exit(1);
  }
}
```

### 2.3 新建: `src/scripts/__tests__/selfcheck-validator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateSelfCheck } from '../selfcheck-validator';

describe('SelfCheckValidator', () => {
  describe('validateSelfCheck', () => {
    it('有效文档应通过验证', () => {
      const validDoc = `---
agent: architect
date: 2026-03-30
score: 8
---
## 今日完成
- 架构设计
## 问题
- 无
## 改进
- [ACTIONABLE] 优化流程`;
      
      const result = validateSelfCheck(validDoc);
      expect(result.valid).toBe(true);
    });

    it('缺少必需字段应失败', () => {
      const invalidDoc = `---
agent: architect
---`;
      
      const result = validateSelfCheck(invalidDoc);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('score 超范围应失败', () => {
      const invalidDoc = `---
agent: architect
date: 2026-03-30
score: 15
completed: []
issues: []
improvements: []
---`;
      
      const result = validateSelfCheck(invalidDoc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('1-10'))).toBe(true);
    });

    it('提取 actionable 建议', () => {
      const doc = `## 改进建议
- [ACTIONABLE] 建议 1
- [ACTIONABLE] 建议 2`;
      
      const result = validateSelfCheck(doc);
      expect(result.warnings.some(w => w.includes('2 个可执行建议'))).toBe(true);
    });
  });
});
```

### 2.4 新建: `src/scripts/actionable-collector.ts`

```typescript
#!/usr/bin/env npx ts-node

import fs from 'fs';
import path from 'path';
import glob from 'glob';

interface ActionableItem {
  agent: string;
  suggestion: string;
  sourceFile: string;
}

function extractAgentName(filePath: string): string {
  const fileName = path.basename(filePath);
  const match = fileName.match(/^(.+)-selfcheck/);
  return match ? match[1] : 'unknown';
}

export function extractActionableSuggestions(
  docsDir: string,
  date: string
): ActionableItem[] {
  const items: ActionableItem[] = [];
  const pattern = /\[ACTIONABLE\]\s*(.+)/g;
  
  const files = glob.sync(`${docsDir}/agent-self-evolution-${date}/*-selfcheck*.md`);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const agent = extractAgentName(file);
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      items.push({
        agent,
        suggestion: match[1].trim(),
        sourceFile: file
      });
    }
  }
  
  return items;
}

export function collectToProposals(items: ActionableItem[], date: string): void {
  const proposalsDir = path.join('proposals', date);
  fs.mkdirSync(proposalsDir, { recursive: true });
  
  const outputFile = path.join(proposalsDir, 'actionable-suggestions.json');
  fs.writeFileSync(outputFile, JSON.stringify(items, null, 2));
  console.log(`✅ 已收集 ${items.length} 个建议到 ${outputFile}`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const docsDir = args[0] || 'docs';
  const date = args[1] || new Date().toISOString().split('T')[0];
  
  const items = extractActionableSuggestions(docsDir, date);
  collectToProposals(items, date);
}
```

### 2.5 新建: `src/scripts/zombie-alert.ts`

```typescript
#!/usr/bin/env npx ts-node

interface ZombieTask {
  taskId: string;
  project: string;
  assignedTo: string;
  zombieStartTime: number;
  alertCount: number;
}

interface AlertConfig {
  warningThreshold: number;
  criticalThreshold: number;
  escalationTime: number;
  reAlertInterval: number;
}

const DEFAULT_CONFIG: AlertConfig = {
  warningThreshold: 2,
  criticalThreshold: 5,
  escalationTime: 30,
  reAlertInterval: 5
};

export async function checkZombieAndAlert(
  config: AlertConfig = DEFAULT_CONFIG
): Promise<{ zombies: ZombieTask[]; alerts: string[] }> {
  const alerts: string[] = [];
  
  // 模拟从 task_manager 获取 zombie 任务
  const zombies: ZombieTask[] = [];
  
  // TODO: 集成 task_manager.getZombieTasks()
  // const zombies = await taskManager.getZombieTasks();
  
  if (zombies.length > config.criticalThreshold) {
    alerts.push(`🚨 严重: ${zombies.length} 个 zombie 任务，超过临界值 ${config.criticalThreshold}`);
    // TODO: 发送升级告警到 Slack
  } else if (zombies.length > config.warningThreshold) {
    alerts.push(`⚠️ 警告: ${zombies.length} 个 zombie 任务`);
    // TODO: 发送警告到 Slack
  }
  
  // 检查响应时间
  const now = Date.now();
  for (const zombie of zombies) {
    const responseTime = Math.floor((now - zombie.zombieStartTime) / 60000);
    if (responseTime > config.escalationTime) {
      alerts.push(`⏰ Zombie ${zombie.taskId} 响应时间超过 ${config.escalationTime}min`);
    }
  }
  
  return { zombies, alerts };
}

if (require.main === module) {
  checkZombieAndAlert()
    .then(({ zombies, alerts }) => {
      if (alerts.length > 0) {
        console.log('告警:');
        alerts.forEach(a => console.log(`  ${a}`));
      } else {
        console.log('✅ 无告警');
      }
    })
    .catch(console.error);
}
```

### 2.6 新建: `src/scripts/daily-report.ts`

```typescript
#!/usr/bin/env npx ts-node

import fs from 'fs';

interface ActionableItem {
  agent: string;
  suggestion: string;
}

interface DailyReport {
  date: string;
  generatedAt: string;
  completedProjects: number;
  totalTasks: number;
  zombieCount: number;
  suggestions: ActionableItem[];
}

export function generateDailyReport(
  date: string,
  suggestions: ActionableItem[]
): DailyReport {
  return {
    date,
    generatedAt: new Date().toISOString(),
    completedProjects: 0, // TODO: 从 task_manager 获取
    totalTasks: 0,
    zombieCount: 0,
    suggestions
  };
}

export function saveReportAsMarkdown(report: DailyReport): string {
  return `# 每日团队状态报告 - ${report.date}

## 概览
- 完成项目数: ${report.completedProjects}
- 总任务数: ${report.totalTasks}
- Zombie 任务数: ${report.zombieCount}

## 可执行改进建议
${report.suggestions.length === 0 
  ? '无' 
  : report.suggestions.map(s => `- [${s.agent}] ${s.suggestion}`).join('\n')}

---
自动生成于 ${report.generatedAt}
`;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const date = args[0] || new Date().toISOString().split('T')[0];
  
  const suggestionsPath = `proposals/${date}/actionable-suggestions.json`;
  let suggestions: ActionableItem[] = [];
  
  if (fs.existsSync(suggestionsPath)) {
    suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf-8'));
  }
  
  const report = generateDailyReport(date, suggestions);
  const markdown = saveReportAsMarkdown(report);
  
  const outputPath = `docs/daily-reports/${date}.md`;
  fs.mkdirSync(require('path').dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown);
  
  console.log(`✅ 报告已生成: ${outputPath}`);
}
```

### 2.7 修改: Cron 配置

```bash
# crontab -e

# 每日 06:00 - 自检触发
0 6 * * * cd /root/.openclaw/vibex && bash scripts/trigger-selfcheck.sh

# 每日 06:05 - 生成报告
5 6 * * * cd /root/.openclaw/vibex && npx ts-node src/scripts/daily-report.ts
```

### 2.8 新建: `scripts/trigger-selfcheck.sh`

```bash
#!/bin/bash
# 触发每日自检

DATE=$(date +%Y%m%d)

# 验证 self-check 文档格式
for doc in docs/agent-self-evolution-${DATE}/*-selfcheck*.md; do
  if [ -f "$doc" ]; then
    echo "验证: $doc"
    npx ts-node src/scripts/selfcheck-validator.ts "$doc"
  fi
done

# 收集 actionable 建议
npx ts-node src/scripts/actionable-collector.ts docs $DATE

echo "✅ 自检触发完成"
```

---

## 3. 测试策略

### 3.1 覆盖率门禁

| 文件 | 覆盖率要求 |
|------|-----------|
| `selfcheck-validator.ts` | ≥ 90% |
| `actionable-collector.ts` | ≥ 85% |
| `zombie-alert.ts` | ≥ 80% |
| `daily-report.ts` | ≥ 85% |

### 3.2 集成测试

```bash
# 验证脚本
./scripts/trigger-selfcheck.sh

# 验证报告生成
npx ts-node src/scripts/daily-report.ts 2026-03-30

# 检查输出
ls -la docs/daily-reports/
cat docs/daily-reports/2026-03-30.md
```

---

## 4. 估计工时

| 任务 | 估计 |
|------|------|
| selfcheck-template.md | 1h |
| selfcheck-validator.ts + test | 2h |
| actionable-collector.ts + test | 2h |
| zombie-alert.ts + test | 3h |
| daily-report.ts + test | 2h |
| cron 集成 | 1h |
| 代码审查 + 修复 | 2h |
| **总计** | **~13h** |

---

## 5. 验收标准

- [ ] `validateSelfCheck()` 测试覆盖率 > 90%
- [ ] 格式验证支持 frontmatter 和 table 两种格式
- [ ] actionable 建议自动收集到 `proposals/YYYYMMDD/`
- [ ] zombie > 2 时 Slack 告警触发
- [ ] 每日报告自动生成到 `docs/daily-reports/`
- [ ] Cron 执行 < 30s

---

*本文档由 Architect Agent 生成，用于约束 dev 的开发行为。*
