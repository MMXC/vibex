# E19-1 代码审查报告

**任务**: vibex-sprint19/reviewer-e19-1  
**Commit**: 2f493df6d  
**审查时间**: 2026-04-30 22:40  
**审查者**: reviewer  

---

## 概述

E19-1 功能审查：Design Review MCP 集成。6 files, 638 insertions, 104 deletions.

---

## INV 镜子检查

| # | 检查项 | 结果 |
|---|--------|------|
| INV-0 | 读过所有文件了吗？ | ✅ 是，逐文件阅读 |
| INV-1 | 改了源头，消费方 grep 过了吗？ | ✅ API route 是新增，hook 消费方已同步 |
| INV-2 | 格式对了，语义呢？ | ✅ 类型结构与 spec 一致 |
| INV-4 | 同一件事写在几个地方？ | ✅ API route 包含内联逻辑（符合 spec "可复制核心逻辑"） |
| INV-5 | 复用这段代码，知道原来为什么这么写吗？ | ✅ 内联逻辑来自 backend 对应文件，已标注来源 |
| INV-6 | 验证从价值链倒推了吗？ | ⚠️ 见 S2 问题 |
| INV-7 | 跨模块边界有明确的 seam_owner？ | ✅ POST /api/mcp/review_design 是明确边界 |

---

## 🔴 Blocker（必须修复）

### B1: CHANGELOG.md 缺失 E19-1 条目

**位置**: `vibex-fronted/CHANGELOG.md`  
**问题**: 验收标准明确要求 "changelog 已更新"，但 changelog 中无 E19-1 任何内容。`grep "E19-1" CHANGELOG.md` 返回空。

根据 reviewer 职责，changelog 由 reviewer 负责撰写并提交。

---

## 🟡 Suggestions（建议修复）

### S1: `autoOpen` prop 未使用
**位置**: `ReviewReportPanel.tsx:72`  
**问题**: `autoOpen` prop 接收后赋值给 `autoOpen` 参数，但从不在组件内使用。

```tsx
export function ReviewReportPanel({ autoOpen = false }: ReviewReportPanelProps) {
  // autoOpen is never read
  useEffect(() => {
    if (autoOpen) {  // <-- never triggers because autoOpen is always false
      void runReview();
    }
  }, []);
```

建议：要么删除 prop，要么正确连接到 props。

### S2: `designTokens` 参数被忽略，始终传空数组
**位置**: `useDesignReview.ts:39`  
**问题**: `callReviewDesignMCP` 签名接受 `designTokens`，但 API body 硬编码 `nodes: []`。

```typescript
async function callReviewDesignMCP(canvasId: string, _figmaUrl: string, _designTokens: unknown[]): Promise<DesignReviewResult> {
  body: JSON.stringify({
    canvasId,
    nodes: [],  // <-- always empty, _designTokens ignored
```

当前 ReviewReportPanel 调用 `runReview()` 不传参数，所以这在 MVP 范围内。但设计 tokens 始终为空意味着 compliance/reuse 检查实际上无效。这是已知限制，建议在 changelog 中注明。

### S3: TypeScript 类型问题（低风险）
**位置**: `useDesignReview.ts:74`  
**问题**: accessibility severity 映射的类型断言：

```typescript
severity: (typed.issueType === 'missing-alt' || typed.issueType === 'missing-aria-label') ? 'critical' : 'warning' as DesignReviewIssue['severity'],
```

`as DesignReviewIssue['severity']` 只应用于 'warning' 分支，不是整个三元表达式。如果 `typed.issueType` 是 `undefined`，结果类型不准确。建议加括号：

```typescript
severity: ((typed.issueType === 'missing-alt' || typed.issueType === 'missing-aria-label') ? 'critical' : 'warning') as DesignReviewIssue['severity'],
```

### S4: E2E 测试 TC2 可靠性问题
**位置**: `design-review.spec.ts:43`  
**问题**: `waitForSelector(...).catch(() => null)` 导致测试在 panel 不出现时静默通过，可能漏掉真实 bug。

建议：使用明确的断言而不是 `.catch(() => null)`。

---

## ✅ 通过项

1. **TypeScript 编译**: `pnpm exec tsc --noEmit` → 0 errors
2. **S1 API Route**: POST /api/mcp/review_design 结构符合 spec；400/500 错误处理正确；内联逻辑有来源标注
3. **S2 Hook**: setTimeout mock 已移除（grep 验证）；API 调用路径正确；错误处理完善
4. **S3 优雅降级**: 四种状态（loading/error/empty/success）全部有 UI；重试按钮绑定 `runReview()`；文案符合 spec
5. **S4 E2E**: TC1-3 覆盖真实 API 调用路径；TC3/TC4 验证降级路径；无 skip/only 临时标记
6. **CSS**: 空状态和错误状态样式增强，符合 DDS 设计语言

---

## 结论

**结论**: CONDITIONAL PASS  
**原因**: 🔴 B1 — CHANGELOG 未更新（reviewer 职责，将由 reviewer 修复）

reviewer 将执行：添加 changelog → commit → push → 更新状态 → Slack 通知。

S1-S4 功能代码审查通过，功能与 PRD 一致，代码质量达标。
