# SPEC-002: canvasStore Migration Bug 修复

**文件名**: `canvasStore.ts` `runMigrations` 函数
**Epic**: Epic-1 / Feature-1.2 / Story-1.2.2
**优先级**: P0
**状态**: Draft

---

## 1. 问题描述

Migration 2→3 中，`confirmed → isActive` 映射**未设置 `status` 字段**，导致刷新页面后 confirmed 状态丢失。

### 根因代码

```ts
// 现有代码 (canvasStore.ts runMigrations)
const migrateNodes = (nodes: any[]) =>
  nodes.map((n: any) => {
    const confirmed = n.confirmed;
    const { confirmed: _confirmed, ...rest } = n;
    return { ...rest, isActive: confirmed ?? true };
    // ← status 未设置！
  });
```

---

## 2. 修复方案

```ts
const migrateNodes = (nodes: any[]) =>
  nodes.map((n: any) => {
    const confirmed = n.confirmed;
    const { confirmed: _confirmed, status: _oldStatus, ...rest } = n;
    return {
      ...rest,
      isActive: confirmed ?? true,
      status: confirmed ? 'confirmed' : (rest.status ?? 'pending'),
    };
  });
```

---

## 3. 行为矩阵

| 输入 confirmed | 原 status | 输出 isActive | 输出 status |
|----------------|-----------|---------------|-------------|
| `true` | 任意 | `true` | `'confirmed'` |
| `false` | 任意 | `false` | `原status` 或 `'pending'` |
| `null/undefined` | 任意 | `true` | `'pending'` |

---

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 历史数据 confirmed=true | 执行 Migration 2→3 | isActive=true, status='confirmed' |
| AC2 | 历史数据 confirmed=false | 执行 Migration | isActive=false, status 保留原值 |
| AC3 | 新建节点 | 用户操作 | status 默认 'pending'，不触发 migration |

---

## 5. 回归测试

```ts
describe('Migration 2→3', () => {
  it('preserves confirmed state after refresh', async () => {
    const json = {
      nodes: [{ id: '1', confirmed: true, title: 'BC1' }],
      version: 2,
    };
    const migrated = runMigrations(json);
    const node = migrated.nodes[0];
    expect(node.isActive).toBe(true);
    expect(node.status).toBe('confirmed');
  });

  it('does not affect new nodes (no migration triggered)', () => {
    const json = { nodes: [{ id: '2', title: 'BC2' }], version: 3 };
    const migrated = runMigrations(json);
    expect(migrated.nodes[0].status).toBeUndefined(); // 新节点不触发
  });
});
```

---

## 6. 回滚计划

如发现问题，立即回滚 `canvasStore.ts`：
```bash
git checkout HEAD~1 -- canvasStore.ts
```
