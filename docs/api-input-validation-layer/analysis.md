# 分析报告：VibeX API 输入验证层

**项目**: api-input-validation-layer
**角色**: Analyst（需求分析师）
**日期**: 2026-04-03
**状态**: ✅ 分析完成

---

## 1. 业务场景分析（安全痛点）

### 1.1 现状概览

VibeX 后端采用 Next.js App Router（/api 与 /api/v1 两套路由），共计约 50 个 API 路由。当前输入验证存在以下问题：

| 路由文件 | 问题类型 | 风险等级 |
|----------|---------|---------|
| `/api/chat` | 用户消息直接透传给 LLM API，无长度/内容限制 | 🔴 高 |
| `/api/plan/analyze` | `requirement` 字段仅检查非空，无 Prompt Injection 防护 | 🔴 高 |
| `/api/github/.../contents/[...path]` | `owner`/`repo`/`path` 未校验，直接拼接 GitHub API URL | 🔴 高（路径遍历） |
| `/api/projects` | 仅 `name`/`userId` 非空检查，缺类型校验 | 🟡 中 |
| `/api/auth/register` | 邮箱格式校验弱，密码强度仅 `length >= 8` | 🟡 中 |
| `/api/v1/canvas/generate` | `pageIds` 未校验类型，`JSON.parse` 缺 try-catch | 🟡 中 |
| `/api/v1/canvas/generate-flows` | `contexts` 有独立校验函数，但非 Zod 标准化 | 🟢 低（有基础防护） |

### 1.2 核心安全痛点

1. **Prompt Injection 风险**：`/api/chat` 和 `/api/plan/analyze` 将用户输入直接拼入 LLM prompt，攻击者可通过构造特殊指令覆盖系统 prompt。
2. **GitHub API 路径遍历**：`/api/github/repos/[owner]/[repo]/contents/[...path]` 未验证 owner/repo/path 格式，攻击者可用 `../` 或特殊字符注入。
3. **类型安全缺失**：大部分路由仅用 `if (!field)` 做哨兵检查，无法防止类型混淆（如 `pageIds: "string"` 而非数组）。
4. **JSON 解析崩溃**：`canvas generate` 路由对 Prisma 返回的 JSON 字段直接 `JSON.parse`，无 try-catch，生产环境可导致 500 错误。
5. **无统一验证层**：虽有 `validation.ts`（自定义规则引擎），但未被任何路由实际使用，形同虚设。

---

## 2. 核心 JTBD

| # | JTBD | 用户故事 | 优先级 |
|---|------|---------|--------|
| J1 | 作为开发者，我希望所有 API 路由有统一的输入验证机制，避免手动写 `if (!field)` 检查 | 后端路由收到请求后，自动通过 Zod Schema 校验，拒绝不合规请求，返回结构化错误信息 | P0 |
| J2 | 作为安全负责人，我需要防止 Prompt Injection 攻击，确保用户输入不会劫持 LLM 系统行为 | Chat 和 Plan API 对用户消息内容做长度限制、特殊格式过滤，并隔离 system prompt | P0 |
| J3 | 作为安全负责人，我需要防止 GitHub 导入功能的路径遍历和参数注入 | GitHub 相关 API 对 owner/repo/path 参数做格式白名单校验（字母数字下划线等） | P0 |
| J4 | 作为后端开发者，我希望 Prisma 模型关联的 JSON 字段在读取时有容错处理 | 所有 `JSON.parse` 操作包裹 try-catch，解析失败时返回友好错误而非 500 | P1 |
| J5 | 作为 QA，我希望每个 API 路由都有对应的 schema 测试用例 | 验证层提供自动化测试，覆盖正常请求、边界值、恶意构造 | P2 |

---

## 3. 技术方案选项

### 方案 A：Zod Middleware + Route-level Schema（推荐）

**核心思路**：在 Next.js Route Handler 层统一集成 Zod Schema 校验，覆盖所有 50 个路由。

**具体做法**：
1. 创建 `src/lib/api-validation.ts`：封装 Zod v4，提供 `withValidation(options)` 高阶函数
2. 为每个路由定义 Zod Schema（从 `validation.ts` 中的 routeSchemas 迁移到 Zod）
3. 中间件层捕获 Zod `ZodError`，返回 `{ success: false, error: {...} }` 格式
4. 针对 Chat/Plan API：添加 `z.string().max(10000)` + 特殊字符过滤
5. 针对 GitHub API：添加正则白名单 `z.string().regex(/^[a-zA-Z0-9_-]+$/)`
6. 对所有 `JSON.parse` 操作包裹 try-catch

**工时估算**：
| 阶段 | 任务 | 工时 |
|------|------|------|
| 1 | 搭建 `api-validation.ts` 框架 + Zod Schema 基础设施 | 4h |
| 2 | 覆盖 /api/auth、/api/projects、/api/users 系列（~15路由） | 4h |
| 3 | 覆盖 /api/chat、/api/plan/analyze（含 Prompt Injection 防护） | 4h |
| 4 | 覆盖 /api/github 系列（含路径遍历防护） | 3h |
| 5 | 覆盖 /api/v1 系列（Canvas、Canvas 生成相关） | 4h |
| 6 | JSON.parse 容错处理（全部路由扫描修复） | 2h |
| 7 | Jest 单元测试（每个 Schema 至少 3 个测试用例） | 5h |
| **合计** | | **26h（约 3.5 天）** |

**优点**：
- Zod v4 已安装在项目中（`zod: ^4.3.6`），零新增依赖
- 类型推导完整，IDE 支持好
- 渐进式实施，可分阶段覆盖

**缺点**：
- 需为每个路由手工定义 Schema，工作量较大
- 对遗留路由侵入性改造

---

### 方案 B：JSON Schema + ajv + Global Middleware

**核心思路**：使用 JSON Schema（RFC  draft-07）+ ajv 验证器，在 Next.js 中间件层全局拦截所有 API 请求。

**具体做法**：
1. 安装 `ajv` + `ajv-formats` + `fast-json-stringify`
2. 创建全局 `middleware.ts` 拦截 `/api/*` 请求
3. 使用 OpenAPI spec（项目已有 `openapi.json`）生成验证规则
4. 对请求体、Query、Path 参数统一验证
5. GitHub 路由单独白名单中间件

**工时估算**：
| 阶段 | 任务 | 工时 |
|------|------|------|
| 1 | ajv 集成 + 全局中间件搭建 | 6h |
| 2 | OpenAPI spec → JSON Schema 转换脚本 | 6h |
| 3 | 全局中间件 + GitHub 白名单 | 4h |
| 4 | 异常处理 + 错误格式标准化 | 3h |
| 5 | Prompt Injection 防护（Chat/Plan 路由独立处理） | 3h |
| 6 | 测试用例 | 5h |
| **合计** | | **27h（约 3.5 天）** |

**优点**：
- 可与现有 OpenAPI spec 联动
- 全局拦截，路由改动最小

**缺点**：
- JSON Schema 表达能力弱于 Zod（如 union types、coercion）
- ajv 错误信息可读性差
- 引入新依赖（ajv）

---

### 方案对比

| 维度 | 方案A（Zod Middleware） | 方案B（JSON Schema + ajv） |
|------|----------------------|--------------------------|
| 验证表达能力 | ⭐⭐⭐⭐⭐ Zod 原生类型推导 | ⭐⭐⭐ JSON Schema 有限 |
| 现有项目适配 | ⭐⭐⭐⭐ Zod v4 已安装 | ⭐⭐ 需新增 ajv 依赖 |
| 路由侵入性 | 中等（每路由显式注册 Schema） | 低（全局中间件） |
| 错误信息可读性 | ⭐⭐⭐⭐⭐ 结构化 + 字段级 | ⭐⭐⭐ 需额外格式化 |
| LLM 输入过滤 | ⭐⭐⭐⭐⭐ 可定制复杂规则 | ⭐⭐ 需配合额外逻辑 |
| 工时 | 26h | 27h |
| 推荐度 | ✅ **推荐** | ⚠️ 备选 |

---

## 4. 可行性评估

| 评估项 | 结论 | 说明 |
|--------|------|------|
| 技术可行性 | ✅ 高 | Zod v4 已安装，Next.js Route Handler 支持中间件模式 |
| 安全可行性 | ✅ 高 | GitHub 白名单正则、LLM 输入长度限制均可实现 |
| 兼容性 | ✅ 高 | 渐进式改造，不破坏现有功能 |
| 测试可行性 | ✅ 高 | Jest 已配置，Zod Schema 可直接导出用于测试 |
| 业务优先级 | ✅ 高 | 当前存在真实安全风险（P0 级别） |

---

## 5. 初步风险识别

| 风险 ID | 描述 | 概率 | 影响 | 缓解策略 |
|---------|------|------|------|---------|
| R1 | 路由 Schema 定义不完整，遗漏边界 case | 中 | 中 | 逐路由测试 + Code Review |
| R2 | Zod v4 与现有 validation.ts 混用导致冲突 | 低 | 中 | 废弃旧 validation.ts，统一迁移 |
| R3 | 过度验证导致正常请求被误拦截 | 中 | 中 | 设置合理的 length/payload 上限 |
| R4 | GitHub API 限流导致导入失败 | 中 | 低 | 添加 rate limit 退避 |
| R5 | 已有 API consumer 因验证加严而 BREAK | 中 | 高 | 制定 deprecation 策略，提前通知 |

---

## 6. 验收标准

### 6.1 安全验收

- [ ] `/api/chat` 拒绝 `message` 长度超过 10000 字符的请求，返回 400
- [ ] `/api/chat` 拒绝包含 `SYSTEM_PROMPT` 或 `##Instructions` 等 Prompt Injection 特征词的请求
- [ ] `/api/plan/analyze` 拒绝 `requirement` 超过 50000 字符的请求
- [ ] `/api/github/repos/[owner]/[repo]/contents/[...path]` 拒绝包含 `/`、`\`、`..` 的 owner/repo 参数
- [ ] 所有未通过 Zod Schema 校验的请求返回 `{ success: false, error: "Validation failed", details: [...] }` 格式

### 6.2 功能验收

- [ ] `/api/projects` POST 拒绝 `name` 为空字符串或纯空白
- [ ] `/api/auth/register` 拒绝无效邮箱格式（包含 RFC 5322 校验）
- [ ] `/api/auth/register` 拒绝弱密码（不满足大小写+数字+特殊字符）
- [ ] `/api/v1/canvas/generate` 拒绝非数组类型的 `pageIds`
- [ ] 所有 `JSON.parse` 操作包裹 try-catch，解析失败返回 400 而非 500

### 6.3 测试验收

- [ ] 每个 Zod Schema 至少 3 个测试用例（正常值、边界值、异常值）
- [ ] GitHub 路径遍历防护有 2 个以上攻击 Payload 测试
- [ ] Prompt Injection 防护有 2 个以上攻击 Payload 测试
- [ ] CI 中集成验证层测试，PR 失败时阻塞合并

---

## 附录：已识别漏洞摘要

```
🚨 [CRITICAL] /api/github/repos/[owner]/[repo]/contents/[...path] — 路径注入
   攻击面：owner/repo/path 参数未校验，可注入 "..", "../", 特殊字符
   建议：z.string().regex(/^[a-zA-Z0-9_-]+$/)

🚨 [HIGH] /api/chat — Prompt Injection + 无消息长度限制
   攻击面：超长消息 + 特殊指令可覆盖系统 prompt
   建议：message.z.string().max(10000) + 内容过滤

🚨 [HIGH] /api/plan/analyze — Prompt Injection
   攻击面：requirement 字段无长度限制，特殊指令可影响 AI 输出
   建议：requirement.z.string().max(50000) + 过滤

🚨 [MEDIUM] /api/v1/canvas/generate — JSON 解析崩溃
   攻击面：componentsJson/contextsJson 字段异常导致 500
   建议：try-catch 包裹 + z.object() 校验

🚨 [MEDIUM] 全局 — 无统一验证层
   问题：custom validation.ts 未被使用，路由各自为政
   建议：迁移到 Zod Schema + withValidation 中间件
```
