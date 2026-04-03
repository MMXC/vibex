# Spec: E3 - Zustand Migration 库

## 概述
将 Sprint 1 中 Epic6/7 发现的 Zustand persistence 迁移模式封装为可复用库。

## F3.1: 版本化 Storage 封装

### 规格
- 文件: `libs/canvas-store-migration/index.ts`
- API: `createVersionedStorage(options)` → `{ getItem, setItem, removeItem }`
- 选项: `version: number`, `migrations: Record<number, (old: any) => any>`
- 自动: 版本检测 + 自动运行 migration

### 验收
```typescript
test('createVersionedStorage exports a function', () => {
  const lib = require('libs/canvas-store-migration');
  expect(typeof lib.createVersionedStorage).toBe('function');
});

test('migration v1→v2 runs automatically', () => {
  const oldState = { count: 0, _version: 1 };
  const storage = createVersionedStorage({
    version: 2,
    migrations: {
      2: (s) => ({ ...s, count: s.count * 10, _version: 2 })
    }
  });
  const newState = storage.migrate(oldState, 1);
  expect(newState.count).toBe(0); // 0 * 10 = 0
  expect(newState._version).toBe(2);
});

test('unknown version throws error', () => {
  const storage = createVersionedStorage({ version: 3, migrations: {} });
  expect(() => storage.migrate({}, 99)).toThrow('Unknown migration path');
});
```

---

## F3.2: Epic6/7 Migration 迁移

### 规格
- 目标: Epic6（`CURRENT_STORAGE_VERSION: 2→3`）和 Epic7 的 migration 全部迁移到库
- 约束: `libs/canvas-store-migration/` 外部不得有 inline migration 代码
- 验证: `grep -r "CURRENT_STORAGE_VERSION" --include="*.ts"` 仅出现在库文件中

### 验收
```typescript
test('Epic6 migration uses shared library', () => {
  const epic6File = 'stores/epic6-canvas.ts';
  const content = readFileSync(epic6File, 'utf-8');
  // Epic6 使用库，不自己定义 CURRENT_STORAGE_VERSION
  expect(content).not.toMatch(/CURRENT_STORAGE_VERSION\s*=\s*[0-9]+/);
  expect(content).toMatch(/from.*canvas-store-migration/);
});

test('Epic7 migration uses shared library', () => {
  const epic7File = 'stores/epic7-flow.ts';
  const content = readFileSync(epic7File, 'utf-8');
  expect(content).not.toMatch(/CURRENT_STORAGE_VERSION\s*=\s*[0-9]+/);
  expect(content).toMatch(/from.*canvas-store-migration/);
});

test('no inline migration outside library', () => {
  const results = execSync(
    'grep -r "CURRENT_STORAGE_VERSION" --include="*.ts" stores/ libs/',
    { encoding: 'utf-8' }
  );
  // 仅在 libs/ 中出现，不在其他 stores/ 中
  const lines = results.trim().split('\n').filter(l => !l.startsWith('libs/'));
  expect(lines.length).toBe(0);
});
```

---

## F3.3: Jest 测试覆盖

### 规格
- 文件: `libs/canvas-store-migration/__tests__/`
- 覆盖目标: ≥ 80%
- 测试类型: 单元测试（migration 函数）+ 集成测试（store 完整流程）

### 验收
```bash
cd libs/canvas-store-migration
npx jest --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'
# 必须全绿
```
