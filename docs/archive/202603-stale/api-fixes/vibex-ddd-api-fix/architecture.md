# Architecture: vibex-ddd-api-fix

> **项目**: vibex-ddd-api-fix
> **状态**: 设计中
> **Architect**: Architect Agent
> **日期**: 2026-03-20
> **输入**: `docs/vibex-ddd-api-fix/analysis.md`, `docs/vibex-ddd-api-fix/prd.md`

---

## 1. 问题与约束

| 维度 | 现状 | 目标 |
|------|------|------|
| API 路由 | 前端调用 `/api/ddd/bounded-context` | 与后端实际路由对齐 |
| 响应结构 | 限界上下文无关系数据 | 含 `relationships` + `keyResponsibilities` |
| Mermaid 渲染 | 孤立节点图 | 含边的关系图（Context Mapping） |
| Schema 校验 | 无 Zod 校验 | Zod schema 验证 + 重试机制 |

**核心约束**:
- 向后兼容：旧数据格式需兼容
- 路由修正：前端调用 `/api/ddd/...` → 后端实际 `/api/v1/domain-model/...` 或同路径适配层

---

## 2. 架构决策

### ADR-001: 路由对齐方案

**选项 A - 前端适配**（推荐 ✅）
> 修改前端 `src/constants/homepage.ts` + hooks，将 `/api/ddd/bounded-context` 映射到 `/api/v1/domain-model/[projectId]/`

- Pros: 后端零改动，风险低
- Cons: 前端需更新多处

**选项 B - 后端兼容路由**
> 在后端新增 `/api/ddd/bounded-context` 等兼容路由

- Pros: 前端零改动
- Cons: 后端路由冗余，增加维护负担

**决策**: 选项 A — 前端适配

### ADR-002: Relationships 边生成策略

| relationship type | Mermaid 语法 | 说明 |
|-------------------|-------------|------|
| upstream-downstream | `A --> B` | 实线箭头 |
| partnership | `A <--> B` | 双向边 |
| shared-kernel | `A -.-> B` | 虚线 |
| anti-corruption-layer | `A --x B` | 红线（阻断） |

---

## 3. 技术方案

### 3.1 前端改动

**文件**: `vibex-fronted/src/constants/homepage.ts`

```typescript
// 修改前
export const HOME_PAGE_API = {
  GENERATE_CONTEXTS: '/api/ddd/bounded-context',
  GENERATE_MODELS: '/api/ddd/domain-model',
  GENERATE_FLOWS: '/api/ddd/business-flow',
};

// 修改后（路由映射）
export const HOME_PAGE_API = {
  GENERATE_CONTEXTS: '/api/v1/domain-model',  // projectId 作为查询参数
  GENERATE_MODELS: '/api/v1/domain-model',     // 同路由，POST 类型区分
  GENERATE_FLOWS: '/api/ddd/business-flow',     // 保持不变（待确认）
};
```

**文件**: `vibex-fronted/src/hooks/queries/useDDD.ts`

```typescript
// 统一调用方式
export const useBoundedContexts = (projectId: string) => {
  return useQuery({
    queryKey: ['bounded-contexts', projectId],
    queryFn: async () => {
      const res = await fetch(`${HOME_PAGE_API.GENERATE_CONTEXTS}?projectId=${projectId}`);
      if (!res.ok) throw new Error('API Error');
      return res.json();
    },
  });
};
```

### 3.2 后端改动

**文件**: `vibex-backend/src/app/api/v1/domain-model/[projectId]/route.ts`

#### 提示词增强（bounded-context 场景）

```typescript
const BOUNDED_CONTEXT_PROMPT = `
你是一个 DDD 限界上下文分析助手。基于提供的业务描述，识别限界上下文。

## 输出格式（必须严格遵循）：
{
  "boundedContexts": [
    {
      "name": "string",
      "description": "string",
      "keyResponsibilities": ["string"],  // ← 新增
      "relationships": [                   // ← 新增
        {
          "targetContextName": "string",
          "type": "upstream-downstream | partnership | shared-kernel | anti-corruption-layer",
          "description": "string"
        }
      ]
    }
  ]
}

## Context Mapping 模式引导：
- upstream-downstream: 上游向下游提供能力，下游依赖上游
- partnership: 双向协作，共同演进
- shared-kernel: 共享领域模型子集
- anti-corruption-layer: 适配层隔离外部系统

## 示例 relationships：
{
  "targetContextName": "订单上下文",
  "type": "upstream-downstream",
  "description": "支付上下文为订单上下文提供支付能力"
}
`;
```

#### Zod Schema 更新

```typescript
import { z } from 'zod';

const RelationshipSchema = z.object({
  targetContextName: z.string(),
  type: z.enum(['upstream-downstream', 'partnership', 'shared-kernel', 'anti-corruption-layer']),
  description: z.string(),
});

const BoundedContextSchema = z.object({
  name: z.string(),
  description: z.string(),
  keyResponsibilities: z.array(z.string()),
  relationships: z.array(RelationshipSchema),
});

const ResponseSchema = z.object({
  boundedContexts: z.array(BoundedContextSchema),
});
```

### 3.3 Mermaid 边生成

**文件**: `vibex-fronted/src/utils/mermaid-generator.ts`

```typescript
function mapRelationshipType(type: string): string {
  const map: Record<string, string> = {
    'upstream-downstream': '-->',
    'partnership': '<-->',
    'shared-kernel': '-.->',
    'anti-corruption-layer': '--x',
  };
  return map[type] || '-->';
}

export function generateContextMap(boundedContexts: BoundedContext[]): string {
  const lines = ['graph TD'];
  
  // 节点定义
  boundedContexts.forEach((ctx, i) => {
    lines.push(`  ${i}[${ctx.name}]`);
  });
  
  // 边生成
  boundedContexts.forEach((ctx, i) => {
    ctx.relationships?.forEach((rel) => {
      const targetIdx = boundedContexts.findIndex(c => c.name === rel.targetContextName);
      if (targetIdx !== -1) {
        const edgeType = mapRelationshipType(rel.type);
        lines.push(`  ${i} ${edgeType} ${targetIdx}`);
      }
    });
  });
  
  return lines.join('\n');
}
```

---

## 4. 模块划分

```
vibex-fronted/
├── src/constants/homepage.ts       # API 路由常量（修改）
├── src/hooks/queries/useDDD.ts      # React Query hooks（修改）
└── src/utils/mermaid-generator.ts  # Mermaid 生成（新增边逻辑）

vibex-backend/
└── src/app/api/v1/domain-model/[projectId]/route.ts  # 提示词 + Schema（修改）
```

---

## 5. 验收标准

| ID | 验收条件 | 验证方式 |
|----|----------|----------|
| V1 | API 返回 ≥ 2 条 relationships（测试数据） | Jest unit test |
| V2 | Zod schema 拒绝无效格式 | Jest: expect invalid → toThrow |
| V3 | Mermaid SVG 包含 `<path>` 元素（边） | DOM 测试 |
| V4 | npm run build 成功 | CI 验证 |
| V5 | 旧数据（无 relationships）兼容 | Jest 兼容性测试 |

---

## 6. 实施步骤

```
Step 1: 前端 - 更新 API 常量（homepage.ts）
Step 2: 前端 - 更新 hooks 使用新路由
Step 3: 前端 - Mermaid 生成器添加边逻辑
Step 4: 后端 - 更新提示词（Context Mapping 引导）
Step 5: 后端 - 添加 Zod schema 验证
Step 6: 单元测试覆盖
Step 7: E2E 测试验证
Step 8: npm run build + lint
```

**预估工时**: 3.5 小时

---

## 7. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 后端路由不存在 | 低 | 高 | 确认 `/api/v1/domain-model` 存在 |
| Mermaid 渲染性能 | 中 | 中 | 限制边数量（max 20 条） |
| 旧数据兼容 | 低 | 低 | Schema 默认空数组 |

---

*Architect Agent | 2026-03-20*
