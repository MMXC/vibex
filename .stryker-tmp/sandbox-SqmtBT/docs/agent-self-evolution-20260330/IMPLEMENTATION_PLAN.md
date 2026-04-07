# Implementation Plan: Agent 每日自检任务框架

> **项目**: agent-self-evolution-20260330
> **阶段**: Phase1 — 自检框架标准化
> **版本**: 1.0.0
> **日期**: 2026-03-30
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex

---

## 1. 概述

本文档为 Agent 每日自检任务框架提供详细的开发执行计划。

### 1.1 目标
- 建立 7 个 agent 统一的每日自检任务标准
- 确保每项自检可追踪、可验收
- 将改进建议转化为可执行提案

### 1.2 依赖关系

```
self-check-template.md (新建)
    ↓
validate-selfcheck.ts (新建)
    ↓
collect-proposals.ts (新建)
    ↓
update-learnings.ts (新建)
    ↓
HEARTBEAT.md 集成 (修改)
```

---

## 2. 文件变更详情

### 2.1 新建: `docs/templates/agent-selfcheck-template.md`

```markdown
---
agent: [agent-name]
date: [YYYY-MM-DD]
score: [1-10]
---

# [Agent] 每日自检报告

## 今日完成

| 任务 ID | 描述 | 状态 | 备注 |
|---------|------|------|------|
| - | - | - | - |

## 质量指标

| 指标 | 值 | 目标 |
|------|-----|------|
| - | - | - |

## 改进提案

- [PROPOSAL] 提案描述（将被收集）

## 经验沉淀

| ID | 情境 | 经验 | 改进 |
|----|------|------|------|
| E??? | - | - | - |
```

### 2.2 新建: `src/scripts/validate-selfcheck.ts`

```typescript
#!/usr/bin/env npx ts-node

import type { AgentSelfCheck } from '../types/self-check';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSelfCheck(doc: AgentSelfCheck): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 检查必需字段
  if (!doc.agent) errors.push('缺少 agent 字段');
  if (!doc.date) errors.push('缺少 date 字段');
  
  // 检查 score 范围
  if (!doc.score || doc.score < 1 || doc.score > 10) {
    errors.push('score 必须在 1-10 范围内');
  }
  
  // 检查任务完成数
  if (doc.tasksCompleted.length === 0) {
    warnings.push('今日无任务完成');
  }
  
  // 检查提案
  if (doc.proposals.length === 0) {
    warnings.push('未提交改进提案');
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = args[0];
  
  if (!filePath) {
    console.error('Usage: validate-selfcheck.ts <file-path>');
    process.exit(1);
  }
  
  const fs = require('fs');
  const yaml = require('js-yaml');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 解析 frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.error('❌ 缺少 YAML frontmatter');
    process.exit(1);
  }
  
  const frontmatter = yaml.load(frontmatterMatch[1]);
  const result = validateSelfCheck(frontmatter);
  
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

### 2.3 新建: `src/scripts/__tests__/validate-selfcheck.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateSelfCheck } from '../validate-selfcheck';
import type { AgentSelfCheck } from '../../types/self-check';

describe('SelfCheck Validation', () => {
  it('完整自检应通过验证', () => {
    const valid: AgentSelfCheck = {
      agent: 'architect',
      date: '2026-03-30',
      tasksCompleted: [{ taskId: 't1', description: 'test', status: 'completed' }],
      qualityMetrics: {},
      proposals: [{ text: '优化流程', priority: 'P1', status: 'pending' }],
      lessonsLearned: [],
      score: 8
    };
    
    const result = validateSelfCheck(valid);
    expect(result.valid).toBe(true);
  });

  it('缺少 agent 应失败', () => {
    const invalid: AgentSelfCheck = {
      agent: '',
      date: '2026-03-30',
      tasksCompleted: [],
      qualityMetrics: {},
      proposals: [],
      lessonsLearned: [],
      score: 5
    };
    
    const result = validateSelfCheck(invalid);
    expect(result.valid).toBe(false);
  });

  it('score 超范围应失败', () => {
    const invalid: AgentSelfCheck = {
      agent: 'architect',
      date: '2026-03-30',
      tasksCompleted: [],
      qualityMetrics: {},
      proposals: [],
      lessonsLearned: [],
      score: 15
    };
    
    const result = validateSelfCheck(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('1-10'))).toBe(true);
  });

  it('无任务完成应警告', () => {
    const valid: AgentSelfCheck = {
      agent: 'architect',
      date: '2026-03-30',
      tasksCompleted: [],
      qualityMetrics: {},
      proposals: [],
      lessonsLearned: [],
      score: 5
    };
    
    const result = validateSelfCheck(valid);
    expect(result.warnings.some(w => w.includes('无任务完成'))).toBe(true);
  });
});
```

### 2.4 新建: `src/scripts/collect-proposals.ts`

```typescript
#!/usr/bin/env npx ts-node

import fs from 'fs';
import glob from 'glob';
import path from 'path';

interface CollectedProposal {
  agent: string;
  text: string;
  priority: 'P0' | 'P1' | 'P2';
  sourceFile: string;
}

interface DailyProposals {
  date: string;
  agents: string[];
  proposals: CollectedProposal[];
  summary: {
    total: number;
    byPriority: Record<string, number>;
    byAgent: Record<string, number>;
  };
}

function extractAgentName(filePath: string): string {
  const fileName = path.basename(filePath);
  const match = fileName.match(/^(.+)-selfcheck/);
  return match ? match[1] : 'unknown';
}

function guessPriority(text: string): 'P0' | 'P1' | 'P2' {
  const lower = text.toLowerCase();
  if (lower.includes('紧急') || lower.includes('critical')) return 'P0';
  if (lower.includes('重要') || lower.includes('important')) return 'P1';
  return 'P2';
}

export function collectDailyProposals(
  docsDir: string,
  date: string
): DailyProposals {
  const proposals: CollectedProposal[] = [];
  const agents = new Set<string>();
  
  const files = glob.sync(`${docsDir}/agent-self-evolution-${date}/*-selfcheck*.md`);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const agentName = extractAgentName(file);
    agents.add(agentName);
    
    // 提取 [PROPOSAL] 标签
    const pattern = /-\s*\[PROPOSAL\]\s*(.+)/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      proposals.push({
        agent: agentName,
        text: match[1].trim(),
        priority: guessPriority(match[1]),
        sourceFile: file
      });
    }
  }
  
  return {
    date,
    agents: Array.from(agents),
    proposals,
    summary: {
      total: proposals.length,
      byPriority: proposals.reduce((acc, p) => {
        acc[p.priority] = (acc[p.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byAgent: proposals.reduce((acc, p) => {
        acc[p.agent] = (acc[p.agent] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    }
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const docsDir = args[0] || 'docs';
  const date = args[1] || new Date().toISOString().split('T')[0];
  
  const result = collectDailyProposals(docsDir, date);
  
  const outputDir = `proposals/${date}`;
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(`${outputDir}/proposals.json`, JSON.stringify(result, null, 2));
  
  console.log(`✅ 收集完成: ${result.proposals.length} 个提案`);
  console.log(`   参与 agent: ${result.agents.join(', ')}`);
}
```

### 2.5 新建: `src/scripts/update-learnings.ts`

```typescript
#!/usr/bin/env npx ts-node

import fs from 'fs';
import path from 'path';

interface LearningEntry {
  id: string;
  date: string;
  agent: string;
  context: string;
  lesson: string;
  improvement: string;
}

function generateEntryId(): string {
  const learningsPath = 'docs/LEARNINGS.md';
  if (!fs.existsSync(learningsPath)) return 'E001';
  
  const content = fs.readFileSync(learningsPath, 'utf-8');
  const matches = content.match(/E\d+/g);
  const maxId = matches 
    ? Math.max(...matches.map(m => parseInt(m.slice(1), 10)))
    : 0;
  
  return `E${String(maxId + 1).padStart(3, '0')}`;
}

export function addLearning(entry: Omit<LearningEntry, 'id'>): LearningEntry {
  const entryWithId: LearningEntry = {
    ...entry,
    id: generateEntryId()
  };
  
  const learningsPath = 'docs/LEARNINGS.md';
  const existing = fs.existsSync(learningsPath) 
    ? fs.readFileSync(learningsPath, 'utf-8') 
    : '# 经验沉淀\n\n';
  
  const newEntry = `
## ${entryWithId.id} | ${entryWithId.date} | ${entryWithId.agent}

**情境**: ${entryWithId.context}

**经验**: ${entryWithId.lesson}

**改进**: ${entryWithId.improvement}
`;
  
  fs.appendFileSync(learningsPath, newEntry);
  return entryWithId;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const entry: LearningEntry = {
    id: generateEntryId(),
    date: new Date().toISOString().split('T')[0],
    agent: args[0] || 'unknown',
    context: args[1] || '',
    lesson: args[2] || '',
    improvement: args[3] || ''
  };
  
  const result = addLearning(entry);
  console.log(`✅ 经验已添加: ${result.id}`);
}
```

### 2.6 新建: `src/types/self-check.ts`

```typescript
export interface AgentSelfCheck {
  agent: string;
  date: string;
  tasksCompleted: TaskSummary[];
  qualityMetrics: QualityMetrics;
  proposals: Proposal[];
  lessonsLearned: Lesson[];
  score: number;
}

export interface TaskSummary {
  taskId: string;
  description: string;
  status: 'completed' | 'failed' | 'blocked';
  blockedReason?: string;
}

export interface QualityMetrics {
  // Agent 特定指标
  [key: string]: number | boolean | undefined;
}

export interface Proposal {
  text: string;
  priority: 'P0' | 'P1' | 'P2';
  status: 'pending' | 'accepted' | 'rejected';
  reason?: string;
}

export interface Lesson {
  id: string;
  context: string;
  lesson: string;
  improvement: string;
}
```

---

## 3. 估计工时

| 任务 | 估计 |
|------|------|
| 自检模板 | 1h |
| validate-selfcheck.ts + test | 2h |
| collect-proposals.ts + test | 2h |
| update-learnings.ts + test | 1h |
| HEARTBEAT.md 集成 | 1h |
| 代码审查 + 修复 | 1h |
| **总计** | **~8h** |

---

## 4. 验收标准

- [ ] 7 个 agent 自检模板统一
- [ ] `validateSelfCheck()` 测试覆盖率 > 90%
- [ ] 提案自动收集到 `proposals/YYYYMMDD/`
- [ ] 经验自动追加到 LEARNINGS.md
- [ ] 自检完成率 100%（7/7）

---

*本文档由 Architect Agent 生成，用于约束各 agent 的自检行为。*
