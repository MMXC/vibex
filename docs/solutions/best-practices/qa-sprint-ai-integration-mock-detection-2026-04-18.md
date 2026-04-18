---
title: Sprint6-QA AI集成——Mock检测与缺陷归档模式
date: 2026-04-18
category: docs/solutions/best-practices
module: vibex
problem_type: best_practice
component: frontend_stimulus
severity: medium
applies_when:
  - QA sprint validating AI integration features with stub/mock implementations
  - Detecting TODO comments and placeholder code in production-bound features
  - Archiving multi-severity defects (BLOCKER/P0/P1/P2) from sprint reviews
tags:
  - qa-sprint
  - mock-detection
  - ai-agent
  - stub-removal
  - defect-archival
  - best-practice
related_components:
  - CodingAgentService
  - VersionDiff
  - image-ai-import
---

# Sprint6-QA AI集成——Mock检测与缺陷归档模式

## Context

Sprint6 AI Coding Integration 交付后，QA Sprint 发现两个 **BLOCKER** 级别缺陷：
1. `CodingAgentService.ts` 的 `mockAgentCall` 函数含 `TODO: Replace with real agent code` — AI agent 反馈回路本质上是假实现
2. `/canvas/delivery/version` 页面路径不存在 — 版本 Diff 功能无法从正确路径访问

此外归档了 8 个缺陷：BLOCKER×2 + P0×2 + P1×1 + P2×3。

核心问题：**Sprint 交付了功能的外壳，但 AI agent 核心逻辑仍然是 stub。** QA Sprint 的价值在于发现这个差距。

---

## Guidance

### 模式 1: Mock/Stub 检测（QA 必查项）

```bash
# 在实现文档化的服务文件中搜索 TODO/placeholder/mock
grep -rn "TODO.*Replace\|TODO.*real\|mockAgent\|stub\|placeholder" src/

# 在 API route 中搜索空实现
grep -rn "// TODO\|// PENDING\|// NOT IMPLEMENTED" src/app/api/
```

**BLOCKER 判定标准**：当 `grep` 结果出现在以下模式时，直接 BLOCKER：
- `TODO.*Replace with real` → 功能主体是 mock
- `TODO.*NOT IMPLEMENTED` → 核心功能缺失
- `// stub\|// mock` → 非生产级实现

### 模式 2: 页面路径验证

```bash
# 验证页面文件存在
find src/app -name "page.tsx" | grep "delivery/version"

# 验证路由路径与文件路径一致
# Spec: /canvas/delivery/version
# 实际: src/app/canvas/version/page.tsx (错误路径)
```

**BLOCKER 判定标准**：Spec 中声明的路由与实际 `page.tsx` 路径不匹配 → BLOCKER。

### 模式 3: 多严重性缺陷归档

```
defects/
  BLOCKER/  ← 立即阻塞系统基本承诺
  P0/       ← 阻塞核心功能
  P1/       ← 影响完整性，有 workaround
  P2/       ← 体验/代码质量
```

**归档文件格式**：每个文件含代码证据（grep 输出）、影响范围、修复建议。

---

## Why This Matters

**AI Agent 集成是最容易"看起来实现了"的特性。** UI 面板、Store、API Route 都可以快速搭建，但 AI agent 的核心逻辑（真正的 LLM 调用、session 管理、代码生成反馈）需要真实的 API key、prompt 工程、错误处理。QA Sprint 通过代码审查 + 证据驱动的 TODO 检测，专门捕获这种"外壳完整、内核为空"的问题。

**版本 Diff 的路由错误**同样是静默失败的典型：文件存在，代码正确，但用户无法通过正确的 URL 访问功能。

---

## When to Apply

- **AI 功能交付前的 QA**：必须搜索所有 `TODO.*real\|mock\|stub` 模式
- **新功能路由验收**：验证 `page.tsx` 路径与 Spec 路由完全匹配
- **多 Epic 交付的 QA Sprint**：使用统一的 BLOCKER/P0/P1/P2 分类，避免"都是问题"的无效归档
- **Stub → Production 迁移**：任何带 `TODO.*Replace` 的功能，在进入 Production 前必须清除

---

## Examples

### 检测 mock stub

```typescript
// src/services/agent/CodingAgentService.ts:100-121
export async function mockAgentCall(task: string): Promise<AgentMessage[]> {
  return [
    {
      id: uuid(),
      role: 'assistant',
      code: `// TODO: Replace with real agent code\nexport function placeholder() {\n  console.log('AI Coding Agent integration pending');\n}`,
      timestamp: Date.now(),
    },
  ];
}
```

**QA 判定**: `// TODO: Replace with real agent code` → **BLOCKER**。这不是测试数据，是生产代码中的 mock。

### 路由路径不匹配

```
Spec 声明: /canvas/delivery/version
实际文件: src/app/canvas/version/page.tsx
          src/app/version-history/page.tsx  ← 这是 version-history，不是 delivery/version
```

**QA 判定**: 路由与文件不匹配 → **BLOCKER**。

---

## Prevention

- **禁止 TODO 在生产代码中**：任何 `// TODO: Replace with real` 在 merge 前必须清除
- **AI 功能需要 E2E 验证**：AI agent 必须有真实的 prompt + response 验证，不能只靠 UI 截图
- **路由验证自动化**：Spec 中的路由路径应该与 `page.tsx` 位置有对应关系，可以用脚本验证
- **QA Sprint 的 BLOCKER 阈值**：AI 功能的 mock/stub 一律 BLOCKER，不接受"功能入口已完成"的论断
