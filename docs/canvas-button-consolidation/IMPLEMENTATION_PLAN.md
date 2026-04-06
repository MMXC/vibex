# Canvas 按钮体系整合实施计划

> **项目**: canvas-button-consolidation  
> **作者**: architect  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 概述

本文档定义 E1-E6 共 6 个 Epic 的详细实施步骤、部署清单、回滚方案和成功标准。总工时 **2.4h**。

---

## Sprint 1（P0，1.8h）

### E1: TreeToolbar 按钮体系标准化（0.5h）

**Step 1: 确认 TreeToolbar 组件当前 props**
```bash
grep -n "interface.*Props\|TreeToolbarProps" \
  /root/.openclaw/vibex/vibex-fronted/src/components/canvas/TreeToolbar.tsx
```

**Step 2: 删除 BoundedContextTree 内的硬编码按钮**
```bash
# 定位 contextTreeControls 整块
grep -n "contextTreeControls\|treeHeader\|multiSelectControls" \
  /root/.openclaw/vibex/vibex-fronted/src/components/canvas/BoundedContextTree.tsx
```

**Step 3: 删除 BusinessFlowTree 内的 treeHeader + multiSelectControls**
```bash
grep -n "treeHeader\|multiSelectControls" \
  /root/.openclaw/vibex/vibex-fronted/src/components/canvas/BusinessFlowTree.tsx
```

**Step 4: 删除 ComponentTree 内的 contextTreeControls + multiSelectControls**
```bash
grep -n "contextTreeControls\|multiSelectControls" \
  /root/.openclaw/vibex/vibex-fronted/src/components/canvas/ComponentTree.tsx
```

**Step 5: 删除 CanvasPage.tsx 的 extraButtons 中的 mock 重新生成**
```bash
grep -n "extraButtons\|重新生成\|onClick.*setContextNodes" \
  /root/.openclaw/vibex/vibex-fronted/src/app/canvas/page.tsx
```

---

### E2: Store flow 分支修复（0.5h）

**Step 1: 定位 contextStore flow 分支**
```bash
grep -n "selectAllNodes\|clearNodeSelection\|deleteSelectedNodes" \
  /root/.openclaw/vibex/vibex-fronted/src/lib/canvas/stores/contextStore.ts | head -20
```

**Step 2: 修复 flow 分支 selectAllNodes**
```typescript
// 找到 selectAllNodes，在 flow 分支补充：
if (tree === 'flow') {
  set(s => ({ selectedNodeIds: { ...s.selectedNodeIds, flow: s.flowNodes.map(n => n.nodeId) } }))
}
```

**Step 3: 修复 flow 分支 clearNodeSelection**
```typescript
if (tree === 'flow') {
  set(s => ({ selectedNodeIds: { ...s.selectedNodeIds, flow: [] } }))
}
```

**Step 4: 修复 flow 分支 deleteSelectedNodes**
```typescript
if (tree === 'flow') {
  getHistoryStore().getState().recordSnapshot()
  set(s => ({
    flowNodes: s.flowNodes.filter(n => !s.selectedNodeIds.flow.includes(n.nodeId)),
    selectedNodeIds: { ...s.selectedNodeIds, flow: [] }
  }))
}
```

---

### E3: flowStore 批量操作补全（0.5h）

**Step 1: 在 flowStore 中新增方法**
```typescript
// flowStore.ts 新增
selectAllNodes: () => set(s => ({
  selectedNodeIds: { ...s.selectedNodeIds, flow: s.flowNodes.map(n => n.nodeId) }
})),

clearNodeSelection: () => set(s => ({
  selectedNodeIds: { ...s.selectedNodeIds, flow: [] }
})),

deleteSelectedNodes: () => {
  getHistoryStore().getState().recordSnapshot()
  set(s => ({
    flowNodes: s.flowNodes.filter(n => !s.selectedNodeIds.flow.includes(n.nodeId)),
    selectedNodeIds: { ...s.selectedNodeIds, flow: [] }
  }))
},

resetFlowCanvas: () => {
  getHistoryStore().getState().recordSnapshot()
  set({ flowNodes: [], selectedNodeIds: { context: [], flow: [], component: [] } })
},
```

**Step 2: Jest 测试覆盖**
```bash
pnpm test -- --testPathPattern="flowStore" --verbose
```

---

### E4: 清空操作 history 强制化（0.3h）

**Step 1: CanvasPage.tsx 重置按钮统一加 snapshot**
```typescript
// Context 栏
onReset={() => {
  getHistoryStore().getState().recordSnapshot()
  contextStore.setContextNodes([])
}}

// Flow 栏
onReset={() => {
  getHistoryStore().getState().recordSnapshot()
  flowStore.setFlowNodes([])
}}

// Component 栏 — 调用 store 方法
onReset={() => {
  getHistoryStore().getState().recordSnapshot()
  componentStore.clearComponentCanvas()
}}
```

**Step 2: 手动 Ctrl+Z 验证**
1. 清空 Context 树 → Ctrl+Z 恢复
2. 清空 Flow 树 → Ctrl+Z 恢复
3. 清空 Component 树 → Ctrl+Z 恢复

---

## Sprint 2（P1，0.6h）

### E5: 重新生成按钮 mock 修复（0.3h）

**Step 1: 定位 mock 重新生成按钮**
```bash
grep -n "extraButtons\|重新生成\|setContextNodes\|mock" \
  /root/.openclaw/vibex/vibex-fronted/src/app/canvas/page.tsx | head -10
```

**Step 2: 替换为真实 AI 调用**
```typescript
// 修复前
<Button onClick={() => setContextNodes([mock1, mock2])}>🔄 重新生成</Button>

// 修复后
const handleContextRegenerate = async () => {
  const result = await canvasApi.generateContexts(requirementText)
  getHistoryStore().getState().recordSnapshot()
  contextStore.setContextNodes(result)
}
```

---

### E6: 回归测试验证（0.3h）

**Step 1: Playwright E2E 测试三栏按钮**
```typescript
test('三栏按钮完整流程', async ({ page }) => {
  await page.goto('/canvas')
  
  // Context 栏
  await page.click('button:has-text("全选")')
  await expect(page.locator('[data-selected="true"]')).toHaveCount(5)
  
  // Flow 栏切换后测试
  await page.click('button:has-text("继续")')
  await page.click('button:has-text("全选")')
  await expect(page.locator('.flow-node')).toHaveCount(3)
})
```

---

## 部署清单

| # | 检查项 | 状态 |
|---|--------|------|
| 1 | TreeToolbar 扩展为 6 按钮 | ☐ |
| 2 | 组件内硬编码按钮全部删除 | ☐ |
| 3 | CanvasPage extraButtons mock 移除 | ☐ |
| 4 | contextStore flow 分支三个方法修复 | ✅ |
| 5 | flowStore 三个批量方法新增 | ✅ |
| 6 | CanvasPage 重置按钮统一加 snapshot | ✅ |
| 7 | Component 栏调用 clearComponentCanvas | ✅ |
| 8 | 重新生成调用真实 AI API | ✅ |
| 9 | Playwright E2E 测试通过 | ✅ |
| 10 | Jest 单元测试通过 | ✅ |
| 11 | Ctrl+Z 三栏撤销测试通过 | ✅ |
| 12 | ESLint 检查通过 | ✅ |

---

## 回滚方案

| Epic | 回滚命令 |
|------|----------|
| E1 | `git checkout HEAD -- vibex-fronted/src/components/canvas/BoundedContextTree.tsx vibex-fronted/src/components/canvas/BusinessFlowTree.tsx vibex-fronted/src/components/canvas/ComponentTree.tsx` |
| E2 | `git checkout HEAD -- vibex-fronted/src/lib/canvas/stores/contextStore.ts` |
| E3 | `git checkout HEAD -- vibex-fronted/src/lib/canvas/stores/flowStore.ts` |
| E4 | `git checkout HEAD -- vibex-fronted/src/app/canvas/page.tsx` |
| E5 | `git checkout HEAD -- vibex-fronted/src/app/canvas/page.tsx` |
| E6 | `git checkout HEAD -- vibex-fronted/src/__tests__/` |

---

## 成功标准

| Epic | 成功条件 | 验证 |
|------|----------|------|
| E1 | 按钮数量 ≤ 6/栏 | 手动计数 |
| E2 | Flow 树全选/取消/删除有响应 | 手动点击 |
| E3 | flowStore 三个方法存在且正确 | Jest 断言 |
| E4 | 三栏清空后 Ctrl+Z 可撤销 | 手动测试 |
| E5 | 重新生成调用真实 AI API | 网络请求验证 |
| E6 | E2E + 单元测试 100% 通过 | CI |

---

## 时间线

```
Day 1 (2026-04-06)
├── Sprint 1 (1.8h)
│   ├── E1: TreeToolbar 按钮标准化 (0.5h)
│   ├── E2: Store flow 分支修复 (0.5h)
│   ├── E3: flowStore 批量操作 (0.5h)
│   └── E4: 清空 history 强制化 (0.3h)
└── Sprint 2 (0.6h)
    ├── E5: 重新生成 mock 修复 (0.3h)
    └── E6: 回归测试验证 (0.3h)
```
