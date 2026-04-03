# 需求分析: 首页三步流程重构

**项目**: vibex-homepage-flow-redesign
**日期**: 2026-03-18
**分析师**: Analyst Agent

---

## 1. 执行摘要

### 项目目标

首页三步流程重构：去掉领域模型，直接业务流程分析 → UI组件分析 → 创建项目

### 新流程设计

| 步骤 | 功能 | 描述 |
|------|------|------|
| Step 1 | 业务流程分析 | 用户选择/输入上下文 → 生成业务流程图 |
| Step 2 | UI组件分析 | 用户勾选流程 → 生成UI组件节点图 |
| Step 3 | 创建项目 | 选择UI组件 → 生成项目 |

---

## 2. 现状分析

### 2.1 当前五步流程

```
Step 1: 需求输入
    ↓
Step 2: 限界上下文 (bounded context)
    ↓
Step 3: 领域模型 (domain model) ← 去掉
    ↓
Step 4: 业务流程 (business flow)
    ↓
Step 5: 项目创建
```

### 2.2 需要删除/合并的步骤

- **删除 Step 3: 领域模型** - 用户反馈用不上模型细节
- **合并 Step 2 + Step 4** → 新的 Step 1 (业务流程分析)

### 2.3 需要新增的功能

| 功能 | 说明 |
|------|------|
| UI组件节点图生成 | 根据业务流程生成UI组件树状图 |
| UI组件选择 | 用户勾选需要的UI组件 |
| 项目生成 | 根据选择生成完整项目 |

---

## 3. 功能需求分析

### 3.1 Step 1: 业务流程分析

**用户流程**:
1. 用户输入/选择限界上下文
2. 点击"业务流程分析"按钮
3. AI 生成业务流程图 (mermaid)
4. 用户可自定义添加流程

**API 需求**:
```typescript
// 新增或修改 API
POST /ddd/business-flow
Body: {
  contexts: BoundedContext[],  // 用户选择的上下文
  requirementText?: string,    // 自定义输入
}
Response: {
  businessFlow: BusinessFlow,
  mermaidCode: string
}
```

**前端修改**:
- 保留 `generateContexts` 调用
- 修改按钮文字: "业务流程分析"
- 展示业务流程 mermaid 图

### 3.2 Step 2: UI组件分析

**用户流程**:
1. 用户勾选业务流程节点
2. 录入框显示勾选的流程内容
3. 用户可增加/编辑流程
4. 点击"UI组件分析"按钮
5. AI 生成UI组件节点图

**API 需求**:
```typescript
// 新增 API
POST /ddd/ui-components
Body: {
  businessFlow: BusinessFlow,
  contexts: BoundedContext[],
  requirementText?: string,
}
Response: {
  uiComponents: UIComponent[],
  mermaidCode: string,  // 树状菜单图
}
```

**前端修改**:
- 新增 `useUICollection` hook
- 新增 UI组件选择器组件
- 修改按钮文字: "UI组件分析"

### 3.3 Step 3: 创建项目

**用户流程**:
1. 用户勾选UI组件
2. 点击"创建项目"按钮
3. 系统生成项目

**API 需求**:
```typescript
// 复用现有 API，可能需要扩展
POST /projects
Body: {
  uiComponents: UIComponent[],   // 用户选择的UI组件
  businessFlow: BusinessFlow,   // 业务流程
  boundedContexts: BoundedContext[],
  requirementText: string,
}
```

---

## 4. 技术方案

### 4.1 现有组件修改

| 文件 | 修改内容 |
|------|----------|
| `HomePage.tsx` | 调整 STEPS 常量，修改按钮回调 |
| `useHomePage.ts` | 新增 UI 组件状态，修改流程 |
| `InputArea.tsx` | 修改按钮文字和回调 |
| `PreviewArea.tsx` | 支持 UI 组件 mermaid 渲染 |

### 4.2 新增组件

| 组件 | 说明 |
|------|------|
| `UICollectionSelector` | UI组件选择器 |
| `UICollectionPreview` | UI组件树状图预览 |

### 4.3 现有 API 扩展

| API | 变更 |
|-----|------|
| `/ddd/business-flow` | 保持不变，参数调整 |
| `/ddd/ui-components` | **新增** |
| `/projects` | 可能需要扩展参数 |

### 4.4 数据模型

```typescript
interface UIComponent {
  id: string;
  name: string;
  type: 'page' | 'component' | 'module';
  description: string;
  children?: UIComponent[];
  parentId?: string;
}
```

---

## 5. 验收标准

### Step 1: 业务流程分析

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC1.1 | 输入上下文后，点击"业务流程分析"生成流程图 | 功能测试 |
| AC1.2 | 流程图使用 mermaid 渲染 | 视觉检查 |
| AC1.3 | 用户可自定义添加流程 | 交互测试 |
| AC1.4 | 完成流程后自动跳转 Step 2 | 功能测试 |

### Step 2: UI组件分析

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC2.1 | 用户可勾选业务流程节点 | 交互测试 |
| AC2.2 | 勾选后录入框显示选中流程 | 视觉检查 |
| AC2.3 | 点击"UI组件分析"生成组件树 | 功能测试 |
| AC2.4 | UI组件以树状图展示 | 视觉检查 |

### Step 3: 创建项目

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC3.1 | 用户可勾选UI组件 | 交互测试 |
| AC3.2 | 点击"创建项目"生成项目 | 功能测试 |
| AC3.3 | 项目包含用户选择的UI组件 | 数据库检查 |

---

## 6. 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 新API开发周期长 | 中 | 复用现有 business-flow API |
| UI组件生成质量不稳定 | 中 | 添加人工确认环节 |
| 首页结构大改 | 高 | 分阶段实施，先保留旧代码 |
| 现有功能破坏 | 高 | 保持向后兼容 |

---

## 7. 实施计划

### Phase 1: 流程调整 (1天)
- 修改 STEPS 常量
- 调整按钮回调逻辑
- 修改按钮文字

### Phase 2: 业务流程 (1天)
- 优化 business-flow API 调用
- 前端流程图展示

### Phase 3: UI组件 (2天)
- 新增 `/ddd/ui-components` API
- 新增 UI组件选择器组件
- UI组件树状图预览

### Phase 4: 项目创建 (1天)
- 修改 `/projects` API 参数
- 集成测试

**预估总工时: 5天**

---

## 8. 约束检查

| 约束 | 状态 |
|------|------|
| 首页结构不要大变动 | ✅ 通过 - 保持现有组件结构 |
| 需要后端API支持 | ✅ 已规划 - 新增/修改 API |

---

## 附录

### A. 相关文件

**前端**:
- `src/components/homepage/HomePage.tsx`
- `src/components/homepage/hooks/useHomePage.ts`
- `src/components/homepage/InputArea/InputArea.tsx`
- `src/components/homepage/PreviewArea/PreviewArea.tsx`

**后端** (需要确认路径):
- DDD API: `/ddd/business-flow` (已有)
- DDD API: `/ddd/ui-components` (需新增)
- Project API: `/projects` (需扩展)

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-homepage-flow-redesign/analysis.md`