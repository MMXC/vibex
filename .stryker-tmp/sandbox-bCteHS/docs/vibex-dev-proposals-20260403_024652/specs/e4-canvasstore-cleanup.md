# Epic E4 Spec: canvasStore 退役清理

## 基本信息

| 字段 | 内容 |
|------|------|
| Epic ID | E4 |
| 名称 | canvasStore 退役清理 |
| 优先级 | P2 |
| 状态 | 待开发 |
| 工时 | 8h |
| 对应提案 | D-NEW（Option A 渐进式替换） |

## 背景

canvasStore.ts 当前 1513 行，split stores 合计 735 行，两个数据源并存导致双重维护负担和潜在不一致风险。需将 canvasStore 降级为纯兼容层（re-export），消除双重数据源。

## Story 列表

| 功能 ID | Story | 功能点 | 验收标准 | 页面集成 | 工时 | 依赖 |
|---------|-------|--------|----------|----------|------|------|
| E4-S1 | 审查 canvasStore 未迁移逻辑 | 审查 canvasStore.ts 中剩余未迁移逻辑，确定迁移计划 | `expect(unmigratedLogicCount).toBe(0)` | 无 | 2h | 无 |
| E4-S2 | 迁移剩余逻辑至 split stores | 将 canvasStore 中剩余业务逻辑迁移至对应 split stores | `expect(allLogicInSplitStores).toBe(true)` | 无 | 3h | E4-S1 |
| E4-S3 | canvasStore 降级为兼容层 | canvasStore.ts 仅保留 re-export 语句，行数 < 50 | `expect(canvasStoreLineCount).toBeLessThan(50)` | 无 | 2h | E4-S2 |
| E4-S4 | 更新所有组件 import path | 将 14 个组件的 import 从 canvasStore 切换至 split stores | `expect(canvasStoreImportCount).toBe(0)` | 【需页面集成】 | 1h | E4-S3 |

## 验收标准（完整 expect 断言）

### E4-S1

```typescript
// 审查 canvasStore 中的业务逻辑模式
const canvasStoreContent = readFile('src/stores/canvasStore.ts');

// 业务逻辑模式不应存在
const businessLogicPatterns = [
  /setState\s*\(/,
  /dispatch\s*\(/,
  /useReducer/,
  /createSlice/,
  /immer\(/,
];

businessLogicPatterns.forEach(pattern => {
  const matches = canvasStoreContent.match(pattern);
  if (matches) {
    console.log(`Found business logic pattern: ${pattern} at ${matches.index}`);
  }
  expect(matches).toBeNull();
});

// 仅允许 re-export、type、interface、注释
const allowedPatterns = [
  /export\s+\{/,
  /export\s+type/,
  /export\s+interface/,
  /^import\s+/m,
  /^\/\//m,
  /^\/\*\*/m,
];
allowedPatterns.forEach(pattern => {
  expect(canvasStoreContent).toMatch(pattern);
});
```

### E4-S2

```typescript
// 验证所有 split stores 职责清晰
const splitStores = ['componentStore', 'sessionStore', 'elementStore', 'selectionStore', 'historyStore'];

splitStores.forEach(storeName => {
  const storeFile = readFile(`src/stores/${storeName}.ts`);
  expect(storeFile).toBeDefined();

  // 每个 store 有明确的导出
  const exports = storeFile.match(/export\s+(const|function|type|interface)\s+(\w+)/g);
  expect(exports).not.toBeNull();
  expect(exports!.length).toBeGreaterThan(0);

  console.log(`${storeName} exports:`, exports);
});

// 验证 split stores 之间无循环依赖
const circularDeps = execSync('npx madge --circular src/stores/*.ts', { encoding: 'utf-8' });
expect(circularDeps).not.toContain('Circular dependencies found');
expect(circularDeps).toContain('No circular dependencies found');
```

### E4-S3

```typescript
// canvasStore.ts 行数 < 50
const canvasStoreLines = readFile('src/stores/canvasStore.ts').split('\n');
expect(canvasStoreLines.length).toBeLessThan(50);

// 仅包含 re-export 语句
const canvasStoreContent = readFile('src/stores/canvasStore.ts');

// 不得包含任何业务逻辑
expect(canvasStoreContent).not.toMatch(/setState\s*\(/);
expect(canvasStoreContent).not.toMatch(/useReducer/);
expect(canvasStoreContent).not.toMatch(/createSlice/);
expect(canvasStoreContent).not.toMatch(/\.actions\./);
expect(canvasStoreContent).not.toMatch(/dispatch\s*\(/);

// 应包含 re-export
expect(canvasStoreContent).toMatch(/export.*from/);

// 导出内容与 split stores 一致
const exports = canvasStoreContent.match(/export\s+\{([^}]+)\}\s+from\s+'([^']+)'/g);
expect(exports).not.toBeNull();
expect(exports!.length).toBeGreaterThan(0);
```

### E4-S4

```typescript
// 检查所有 .tsx 和 .ts 文件
const allFiles = execSync("find src -name '*.tsx' -o -name '*.ts' | grep -v node_modules | grep -v '.spec.ts' | grep -v '.test.ts'", { encoding: 'utf-8' })
  .split('\n')
  .filter(Boolean);

let canvasStoreImportCount = 0;
const affectedFiles: string[] = [];

allFiles.forEach(file => {
  const content = readFile(file);
  const canvasStoreImport = content.match(/from\s+['"].*canvasStore['"]/);
  if (canvasStoreImport) {
    canvasStoreImportCount++;
    affectedFiles.push(file);
    console.log(`File still importing canvasStore: ${file}`);
  }
});

expect(canvasStoreImportCount).toBe(0);
console.log(`Updated ${affectedFiles.length} files to use split stores`);

// 验证新 import 指向 split stores
affectedFiles.forEach(file => {
  const content = readFile(file);
  const splitStoreImports = content.match(/from\s+['"].*\/stores\/(componentStore|sessionStore|elementStore|selectionStore|historyStore)['"]/g);
  expect(splitStoreImports).not.toBeNull();
  expect(splitStoreImports!.length).toBeGreaterThan(0);
});

// npm test 通过率 > 95%
const testOutput = execSync('npm test -- --coverage', { encoding: 'utf-8' });
const coverageMatch = testOutput.match(/All files[^}]+\d+.\d+ %/);
expect(coverageMatch).toBeTruthy();
```

## 技术规格

### 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/stores/canvasStore.ts` | 重写 | 仅保留 re-export（兼容层），行数 < 50 |
| `src/stores/componentStore.ts` | 修改 | 接收从 canvasStore 迁移的组件状态逻辑 |
| `src/stores/sessionStore.ts` | 修改 | 接收从 canvasStore 迁移的会话状态逻辑 |
| `src/stores/elementStore.ts` | 修改 | 接收从 canvasStore 迁移的元素状态逻辑 |
| `src/stores/selectionStore.ts` | 修改 | 接收从 canvasStore 迁移的选择状态逻辑 |
| `src/stores/historyStore.ts` | 修改 | 接收从 canvasStore 迁移的历史记录逻辑 |
| `src/**/*.{tsx,ts}` | 修改 | 更新 import path（14 个文件） |

### 职责分配

| Store | 职责 |
|-------|------|
| componentStore | 组件树、组件属性、组件层级 |
| sessionStore | 会话元信息、用户偏好设置 |
| elementStore | 元素实例、元素属性 |
| selectionStore | 当前选中元素、多选状态 |
| historyStore | 撤销/重做栈、快照历史 |

### 约束

- **向后兼容**: canvasStore 作为兼容层保留，不得破坏现有功能
- **增量迁移**: 每个 Story 可独立部署验证
- **无循环依赖**: 通过 `madge --circular` 验证
- **回归保护**: E4 修改后必须运行完整测试套件

## DoD

- [ ] `canvasStore.ts` 仅保留 re-export 语句（< 50 行）
- [ ] 所有组件从 split stores 导入（无 canvasStore 直接引用）
- [ ] `npm test` 所有组件相关测试通过
- [ ] `madge --circular` 无循环依赖
- [ ] E2E 测试验证页面功能正常
