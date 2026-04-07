# IMPLEMENTATION_PLAN: E1+E2 P0 Fixes (2026-04-09)

> **项目**: vibex-p0-fixes-20260409
> **状态**: E1 ✅ DONE, E2 🔄 IN PROGRESS

## 状态总览

| Epic | 状态 | 备注 |
|------|------|------|
| E1-Backend数据完整性 | ✅ DONE (41fc72be) | snapshot + errorHandler + acquireLock |
| E2-测试基础设施恢复 | 🔄 IN PROGRESS | 子代理运行中 |
| E3-流程治理 | ⬜ TODO | |
| E4-性能索引优化 | ⬜ TODO | |
| E5-架构治理 | ⬜ TODO | |
| E6-提案追踪 | ⬜ TODO | |

---

## E1-Backend数据完整性 ✅

### S1.1: snapshot 字段实现补全
- [x] 重写 `project-snapshot.ts`: 替换 5 个 TODO stub 为实际 SQL 查询
- [x] D1 migration `005_snapshot_tables.sql`: FlowData, BusinessDomain, UINode, ChangeLog
- [x] Commit: `41fc72be`

### S1.2: errorHandler c.json() 修复
- [x] `errorHandler.ts`: `c.text(JSON.stringify())` → `c.json()`
- [x] `notFoundHandler.ts`: `c.text(JSON.stringify())` → `c.json()`
- [x] Commit: `41fc72be`

### S1.3: acquireLock TOCTOU 修复
- [x] `CollaborationService.ts`: 添加 `LockHeldError` class
- [x] `acquireLock()`: 添加 `hasLock()` 检查，存在有效 lock 时抛出 `LockHeldError`
- [x] Commit: `41fc72be`

---

## E2-测试基础设施恢复 🔄

### S2.1: vitest.config.ts 重建
- [ ] 创建 `vibex-fronted/vitest.config.ts`
- [ ] jsdom 环境配置
- [ ] TypeScript + React 18 支持
- [ ] 验证: `npx vitest run` 正常执行

### S2.2: @ci-blocking 测试修复
- [ ] 扫描: `grep -rn "@ci-blocking\|test\.skip" tests/`
- [ ] 修复稳定性问题: `waitForTimeout` → `waitForSelector`
- [ ] 目标: E2E 通过数 ≥ 30

### S2.3: Canvas Hook 测试补充
- [ ] 检查零覆盖的 hook
- [ ] 创建 hook 测试文件
- [ ] 目标: Hook 覆盖率 ≥ 80%

### S2.4: WebSocket JSON fault tolerance
- [ ] `messageRouter.ts`: try-catch JSON.parse
- [ ] 测试: 畸形消息返回 error 类型
- [ ] Commit: 待定

### S2.5: JSON.parse 容错 (canvas/generate + plan/analyze)
- [ ] canvas generate: try-catch → 400 错误
- [ ] plan/analyze: try-catch → plain-text fallback

### S2.6: safeParseJSON 工具
- [ ] 创建 `vibex-backend/src/utils/json.ts`
- [ ] 实现 `safeParseJSON<T>()` + `parseJSON<T>()`
- [ ] 重构 ai-service.ts, llm.ts, llm-provider.ts

### S2.7: ConnectionPool 按需清理 ✅
- [x] `updateHeartbeat()` 无 `pruneStaleConnections()` 调用
- [x] `add()` 满时调用一次 `pruneStaleConnections()`
- [x] 已有测试文件

### S2.8: CHANGELOG 补录 + pre-commit hook ✅
- [x] CHANGELOG.md 已补录 2026-04-09 entries
- [x] `.git/hooks/pre-commit` 钩子存在

### S2.9: 临时文件清理 ✅
- [x] 无临时文件 (e1*, test-temp*, README-test.md)

---

## 提交记录

| Commit | 内容 |
|--------|------|
| `41fc72be` | fix(backend): E1 S1.1-S1.3 完整修复 |
| `pending` | E2 子代理完成后的 commits |
