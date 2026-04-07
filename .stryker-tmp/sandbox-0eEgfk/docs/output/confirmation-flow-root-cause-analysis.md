# 确认流程缺失问题根因分析报告

**项目**: vibex-confirmation-flow-fix  
**版本**: 1.0  
**日期**: 2026-03-03  
**分析者**: Analyst Agent

---

## 执行摘要

确认流程存在三个核心问题：**跳过 API 调用**、**缺少确认按钮**、**没有步骤指示器**。根因是**前端实现与设计文档严重脱节**，存在两套并行的路由系统，正确的确认流程代码未被使用。

---

## 1. 问题现象

| 问题 | 描述 | 影响 |
|------|------|------|
| 跳过 API 调用 | 点击"开始生成原型"后直接跳转，未调用后端 API | 用户需求未保存，无法生成限界上下文图 |
| 缺少确认按钮 | /domain 页面是独立编辑器，无"确认进入下一步"功能 | 用户无法进入三步确认流程 |
| 没有步骤指示器 | 页面间独立跳转，无统一的进度指示 | 用户不清楚当前处于哪个步骤 |

---

## 2. 代码流程分析

### 2.1 当前实现路径

```
用户输入需求 (/requirements/new)
    │
    │  点击"开始生成原型"
    │  代码: router.push('/domain')  ← 问题点 #1
    │
    ▼
领域模型编辑器 (/domain)
    │
    │  无确认按钮
    │  无步骤指示器
    │
    ▼
用户迷失 ❌
```

**问题代码位置**: `/vibex-fronted/src/app/requirements/new/page.tsx:120`

```typescript
// 当前实现
router.push('/domain')  // 直接跳转，未调用 API

// 应该调用
const response = await generateBoundedContext(requirementText)
router.push('/confirm/context')
```

### 2.2 设计文档期望路径

```
用户输入需求 (/confirm)
    │
    │  调用 POST /api/ddd/bounded-context
    │  生成限界上下文图
    │
    ▼
Step 1: 限界上下文确认 (/confirm/context)
    │  [显示步骤指示器: 1/3]
    │  [显示 Mermaid 图表]
    │  [显示"确认继续"按钮]
    │
    ▼
Step 2: 领域模型确认 (/confirm/model)
    │  [显示步骤指示器: 2/3]
    │
    ▼
Step 3: 业务流程确认 (/confirm/flow)
    │  [显示步骤指示器: 3/3]
    │
    ▼
创建成功 (/confirm/success)
```

---

## 3. 根因分析

### 3.1 根因一：路由系统混乱

**问题**: 存在两套并行的路由系统

| 路由系统 | 用途 | 状态 |
|----------|------|------|
| `/requirements/new` → `/domain` | 旧的需求输入流程 | ❌ 被使用但设计错误 |
| `/confirm` → `/confirm/context` → `/confirm/model` → `/confirm/flow` | 新的三步确认流程 | ✅ 已实现但未被使用 |

**证据**:
- `/confirm/page.tsx` 已实现完整的需求输入和 API 调用
- `/confirm/context/page.tsx` 已实现步骤指示器和确认按钮
- 但 `/requirements/new` 完全没有调用这些页面

**影响**: 正确的确认流程代码被闲置，用户实际走的是错误的路径

### 3.2 根因二：需求输入页面未集成 API

**问题**: `/requirements/new/page.tsx` 假设"后端 API 尚未实现"

**代码证据** (第 96-99 行):
```typescript
// 调用 API 创建需求
// 注意：后端 API 尚未实现，这里模拟创建
const newRequirement: Requirement = { ... }
console.log('Created requirement:', newRequirement)

// 跳转到领域模型页
router.push('/domain')  // 直接跳转
```

**实际状态**: 后端 API 已实现！
- `POST /api/ddd/bounded-context` 已在 `vibex-backend/src/routes/ddd.ts` 实现
- 前端 `generateBoundedContext` 函数已在 `services/api.ts` 定义
- 但未被调用

**影响**: 用户需求未保存，限界上下文图未生成

### 3.3 根因三：页面职责不清晰

**问题**: `/domain` 页面职责模糊

**设计文档定义** (PRD 第 3.1 节):
> `/domain` 应作为确认流程的 Step 1，显示 AI 生成的限界上下文图，提供确认按钮

**实际实现**:
- `/domain` 是独立的领域模型编辑器
- 从 URL 参数获取 `projectId`，但需求输入页面没有传递
- 没有步骤指示器
- 没有"确认进入下一步"按钮
- 使用 React Flow 渲染实体关系图，而非 Mermaid 限界上下文图

**影响**: 用户看到的是错误的界面，无法完成确认流程

### 3.4 根因四：状态管理未连接

**问题**: Zustand Store 已定义，但未被使用

**证据**:
- `confirmationStore.ts` 已定义完整的状态管理：
  - `currentStep`, `requirementText`, `boundedContexts`, `domainModels`
  - `goToNextStep()`, `goToPreviousStep()`
- 但 `/requirements/new` 没有使用这个 Store
- `/domain` 也没有使用这个 Store

**影响**: 步骤间数据无法传递，无法实现回退功能

---

## 4. 对比分析

### 4.1 设计 vs 实现

| 功能点 | PRD 要求 | 实际实现 | 差距 |
|--------|----------|----------|------|
| 入口页面 | `/confirm` | `/requirements/new` | 路由不匹配 |
| API 调用 | 调用 `generateBoundedContext` | 未调用 | 完全缺失 |
| 步骤指示器 | 显示 "Step 1/3" | 无 | 完全缺失 |
| 确认按钮 | "确认，继续" | 无 | 完全缺失 |
| 状态管理 | Zustand Store | 未使用 | 完全缺失 |
| 图表渲染 | Mermaid | React Flow | 技术栈不同 |

### 4.2 文档引用

| 文档 | 关键要求 | 落实状态 |
|------|----------|----------|
| `prd/vibex-interactive-confirmation-prd.md` | 三步确认流程 | ❌ 未落实 |
| `architecture/vibex-interactive-confirmation-arch.md` | 状态管理架构 | ❌ 未落实 |
| `prd/user-flow-optimization-v1.0-deprecated.md` | 已废弃 | - |

---

## 5. 问题影响范围

### 5.1 功能影响

| 受影响功能 | 严重程度 | 用户影响 |
|------------|----------|----------|
| 需求输入 | 高 | 需求未保存，刷新后丢失 |
| 限界上下文生成 | 高 | AI 分析未触发，无图表 |
| 确认流程 | 高 | 无法完成三步确认 |
| 步骤导航 | 中 | 用户迷失，不知道进度 |
| 回退修改 | 中 | 无法返回上一步 |

### 5.2 数据影响

- 用户输入的需求文本未持久化
- 无限界上下文图数据
- 无领域模型数据
- 无业务流程数据
- 无法创建项目

---

## 6. 修复方案建议

### 6.1 方案 A：修复入口页面（推荐）

**修改 `/requirements/new/page.tsx`**:
1. 添加 `useConfirmationStore` 导入
2. 修改 `handleSubmit` 调用 `generateBoundedContext` API
3. 跳转到 `/confirm/context` 而非 `/domain`
4. 添加加载状态

**优点**: 改动最小，复用现有确认流程代码

### 6.2 方案 B：统一路由系统

**废弃 `/requirements/new`**，将需求输入合并到 `/confirm`:
1. 重定向 `/requirements/new` → `/confirm`
2. 删除冗余代码
3. 更新导航链接

**优点**: 架构清晰，避免混乱

### 6.3 方案 C：重构 `/domain` 页面

将 `/domain` 改造为确认流程的 Step 2:
1. 添加步骤指示器组件
2. 添加确认按钮
3. 集成 Zustand Store
4. 修改渲染方式为 Mermaid

**优点**: 符合 PRD 设计
**缺点**: 工作量大，与现有功能冲突

---

## 7. 结论

**根本原因**: 前端开发与设计文档脱节，正确的确认流程代码已实现但未被集成到用户操作路径中。

**核心问题**:
1. `/requirements/new` 未调用 API，直接跳转
2. 跳转目标错误 (`/domain` vs `/confirm/context`)
3. 确认流程代码闲置 (`/confirm/*`)
4. 状态管理未连接

**修复优先级**:
1. P0: 修改 `/requirements/new` 调用 API 并跳转到 `/confirm/context`
2. P0: 确认 `/confirm/context` 页面正常工作
3. P1: 统一路由系统，删除冗余页面

---

## 8. 附录

### 8.1 相关文件清单

| 文件 | 作用 | 问题 |
|------|------|------|
| `/app/requirements/new/page.tsx` | 需求输入入口 | 未调用 API，跳转错误 |
| `/app/domain/page.tsx` | 领域模型编辑器 | 非确认流程页面 |
| `/app/confirm/page.tsx` | 确认流程入口 | 正确但未被使用 |
| `/app/confirm/context/page.tsx` | Step 1 限界上下文 | 正确但未被使用 |
| `/stores/confirmationStore.ts` | 状态管理 | 正确但未被使用 |
| `/services/api.ts` | API 服务 | `generateBoundedContext` 未被调用 |

### 8.2 API 状态

| API | 后端状态 | 前端调用 |
|-----|----------|----------|
| POST /api/ddd/bounded-context | ✅ 已实现 | ❌ 未调用 |
| POST /api/ddd/domain-model | ✅ 已实现 | ❌ 未调用 |
| POST /api/ddd/business-flow | ✅ 已实现 | ❌ 未调用 |

---

*报告完成时间: 2026-03-03 12:15 (GMT+8)*  
*Analyst Agent*