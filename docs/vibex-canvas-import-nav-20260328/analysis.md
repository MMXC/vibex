# Analysis: VibeX Import Example Navigation Fix

**Project**: vibex-canvas-import-nav-20260328
**Analyst**: ANALYST
**Date**: 2026-03-28
**Status**: ✅ 分析完成

---

## 1. 问题定义

### 当前状态（代码分析）

导入示例数据后，点击组件/页面节点**无响应**。根因分析：

**触发链路**：
1. 用户点击 `ComponentTree` 中的组件节点 → `handleNodeClick`
2. `handleNodeClick` 检查 `node.previewUrl` → 无
3. 检查 `node.api.path` → 有值（如 `/api/products`）
4. 构造 VSCode deep link: `vscode://file/root/.openclaw/vibex/.../src/app/api/products`
5. **文件不存在**，VSCode 打开失败或无效果

**问题位置**：
- `ComponentTree.tsx` L120-130：`handleNodeClick` 的 fallback 逻辑
- `example-canvas.json`：componentNodes 无 `previewUrl` 字段
- `/preview` 页面使用 `useConfirmationStore` 而非 `canvasStore`

### 目标状态

导入示例后，用户点击组件/页面节点：
- **有实际的导航目标**（详情页 / 原型预览页）
- **视觉上提供跳转入口**（hover 显示跳转图标）

---

## 2. 业务场景分析

| 维度 | 说明 |
|------|------|
| **场景** | 画布组件树节点点击 |
| **用户** | 产品经理 / 设计师 |
| **核心价值** | 从画布快速跳转到详情页/原型预览 |
| **当前痛点** | 点击无响应，不知道节点可点击 |
| **期望体验** | 点击节点 → 跳转到该组件的原型预览或编辑页面 |

---

## 3. 技术方案

### 方案 A：为 canvas store 增加导航注册机制（推荐）

**思路**：组件节点增加 `previewUrl` 字段，loadExampleData 填充正确的预览 URL。

```typescript
// types.ts - ComponentNode 增加
interface ComponentNode {
  // ...existing fields
  previewUrl?: string; // 新增
}

// example-canvas.json - componentNodes 增加
{
  "componentId": "comp-1",
  "name": "商品列表页",
  "previewUrl": "/preview?page=product-list", // 新增
  "api": { "path": "/api/products" }
}

// ComponentTree.tsx - handleNodeClick 改进
const handleNodeClick = useCallback(() => {
  if (node.previewUrl) {
    window.location.href = node.previewUrl;
  }
  // ...其他逻辑
}, [node]);
```

**优点**：改动范围小，URL 模式清晰
**缺点**：预览页面需要支持 query param 渲染

### 方案 B：创建组件详情页 /component/[id]

**思路**：创建 `/component/[componentId]` 页面，从 canvasStore 读取数据渲染详情。

```typescript
// app/component/[componentId]/page.tsx
// 读取 canvasStore 的 componentNodes，根据 componentId 渲染详情
```

**优点**：URL 友好，支持直接分享链接
**缺点**：需要创建新路由，数据同步复杂

### 方案对比

| 方案 | 工作量 | 可维护性 | 推荐 |
|------|--------|----------|------|
| A: previewUrl 字段 | 3h | 高 | ✅ |
| B: 详情页路由 | 8h | 中 | - |

---

## 4. JTBD 分析

| JTBD | 用户行为 | 验收条件 |
|------|----------|----------|
| JTBD-1: 从画布跳转详情 | 点击组件节点 → 打开详情页 | 页面加载且数据显示正确 |
| JTBD-2: 预览原型 | 点击节点 → 打开原型预览 | 预览页加载 |
| JTBD-3: 了解节点信息 | hover 节点显示可点击提示 | 视觉提示存在 |

---

## 5. 验收标准

| ID | 验收条件 | 测试方法 |
|----|----------|----------|
| AC-1 | 导入示例数据后，点击任意组件节点有响应 | 交互测试 |
| AC-2 | 点击节点跳转到 /preview?page={id} | URL 变化验证 |
| AC-3 | 节点 hover 时显示跳转图标/提示 | 视觉验证 |
| AC-4 | flowNodes 点击也有导航响应 | 交互测试 |
| AC-5 | 跳转后预览页能正确显示该组件内容 | E2E 测试 |
