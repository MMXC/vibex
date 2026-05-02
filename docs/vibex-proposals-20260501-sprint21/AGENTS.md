# VibeX Sprint 21 开发约束 — E2E 测试环境隔离

**项目**: vibex-proposals-20260501-sprint21
**版本**: 1.0
**日期**: 2026-05-02
**架构师**: ARCHITECT
**功能**: P005-R E2E 测试环境隔离

---

## 角色与职责

| 角色 | 负责人 | 职责 |
|------|--------|------|
| DevOps | 待分配 | Phase 0: Staging 环境部署，DNS 配置 |
| Dev | 待分配 | Phase 1-3: CI 配置、DB reset 脚本、Slack 集成 |
| Tester | 待分配 | Phase 4: E2E 验证、报告验收 |
| Architect | ARCHITECT | 架构设计、PR 评审 |
| PM | PM | 验收标准确认、staging 安全合规确认 |

---

## 约束清单

### C1: CI 禁止使用生产 BASE_URL

**约束**: `.github/workflows/test.yml` 中 `e2e` job 的 `BASE_URL` 环境变量**绝对不能**包含 `vibex.top` 域名。

**违规示例**:
```yaml
# 禁止 - 有生产 fallback
BASE_URL: ${{ vars.BASE_URL || 'https://vibex.top' }}
```

**合规示例**:
```yaml
# 合规 - 无 fallback，staging 必须存在
BASE_URL: ${{ vars.BASE_URL }}
```

**验证**: CI job 中必须有 inspection step 验证 BASE_URL 不含 `vibex.top`。

---

### C2: Staging 必须有 health check endpoint

**约束**: staging 部署必须暴露 `/api/health` endpoint，返回 HTTP 200。

**实现**:
```typescript
// 在 Hono backend 中
app.get('/api/health', (c) => c.json({ status: 'ok', env: process.env.NODE_ENV }));
```

**CI 要求**: e2e job 开始前必须等待 health check 通过（最多 3 次重试，每次 10s 间隔）。

---

### C3: DB reset 脚本必须可重复执行

**约束**: `scripts/e2e-db-reset.ts` 必须幂等，多次执行不破坏数据，只删除目标测试数据。

**验证**:
```bash
pnpm run e2e:db:reset
pnpm run e2e:db:reset  # 再次执行，不报错
```

---

### C4: E2E 测试 fixture 必须标记测试数据

**约束**: 所有在 E2E 测试中创建的数据，必须使用可识别的命名或字段标记，便于 reset 脚本清理。

**命名约定**:
```
E2E_{spec-name}_{timestamp}_{random}
例如: E2E_canvas_20260502_abc123
```

**字段约定**:
```typescript
// 创建 fixture 时
await db.insert(cards).values({
  name: `E2E_canvas_${Date.now()}`,
  // ... 其他字段
});
```

---

### C5: 禁止在 E2E 测试中依赖生产数据

**约束**: 所有 E2E 测试必须自包含，不依赖预先存在的生产用户账户、会话或卡片。

**违规示例**:
```typescript
// 禁止 - 依赖硬编码的 prod 用户 ID
const userId = 'prod-user-123';
```

**合规示例**:
```typescript
// 合规 - 测试自己创建所需数据
const { userId } = await createTestUser(); // from test fixtures
```

---

### C6: E2E 重试策略上限

**约束**: CI 中 Playwright `retries` 配置上限为 **3**，不允许超过此值。

**位置**: `playwright.ci.config.ts`

```typescript
retries: 3, // 上限，不可超过
```

**原因**: retries 过高会掩盖真实 flaky 问题，延迟发现数据隔离 bug。

---

### C7: Artifact 必须保留 JSON 摘要

**约束**: E2E job 必须生成 JSON 格式的测试结果摘要，供 Slack 集成使用。

**位置**: `playwright-report/results.json` (Playwright HTML reporter 自动生成)

**最小字段**:
```json
{
  "stats": { "passed": 18, "failed": 1, "skipped": 2 },
  "suites": [...]
}
```

---

### C8: Slack 报告只在 CI 失败时通知

**约束**: Slack webhook 报告只在 E2E job 有失败用例时触发，避免干扰。

**例外**: 连续 5 次全部通过后，发送一次"健康状态"通知。

---

## 禁止事项

| 禁止项 | 理由 |
|--------|------|
| 禁止在 CI 中 `grep -q "vibex.top"` 通过即放行 | 只检查 log 不够，BASE_URL 变量本身必须不含生产域名 |
| 禁止删除 staging DB 中的所有数据 | 会影响正在使用 staging 的其他进程 |
| 禁止在 E2E 测试中 `page.goto('https://vibex.top')` | 硬编码生产 URL，测试必须通过 BASE_URL 变量 |
| 禁止将 `e2e:db:reset` 设为默认 pretest hook | 开发者本地跑 E2E 不需要 reset（本地有独立 DB） |

---

## PR 合入要求

**必须满足以下所有条件才能合入**:

1. `BASE_URL` 在 CI log 中不含 `vibex.top`
2. `staging.vibex.top/api/health` 返回 200
3. Canvas E2E 在 staging 通过（`pnpm exec playwright test --project=canvas-e2e`）
4. Workbench E2E 在 staging 通过（`pnpm exec playwright test tests/e2e/workbench.spec.ts`）
5. `scripts/e2e-db-reset.ts` 存在且可执行（`pnpm run e2e:db:reset:dry` 通过）
6. `scripts/e2e-summary-to-slack.ts` 存在且类型检查通过
7. `playwright-report/results.json` 在 CI artifact 中

---

## 代码审查清单

### PR 审查必须检查

- [ ] `.github/workflows/test.yml` 中 BASE_URL 无生产 fallback
- [ ] `scripts/e2e-db-reset.ts` 存在且幂等
- [ ] `scripts/e2e-summary-to-slack.ts` 存在
- [ ] `tests/e2e/playwright.setup.ts` 调用 reset 脚本（仅 CI 环境）
- [ ] staging health check 在 e2e job 中存在
- [ ] `package.json` 有 `e2e:db:reset` script
- [ ] `.env.staging.example` 存在且配置完整
- [ ] 新增脚本通过 `tsc --noEmit` 类型检查

---

## 文件清单（新增/修改）

### 新增文件

| 文件 | 用途 |
|------|------|
| `scripts/e2e-db-reset.ts` | DB reset 脚本 |
| `scripts/e2e-summary-to-slack.ts` | Slack 报告摘要生成 |
| `.env.staging.example` | Staging 环境变量模板 |
| `docs/vibex-proposals-20260501-sprint21/architecture.md` | 架构文档（已产出）|
| `docs/vibex-proposals-20260501-sprint21/IMPLEMENTATION_PLAN.md` | 实施计划（已产出）|

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `.github/workflows/test.yml` | BASE_URL 移除生产 fallback，加 health check |
| `package.json` | 添加 `e2e:db:reset` script |
| `tests/e2e/playwright.setup.ts` | 添加 fixture reset hook |
| `.github/workflows/test.yml` | 添加 Slack webhook step |