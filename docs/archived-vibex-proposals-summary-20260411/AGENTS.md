# AGENTS.md: VibeX 提案汇总执行约束

**项目**: vibex-proposals-summary-20260411
**日期**: 2026-04-07

---

## 开发约束

### 约束 1: Sprint 0 不得延期
- Sprint 0 的 4 个 P0（Slack token / ESLint any / @ci-blocking / Playwright timeout）必须在 Sprint 0 内完成
- coord 每日追踪 Sprint 0 进度

### 约束 2: 共享模块先行
- packages/types 和 logger 必须在 Sprint 2 优先完成
- 其他 Epic 不得阻塞共享模块的开发

### 约束 3: 分批清理规则
- waitForTimeout 清理每批 ≤ 10 处
- 每批清理后必须运行 E2E 测试验证
- 验证通过后才继续下一批

### 约束 4: CLI 状态更新
- 每个 Epic/Story 完成必须通过 CLI 更新状态
- PR 合并前必须通过 `task update` 更新状态
- 否则 CI lint job 阻断 merge

### 约束 5: API v0 渐进废弃
- v0 路由不立即删除，先加 Deprecation header
- 30 天内监控 v0 使用率
- v0 使用率 < 5% 后再执行删除

---

## Dev 实施指南

### 每次 PR 必须满足
```bash
# 1. TypeScript 检查
npx tsc --noEmit

# 2. ESLint 检查
npm run lint

# 3. 单元测试
npm run test

# 4. E2E 测试（相关功能）
npm run test:e2e

# 5. 状态更新
task update <project> <stage> done
```

### 禁止事项
- [ ] 禁止在 PR 中同时修改 > 3 个 Epic 的内容（合并成本高）
- [ ] 禁止引入新的 `as any`
- [ ] 禁止引入新的 waitForTimeout
- [ ] 禁止在 v0 路由中新增业务逻辑

---

## Coord 追踪规范

### 每日检查清单
- [ ] Sprint 0 进度（必须是 Day 1 优先）
- [ ] Epic 依赖关系是否被阻塞
- [ ] CLI 状态更新是否及时
- [ ] E2E 测试通过率

### 预警阈值
- Sprint 0 Day 2 仍未开始 → 立即报警
- 任意 Epic 进度落后 > 1 天 → 协调资源
- E2E 通过率 < 95% → 暂停新功能开发

---

## 验收检查清单

- [ ] Sprint 0 全部 4 个 P0 完成
- [ ] 18 条 P0 在 Sprint 1 全部完成
- [ ] 所有 19 个 Epic DoD checklist 完成
- [ ] CLI 使用率 ≥ 80%
- [ ] E2E 测试通过率 100%
