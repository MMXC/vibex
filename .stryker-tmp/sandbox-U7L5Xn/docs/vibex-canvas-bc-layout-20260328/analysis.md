# Analysis: VibeX Canvas Bounded Context Card Layout

**Project**: vibex-canvas-bc-layout-20260328
**Analyst**: ANALYST
**Date**: 2026-03-28
**Status**: ✅ 分析完成

---

## 1. 问题定义

### 当前状态（验证自 gstack 截图）
- 限界上下文卡片以**纯垂直列表**排列（用户管理 → 订单管理 → 商品管理）
- 每个卡片独立展示，无任何分组视觉
- 领域类型仅以右上角小 badge 显示（"核心 ✓"）
- **用户无法直观识别哪些上下文属于同一领域**

### 目标状态
- 按**领域类型分组**：核心域（虚线橙框）、支撑域（虚线蓝框）、通用域（虚线灰框）
- 同组内的多个上下文卡片包裹在同一虚线领域框内
- 领域框左上角显示领域标签（如 "核心域"、"支撑域"）

### 根因
`BoundedContextTree.tsx` 中的 `contextNodeList` 仅做 `map` 遍历渲染，无任何分组逻辑：
```tsx
{contextNodes.map((node) => (
  <ContextCard key={node.nodeId} node={node} ... />
))}
```

---

## 2. 业务场景分析

| 维度 | 说明 |
|------|------|
| **场景** | 限界上下文树视图 |
| **用户** | 产品经理 / 领域建模参与者 |
| **核心价值** | 快速理解系统边界，按领域分组查看降低认知负担 |
| **当前痛点** | 当上下文数量 > 5 时，垂直列表难以直观区分领域归属 |
| **期望体验** | 领域分组清晰可见，不同领域用不同颜色虚线框区分 |

---

## 3. 技术方案对比

### 方案 A：基于现有 BoundedGroupOverlay 集成（推荐）

**思路**：复用已实现的 `BoundedGroupOverlay` 组件（`/components/canvas/groups/BoundedGroupOverlay.tsx`），将其集成到 `BoundedContextTree` 的渲染层中。

**实现路径**：
1. 在 `BoundedContextTree` 中，按 `node.type`（core/supporting/generic）将 `contextNodes` 分组
2. 调用 `canvasStore.addBoundedGroup()` 为每个领域类型创建分组（仅当该类型节点数 > 1 时）
3. 将 `BoundedGroupOverlay` 作为 SVG 层叠加在卡片列表上方
4. 需要解决：Overlay 使用 ReactFlow viewport，而 BoundedContextTree 是纯 CSS 垂直列表

**优点**：
- 组件已存在，复用成本低
- 样式一致（虚线、颜色、标签 badge 均已实现）

**缺点**：
- `BoundedGroupOverlay` 专为 ReactFlow 节点设计（基于 `Node.position.x/y`），与 CSS 垂直列表坐标不兼容
- 需要坐标映射或改造 Overlay 渲染逻辑

**工作量**：⭐⭐（中低，约 6h）
- 分组逻辑：1h
- 坐标适配或 Overlay 改造：3h
- 样式调试：2h

### 方案 B：纯 CSS 分组布局

**思路**：使用 CSS Grid/Flexbox 实现领域分组，放弃 BoundedGroupOverlay。

**实现路径**：
1. 将 `contextNodes` 按 `type` 分组为 `coreNodes / supportingNodes / genericNodes`
2. 渲染结构改为：
   ```
   <领域分组容器>
     <领域标题> 核心域（3）
       <ContextCard />
       <ContextCard />
     </领域分组容器>
   </领域分组容器>
   ```
3. 每个领域分组有自己的虚线边框样式（`border: 2px dashed {color}`）
4. 使用 `styles` CSS Modules 隔离样式

**优点**：
- 实现简单，无需坐标映射
- 纯 CSS 布局，渲染性能好
- 与现有 BoundedContextTree 架构一致（垂直列表基础上加分组容器）

**缺点**：
- 需要重构 BoundedContextTree 渲染结构
- 与 BoundedGroupOverlay 不兼容（需二选一）

**工作量**：⭐（低，约 4h）
- 分组逻辑：1h
- CSS 样式：2h
- 集成测试：1h

### 方案 C：迁移到 ReactFlow + BoundedGroupOverlay

**思路**：将 `BoundedContextTree` 替换为 `ContextTreeFlow`（已使用 CardTreeRenderer + ReactFlow），BoundedGroupOverlay 自然生效。

**实现路径**：
1. 在 `CanvasPage.tsx` 中，将 `<BoundedContextTree />` 替换为 `<ContextTreeFlow contexts={contextNodes} />`
2. 确保 `boundedGroups` store 有正确的分组数据
3. 在 `CanvasPage` 中渲染 `<BoundedGroupOverlay />`

**优点**：
- 完整利用已有架构（BoundedGroupOverlay + ReactFlow）
- 支持缩放/拖拽时领域框动态跟随
- 可视化效果最接近目标状态

**缺点**：
- 改动范围最大，影响 `CanvasPage` 和 `BoundedContextTree`
- 可能破坏现有的 CRUD 操作（编辑/删除/确认）
- 从垂直列表切换到自由布局，用户体验变化大

**工作量**：⭐⭐⭐⭐（高，约 20h）
- 迁移 BoundedContextTree → ContextTreeFlow：8h
- 适配 CRUD 操作：4h
- BoundedGroupOverlay 集成：4h
- 回归测试：4h

---

## 4. 推荐方案

**推荐：方案 B（纯 CSS 分组布局）**

理由：
1. **最小改动，最大收益**：仅修改 BoundedContextTree 渲染结构和样式，不动架构
2. **与现有系统兼容**：保持垂直列表交互模式，用户无需重新学习
3. **风险低**：不依赖 BoundedGroupOverlay 的坐标系统，无 ReactFlow 迁移风险
4. **可测试**：每个领域分组独立渲染，验收标准清晰

---

## 5. JTBD 分析

| JTBD | 用户行为 | 验收条件 |
|------|----------|----------|
| JTBD-1: 快速理解领域结构 | 用户进入上下文树，能一眼区分核心域/支撑域/通用域 | 页面加载后 3 秒内可识别分组 |
| JTBD-2: 查看领域内所有上下文 | 用户点击核心域分组，查看该领域下所有上下文 | 核心域卡片在虚线框内，无跨组错位 |
| JTBD-3: 添加/编辑上下文 | CRUD 操作不受分组影响 | 编辑/删除按钮在组内卡片上正常响应 |

---

## 6. 验收标准

| ID | 验收条件 | 测试方法 |
|----|----------|----------|
| AC-1 | 当 contextNodes 包含多个 core 类型时，它们被包裹在同一虚线橙框内 | 示例数据加载后，核心域卡片可见虚线橙色边框 |
| AC-2 | 当 contextNodes 包含支撑域时，它们被包裹在同一虚线蓝框内 | 手动添加 2 个支撑域节点，验证虚线蓝框 |
| AC-3 | 领域框左上角显示领域标签（"核心域"、"支撑域"、"通用域"） | 截图验证标签文字和背景色 |
| AC-4 | 单个领域的上下文仍可正常 CRUD（确认/编辑/删除） | 点击确认/编辑/删除按钮，功能正常 |
| AC-5 | 响应式：窗口宽度变化时分组建组保持完整 | 缩放浏览器到 375px 宽度，验证无错位 |
| AC-6 | 无领域类型时（如无 generic），不渲染对应分组容器 | 仅 core + supporting 时，页面无 generic 分组 |

---

## 7. 风险识别

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| BoundedGroupOverlay 与 CSS 布局不兼容 | 中 | 选择方案 B，完全不依赖 Overlay |
| 分组容器破坏现有编辑模式（点击编辑按钮） | 低 | 使用 `position: relative` 分组容器，确保事件冒泡正常 |
| 多类型混合时顺序不确定 | 低 | 按 core → supporting → generic → external 固定排序 |

---

## 8. 实现建议（方案 B 概要）

```tsx
// BoundedContextTree.tsx 修改
const groupedNodes = {
  core: contextNodes.filter(n => n.type === 'core'),
  supporting: contextNodes.filter(n => n.type === 'supporting'),
  generic: contextNodes.filter(n => n.type === 'generic'),
  external: contextNodes.filter(n => n.type === 'external'),
};

// 渲染结构
Object.entries(groupedNodes).forEach(([type, nodes]) => {
  if (nodes.length === 0) return;
  return (
    <div className={styles.domainGroup} data-type={type}>
      <div className={styles.domainGroupHeader}>
        {type === 'core' ? '核心域' : type === 'supporting' ? '支撑域' : '通用域'}
      </div>
      {nodes.map(node => <ContextCard key={node.nodeId} node={node} ... />)}
    </div>
  );
});
```

```css
/* canvas.module.css */
.domainGroup {
  position: relative;
  border: 2px dashed var(--domain-color);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.domainGroupHeader {
  position: absolute;
  top: -10px;
  left: 8px;
  background: white;
  padding: 0 6px;
  color: var(--domain-color);
  font-size: 11px;
  font-weight: 600;
}
```
