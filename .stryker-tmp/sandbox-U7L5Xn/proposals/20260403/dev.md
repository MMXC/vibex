# Dev 提案 — 2026-04-03

**Agent**: dev
**日期**: 2026-04-03
**项目**: vibex-dev-proposals-20260403_024652
**仓库**: /root/.openclaw/vibex
**分析视角**: 从开发者视角分析近期 canvas-json-persistence 项目中的技术债和可改进点

---

## 一、近期开发总结

### canvas-json-persistence Epic1-3 实现情况

| Epic | 状态 | Commit | 说明 |
|------|------|--------|------|
| E1 数据结构统一 | ✅ Done | 512f3fce, a939bb0a | 三树节点数据结构统一，Migration 3→4 |
| E2 后端版本化存储 | ✅ Done | 9b083f22 | CanvasSnapshot 表 + REST API |
| E3 自动保存 | ✅ Done | af995f0b | Debounce 2s + Beacon + SaveIndicator |

### 遗留问题

1. **E4 Sync Protocol 未完成**: IMPLEMENTATION_PLAN.md 中 E4 (冲突检测 + UI) 尚未实现
2. **测试环境不一致**: 前端使用 Jest，测试文件偶发环境兼容问题
3. **API 格式对齐**: 后端路由使用 `/v1/canvas/snapshots` (复数)，需确保前后端完全对齐

---

## 二、提案列表

### 提案 D-001: 完成 E4 Sync Protocol

**问题**: IMPLEMENTATION_PLAN.md 中 E4 (冲突检测 + 冲突解决 UI) 尚未实现，多用户并发编辑场景无保护。

**根因**: Epic1-3 优先级更高，E4 被推迟。

**影响范围**:
- `vibex-fronted/src/hooks/canvas/useAutoSave.ts`
- `vibex-fronted/src/components/canvas/features/VersionHistoryPanel.tsx`
- `vibex-backend/src/routes/v1/canvas/snapshots.ts`

**建议方案**:
1. 在 `useAutoSave` 中添加 `version` 字段到 snapshot 请求
2. 后端 `snapshots.ts` 增加 version 乐观锁检查
3. 前端添加冲突对话框 (ConflictDialog)

**验收标准**:
- [ ] `useAutoSave` 发送 version 到后端
- [ ] 后端检测 localVersion < serverVersion 时返回 409 Conflict
- [ ] 前端显示冲突解决对话框

**工时估算**: 4-6h
**优先级**: P1

---

### 提案 D-002: 前端测试覆盖率提升

**问题**: `useAutoSave.test.ts` 和 `SaveIndicator.test.tsx` 测试覆盖了基础行为，但更复杂的交互 (debounce 计时、beforeunload beacon) 无法在 Jest 中测试。

**根因**: Jest 环境不支持 `navigator.sendBeacon` 和精确计时模拟。

**影响范围**:
- `vibex-fronted/src/hooks/canvas/`
- `vibex-fronted/src/components/canvas/features/`

**建议方案**:
1. 为复杂 Hook 添加 Playwright e2e 测试
2. 添加 `useAutoSave` 的 integration test (使用 mock server)
3. 增加 `VersionHistoryPanel` 的交互测试

**验收标准**:
- [ ] Playwright 测试覆盖 auto-save 流程
- [ ] beacon 触发验证
- [ ] 冲突对话框交互测试

**工时估算**: 3-4h
**优先级**: P2

---

### 提案 D-003: 代码质量 - TypeScript strict 模式

**问题**: 当前代码库存在大量 `any` 类型和 `ts-ignore`，影响类型安全。

**根因**: 快速迭代阶段类型检查被关闭以加速开发。

**影响范围**:
- `vibex-fronted/src/` (全面检查)
- `vibex-backend/src/` (Hono 路由层)

**建议方案**:
1. 在 `tsconfig.json` 中逐步启用 `strict: true`
2. 修复前 20 个高频 `any` 类型
3. 建立 ESLint 规则防止新 `any` 引入

**验收标准**:
- [ ] `tsc --noEmit` 在 strict 模式下错误数 < 50
- [ ] 无新增 `@ts-ignore` (除非必要)
- [ ] CI 中增加 `tsc --strict` 检查

**工时估算**: 6-8h
**优先级**: P2

---

## 三、验收标准

- [ ] 提案写入 `proposals/20260403/dev.md`
- [ ] 包含至少 3 个可执行的提案
- [ ] 每个提案有根因分析和验收标准
- [ ] 提案通过 coord 评审

---

## 四、参考文档

- IMPLEMENTATION_PLAN.md: `/root/.openclaw/vibex/docs/canvas-json-persistence/IMPLEMENTATION_PLAN.md`
- E3 实现: `af995f0b` — feat(canvas-json-persistence): implement E3 auto-save
