# Spec: E19-1-S2 — 前端 Hook 接入

**Story**: E19-1-S2
**验收标准**: AS2.1–AS2.6
**工时**: 0.5d

---

## 概述

改造 `useDesignReview` hook，移除 `callReviewDesignMCP` 中的 mock 实现（`setTimeout(1500)` + 硬编码假数据），改为调用 `/api/mcp/review_design` API Route。

---

## 当前代码（需删除）

```typescript
// 需删除的 mock 实现
async function callReviewDesignMCP(_figmaUrl: string, _designTokens: unknown[]): Promise<DesignReviewResult> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { compliance: [...hardcoded...], accessibility: [...], reuse: [...] };
}
```

---

## 新实现

```typescript
async function callReviewDesignMCP(figmaUrl: string, designTokens: unknown[]): Promise<DesignReviewResult> {
  const response = await fetch('/api/mcp/review_design', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      canvasId: extractCanvasIdFromFigma(figmaUrl),
      nodes: designTokens,
      checkCompliance: true,
      checkA11y: true,
      checkReuse: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Design review failed: ${response.statusText}`);
  }

  const report: DesignReviewReport = await response.json();

  // 适配 DesignReviewResult 接口
  return {
    compliance: (report.designCompliance?.colorIssues ?? []).map(...),
    accessibility: (report.a11y?.issues ?? []).map(...),
    reuse: (report.reuse?.recommendations ?? []).map(...),
  };
}
```

---

## 适配层说明

MCP tool 输出的是 `DesignReviewReport` 结构，前端 `useDesignReview` 消费的是 `DesignReviewResult` 结构（`compliance[]`, `accessibility[]`, `reuse[]`）。

适配逻辑：将 `report.designCompliance.colorIssues[]` 映射为 `DesignReviewIssue[]`，将 `report.a11y.issues[]` 和 `report.reuse.recommendations[]` 类似处理。

---

## DoD

- [ ] `grep -r "setTimeout.*1500\|// Mock\|simulated" src/hooks/useDesignReview` → 0 matches
- [ ] hook 单元测试 mock `fetch('/api/mcp/review_design')`，验证数据路径
- [ ] 错误状态测试：API 500 时 `error` 非 null
