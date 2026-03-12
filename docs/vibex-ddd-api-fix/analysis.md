# API 限界上下文返回简单问题分析

**项目**: vibex-ddd-api-fix
**日期**: 2026-03-12 22:56
**分析师**: Analyst Agent

---

## 执行摘要

**问题**: `/api/ddd/bounded-context` API 返回的限界上下文数据过于简单，无法满足前端展示和业务分析需求。

**根因**: AI 提示词设计不够精细，缺少引导 AI 深入分析业务领域的上下文和示例。

---

## 1. 问题定义

### 1.1 当前问题

| 问题项 | 当前状态 | 期望状态 |
|--------|----------|----------|
| 上下文数量 | 1-2 个 | 3-7 个（根据业务复杂度） |
| 上下文描述 | 简短或缺失 | 详细描述职责边界 |
| 关系字段 | 空数组 `[]` | 包含上下游关系 |
| Mermaid 图 | 孤立节点 | 带关系连线的完整图 |

### 1.2 影响范围

- **前端展示**: 限界上下文图只有孤立节点，无法展示业务关系
- **用户体验**: 用户无法理解各上下文之间的协作关系
- **DDD 建模**: 后续领域模型生成缺少上下文关系约束

---

## 2. 根因分析

### 2.1 提示词问题

**当前提示词** (简化版):
```
You are a Domain-Driven Design expert. Analyze the following requirement and identify bounded contexts.

Please identify:
1. Core domains (the main business capabilities)
2. Supporting domains (support the core domains)
3. Generic domains (utilities that could be off-the-shelf)
4. External systems (outside the system boundary)
```

**问题**:
1. ❌ 没有提供示例引导
2. ❌ 没有要求分析上下文关系
3. ❌ 没有引导 AI 进行深入的业务分析
4. ❌ JSON Schema 没有包含 `relationships` 字段

### 2.2 JSON Schema 问题

**当前 Schema**:
```json
{
  "boundedContexts": {
    "type": "array",
    "items": {
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "type": { "enum": ["core", "supporting", "generic", "external"] }
      }
    }
  }
}
```

**缺失**:
- `relationships` 字段定义
- `keyResponsibilities` 字段（关键职责）
- `entities` 字段（核心实体预览）

### 2.3 Mermaid 生成问题

**当前代码**:
```typescript
// 只生成节点，没有生成关系连线
contexts.forEach(ctx => {
  const nodeDef = ctx.type === 'core' 
    ? `${ctx.id}[${ctx.name}]`
    : ...
  lines.push(`  ${nodeDef}`)
})
```

**缺失**: 基于关系生成连线的逻辑

---

## 3. 解决方案

### 3.1 优化提示词（推荐）

```typescript
const prompt = `You are a Domain-Driven Design expert with 15 years of experience in strategic design and bounded context identification.

Analyze the following requirement and identify bounded contexts using EventStorming and Context Mapping techniques.

**Requirement:**
${requirementText}

**Analysis Process:**
1. Identify key business capabilities and subdomains
2. Determine core domain (competitive advantage), supporting domains, and generic domains
3. Identify external systems that need integration
4. Map relationships between contexts using Context Mapping patterns

**Output Requirements:**
For each bounded context, provide:
- name: Concise name (noun phrase, e.g., "Order Management")
- description: 2-3 sentences explaining the responsibility and boundaries
- type: core | supporting | generic | external
- keyResponsibilities: Array of 3-5 key responsibilities
- relationships: Array of relationships to OTHER contexts

For each relationship, provide:
- targetContextName: Name of the related context
- type: upstream-downstream | partnership | shared-kernel | conformist | anticorruption-layer
- description: 1 sentence explaining the collaboration

**Example Output:**
{
  "boundedContexts": [
    {
      "name": "Order Management",
      "description": "Handles the complete order lifecycle from creation to fulfillment. Responsible for order validation, pricing calculation, and status management.",
      "type": "core",
      "keyResponsibilities": ["Order creation and validation", "Pricing calculation", "Order status tracking", "Fulfillment coordination"],
      "relationships": [
        {"targetContextName": "Inventory", "type": "upstream-downstream", "description": "Orders consume inventory availability from Inventory context"}
      ]
    },
    {
      "name": "Inventory",
      "description": "Manages stock levels and availability across warehouses. Provides real-time inventory data to order processing.",
      "type": "supporting",
      "keyResponsibilities": ["Stock level management", "Availability checking", "Reorder alerts"],
      "relationships": [
        {"targetContextName": "Order Management", "type": "upstream-downstream", "description": "Provides inventory availability data downstream"}
      ]
    }
  ]
}

Respond ONLY with the JSON object, no other text.`;
```

### 3.2 更新 JSON Schema

```typescript
const schema = {
  boundedContexts: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        type: { 
          type: 'string', 
          enum: ['core', 'supporting', 'generic', 'external'] 
        },
        keyResponsibilities: {
          type: 'array',
          items: { type: 'string' }
        },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              targetContextName: { type: 'string' },
              type: { 
                type: 'string',
                enum: ['upstream-downstream', 'partnership', 'shared-kernel', 'conformist', 'anticorruption-layer']
              },
              description: { type: 'string' }
            },
            required: ['targetContextName', 'type']
          }
        }
      },
      required: ['name', 'type', 'description']
    }
  }
};
```

### 3.3 更新 Mermaid 生成逻辑

```typescript
function generateMermaidCode(contexts: BoundedContext[]): string {
  const lines = ['graph TD'];
  
  // Add nodes
  contexts.forEach(ctx => {
    const nodeDef = ctx.type === 'core' 
      ? `${ctx.id}[${ctx.name}]`
      : ctx.type === 'supporting'
        ? `${ctx.id}(${ctx.name})`
        : ctx.type === 'generic'
          ? `${ctx.id}[[${ctx.name}]]`
          : `${ctx.id}{${ctx.name}}`;
    lines.push(`  ${nodeDef}`);
  });
  
  // Add relationship edges
  lines.push('');
  contexts.forEach(ctx => {
    ctx.relationships?.forEach(rel => {
      const targetCtx = contexts.find(c => c.name === rel.targetContextName);
      if (targetCtx) {
        const edgeStyle = rel.type === 'upstream-downstream' ? '-->' 
          : rel.type === 'partnership' ? '<-->'
          : rel.type === 'shared-kernel' ? '-..-'
          : '-->';
        lines.push(`  ${ctx.id} ${edgeStyle} ${targetCtx.id}:${rel.description || ''}`);
      }
    });
  });
  
  // ... class definitions ...
  
  return lines.join('\n');
}
```

---

## 4. 技术风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| AI 返回格式不一致 | 高 | 中 | 添加格式验证和重试逻辑 |
| 响应时间增加 | 低 | 低 | 提示词优化后实际 token 数变化不大 |
| 旧版兼容性 | 中 | 低 | 保留 `relationships` 为可选字段 |

---

## 5. 验收标准

| 验收项 | 标准 | 验证方法 |
|--------|------|----------|
| 上下文数量 | 根据需求复杂度返回 3-7 个 | 手动测试典型需求 |
| 描述完整性 | 每个上下文有 20-50 字描述 | 检查 API 返回 |
| 关系生成 | 至少 2 条上下文关系 | 检查 `relationships` 数组 |
| Mermaid 图完整性 | 节点 + 连线 + 样式 | 前端渲染验证 |
| 单元测试 | 覆盖新逻辑 | `pnpm test` |

---

## 6. 实施建议

### 6.1 优先级

| 任务 | 优先级 | 工作量 |
|------|--------|--------|
| 优化提示词 | P0 | 1h |
| 更新 JSON Schema | P0 | 30min |
| 更新 Mermaid 生成 | P1 | 1h |
| 添加单元测试 | P1 | 1h |

### 6.2 总工作量

**预估**: 3.5h

---

**产出物**: `docs/vibex-ddd-api-fix/analysis.md`
**状态**: 分析完成，待进入 PRD 阶段