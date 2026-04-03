# Analysis: vibex-bc-prompt-optimize-20260326

**任务**: vibex-bc-prompt-optimize-20260326/analyze-requirements
**分析人**: Analyst
**时间**: 2026-03-26 18:55 (UTC+8)
**状态**: ✅ 完成

---

## 1. 执行摘要

**一句话结论**: 后端有两处限界上下文生成 prompt，均缺少真实示例和中文语境指导，导致 AI 生成结果名称泛化、边界不清。优化方案是在两处 prompt 中加入 DDD 专家角色定义、真实行业示例（医疗/电商/金融）和中文边界判断标准。

---

## 2. 现状分析

### 2.1 两处 Prompt 位置

| # | 文件 | 当前 Prompt | 状态 |
|---|------|-------------|------|
| P1 | `app/api/canvas/generate-contexts/route.ts` | `USER_PROMPT`（英文+中文混写） | ✅ 正在使用 |
| P2 | `app/api/v1/analyze/stream/route.ts` | 内联 `planPrompt`（中文+英文指令混合） | ✅ 正在使用 |

### 2.2 P1 Prompt 原文（generate-contexts）

```
分析以下需求，提取限界上下文（Bounded Contexts）。

需求：{requirementText}

要求：
- 每个上下文有明确的业务边界，不重叠
- 类型: core(核心域)/supporting(支撑域)/generic(通用域)/external(外部系统)
- 用 DDD 通用语言命名
- 返回 JSON 数组
```

### 2.3 P2 Prompt 原文（analyze/stream）

```
你是一个DDD专家。分析这个需求并只返回JSON:
需求: {requirement}
只返回JSON: { summary, boundedContexts: [...], confidence }
```

### 2.4 核心问题

| 问题 | 表现 | 影响 |
|------|------|------|
| **无示例** | AI 只能猜，无参考 | 生成结果泛化，名称永远像 "患者管理" 风格 |
| **中文语境缺失** | 没有告诉 AI 什么是中文项目的边界 | 边界划分依赖英文训练数据 |
| **类型定义模糊** | "core/supporting/generic/external" 无判断标准 | AI 分类主观，结果不稳定 |
| **Prompt 重复** | 两处实现不一致，维护成本高 | P1 和 P2 生成结果可能不同 |
| **无 Ubiquitous Language** | 没有要求 AI 输出领域术语 | 生成的上下文名称无法直接用于代码 |

---

## 3. 根因：Prompt 质量影响生成质量

### 3.1 当前 Prompt 问题

```
问题1: 无 Few-shot 示例
  → AI 不知道"好的限界上下文长什么样"
  → 结果：名称泛化（"用户管理"），描述模糊

问题2: 无中文边界标准
  → AI 用英文直觉判断边界
  → 结果：边界过大（如把整个系统当一个上下文）

问题3: 无类型判断标准
  → AI 主观分类 core/supporting
  → 结果：90%的上下文都被标记为 core

问题4: 无 Ubiquitous Language 要求
  → AI 输出自然语言描述，不能直接映射代码
  → 结果：需要二次翻译才能用于开发
```

### 3.2 验证证据（代码审查）

```typescript
// generate-contexts/route.ts 第 30-45 行
const USER_PROMPT = `...要求：
- 每个上下文有明确的业务边界，不重叠  // ← 模糊要求
- 类型: core/supporting/generic/external  // ← 无判断标准
- 用 DDD 通用语言命名  // ← 无示例

JSON 数组格式示例：  // ← 只有 JSON 格式，无 DDD 示例
[{"name": "患者管理", ...}]`
```

---

## 4. 优化方案

### 4.1 统一 Prompt 模板（含真实示例）

**推荐 Prompt 模板**：

```
你是一位资深 DDD（领域驱动设计）专家，专门帮助中文互联网产品团队划分限界上下文。

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
```

### 4.2 实现步骤

**Step 1**: 抽取统一 Prompt 到 `src/lib/prompts/bounded-contexts.ts`

```typescript
// src/lib/prompts/bounded-contexts.ts
export const BOUNDED_CONTEXTS_PROMPT = `你是一位资深 DDD（领域驱动设计）专家...`;

// 导出两个版本：简洁版（generate-contexts）和流式版（analyze/stream）
```

**Step 2**: 更新 `generate-contexts/route.ts`

```typescript
// 删除 USER_PROMPT 改为导入
import { BOUNDED_CONTEXTS_PROMPT } from '@/lib/prompts/bounded-contexts';
const prompt = BOUNDED_CONTEXTS_PROMPT.replace('{requirementText}', requirementText);
```

**Step 3**: 更新 `analyze/stream/route.ts`

```typescript
// 替换内联 planPrompt
import { BOUNDED_CONTEXTS_PROMPT } from '@/lib/prompts/bounded-contexts';
const planPrompt = BOUNDED_CONTEXTS_PROMPT.replace('{requirementText}', requirement);
```

**Step 4**: 写测试用例验证

```typescript
const testCases = [
  {
    input: "我想做一个在线预约医生系统",
    expectContexts: 5,  // 至少 5 个
    expectCoreCount: 3, // 至少 3 个 core
  },
  {
    input: "我要开发一个员工考勤系统",
    expectContexts: 3,  // 至少 3 个
    expectCoreCount: 1, // 至少 1 个 core
  }
];
```

### 4.3 额外优化：生成后处理

在 `generate-contexts/route.ts` 中增加后处理，过滤掉无效上下文：

```typescript
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 10;
const FORBIDDEN_NAMES = ['管理', '系统', '模块', '功能'];

const validContexts = contexts.filter(ctx => {
  if (ctx.name.length < MIN_NAME_LENGTH || ctx.name.length > MAX_NAME_LENGTH) return false;
  if (FORBIDDEN_NAMES.some(n => ctx.name.includes(n))) return false;
  return true;
});
```

---

## 5. 技术风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Prompt 加长后 token 消耗增加 | 中 | 低 | 控制示例数量，maxTokens 从 2048 提到 3072 |
| 新 Prompt 让现有测试失败 | 低 | 中 | 先跑现有测试，失败则调整 temperature |
| 生成结果变慢（Prompt 变长） | 低 | 低 | maxTokens 调大即可 |
| Prompt 模板抽取增加维护复杂度 | 低 | 低 | 统一模板反而降低维护成本 |

---

## 6. 工时估算

| 步骤 | 开发 | 测试 | 说明 |
|------|------|------|------|
| 创建 prompts 模板文件 | 0.5h | 0.25h | 抽取 prompt 到独立文件 |
| 更新 generate-contexts | 0.25h | 0.25h | 替换 prompt |
| 更新 analyze/stream | 0.25h | 0.25h | 替换 prompt |
| 后处理过滤 | 0.25h | 0.25h | 过滤无效上下文 |
| 写测试用例 | 0 | 0.5h | 2-3 个 test case |
| **合计** | **1.25h** | **1.5h** | **总计 ~2.75h** |

---

## 7. 验收标准

| ID | 验收条件 | 测试方法 |
|----|----------|---------|
| V1 | 在线医生问诊系统生成 ≥5 个上下文 | 单元测试：调用 API，验证 contexts.length >= 5 |
| V2 | core 类型上下文占比 40%-70% | 单元测试：统计 core 数量/总数 |
| V3 | 生成的上下文名称不含 "管理/系统/模块" | 单元测试：过滤 forbidden names |
| V4 | 每个上下文有 ubiquitousLanguage 字段 | 单元测试：验证数组非空 |
| V5 | generate-contexts 和 analyze/stream 生成结果一致 | 集成测试：同一输入两个接口对比 |
| V6 | Prompt 模板独立维护 | 代码审查：prompts/bounded-contexts.ts 存在 |

---

*分析产出物: `/root/.openclaw/vibex/docs/vibex-bc-prompt-optimize-20260326/analysis.md`*
