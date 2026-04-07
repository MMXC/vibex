# PRD: canvas-bc-checkbox-fix — confirmContextNode 类型错误修复

**Agent**: PM
**日期**: 2026-04-02
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

`BoundedContextTree.tsx:435` 的 `handleGenerate` 函数创建新节点时使用了不存在的 `confirmed` 字段，导致 TypeScript 类型错误。`confirmed` 已在 Migration 2→3 中迁移为 `isActive`。

### 目标

删除 `confirmed: false` 赋值，确保 TypeScript 编译通过。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| TypeScript 错误 | 0 | `npx tsc --noEmit` |

---

## 2. Epic 拆分

### Epic 1: 删除 confirmed 字段

**工时**: < 0.5h | **优先级**: P0

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 删除 confirmed: false | handleGenerate 中删除 `confirmed: false` | `expect(tsErrors).toBe(0)` | ❌ |
| F1.2 | TypeScript 验证 | `npx tsc --noEmit` 无错误 | `expect(tsErrors).toBe(0)` | ❌ |
| F1.3 | 回归验证 | 生成卡片后 checkbox 状态正确 | `expect(checkboxWorks).toBe(true)` | 【需页面集成】 |

#### DoD

- [ ] TypeScript 编译无错误
- [ ] E2E 测试通过

---

## 3. 验收标准（汇总）

| expect() 断言 | 说明 |
|--------------|------|
| `expect(tsErrors).toBe(0)` | TypeScript 0 error |
| `expect(grepConfirmed).toBe(0)` | confirmed 字段已删除 |

---

## 4. DoD

1. `npx tsc --noEmit` 返回 0 error
2. `grep "confirmed:" BoundedContextTree.tsx` 仅匹配 migration 代码

---

*PRD 版本: v1.0 | 生成时间: 2026-04-02 03:30 GMT+8*
