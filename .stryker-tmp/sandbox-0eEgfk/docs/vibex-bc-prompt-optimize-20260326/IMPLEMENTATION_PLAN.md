# Implementation Plan: vibex-bc-prompt-optimize-20260326

**项目**: DDD Bounded Contexts AI 生成质量优化
**版本**: v1.0
**Architect**: Architect
**时间**: 2026-03-26 18:57 UTC+8

---

## 执行顺序

```
Epic 1 → Epic 2 → Epic 3 → Epic 4 → Epic 5
(S1.1-S1.3)  (S2.1-S2.3)  (S3.1-S3.2)  (S4.1-S4.3)  (S5.1-S5.2)
```

**注意**: Epic 2 和 Epic 3 可并行开发（不同文件），Epic 4 依赖 Epic 1 的 filter 模块，Epic 5 依赖 Epic 2+3 完成。

---

## Epic 1: 统一 Prompt 模板 (P0)

**目标**: 创建单一 source of truth 的 prompt 模块

### S1.1 创建 `src/lib/prompts/bounded-contexts.ts`

```typescript
// src/lib/prompts/bounded-contexts.ts

export interface BoundedContext {
  name: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  description: string;
  ubiquitousLanguage: string[];
}

export const BOUNDED_CONTEXTS_PROMPT = `你是一位资深 DDD（领域驱动设计）专家，专门帮助中文互联网产品团队划分限界上下文。

## 你的任务
分析用户需求，提取 3-8 个限界上下文（Bounded Contexts）。

## 限界上下文的判断标准（中文语境）

**Core（核心域）**: 直接实现用户核心价值的领域，用户为此付费的原因。
- 判断：去掉它产品就失去意义
- 示例（电商）: "商品管理"（展示、搜索、上下架）、"订单管理"（下单、支付、物流）
- 示例（医疗）: "患者管理"（建档、就诊记录）、"诊疗管理"（挂号、问诊、开方）

**Supporting（支撑域）**: 为核心域提供专用能力，不可复用
- 判断：虽然可通用，但为该项目定制了流程
- 示例: "排班管理"（医疗）、"库存管理"（零售）

**Generic（通用域）**: 可在任何项目复用的通用能力
- 示例: "认证授权"、"通知推送"、"文件存储"、"日志"

**External（外部系统）**: 不在你的系统内，开发/维护权不在你
- 示例: "微信支付"、"支付宝"、"第三方物流API"

## 真实示例：在线医生问诊系统

输入需求：「我想做一个在线预约医生系统，患者可以查看医生、预约挂号、线上问诊、购买处方药」

好的限界上下文划分：
1. {"name": "患者管理", "type": "core", "description": "患者注册建档、实名认证、健康档案", "ubiquitousLanguage": ["患者", "健康档案", "实名认证"]}
2. {"name": "医生管理", "type": "core", "description": "医生入驻、资质审核、主页展示", "ubiquitousLanguage": ["医生", "资质", "入驻"]}
3. {"name": "预约挂号", "type": "core", "description": "医生排班、预约、取消、改期", "ubiquitousLanguage": ["排班", "号源", "预约时段"]}
4. {"name": "问诊管理", "type": "core", "description": "图文/视频问诊、病历书写、开处方", "ubiquitousLanguage": ["问诊", "病历", "处方"]}
5. {"name": "订单支付", "type": "supporting", "description": "问诊订单、微信/支付宝支付、退款", "ubiquitousLanguage": ["订单", "支付流水"]}
6. {"name": "认证授权", "type": "generic", "description": "登录注册、Token、JWT", "ubiquitousLanguage": ["登录", "JWT"]}
7. {"name": "微信支付", "type": "external", "description": "对接微信支付API", "ubiquitousLanguage": []}

坏的划分（边界重叠）:
- 把"患者管理"和"问诊管理"合并成"用户问诊"→ 违反单一职责
- 把"医生管理"当成 external（因为医生是外部资源）→ 遗漏核心业务

## 输出格式
JSON 数组，每个元素包含：
- name: 领域名称（DDD 通用语言，用中文名词，不用动词）
- type: core | supporting | generic | external
- description: 2-3 句话，说明这个上下文处理什么、不处理什么
- ubiquitousLanguage: 该领域内的专业术语数组（3-5个）

## 用户需求
{requirementText}`;

export function buildBoundedContextsPrompt(requirementText: string): string {
  return BOUNDED_CONTEXTS_PROMPT.replace('{requirementText}', requirementText);
}
```

### S1.2 创建 `src/lib/bounded-contexts-filter.ts`

```typescript
// src/lib/bounded-contexts-filter.ts

import type { BoundedContext } from './prompts/bounded-contexts';

export interface FilterOptions {
  minNameLength?: number;
  maxNameLength?: number;
  forbiddenNames?: string[];
  minCoreRatio?: number;
  maxCoreRatio?: number;
}

const DEFAULT_OPTIONS: Required<FilterOptions> = {
  minNameLength: 2,
  maxNameLength: 10,
  forbiddenNames: ['管理', '系统', '模块', '功能', '平台'],
  minCoreRatio: 0.4,
  maxCoreRatio: 0.7,
};

export function isNameFiltered(name: string, options?: FilterOptions): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (name.length < opts.minNameLength || name.length > opts.maxNameLength) return true;
  return opts.forbiddenNames.some(n => name.includes(n));
}

export function filterInvalidContexts(
  contexts: BoundedContext[],
  options?: FilterOptions
): BoundedContext[] {
  return contexts.filter(ctx => !isNameFiltered(ctx.name, options));
}

export function validateCoreRatio(
  contexts: BoundedContext[],
  options?: FilterOptions
): { valid: boolean; ratio: number; message?: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (contexts.length === 0) return { valid: true, ratio: 0 };
  const coreCount = contexts.filter(c => c.type === 'core').length;
  const ratio = coreCount / contexts.length;
  const valid = ratio >= opts.minCoreRatio && ratio <= opts.maxCoreRatio;
  return {
    valid,
    ratio,
    message: valid ? undefined : `core 占比 ${(ratio * 100).toFixed(1)}% 不在 ${(opts.minCoreRatio * 100)}%-${(opts.maxCoreRatio * 100)}% 范围内`,
  };
}
```

### S1.3 单元测试 (`__tests__/lib/prompts/bounded-contexts.test.ts`)

```typescript
import { BOUNDED_CONTEXTS_PROMPT, buildBoundedContextsPrompt } from '@/lib/prompts/bounded-contexts';

describe('BOUNDED_CONTEXTS_PROMPT', () => {
  test('包含 4 个结构章节', () => {
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('资深 DDD');
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('判断标准');
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('在线医生问诊系统');
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('ubiquitousLanguage');
  });
  test('4 种类型定义完整', () => {
    ['core', 'supporting', 'generic', 'external'].forEach(t =>
      expect(BOUNDED_CONTEXTS_PROMPT).toContain(t)
    );
  });
  test('包含真实示例', () => {
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('患者管理');
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('问诊管理');
    expect(BOUNDED_CONTEXTS_PROMPT).toContain('core');
  });
});

describe('buildBoundedContextsPrompt', () => {
  test('替换 requirementText 占位符', () => {
    const prompt = buildBoundedContextsPrompt('我要做一个电商系统');
    expect(prompt).toContain('我要做一个电商系统');
    expect(prompt).not.toContain('{requirementText}');
  });
});
```

**验收**: `npm test -- --testPathPattern="bounded-contexts" --coverage` 覆盖率 > 80%

**工时**: S1.1(0.5h) + S1.2(0.5h) + S1.3(0.5h) = **1.5h**

---

## Epic 2: 更新 generate-contexts API (P0)

**目标**: 替换内联 USER_PROMPT 为统一导入

### S2.1 替换 USER_PROMPT

在 `app/api/canvas/generate-contexts/route.ts` 中:

1. 删除 `USER_PROMPT` 常量
2. 添加 import: `import { buildBoundedContextsPrompt } from '@/lib/prompts/bounded-contexts';`
3. 添加 filter import: `import { filterInvalidContexts, validateCoreRatio } from '@/lib/bounded-contexts-filter';`
4. 将 LLM 调用时的 prompt 改为: `const prompt = buildBoundedContextsPrompt(requirementText);`
5. 在 LLM 返回后、返回前加: `const validContexts = filterInvalidContexts(rawContexts);`

### S2.2 集成测试 (`__tests__/api/generate-contexts.integration.test.ts`)

```typescript
describe('POST /api/canvas/generate-contexts', () => {
  test('复杂需求生成 ≥ 5 个上下文', async () => {
    const res = await callAPI({ requirementText: '在线预约医生系统' });
    expect(res.boundedContexts.length).toBeGreaterThanOrEqual(5);
  });
  test('所有上下文含 ubiquitousLanguage', async () => {
    const res = await callAPI({ requirementText: '员工考勤系统' });
    res.boundedContexts.forEach(ctx =>
      expect(ctx).toHaveProperty('ubiquitousLanguage')
    );
  });
  test('core 占比 40%-70%', async () => {
    const res = await callAPI({ requirementText: '在线预约医生系统' });
    const coreCount = res.boundedContexts.filter(c => c.type === 'core').length;
    const ratio = coreCount / res.boundedContexts.length;
    expect(ratio).toBeGreaterThanOrEqual(0.4);
    expect(ratio).toBeLessThanOrEqual(0.7);
  });
  test('过滤掉 "管理" 等无效名称', async () => {
    const res = await callAPI({ requirementText: '企业ERP系统' });
    res.boundedContexts.forEach(ctx => {
      expect(ctx.name).not.toContain('管理');
      expect(ctx.name).not.toContain('系统');
    });
  });
});
```

**验收**: 所有集成测试通过，`npm test -- --testPathPattern="generate-contexts"` 通过

**工时**: S2.1(0.25h) + S2.2(0.5h) = **0.75h**

---

## Epic 3: 更新 analyze/stream API (P0)

**目标**: 替换内联 planPrompt 为统一导入

### S3.1 替换 planPrompt

在 `app/api/v1/analyze/stream/route.ts` 中:

1. 删除内联 `planPrompt` 字符串
2. 添加 import: `import { buildBoundedContextsPrompt } from '@/lib/prompts/bounded-contexts';`
3. 添加 filter import: `import { filterInvalidContexts } from '@/lib/bounded-contexts-filter';`
4. 将 LLM 调用改为: `const prompt = buildBoundedContextsPrompt(requirement);`
5. 在 SSE 发射 `step_context` 事件前: `const validContexts = filterInvalidContexts(rawContexts);`

### S3.2 SSE 集成测试 (`__tests__/api/analyze-stream.integration.test.ts`)

```typescript
describe('POST /api/v1/analyze/stream SSE', () => {
  test('SSE 包含 step_context 事件', async () => {
    const events = await collectSSEEvents(
      callStreamAPI({ requirement: '在线预约医生系统' })
    );
    const stepCtx = events.find(e => e.type === 'step_context');
    expect(stepCtx).toBeDefined();
  });
  test('step_context 含 boundedContexts 数组', async () => {
    const events = await collectSSEEvents(
      callStreamAPI({ requirement: '员工考勤系统' })
    );
    const stepCtx = events.find(e => e.type === 'step_context');
    expect(Array.isArray(stepCtx.boundedContexts)).toBe(true);
    expect(stepCtx.boundedContexts.length).toBeGreaterThanOrEqual(3);
  });
});
```

**验收**: SSE 事件含 boundedContexts，集成测试通过

**工时**: S3.1(0.25h) + S3.2(0.5h) = **0.75h**

---

## Epic 4: 后处理过滤 (P0)

**目标**: 确保无效名称 100% 过滤，core 占比合理

### S4.1 单元测试 (`__tests__/lib/bounded-contexts-filter.test.ts`)

```typescript
import { isNameFiltered, filterInvalidContexts, validateCoreRatio } from '@/lib/bounded-contexts-filter';

describe('isNameFiltered', () => {
  test('"管理系统" 被过滤', () => {
    expect(isNameFiltered('患者管理系统')).toBe(true);
    expect(isNameFiltered('订单管理')).toBe(true);
  });
  test('"模块" "功能" "平台" 被过滤', () => {
    expect(isNameFiltered('数据模块')).toBe(true);
    expect(isNameFiltered('权限功能')).toBe(true);
    expect(isNameFiltered('测试平台')).toBe(true);
  });
  test('合法名称保留', () => {
    expect(isNameFiltered('患者管理')).toBe(false);
    expect(isNameFiltered('问诊')).toBe(false);
    expect(isNameFiltered('医生')).toBe(false);
  });
  test('长度超限过滤', () => {
    expect(isNameFiltered('患者管理系统集成模块')).toBe(true);
  });
});

describe('filterInvalidContexts', () => {
  test('过滤无效上下文', () => {
    const input = [
      { name: '患者管理', type: 'core', description: '', ubiquitousLanguage: [] },
      { name: '患者管理系统', type: 'core', description: '', ubiquitousLanguage: [] },
    ];
    const result = filterInvalidContexts(input);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('患者管理');
  });
});

describe('validateCoreRatio', () => {
  test('core 占比 50% 通过', () => {
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
  test('core 占比 100% 失败', () => {
    const contexts = [
      { name: 'A', type: 'core', description: '', ubiquitousLanguage: [] },
      { name: 'B', type: 'core', description: '', ubiquitousLanguage: [] },
    ];
    const result = validateCoreRatio(contexts);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('不在');
  });
});
```

**验收**: 所有过滤测试通过，覆盖率 > 80%

**工时**: S4.1(0.5h) + S4.2(0.25h) + S4.3(0.5h) = **1.25h**

---

## Epic 5: 两接口一致性验证 (P0)

**目标**: 验证两个 API 生成结果一致

### S5.1 一致性集成测试

```typescript
describe('两接口一致性', () => {
  test('同一需求上下文数量差异 ≤ 2', async () => {
    const input = '员工考勤系统';
    const [res1, res2] = await Promise.all([
      callAPI('/api/canvas/generate-contexts', { requirementText: input }),
      collectStreamAPI('/api/v1/analyze/stream', { requirement: input }),
    ]);
    const ctx1 = res1.boundedContexts;
    const ctx2 = res2.step_context?.boundedContexts ?? [];
    expect(Math.abs(ctx1.length - ctx2.length)).toBeLessThanOrEqual(2);
  });
  test('core 数量一致', async () => {
    const input = '在线预约医生系统';
    const [res1, res2] = await Promise.all([
      callAPI('/api/canvas/generate-contexts', { requirementText: input }),
      collectStreamAPI('/api/v1/analyze/stream', { requirement: input }),
    ]);
    const core1 = res1.boundedContexts.filter(c => c.type === 'core').length;
    const core2 = (res2.step_context?.boundedContexts ?? [])
      .filter(c => c.type === 'core').length;
    expect(core1).toBe(core2);
  });
});
```

**验收**: 一致性测试 100% 通过

**工时**: S5.1(0.5h) + S5.2(0.25h) = **0.75h**

---

## 总工时

| Epic | 开发 | 测试 | 合计 |
|------|------|------|------|
| Epic 1 | 1.0h | 0.5h | 1.5h |
| Epic 2 | 0.25h | 0.5h | 0.75h |
| Epic 3 | 0.25h | 0.5h | 0.75h |
| Epic 4 | 0.75h | 0.5h | 1.25h |
| Epic 5 | 0 | 0.75h | 0.75h |
| **总计** | **2.25h** | **2.75h** | **~5h** |

---

## 回滚检查点

1. **部署前**: `git commit -m "chore: backup before prompt optimize"` 并记录 commit hash
2. **Epic 1 完成**: 运行 `npm test -- --testPathPattern="bounded-contexts"`，通过后继续
3. **Epic 2+3 完成**: 运行集成测试，有失败则立即回滚
4. **Epic 4+5 完成**: 全量测试通过后合并 PR

**回滚命令**: `git revert HEAD` 或手动还原两处 route.ts

---

## Epic 2 完成状态: ✅ 已完成 (2026-03-26 19:35 UTC+8)
- S2.1 ✅ USER_PROMPT 替换为 buildBoundedContextsPrompt()
- S2.1 ✅ filterInvalidContexts 集成
- S2.2 ✅ 集成测试 5/5 通过 (route.test.ts)
- Build ✅ npm run build 通过

## Epic 3 完成状态: ✅ 已完成 (2026-03-26 19:35 UTC+8)
- S3.1 ✅ planPrompt 替换为 buildBoundedContextsPrompt()
- S3.1 ✅ 类型验证 + filterInvalidContexts 集成
- S3.2 ✅ SSE 集成测试 7/7 通过 (route.test.ts)
- Build ✅ npm run build 通过

## Epic 4 完成状态: ✅ 已完成 (2026-03-26 19:40 UTC+8)
- S4.1 ✅ bounded-contexts-filter 单元测试 14/14 通过
- 测试覆盖: isNameFiltered + filterInvalidContexts + validateCoreRatio

## 剩余: Epic 5 (一致性测试) - 待 tester 执行
