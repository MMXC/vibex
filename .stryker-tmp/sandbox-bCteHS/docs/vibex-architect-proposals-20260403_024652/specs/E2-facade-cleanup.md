# Spec: E2 - canvasStore Facade 清理

**Epic ID**: E2  
**Epic 名称**: canvasStore Facade 清理  
**优先级**: P1  
**预估工时**: 7h（E2-S1: 2h + E2-S2: 2h + E2-S3: 3h）

---

## 1. Overview

将 `canvasStore.ts` 从 1513 行压缩至 < 300 行，消除单文件技术债务。

**现状**:
```
canvasStore.ts (1513 行)
├── 状态定义 (未迁移)
├── actions (未迁移)
├── reducers (未迁移)
├── CascadeUpdateManager (未迁移)
└── re-export (保留)
```

**目标**:
```
canvasStore.ts (< 300 行)
└── re-export + 全局初始化 (仅保留兼容层)

stores/
├── canvas/
├── nodes/
├── cascade-update/  ← 新增
└── ...
```

---

## 2. Story Specs

### E2-S1: canvasStore.ts 剩余逻辑分析

#### 功能点
逐行审查 1513 行 `canvasStore.ts`，识别未迁移逻辑，按 domain 分类。

#### 分析报告模板
```typescript
interface AnalysisReport {
  totalLines: number;
  domains: {
    name: string;
    lines: number;
    range: [number, number];
    type: 'state' | 'action' | 'reducer' | 'manager';
    targetModule: string;
  }[];
  migratedLines: number;
  unmigratedLines: number;
}
```

#### 预期分析结果

| Domain | 行数 | 目标模块 |
|--------|------|---------|
| CascadeUpdateManager | ~400 行 | `stores/cascade-update/` |
| 状态定义 (nodes/tree) | ~300 行 | `stores/nodes/` |
| 状态定义 (canvas/config) | ~200 行 | `stores/canvas/` |
| actions | ~400 行 | 按 domain 拆分 |
| reducers | ~100 行 | 按 domain 拆分 |
| 已迁移部分 | ~113 行 | - |
| **剩余合计** | ~1400 行 | |

#### 验收标准
```typescript
expect(analysisReport.totalLines).toBe(1513);
expect(analysisReport.domains.length).toBeGreaterThan(0);
expect(analysisReport.domains.find(d => d.name === 'CascadeUpdateManager')).toBeDefined();
expect(analysisReport.unmigratedLines).toBeGreaterThan(0);
```

---

### E2-S2: CascadeUpdateManager 迁移

#### 功能点
将 `CascadeUpdateManager` 从 `canvasStore.ts` 迁移到 `stores/cascade-update/` 模块。

#### 技术规格

**目录结构**:
```
stores/cascade-update/
├── CascadeUpdateManager.ts     # 核心类
├── index.ts                     # 导出
└── __tests__/
    └── CascadeUpdateManager.test.ts
```

**接口定义**:
```typescript
// stores/cascade-update/CascadeUpdateManager.ts
export class CascadeUpdateManager {
  constructor(private store: RootStore) {}
  
  // 级联更新逻辑
  cascadeUpdate(nodeId: string, changes: Partial<NodeState>): void;
  
  // 批量更新
  batchUpdate(updates: Update[]): void;
  
  // 依赖图构建
  buildDependencyGraph(): DependencyGraph;
}
```

**兼容性导出**（canvasStore.ts 保留）:
```typescript
// canvasStore.ts
export { CascadeUpdateManager } from './stores/cascade-update/';
```

#### 验收标准
```typescript
// 模块存在
expect(require('./stores/cascade-update')).toBeDefined();
expect(require('./stores/cascade-update/CascadeUpdateManager')).toBeDefined();

// 行数减少
expect(lineCount('canvasStore.ts')).toBeLessThanOrEqual(1300);

// 原有引用仍然有效
expect(canvasStore.CascadeUpdateManager).toBeDefined();
```

#### 文件变更
| 文件 | 操作 |
|------|------|
| `stores/cascade-update/CascadeUpdateManager.ts` | 新建 |
| `stores/cascade-update/index.ts` | 新建 |
| `stores/cascade-update/__tests__/CascadeUpdateManager.test.ts` | 新建 |
| `canvasStore.ts` | 修改（移除迁移代码）|

---

### E2-S3: 剩余逻辑分批迁移

#### 功能点
将剩余未迁移的状态定义、actions、reducers 逐批迁移到对应 stores/ 模块。每次迁移后运行 `npm test` 验证无 regression。

#### 迁移策略

**批次 1**: 状态定义（nodes/tree）→ `stores/nodes/`
**批次 2**: 状态定义（canvas/config）→ `stores/canvas/`
**批次 3**: actions → 按 domain 拆分到 `stores/*/actions.ts`
**批次 4**: reducers → 按 domain 拆分到 `stores/*/reducers.ts`
**批次 5**: 清理 re-export，更新组件引用

#### 组件引用更新清单

| 组件 | 当前引用 | 目标引用 |
|------|---------|---------|
| `CanvasEditor` | `canvasStore.nodes` | `useNodesStore()` |
| `PropertyPanel` | `canvasStore.actions` | `useCanvasActions()` |
| `ToolPalette` | `canvasStore.config` | `useCanvasConfig()` |
| `MiniMap` | `canvasStore.tree` | `useTreeStore()` |

#### 验收标准
```typescript
// 最终行数
expect(lineCount('canvasStore.ts')).toBeLessThanOrEqual(300);

// 所有 npm test 通过
expect(testResults.exitCode).toBe(0);

// 测试覆盖率
expect(testResults.coverage).toBeGreaterThanOrEqual(80);

// 组件引用已切换
expect(componentImports.canvasStore).toBeFalsy();
expect(componentImports.stores).toBeTruthy();
```

#### 文件变更
| 文件 | 操作 |
|------|------|
| `stores/nodes/` | 扩展 |
| `stores/canvas/` | 扩展 |
| `canvasStore.ts` | 修改（清理 + 保留兼容层）|
| 所有引用 canvasStore 的组件文件 | 修改（引用切换）|

---

## 3. 风险缓解

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| R4: Facade 清理工时超预期 | 🟡 中 | 先做增量分析（E2-S1），再执行；设置 3h 时间盒 |
| Regression 风险 | 🟡 中 | 每批次迁移后 `npm test`，覆盖率 > 80% 才合并 |
| 组件引用遗漏 | 🟢 低 | 使用 IDE "Find in Files" 全局搜索 `canvasStore.` |

---

*Spec 由 PM Agent 生成于 2026-04-03*
