# VibeX 测试策略

**项目**: vibex-architect-proposals-20260403_024652
**日期**: 2026-04-03
**版本**: v1.0

---

## 1. 测试分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    E2E Tests (Playwright)                   │
│  • 用户完整流程 (登录 → 画布 → 导出)                       │
│  • 多页状态 (navigator.sendBeacon, beforeunload)          │
│  • 跨域 API (CORS, auth)                                  │
│  • 视觉回归 (screenshot diff)                             │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│              Integration Tests (Jest + Testing Library)      │
│  • React 组件交互 (点击、表单、模态框)                     │
│  • Zustand store actions + selectors                       │
│  • React hooks (useAutoSave, useVersionHistory)          │
│  • API client (MSW mock)                                 │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│              Unit Tests (Jest + Vitest)                     │
│  • 纯函数 (utilities, data transformation)                │
│  • 验证逻辑 (Zod schemas)                               │
│  • 状态机 (flow-execution handlers)                       │
│  • Canvas snapshot serialization                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Jest 职责范围

**适用场景**:
- 纯函数（utilities）
- React hooks（useAutoSave、useCanvasHistory 等）
- Zustand stores（action、selector 测试）
- 业务逻辑（data transformation、validation）
- React 组件交互（Testing Library）

**禁止在 Jest 中测试**:
- `navigator.sendBeacon` / `navigator.onLine` — 需要 browser 环境
- `beforeunload` 事件 — 无法在 JSDOM 触发
- `requestAnimationFrame` 精确计时 — 用 fake timers
- 视觉样式 — 使用 Playwright screenshot

---

## 3. Playwright 职责范围

**适用场景**:
- 用户交互流程（点击、输入、导航）
- 页面渲染验证（UI 组件存在）
- 异步行为（动画、定时器）
- 跨页状态（beacon、sendBeacon、requestAnimationFrame）
- API 端到端验证（实际 HTTP 请求）

**Playwright 配置**:
```typescript
// playwright.config.ts
export default defineConfig({
  retries: 2,    // 重试 flaky 测试
  workers: 1,   // 单 worker 确保稳定性
  timeout: 60000,
  expect: { timeout: 30000 },
  trace: 'on-first-retry',
})
```

---

## 4. 测试禁止模式

| 禁止模式 | 原因 | 替代方案 |
|---------|------|---------|
| `waitForTimeout(1000)` | 不稳定，时间不确定 | `waitForResponse()`, `waitForLoadState()` |
| `act()` 包装 beacon | beacon 是异步的，无法在 act 中等待 | 用 Playwright `page.evaluate()` 触发 |
| `page.waitForNavigation()` 无条件 | SPA 不一定有导航 | `page.waitForURL()` 或 `waitForResponse()` |
| 硬编码截图对比 | 字体/渲染差异导致 flaky | Playwright 的 `failOnDifference: false` |

---

## 5. 合约测试策略

### 5.1 Schema 优先原则

```
Backend API (Zod schemas)
       ↓  generate-schemas.ts
JSON Schema (test/schemas/*.json)
       ↓  mock-consistency.test.ts
Frontend Mock Data
```

### 5.2 Schema 变更流程

1. **后端变更**: 更新 Zod schema + route tests
2. **生成 Schema**: `npx tsx scripts/generate-schemas.ts <api>`
3. **同步 Mock**: 更新 `test/contract/mock-consistency.test.ts`
4. **CI Gate**: `npm run test:contract` 必须通过

### 5.3 覆盖端点

| 端点 | 方法 | 状态码 |
|------|------|--------|
| `/v1/canvas/snapshots` | GET | 200 |
| `/v1/canvas/snapshots` | POST | 201, 400 |
| `/v1/canvas/snapshots/:id` | GET | 200, 404 |
| `/v1/canvas/snapshots/:id/restore` | POST | 201, 404, 409 |
| `/v1/canvas/rollback` | GET | 200 |
| `/v1/canvas/rollback` | POST | 201, 404, 409 |

---

## 6. 突变测试策略

### 6.1 目标

- Kill Rate >= 70%
- 覆盖核心 stores: contextStore, flowStore, componentStore

### 6.2 已知限制

- pnpm workspace 中 jest-runner 插件解析问题
- 需在 CI 独立容器或非 pnpm 环境运行

### 6.3 替代指标

| 指标 | 目标 | 测量方式 |
|------|------|---------|
| Store 测试覆盖率 | >= 80% | Jest coverage |
| Mock 一致性测试 | >= 20 tests | `npm run test:contract` |
| E2E 稳定性 | passRate >= 95% | daily-stability.md |

---

## 7. CI 集成

```
push/main
  ├── npm test (Jest)          — 全部单元+集成测试
  ├── npm run test:contract    — 合约测试 (条件: schemas 变更)
  ├── npx playwright test       — E2E (scheduled daily)
  └── tsc --noEmit            — 类型检查
```

---

## 8. 测试数据管理

- **Mock 数据**: 统一管理在 `test/fixtures/`
- **Fixtures**: `test/fixtures/canvas/` 存放 snapshot 测试数据
- **不可在测试中硬编码敏感数据**

---

*本文档由 Architect Agent 生成于 2026-04-03*
