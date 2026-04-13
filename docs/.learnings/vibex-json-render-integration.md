# VibeX JsonRender Preview 集成修复 — 经验沉淀

> **项目**: vibex-json-render-integration
> **完成日期**: 2026-04-14
> **问题类型**: ui_bug
> **状态**: ✅ 完成
> **Epic 数**: 4（Phase1 P0 阻断 / Phase2 P1 增强 / Epic1 Stories / Epic2 Stories）

---

## 问题回顾

### 原始问题

Canvas 生成的嵌套组件树在 `JsonRenderPreview` 中无法正确渲染，4 类根因缺陷导致预览组件树为空白。

### 根因矩阵

| # | 根因 | 严重度 | 修复位置 |
|---|------|--------|----------|
| R1 | `catalog.ts` 容器组件缺少 `slots` 声明 | P0 阻断 | catalog.ts |
| R2 | `nodesToSpec()` 未用 `parentId` 建立嵌套关系 | P0 阻断 | JsonRenderPreview.tsx |
| R3 | `Page` 组件 `min-h-screen` 在 Modal 中溢出 | P1 | registry.tsx |
| R4 | `ActionProvider` handlers 为空，事件无法触发 | P1 | JsonRenderPreview.tsx + registry.tsx |

---

## 解决方案

### Phase1 — P0 阻断性修复

1. **catalog.ts**：为容器组件添加 `slots` 声明
2. **JsonRenderPreview.tsx**：`nodesToSpec()` 用 `parentId` 建立嵌套关系
3. **registry.tsx**：修复 `min-h-screen` 溢出问题

### Phase2 — P1 功能增强

1. **ActionProvider handlers**：实现事件处理器，Button 点击可触发
2. **Preview Modal 适配**：容器组件在 Modal 内的尺寸修复
3. **测试覆盖**：Playwright E2E 测试

---

## 核心教训

### 教训 1：slots 声明是容器组件的必要契约

**问题模式**（❌）：
```ts
// catalog.ts — 容器组件缺少 slots
const catalog = defineCatalog({
  containers: {
    Page: { type: 'page', slots: undefined }  // ← 缺少 slots 声明
  }
});
```

**正确模式**（✅）：
```ts
// catalog.ts — 必须声明 slots
const catalog = defineCatalog({
  containers: {
    Page: { type: 'page', slots: ['header', 'content', 'footer'] }
  }
});
```

**原则**：`slots` 是 `defineCatalog` schema 的必需字段，容器组件不声明 slots = 子组件无法嵌套。

---

### 教训 2：nodesToSpec 的 parentId 映射是树状结构的关键

**问题模式**（❌）：
```ts
// nodesToSpec — 未建立 parentId 关系
const spec = nodes.map(node => ({
  id: node.id,
  type: node.type,
  // 缺少 parentId → 树结构丢失
}));
```

**正确模式**（✅）：
```ts
// nodesToSpec — 用 parentId 构建树
const spec = buildTree(nodes);  // parentId 指向父节点
```

---

### 教训 3：两阶段 P0→P1 优先级分离有效

| 阶段 | 优先级 | 目标 |
|------|--------|------|
| Phase1 P0 | 阻断性 | 让预览能渲染（slots + parentId + 尺寸） |
| Phase2 P1 | 功能增强 | 让事件能触发（ActionProvider + 测试） |

---

## 预防措施

1. **定义容器组件时必须声明 `slots` 字段**，slots 是 defineCatalog schema 的必要部分
2. **nodesToSpec 必须用 parentId 构建嵌套关系**，parentId 丢失 = 树结构丢失
3. **Modal/Drawer 内组件避免 min-h-screen**，改用 `h-full` 或 `max-h-*` 避免溢出
4. **ActionProvider handlers 必须实现**，空 handlers = 按钮点击无效

---

## 相关文档

- `docs/vibex-json-render-integration/architecture.md` — 技术设计
- `docs/vibex-json-render-integration/prd.md` — 产品需求文档
- `docs/vibex-json-render-integration/analysis.md` — 根因分析
