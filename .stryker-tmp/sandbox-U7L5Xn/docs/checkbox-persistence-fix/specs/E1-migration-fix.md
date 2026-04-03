# Spec: E1 - Migration 2→3 修复

## 1. 概述

**工时**: 0.75h | **优先级**: P0
**依赖**: 无

## 2. 修改文件

`canvasStore.ts` — `runMigrations` 中 Migration 2→3 逻辑

## 3. 当前代码

```ts
if (version < 3) {
  const migrateNodes = (nodes: any[]): any[] =>
    nodes.map((n: any) => {
      const confirmed = n.confirmed;
      const { confirmed: _confirmed, ...rest } = n;
      return {
        ...rest,
        isActive: confirmed ?? true,
        // ❌ status 未设置
      };
    });
  // ...
}
```

## 4. 修复代码

```ts
if (version < 3) {
  const migrateNodes = (nodes: any[]): any[] =>
    nodes.map((n: any) => {
      const confirmed = n.confirmed;
      const { confirmed: _confirmed, ...rest } = n;
      return {
        ...rest,
        isActive: confirmed ?? true,
        // ✅ 修复：confirmed → status
        status: confirmed ? 'confirmed' : (rest.status ?? 'pending'),
      };
    });
  // ...
}
```

## 5. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | Migration 执行 | 旧数据 `confirmed: true` | `status === 'confirmed'` |
| E1-AC2 | Migration 执行 | 旧数据无 confirmed | `status === 'pending'` |
| E1-AC3 | 刷新页面 | 确认后刷新 | checkbox 视觉一致 |

## 6. DoD

- [ ] `confirmed: true` → `status: 'confirmed'`
- [ ] `confirmed: false/undefined` → `status: 'pending'`
- [ ] 刷新后状态保留
