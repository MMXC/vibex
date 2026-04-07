# 分析文档: Canvas 三栏画布展开功能缺失

**项目**: vibex-canvas-three-column-20260328  
**分析日期**: 2026-03-28  
**分析角色**: Analyst  
**工作目录**: /root/.openclaw/vibex

---

## 1. 问题概述

用户确认限界上下文树后，Canvas 三栏画布无法自动展开到当前激活的树面板，导致用户不清楚哪个面板处于激活状态，画布布局没有响应用户操作。

---

## 2. 展开机制现状分析

### 2.1 展开状态系统（存在且完整）

展开状态系统已在代码中完整实现，位于 `canvasStore.ts`：

```typescript
// PanelExpandState 类型: 'default' | 'expand-left' | 'expand-right'
leftExpand: PanelExpandState;   // 左侧面板
centerExpand: PanelExpandState; // 中间面板
rightExpand: PanelExpandState;  // 右侧面板
```

| 状态值 | 左/右面板含义 | 中间面板含义 |
|--------|--------------|-------------|
| `default` | 三栏等宽 (1fr) | 三栏等宽 (1fr) |
| `expand-right` | 左侧展开 (1.5fr)，右侧面板收缩 (0fr) | - |
| `expand-left` | 右侧面板收缩 (0fr) | 中间展开 (1.5fr)，左/右面板收缩 (0fr) |

状态同步通过 `CanvasPage.tsx` 中的 `useEffect` 实现：

```typescript
// CanvasPage.tsx line ~70
useEffect(() => {
  grid.style.setProperty('--grid-left', leftExpand === 'expand-right' ? '1.5fr' : ...);
  grid.style.setProperty('--grid-center', centerExpand === 'expand-left' ? '1.5fr' : ...);
  grid.style.setProperty('--grid-right', rightExpand === 'expand-left' ? '1.5fr' : ...);
}, [leftExpand, centerExpand, rightExpand]);
```

### 2.2 展开触发器：HoverHotzone 组件（存在但仅手动）

展开热区组件存在于 `HoverHotzone.tsx`，位于三栏面板之间的 8px 边缘区域。用户需要：
- **悬停**热区 → 显示展开箭头
- **单击** → 触发展开/收缩
- **双击** → 重置为 default

### 2.3 问题核心：展开逻辑完全依赖手动交互

展开状态**从未被自动触发**。以下关键函数均不改变展开状态：

| 函数 | 操作 | 是否改变展开状态 |
|------|------|----------------|
| `confirmContextNode()` | 确认上下文节点 | ❌ 不改变 |
| `confirmFlowNode()` | 确认流程节点 | ❌ 不改变 |
| `recomputeActiveTree()` | 重算激活树 | ❌ 不改变 |
| `setPhase()` | 切换阶段 | ❌ 不改变 |
| `autoGenerateFlows()` | 自动生成流程树 | ❌ 不改变 |
| `loadExampleData()` | 加载示例数据 | ❌ 不改变 |
| `generateContextsFromRequirement()` | AI 生成上下文 | ❌ 不改变 |

---

## 3. 根因分析

### 根因：缺乏自动展开逻辑

当用户确认限界上下文树后，`confirmContextNode` → `recomputeActiveTree` 将 `activeTree` 从 `'context'` 变为 `'flow'`。然而：

1. **展开状态不变** — `centerExpand` 仍为 `'default'`，三栏保持等宽
2. **视觉提示微弱** — 非激活面板仅降低 opacity 到 50%，但宽度不变，用户感知不强
3. **热区不显眼** — HoverHotzone 仅 8px 宽，悬停时才显示箭头，用户可能不知道它的存在
4. **移动端无展开机制** — `useTabMode` 下 TreePanel 以 Tab 切换渲染，完全没有 HoverHotzone

### 展开流程断点

```
用户确认上下文节点
  → confirmContextNode()
    → recomputeActiveTree()
      → activeTree: 'context' → 'flow'  ← 激活树切换了
      → leftExpand/centerExpand/rightExpand: 仍为 'default'  ← 展开状态未变化
    → autoGenerateFlows() (当全部确认且无 flowNodes)
      → setPhase('flow')  ← 阶段切换了
      → 展开状态仍为 'default'  ← 没有自动展开
```

---

## 4. 修复范围评估

### 4.1 必须修改的文件

| 文件 | 修改原因 |
|------|---------|
| `vibex-fronted/src/lib/canvas/canvasStore.ts` | `recomputeActiveTree()` 需要在切换激活树时自动调用 `setCenterExpand()` |
| `vibex-fronted/src/components/canvas/CanvasPage.tsx` | 考虑移动端展开入口；可能需要阶段变化时的展开初始化 |

### 4.2 建议修改的文件

| 文件 | 修改原因 |
|------|---------|
| `vibex-fronted/src/components/canvas/HoverHotzone.tsx` | 增加展开状态视觉提示，降低发现门槛 |
| `vibex-fronted/src/components/canvas/canvas.module.css` | 可选：增加激活面板的边框高亮等视觉增强 |

### 4.3 修复方案设计

**核心修复**：在 `recomputeActiveTree` 中，当激活树从 `context` 切换到 `flow` 时，自动将 `centerExpand` 设置为 `'expand-left'`（展开中间面板）。同理，当激活树切换到 `component` 时，保持展开中间面板。

```typescript
// canvasStore.ts - recomputeActiveTree 修改建议
recomputeActiveTree: () => {
  const { contextNodes, flowNodes, phase, activeTree } = get();
  // ... 现有逻辑 ...
  
  // 新增：当激活树变化时，自动展开对应面板
  const newActiveTree = /* 计算结果 */;
  if (newActiveTree !== activeTree) {
    // context → flow: 展开中间面板
    if (newActiveTree === 'flow') {
      set({ centerExpand: 'expand-left' });
    }
    // flow → component: 保持展开中间面板
    else if (newActiveTree === 'component') {
      set({ centerExpand: 'expand-left' });
    }
  }
}
```

---

## 5. 影响评估

- **影响范围**: 仅影响 Canvas 三栏画布的展开行为
- **向后兼容**: 自动展开为增强功能，不破坏现有手动展开热区
- **移动端**: 需要为 Tab 模式增加展开 UI（如 Tab 切换时的展开按钮或自动全屏）
- **边缘情况**: 多次快速确认节点时，需要确保展开状态不会被频繁覆盖

---

## 6. 验收标准建议

1. 用户确认限界上下文树后，中间面板（流程树）自动展开为 1.5fr，左/右侧面板收缩为 0fr
2. 用户确认流程树后，中间面板（组件树）自动展开
3. 手动展开热区（HoverHotzone）仍然可用，不受影响
4. 移动端 Tab 模式下，激活的面板能够全屏展示
5. 双击热区能正确重置为三栏等宽布局
