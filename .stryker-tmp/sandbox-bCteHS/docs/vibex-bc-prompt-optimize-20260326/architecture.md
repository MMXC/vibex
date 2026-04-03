# Architecture: vibex-bc-prompt-optimize-20260326

**项目**: 优化 DDD bounded contexts AI 生成质量
**Architect**: Architect
**时间**: 2026-03-26 18:57 UTC+8
**状态**: ✅ 完成

---

## 1. Tech Stack

| 技术 | 选择 | 理由 |
|------|------|------|
| 语言 | TypeScript | 现有 codebase 已是 TypeScript，无迁移成本 |
| 测试框架 | Jest | 现有 codebase 已使用 Jest，保持一致 |
| Prompt 管理 | 单文件模块 (`lib/prompts/`) | 简单场景无需模板引擎，字符串替换足够 |
| LLM | GPT-4o (现有) | 不变更模型，只优化 prompt |
| 依赖注入 | 直接 import | 两处 API 直接 import，零 DI 框架引入 |

**无新增外部依赖** — 这是纯 prompt + 后处理优化，改动范围极小。

---

## 2. Architecture Diagram

```mermaid
graph TB
    subgraph "Prompt Source of Truth"
        PC["src/lib/prompts/bounded-contexts.ts<br/>BOUNDED_CONTEXTS_PROMPT"]
    end

    subgraph "API Layer"
        GC["app/api/canvas/generate-contexts/route.ts<br/>POST /api/canvas/generate-contexts"]
        AS["app/api/v1/analyze/stream/route.ts<br/>POST /api/v1/analyze/stream"]
    end

    subgraph "Post-processing Utilities"
        FF["src/lib/bounded-contexts-filter.ts<br/>filterInvalidContexts()"]
        PT["src/lib/bounded-contexts-filter.ts<br/>validateCoreRatio()"]
    end

    subgraph "Test Suite"
        TU["__tests__/lib/prompts/bounded-contexts.test.ts"]
        TA["__tests__/lib/bounded-contexts-filter.test.ts"]
        TI["__tests__/api/generate-contexts.integration.test.ts"]
    end

    subgraph "LLM"
        LLM["GPT-4o API (OpenAI)"]
    end

    PC --> GC
    PC --> AS
    FF --> GC
    PT --> GC
    FF --> AS
    PT --> AS

    GC --> LLM
    AS --> LLM

    TU --> PC
    TA --> FF
    TI --> GC
    TI --> AS
```

**关键约束**: Prompt 模块是唯一的 source of truth，两处 API 共享导入，不各自内联。

---

## 3. File Structure

```
src/lib/prompts/
  bounded-contexts.ts          # ✅ NEW — 统一 Prompt 模板

src/lib/
  bounded-contexts-filter.ts  # ✅ NEW — 后处理过滤工具

app/api/canvas/generate-contexts/
  route.ts                    # 🔄 MODIFY — 替换 USER_PROMPT

app/api/v1/analyze/stream/
  route.ts                    # 🔄 MODIFY — 替换内联 planPrompt

__tests__/lib/prompts/
  bounded-contexts.test.ts    # ✅ NEW — Prompt 格式验证测试

__tests__/lib/
  bounded-contexts-filter.test.ts  # ✅ NEW — 过滤规则测试

__tests__/api/
  generate-contexts.integration.test.ts  # ✅ NEW — 集成测试
  analyze-stream.integration.test.ts     # ✅ NEW — SSE 集成测试
```

---

## 4. API Definitions

### 4.1 Prompt 模块 (New)

```typescript
// src/lib/prompts/bounded-contexts.ts

export interface BoundedContext {
  name: string;           // 领域名称（中文名词）
  type: 'core' | 'supporting' | 'generic' | 'external';
  description: string;    // 2-3 句话
  ubiquitousLanguage: string[]; // 专业术语数组
}

export const BOUNDED_CONTEXTS_PROMPT: string;
// 模板变量: {requirementText} — 替换为需求文本

export function buildBoundedContextsPrompt(requirementText: string): string {
  return BOUNDED_CONTEXTS_PROMPT.replace(
    '{requirementText}',
    requirementText
  );
}
```

### 4.2 Filter 模块 (New)

```typescript
// src/lib/bounded-contexts-filter.ts

export interface FilterOptions {
  minNameLength?: number;   // default: 2
  maxNameLength?: number;   // default: 10
  forbiddenNames?: string[]; // default: ["管理", "系统", "模块", "功能", "平台"]
  minCoreRatio?: number;     // default: 0.4
  maxCoreRatio?: number;    // default: 0.7
}

export function filterInvalidContexts(
  contexts: BoundedContext[],
  options?: FilterOptions
): BoundedContext[];

export function validateCoreRatio(
  contexts: BoundedContext[],
  options?: FilterOptions
): { valid: boolean; ratio: number; message?: string };

export function isNameFiltered(
  name: string,
  options?: FilterOptions
): boolean;
```

### 4.3 generate-contexts API (Modify)

```typescript
// app/api/canvas/generate-contexts/route.ts

// 变更: 删除 USER_PROMPT 内联，改为导入
import { buildBoundedContextsPrompt } from '@/lib/prompts/bounded-contexts';
import { filterInvalidContexts, validateCoreRatio } from '@/lib/bounded-contexts-filter';

interface GenerateContextsRequest {
  requirementText: string;  // 用户需求文本
}

interface GenerateContextsResponse {
  boundedContexts: BoundedContext[];
  meta: {
    total: number;
    coreCount: number;
    coreRatio: number;
    filteredCount: number;
  };
}

// POST /api/canvas/generate-contexts
// Response: GenerateContextsResponse
// LLM call: OpenAI GPT-4o with buildBoundedContextsPrompt(requirementText)
// Post-processing: filterInvalidContexts() → validateCoreRatio()
```

### 4.4 analyze/stream API (Modify)

```typescript
// app/api/v1/analyze/stream/route.ts

// 变更: 删除内联 planPrompt，改为导入
import { buildBoundedContextsPrompt } from '@/lib/prompts/bounded-contexts';
import { filterInvalidContexts } from '@/lib/bounded-contexts-filter';

// POST /api/v1/analyze/stream
// SSE event type: step_context
// {
//   type: "step_context",
//   boundedContexts: BoundedContext[],
//   requirement: string
// }
// Post-processing: filterInvalidContexts() before SSE emission
```

---

## 5. Data Model

```typescript
// BoundedContext — 限界上下文实体
interface BoundedContext {
  name: string;                    // 领域名称（中文名词，非动词）
  type: BoundedContextType;        // 分类
  description: string;             // 职责说明（不处理什么）
  ubiquitousLanguage: string[];    // 领域术语表
}

type BoundedContextType = 'core' | 'supporting' | 'generic' | 'external';

// 类型判断标准（Prompt 中内置）
// Core: 直接实现用户核心价值，去掉产品失去意义
// Supporting: 为核心域提供专用能力，不可复用
// Generic: 任何项目都可复用（认证、通知、日志）
// External: 开发/维护权不在你的系统（微信支付、第三方API）
```

---

## 6. Edge Cases

| 场景 | 处理方式 |
|------|---------|
| LLM 返回 JSON 解析失败 | try/catch，fallback 返回空数组 + 记录 error log |
| 所有上下文都被过滤 | 保留至少 1 个最可能的，不返回空数组 |
| core 占比 < 40% | 不强制干预，warning log |
| core 占比 > 70% | warning log 提示，可能需要优化 prompt |
| ubiquitousLanguage 为空 | 允许，但 warning log |
| Prompt 模板文件缺失 | throw Error，CI/CD 阶段即失败 |
| LLM 返回非数组格式 | 尝试 `JSON.parse()` 提取数组，失败则 [] |

---

## 7. Performance Impact

| 指标 | 当前 | 优化后 | 变化 |
|------|------|--------|------|
| Prompt token 数 | ~150 tokens | ~800 tokens | +650 tokens |
| maxTokens | 2048 | 3072 | +1024 |
| 预估生成时间 | ~1.5s | ~2s | +0.5s |
| 每次 API 调用成本 | $0.003 | $0.005 | +$0.002 |

**影响评估**: Prompt 加长约 4x token，但 maxTokens 调整后生成质量更稳定。成本增加 ~60%，在可接受范围内。

---

## 8. Testing Strategy

### 测试框架: Jest

### 覆盖率要求: > 80%

### 核心测试用例:

**T1. Prompt 格式验证** (`bounded-contexts.test.ts`)
```typescript
test('Prompt 包含 4 个结构章节', () => {
  const sections = ['资深 DDD', '判断标准', '在线医生问诊系统', 'ubiquitousLanguage'];
  sections.forEach(s => expect(BOUNDED_CONTEXTS_PROMPT).toContain(s));
});
test('4 种类型定义完整', () => {
  ['core', 'supporting', 'generic', 'external'].forEach(t =>
    expect(BOUNDED_CONTEXTS_PROMPT).toContain(t)
  );
});
```

**T2. 过滤规则** (`bounded-contexts-filter.test.ts`)
```typescript
test('"管理系统" 被过滤', () => {
  expect(isNameFiltered('患者管理系统')).toBe(true);
});
test('"问诊" 长度合适保留', () => {
  expect(isNameFiltered('问诊')).toBe(false);
});
test('core 占比 50% 通过验证', () => {
  const contexts = [
    { name: 'A', type: 'core', description: '', ubiquitousLanguage: [] },
    { name: 'B', type: 'core', description: '', ubiquitousLanguage: [] },
    { name: 'C', type: 'generic', description: '', ubiquitousLanguage: [] },
    { name: 'D', type: 'generic', description: '', ubiquitousLanguage: [] },
  ];
  const result = validateCoreRatio(contexts);
  expect(result.valid).toBe(true);
  expect(result.ratio).toBe(0.5);
});
```

**T3. 集成测试** (`generate-contexts.integration.test.ts`)
```typescript
test('在线医生问诊系统生成 ≥ 5 个上下文', async () => {
  const res = await callAPI({ requirementText: '在线预约医生系统' });
  expect(res.boundedContexts.length).toBeGreaterThanOrEqual(5);
});
test('所有上下文含 ubiquitousLanguage 字段', async () => {
  const res = await callAPI({ requirementText: '员工考勤系统' });
  res.boundedContexts.forEach(ctx =>
    expect(ctx).toHaveProperty('ubiquitousLanguage')
  );
});
```

---

## 9. Rollback Plan

| 阶段 | 操作 |
|------|------|
| 部署前 | 备份两处 route.ts 的当前版本 |
| 部署后 | 监控 error log 中 JSON parse 失败率 |
| 回滚 | git revert 或直接还原 route.ts，删除新文件 |

**回滚触发条件**: JSON parse 失败率 > 5%（正常 < 1%）
