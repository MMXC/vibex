# Spec: E19-1-S1 — API Route 桥接层

**Story**: E19-1-S1
**验收标准**: AS1.1–AS1.4
**工时**: 1d

---

## 概述

新建 Next.js API Route `/api/mcp/review_design`，作为前端到后端 `reviewDesign()` 核心逻辑的 HTTP 桥接层。

---

## 端点设计

### POST `/api/mcp/review_design`

**Request Body**:
```typescript
interface ReviewDesignRequest {
  canvasId: string;           // required
  nodes?: CanvasNode[];       // optional, defaults to []
  checkCompliance?: boolean;   // default: true
  checkA11y?: boolean;       // default: true
  checkReuse?: boolean;       // default: true
}

interface CanvasNode {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  styles?: Record<string, string>;
}
```

**Success Response** (200):
```typescript
interface ReviewDesignResponse {
  canvasId: string;
  reviewedAt: string;
  summary: {
    compliance: 'pass' | 'warn' | 'fail';
    a11y: 'pass' | 'warn' | 'fail';
    reuseCandidates: number;
    totalNodes: number;
  };
  designCompliance?: { colors: boolean; colorIssues: unknown[]; typography: boolean; typographyIssues: unknown[]; spacing: boolean; spacingIssues: unknown[] };
  a11y?: { passed: boolean; critical: number; high: number; medium: number; low: number; issues: unknown[] };
  reuse?: { candidatesAboveThreshold: number; candidates: unknown[]; recommendations: string[] };
}
```

**Error Response** (400):
```json
{ "error": "canvasId is required" }
```

**Error Response** (500):
```json
{ "error": "Design review failed", "details": "..." }
```

---

## 实现要点

1. 直接 import 后端 `reviewDesign()` 函数（从 `../../../../../vibex-backend/src/lib/prompts/reviewDesign.ts` 或抽象后的 shared location）
2. 若 shared import 路径复杂，可复制核心逻辑到 API route 内部
3. 统一错误捕获，映射到 400/500 响应
4. 移除 `as unknown` 强制转换，保证类型安全

---

## DoD

- [ ] `tsc --noEmit` 在 frontend 目录 0 errors
- [ ] 单元测试覆盖 4 个验收标准
- [ ] 响应结构与 `DesignReviewReport` 接口一致
