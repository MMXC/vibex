# ISSUE-003: 领域模型生成后 Mermaid 图表不渲染

**发现日期**: 2026-03-16  
**状态**: 待修复  
**优先级**: P0

---

## 问题描述

用户在限界上下文生成完成后，点击"生成领域模型"按钮，接口返回成功但界面无变化，Mermaid 图表不渲染。

---

## 根因分析

### 直接原因

1. **后端**: `/ddd/domain-model/stream` SSE 端点的 done 事件未返回 `mermaidCode`
2. **前端**: `useDomainModelStream` Hook 没有提取 `mermaidCode`
3. **前端**: `HomePage.tsx` 中 `setModelMermaidCode('')` 永远为空字符串

### 代码位置

| 文件 | 行号 | 问题 |
|------|------|------|
| `vibex-backend/src/routes/ddd.ts` | 567-573 | done 事件缺少 mermaidCode |
| `vibex-fronted/src/hooks/useDDDStream.ts` | 372-377 | 未提取 mermaidCode |
| `vibex-fronted/src/components/homepage/HomePage.tsx` | 147 | 硬编码空字符串 |

---

## 解决方案

### 后端修改

```typescript
// ddd.ts 第 567-577 行
send('done', { 
  domainModels,
  mermaidCode: generateDomainModelMermaidCode(domainModels, (boundedContexts || []).map(c => ({
    ...c,
    relationships: [],
    description: c.description || ''
  }))),
  message: '领域模型生成完成'
})
```

### 前端修改

1. `useDomainModelStream` 添加 `mermaidCode` 状态
2. `HomePage.tsx` 使用 `streamModelMermaidCode`

---

## 参考实现

限界上下文流 (`/ddd/bounded-context/stream`) 已正确实现：

```typescript
// 后端
send('done', {
  boundedContexts,
  mermaidCode: generateMermaidCode(boundedContexts)
})

// 前端
setMermaidCode(parsedData.mermaidCode || '')
```

---

## 关联问题

- ISSUE-001: 领域模型页面 TypeError 崩溃（已修复）
- ISSUE-002: 领域模型渲染问题（v3/v4 分析）

---

## 修复记录

| 日期 | 尝试 | 结果 |
|------|------|------|
| 2026-03-16 | 005279b | 引入新问题，已回退 |
| - | 待修复 | - |