# PRD: 确认流程入口统一

**项目名称**: vibex-confirm-entry-unify  
**版本**: 1.0  
**创建日期**: 2026-03-04  
**负责人**: PM Agent

---

## 1. 项目目标

统一确认流程入口，解决入口重复、绕过、用户旅程不清晰的问题。

---

## 2. 问题分析

| 问题 | 描述 | 影响 |
|------|------|------|
| 入口重复 | `/confirm` 和 `/confirm/context` 都提供 Step 1 功能 | 用户困惑 |
| 入口绕过 | `/confirm/model` 可从 domain 页面直接跳入 | 数据不一致 |
| 用户旅程不清晰 | 用户可以从任意一步进入 | 缺少引导 |

---

## 3. 功能需求

### 3.1 状态校验功能

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1.1 | 前置数据检查 | 访问 `/confirm/context` 时检查 `boundedContexts` 存在 | P0 |
| F3.1.2 | 无数据重定向 | 前置数据为空时重定向到 `/confirm` | P0 |
| F3.1.3 | Model 页面校验 | 访问 `/confirm/model` 时检查 `domainModels` 存在 | P0 |
| F3.1.4 | Flow 页面校验 | 访问 `/confirm/flow` 时检查 `businessFlow` 存在 | P0 |

### 3.2 入口引导功能

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.2.1 | Dashboard 入口 | Dashboard 显示"开始确认"入口按钮 | P0 |
| F3.2.2 | 入口提示 | 从非正常入口进入时显示提示 | P1 |
| F3.2.3 | 进度恢复 | 重新进入时恢复到上次步骤 | P2 |

### 3.3 统一入口方案

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.3.1 | 主入口 | `/confirm` 作为唯一入口 | P0 |
| F3.3.2 | 步骤跳转 | URL 参数控制步骤: `?step=context` | P1 |
| F3.3.3 | 面包屑导航 | 显示当前步骤位置 | P2 |

---

## 4. 技术方案

### 4.1 状态检查 Hook

```typescript
// hooks/useConfirmationState.ts
export function useConfirmationState(step: 'context' | 'model' | 'flow') {
  const { boundedContexts, domainModels, businessFlow } = useConfirmationStore()
  
  const checks = {
    context: boundedContexts.length > 0,
    model: domainModels.length > 0,
    flow: businessFlow.length > 0,
  }
  
  return {
    isValid: checks[step],
    redirectTo: step === 'context' ? '/confirm' : `/confirm?step=${getPrevStep(step)}`
  }
}
```

### 4.2 路由守卫

```typescript
// middleware/confirmGuard.ts
export function confirmGuard(step: string) {
  const { isValid, redirectTo } = useConfirmationState(step)
  
  useEffect(() => {
    if (!isValid) {
      router.replace(redirectTo)
    }
  }, [isValid])
  
  return isValid ? children : null
}
```

---

## 5. 验收标准

### P0 功能

| 验收项 | 测试方法 |
|--------|----------|
| `/confirm/context` 无数据时重定向到 `/confirm` | 直接访问，检查 URL |
| `/confirm/model` 无数据时重定向 | 直接访问，检查 URL |
| `/confirm/flow` 无数据时重定向 | 直接访问，检查 URL |
| Dashboard 显示确认入口 | UI 检查 |

### P1 功能

| 验收项 | 测试方法 |
|--------|----------|
| 入口提示显示 | 从非正常入口进入，检查提示 |
| 步骤参数生效 | 访问 `?step=context`，检查跳转 |

---

## 6. Epic 拆解

### Epic 1: 状态校验 (P0)

| Story | 验收标准 | 预估 |
|-------|----------|------|
| Context 页面校验 | 无数据重定向 | 1h |
| Model 页面校验 | 无数据重定向 | 1h |
| Flow 页面校验 | 无数据重定向 | 1h |

### Epic 2: 入口引导 (P1)

| Story | 验收标准 | 预估 |
|-------|----------|------|
| Dashboard 入口 | 按钮显示 | 1h |
| 入口提示 | 提示显示 | 1h |

### Epic 3: 进度恢复 (P2)

| Story | 验收标准 | 预估 |
|-------|----------|------|
| 状态保存 | localStorage 存储 | 1h |
| 状态恢复 | 重新进入恢复 | 1h |

---

*文档版本: 1.0*  
*创建时间: 2026-03-04*  
*作者: PM Agent*