# Canvas Code Audit — Implementation Plan

> **项目**: canvas-code-audit
> **阶段**: design-architecture
> **Architect**: architect
> **时间**: 2026-04-10

---

## Phase 1: P0 Critical Bug Fixes (2.5h)

### Story F1.1: onGenerateContext API 连接 (1.5h)

**目标**: 删除硬编码 mock 数据，连接真实 `canvasApi.generateContexts()`

**文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`

**当前问题** (行 ~267-283):
```typescript
// ❌ 硬编码 mock，直接写入 store，不走 API
const drafts: BoundedContextDraft[] = [
  { name: '需求管理', description: '处理需求录入', type: 'core' },
  { name: '业务流程', description: '核心业务处理', type: 'core' },
];
const newCtxs: BoundedContextNode[] = drafts.map((d, i) => ({
  nodeId: `ctx-gen-${Date.now()}-${i}`,
  ...
}));
useContextStore.getState().setContextNodes(newCtxs);
```

**修复方案**:
```typescript
// ✅ 改为调用真实 API（参考同文件行 651 处已实现的模式）
const result = await canvasApi.generateContexts({ requirementText });
const ctxs: BoundedContextNode[] = result.contexts.map((c) => ({
  nodeId: c.id,
  name: c.name,
  description: c.description,
  type: c.type,
  status: 'pending' as const,
  isActive: false,
  children: [],
}));
getHistoryStore().recordSnapshot('context', ctxs);
useContextStore.getState().setContextNodes(ctxs);
```

**Patterns to follow**: 行 651 处已实现的 `canvasApi.generateContexts` 调用模式

**Test scenarios**:
- Happy path: 用户输入需求文本，点击生成，验证 `canvasApi.generateContexts` 被调用
- Edge case: 需求文本为空（已有 toast 拦截）
- Edge case: 快速重复点击（已有 debounce/state guard）
- Error path: API 调用失败（→ F2.1 添加 toast）

**Verification**: 
- `npm run test` 通过
- `npm run lint` 通过，新增 0 个 lint 错误

**状态**: ✅ 已完成 (2026-04-10)
**Commit**: 774a08cb

---

### Story F1.2: TreeToolbar 渲染函数抽取 (0.5h)

**目标**: 消除两处几乎完全相同的 TreeToolbar JSX

**文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`

**受影响位置**: 
- `renderTabContent` 内 `ContextTreePanel` 的 `headerActions` (行 ~335)
- 主 grid 内 `ContextTreePanel` 的 `headerActions` (行 ~386)
- 其他可能存在的第三处（需扫描确认）

**修复方案**:
```typescript
// 在 CanvasPage 组件内添加内联渲染函数
function renderContextTreeToolbar(
  treeType: 'context' | 'flow' | 'component',
  nodeCount: number,
  extraProps: {
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onClear: () => void;
    onContinue: () => void;
    continueLabel: string;
    continueDisabled: boolean;
    extraButtons?: React.ReactNode;
  }
) {
  return (
    <TreeToolbar
      treeType={treeType}
      nodeCount={nodeCount}
      {...extraProps}
    />
  );
}
```

**Patterns to follow**: React 函数组件内联 helper 的惯用模式

**Test scenarios**:
- Happy path: 两处 TreeToolbar 渲染结果一致
- Verification: `renderContextTreeToolbar` 函数存在且类型正确

**Verification**: 源码中不再有重复的 TreeToolbar JSX 块

**状态**: ✅ 已完成 (2026-04-10)
**Commit**: a56ed085

---

### Story F1.3: handleRegenerateContexts 合并 (0.5h)

**目标**: 消除两处完全相同的 onClick handler

**文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`

**受影响位置**:
- `renderTabContent` 内 context 的 extraButtons onClick (行 ~351)
- 主 grid 内 context 的 extraButtons onClick (行 ~650)

**当前问题**: 两处 onClick 完全相同，copy-paste 代码

**修复方案**:
```typescript
// 在组件顶部 useCallback 定义
const handleRegenerateContexts = useCallback(
  async (text: string) => {
    if (!text.trim()) return;
    if (aiThinking || isQuickGenerating) return;
    try {
      const result = await canvasApi.generateContexts({ requirementText: text });
      const ctxs: BoundedContextNode[] = result.contexts.map((c) => ({
        nodeId: c.id,
        name: c.name,
        description: c.description,
        type: c.type,
        status: 'pending' as const,
        isActive: false,
        children: [],
      }));
      getHistoryStore().recordSnapshot('context', ctxs);
      useContextStore.getState().setContextNodes(ctxs);
    } catch (err) {
      // 错误处理由 F2.1 统一添加 toast
      canvasLogger.CanvasPage.error('handleRegenerateContexts error:', err);
    }
  },
  [] // 依赖项由 implementer 根据实际确定
);

// 两处调用替换为
onClick={() => handleRegenerateContexts(requirementText)}
```

**Patterns to follow**: React useCallback 规范（`src/hooks/canvas/` 目录下的 hooks）

**Test scenarios**:
- Happy path: 调用 handleRegenerateContexts，验证 canvasApi 被调用
- Edge case: 空文本 / 重复调用（state guard）
- Error path: API 失败（→ F2.1 toast）

**Verification**: 源码中相同 handler 代码块只出现一次

**状态**: ✅ 已完成 (2026-04-10)
**Commit**: 43a4522c (含 F2.1 toast)

---

## Phase 2: P1 Quality Improvements (1.85h)

### Story F2.1: API 错误添加 Toast 提示 (0.5h)

**目标**: 消除静默错误，用户感知 API 失败

**文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`

**受影响位置**: 所有 `catch {}` 块

**修复方案**: 在 `onGenerateContext` 和 `handleRegenerateContexts` 的 catch 块中：
```typescript
catch (err) {
  canvasLogger.CanvasPage.error('generateContexts failed:', err);
  toast.showToast('重新生成失败，请重试', 'error');
}
```

**Patterns to follow**: `onQuickGenerate` 的错误处理模式（已有 toast 调用）

**Test scenarios**:
- Error path: API 返回错误，验证 toast.showToast('重新生成失败，请重试', 'error') 被调用

**Verification**: 所有 API 调用 catch 块均有 toast 错误提示

**状态**: ✅ 已完成 (2026-04-10)
**Commit**: 774a08cb (含于 F1.1)

---

### Story F2.2: 删除 REMOVED 注释块 (0.25h)

**目标**: 清理已废弃代码注释，降低认知负担

**文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`

**受影响位置**: 行 ~165-211

**修复方案**: 删除所有 `// REMOVED:` 行，保留结构注释

**Patterns to follow**: 代码注释最小化原则

**Test scenarios**:
- Verification: CanvasPage.tsx 中不包含 `// REMOVED:` 字符串

**Verification**: grep 无结果

**状态**: ✅ 已完成 (2026-04-10)
**Commit**: fab64ec8

---

### Story F2.3: 删除未使用 import (0.1h)

**目标**: 删除 `loadExampleData` import

**文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`

**受影响位置**: 行 ~45

**修复方案**: 删除 `import { loadExampleData } from '@/lib/canvas/loadExampleData'`

**Verification**: `npm run lint` 无 unused import 警告

**状态**: ✅ 已完成 (2026-04-10)
**Commit**: 6c327c52 (含 F2.3 删除 loadExampleData)

---

### Story F2.4: 抽取 cx() 工具函数 (0.5h)

**目标**: 消除重复的 class 拼接逻辑

**文件**: 
- 创建: `vibex-fronted/src/lib/canvas/utils/class.ts`
- 修改: `vibex-fronted/src/components/canvas/CanvasPage.tsx`

**受影响位置**: 行 ~444, ~452, ~460

**修复方案**:
```typescript
// src/lib/canvas/utils/class.ts
export function cx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// CanvasPage.tsx 中替换
import { cx } from '@/lib/canvas/utils/class';

// containerClasses / rowWrapperClasses / gridClasses 均改为
const containerClasses = cx(
  styles.canvasContainer,
  expandMode === 'maximize' && styles.maximizeMode,
  expandMode === 'expand-both' && styles.expandBothMode,
);
```

**Patterns to follow**: `src/lib/canvas/` 下 utils 文件的组织方式

**Test scenarios**:
- Happy path: cx('a', 'b', undefined, false, 'c') === 'a b c'
- Edge case: 全 undefined / false → 返回空字符串
- Edge case: 大量 class 组合

**Verification**: 三处 filter(Boolean).join 均替换为 cx()

**状态**: ✅ 已完成 (2026-04-10)
**Commit**: 6c327c52

---

### Story F2.5: FlowEdgeLayer 一致性确认 (0.5h)

**目标**: 与 team 确认 BusinessFlowTree 中 FlowEdgeLayer 是否应移除

**文件**: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`

**当前状态**: CanvasPage 注释写着 edge layers 已移除，但 BusinessFlowTree 仍在使用 FlowEdgeLayer

**处理方式**: 
- ⚠️ 暂不修改代码，等待 team decision
- 在 PR 备注中记录此不一致，decision 由 PM/tech lead 做出
- 验收标准: 有明确 decision 记录（保留或移除）

**Verification**: decision 已记录在 PR review 备注中

**状态**: ✅ 已完成 (2026-04-10)
**Commit**: 2e076c32
**Decision**: FlowEdgeLayer 保留在 BusinessFlowTree；CanvasPage 注释已更新

---

## Phase 3: P2 Polish (2.7h, 可选)

### Story F3.1: 完善 Zustand Store 类型定义 (2.5h)

**目标**: 消除所有 `?.` 可选链调用，完善类型定义

**文件**: 
- `vibex-fronted/src/lib/canvas/stores/contextStore.ts`
- `vibex-fronted/src/components/canvas/CanvasPage.tsx`

**修复方案**: 在 store 类型定义中补充缺失方法签名

**Patterns to follow**: `src/lib/canvas/stores/` 下现有 store 的类型定义风格

**Test scenarios**:
- Verification: CanvasPage.tsx 中无 `?.(` 模式

**Verification**: grep 无结果

---

### Story F3.2: 清理 canvasApi.ts 重复注释 (0.1h)

**目标**: 删除重复的 schema 注释块

**文件**: `vibex-fronted/src/lib/canvas/api/canvasApi.ts`

**Verification**: 重复注释块只出现一次

**状态**: ✅ 已完成 (2026-04-10)
**Commit**: 406ce7f2

---

### Story F3.3: 统一 Keyboard Handler 引用路径 (0.5h)

**目标**: 统一 keyboard shortcut handler 引用，减少跨文件追踪

**文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx` + 相关 hooks

**Verification**: 重复定义的 keyboard handler 数量为 0

**状态**: ✅ 已完成 (2026-04-10)
**说明**: CanvasPage 仅 import 并调用一次 `useKeyboardShortcuts`，无重复 handler

---

### Story F3.1: 完善 Zustand Store 类型定义 (2.5h)

**目标**: 消除所有 `?.` 可选链调用，完善类型定义

**文件**: 
- `vibex-fronted/src/lib/canvas/stores/contextStore.ts`
- `vibex-fronted/src/components/canvas/CanvasPage.tsx`

**状态**: ⚠️ 保持现状
**原因**: CanvasPage.tsx 中存在的 `?.()` 可选链（如 `selectAllNodes?.()`）是 store 方法的合理 fallback，防止部分 store slice 未实现该方法时崩溃。修改需打破 store 契约（AGENTS.md 约束：不新增全局状态或副作用、不改变 Zustand store 契约）。可选链在 React 组件中是标准模式，不影响功能。

---

## 实施顺序

```
1. F2.4 (cx util)      ← 基础工具，先建
2. F1.1 + F2.1         ← P0 核心 + P1 错误处理（一次性完成）
3. F1.2 + F1.3         ← 重复代码抽取（依赖 F1.1 的结构）
4. F2.2 + F2.3         ← 注释和 import 清理
5. F2.5                ← team decision（可并行）
6. F3.1 + F3.2 + F3.3  ← P2 可选优化
```

---

## 测试策略

| 层级 | 工具 | 覆盖目标 |
|------|------|----------|
| 单元测试 | Vitest | cx() utility, useCallback 行为 |
| 集成测试 | React Testing Library | TreeToolbar 渲染, onGenerateContext 流程 |
| 类型检查 | TypeScript | F3.1 可选链消除 |
| E2E/手动验证 | gstack qa | 页面加载, 用户操作流程 |
| Lint | ESLint | 代码风格, 无新增错误 |

**覆盖率要求**: 关键路径 > 80%

---

## 工期汇总

| Story | 估算 | 实际 | 备注 |
|-------|------|------|------|
| F1.1 | 1.5h | - | |
| F1.2 | 0.5h | - | |
| F1.3 | 0.5h | - | |
| F2.1 | 0.5h | - | |
| F2.2 | 0.25h | - | |
| F2.3 | 0.1h | - | |
| F2.4 | 0.5h | - | |
| F2.5 | 0.5h | - | team decision |
| F3.1 | 2.5h | - | P2 可选，维持现状 |
| F3.2 | 0.1h | ✅ | P2 |
| F3.3 | 0.5h | ✅ | P2 |
| **P0+P1 总计** | **4.35h** | - | |
| **P2 总计** | **3.1h** | - | 可选 |
