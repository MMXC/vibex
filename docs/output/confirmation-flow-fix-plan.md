# 修复方案: 交互式确认流程

**项目**: vibex-confirmation-flow-fix  
**版本**: 1.0  
**日期**: 2026-03-03  
**负责人**: PM Agent

---

## 1. 问题概述

确认流程存在三个核心问题：

| 问题 | 描述 | 根因 |
|------|------|------|
| 跳过 API 调用 | 点击"开始生成原型"后直接跳转，未调用后端 API | `/requirements/new` 未调用 `generateBoundedContext` |
| 缺少确认按钮 | /domain 页面无"确认进入下一步"功能 | 路由指向错误页面 |
| 没有步骤指示器 | 无统一的进度指示 | 状态管理未连接 |

---

## 2. 根因分析摘要

- **路由系统混乱**: 存在两套并行路由，旧路由 (`/requirements/new` → `/domain`) 被使用但设计错误；新路由 (`/confirm/*`) 已实现但未被使用
- **API 未集成**: 后端 API 已实现，前端 `generateBoundedContext` 函数已定义，但未被调用
- **状态管理未连接**: Zustand Store 已定义，但未被使用

---

## 3. 修复方案

### 3.1 修复优先级

| 优先级 | 任务 | 描述 |
|--------|------|------|
| P0 | 修复 API 调用 | 修改 `/requirements/new` 调用 `POST /api/ddd/bounded-context` |
| P0 | 修复跳转目标 | 跳转到 `/confirm/context` 而非 `/domain` |
| P1 | 修复确认按钮 | `/confirm/domain` 页面添加确认按钮 |
| P1 | 修复步骤指示器 | 添加三步进度指示器 |
| P2 | 状态管理集成 | 连接 Zustand Store |

### 3.2 技术方案

#### 3.2.1 修复 API 调用

**修改文件**: `/app/requirements/new/page.tsx`

```typescript
// 当前代码 (错误)
router.push('/domain')

// 修改为
const response = await generateBoundedContext({ requirementText })
if (response.success) {
  router.push('/confirm/context')
} else {
  // 显示错误提示
}
```

**需要的状态**:
- 加载状态 (isLoading)
- 错误处理

#### 3.2.2 确认按钮修复

**修改文件**: `/app/confirm/context/page.tsx` 或 `/app/domain/page.tsx`

```tsx
// 添加确认按钮
<Button onClick={handleConfirm}>
  确认，继续
</Button>

// 点击后
const handleConfirm = () => {
  saveBoundedContext(data)
  router.push('/confirm/model')
}
```

#### 3.2.3 步骤指示器

**组件设计**:

```tsx
<StepIndicator 
  steps={[
    { id: 1, label: '限界上下文', path: '/confirm/context' },
    { id: 2, label: '领域模型', path: '/confirm/model' },
    { id: 3, label: '业务流程', path: '/confirm/flow' }
  ]}
  currentStep={currentStep}
  onStepClick={handleStepClick}
/>
```

**功能要求**:
- 当前步骤高亮
- 已完成步骤显示勾选
- 支持点击已完成的步骤回退

---

## 4. 验收标准 (DoD)

### 4.1 功能验收

| ID | 验收条件 | 测试方法 |
|----|----------|----------|
| AC1 | 输入需求后点击"开始生成原型"，调用 `POST /api/ddd/bounded-context` | 打开 Network 面板检查 API 调用 |
| AC2 | API 返回成功后跳转到 `/confirm/context` | 验证 URL 变化 |
| AC3 | `/confirm/context` 显示限界上下文图 (Mermaid) | 页面渲染检查 |
| AC4 | 页面显示"确认，继续"按钮 | UI 检查 |
| AC5 | 点击确认按钮后跳转到 `/confirm/model` | 验证 URL 变化 |
| AC6 | 步骤指示器显示 "Step 1/3" | UI 检查 |
| AC7 | 三步流程完整走通 | E2E 测试 |

### 4.2 技术验收

| ID | 验收条件 |
|----|----------|
| TC1 | TypeScript 无报错 |
| TC2 | 所有测试通过 |
| TC3 | 代码覆盖率不下降 |

---

## 5. 任务拆解

| 任务 | 负责人 | 依赖 | 预估工时 |
|------|--------|------|----------|
| fix-api-integration | dev | define-fix-plan | 2h |
| fix-domain-confirm | dev | fix-api-integration | 2h |
| fix-step-indicator | dev | fix-domain-confirm | 1h |
| test-confirmation-flow | tester | fix-step-indicator | 2h |
| review-all | reviewer | test-confirmation-flow | 1h |

---

## 6. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| API 响应慢 | 用户等待时间长 | 添加加载动画和超时提示 |
| Mermaid 渲染失败 | 图表显示异常 | 添加降级方案（显示代码） |
| 状态丢失 | 回退后数据丢失 | 使用 localStorage 持久化 |

---

## 7. 参考文档

- [PRD: 交互式需求确认流程](../prd/vibex-interactive-confirmation-prd.md)
- [根因分析报告](../output/confirmation-flow-root-cause-analysis.md)

---

*文档版本: 1.0*  
*创建时间: 2026-03-03*  
*作者: PM Agent*