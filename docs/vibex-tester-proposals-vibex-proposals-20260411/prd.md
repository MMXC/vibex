# PRD: Vibex 测试基础设施修复 & 新功能测试覆盖

**项目**: vibex-tester-proposals-vibex-proposals-20260411
**日期**: 2026-04-11
**负责人**: PM + Tester Agent
**状态**: Draft

---

## 1. 执行摘要

### 背景

Vibex 项目当前测试体系存在严重的基础设施问题，导致 CI 门禁形同虚设：

- `tests/e2e/playwright.config.ts` 中的 `grepInvert` 配置导致 CI 跳过 35+ 个 `@ci-blocking` 标记的测试
- Playwright 双重配置造成 expect timeout 不一致（根配置 30s vs 内部配置 10s）
- `stability.spec.ts` 路径错误（`./e2e/` 不存在），F1.1/F1.3 检查形同虚设
- 87 处 `waitForTimeout` 残留导致测试不稳定
- 同时，dev/20260411 Sprint 新增的 4 个功能点均无测试覆盖

### 目标

1. **P0**: 修复测试基础设施，恢复 CI 门禁有效性（运行 >= 50 个测试，expect timeout = 30s）
2. **P1**: 为 dev/20260411 新增功能添加测试覆盖（WebSocket logger 重构、project-snapshot API、generate-components flowId）
3. **P2**: 清理技术债务（waitForTimeout、canvas-e2e 路径、ai-service 单元测试）

### 成功指标

| 指标 | 目标值 | 当前值 |
|------|--------|--------|
| CI E2E 运行测试数 | >= 50 | 15 |
| CI expect timeout | 30000ms | 10000ms |
| stability.spec.ts 检测到 waitForTimeout 违规数 | > 0 | 0 |
| Playwright config 数量 | 1 | 2 |
| 新增 E2E/contract 测试 | >= 4 | 0 |
| 新增 backend unit 测试 | >= 2 | 0 |
| waitForTimeout 残留数 | 0 | 87 |

---

## 2. Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 | 优先级 |
|----|--------|------|---------|------|--------|
| F1 | 删除 grepInvert | 删除 `tests/e2e/playwright.config.ts` 中的 `grepInvert` 行，恢复 CI 运行所有测试 | T-P0-1 | 0.5h | P0 |
| F2 | 统一 Playwright 配置 | 删除 `tests/e2e/playwright.config.ts`，CI 统一使用根配置 | T-P0-2 | 1h | P0 |
| F3 | 修复 stability.spec.ts 路径 | 修正 `globSync` 路径 `e2e/` → `tests/e2e/` | T-P0-3 | 0.25h | P0 |
| F4 | generate-components flowId E2E | 添加 `ai-generate-components.spec.ts` 验证 flowId 存在且为 UUID | T-P0-4 | 2h | P0 |
| F5 | WebSocket logger 回归测试 | 添加 backend unit test 验证 console.* → logger 重构 | T-P1-1 | 1h | P1 |
| F6 | project-snapshot API 合约测试 | 添加 `project-snapshot.contract.spec.ts` 验证响应 schema | T-P1-2 | 1h | P1 |
| F7 | waitForTimeout 清理 | 清理 87 处残留，统一替换为网络等待 | T-P1-3 | 4h | P1 |
| F8 | canvas-e2e project 路径修复 | 修正 `testDir: './e2e'` → `'./tests/e2e'` | T-P2-1 | 0.25h | P2 |
| F9 | ai-service JSON 解析单元测试 | 添加 `ai-service.test.ts` 覆盖 markdown JSON 提取边界条件 | T-P2-2 | 1h | P2 |

**工时合计**: ~10.5h

---

## 3. Epic 拆分

### Epic 1: 测试基础设施修复（CI 门禁）

**工时**: 1.75h

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 删除 grepInvert 配置 | 0.5h | `grepInvert` 不出现在 `tests/e2e/playwright.config.ts`；CI 运行测试数 >= 50 |
| E1-S2 | 删除双重 Playwright 配置 | 1h | `tests/e2e/playwright.config.ts` 不存在；CI 使用根配置运行；expect timeout = 30000ms |
| E1-S3 | 修复 stability.spec.ts 路径 | 0.25h | `stability.spec.ts` 能正确检测到 `waitForTimeout` 违规（> 0 条）；globSync 路径为 `tests/e2e/**/*.spec.ts` |

**验收标准**:
```ts
// E1-S1
expect(grepContent).not.toContain('grepInvert');
expect(testCount).toBeGreaterThanOrEqual(50);

// E1-S2
expect(fileExists('tests/e2e/playwright.config.ts')).toBe(false);
expect(timeoutValue).toBe(30000);

// E1-S3
expect(violationCount).toBeGreaterThan(0);
expect(globPattern).toContain('tests/e2e');
```

---

### Epic 2: generate-components flowId E2E 测试

**工时**: 2h

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | 创建 ai-generate-components.spec.ts | 2h | 测试文件存在；测试能拦截 `/api/.*generate-components` 请求；验证 body.flowId 存在且为 UUID v4 格式 |

**验收标准**:
```ts
// E2-S1
test('generate-components should include flowId in request', async ({ page }) => {
  await page.goto('/canvas');
  const [request] = await Promise.all([
    page.waitForRequest(/\/api\/.*generate-components/),
    page.click('[data-testid="generate-components-btn"]'),
    page.fill('[data-testid="requirement-input"]', '生成一个登录表单'),
    page.click('[data-testid="generate-submit"]'),
  ]);
  const body = JSON.parse(request.postData());
  expect(body.flowId).toBeDefined();
  expect(body.flowId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
```

---

### Epic 3: WebSocket logger 回归测试

**工时**: 1h

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | 添加 backend WebSocket logger 单元测试 | 1h | `connectionPool.ts` 中无 `console.` 调用；backend unit test 验证 logger 被正确调用（通过 mock 或日志输出验证） |

**验收标准**:
```ts
// E3-S1
test('connectionPool should use logger instead of console.log', () => {
  const consoleLogCalls = grep('console\\.', 'vibex-backend/src/services/websocket/connectionPool.ts');
  expect(consoleLogCalls).toHaveLength(0);
});

test('logger receives correct parameters on connection open', () => {
  // Mock logger, simulate connection open
  // Verify logger.info called with expected message
  expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('connection open'));
});
```

---

### Epic 4: project-snapshot API 合约测试

**工时**: 1h

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | 创建 project-snapshot.contract.spec.ts | 1h | 测试 `GET /api/projects/:id/snapshots` 返回 200；响应为数组；每项包含 `id`, `createdAt`, `data` 字段 |

**验收标准**:
```ts
// E4-S1
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

---

### Epic 5: waitForTimeout 清理

**工时**: 4h

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E5-S1 | 清理 conflict-resolution.spec.ts 中的 8 处 waitForTimeout | 0.5h | 8 处全部替换为 `page.waitForResponse()` + `page.waitForSelector()` |
| E5-S2 | 清理 conflict-dialog.spec.ts 中的 6 处 waitForTimeout | 0.5h | 6 处全部替换为网络等待 |
| E5-S3 | 清理 auto-save.spec.ts 中的 5 处 waitForTimeout | 0.5h | `waitForTimeout(2500)` → `page.waitForResponse(/\/api\/.*snapshot/, {timeout: 5000})` |
| E5-S4 | 清理 login-state-fix.spec.ts 中的 ~10 处 waitForTimeout | 0.75h | `waitForTimeout(2000)` → `page.waitForLoadState('networkidle')` |
| E5-S5 | 清理剩余文件中的 waitForTimeout（~58 处） | 1.75h | 总残留数 <= 0（不含 stability.spec.ts 自身检测代码） |

**验收标准**:
```bash
grep -rn "waitForTimeout" vibex-fronted/tests/e2e/ --include="*.ts" | grep -v "stability.spec.ts\|comment\|FIXME\|flaky"
# 应返回 0 行
```

---

### Epic 6: 技术债务清理与新功能单元测试

**工时**: 1.25h

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E6-S1 | 修复 canvas-e2e project testDir 路径 | 0.25h | `canvas-e2e` project 能找到 >= 1 个测试（非 0） |
| E6-S2 | 创建 ai-service 单元测试 | 1h | 测试 `parseJSONWithRetry` 覆盖 3 个边界：markdown 包裹、whitespace、超长截断 |

**验收标准**:
```ts
// E6-S1
test('canvas-e2e project finds tests', () => {
  const testCount = exec('npx playwright test --project=canvas-e2e --list | grep "·" | wc -l');
  expect(Number(testCount)).toBeGreaterThan(0);
});

// E6-S2
test('parseJSONWithRetry extracts JSON from markdown', () => {
  const input = '```json\n{"flowId": "123"}\n```';
  expect(parseJSONWithRetry(input)).toEqual({ flowId: '123' });
});
test('parseJSONWithRetry handles whitespace', () => {
  const input = '   \n  {"ok": true}  \n  ';
  expect(parseJSONWithRetry(input)).toEqual({ ok: true });
});
```

---

## 4. 功能点汇总表（含页面集成标注）

| Feature | 测试文件 | 测试类型 | 测试框架 | 集成页面 |
|---------|---------|---------|---------|---------|
| F1 删除 grepInvert | N/A（配置修复） | — | — | CI workflow |
| F2 统一 Playwright 配置 | N/A（配置修复） | — | — | CI workflow |
| F3 修复 stability.spec.ts | `stability.spec.ts` | E2E | Playwright | N/A（测试治理） |
| F4 flowId E2E | `ai-generate-components.spec.ts` | E2E | Playwright | /canvas |
| F5 WebSocket logger | `connectionPool.test.ts` | backend unit | Vitest | WebSocket 连接池 |
| F6 project-snapshot 合约 | `project-snapshot.contract.spec.ts` | contract | Playwright | /api/projects/:id/snapshots |
| F7 waitForTimeout 清理 | 多个 spec.ts 文件 | E2E | Playwright | /canvas, /conflicts, /login 等 |
| F8 canvas-e2e 路径 | N/A（配置修复） | — | — | Playwright projects |
| F9 ai-service 单元测试 | `ai-service.test.ts` | backend unit | Vitest | /api/ai/* endpoints |

---

## 5. 验收标准总览

| 层级 | 标准 | 验证方式 |
|------|------|---------|
| CI 门禁 | CI E2E 运行 >= 50 个测试 | `CI=true npx playwright test --list \| grep "·" \| wc -l` |
| CI 门禁 | CI expect timeout = 30000ms | `grep "expect" playwright.config.ts` |
| CI 门禁 | stability.spec.ts 检测到 > 0 条违规 | `npx playwright test stability.spec.ts` |
| CI 门禁 | Playwright config 仅 1 个 | `ls tests/e2e/playwright.config.ts` 应失败 |
| 新功能覆盖 | generate-components flowId E2E 存在 | `test -f ai-generate-components.spec.ts` |
| 新功能覆盖 | project-snapshot contract test >= 1 个 | `npx playwright test --grep snapshot` |
| 新功能覆盖 | backend unit test >= 2 个 | `npx vitest run src/services/` |
| 技术债务 | waitForTimeout 残留 = 0 | `grep -rn "waitForTimeout" tests/e2e/` |
| 技术债务 | canvas-e2e project testCount > 0 | `npx playwright test --project=canvas-e2e --list` |

---

## 6. Definition of Done

### Epic 1 Done
- [ ] `grepInvert` 从 `tests/e2e/playwright.config.ts` 中移除
- [ ] `tests/e2e/playwright.config.ts` 文件已删除
- [ ] CI workflow 已更新为使用根 `playwright.config.ts`
- [ ] `stability.spec.ts` globSync 路径已修正为 `tests/e2e/**/*.spec.ts`
- [ ] `stability.spec.ts` 运行时能检测到 waitForTimeout 违规（> 0 条）

### Epic 2 Done
- [ ] `ai-generate-components.spec.ts` 已创建
- [ ] 测试验证 `flowId` 存在且为 UUID v4 格式
- [ ] 测试在 CI 环境下能通过

### Epic 3 Done
- [ ] `connectionPool.ts` 中无 `console.log/console.error` 调用
- [ ] backend unit test 验证 logger 调用参数正确

### Epic 4 Done
- [ ] `project-snapshot.contract.spec.ts` 已创建
- [ ] 测试验证 `GET /api/projects/:id/snapshots` 返回 schema 正确
- [ ] 测试在 CI 环境下能通过

### Epic 5 Done
- [ ] 所有 spec 文件中 waitForTimeout 残留数 = 0（不含 stability.spec.ts 自身检测代码）
- [ ] 替换后测试仍能通过（不引入新失败）
- [ ] 新增的 waitForTimeout 使用 network-aware 等待替代

### Epic 6 Done
- [ ] canvas-e2e project testDir 已修正
- [ ] `ai-service.test.ts` 覆盖 3 个边界条件（markdown、whitespace、truncation）
- [ ] Vitest 能正常运行 backend unit tests

---

## 7. 实施计划（Sprint 排期）

### Sprint 1: 测试基础设施修复（Day 1，4h）

| 任务 | 执行者 | 工时 | 内容 |
|------|--------|------|------|
| E1-S1 grepInvert 删除 | Tester | 0.5h | 删除 `grepInvert` 行或整个文件 |
| E1-S2 双重配置清理 | Dev | 1h | 删除 `tests/e2e/playwright.config.ts`，更新 CI workflow |
| E1-S3 stability 路径修复 | Tester | 0.25h | 修正 globSync 路径 |
| E1 验收验证 | Tester | 0.5h | 验证 CI 运行 >= 50 测试，timeout = 30s，stability 检测到违规 |
| E2-S1 generate-components E2E | Tester | 2h | 创建 `ai-generate-components.spec.ts` |

**Sprint 1 产出**: CI 门禁恢复有效性，新增 1 个 E2E 测试

### Sprint 2: 新功能测试覆盖（Day 2，3h）

| 任务 | 执行者 | 工时 | 内容 |
|------|--------|------|------|
| E3-S1 WebSocket logger 回归测试 | Tester | 1h | 创建 `connectionPool.test.ts`，验证 logger 调用 |
| E4-S1 project-snapshot 合约测试 | Tester | 1h | 创建 `project-snapshot.contract.spec.ts` |
| E6-S1 canvas-e2e 路径修复 | Tester | 0.25h | 修正 testDir 路径 |
| E6-S2 ai-service 单元测试 | Tester | 1h | 创建 `ai-service.test.ts`，3 个边界条件 |

**Sprint 2 产出**: 新增 4 个测试（1 contract、2 backend unit、1 配置修复）

### Sprint 3: waitForTimeout 清理（Day 3，4h）

| 任务 | 执行者 | 工时 | 内容 |
|------|--------|------|------|
| E5-S1 conflict-resolution 清理 | Tester | 0.5h | 替换 8 处为 `waitForResponse`/`waitForSelector` |
| E5-S2 conflict-dialog 清理 | Tester | 0.5h | 替换 6 处 |
| E5-S3 auto-save 清理 | Tester | 0.5h | 替换 5 处为 `waitForResponse` |
| E5-S4 login-state-fix 清理 | Tester | 0.75h | 替换 ~10 处为 `waitForLoadState` |
| E5-S5 剩余文件清理 | Tester | 1.75h | 替换 ~58 处 |
| E5 验收验证 | Tester | 0.5h | 验证残留数 = 0 |

**Sprint 3 产出**: E2E 测试稳定性提升，零不稳定等待

---

## 8. 风险缓解

| 风险 | 缓解措施 |
|------|---------|
| 删除 `tests/e2e/playwright.config.ts` 后 CI 无法运行 | 提前在本地验证 `CI=true pnpm run test:e2e:ci` |
| stability.spec.ts 修复后 87 处 FAIL 导致 CI 红 | 先批量清理 waitForTimeout 再验证 stability |
| 新增 E2E 测试不稳定导致 CI flaky | 使用 `force:true` + 网络等待替代 waitForTimeout |
| WebSocket logger 重构破坏生产日志 | 添加 backend unit test 验证 logger 调用 |
| waitForTimeout 清理引入新失败 | 每文件清理后运行 `npx playwright test <file>` 验证 |
