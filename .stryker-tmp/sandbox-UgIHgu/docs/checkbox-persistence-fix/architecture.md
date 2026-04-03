# Architecture: Checkbox Persistence Fix

**项目**: checkbox-persistence-fix
**版本**: v1.0
**日期**: 2026-04-02
**架构师**: architect
**状态**: ✅ 设计完成

---

## 执行摘要

修复 Migration 2→3：`confirmed` 应同时映射到 `isActive` 和 `status: 'confirmed'`。

**总工时**: 0.75h

---

## 1. 问题

```typescript
// Before: Migration 2→3
if (node.confirmed) {
  node.isActive = true;
  // ❌ status 未设置，默认为 'pending'
}

// After: Migration 2→3
if (node.confirmed) {
  node.isActive = true;
  node.status = 'confirmed';  // ✅ 同步设置
}
```

---

## 2. 性能影响

无风险。

---

## ADR-001: Migration 完整映射

**状态**: Accepted

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: checkbox-persistence-fix
- **执行日期**: 2026-04-02
