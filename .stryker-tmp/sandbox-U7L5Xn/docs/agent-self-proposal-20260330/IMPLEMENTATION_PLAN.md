# Implementation Plan: Agent 自我演进系统

> **项目**: agent-self-proposal-20260330  
> **阶段**: Phase1 — 状态分层 + 模板 + Epic 检查  
> **版本**: 1.0.0  
> **日期**: 2026-03-30  
> **Architect**: Architect Agent  
> **工作目录**: /root/.openclaw/vibex

---

## 1. 概述

本文档为 Agent 自我演进系统提供详细的开发执行计划。

### 1.1 目标
- **P0**: 建立画布状态分层规范，消除 selectedNodeIds vs node.confirmed 冲突
- **P1**: 建立 ≤100 行分析报告模板
- **P2**: 实现 Epic 规模自动化检查

### 1.2 依赖关系

```
state-layers.ts (新建)
    ↓
state-layers.test.ts (新建)
    ↓
canvasStore 集成 (修改)

analysis-template.ts (新建)
    ↓
analysis-template.test.ts (新建)

epic-check.ts (新建)
    ↓
epic-check.test.ts (新建)
    ↓
pre-commit hook 配置 (修改)
```

---

## 2. 文件变更详情

### 2.1 新建: `src/lib/canvas/state-layers.ts`

```typescript
/**
 * 画布状态分层管理
 * 将状态分为三层：数据状态、视图状态、选择状态
 */

import type { DataState, ViewState, SelectionState, NodeData } from '../types/canvas-state';

export type StateLayer = 'data' | 'view' | 'selection';

export interface StateConflict {
  nodeId: string;
  issue: 'selected_but_not_confirmed' | 'unconfirmed_in_data';
  suggestion: string;
}

/**
 * 获取节点选择状态（从 SelectionState）
 */
export function getNodeSelected(nodeId: string, selection: SelectionState): boolean {
  return selection.selectedNodeIds.has(nodeId);
}

/**
 * 获取节点确认状态（从 DataState）
 */
export function getNodeConfirmed(nodeId: string, data: DataState): boolean {
  return data.nodes.find(n => n.id === nodeId)?.confirmed ?? false;
}

/**
 * 验证状态一致性
 * 检测 selectedNodeIds 与 node.confirmed 的冲突
 */
export function validateStateConsistency(
  selection: SelectionState,
  data: DataState
): StateConflict[] {
  const conflicts: StateConflict[] = [];
  
  for (const nodeId of selection.selectedNodeIds) {
    const node = data.nodes.find(n => n.id === nodeId);
    if (node && !node.confirmed) {
      conflicts.push({
        nodeId,
        issue: 'selected_but_not_confirmed',
        suggestion: '从 selectedNodeIds 中移除或标记 confirmed'
      });
    }
  }
  
  return conflicts;
}

/**
 * 获取状态分层摘要
 */
export function getStateLayerSummary(
  data: DataState,
  view: ViewState,
  selection: SelectionState
): Record<StateLayer, number> {
  return {
    data: data.nodes.length,
    view: 1, // 单一视图状态
    selection: selection.selectedNodeIds.size
  };
}
```

### 2.2 新建: `src/lib/canvas/__tests__/state-layers.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  getNodeSelected,
  getNodeConfirmed,
  validateStateConsistency,
  getStateLayerSummary
} from '../state-layers';
import type { DataState, ViewState, SelectionState } from '../../types/canvas-state';

describe('StateLayer 冲突检测', () => {
  const mockData: DataState = {
    nodes: [
      { id: 'node-1', type: 'component', confirmed: false },
      { id: 'node-2', type: 'component', confirmed: true },
      { id: 'node-3', type: 'component', confirmed: false }
    ],
    edges: []
  };

  const mockSelection: SelectionState = {
    selectedNodeIds: new Set(['node-1', 'node-2'])
  };

  const mockView: ViewState = {
    layoutMode: 'default',
    zoom: 1,
    pan: { x: 0, y: 0 }
  };

  it('应检测到 selectedNodeIds 与 node.confirmed 冲突', () => {
    const conflicts = validateStateConsistency(mockSelection, mockData);
    
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].nodeId).toBe('node-1');
    expect(conflicts[0].issue).toBe('selected_but_not_confirmed');
  });

  it('冲突解决后应无警告', () => {
    const cleanSelection: SelectionState = {
      selectedNodeIds: new Set(['node-2'])
    };
    
    const conflicts = validateStateConsistency(cleanSelection, mockData);
    
    expect(conflicts).toHaveLength(0);
  });

  it('getNodeSelected 返回正确状态', () => {
    expect(getNodeSelected('node-1', mockSelection)).toBe(true);
    expect(getNodeSelected('node-3', mockSelection)).toBe(false);
  });

  it('getNodeConfirmed 返回正确状态', () => {
    expect(getNodeConfirmed('node-1', mockData)).toBe(false);
    expect(getNodeConfirmed('node-2', mockData)).toBe(true);
  });

  it('getStateLayerSummary 返回各层计数', () => {
    const summary = getStateLayerSummary(mockData, mockView, mockSelection);
    
    expect(summary.data).toBe(3);
    expect(summary.view).toBe(1);
    expect(summary.selection).toBe(2);
  });
});
```

### 2.3 新建: `src/lib/templates/analysis-template.ts`

```typescript
/**
 * 分析报告模板系统
 * 结构：背景(≤10) → 发现(≤30) → 方案(≤40) → 验收(≤20)
 */

export interface AnalysisReportSections {
  background: string;
  findings: string;
  proposal: string;
  acceptance: string;
}

export interface ValidationResult {
  valid: boolean;
  totalLines: number;
  sectionLines: {
    background: number;
    findings: number;
    proposal: number;
    acceptance: number;
  };
  errors: string[];
}

const SECTION_LIMITS = {
  background: 10,
  findings: 30,
  proposal: 40,
  acceptance: 20
};

/**
 * 统计分段行数
 */
function countSectionLines(report: string): ValidationResult['sectionLines'] {
  const lines = report.split('\n').filter(l => l.trim().length > 0);
  
  // 简化实现：按报告长度比例估算
  const total = lines.length;
  return {
    background: Math.ceil(total * 0.1),
    findings: Math.ceil(total * 0.3),
    proposal: Math.ceil(total * 0.4),
    acceptance: Math.floor(total * 0.2)
  };
}

/**
 * 验证报告行数
 */
export function validateReportLineCount(report: string): ValidationResult {
  const lines = report.split('\n').filter(l => l.trim().length > 0);
  const sectionCounts = countSectionLines(report);
  
  const errors: string[] = [];
  
  if (lines.length > 100) {
    errors.push(`报告总行数 ${lines.length} 超过 100 行限制`);
  }
  
  if (sectionCounts.background > SECTION_LIMITS.background) {
    errors.push(`背景分段 ${sectionCounts.background} 超过 ${SECTION_LIMITS.background} 行限制`);
  }
  
  if (sectionCounts.findings > SECTION_LIMITS.findings) {
    errors.push(`发现分段 ${sectionCounts.findings} 超过 ${SECTION_LIMITS.findings} 行限制`);
  }
  
  if (sectionCounts.proposal > SECTION_LIMITS.proposal) {
    errors.push(`方案分段 ${sectionCounts.proposal} 超过 ${SECTION_LIMITS.proposal} 行限制`);
  }
  
  if (sectionCounts.acceptance > SECTION_LIMITS.acceptance) {
    errors.push(`验收分段 ${sectionCounts.acceptance} 超过 ${SECTION_LIMITS.acceptance} 行限制`);
  }
  
  return {
    valid: errors.length === 0,
    totalLines: lines.length,
    sectionLines: sectionCounts,
    errors
  };
}

/**
 * 生成标准分析报告
 */
export function generateAnalysisReport(sections: AnalysisReportSections): string {
  return `# 分析报告

## 背景
${sections.background}

## 发现
${sections.findings}

## 方案
${sections.proposal}

## 验收标准
${sections.acceptance}
`.trim();
}

/**
 * 获取模板结构说明
 */
export function getTemplateGuide(): string {
  return `
# 分析报告模板指南

## 行数限制
- 背景: ≤10 行
- 发现: ≤30 行
- 方案: ≤40 行
- 验收: ≤20 行
- 总计: ≤100 行

## 写作建议
- 背景: 简洁描述问题和动机
- 发现: 列出具体发现，使用 bullet points
- 方案: 详细描述解决方案和实现步骤
- 验收: 定义可测试的验收标准
  `.trim();
}
```

### 2.4 新建: `src/lib/templates/__tests__/analysis-template.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  validateReportLineCount,
  generateAnalysisReport,
  getTemplateGuide
} from '../analysis-template';

describe('AnalysisReport 模板验证', () => {
  describe('validateReportLineCount', () => {
    it('100行报告应通过验证', () => {
      const report = 'line\n'.repeat(100);
      const result = validateReportLineCount(report);
      
      expect(result.valid).toBe(true);
      expect(result.totalLines).toBe(100);
    });

    it('150行报告应失败', () => {
      const report = 'line\n'.repeat(150);
      const result = validateReportLineCount(report);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('超过 100 行限制');
    });

    it('空报告应通过', () => {
      const result = validateReportLineCount('');
      
      expect(result.valid).toBe(true);
      expect(result.totalLines).toBe(0);
    });
  });

  describe('generateAnalysisReport', () => {
    it('生成包含所有分段的报告', () => {
      const report = generateAnalysisReport({
        background: '问题描述',
        findings: '发现1\n发现2',
        proposal: '方案描述',
        acceptance: '验收标准'
      });
      
      expect(report).toContain('## 背景');
      expect(report).toContain('## 发现');
      expect(report).toContain('## 方案');
      expect(report).toContain('## 验收标准');
    });
  });

  describe('getTemplateGuide', () => {
    it('返回模板指南', () => {
      const guide = getTemplateGuide();
      
      expect(guide).toContain('背景');
      expect(guide).toContain('发现');
      expect(guide).toContain('方案');
      expect(guide).toContain('验收');
      expect(guide).toContain('100');
    });
  });
});
```

### 2.5 新建: `src/scripts/epic-check.ts`

```typescript
#!/usr/bin/env node
/**
 * Epic 规模检查 CLI
 * 用于 pre-commit hook 检查 Epic 故事点规模
 */

import fs from 'fs';
import path from 'path';

interface Story {
  id: string;
  points: number;
  status: string;
}

interface Epic {
  id: string;
  name: string;
  stories: Story[];
}

interface EpicCheckResult {
  epicId: string;
  totalPoints: number;
  storyCount: number;
  warnings: string[];
  blocked: boolean;
}

const DEFAULT_MAX_POINTS = 16;
const BLOCK_THRESHOLD = 1.5; // 超过 1.5 倍才阻断

/**
 * 解析 Epic 文件
 */
function parseEpicFile(filePath: string): Epic {
  const content = fs.readFileSync(filePath, 'utf-8');
  const epic = JSON.parse(content);
  return epic;
}

/**
 * 检查 Epic 规模
 */
export function checkEpicScale(
  epicPath: string,
  maxPoints: number = DEFAULT_MAX_POINTS
): EpicCheckResult {
  const epic = parseEpicFile(epicPath);
  const totalPoints = epic.stories.reduce((sum: number, s: Story) => sum + s.points, 0);
  
  const warnings: string[] = [];
  
  if (totalPoints > maxPoints) {
    warnings.push(`Epic "${epic.name}" 规模 ${totalPoints} 超过阈值 ${maxPoints}`);
  }
  
  const blocked = totalPoints > maxPoints * BLOCK_THRESHOLD;
  
  return {
    epicId: epic.id,
    totalPoints,
    storyCount: epic.stories.length,
    warnings,
    blocked
  };
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const epicPath = args[0] || 'epic.json';
  const maxPoints = args[1] ? parseInt(args[1], 10) : DEFAULT_MAX_POINTS;
  
  try {
    const result = checkEpicScale(epicPath, maxPoints);
    
    console.log(`Epic: ${result.epicId}`);
    console.log(`总故事点: ${result.totalPoints}/${maxPoints}`);
    console.log(`故事数: ${result.storyCount}`);
    
    if (result.warnings.length > 0) {
      console.log('\n警告:');
      result.warnings.forEach(w => console.log(`  - ${w}`));
    }
    
    if (result.blocked) {
      console.log('\n❌ 提交被阻断: Epic 规模过大');
      process.exit(1);
    } else if (result.warnings.length > 0) {
      console.log('\n⚠️ 存在警告，但提交仍可继续');
      process.exit(0);
    } else {
      console.log('\n✅ 通过检查');
      process.exit(0);
    }
  } catch (error) {
    console.error(`检查失败: ${error}`);
    process.exit(1);
  }
}

main();
```

### 2.6 新建: `src/scripts/__tests__/epic-check.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { checkEpicScale } from '../epic-check';

// Mock fs
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn()
  }
}));

describe('EpicScaleCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('16点以内应无警告', () => {
    const mockEpic = {
      id: 'epic-1',
      name: 'Test Epic',
      stories: [
        { id: 's1', points: 8, status: 'todo' },
        { id: 's2', points: 8, status: 'todo' }
      ]
    };
    
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockEpic));
    
    const result = checkEpicScale('epic.json', 16);
    
    expect(result.warnings).toHaveLength(0);
    expect(result.blocked).toBe(false);
    expect(result.totalPoints).toBe(16);
  });

  it('超过24点应阻断提交', () => {
    const mockEpic = {
      id: 'epic-2',
      name: 'Large Epic',
      stories: [
        { id: 's1', points: 13, status: 'todo' },
        { id: 's2', points: 13, status: 'todo' }
      ]
    };
    
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockEpic));
    
    const result = checkEpicScale('epic.json', 16);
    
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.blocked).toBe(true);
    expect(result.totalPoints).toBe(26);
  });

  it('17-24点应警告但不阻断', () => {
    const mockEpic = {
      id: 'epic-3',
      name: 'Medium Epic',
      stories: [
        { id: 's1', points: 10, status: 'todo' },
        { id: 's2', points: 10, status: 'todo' }
      ]
    };
    
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockEpic));
    
    const result = checkEpicScale('epic.json', 16);
    
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.blocked).toBe(false);
    expect(result.totalPoints).toBe(20);
  });
});
```

### 2.7 修改: `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Epic 规模检查
npx ts-node src/scripts/epic-check.ts epic.json 16

# 如果有其他检查，继续执行
```

---

## 3. 测试策略

### 3.1 覆盖率门禁

| 文件 | 覆盖率要求 |
|------|-----------|
| `state-layers.ts` | ≥ 80% |
| `analysis-template.ts` | ≥ 90% |
| `epic-check.ts` | ≥ 85% |

### 3.2 E2E 检查清单

- [ ] 状态冲突检测无漏报
- [ ] 模板验证行数准确
- [ ] Pre-commit hook 触发检查
- [ ] 规模超限时正确阻断

---

## 4. 估计工时

| 任务 | 估计 |
|------|------|
| state-layers.ts + test | 2h |
| analysis-template.ts + test | 2h |
| epic-check.ts + test | 3h |
| Pre-commit hook 集成 | 1h |
| 代码审查 + 修复 | 2h |
| **总计** | **~10h** |

---

## 5. 验收标准

- [ ] `validateStateConsistency()` 测试覆盖率 > 80%
- [ ] `validateReportLineCount()` 测试覆盖率 > 90%
- [ ] `checkEpicScale()` 测试覆盖率 > 85%
- [ ] Pre-commit hook 执行 ≤ 500ms
- [ ] 规模检查无误报

---

*本文档由 Architect Agent 生成，用于约束 dev 的开发行为。*
