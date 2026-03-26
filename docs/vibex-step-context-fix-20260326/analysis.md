# Analysis: vibex-step-context-fix-20260326

## 问题概述

**症状**: 后端 AI 生成了多个限界上下文（如"用户管理"、"商品管理"、"订单管理"），但用户在画布上只看到一个节点，且节点名称永远是"AI 分析上下文"。

**根因**: 前后端数据传输链路断裂，三个环节均存在问题。

---

## 根因分析

### 1. 后端 SSE 事件格式缺陷

**文件**: `/vibex-backend/src/app/api/v1/analyze/stream/route.ts`

```typescript
// 第 87-91 行：后端已生成 boundedContexts，但未发送
const contexts = data?.boundedContexts ?? [];
// ...
sendSSE(controller, 'step_context', {
  content: summary,        // ✅ 发送了 summary
  mermaidCode: contextMermaid,  // ✅ 发送了 Mermaid
  confidence,              // ✅ 发送了置信度
  // ❌ 缺失: boundedContexts 数组未发送！
});
```

**结论**: 后端 AI 已经生成了 `boundedContexts`（包含 id, name, description, type, keyResponsibilities），但 SSE 事件未包含此数组。

### 2. 前端事件类型定义缺失

**文件**: `/vibex-fronted/src/lib/canvas/api/dddApi.ts`

```typescript
// 第 23-28 行：StepContextEvent 类型缺少 boundedContexts
export interface StepContextEvent {
  type: 'step_context';
  content: string;
  mermaidCode?: string;
  confidence: number;
  // ❌ 缺失: boundedContexts?: Array<{...}>
}

// 第 44 行：回调签名缺少 boundedContexts 参数
onStepContext?: (content: string, mermaidCode?: string, confidence?: number) => void;
// ❌ 应该是: (content: string, boundedContexts?: [...], confidence?: number) => void
```

**结论**: 前端类型定义和回调签名均不支持 boundedContexts。

### 3. 前端 Store 只创建单一节点

**文件**: `/vibex-fronted/src/lib/canvas/canvasStore.ts`

```typescript
// 第 320-328 行：generateContextsFromRequirement 中的 onStepContext
onStepContext: (content, _mermaidCode, confidence) => {
  setAiThinking(true, content);
  if (confidence !== undefined && confidence > 0.5) {
    addContextNode({
      name: 'AI 分析上下文',  // ❌ 硬编码名称！
      description: content,
      type: 'core',
    });
  }
}
```

**结论**: 前端永远只调用一次 `addContextNode`，且使用硬编码名称 "AI 分析上下文"。

---

## 修复方案

### 方案 A：最小化修改（推荐）

**修改点**:
1. **后端** - `route.ts`: 在 `step_context` 事件中添加 `boundedContexts` 字段
2. **前端类型** - `dddApi.ts`: 更新 `StepContextEvent` 和回调签名
3. **前端 Store** - `canvasStore.ts`: 循环调用 `addContextNode`

**工作量**: ~30 分钟

**优点**: 改动范围小，风险低

```typescript
// 后端修改 (route.ts)
sendSSE(controller, 'step_context', {
  content: summary,
  mermaidCode: contextMermaid,
  confidence,
  boundedContexts: contexts.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    type: c.type,
  })),
});

// 前端类型修改 (dddApi.ts)
export interface StepContextEvent {
  type: 'step_context';
  content: string;
  mermaidCode?: string;
  confidence: number;
  boundedContexts?: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
  }>;
}

// 前端回调修改 (canvasStore.ts)
onStepContext: (content, _mermaidCode, confidence, boundedContexts) => {
  setAiThinking(true, content);
  if (confidence !== undefined && confidence > 0.5) {
    if (boundedContexts && boundedContexts.length > 0) {
      // 循环创建多个节点
      boundedContexts.forEach(ctx => {
        addContextNode({
          name: ctx.name,
          description: ctx.description,
          type: ctx.type as 'core' | 'supporting' | 'generic',
        });
      });
    } else {
      // 回退：保留原有逻辑
      addContextNode({
        name: 'AI 分析上下文',
        description: content,
        type: 'core',
      });
    }
  }
}
```

### 方案 B：完整重构

将 boundedContexts 作为主要数据源，summary 仅用于展示/日志。

**工作量**: ~1 小时

**优点**: 数据结构更清晰

---

## 验收标准

1. **单上下文场景**: 输入简单需求（如"做一个博客系统"），画布显示 1 个节点，名称为 AI 生成的真实名称
2. **多上下文场景**: 输入复杂需求（如"做一个电商平台"），画布显示多个节点（如"用户管理"、"商品管理"、"订单管理"），每个节点名称与 AI 生成名称一致
3. **降级场景**: 当后端未返回 boundedContexts 时，仍能显示单个"AI 分析上下文"节点（向后兼容）

### 测试用例

```
输入: "开发一个电商平台，包含用户注册登录、商品浏览下单、支付物流等功能"
预期输出: 画布上显示 3+ 个限界上下文节点，名称如：
  - 用户管理（处理注册登录）
  - 商品管理（处理商品浏览和搜索）
  - 订单管理（处理下单和订单跟踪）
  - 支付管理（处理支付流程）
```

---

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 后端 AI 返回空数组 | 画布无节点 | 检查 contexts.length > 0 |
| 节点名称过长 | UI 显示问题 | 截断至 30 字符 |
| 节点数量过多 (>10) | 性能问题 | 限制最多 10 个节点 |

---

## 推荐实施步骤

1. 修改后端 SSE 事件格式
2. 更新前端事件类型定义
3. 修改前端 Store 回调逻辑
4. 端到端测试验证

---

**分析时间**: 2026-03-26 14:50 GMT+8  
**分析师**: analyst
