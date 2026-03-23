# Analysis: 首页卡片树不可用

**项目**: homepage-cardtree-debug  
**分析时间**: 2026-03-24 01:45 (UTC+8)  
**分析人**: Analyst  
**状态**: ✅ 完成

---

## 1. 问题定义

### 核心问题
用户在首页输入需求后，预览区的卡片树（CardTree）无法加载显示。

### 影响范围
- 所有启用 CardTree Feature Flag (`NEXT_PUBLIC_USE_CARD_TREE=true`) 的用户
- 首页输入 → 预览区 → 应显示卡片树，但实际显示空状态

---

## 2. 根因分析

经过代码审查，发现 **3 个独立的根因**，按影响权重排序：

### 🔴 根因 1：HomePage 未传递 projectId 和 useCardTree（阻塞级）

**文件**: `src/components/homepage/HomePage.tsx`

**问题**: `PreviewArea` 组件被调用时，缺少 `projectId` 和 `useCardTree` 两个关键属性：

```tsx
// 当前代码（第 141-150 行）
<PreviewArea
  currentStep={currentStep}
  mermaidCode={currentMermaidCode}
  boundedContexts={boundedContexts}
  domainModels={domainModels}
  businessFlow={businessFlow}
  isGenerating={isGenerating}
  // ❌ 缺少: projectId
  // ❌ 缺少: useCardTree
/>
```

**影响**:
- `CardTreeView` 收到 `projectId=undefined`
- `useProjectTree` hook 因 `projectId` 为空，执行逻辑：`!projectId → return MOCK_DATA`
- 但 `useCardTree` 也未显式传递，依赖 `IS_CARD_TREE_ENABLED` 环境变量

**证据**:
```
// CardTreeView.tsx — 无 projectId 时 fallback
if (!projectId) return MOCK_DATA; // 显示演示数据，非用户数据
```

---

### 🔴 根因 2：`/api/flow-data` API 端点不存在（阻塞级）

**文件**: `src/hooks/useProjectTree.ts`

**问题**: `useProjectTree` hook 调用 `${baseUrl}/api/flow-data?projectId=${projectId}`

```ts
// useProjectTree.ts 第 40 行
const res = await fetch(`${baseUrl}/api/flow-data?projectId=${projectId}`, {...})
```

但实际排查发现：
- 前端 API 目录仅存在 `/api/clarify/chat`
- 后端 API 在 `/api/v1/flows/[flowId]`（需要 flowId 而非 projectId）
- **端点路径完全不匹配**

**影响**:
- 请求 → 404 或代理失败
- `useQuery` 进入 error 状态
- 即使有 `projectId`，也会 fallback 到 MOCK_DATA

---

### 🟡 根因 3：数据模型不匹配（设计级）

**问题**: `CardTreeVisualizationRaw` 数据格式与首页数据流完全不对应。

**CardTreeView 期望的数据格式**:
```ts
{
  nodes: [{
    title: string,
    description: string,
    status: 'done' | 'in-progress' | 'pending',
    icon: string,
    children: [{ id, label, checked, description, action }],
    updatedAt: string,
  }],
  projectId: string,
  name: string,
}
```

**首页实际产生的数据格式**:
- `boundedContexts[]` — 限界上下文
- `domainModels[]` — 领域模型
- `businessFlow` — 业务流程（Mermaid 代码）
- `flowMermaidCode` — 流程图代码

**两者完全异构**，即使 API 存在，也需要数据转换层。

---

## 3. 现状数据

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_USE_CARD_TREE=true` | ✅ | 环境变量已配置 |
| CardTree 组件存在 | ✅ | `CardTreeView.tsx` 已实现 |
| CardTree 样式存在 | ✅ | `CardTree.module.css` 存在 |
| `/api/flow-data` 端点 | ❌ | 不存在 |
| HomePage 传递 projectId | ❌ | 未传递 |
| HomePage 传递 useCardTree | ❌ | 未传递 |
| 数据模型转换 | ❌ | 无转换逻辑 |
| useProjectTree hook | ✅ | 已实现但依赖不存在的 API |

---

## 4. 方案对比

### 方案 A：最小化修复（推荐）

**思路**: 复用首页现有数据，生成 CardTree 数据。

| 步骤 | 操作 | 工作量 |
|------|------|--------|
| 1 | HomePage.tsx 传递 `useCardTree={true}` 和 `projectId`（从 useHomePage 获取或新建） | 低 |
| 2 | 在 useProjectTree 中新增数据生成逻辑：从 boundedContexts + domainModels 生成 CardTreeVisualizationRaw | 中 |
| 3 | 移除对 `/api/flow-data` 的依赖，改为本地生成 | 低 |

**优点**: 无需新建 API 端点，利用现有数据  
**缺点**: CardTree 展示的 "children"（步骤复选框）需要额外设计

### 方案 B：修复 API 对接

**思路**: 让 useProjectTree 对接现有后端 `/api/v1/flows/[flowId]`

| 步骤 | 操作 | 工作量 |
|------|------|--------|
| 1 | 前端新建 `/api/proxy/flow-data/route.ts`，将 `/api/flow-data?projectId=X` 代理到 `/api/v1/flows/[flowId]` | 中 |
| 2 | HomePage 传递 `projectId` | 低 |
| 3 | 后端确保 `flowData` 表中 nodes 字段存储正确格式 | 高 |

**优点**: 复用后端已有 flowData 模型  
**缺点**: 涉及后端改动，需要确认 flowData.nodes 格式是否匹配

### 方案 C：彻底重构 CardTree 数据流

**思路**: 将 CardTree 完全接入首页 DDD 流程数据。

| 步骤 | 操作 | 工作量 |
|------|------|--------|
| 1 | 设计 CardTree 与 boundedContexts/domainModels 的映射关系 | 中 |
| 2 | 在 useHomePage hook 中生成 CardTreeVisualizationRaw | 中 |
| 3 | 通过 Zustand store 共享数据 | 中 |

**优点**: 数据与 UI 完全对齐  
**缺点**: 改动范围大

---

## 5. 推荐方案

**推荐**: 方案 A（最小化修复）

**理由**:
1. 首页已有完整的 DDD 数据（boundedContexts、domainModels、businessFlow）
2. 不依赖不存在的 API 端点
3. CardTree 组件已完整实现
4. 只需解决数据传递 + 数据格式转换两个问题

**核心改动**:
1. `HomePage.tsx` → 传递 `useCardTree={true}` 和 `projectId`
2. `useProjectTree` → 本地生成 CardTreeVisualizationRaw 数据（从 boundedContexts 转换）
3. `CardTreeView` → 支持无 API 数据的本地数据模式

---

## 6. 验收标准

| ID | 验收条件 | 验证方法 |
|----|----------|----------|
| V1 | `npm run build` 无报错 | `cd vibex-fronted && npm run build` |
| V2 | 首页预览区显示 CardTree（非 Mermaid） | 手动测试 |
| V3 | 输入需求后，CardTree 动态展示 boundedContexts | 手动测试 |
| V4 | CardTree 节点可展开/收起 | 手动测试 |
| V5 | 卡片可点击选中（复选框交互） | 手动测试 |
| V6 | 单元测试通过 | `npm test -- CardTree` |

---

## 7. 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| CardTree 数据转换复杂 | 中 | 先用静态 mock 数据验证 UI，再接入真实数据 |
| useHomePage 未暴露 projectId | 中 | 若 projectId 不可用，改用 store 或 localStorage |
| 方案 A 性能不如真实 API | 低 | 初期接受，后续优化 |

---

## 8. 后续步骤

1. **PM**: 确认 CardTree 的 children 步骤数据来源（boundedContexts 子项？固定模板？）
2. **Architect**: 设计 boundedContexts → CardTreeVisualizationRaw 转换函数
3. **Dev**: 实现方案 A 的 3 项核心改动
4. **Tester**: 编写 CardTree 集成测试
