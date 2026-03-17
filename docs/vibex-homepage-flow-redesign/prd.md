# PRD: 首页三步流程重构

> **项目**: vibex-homepage-flow-redesign  
> **版本**: 1.0  
> **状态**: Draft  
> **创建日期**: 2026-03-18  
> **PM**: PM Agent

---

## 1. 概述

### 1.1 背景

当前首页采用五步流程，其中"领域模型"步骤用户反馈用不上。根据产品反馈，需要简化流程，直接从业务流程分析到 UI 组件分析再到创建项目。

### 1.2 目标

| 目标 | 描述 |
|------|------|
| 简化流程 | 从5步减少到3步 |
| 提升体验 | 去掉不常用的领域模型步骤 |
| 新增能力 | 增加 UI 组件选择和生成功能 |

### 1.3 新流程设计

| 步骤 | 功能 | 描述 |
|------|------|------|
| Step 1 | 业务流程分析 | 用户选择/输入上下文 → 生成业务流程图 |
| Step 2 | UI组件分析 | 用户勾选流程 → 生成UI组件节点图 |
| Step 3 | 创建项目 | 选择UI组件 → 生成项目 |

---

## 2. 功能需求

### 2.1 Step 1: 业务流程分析 (F1)

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 上下文选择 | 用户选择或输入限界上下文 | expect(screen.getByRole('checkbox', { name: /上下文选项/ })).toBeVisible() | 【需页面集成】src/components/homepage/ |
| F1.2 | 业务流程分析按钮 | 点击触发生成业务流程图 | expect(screen.getByRole('button', { name: /业务流程分析/ })).toBeVisible() | 【需页面集成】src/components/homepage/InputArea.tsx |
| F1.3 | 业务流程图展示 | 使用 mermaid 渲染业务流程图 | expect(screen.getByText(/^graph TD/)).toBeVisible() | 【需页面集成】src/components/homepage/PreviewArea.tsx |
| F1.4 | 流程自定义 | 用户可自定义添加/编辑流程节点 | expect(screen.getByRole('button', { name: /添加节点/ })).toBeVisible() | 【需页面集成】src/components/homepage/ |
| F1.5 | 自动跳转 | 流程完成后自动跳转到 Step 2 | expect(screen.getByText(/Step 2/)).toHaveClass('active') | 【需页面集成】src/components/homepage/HomePage.tsx |

**DoD**:
- `expect(screen.getByRole('button', { name: /业务流程分析/ })).toBeVisible()`
- `expect(screen.getByText(/graph TD/)).toBeVisible()`

### 2.2 Step 2: UI组件分析 (F2)

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 流程节点勾选 | 用户可勾选业务流程中的节点 | expect(screen.getAllByRole('checkbox', { name: /流程节点/ })).toHaveLength(n) | 【需页面集成】src/components/homepage/ |
| F2.2 | 选中流程展示 | 勾选后在录入框显示选中流程 | expect(screen.getByDisplayValue(/已选流程/)).toBeVisible() | 【需页面集成】src/components/homepage/InputArea.tsx |
| F2.3 | UI组件分析按钮 | 点击触发生成UI组件树状图 | expect(screen.getByRole('button', { name: /UI组件分析/ })).toBeVisible() | 【需页面集成】src/components/homepage/InputArea.tsx |
| F2.4 | UI组件树状图 | 使用 mermaid 展示组件层级 | expect(screen.getByText(/^graph TB/)).toBeVisible() | 【需页面集成】src/components/homepage/PreviewArea.tsx |
| F2.5 | 组件选择器 | 用户可勾选需要的UI组件 | expect(screen.getAllByRole('checkbox', { name: /UI组件/ })).toHaveLength(n) | 【需页面集成】src/components/homepage/UICollectionSelector.tsx |

**DoD**:
- `expect(screen.getByRole('button', { name: /UI组件分析/ })).toBeVisible()`
- `expect(screen.getByText(/graph TB/)).toBeVisible()`

### 2.3 Step 3: 创建项目 (F3)

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | UI组件勾选 | 用户勾选需要生成的UI组件 | expect(screen.getAllByRole('checkbox', { name: /组件/ })).toHaveLength(n) | 【需页面集成】src/components/homepage/UICollectionSelector.tsx |
| F3.2 | 创建项目按钮 | 点击创建项目 | expect(screen.getByRole('button', { name: /创建项目/ })).toBeVisible() | 【需页面集成】src/components/homepage/InputArea.tsx |
| F3.3 | 项目生成反馈 | 显示项目生成进度/结果 | expect(screen.getByText(/项目创建中/)).toBeVisible() | 【需页面集成】src/components/homepage/ |
| F3.4 | 项目创建完成 | 创建成功后跳转到项目详情 | expect(screen.getByText(/项目创建成功/)).toBeVisible() | 【需页面集成】src/components/homepage/ |

**DoD**:
- `expect(screen.getByRole('button', { name: /创建项目/ })).toBeVisible()`
- `expect(screen.getByText(/项目创建成功/)).toBeVisible()`

### 2.4 流程调整 (F4)

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | STEPS 常量调整 | 修改步骤常量为3步 | expect(STEPS).toHaveLength(3) | 【需页面集成】src/components/homepage/HomePage.tsx |
| F4.2 | 步骤跳转逻辑 | 新流程步骤切换逻辑 | expect(currentStep).toBe(1) | 【需页面集成】src/components/homepage/hooks/useHomePage.ts |
| F4.3 | 按钮文字更新 | 更新各步骤按钮显示文字 | expect(screen.getByRole('button', { name: /业务流程分析/ })).toBeVisible() | 【需页面集成】src/components/homepage/InputArea.tsx |

**DoD**:
- `expect(STEPS).toHaveLength(3)`

---

## 3. Epic 拆分

### Epic 1: Step 1 业务流程分析

| Story | 描述 | 预估 | 验收标准 |
|-------|------|------|----------|
| E1-S1 | 上下文选择组件 | 0.5d | expect(screen.getByRole('checkbox')).toBeVisible() |
| E1-S2 | 业务流程分析按钮 | 0.25d | expect(screen.getByRole('button', { name: /业务流程分析/ })).toBeVisible() |
| E1-S3 | 业务流程图 mermaid 渲染 | 0.5d | expect(screen.getByText(/graph TD/)).toBeVisible() |
| E1-S4 | 流程自定义添加节点 | 0.25d | expect(screen.getByRole('button', { name: /添加节点/ })).toBeVisible() |
| E1-S5 | 自动跳转到 Step 2 | 0.25d | expect(screen.getByText(/Step 2/)).toHaveClass('active') |

### Epic 2: Step 2 UI组件分析

| Story | 描述 | 预估 | 验收标准 |
|-------|------|------|----------|
| E2-S1 | 流程节点勾选器 | 0.5d | expect(screen.getAllByRole('checkbox')).toHaveLength(n) |
| E2-S2 | UI组件分析按钮 | 0.25d | expect(screen.getByRole('button', { name: /UI组件分析/ })).toBeVisible() |
| E2-S3 | UI组件树状图渲染 | 0.5d | expect(screen.getByText(/graph TB/)).toBeVisible() |
| E2-S4 | UI组件选择器组件 | 0.5d | expect(screen.getByRole('checkbox', { name: /组件/ })).toBeVisible() |

### Epic 3: Step 3 创建项目

| Story | 描述 | 预估 | 验收标准 |
|-------|------|------|----------|
| E3-S1 | UI组件最终勾选 | 0.25d | expect(screen.getAllByRole('checkbox', { name: /组件/ })).toHaveLength(n) |
| E3-S2 | 创建项目按钮 | 0.25d | expect(screen.getByRole('button', { name: /创建项目/ })).toBeVisible() |
| E3-S3 | 项目生成反馈 | 0.5d | expect(screen.getByText(/项目创建/)).toBeVisible() |
| E3-S4 | 项目创建完成跳转 | 0.25d | expect(window.location.pathname).toBe('/project/') |

### Epic 4: 共用与调整

| Story | 描述 | 预估 | 验收标准 |
|-------|------|------|----------|
| E4-S1 | STEPS 常量调整为3步 | 0.25d | expect(STEPS).toHaveLength(3) |
| E4-S2 | 步骤状态管理调整 | 0.5d | expect(useHomePage().currentStep).toBe(1) |
| E4-S3 | 按钮文字统一更新 | 0.25d | 所有按钮文字与设计一致 |
| E4-S4 | 向后兼容处理 | 0.5d | 旧流程 URL 仍可访问 |

---

## 4. UI 设计

### 4.1 桌面端布局

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]                                        [登录] [注册]    │
├─────────────────────────────────────────────────────────────────┤
│  Step 1: 业务流程分析  →  Step 2: UI组件分析  →  Step 3: 创建项目│
│  ●○○                                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  业务流程分析                                                  │   │
│  │                                                              │   │
│  │  [✓] 上下文1    [✓] 上下文2    [ ] 上下文3                    │   │
│  │                                                              │   │
│  │  [🚀 业务流程分析]                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  预览区域                                                      │   │
│  │                                                              │   │
│  │  graph TD                                                    │   │
│  │    A[开始] --> B[流程1]                                       │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 移动端布局

```
┌─────────────────┐
│  [Logo]  [登录] │
├─────────────────┤
│  Step 1 → 2 → 3 │
│  ●○○            │
├─────────────────┤
│                 │
│  业务流程分析     │
│  [✓] 上下文1    │
│  [✓] 上下文2    │
│                 │
│  [业务流程分析]  │
│                 │
│  预览区域        │
│  (mermaid图)    │
└─────────────────┘
```

---

## 5. API 设计

### 5.1 新增 API

#### POST /ddd/ui-components

**请求**:
```typescript
{
  businessFlow: BusinessFlow,
  contexts: BoundedContext[],
  requirementText?: string,
}
```

**响应**:
```typescript
{
  uiComponents: UIComponent[],
  mermaidCode: string
}
```

### 5.2 修改 API

#### POST /ddd/business-flow
- 保持接口不变，参数调整
- 返回业务流程 mermaid 图

#### POST /projects
- 扩展参数：增加 `uiComponents` 字段

---

## 6. 数据模型

```typescript
interface BoundedContext {
  id: string;
  name: string;
  description?: string;
}

interface BusinessFlow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'process' | 'decision' | 'end';
}

interface FlowEdge {
  source: string;
  target: string;
}

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

## 7. 验收标准

### P0 (必须)

- [x] F1.1 上下文选择功能
- [x] F1.2 业务流程分析按钮
- [x] F1.3 业务流程图 mermaid 渲染
- [x] F2.3 UI组件分析按钮
- [x] F2.4 UI组件树状图渲染
- [x] F3.2 创建项目按钮
- [x] F3.4 项目创建完成跳转
- [x] F4.1 STEPS 常量调整为3步

### P1 (增强)

- [x] F1.4 流程自定义添加节点
- [x] F2.1 流程节点勾选
- [x] F2.5 组件选择器
- [x] F4.3 按钮文字统一更新
- [x] F4.4 向后兼容处理

---

## 8. 实施计划

| 阶段 | Epic | 预估 |
|------|------|------|
| Phase 1 | Epic 4: 共用与调整 | 1.5d |
| Phase 2 | Epic 1: Step 1 业务流程分析 | 1.75d |
| Phase 3 | Epic 2: Step 2 UI组件分析 | 1.75d |
| Phase 4 | Epic 3: Step 3 创建项目 | 1.25d |

**总工作量**: 6.25d ≈ 30h (约 1 周)

---

## 9. 风险与约束

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 首页结构大改 | 高 | 分阶段实施，先保留旧代码 |
| 现有功能破坏 | 高 | 保持向后兼容 |
| 新API开发周期长 | 中 | 复用现有 business-flow API |
| UI组件生成质量不稳定 | 中 | 添加人工确认环节 |

---

## 10. 依赖

| 依赖项 | 说明 |
|--------|------|
| analyze-requirements | 已完成，提供需求分析文档 |
| 后端 API 开发 | 需要配合 /ddd/ui-components 新增 |
| UI 组件库 | 需要确认现有组件是否满足需求 |

---

## 11. 验证

```bash
test -f /root/.openclaw/vibex/docs/vibex-homepage-flow-redesign/prd.md
```

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-homepage-flow-redesign/prd.md`
