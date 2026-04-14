# Architecture: VibeX 技术架构清理提案

> **类型**: Technical Debt / Architecture Cleanup  
> **日期**: 2026-04-14  
> **依据**: prd.md (vibex-architect-proposals-20260414_143000)

---

## 1. Problem Frame

VibeX 存在 4 类技术债务：品牌违规（pagelist）、API 错误格式不统一、缺乏版本管理、测试体系薄弱。目标：Sprint 1-2 内清理 P0/P1 债务。

---

## 2. System Architecture

```mermaid
graph TB
    subgraph E1["E1: 品牌一致性"]
        PAGELIST[Pagelist页面<br/>样式重写]
        TOKENS[Design Tokens<br/>CSS变量]
    end

    subgraph E2["E2: API质量"]
        ERR[lib/api-error.ts<br/>统一错误格式]
        VERSION[API版本化<br/>/v{n}/前缀]
        ROUTES[61个路由<br/>规范替换]
    end

    subgraph E3["E3: 测试体系"]
        VITEST[Vitest配置<br/>exclude修复]
        COVERAGE[覆盖率提升<br/>覆盖率报告]
    end

    PAGELIST --> TOKENS
    ERR --> ROUTES
    VERSION --> ROUTES
    VITEST --> COVERAGE
```

---

## 3. Technical Decisions

### 3.1 E1: pagelist 品牌一致性

**当前问题**: `/pagelist` 页面使用浅灰白背景，脱离 VibeX 深色赛博朋克风格。

**方案**: 重写 `/pagelist` 页面样式，使用 `design-tokens.css` 变量。

```css
/* 目标 */
.pagelist-page {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}
```

**验收**: pagelist 页面截图 diff 对比 baseline，背景色匹配 `var(--color-bg-primary)`。

### 3.2 E2: API 错误格式统一

**决策**: 新建 `lib/api-error.ts`，统一所有路由的错误返回。**直接实现，不复用其他方案**。

**API Error Format** (specs/e2-api-quality.md):

```typescript
// 标准错误响应
interface VibeXError {
  error: {
    code: string;      // e.g. "INVALID_PARAMS", "NOT_FOUND"
    message: string;    // 人类可读消息
    details?: object;   // 可选附加信息
  }
}

// HTTP 状态码映射
const STATUS_MAP: Record<string, number> = {
  INVALID_PARAMS: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

// 工具函数
export function apiError(code: string, message: string, details?: unknown) {
  return new Response(JSON.stringify({
    error: { code, message, details }
  }), {
    status: STATUS_MAP[code] ?? 500,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**API 版本化** (E2.S2):

```typescript
// 新增路由必须遵循 /v{n}/ 前缀
// workers/src/routes/v1/   → 当前版本
// workers/src/routes/v2/   → 未来版本

// 版本检测中间件
export function withVersion(request: Request): { version: number; path: string } {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/v(\d+)\//);
  return {
    version: match ? parseInt(match[1]) : 1,
    path: url.pathname.replace(/^\/api\/v\d+\//, '/api/')
  };
}
```

**trade-off**: 61 个路由逐一替换是 8h 工时（E2.S1），非自动化可完成。需要 grep 验证无遗漏。

### 3.3 E3: 测试体系

**Vitest exclude 修复** (已在 tester-proposals 中定义，本 PRD 补充验收):

```typescript
// vite.config.ts
export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/dist-ssr/**',
      '**/public/**',
      '**/e2e/**',
    ],
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
  }
});
```

**覆盖率目标**: E3.S1 要求覆盖率达到合理水位（>60%）。注意：纯覆盖率数字不等于测试质量，关注关键路径。

---

## 4. API Design

### 4.1 错误格式 (全局)

```typescript
// 所有错误响应统一格式
{ "error": { "code": string, "message": string, "details"?: object } }

// 成功响应约定
{ "data": T, "success": true }  // 对于 CRUD 操作
```

### 4.2 版本化策略

```
/api/v1/projects      → 当前版本 (默认)
/api/v2/projects      → v2 (Breaking change 时)
```

---

## 5. Open Questions

| 问题 | 状态 | 决定 |
|------|------|------|
| pagelist 是否需要 A/B 测试 | 可选 | 第一版直接替换，不做 A/B |
| API 版本化 CI 检查实现 | 待定 | 规则: `routes/v{n}/` 目录必须有 `n >= 1` |
| 覆盖率阈值设置 | 待定 | 第一版先跑基线，再设阈值 |

---

## 6. Verification

- [ ] pagelist 页面背景色为 `var(--color-bg-primary)`
- [ ] `apiError()` 导出可用，所有错误码映射正确
- [ ] 61 个路由无裸字符串错误残留
- [ ] 新增路由遵循 `/v{n}/` 前缀规范
- [ ] `vitest run` 退出码 0，无 node_modules 误报

---

*Architect Agent | 2026-04-14*
