# 开发约束: homepage-redesign-sprint1-reviewer-fix

> **项目**: homepage-redesign-sprint1-reviewer-fix  
> **版本**: v1.0  
> **日期**: 2026-03-21

---

## 1. 驳回红线

| 规则 | 原因 |
|------|------|
| ❌ `GridContainer/index.tsx` 不存在 | P0 CRITICAL |
| ❌ `homePageStore.ts` 不存在 | P0 CRITICAL |
| ❌ 步骤数 ≠ 4 | P1 MAJOR |
| ❌ 快照超过 5 个 | DoD |
| ❌ TypeScript 错误 | 影响编译 |
| ❌ 测试失败 | 影响质量 |
| ❌ 新增 `any` 类型 | 类型安全 |

---

## 2. PR 审查清单

- [ ] `GridContainer/index.tsx` 存在且可渲染
- [ ] `GridContainer.module.css` 包含 3×3 Grid + 1400px 居中
- [ ] 响应式断点 1200px / 900px
- [ ] `useHomePageStore` 导出且可用
- [ ] `partialize` 仅持久化布局字段
- [ ] 快照限制 `.slice(-5)`
- [ ] `STEP_DEFINITIONS.length === 4`
- [ ] 步骤标签: 需求录入 / 需求澄清 / 业务流程 / 组件图
- [ ] `pnpm type-check` 通过
- [ ] `pnpm test homePageStore` 全部通过

## 3. 验收映射

| Story | 验收标准 |
|-------|----------|
| ST-9.1 | `expect(useHomePageStore).toBeDefined()` |
| ST-9.2 | 刷新后 `currentStep` 保持 |
| ST-9.3 | `saveSnapshot` / `restoreSnapshot` 可调用 |
| ST-1.1 | `test -f GridContainer/index.tsx` |
| ST-3.1 | `expect(steps.length).toBe(4)` |
| ST-4.1 | `expect(store.getState().saveSnapshot).toBeDefined()` |
| ST-4.2 | `expect(store.getState().restoreSnapshot).toBeDefined()` |
