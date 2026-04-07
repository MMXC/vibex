# 分析：领域模型生成后页面不更新问题

**分析日期**: 2026-03-16
**分析师**: Analyst
**状态**: 完成

---

## 1. 执行摘要

**问题根因**：领域模型生成后页面不切换的核心原因是 **Mermaid 代码生成链路断裂**。

| 环节 | 问题 | 影响 |
|------|------|------|
| Backend API | `/api/ddd/domain-model/stream` 未返回 `mermaidCode` | 前端无法获取图表代码 |
| Frontend Hook | `useDomainModelStream` 未定义 `mermaidCode` 状态 | 无法存储图表代码 |
| Frontend Component | `HomePage.tsx` 硬编码 `setModelMermaidCode('')` | 永远为空 |

**结论**：这是一个 **功能缺失** 问题，不是 Bug。代码中有明确的 `// TODO` 注释，说明开发者知道这个功能未完成。

---

## 2. 问题定义

### 2.1 用户描述

> 点击「生成领域模型」后，API 返回正常但页面无变化，仍显示限界上下文图。

### 2.2 问题边界

- **涉及页面**: 首页 (HomePage.tsx)
- **涉及流程**: Step 2 (限界上下文) → Step 3 (领域模型)
- **触发条件**: 在 Step 2 点击「🚀 生成领域模型」按钮

### 2.3 影响范围

- **严重程度**: P0 (阻塞核心流程)
- **影响用户**: 所有尝试生成领域模型的用户
- **影响路径**: DDD 建模流程中断于 Step 2

---

## 3. 现状分析

### 3.1 代码流程追踪

```
用户点击「生成领域模型」
    ↓
handleGenerateDomainModel() 调用
    ↓
generateDomainModels(requirementText, boundedContexts)
    ↓
SSE Stream: POST /api/ddd/domain-model/stream
    ↓
Backend 返回 done 事件: { domainModels, message }
    ↓
❌ 缺失 mermaidCode
    ↓
Frontend: setDomainModels(models), setStatus('done')
    ↓
useEffect 检测 modelStreamStatus === 'done'
    ↓
setModelMermaidCode('')  ← 硬编码为空！
setCurrentStep(3)
    ↓
getCurrentMermaidCode() 返回 ''
    ↓
Preview 显示空状态
```

### 3.2 问题代码定位

#### Backend: `/api/ddd/domain-model/stream` (Line 466-471)

```typescript
// ❌ 缺失 mermaidCode
send('done', { 
  domainModels,
  message: '领域模型生成完成'
})

// ✅ 对比 bounded-context/stream (Line 727-730)
send('done', {
  boundedContexts,
  mermaidCode: generateMermaidCode(boundedContexts)  // 有 mermaidCode
})
```

#### Frontend Hook: `useDDDStream.ts` (Line 218-229)

```typescript
// ❌ 没有 mermaidCode 状态
export interface UseDomainModelStreamReturn {
  thinkingMessages: ThinkingStep[]
  domainModels: DomainModel[]
  status: DomainModelStreamStatus
  errorMessage: string | null
  // 缺失: mermaidCode: string
}

// ✅ 对比 useDDDStream (Line 22-28)
export interface UseDDDStreamReturn {
  thinkingMessages: ThinkingStep[]
  contexts: BoundedContext[]
  mermaidCode: string  // 有这个
  status: DDDStreamStatus
  errorMessage: string | null
}
```

#### Frontend Component: `HomePage.tsx` (Line 135-142)

```typescript
useEffect(() => {
  if (modelStreamStatus === 'done' && streamDomainModels.length > 0) {
    setDomainModels(streamDomainModels as DomainModel[]);
    setModelMermaidCode(''); // ❌ TODO: Generate mermaid code
    setCurrentStep(3);
    setCompletedStep(3);
  }
}, [modelStreamStatus, streamDomainModels]);
```

### 3.3 其他发现

#### 按钮禁用逻辑缺失

用户反馈：「不勾选上下文也能点击「生成领域模型」」

**代码确认** (HomePage.tsx Line 269):
```typescript
{currentStep === 2 && boundedContexts.length > 0 && (
  <button className={styles.generateButton} onClick={handleGenerateDomainModel}>
    🚀 生成领域模型
  </button>
)}
```

条件检查的是 `boundedContexts.length > 0`，但应该检查 `selectedContextIds.size > 0`。

---

## 4. 方案对比

### 方案 A: 完整实现（推荐）

**修改范围**:
1. Backend: 在 `done` 事件中返回 `mermaidCode`
2. Frontend Hook: 添加 `mermaidCode` 状态
3. Frontend Component: 从 Hook 获取 `mermaidCode`

**工作量估算**:
- Backend: 1h (添加 `generateDomainModelMermaidCode` 调用)
- Frontend: 1h (修改 Hook 和 Component)
- 测试: 1h

**优点**: 完整解决问题，符合设计意图
**缺点**: 需要修改多个文件

### 方案 B: 前端生成 Mermaid 代码

**修改范围**: 仅 Frontend，在 `useEffect` 中根据 `domainModels` 生成代码

**工作量估算**: 1h

**优点**: 改动最小
**缺点**: 不符合 SSE 流式设计，前后端职责不清

### 方案 C: 使用非流式 API

**修改范围**: 切换到 `/api/ddd/domain-model` 非流式 API，该 API 已返回 `mermaidCode`

**工作量估算**: 0.5h

**优点**: 最快解决
**缺点**: 失去流式体验（思考过程展示）

---

## 5. 推荐方案

**推荐方案 A（完整实现）**

理由:
1. 符合原始设计意图（流式 + Mermaid）
2. 与 `bounded-context/stream` 保持一致
3. 用户体验最佳（流式思考过程 + 图表渲染）

---

## 6. 验收标准

| ID | 验收条件 | 测试方法 |
|----|----------|----------|
| AC1 | 点击「生成领域模型」后，Step 切换到 3 | E2E: 验证 `currentStep === 3` |
| AC2 | 预览区域显示领域模型类图 | E2E: 验证 MermaidPreview 组件渲染 |
| AC3 | 思考面板显示领域模型生成过程 | E2E: 验证 ThinkingPanel 内容 |
| AC4 | 未勾选上下文时按钮禁用 | 单元测试: 验证按钮 disabled 状态 |

---

## 7. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| AI 返回空领域模型 | 低 | 中 | 添加空状态 UI 提示 |
| Mermaid 代码格式错误 | 低 | 中 | 添加格式校验 |
| SSE 连接中断 | 中 | 低 | 已有重试机制 |

---

## 8. 相关文件

**需要修改的文件**:
1. `vibex-backend/src/routes/ddd.ts` - Backend API
2. `vibex-fronted/src/hooks/useDDDStream.ts` - Frontend Hook
3. `vibex-fronted/src/components/homepage/HomePage.tsx` - Frontend Component

**参考文件**:
1. `vibex-backend/src/routes/ddd.ts` Line 727-730 (bounded-context done 事件)
2. `vibex-backend/src/routes/ddd.ts` Line 540-549 (generateDomainModelMermaidCode 函数)

---

## 9. 附录：修复代码参考

### Backend 修复 (ddd.ts)

```typescript
// Line 466-471 修改为:
send('done', { 
  domainModels,
  mermaidCode: generateDomainModelMermaidCode(domainModels, boundedContexts || []),  // 添加
  message: '领域模型生成完成'
})
```

### Frontend Hook 修复 (useDDDStream.ts)

```typescript
// 添加状态
const [mermaidCode, setMermaidCode] = useState('')

// 在 done 事件处理中:
case 'done':
  const models = Array.isArray(parsedData.domainModels) 
    ? parsedData.domainModels 
    : []
  setDomainModels(models)
  setMermaidCode(parsedData.mermaidCode || '')  // 添加
  setStatus('done')
  break

// 返回值添加 mermaidCode
return {
  thinkingMessages,
  domainModels,
  mermaidCode,  // 添加
  status,
  errorMessage,
  generateDomainModels,
  abort,
  reset,
}
```

### Frontend Component 修复 (HomePage.tsx)

```typescript
// 从 Hook 解构 mermaidCode
const {
  thinkingMessages: modelThinkingMessages, 
  domainModels: streamDomainModels,
  mermaidCode: streamModelMermaidCode,  // 添加
  status: modelStreamStatus, 
  ...
} = useDomainModelStream();

// useEffect 修改
useEffect(() => {
  if (modelStreamStatus === 'done' && streamDomainModels.length > 0) {
    setDomainModels(streamDomainModels as DomainModel[]);
    setModelMermaidCode(streamModelMermaidCode);  // 使用 Hook 返回的值
    setCurrentStep(3);
    setCompletedStep(3);
  }
}, [modelStreamStatus, streamDomainModels, streamModelMermaidCode]);
```