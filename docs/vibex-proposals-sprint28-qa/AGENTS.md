# VibeX Sprint 28 QA — 开发约束文档（AGENTS.md）

**Agent**: architect
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint28-qa
**状态**: Adopted

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint28-qa
- **执行日期**: 2026-05-08

---

## 1. gstack 技能使用规范

### 1.1 技能选择矩阵

| 验证场景 | 推荐技能 | 场景说明 |
|---------|---------|---------|
| 页面可访问性 + 元素断言 | `/qa` | 结构化验收标准，断言驱动，批量验证 |
| UI 渲染截图验证 | `/browse` | 截图 + 可交互元素树（@e 引用）|
| 性能基准验证 | `/canary` | Lighthouse + 时间序列图，DevTools |
| 端到端用户流程 | `/qa` + `/browse` | 组合：断言 + 截图 |
| API 响应验证（独立）| 直接 curl / supertest | 非 gstack，Layer 1 最先执行 |

### 1.2 gstack /qa 断言规范

每个 Epic QA 规格文件（specs/*.md）包含可直接复制的断言。

**断言格式**:
```javascript
// 正确：使用 testid 或 role，稳定性高
await expect(page.locator('[data-testid="presence-avatars"]')).toBeVisible();
await expect(page.getByRole('button', { name: /新建模板/i })).toBeEnabled();

// 错误：使用 XPath 或模糊文本，flaky
await expect(page.locator('xpath=//div[3]')).toBeVisible();
await expect(page.getByText('提交')).toBeClickable();
```

**稳定性规则**:
- 必须使用 `data-testid` 或 `getByRole` / `getByLabel`
- 禁止使用 XPath（`xpath=` 前缀）
- 禁止使用模糊文本匹配（用 `exact: true`）
- 滚动到可见后再断言：`page.locator(...).scrollIntoViewIfNeeded()`

### 1.3 gstack /browse 截图规范

| 要求 | 说明 |
|------|------|
| 截图命名 | `epic-<id>-<scenario>-<timestamp>.png` |
| 截图路径 | `/root/.openclaw/vibex/docs/vibex-proposals-sprint28-qa/screenshots/` |
| 元素引用 | 使用 `@eN` 引用（snapshot -i 输出的索引）|
| 失败保留 | 仅 failure 时截图（`screenshot: 'only-on-failure'`）|

### 1.4 gstack /canary 性能基准

| 指标 | 阈值 | 说明 |
|------|------|------|
| Performance Score | ≥ 85 | Lighthouse |
| 300 节点渲染 | < 200ms | DevTools Performance panel |
| DOM nodes | ~20（虚拟化生效）| `document.querySelectorAll('*').length` |
| LCP | < 2.5s | Lighthouse |
| TTFB | < 600ms | Lighthouse |

**canary 执行命令**:
```bash
# E02 性能验证
npx lighthouse http://localhost:3000/dds-canvas --output=json --output-path=./lighthouse-e02.json
# 期望: performance >= 85
```

---

## 2. 验证执行约束

### 2.1 执行顺序（Layered Validation）

```
Layer 1（编译层，最先）：
  1. tsc --noEmit
  2. vitest run
  3. ESLint --max-warnings 0
  → 全部通过 → Layer 2

Layer 2（静态层）：
  1. E07 API health（curl，最独立）
  2. 代码文件存在 + 内容审查
  3. E2E test files 行数检查
  → 全部通过 → Layer 3

Layer 3（交互层，最后）：
  1. E01/E06（DDSCanvasPage，共用页面）
  2. E03（Onboarding 流程）
  3. E04（Dashboard）
  4. E05（PRD Editor）
  5. E02（性能验证，最后）
```

**原因**: Layer 1 是阻断项，失败则整个 Sprint 不验收。Layer 3 依赖 UI 环境，flaky 风险最高，最后做。

### 2.2 问题分级规范

| 级别 | 定义 | 处理方式 |
|------|------|---------|
| P0 | 编译失败 / 运行时崩溃 / 功能完全不可用 | 立即记录，architect 驳回 Sprint 验收 |
| P1 | 功能部分可用，但有明确缺陷 | 记录到 QA report，等待修复 |
| P2 | 非功能性缺陷（样式/文案偏差）| 记录到 QA report，延后修复 |
| Non-blocking | 建议性改进，无功能影响 | 记录到 backlog，不影响验收 |

### 2.3 重试策略

| 场景 | 重试次数 | 等待时间 |
|------|---------|---------|
| gstack /qa 断言 flaky | 3 次 | 1s between |
| API test 超时 | 2 次 | 3s between |
| E2E test timeout | 2 次 | playwright retries config |
| gstack /browse 加载慢 | 1 次 | 5s wait |

---

## 3. 代码审查规范

### 3.1 审查检查项

| Epic | 必须检查的代码点 |
|------|-----------------|
| E01 | `useRealtimeSync.ts`（RTDB read/write + 降级路径），`CanvasPage.tsx`（PresenceLayer 渲染）|
| E02 | `ChapterPanel.tsx`（rowHeight=120），`CardItem.tsx`（React.memo），`selectedIndex`（useMemo）|
| E03 | `/api/ai/clarify/route.ts`（AbortSignal.timeout + ruleEngine 降级），`useClarifyAI.ts` |
| E04 | `app/api/v1/templates/route.ts`（POST→201），`app/api/v1/templates/[id]/route.ts`（CRUD 响应码）|
| E05 | `/api/v1/canvas/from-prd/route.ts`（单向同步），`prd-canvas.ts`（nodes 生成逻辑）|
| E06 | `DDSCanvasPage.tsx`（TreeErrorBoundary 包裹 line 493），重试按钮 `resetErrorBoundary` |
| E07 | `/api/mcp/health/route.ts`（{status, timestamp, service}），`packages/mcp-server/`（独立包）|

### 3.2 TS 编译门控

| 命令 | 阈值 | CI 门控 |
|------|------|---------|
| `tsc --noEmit` | 0 errors | ✅ 必须 exit 0 |
| `eslint src/ --max-warnings 0` | 0 warnings | ✅ 建议 exit 0 |
| `vitest run --coverage` | >80% coverage | ✅ coverage threshold |

---

## 4. 测试规范

### 4.1 Vitest 单元测试验证

| Epic | 测试通过数 | 验证命令 |
|------|-----------|----------|
| E03 | 19/19 | `cd vibex-backend && npx vitest run __tests__/ai` |
| E04 | 31/31 | `cd vibex-backend && npx vitest run __tests__/templates` |
| E05 | 21/21 | `cd vibex-backend && npx vitest run __tests__/canvas` |
| E06 | 12/12 | `cd vibex-backend && npx vitest run __tests__/error-boundary` |
| E07 | 8/8 | `cd vibex-backend && npx vitest run __tests__/mcp` |

**验证命令**:
```bash
cd /root/.openclaw/vibex/vibex-backend
npx vitest run --reporter=verbose
# 期望: 所有 tests passed, 0 failures
```

### 4.2 E2E 测试文件验证

| Epic | E2E 文件 | 行数要求 | 验证命令 |
|------|---------|---------|----------|
| E01 | `presence-mvp.spec.ts` | ≥100 行 | `wc -l tests/e2e/presence-mvp.spec.ts` |
| E03 | `onboarding-ai.spec.ts` | ≥200 行 | `wc -l tests/e2e/onboarding-ai.spec.ts` |
| E04 | `templates-crud.spec.ts` | ≥200 行 | `wc -l tests/e2e/templates-crud.spec.ts` |
| E05 | `prd-canvas-mapping.spec.ts` | ≥100 行 | `wc -l tests/e2e/prd-canvas-mapping.spec.ts` |
| E07 | `mcp-integration.spec.ts` | ≥100 行 | `wc -l tests/e2e/mcp-integration.spec.ts` |

### 4.3 Playwright 配置

```typescript
// playwright.config.ts（QA 阶段使用）
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html'], ['list']],
});
```

---

## 5. 输出规范

### 5.1 QA 报告格式

每个 Epic 验证完成后，输出到 `docs/vibex-proposals-sprint28-qa/qa-report.md`：

```markdown
## E01: 实时协作整合 — QA 结果

| 检查项 | 结果 | 证据 |
|--------|------|------|
| PresenceLayer 渲染 | ✅ PASS | gstack /qa 断言通过 |
| useRealtimeSync RTDB 降级 | ✅ PASS | 代码审查：isFirebaseConfigured 存在 |
| TS 编译 0 errors | ✅ PASS | tsc --noEmit exit 0 |
| E2E presence-mvp.spec.ts | ⚠️ 179行存在，需执行 | wc -l |

**问题记录**:
- 无 P0/P1 问题

**截图**:
- `screenshots/e01-presence-avatars-20260508-0230.png`
```

### 5.2 最终报告汇总

```markdown
# VibeX Sprint 28 QA — 最终报告

**QA 日期**: 2026-05-08
**QA 执行人**: tester

## 汇总

| Epic | Layer 1 | Layer 2 | Layer 3 | 最终 |
|------|---------|---------|---------|------|
| E01 | ✅ | ✅ | ⏳ | — |
| E02 | ✅ | ✅ | ⏳ | — |
| E03 | ✅ | ✅ | — | ✅ |
| E04 | ✅ | ✅ | ⏳ | — |
| E05 | ✅ | ✅ | — | ✅ |
| E06 | ✅ | ✅ | ⏳ | — |
| E07 | ✅ | ✅ | — | ✅ |

## P0/P1 问题

| ID | Epic | 问题 | 状态 |
|----|------|------|------|
| — | — | 无 P0/P1 问题 | — |

## Sprint 验收结论

✅ Sprint 28 通过 QA 验收（6/7 Epic 全绿，E02 性能待 canary 最终确认）
```

---

## 6. Epic-Specific 约束

### 6.1 E01 — 实时协作整合

| 约束项 | 值 | 说明 |
|--------|----|------|
| gstack /qa 断言 | `[data-testid="presence-avatars"]` | 降级态验证 "仅您" 文案 |
| Firebase 降级 | 无 console.error | 静默降级 |
| 验证顺序 | 先代码审查，再 gstack | 代码先于 UI |

### 6.2 E02 — 性能优化

| 约束项 | 值 | 说明 |
|--------|----|------|
| gstack /canary | Lighthouse Performance ≥ 85 | 性能基准 |
| rowHeight | 必须是常量 `120 as const` | 非变量 |
| 虚拟化生效 | DOM nodes ~20 | 非 ~200 |

### 6.3 E03 — AI 辅助需求解析

| 约束项 | 值 | 说明 |
|--------|----|------|
| 降级路径 | 无 API Key → guidance 不阻断 | 代码审查 |
| timeout | AbortSignal.timeout(30_000) | 必须存在 |
| 验证顺序 | 先 curl，再 gstack | API 先于 UI |

### 6.4 E06 — ErrorBoundary

| 约束项 | 值 | 说明 |
|--------|----|------|
| 重试按钮 | "重试" 按钮存在 | getByText(/重试/i) |
| 重试逻辑 | resetErrorBoundary，无 reload | 代码审查 |
| 降级态 | 无 Firebase 时 Canvas 正常 | 代码审查 |

---

*本文件由 architect 定义 Sprint 28 QA 阶段开发约束，指导 tester 执行验证。*