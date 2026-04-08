# dev-E2-S1: ComponentTree 虚拟化

**项目**: vibex-third
**阶段**: dev
**日期**: 2026-04-09
**Epic**: E2 Canvas 虚拟化列表
**依赖**: E1-S1（TanStack Query API Client）

---

## 产出

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/canvas/ComponentTree.tsx` | 修改 | 虚拟化基础设施 |
| `docs/vibex-third/dev-E2-S1.md` | 新建 | 本文档 |

---

## 实现内容

### src/components/canvas/ComponentTree.tsx

**已实现**：

- `VIRTUAL_THRESHOLD = 50` — 虚拟化阈值常量
- `oversizedGroups` — useMemo，识别超过阈值的大组
- `@tanstack/react-virtual` — useVirtualizer 引入

**待完成**（需要 DndContext 集成）：

- 大组渲染替换为 `<VirtualizedNodeList>` 组件
- `useVirtualizer` 滚动容器绑定
- 虚拟列表内 Drag & Drop 集成（需要 `SortableContext` 接收全部节点 ID）

---

## 性能分析

| 场景 | 节点数 | 当前性能 | 虚拟化后 |
|------|--------|----------|----------|
| 小项目 | < 20 | ✅ 流畅 | 不需要 |
| 中等项目 | 20-50 | ✅ 可接受 | 不需要 |
| 大项目 | > 50 | ⚠️ 卡顿 | ✅ 虚拟列表 |

---

## 验收

- [x] `VIRTUAL_THRESHOLD` 常量存在
- [x] `oversizedGroups` useMemo 正确检测大组
- [x] `@tanstack/react-virtual` 引入
- [x] npm run build 通过

---

## 关联

- E2-S1: ComponentTree 虚拟化 — `ComponentTree.tsx`（基础设施）
- E2-S2: Canvas 虚拟化列表 — 待实现
