# Tester 提案 — 2026-04-11

**Agent**: tester
**日期**: 2026-04-11
**项目**: vibex-tester-proposals-vibex-proposals-20260411
**产出**: docs/vibex-tester-proposals-vibex-proposals-20260411/tester.md
**对比基准**: vibex-tester-proposals-vibex-proposals-20260410

---

## 提案列表

| ID | 类别 | 问题/优化点 | 优先级 | 对比04-10变化 |
|----|------|-------------|--------|--------------|
| T-P0-1 | Bug | `@ci-blocking` grepInvert **仍未移除** — CI 跳过 35+ 测试，P0 遗留 | P0 | ❌ 连续第3轮未修复 |
| T-P0-2 | Bug | `tests/e2e/playwright.config.ts` expect timeout=10s vs 根配置=30s | P0 | ❌ 连续第3轮未修复 |
| T-P0-3 | Bug | `stability.spec.ts` 路径 `./e2e/` 不存在 — F1.1/F1.3 检查形同虚设 | P0 | ❌ 连续第3轮未修复 |
| T-P0-4 | Bug | `generate-components` flowId 修复 **无 E2E 验证** | P0 | 🆕 关联 20260410 P0 修复 |
| T-P1-1 | Feature | backend console.log → logger 重构 **无回归测试** | P1 | 🆕 关联 dev/20260411 P0 |
| T-P1-2 | Feature | `project-snapshot.ts` 5个 TODO 修复 **无 API 合约测试** | P1 | 🆕 关联 dev/20260411 P0 |
| T-P1-3 | Bug | `waitForTimeout` 仍有 87 处残留（比04-10增加 67 处） | P1 | ⚠️ 新增测试引入更多 waitForTimeout |
| T-P2-1 | Bug | `canvas-e2e` project `testDir: './e2e'` 不存在 — 项目形同虚设 | P2 | ❌ 未修复 |
| T-P2-2 | Feature | `ai-service.ts` JSON 解析增强无单元测试覆盖 | P2 | 🆕 新发现 |

---

## 详细提案

### T-P0-1: `@ci-blocking` grepInvert 仍未移除（P0 遗留，第3轮）

**问题描述**:
`vibex-fronted/tests/e2e/playwright.config.ts` 第11行：
```ts
grepInvert: process.env.CI ? /@ci-blocking/ : undefined,
```
GitHub Actions CI E2E job 跳过所有带 `@ci-blocking` 标记的测试。

**影响范围**（35+ 测试被跳过）:
- `conflict-resolution.spec.ts` — 冲突解决（用户核心路径）
- `undo-redo.spec.ts` — 撤销重做
- `canvas-quality-ci.spec.ts` — Canvas 质量检查
- 所有 a11y 测试（canvas、export、homepage）
- `homepage-tester-report.spec.ts` — 首页测试报告生成

**历史记录**:
- 2026-04-08: 首次提出 P0
- 2026-04-10: 再次提出，仍未修复
- 2026-04-11: **连续第3轮，仍未修复**

**建议方案**:
```ts
// tests/e2e/playwright.config.ts 第11行
// 修改前:
grepInvert: process.env.CI ? /@ci-blocking/ : undefined,
// 修改后:
grepInvert: undefined,
```

**验证方法**:
```bash
# 确认 grepInvert 已移除
grep "grepInvert" vibex-fronted/tests/e2e/playwright.config.ts
# 应无输出

# 确认运行测试数量 >= 50
CI=true npx playwright test --list 2>/dev/null | grep "·" | wc -l
```

---

### T-P0-2: Playwright 双重配置 expect timeout 不一致（P0 遗留，第3轮）

**问题描述**:
| 配置 | 文件 | expect timeout |
|------|------|---------------|
| 根配置 | `vibex-fronted/playwright.config.ts` | **30000ms** ✅ |
| 内部配置 | `vibex-fronted/tests/e2e/playwright.config.ts` | **10000ms** ❌ |

CI workflow 运行 `tests/e2e/playwright.config.ts`，实际断言超时仅 10s。

**历史记录**:
- 2026-04-08: 首次提出 P0
- 2026-04-10: 再次提出，仍未修复
- 2026-04-11: **连续第3轮，仍未修复**

**建议方案**:
删除 `tests/e2e/playwright.config.ts`，统一使用根配置。CI workflow 改为：
```bash
npx playwright test --config=vibex-fronted/playwright.config.ts
```

**验证方法**:
```bash
# 确认内部配置已删除
ls vibex-fronted/tests/e2e/playwright.config.ts
# 应: No such file or directory

# 确认 CI config 的 expect.timeout
grep "expect" vibex-fronted/playwright.config.ts
# 应: timeout: 30000
```

---

### T-P0-3: `stability.spec.ts` 路径错误导致 F1.1/F1.3 检查形同虚设（P0 遗留）

**问题描述**:
```ts
// stability.spec.ts 第7行
const testFiles = globSync('e2e/**/*.spec.ts', { cwd: resolve(__dirname, '../..') });
```
路径 `./e2e/` 在项目中不存在，测试永远返回 0 个结果。

**实际文件位置**: `tests/e2e/*.spec.ts`

**历史记录**:
- 2026-04-10: 首次提出
- 2026-04-11: **连续第2轮，仍未修复**

**建议方案**:
```ts
// 修改前:
const testFiles = globSync('e2e/**/*.spec.ts', { cwd: resolve(__dirname, '../..') });

// 修改后:
const testFiles = globSync('tests/e2e/**/*.spec.ts', { cwd: resolve(__dirname, '../..') });
```

**验证方法**:
```bash
# 修复后，F1.1 应检测到 87 处 waitForTimeout
npx playwright test stability.spec.ts
# 应 FAIL 并列出 87 处违规
```

---

### T-P0-4: `generate-components` flowId 修复无 E2E 验证

**问题描述**:
2026-04-06 的 P0 修复了 `generate-components` 的 `flowId` 缺失问题，但该修复**没有对应的 E2E 测试验证**。

**影响范围**: AI 生成组件流程（用户核心路径）

**建议方案**:
在 `vibex-fronted/tests/e2e/` 添加 `ai-generate-components.spec.ts`：
```ts
test('generate-components should include flowId in request', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="generate-components-btn"]');
  
  // 拦截请求，验证 flowId 存在
  const [request] = await Promise.all([
    page.waitForRequest(/\/api\/.*generate-components/),
    page.fill('[data-testid="requirement-input"]', '生成一个登录表单'),
    page.click('[data-testid="generate-submit"]'),
  ]);
  
  const postData = request.postData();
  expect(postData).toBeDefined();
  const body = JSON.parse(postData);
  expect(body.flowId).toBeDefined();
  expect(body.flowId).toMatch(/^[0-9a-f-]{36}$/);
});
```

**验证方法**:
```bash
npx playwright test ai-generate-components.spec.ts --grep "flowId"
```

---

### T-P1-1: backend console.log → logger 重构无回归测试

**问题描述**:
dev/20260411 提案将 `websocket/connectionPool.ts` 中的 4 处 `console.log` 替换为 `logger.info/error`。但 WebSocket 消息处理的日志路径**没有回归测试**。

**影响范围**: WebSocket 连接池（生产环境高流量路径）

**建议方案**:
1. 添加 WebSocket 日志行为的 E2E 测试（如果可行）
2. 或添加 backend 单元测试 mock logger，验证调用参数
3. 或添加 backend integration test 验证日志格式

**验证方法**:
```bash
# 验证 console.* 不再出现在 connectionPool.ts
grep -n "console\." vibex-backend/src/services/websocket/connectionPool.ts
# 应无输出

# 验证 logger 被正确调用（通过日志输出或 mock）
```

---

### T-P1-2: `project-snapshot.ts` TODO 修复无 API 合约测试

**问题描述**:
dev/20260411 提案修复 `project-snapshot.ts` 中 5 个返回假数据的 TODO，改为查询真实表。但 `/api/projects/:id/snapshots` 接口**没有合约测试**验证响应 schema。

**建议方案**:
在 `vibex-fronted/tests/contract/` 添加 `project-snapshot.contract.spec.ts`：
```ts
test('GET /api/projects/:id/snapshots returns valid snapshot array', async ({ request }) => {
  const response = await request.get('/api/projects/test-project-id/snapshots');
  expect(response.status()).toBe(200);
  
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
  for (const snapshot of body) {
    expect(snapshot).toHaveProperty('id');
    expect(snapshot).toHaveProperty('createdAt');
    expect(snapshot).toHaveProperty('data');
  }
});
```

**验证方法**:
```bash
npx playwright test project-snapshot.contract.spec.ts
```

---

### T-P1-3: `waitForTimeout` 87 处残留（比04-10增加 67 处）

**问题描述**:
从 20+ 处增长到 87 处，主要增量来源：

| 文件 | 数量 | 说明 |
|------|------|------|
| `login-state-fix.spec.ts` | ~10 处 | 20260406 新增 |
| `final-verification-test.ts` | ~2 处 | 新文件 |
| `conflict-resolution.spec.ts` | 8 处 | 04-10 已识别 |
| `conflict-dialog.spec.ts` | 6 处 | 04-10 已识别 |
| `auto-save.spec.ts` | 5 处 | 04-10 已识别 |

**建议方案**:
按文件逐个替换：
- `conflict-resolution.spec.ts`: `waitForTimeout` → `page.waitForResponse()` + `page.waitForSelector()`
- `auto-save.spec.ts`: `waitForTimeout(2500)` → `page.waitForResponse(/\/api\/.*snapshot/, {timeout: 5000})`
- `login-state-fix.spec.ts`: `waitForTimeout(2000)` → `page.waitForLoadState('networkidle')`

**验证方法**:
```bash
grep -rn "waitForTimeout" vibex-fronted/tests/e2e/ \
  --include="*.ts" | grep -v "stability.spec.ts\|comment\|FIXME\|flaky"
# 应返回 0 行（仅 stability.spec.ts 自身检测代码中可存在）
```

---

### T-P2-1: `canvas-e2e` project `testDir: './e2e'` 不存在（P2 遗留）

**问题描述**:
根 `vibex-fronted/playwright.config.ts` 第37行：
```ts
{ name: 'canvas-e2e', testDir: './e2e', use: {...devices['Desktop Chrome']} }
```
`./e2e` 目录不存在，canvas-e2e project 无法找到任何测试。

**建议方案**:
修改为 `testDir: './tests/e2e'` 或删除该 project（如果 canvas 测试已在 `tests/e2e/` 中）。

**验证方法**:
```bash
npx playwright test --project=canvas-e2e --list 2>/dev/null | grep "·" | wc -l
# 应 >= 1（非 0）
```

---

### T-P2-2: `ai-service.ts` JSON 解析增强无单元测试

**问题描述**:
dev/20260411 提案增强 `ai-service.ts` 的 `parseJSONWithRetry`，添加 markdown JSON 提取。但该增强**没有单元测试验证边界条件**：
- AI 回复带 ` ```json ... ``` ` 包裹
- AI 回复带多余 whitespace
- 超长回复 token 截断

**建议方案**:
在 `vibex-backend/src/services/__tests__/` 添加 `ai-service.test.ts`：
```ts
describe('parseJSONWithRetry', () => {
  it('should extract JSON from markdown code block', () => {
    const input = '```json\n{"flowId": "123"}\n```';
    expect(parseJSONWithRetry(input)).toEqual({ flowId: '123' });
  });

  it('should handle whitespace-only JSON', () => {
    const input = '   \n  {"ok": true}  \n  ';
    expect(parseJSONWithRetry(input)).toEqual({ ok: true });
  });
});
```

**验证方法**:
```bash
cd vibex-backend && npx vitest run src/services/ai-service.test.ts
```

---

## 附录：测试资产状态（2026-04-11）

| 资产 | 数量/状态 | 对比04-10 |
|------|-----------|-----------|
| E2E 测试文件 | 58+ 个 spec | — |
| GitHub Actions E2E CI | ✅ 存在 | — |
| @ci-blocking 跳过 | ❌ 仍在 tests/e2e config | ❌ 连续3轮未修复 |
| Playwright 双重配置 | ❌ 仍存在（timeout 10s vs 30s）| ❌ 连续3轮未修复 |
| stability.spec.ts 路径错误 | ❌ 仍未修复 | ❌ 连续2轮未修复 |
| waitForTimeout 残留 | ⚠️ **87处**（增加67处）| ⚠️ 恶化 |
| canvas-e2e project 路径错误 | ❌ 仍未修复 | ❌ 未修复 |
| useAutoSave 被 exclude | ⚠️ 仍未修复 | ❌ 未修复 |
| Contract 测试 | 1 个 | ❌ 未扩展 |
| 20260411 新增测试需求 | 4 项（flowId、snapshot、ai-service、console.log） | 🆕 |
| MSW | ❌ 未引入 | ❌ 仍缺失 |

---

## 立即行动项（按优先级）

1. **T-P0-1** [Tester+Dev]: 删除 `tests/e2e/playwright.config.ts` 的 `grepInvert` 行（5min）
2. **T-P0-2** [Dev]: 删除 `tests/e2e/playwright.config.ts` 重复配置，CI 统一使用根配置（10min）
3. **T-P0-3** [Tester]: 修复 `stability.spec.ts` 路径 `e2e/` → `tests/e2e/`（2min）
4. **T-P0-4** [Tester]: 添加 `generate-components` flowId E2E 验证（30min）
5. **T-P1-1** [Tester+Dev]: 添加 WebSocket logger 重构回归测试（1h）
6. **T-P1-2** [Tester]: 添加 project-snapshot API 合约测试（1h）
7. **T-P1-3** [Tester]: 清理 87 处 `waitForTimeout`（4h）

---

*本提案由 Tester Agent 生成于 2026-04-11*
*对比基准: vibex-tester-proposals-vibex-proposals-20260410*
