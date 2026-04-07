# Analysis: vibex-canvas-expandable-20260327

**任务**: vibex-canvas-expandable-20260327/analyze-requirements
**分析人**: Analyst
**时间**: 2026-03-27 01:40 (UTC+8)
**状态**: ✅ 完成

---

## 1. 执行摘要

**一句话结论**: 基于设计文档 `vibex-canvas-expandable-20260327.md` 产出分析，包含 3 个功能增强（双向展开/卡片拖拽/虚线领域框），现有 ReactFlow v11.11.4 已有拖拽能力但缺少展开机制，工时 ~8h（Dev）+ ~2h（Test）。

---

## 2. 现状验证（基于代码审查）

### 2.1 技术栈现状

| 组件 | 当前版本 | 设计需求 | 差距 |
|------|----------|---------|------|
| ReactFlow | v11.11.4 | v12+（拖拽排序） | ⚠️ 需升级 |
| CSS Grid | ✅ 已有 | 三栏动态宽度 | ✅ 可扩展 |
| dagre 布局 | ❌ 未集成 | 自动布局 | 🔴 需新增 |
| 关系边 | ✅ 已实现 | RelationshipEdge | ✅ 已完成 |

### 2.2 已有能力确认（源码验证）

| 功能 | 文件 | 状态 |
|------|------|------|
| 三栏网格（1fr 1fr 1fr） | `canvas.module.css` `.treePanelsGrid` | ✅ |
| 面板折叠/展开动画 | `canvasStore.ts` + CSS | ✅ |
| GatewayNode（菱形） | `nodes/GatewayNode.tsx` | ✅ Epic2 |
| LoopEdge（红色虚线） | `edges/LoopEdge.tsx` | ✅ Epic2 |
| RelationshipEdge | `edges/RelationshipEdge.tsx` | ✅ Epic1 |
| CardTreeRenderer | `CardTreeRenderer.tsx` | ✅ |

### 2.3 缺失能力

| 功能 | 优先级 | 差距 |
|------|--------|------|
| 双向展开（三栏动态宽度） | P0 | 全新增 |
| 卡片拖拽排序 | P0 | ⚠️ 需升级 ReactFlow |
| 虚线领域框 | P1 | 全新增 |
| dagre 自动布局 | P1 | 全新增 |

---

## 3. 关键约束识别

### ⚠️ 约束 1: ReactFlow 版本升级

**当前**: v11.11.4，`package.json` 确认
**设计文档**: 要求 v12+ 拖拽 API

```bash
# 升级命令
pnpm add @xyflow/react@latest
```

**风险**: v11→v12 可能破坏现有 API（如 `onNodesChange` 签名变化）
**缓解**: 先升级到 v12，跑测试，再开发

### ⚠️ 约束 2: 无 localStorage 持久化

拖拽后的位置如需保存，需确认 localStorage 持久化方案（`canvasStore.ts` 已有的 persist）
**状态**: ✅ 已有 persist，需扩展 `draggedPositions` 字段

---

## 4. Epic 细化与工时修正

### Epic E1: 三栏双向展开

**范围**:
1. `canvasStore.ts` 新增 `CanvasExpandState` slice（left/center/right expand 状态）
2. `canvas.module.css` 扩展 `.treePanelsGrid` 支持动态 `grid-template-columns`
3. `CanvasPage.tsx` 添加边缘热区（8px hover 区域）和展开箭头图标
4. 最小宽度保护：`min-width: 200px`

**CSS Grid 扩展方案**:
```css
.treePanelsGrid {
  /* 默认三等分 */
  grid-template-columns: var(--col-left, 1fr) var(--col-center, 1fr) var(--col-right, 1fr);
  transition: grid-template-columns 300ms ease-in-out;
}

.treePanelsGrid[data-expand="left"] {
  --col-left: 1.5fr;
  --col-center: 0.75fr;
  --col-right: 0.75fr;
}
```

**工时**: ~2h（Dev）+ 0.5h（Test）

---

### Epic E2: 卡片拖拽排序

**前置条件**: ReactFlow 升级到 v12

**范围**:
1. 升级 `@xyflow/react` 到 v12
2. `DraggableCardTreeRenderer.tsx` 新建（封装 ReactFlow 拖拽能力）
3. `canvasStore.ts` 新增 `draggedPositions: Record<string, Position>` 持久化字段
4. 200ms debounce → dagre 自动布局重算
5. 回归测试：确保拖拽不破坏现有关系边

**技术注意点**:
- ReactFlow v12 `onNodesChange` 返回 `NodeChange[]`，需处理 `type: 'position'` 的变化
- 拖拽时用 `applyNodeChanges()` 更新位置
- dagre 布局只在拖拽结束后触发

**工时**: ~3.5h（Dev，含 ReactFlow 升级兼容）+ 0.5h（Test）

---

### Epic E3: 虚线领域框

**范围**:
1. `BoundedGroupNode.tsx` 新建（Custom Parent Node 容器）
2. `canvasStore.ts` 新增 `boundedGroups: BoundedContextGroup[]` 字段
3. 跨框关系边处理（穿越边框时自动打断）

**实现方案**:
使用 ReactFlow v12 的 **subflow** 或 **group** 模式：
```tsx
<BoundedGroupNode
  id="group-1"
  data={{ label: '患者管理', color: '#6366f1' }}
  className="dashed-group-node"
>
  {groupNodeIds.map(id => <Node id={id} />)}
</BoundedGroupNode>
```

**工时**: ~1.5h（Dev）+ 0.5h（Test）

---

### Epic E4: 回归测试

**范围**: Playwright E2E，覆盖所有交互路径

**工时**: ~1h（Test）

---

## 5. 总工时估算

| Epic | 开发 | 测试 | 小计 |
|------|------|------|------|
| E1: 三栏双向展开 | 2h | 0.5h | 2.5h |
| E2: 卡片拖拽排序 | 3.5h | 0.5h | 4h |
| E3: 虚线领域框 | 1.5h | 0.5h | 2h |
| E4: 回归测试 | 0h | 1h | 1h |
| **合计** | **7h** | **2.5h** | **~9.5h** |

> 修正：设计文档估算 8h（Dev），考虑 ReactFlow 升级兼容风险，增加 1h buffer。

---

## 6. Open Questions 处理建议

| 问题 | 建议 | 优先级 |
|------|------|--------|
| 展开时面板最小宽度是否可配置 | 否，保持固定 200px，减少复杂度 | P2 |
| 拖拽排序是否需要 Undo/Redo | 否，P0 功能不加复杂特性 | P1 |
| 虚线领域框是否需要手动创建/删除 | 是，用户通过右键菜单创建/删除 | P1 |
| 移动端（<768px）展开行为 | 保持折叠，仅显示单栏 | P1 |

---

## 7. 验收标准

| ID | 验收条件 | 测试方法 |
|----|----------|---------|
| V1 | 悬停左栏右边缘 → 显示展开图标 → 点击 → 左栏变宽 50%，动画平滑 | gstack 交互 |
| V2 | ReactFlow v12 升级后 npm build ✅，无 TS 错误 | CI 验证 |
| V3 | 卡片拖拽后释放 → 位置保存到 localStorage，刷新页面不丢失 | Playwright |
| V4 | 拖拽后关系边自动重连 | gstack 截图 |
| V5 | 虚线领域框包裹相关卡片，跨框边正确穿越 | gstack 截图 |
| V6 | npm build ✅ + Playwright E2E 100% | CI 验证 |

---

## 8. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| ReactFlow v12 破坏现有 API | 中 | 高 | 先升级跑测试，再开发 |
| dagre 布局破坏手动拖拽 | 中 | 中 | 手动位置优先级 > 自动布局 |
| 大量节点（100+）拖拽卡顿 | 低 | 中 | 200ms debounce + requestAnimationFrame |
| 虚线框跨面板边界问题 | 低 | 低 | CSS clip-path 裁剪 |

---

*分析产出物: `/root/.openclaw/vibex/docs/vibex-canvas-expandable-20260327/analysis.md`*
*设计文档来源: `/root/.openclaw/vibex/docs/gstack/vibex-canvas-expandable-20260327.md`*
