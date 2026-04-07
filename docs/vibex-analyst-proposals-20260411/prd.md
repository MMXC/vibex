# PRD: VibeX Analyst 提案执行闭环 — 2026-04-11

**项目**: vibex-analyst-proposals-vibex-proposals-20260411
**版本**: 1.0
**日期**: 2026-04-11
**PM**: PM Agent
**状态**: Draft

---

## 1. 执行摘要

### 背景

VibeX 项目存在 **提案识别能力强、执行落地能力弱** 的结构性矛盾。连续两轮 P0 提案（Slack token 迁移、ESLint any 清理、PrismaClient Workers 守卫、@ci-blocking 清理）被识别但未执行，演变为系统性债务。根本原因：**提案追踪 CLI 使用率 0%，TRACKING.md 靠手动维护，无执行闭环机制**。

当前影响：
- 全团队涉及 `task_manager.py` 的 commit 被 GitHub secret scanning 阻断（临时方案：git cherry-pick）
- 8+ API 路由无法部署到 Cloudflare Workers
- CI 测试门禁形同虚设，35+ 测试被跳过
- 9 个 TypeScript 文件含显式 `any`，类型安全倒退

### 目标

**Sprint 内目标**：消除 4 个 P0 遗留项，建立提案执行闭环机制，防止再次堆积。

**本PRD目标**：将 11 条改进提案落地为可执行 Epic，形成完整的验收标准和 Sprint 排期。

### 成功指标

| 指标 | 当前值 | Sprint 目标 |
|------|--------|-------------|
| P0 遗留数 | 4 | **0** |
| ESLint `any` 文件数 | 9 | **0** |
| @ci-blocking 跳过测试数 | 35+ | **0** |
| 提案执行闭环率 | ~0% | **≥ 80%** |
| task_manager.py 含硬编码 token | 是 | **否** |
| Wrangler 部署成功率 | 0% (路由级失败) | **100%** |

---

## 2. Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 (Option A) |
|----|--------|------|----------|-----------------|
| A-P0-1 | Slack Token 环境变量迁移 | 将 task_manager.py 硬编码的 xoxp- token 迁移到环境变量 | P0 遗留 | 0.5h |
| A-P0-2 | ESLint no-explicit-any 清理 | 清理 9 个 TypeScript 文件中的显式 any | P0 遗留 | 1h |
| A-P0-3 | PrismaClient Workers 守卫 | 为 8+ API 路由添加 CF Workers 环境守卫 | P0 遗留 | 1h |
| A-P0-4 | @ci-blocking 批量移除 | 移除所有跳过注释并修复相关测试 | P0 遗留 | 1h |
| A-P1-1 | Tree Toolbar 按钮样式归一 | 将 4 种按钮样式统一为 ≤ 2 种 | Tech Debt | 0.5h |
| A-P1-2 | selectedNodeIds 状态统一 | 统一状态源，消除 treeStore/canvasStore 重复定义 | Tech Debt | 0h (Option A 跳过) |
| A-P1-3 | componentStore 批量方法 | 新增 batchAdd/batchDelete/batchUpdate | Tech Debt | 0h (Option A 跳过) |
| A-P1-4 | 提案追踪 CLI CI 集成 | 将 CLI 集成到 CI，强制更新 TRACKING.md | Process | 2h |
| A-P1-5 | generate-components E2E 测试 | 补充 Playwright E2E 测试验证 flowId | P0 遗留 | 1h |
| A-P2-1 | ComponentRegistry 版本化 | 引入版本号 + hash 热更新 | Tech Debt | 0h (Phase 2) |
| A-P2-2 | Reviewer 任务去重 | 避免同一 PR 被多个 subagent review | Process | 0h (Phase 2) |

**Option A 总工时：7h**（止血方案，本 Sprint 执行）
**Option B 总工时：26.5h**（系统性提升，下 Sprint 执行）

---

## 3. Epic 拆分表

### Epic 1: P0 Tech Debt 紧急修复（止血）

**工时**: 3.5h
**包含 Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | Slack Token 环境变量迁移 | 0.5h | task_manager.py 中无 `xoxp-` 字符串；`.env.example` 包含 `SLACK_TOKEN=`；git push 不被阻断 |
| S1.2 | ESLint no-explicit-any 清理 | 1h | `tsc --noEmit` 无 any 错误；`eslint --rule 'typescript/no-explicit-any: error'` 通过 |
| S1.3 | PrismaClient Workers 守卫 | 1h | `wrangler deploy` 成功；8+ API 路由在 CF Workers 正常响应；Prisma 连接延迟 < 50ms |
| S1.4 | @ci-blocking 批量移除 | 1h | 所有 `@ci-blocking` 注释移除；CI 测试 100% 通过；回归测试覆盖率 ≥ 80% |

### Epic 2: P1 Tech Debt + Process 改进

**工时**: 3.5h（Option A）/ 12.5h（Option B）
**包含 Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | Tree Toolbar 按钮样式归一 | 0.5h | Toolbar 按钮样式归一为 ≤ 2 种；截图对比审查无明显视觉差异 |
| S2.2 | selectedNodeIds 状态统一 | 3h（Option B） | 单一 `selectedNodeIds` 定义源；多选切换状态同步正确 |
| S2.3 | componentStore 批量方法 | 3h（Option B） | 批量操作 API 响应时间 < 500ms（100 组件）；事务回滚支持 |
| S2.4 | 提案追踪 CLI CI 集成 | 2h | 连续 3 个 Sprint CLI 使用率 ≥ 80%；TRACKING.md 无需手动编辑；CI 强制状态更新 |
| S2.5 | generate-components E2E 测试 | 1h | E2E 测试通过；flowId 在组件元数据中正确记录 |

### Epic 3: P2 基础设施提升（Phase 2）

**工时**: 5h（Option B 延后）
**包含 Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | ComponentRegistry 版本化 | 3h | 组件版本变更自动热更新；无需手动清除缓存 |
| S3.2 | Reviewer 任务去重 | 2h | 同一 PR 不被并发 review；review 任务去重率 ≥ 90% |

---

## 4. 验收标准（expect() 断言）

### S1.1: Slack Token 环境变量迁移
```python
# 验收断言
def test_slack_token_migration():
    content = read("scripts/task_manager.py")
    assert "xoxp-" not in content, "xoxp- 字符串仍存在于 task_manager.py"
    assert "os.environ" in content, "未使用环境变量"
    
    env_example = read(".env.example")
    assert "SLACK_TOKEN=" in env_example, ".env.example 未包含 SLACK_TOKEN"
```

### S1.2: ESLint no-explicit-any 清理
```bash
# 验收命令
tsc --noEmit
eslint --rule 'typescript/no-explicit-any: error' packages/ services/ --max-warnings 0
```

### S1.3: PrismaClient Workers 守卫
```bash
# 验收命令
wrangler deploy  # 无 PrismaClient 加载错误
# API 响应验证
curl -s https://api.example.com/api/generate-components -w "%{http_code}" | grep "200\|201"
```

### S1.4: @ci-blocking 批量移除
```bash
# 验收命令
grep -rn "@ci-blocking" --include="*.test.ts" --include="*.spec.ts"
# 预期：无输出
npm run test  # 100% 通过
```

### S2.1: Tree Toolbar 按钮样式归一
```typescript
// 验收：按钮样式种数
const buttonStyles = countUniqueToolbarStyles();
// expect(buttonStyles).toBeLessThanOrEqual(2);
```

### S2.5: generate-components E2E 测试
```typescript
// Playwright E2E
test('generate-components 正确关联 flowId', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="generate-components-btn"]');
  const response = await page.waitForResponse('**/api/generate-components');
  const data = await response.json();
  expect(data.flowId).toBeDefined();
  expect(data.components.length).toBeGreaterThan(0);
});
```

---

## 5. Definition of Done

### Epic 1 DoD（P0 紧急修复）
- [ ] `scripts/task_manager.py` 中无 `xoxp-` 字符串（grep 验证）
- [ ] `.env.example` 包含 `SLACK_TOKEN=` 示例
- [ ] `git push` 对包含 task_manager.py 的 commit 不被阻断
- [ ] `tsc --noEmit` 无 any 错误
- [ ] `wrangler deploy` 成功，无 PrismaClient 加载错误
- [ ] 所有 `@ci-blocking` 注释移除（grep 验证）
- [ ] CI 测试 100% 通过（`npm run test`）
- [ ] PR review 通过

### Epic 2 DoD（P1 改进）
- [ ] Tree Toolbar 按钮样式归一为 ≤ 2 种（截图对比）
- [ ] 提案追踪 CLI 集成到 CI pipeline
- [ ] `TRACKING.md` 更新由 CI 自动完成，无需手动编辑
- [ ] generate-components E2E 测试通过
- [ ] PR review 通过

### Epic 3 DoD（P2 基础设施）
- [ ] ComponentRegistry 支持版本 + hash 热更新
- [ ] Reviewer 任务派发去重逻辑实现并验证
- [ ] PR review 通过

---

## 6. 功能点汇总表（含页面集成标注）

| Story ID | 功能点 | 涉及文件/模块 | 页面/组件 | 测试类型 | 依赖 |
|----------|--------|--------------|-----------|----------|------|
| S1.1 | Slack Token 迁移 | scripts/task_manager.py, .env.example | N/A（构建脚本） | 集成测试 | — |
| S1.2 | ESLint any 清理 | 9 个 TS 文件（packages/, services/） | 全局 | ESLint | — |
| S1.3 | Workers 守卫 | api/routes/*.ts | API 层 | 部署验证 | CF Workers |
| S1.4 | @ci-blocking 移除 | 测试文件 35+ | 全局 | 单元+E2E | — |
| S2.1 | Toolbar 样式归一 | components/Tree/Toolbar.* | Tree 组件 | 截图审查 | — |
| S2.2 | selectedNodeIds 统一 | treeStore.ts, canvasStore.ts | Canvas + Tree | 集成测试 | — |
| S2.3 | 批量方法 | services/componentStore.ts | Canvas | 单元测试 | — |
| S2.4 | CLI CI 集成 | CI pipeline, proposal_tracker.py | N/A（CI） | CI 验证 | — |
| S2.5 | E2E flowId 测试 | tests/e2e/generate-components.spec.ts | Canvas | E2E | Playwright |
| S3.1 | Registry 版本化 | packages/component-registry/ | Canvas | 集成测试 | — |
| S3.2 | Reviewer 去重 | scripts/task_manager.py | N/A（调度） | 集成测试 | — |

---

## 7. 实施计划（Sprint 排期）

### Sprint 1（当前 Sprint，止血方案）

**目标**：消除 4 个 P0 遗留项 + 完成 P1 项可快速完成部分
**周期**：5 个工作日
**总工时**：7h

| Day | 任务 | 负责人 | 工时 | 产出 |
|-----|------|--------|------|------|
| Day 1 | S1.1 Slack Token 迁移 | dev | 0.5h | task_manager.py 无硬编码 token |
| Day 1 | S1.2 ESLint any 清理 | dev | 1h | 9 文件 any 清理完成 |
| Day 2 | S1.3 PrismaClient Workers 守卫 | dev | 1h | wrangler deploy 成功 |
| Day 2 | S1.4 @ci-blocking 移除 + 测试修复 | tester | 1h | CI 100% 通过 |
| Day 3 | S2.1 Tree Toolbar 样式归一 | dev | 0.5h | 按钮样式 ≤ 2 种 |
| Day 3 | S2.5 generate-components E2E | tester | 1h | E2E 测试通过 |
| Day 4 | S2.4 提案追踪 CLI CI 集成 | analyst | 2h | CLI 集成 CI pipeline |

**Buffer**: 0.5h（机动）

### Sprint 2（系统性提升）

**目标**：全面清理 Tech Debt，建立工程基础设施标准
**周期**：2 周
**总工时**：19.5h

| Phase | 任务 | 工时 | 说明 |
|-------|------|------|------|
| Phase 1 | S2.2 selectedNodeIds 状态统一 | 3h | Option B 新增 |
| Phase 1 | S2.3 componentStore 批量方法 | 3h | Option B 新增 |
| Phase 2 | S3.1 ComponentRegistry 版本化 | 3h | 热更新支持 |
| Phase 2 | S3.2 Reviewer 任务去重 | 2h | CI 调度优化 |
| Buffer | 回归测试 + code review | 8.5h | 安全边际 |

---

## 8. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| P0 再次遗留 | 高 | 高 | **本 Sprint 强制执行**，analyst 每日追踪，Day 5 前全部清零 |
| ESLint 清理破坏现有功能 | 中 | 高 | 全部通过 `tsc --noEmit` + CI 测试 后才合并 |
| Workers 守卫引入回归 | 中 | 高 | 部署前本地 CF Workers 模拟器验证 |
| @ci-blocking 移除暴露大量失败 | 高 | 中 | **分批移除**：每批 10 个，修复后才移下一批 |
| 提案追踪 CLI 仍无人用 | 中 | 低 | **CI 强制集成**：PR 合并前必须通过 CLI 更新状态，否则 CI 失败 |

---

## 9. 依赖关系

| 依赖 | 来源 | 备注 |
|------|------|------|
| Cloudflare Workers 环境 | DevOps | wrangler CLI 可用 |
| Playwright | tester | E2E 测试基础设施 |
| proposal_tracker.py | analyst | 已有 CLI 实现 |
| .env.example | dev | 需要团队确认 token 管理方案 |
