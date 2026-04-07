# 需求录入流程问题分析报告

**分析时间**: 2026-03-03 21:05
**问题**: AI 生成功能疑似未接入 + 项目创建失败
**分析者**: Analyst Agent

---

## 问题概述

| 问题 | 状态 | 根因 |
|------|------|------|
| AI 生成功能未接入 | 🔴 确认 | Step 2/3 未调用 API，使用 Mock 数据 |
| 项目创建失败 | 🔴 确认 | 未调用后端 API，仅生成假 ID |

---

## 问题 1: AI 生成功能分析

### Step 1: 限界上下文 ✅ 已接入 AI

**文件**: `vibex-fronted/src/app/confirm/page.tsx`
**行号**: 22-45

```typescript
const handleSubmit = async () => {
  // Call AI API to generate bounded contexts
  const response = await generateBoundedContext(requirementText)
  
  if (response.success && response.boundedContexts) {
    setBoundedContexts(response.boundedContexts)
    // ...
  }
}
```

**后端实现**: `vibex-backend/src/routes/ddd.ts`
- 端点: `POST /api/ddd/bounded-context`
- AI 调用: ✅ 使用 `aiService.generateJSON()` 调用 AI
- 状态: ✅ **正确实现**

---

### Step 2: 领域模型类图 ❌ 未接入 AI

**文件**: `vibex-fronted/src/app/confirm/model/page.tsx`
**行号**: 20-62

```typescript
// Generate mock domain models based on selected contexts
useEffect(() => {
  if (domainModels.length === 0 && selectedContextIds.length > 0) {
    const models: typeof domainModels = []
    
    selectedContextIds.forEach((ctxId, ctxIndex) => {
      const ctx = boundedContexts.find(c => c.id === ctxId)
      if (ctx) {
        // Add aggregate root - 硬编码生成
        models.push({
          id: `${ctxId}-ar`,
          name: `${ctx.name}聚合根`,  // 拼接名称，非 AI 生成
          // ...
        })
      }
    })
    
    setDomainModels(models)
    // ...
  }
}, [selectedContextIds])
```

**问题**:
- ❌ 未调用任何后端 API
- ❌ 直接在前端拼接 Mock 数据
- ❌ 领域模型固定为"XX聚合根"、"XX实体"、"XX值对象"

**后端状态**:
- 存在 `/api/domain-models/generate` 端点（`routes/domain-models.ts:210`）
- 但前端未调用

---

### Step 3: 业务流程图 ❌ 未接入 AI

**文件**: `vibex-fronted/src/app/confirm/flow/page.tsx`
**行号**: 18-41

```typescript
// Generate mock business flow based on domain models
useEffect(() => {
  if (!businessFlow.states.length && domainModels.length > 0) {
    const states = [
      { id: 'state-1', name: '初始', type: 'initial' as const },
      { id: 'state-2', name: '处理中', type: 'intermediate' as const },
      { id: 'state-3', name: '完成', type: 'final' as const },
    ]
    
    const transitions = [
      { id: 'trans-1', fromStateId: 'state-1', toStateId: 'state-2', event: '开始处理' },
      { id: 'trans-2', fromStateId: 'state-2', toStateId: 'state-3', event: '处理完成' },
    ]
    
    setBusinessFlow({ ... })
    setFlowMermaidCode(`stateDiagram-v2 ...`)  // 硬编码模板
  }
}, [domainModels])
```

**问题**:
- ❌ 未调用任何后端 API
- ❌ 状态和转换完全固定：初始 → 处理中 → 完成
- ❌ 与用户输入的需求完全无关

**后端状态**:
- 未找到业务流程生成 API

---

## 问题 2: 项目创建失败分析

**文件**: `vibex-fronted/src/app/confirm/flow/page.tsx`
**行号**: 67-79

```typescript
const handleConfirm = async () => {
  setLoading(true)
  setError('')

  try {
    // Create project
    // TODO: Call API to create project  ← 注释说明未实现
    
    // For demo, just simulate project creation
    setCreatedProjectId(`project-${Date.now()}`)  // 假 ID
    goToNextStep()
    router.push('/confirm/success')
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : '创建失败，请重试')
  } finally {
    setLoading(false)
  }
}
```

**问题**:
- ❌ 未调用 `apiService.createProject()`
- ❌ `createdProjectId` 是假 ID（如 `project-1709478723456`）
- ❌ 点击"前往项目"只是跳转到 `/dashboard`，没有真正进入项目

**后端 API 状态**: ✅ `POST /api/projects` 已实现

---

## 根因总结

| 步骤 | 功能 | API 调用 | 实际行为 |
|------|------|---------|---------|
| Step 1 | 限界上下文 | ✅ 调用 `/api/ddd/bounded-context` | AI 生成 |
| Step 2 | 领域模型 | ❌ 未调用 | 前端 Mock |
| Step 3 | 业务流程 | ❌ 未调用 | 前端 Mock |
| Step 4 | 项目创建 | ❌ 未调用 | 生成假 ID |

---

## 修复建议

### 修复 1: Step 2 接入领域模型 API

**文件**: `vibex-fronted/src/app/confirm/model/page.tsx`

```typescript
// 替换 useEffect 中的 Mock 生成
useEffect(() => {
  const fetchDomainModels = async () => {
    if (domainModels.length === 0 && selectedContextIds.length > 0) {
      const response = await fetch('/api/domain-models/generate', {
        method: 'POST',
        body: JSON.stringify({
          contextIds: selectedContextIds,
          requirementText,
        }),
      })
      const data = await response.json()
      setDomainModels(data.domainModels)
      setModelMermaidCode(data.mermaidCode)
    }
  }
  fetchDomainModels()
}, [selectedContextIds])
```

### 修复 2: Step 3 接入业务流程 API

需要先在后端实现 `/api/ddd/business-flow` 端点。

### 修复 3: 项目创建接入真实 API

**文件**: `vibex-fronted/src/app/confirm/flow/page.tsx`

```typescript
const handleConfirm = async () => {
  setLoading(true)
  try {
    // 调用真实 API 创建项目
    const project = await apiService.createProject({
      name: requirementText.slice(0, 50),  // 用需求前 50 字符作为项目名
      description: requirementText,
      userId: localStorage.getItem('user_id') || '',
    })
    
    setCreatedProjectId(project.id)
    goToNextStep()
    router.push('/confirm/success')
  } catch (err) {
    setError('创建失败，请重试')
  } finally {
    setLoading(false)
  }
}
```

---

## 文件修改清单

| 文件 | 修改内容 |
|------|---------|
| `vibex-fronted/src/app/confirm/model/page.tsx` | 接入领域模型生成 API |
| `vibex-fronted/src/app/confirm/flow/page.tsx` | 接入业务流程 API + 项目创建 API |
| `vibex-backend/src/routes/ddd.ts` | 新增 `/api/ddd/business-flow` 端点 |
| `vibex-backend/src/routes/domain-models.ts` | 确认 `/api/domain-models/generate` 可用 |

---

## 验证清单

- [ ] Step 1: 输入需求后生成不同的限界上下文
- [ ] Step 2: 领域模型根据上下文动态生成
- [ ] Step 3: 业务流程根据领域模型动态生成
- [ ] Step 4: 项目创建成功，跳转到真实项目页面

---

*分析完成时间: 2026-03-03 21:05*
*分析者: Analyst Agent*