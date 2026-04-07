# Epic 拆分方案: 交互式确认流程修复

**项目**: vibex-confirmation-flow-v2  
**版本**: 1.0  
**日期**: 2026-03-03  
**负责人**: PM Agent

---

## 1. 审计问题摘要

| 问题 | 优先级 | 描述 |
|------|--------|------|
| 问题 1 | 🔴 P0 | `/requirements/new` 页面未调用 DDD API，直接跳转 |
| 问题 2 | 🟡 P1 | 存在两套独立入口页面 |
| 问题 3 | 🟡 P1 | `/confirm/context` 空状态处理 |
| 问题 4 | 🟡 P1 | `/domain` 未集成确认流程 |
| 问题 5 | 🟢 P2 | 步骤指示器仅用于 `/confirm/*` |

---

## 2. Epic 拆分原则

- **粒度**: 单个按钮 / 单个 API 调用 / 单个页面跳转
- **独立性**: 每个 Epic 可独立测试，无跨 Epic 依赖
- **DoD**: 每个 Epic 定义明确的完成标准

---

## 3. Epic 列表

### Epic 1: 修复 `/requirements/new` API 调用

**问题**: 点击"开始生成原型"按钮后未调用 `POST /api/ddd/bounded-context`，直接跳转。

**User Stories**:

| ID | Story | 验收标准 (DoD) | 测试用例 |
|----|-------|-----------------|----------|
| E1-S1 | 调用 DDD API | `handleSubmit` 点击后发起 `POST /api/ddd/bounded-context` 请求 | 检查 Network 面板是否有 API 调用 |
| E1-S2 | 显示加载状态 | API 调用期间显示 Loading 组件 | UI 检查加载动画 |
| E1-S3 | 错误处理 | API 失败时显示错误提示 | 模拟 API 失败，检查错误提示 |
| E1-S4 | 成功跳转 | API 返回成功后跳转到 `/confirm/context` | 检查 URL 变化 |

**技术实现**:
```typescript
// 修改 /app/requirements/new/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  setIsLoading(true)
  try {
    const response = await generateBoundedContext(requirementData.content)
    if (response.success) {
      router.push('/confirm/context')
    }
  } catch (error) {
    setError('生成失败，请重试')
  } finally {
    setIsLoading(false)
  }
}
```

**依赖**: 无  
**预估工时**: 2h

---

### Epic 2: 统一入口页面

**问题**: 存在两套入口 `/requirements/new` 和 `/confirm`，用户体验混乱。

**User Stories**:

| ID | Story | 验收标准 (DoD) | 测试用例 |
|----|-------|-----------------|----------|
| E2-S1 | 重定向旧入口 | 访问 `/requirements/new` 自动重定向到 `/confirm` | 访问旧 URL，检查重定向 |
| E2-S2 | 更新导航链接 | Dashboard "新需求" 链接指向 `/confirm` | 点击按钮，检查目标 URL |
| E2-S3 | 移除冗余代码 | 删除 `/requirements/new` 的 Mock 数据创建逻辑 | 代码审查确认删除 |

**技术实现**:
```typescript
// 方案 A: 重定向
useEffect(() => {
  router.replace('/confirm')
}, [])

// 方案 B: 删除页面，更新导航
```

**依赖**: Epic 1 完成后  
**预估工时**: 1h

---

### Epic 3: `/confirm/context` 空状态处理

**问题**: 直接访问 `/confirm/context` 时数据为空，页面显示空白。

**User Stories**:

| ID | Story | 验收标准 (DoD) | 测试用例 |
|----|-------|-----------------|----------|
| E3-S1 | 空状态检测 | 检测 `boundedContexts` 为空时触发处理 | 直接访问页面，检查行为 |
| E3-S2 | 自动跳转 | 空状态时自动跳转到 `/confirm` | 检查 URL 变化 |
| E3-S3 | 显示提示 | 跳转前显示 "请先输入需求" 提示 | UI 检查提示信息 |

**技术实现**:
```typescript
useEffect(() => {
  if (boundedContexts.length === 0) {
    toast.warning('请先输入需求')
    router.replace('/confirm')
  }
}, [boundedContexts])
```

**依赖**: 无（独立功能）  
**预估工时**: 1h

---

### Epic 4: `/domain` 页面集成确认流程

**问题**: `/domain` 是独立编辑器，未集成确认流程和步骤指示器。

**User Stories**:

| ID | Story | 验收标准 (DoD) | 测试用例 |
|----|-------|-----------------|----------|
| E4-S1 | 添加确认按钮 | `/domain` 页面显示"确认进入下一步"按钮 | UI 检查按钮存在 |
| E4-S2 | 点击跳转 | 按钮点击后跳转到 `/confirm/model` | 检查 URL 变化 |
| E4-S3 | 步骤指示器 | 显示当前步骤 "Step 2/3" | UI 检查指示器 |
| E4-S4 | 数据传递 | 点击确认时传递领域模型数据 | 检查 Store 数据 |

**技术实现**:
```tsx
// 在 /app/domain/page.tsx 添加
<StepIndicator currentStep={2} />
<Button onClick={handleConfirm}>
  确认，继续
</Button>
```

**依赖**: Epic 1 完成后  
**预估工时**: 2h

---

### Epic 5: 步骤指示器全局集成

**问题**: 步骤指示器仅用于 `/confirm/*`，未在 `/domain` 使用。

**User Stories**:

| ID | Story | 验收标准 (DoD) | 测试用例 |
|----|-------|-----------------|----------|
| E5-S1 | 步骤高亮 | 当前步骤高亮显示 | UI 检查 |
| E5-S2 | 完成标记 | 已完成步骤显示勾选 | UI 检查 |
| E5-S3 | 点击回退 | 支持点击已完成的步骤回退 | 点击步骤，检查跳转 |

**技术实现**: 复用现有 `ConfirmationSteps` 组件  
**依赖**: Epic 4  
**预估工时**: 1h

---

## 4. Epic 依赖图

```
Epic 1 (P0) ──┬──> Epic 2 ──> (完成)
              │
              ├───> Epic 4 ──> Epic 5 ──> (完成)
              │
              └───> Epic 3 (独立)
```

---

## 5. 验收标准汇总

| Epic | 独立测试 | DoD 定义 | 依赖 |
|------|----------|----------|------|
| E1: API 调用 | ✅ | 4 个验收条件 | 无 |
| E2: 统一入口 | ✅ | 3 个验收条件 | E1 |
| E3: 空状态处理 | ✅ | 3 个验收条件 | 无 |
| E4: /domain 集成 | ✅ | 4 个验收条件 | E1 |
| E5: 步骤指示器 | ✅ | 3 个验收条件 | E4 |

---

## 6. 测试策略

### 单元测试
- 每个 Epic 的 User Story 至少 1 个测试用例
- 测试 API 调用、跳转逻辑、状态处理

### E2E 测试
- 完整流程: `/confirm` → `/confirm/context` → `/confirm/model` → `/confirm/flow`
- 入口测试: 从 Dashboard 进入确认流程

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| API 响应慢 | 用户等待 | 添加加载状态和超时 |
| 回退丢失数据 | 用户体验 | 使用 localStorage 持久化 |

---

*文档版本: 1.0*  
*创建时间: 2026-03-03*  
*作者: PM Agent*