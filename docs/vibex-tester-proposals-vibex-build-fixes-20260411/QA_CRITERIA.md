# VibeX QA 验证体系

**版本**: v1.0
**日期**: 2026-04-11
**维护者**: tester

---

## 1. 前端测试分层

| 层级 | 工具 | 覆盖率目标 | 运行频率 |
|------|------|-----------|----------|
| 单元测试 | Vitest | ≥ 80%（核心模块）| CI every PR |
| 集成测试 | Vitest + MSW | ≥ 60% | CI every PR |
| E2E 测试 | Playwright | 关键路径全覆盖 | Nightly + Pre-release |

---

## 2. Canvas 模块测试清单

| 功能 | 状态 | 测试文件 |
|------|------|----------|
| confirmDialogStore | ✅ | ConfirmDialog.test.tsx |
| validateReturnTo | ✅ | validateReturnTo.test.ts (12 cases) |
| auth middleware | ✅ | middleware.test.ts (22 cases) |
| TreeToolbar semantic | ✅ | manual verified |
| Flow undo (E1) | ✅ | flowStore tests |
| GenerationProgress | ✅ | GenerationProgress.test.tsx (9 tests) |

---

## 3. 验收标准

### P0（必须通过）
- [x] TypeScript 编译无错误
- [x] Vitest 测试 100% 通过
- [x] 无 `window.confirm` 遗留（canvas 组件）

### P1（高优先级）
- [x] confirmDialog overlay click test
- [x] validateReturnTo security (open redirect)
- [x] auth:401 redirect flow
- [x] middleware protection

### P2（回归保证）
- [ ] Playwright E2E — Canvas 三树 CRUD
- [ ] Playwright E2E — 登录/登出 redirect

---

*最后更新: 2026-04-11 | v1.0*
