# Implementation Plan: Checkbox Persistence Fix

**项目**: checkbox-persistence-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## E1: Migration 2→3 修复（0.75h）

### 步骤 1: 找到 Migration 2→3 代码

### 步骤 2: 修复映射

```typescript
if (node.confirmed) {
  node.isActive = true;
  node.status = 'confirmed';  // 添加这行
}
```

### 步骤 3: 验收测试

```typescript
it('should migrate confirmed to status confirmed', () => {
  const v2 = { confirmed: true };
  const migrated = migrateV2toV3(v2);
  expect(migrated.status).toBe('confirmed');
});
```

---

## 验收清单

- [ ] Migration 后 status = 'confirmed'
- [ ] 刷新后 checkbox 状态一致
- [ ] npm test 通过
