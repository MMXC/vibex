# PRD: Checkbox Persistence Fix

**项目**: checkbox-persistence-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
Migration 2→3 将 `confirmed` 映射为 `isActive`，但 `status` 未设置，默认为 `'pending'`，导致刷新后确认状态丢失。

### 根因
Migration 2→3 只映射 `confirmed → isActive`，未映射 `confirmed → status`。

### 目标
Migration 修复后，刷新页面 checkbox 视觉状态与刷新前一致。

---

## Epic 拆分

### Epic 1: Migration 2→3 修复
**工时**: 0.75h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 修复 Migration status 映射 | 0.25h | expect(migratedStatus).toBe('confirmed') |
| E1-S2 | Migration 验收测试 | 0.5h | expect(persistAfterRefresh).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Migration status 映射 | confirmed → status: 'confirmed' | expect(migratedStatus).toBe('confirmed') | ❌ |
| F1.2 | 刷新状态保留 | 刷新后 checkbox 状态一致 | expect(persistAfterRefresh).toBe(true) | ✅ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|--------|--------|
| E1 | Migration 2→3 修复 | 0.75h | P0 |
| **总计** | | **0.75h** | |

---

## 修改位置

`canvasStore.ts` runMigrations — Migration 2→3 逻辑

```ts
// 修复前
return {
  ...rest,
  isActive: confirmed ?? true,
  // status 未设置
};

// 修复后
return {
  ...rest,
  isActive: confirmed ?? true,
  status: confirmed ? 'confirmed' : (rest.status ?? 'pending'),
};
```

---

## DoD

- [ ] Migration 后 `confirmed: true` → `status: 'confirmed'`
- [ ] 刷新后 checkbox 状态一致
- [ ] `generateComponentFromFlow` 只发送 `status === 'confirmed'` 节点

---

## 验收标准（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | Migration 2→3 | 旧数据 `confirmed: true` | `status === 'confirmed'` |
| AC2 | 刷新页面 | 确认后刷新 | checkbox 视觉一致 |
| AC3 | API 请求 | generateComponentFromFlow | 只含 `status === 'confirmed'` |
