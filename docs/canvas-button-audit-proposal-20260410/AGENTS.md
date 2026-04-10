# Canvas 按钮审查与清理 — AGENTS.md

> **项目**: vibex-canvas-button-audit-proposal
> **角色**: Architect
> **日期**: 2026-04-10
> **版本**: v1.0

> **所有 Agent 在操作此项目前必须阅读本文档。**

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-canvas-button-audit-proposal
- **执行日期**: 2026-04-10

---

## 一、代码风格规范

### 1.1 TypeScript / React 规范

- **缩进**: 2 空格
- **引号**: 单引号 `'`，JSX attributes 用双引号
- **类型**: 显式类型声明，禁止 `any`（除非不可避免）
- **组件**: 函数组件，`'use client'` 声明
- **状态**: Zustand store，不滥用 `useState`

### 1.2 Store 边界规范

- **允许**: 从一个 store 引用另一个 store 的 getter（如 `useFlowStore.getState()`）
- **允许**: 在组件中同时订阅多个 store
- **禁止**: 在一个 store 中 `set` 另一个 store 的状态（状态应由单一 store 管理）

```typescript
// ✅ 正确：在 contextStore 中调用 flowStore 的方法
if (tree === 'flow') {
  useFlowStore.getState().deleteSelectedNodes(); // 只调用 action，不 set 自身状态
  set({ selectedNodeIds: { ...selectedNodeIds, flow: [] } });
}

// ❌ 错误：直接 set 另一个 store 的状态
set({ flowNodes: [] }); // flowStore 的状态不应在此修改
```

### 1.3 historySlice 集成规范

- **必须**: 所有节点增删改操作后调用 `getHistoryStore().recordSnapshot(tree, nodes)`
- **必须**: 批量操作前先 `recordSnapshot`（作为撤销起点）
- **禁止**: 在 `recordSnapshot` 内部再次调用会触发 `recordSnapshot` 的操作（循环触发）

```typescript
// ✅ 正确：批量删除前记录快照
deleteSelectedNodes: () => {
  const { selectedNodeIds, componentNodes } = get();
  if (selectedNodeIds.length === 0) return;
  // 先记录快照
  getHistoryStore().recordSnapshot('component', componentNodes);
  // 再执行删除
  const toDelete = new Set(selectedNodeIds);
  set({
    componentNodes: componentNodes.filter(n => !toDelete.has(n.nodeId)),
    selectedNodeIds: [],
  });
},

// ❌ 错误：在 recordSnapshot 回调中触发另一个 recordSnapshot
recordSnapshot: (tree, nodes) => {
  // 某些操作在 set() 回调中会触发另一个 recordSnapshot
  // 这会导致 isRecording guard 生效，第二次调用被忽略
}
```

### 1.4 测试规范

- **文件命名**: `*.test.ts` / `*.test.tsx`
- **描述**: 中文描述测试场景
- **覆盖率**: 核心 store > 80%
- **Mock**: 使用 `jest.mock()` / `jest.spyOn()`，不修改原始模块

```typescript
// ✅ 正确
describe('P0: Flow 树删除 undo', () => {
  it('deleteSelectedNodes 应记录 history 快照', () => {
    const store = createFlowStore();
    store.setFlowNodes([mockNode('a'), mockNode('b')]);
    store.selectAllNodes();
    store.deleteSelectedNodes();
    const past = getHistoryStore().getState().flowHistory.past;
    expect(past.length).toBeGreaterThan(0);
  });
});
```

---

## 二、禁止事项

### 🚫 全局禁止

- **禁止** 使用 `// @ts-ignore` 或 `// @ts-expect-error`（除非附上 TSDoc 说明）
- **禁止** 添加 `console.log` 调试语句（使用 `canvasLogger`）
- **禁止** 引入新的 npm 依赖（`pnpm add` 需先审批）
- **禁止** 硬编码凭证、API Key、Token
- **禁止** 在 `node_modules` 目录内进行任何修改
- **禁止** 提交包含 `TODO` / `FIXME` / `HACK` 的代码

### 🚫 P0 禁止

- **禁止** 修改 `historySlice.ts` 的 undo/redo 核心逻辑
- **禁止** 移除 `recordSnapshot` 调用
- **禁止** 修改 `MAX_HISTORY_LENGTH`（50 为固定值）

### 🚫 P2 禁止

- **禁止** 使用 `window.confirm()` 替代统一 confirmDialogStore
- **禁止** confirmDialogStore 的 destructive 模式不使用红色确认按钮
- **禁止** 在 destructive confirm 中省略"此操作不可撤销"提示

### 🚫 P5 禁止

- **禁止** 在 Figma 设计稿确认前实现 ProjectBar 按钮收拢的 UI
- **禁止** 在 ProjectBar 中硬编码按钮顺序

---

## 三、测试要求

### 3.1 覆盖率要求

| 文件 | 覆盖率要求 |
|------|-----------|
| `flowStore.ts` | > 85% |
| `componentStore.ts` | > 85% |
| `contextStore.ts` | > 85% |
| `historySlice.ts` | > 80% |
| `confirmDialogStore.ts`（新增） | > 90% |
| `TreeToolbar.tsx` | > 80% |

### 3.2 必需测试用例

#### P0: Flow 树 undo
```typescript
describe('P0: Flow 树删除 undo', () => {
  it('deleteSelectedNodes 记录 history 快照', () => { ... });
  it('deleteSelectedNodes 幂等（空集无操作）', () => { ... });
  it('contextStore.deleteSelectedNodes(flow) 调用 flowStore.deleteSelectedNodes', () => { ... });
  it('单节点删除后可 undo 恢复', () => { ... });
  it('批量删除后可 undo 恢复', () => { ... });
});
```

#### P1: 语义统一
```typescript
describe('P1: 语义统一', () => {
  it('Toolbar 文案: "✓ 全选" / "○ 取消选择" / "✕ 清空画布"', () => { ... });
  it('三树 Toolbar 文案一致', () => { ... });
});
```

#### P2: 统一确认弹窗
```typescript
describe('P2: 统一确认弹窗', () => {
  it('confirm 返回 Promise<boolean>', () => { ... });
  it('resolveAndClose(true) 使 confirm 返回 true', () => { ... });
  it('resolveAndClose(false) 使 confirm 返回 false', () => { ... });
  it('destructive=true 确认按钮为红色', () => { ... });
  it('空集调用 confirm 不报错', () => { ... });
});

describe('P2: 清空操作 confirm 集成', () => {
  it('clearComponentCanvas 弹出 confirm 对话框', () => { ... });
  it('用户取消后节点不删除', () => { ... });
  it('用户确认后节点删除', () => { ... });
  it('resetFlowCanvas 弹出 confirm 对话框', () => { ... });
});
```

#### P3: 重新生成文案
```typescript
describe('P3: 重新生成按钮 tooltip', () => {
  it('重新生成按钮有 tooltip 说明覆盖行为', () => { ... });
  it('tooltip 内容包含"清空后重建"', () => { ... });
});
```

### 3.3 测试运行命令

```bash
# 全量测试
pnpm test

# Store 单元测试
pnpm --filter vibex-fronted test --testPathPattern="flowStore|componentStore|contextStore|historySlice|confirmDialogStore"

# 组件测试
pnpm --filter vibex-fronted test --testPathPattern="TreeToolbar"

# 覆盖率
pnpm --filter vibex-fronted test --coverage

# Playwright E2E
pnpm --filter vibex-fronted playwright test --testPathPattern="canvas-button"

# Lint
pnpm lint
```

---

## 四、文件权限与路径规范

### 4.1 允许修改的路径

| 前缀 | 允许操作 | 说明 |
|------|----------|------|
| `vibex-fronted/src/stores/` | 新增 store | 仅限 confirmDialogStore |
| `vibex-fronted/src/lib/canvas/stores/` | 修改 | P0/P1/P2/P3/P4 |
| `vibex-fronted/src/components/canvas/` | 修改 | P1/P2/P3/P4/P5 |
| `vibex-fronted/src/hooks/canvas/` | 修改 | 视需要 |
| `vibex-fronted/tests/` | 新增/修改 | P0-P4 测试 |

### 4.2 禁止修改的路径（除非经过 Architect 审批）

| 路径 | 原因 |
|------|------|
| `vibex-fronted/src/lib/canvas/historySlice.ts` | undo/redo 核心逻辑 |
| `vibex-fronted/src/lib/canvas/types.ts` | 数据模型 |
| `vibex-fronted/src/stores/index.ts` | store 注册 |
| `vibex-fronted/src/app/canvas/` | 页面路由 |

---

## 五、PR 审查清单

### 5.1 代码质量检查

- [ ] **类型安全**: 无 `any` 类型
- [ ] **编译通过**: `pnpm --filter vibex-fronted build` 无错误
- [ ] **Lint 通过**: `pnpm lint` 无 warning / error
- [ ] **无硬编码**: 无凭证、Key 硬编码
- [ ] **无调试语句**: 无 `console.log`
- [ ] **测试覆盖**: 核心文件 > 80%

### 5.2 P0-P4 专项检查

#### P0: Flow undo
- [ ] `contextStore.deleteSelectedNodes('flow')` 调用 `useFlowStore.getState().deleteSelectedNodes()`
- [ ] `flowStore.deleteSelectedNodes` 已有 `recordSnapshot`
- [ ] Jest 测试通过
- [ ] E2E 批量删除 → Ctrl+Z 撤销测试通过

#### P1: 语义统一
- [ ] "取消" → "取消选择"
- [ ] "清空" → "✕ 清空画布"
- [ ] 三树文案一致

#### P2: 统一 confirm
- [ ] `confirmDialogStore` 新增且测试 > 90%
- [ ] `clearComponentCanvas` 使用 `confirmDialogStore`
- [ ] `resetFlowCanvas` 使用 `confirmDialogStore`
- [ ] 无 `window.confirm` 调用

#### P3/P4: 文案明确
- [ ] "重新生成" 有 tooltip
- [ ] `resetFlowCanvas` → `clearFlowCanvas` 重命名
- [ ] tooltip 说明明确

#### P5: ProjectBar
- [ ] Figma 设计稿已确认（X）→ **本次不做实现**，仅产出设计方案

### 5.3 回归测试

- [ ] 三树 undo/redo 路径回归测试通过
- [ ] 无新 console 警告
- [ ] 不改变现有 API 契约
- [ ] Canvas 页面正常加载

---

## 六、协作流程

### 6.1 提交规范

```bash
# 格式: <P编号>-<简短描述>
git commit -m "P0: fix flow deleteSelectedNodes calls flowStore.deleteSelectedNodes"
git commit -m "P1: unify tree toolbar button labels"
git commit -m "P2: add confirmDialogStore for destructive operations"
git commit -m "P3: add tooltip to regenerate button"
git commit -m "P4: rename resetFlowCanvas to clearFlowCanvas"
git commit -m "P5: design ProjectBar button consolidation (Figma pending)"
```

### 6.2 分支命名

```bash
# 格式: fix/canvas-button-audit-YYYYMMDD
git checkout -b fix/canvas-button-audit-20260410
```

---

*文档版本: v1.0 | 最后更新: 2026-04-10*
