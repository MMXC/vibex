# ISSUE-002: 领域模型生成后图表不渲染

**编号**: ISSUE-002
**状态**: Open (修复被回退)
**严重程度**: P1 - 功能缺失
**发现时间**: 2026-03-16
**影响版本**: current
**修复尝试**: commit 005279b (已回退)

---

## 问题描述

用户完成限界上下文生成后，点击"生成领域模型"按钮，API 返回成功但界面无任何变化，Mermaid 图表不渲染。

## 根因分析

### 直接原因

后端 `/ddd/domain-model/stream` SSE 端点的 done 事件未返回 `mermaidCode` 字段。

```typescript
// 当前代码 (vibex-backend/src/routes/ddd.ts:567-572)
send('done', { 
  domainModels,
  message: '领域模型生成完成'
  // ❌ 缺少 mermaidCode
})
```

### 对比正常端点

```typescript
// 正常的 bounded-context/stream 端点 (line 280-283)
send('done', { 
  boundedContexts,
  mermaidCode: generateMermaidCode(boundedContexts), // ✅ 有 mermaidCode
})
```

### 数据流断点

```
后端 SSE done 事件
    ↓ { domainModels: [...] }  // 无 mermaidCode
前端 useDomainModelStream
    ↓ setDomainModels(models)  // 无 mermaidCode 可设置
HomePage.tsx
    ↓ modelMermaidCode = ''    // 永远为空
PreviewArea
    ↓ ❌ 无内容渲染
```

## 修复历史

### 第一次修复 (commit 005279b)

**修改**:
1. 后端: done 事件添加 `mermaidCode: generateDomainModelMermaidCode(...)`
2. 前端: hook 添加 `mermaidCode` 状态
3. 前端: HomePage.tsx 使用 hook 返回的 `mermaidCode`

**结果**: 领域模型渲染成功，但引入回归问题

### 回退 (commit 25e0c66)

**原因**: 修复导致"需求输入后点击开始生成没有AI分析进度条"

**分析**: `useDDDStream` hook 同时用于多个流程，mermaidCode 状态添加影响了限界上下文生成流程

## 防范机制

### 1. SSE 端点一致性检查

**规则**: 所有 SSE 流式端点的 done 事件必须包含渲染所需的所有数据

**检查清单**:
- [ ] `bounded-context/stream`: boundedContexts + mermaidCode ✅
- [ ] `domain-model/stream`: domainModels + mermaidCode ❌ (待修复)
- [ ] `business-flow/stream`: businessFlow + mermaidCode ✅

### 2. Hook 状态隔离原则

**规则**: 不同流程的 hook 状态必须完全独立，避免交叉污染

**检查**:
```typescript
// ✅ 正确: 独立状态
const { mermaidCode: contextMermaid } = useDDDStream()
const { mermaidCode: modelMermaid } = useDomainModelStream()
const { mermaidCode: flowMermaid } = useBusinessFlowStream()

// ❌ 错误: 共享状态
const { mermaidCode } = useDDDStream() // 用于所有流程
```

### 3. 回归测试覆盖

**规则**: 修改 SSE 端点后，必须测试所有相关流程

**测试矩阵**:
| 修改端点 | 需测试流程 |
|----------|-----------|
| bounded-context/stream | 限界上下文生成、领域模型生成前置 |
| domain-model/stream | 领域模型生成、限界上下文 → 领域模型链路 |
| business-flow/stream | 业务流程生成、领域模型 → 业务流程链路 |

## 推荐修复方案

### 方案: 最小化修改

仅修改后端 `ddd.ts` 的 done 事件:

```typescript
// vibex-backend/src/routes/ddd.ts
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

**理由**:
1. 前端 hook 已有 `mermaidCode` 提取逻辑 (line 544)
2. HomePage.tsx 已有 `modelMermaidCode` 使用 (line 403)
3. 仅需补充后端返回

**风险**: 需验证不影响限界上下文生成流程

## 相关文件

- 后端: `vibex-backend/src/routes/ddd.ts:567-572`
- 前端 Hook: `vibex-fronted/src/hooks/useDDDStream.ts:520-530, 544`
- 前端组件: `vibex-fronted/src/components/homepage/HomePage.tsx:403`

## 相关 Issues

- ISSUE-001: 领域模型崩溃问题 (已修复)

---

**创建时间**: 2026-03-16
**最后更新**: 2026-03-16