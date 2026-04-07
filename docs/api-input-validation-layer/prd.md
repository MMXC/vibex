# PRD: VibeX API 输入验证层

**项目**: api-input-validation-layer
**版本**: v1.0
**日期**: 2026-04-03
**状态**: PM 细化
**来源**: Analyst 需求分析报告

---

## 1. 执行摘要

### 背景
VibeX 后端约 50 个 API 路由，当前存在真实安全风险：
- GitHub 路径遍历漏洞（路径注入攻击面）
- Prompt Injection 漏洞（/api/chat、/api/plan/analyze）
- 类型安全缺失（仅 `if (!field)` 哨兵检查）
- JSON.parse 无容错（可导致 500 错误）
- 无统一验证层（validation.ts 形同虚设）

### 目标
建立统一的 Zod 输入验证层，覆盖全部 50 个路由，消除安全漏洞，确保 API 契约类型安全。

### 成功指标
| 指标 | 当前基线 | Sprint 目标 |
|------|----------|------------|
| 高风险路由验证覆盖率 | 0% | 100% |
| 中风险路由验证覆盖率 | 0% | >80% |
| API 500 错误率 | >0%（JSON.parse 崩溃） | 0% |
| Prompt Injection 防护 | 无 | 完整覆盖 /api/chat + /api/plan |
| GitHub 路径注入防护 | 无 | 完整覆盖 /api/github/* |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 依赖 |
|------|------|--------|------|------|
| E1 | Zod 验证基础设施 | P0 | 4h | 无 |
| E2 | 安全高风险路由 | P0 | 7h | E1 |
| E3 | 中风险路由覆盖 | P1 | 6h | E2 |
| E4 | JSON.parse 容错处理 | P1 | 2h | E1 |
| E5 | 自动化测试覆盖 | P2 | 5h | E2 |

**总工时**: 24h

---

### Epic 1: Zod 验证基础设施（P0）

#### 概述
搭建统一的 Zod 验证中间件框架，包括 `withValidation` 高阶函数和错误响应标准化。

#### Stories

**S1.1: Zod 验证框架**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望使用统一的高阶函数包装 API 路由 |
| 功能点 | `src/lib/api-validation.ts` 提供 `withValidation(schema, handler)` |
| 验收标准 | `expect(typeof withValidation).toBe('function')` + `expect(withValidation(z.object({}), handler)).toBeDefined()` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | 无 |

**S1.2: 标准化错误响应**
| 字段 | 内容 |
|------|------|
| Story | 作为 API consumer，我希望验证失败时收到结构化的错误信息 |
| 功能点 | 所有验证失败返回 `{ success: false, error: string, details: ZodError[] }` |
| 验收标准 | `expect(errorResponse).toMatchObject({ success: false, error: expect.any(String) })` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | S1.1 |

**S1.3: 验证中间件集成**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望中间件自动拦截不合规请求 |
| 功能点 | `src/middleware.ts` 拦截 `/api/*`，对 request.json() 做预校验 |
| 验收标准 | `expect(invalidBodyRequest.status).toBe(400)` + `expect(validRequest.status).toBe(200)` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | S1.1 |

#### DoD
- `withValidation` 函数可导出且类型安全
- 所有验证失败返回统一错误格式
- 中间件对 `/api/*` 路由生效

---

### Epic 2: 安全高风险路由（P0）

#### 概述
覆盖 GitHub 路径注入和 Prompt Injection 漏洞，这些是当前最高风险的安全漏洞。

#### Stories

**S2.1: GitHub 路径注入防护**
| 字段 | 内容 |
|------|------|
| Story | 作为安全负责人，我需要防止 GitHub 导入功能的路径遍历攻击 |
| 功能点 | `/api/github/repos/[owner]/[repo]/contents/[...path]` 验证 owner/repo/path 为字母数字下划线 |
| 验收标准 | `expect(fetch('/api/github/repos/../../../etc/passwd')).resolves.toMatchObject({ status: 400 })` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E1 |

**S2.2: Chat API Prompt Injection 防护**
| 字段 | 内容 |
|------|------|
| Story | 作为安全负责人，我需要防止用户消息劫持 LLM 系统行为 |
| 功能点 | `/api/chat` 限制 message 长度 ≤10000，过滤 `SYSTEM_PROMPT`/`##Instructions` 等特征词 |
| 验收标准 | `expect(sendMessage('A'.repeat(10001))).resolves.toMatchObject({ status: 400 })` + `expect(injectionPayload).toBeBlocked()` |
| 页面集成 | 无 |
| 工时 | 3h |
| 依赖 | E1 |

**S2.3: Plan API Prompt Injection 防护**
| 字段 | 内容 |
|------|------|
| Story | 作为安全负责人，我需要防止 requirement 字段的 Prompt Injection |
| 功能点 | `/api/plan/analyze` 限制 requirement ≤50000 字符 |
| 验收标准 | `expect(sendPlan('A'.repeat(50001))).resolves.toMatchObject({ status: 400 })` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E1 |

#### DoD
- GitHub 路径注入防护通过 3+ 个攻击 Payload 测试
- Chat/Plan API Prompt Injection 通过 2+ 个攻击 Payload 测试
- 所有高风险路由验证覆盖率 100%

---

### Epic 3: 中风险路由覆盖（P1）

#### 概述
覆盖 auth、projects、users、canvas-generate 等中风险路由。

#### Stories

**S3.1: Auth 路由验证**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 auth 路由有强类型校验 |
| 功能点 | `/api/auth/register` 邮箱 RFC 5322 校验 + 密码强度（大小写+数字+特殊字符）|
| 验收标准 | `expect(invalidEmail.status).toBe(400)` + `expect(weakPassword.status).toBe(400)` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E1 |

**S3.2: Projects 路由验证**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 projects 路由有完整类型校验 |
| 功能点 | `/api/projects` POST name 非空非纯空白，userId 为 UUID |
| 验收标准 | `expect(emptyName.status).toBe(400)` + `expect(invalidUUID.status).toBe(400)` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | E1 |

**S3.3: Canvas Generate 路由验证**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 canvas generate 路由有类型安全校验 |
| 功能点 | `/api/v1/canvas/generate` pageIds 必须为 string[]，拒绝类型混淆 |
| 验收标准 | `expect(stringPageIds.status).toBe(400)` + `expect(arrayPageIds.status).toBe(200)` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E1 |

**S3.4: 剩余路由覆盖**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望剩余路由都有基础类型校验 |
| 功能点 | /api/users、/api/templates 等 ~15 个路由覆盖 |
| 验收标准 | `expect(allRoutedSchemas.length).toBeGreaterThanOrEqual(15)` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E1 |

#### DoD
- Auth routes 通过邮箱格式 + 密码强度测试
- Projects routes 通过边界值测试
- 中风险路由验证覆盖率 > 80%

---

### Epic 4: JSON.parse 容错处理（P1）

#### 概述
为所有 JSON.parse 操作添加 try-catch，防止异常数据导致 500 错误。

#### Stories

**S4.1: 全局 JSON.parse 扫描修复**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 JSON.parse 操作都有容错处理 |
| 功能点 | 扫描所有 `JSON.parse(data)` → `try { JSON.parse(data) } catch { return error }` |
| 验收标准 | `expect(grepJSONParseWithoutTryCatch().length).toBe(0)` + `expect(malformedJSON.status).toBe(400)` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E1 |

#### DoD
- 全局无裸 JSON.parse
- 解析失败返回 400 而非 500

---

### Epic 5: 自动化测试覆盖（P2）

#### 概述
为每个 Zod Schema 编写测试用例，确保验证逻辑正确。

#### Stories

**S5.1: Schema 单元测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 QA，我希望每个 Schema 都有自动化测试 |
| 功能点 | 每个 Schema 至少 3 个测试用例（正常值、边界值、异常值）|
| 验收标准 | `expect(schatSchemaTests.length).toBeGreaterThanOrEqual(3)` |
| 页面集成 | 无 |
| 工时 | 3h |
| 依赖 | E2 |

**S5.2: 安全攻击 Payload 测试**
| 字段 | 内容 |
|------|------|
| Story | 作为安全负责人，我希望防护逻辑通过真实攻击 Payload 验证 |
| 功能点 | GitHub 路径遍历 3+ 个 Payload、Prompt Injection 2+ 个 Payload |
| 验收标准 | `expect(allAttackPayloadsBlocked).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | E2 |

#### DoD
- 每个 Schema ≥ 3 个测试用例
- 安全 Payload 测试覆盖率 100%
- CI 集成验证测试，PR 失败时阻塞

---

## 3. 验收标准汇总

| Epic | Story | 功能点 | expect() 断言 |
|------|-------|--------|--------------|
| E1 | S1.1 | Zod 框架 | `withValidation is function` |
| E1 | S1.2 | 错误响应 | `{ success: false, error, details }` |
| E1 | S1.3 | 中间件 | `invalidBody → 400, valid → 200` |
| E2 | S2.1 | GitHub 防护 | `pathTraversal → 400` |
| E2 | S2.2 | Chat 防护 | `longMsg → 400, injection → blocked` |
| E2 | S2.3 | Plan 防护 | `longReq → 400` |
| E3 | S3.1 | Auth | `invalidEmail → 400, weakPass → 400` |
| E3 | S3.2 | Projects | `emptyName → 400, invalidUUID → 400` |
| E3 | S3.3 | Canvas Gen | `wrongType → 400` |
| E3 | S3.4 | 剩余路由 | `≥15 schemas defined` |
| E4 | S4.1 | JSON.parse | `no bare JSON.parse, 400 on error` |
| E5 | S5.1 | Schema 测试 | `≥3 tests per schema` |
| E5 | S5.2 | Payload 测试 | `100% attack payloads blocked` |

**合计**: 5 Epic，13 Story，32 条 expect() 断言

---

## 4. Sprint 排期

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Sprint 1 Day 1 | E1 Zod 基础设施 | 4h | 框架就绪 |
| Sprint 1 Day 2-3 | E2 高风险路由 | 7h | 安全漏洞关闭 |
| Sprint 2 Day 1-2 | E3 中风险路由 | 6h | 路由覆盖 >80% |
| Sprint 2 Day 3 | E4 JSON 容错 | 2h | 无 500 错误 |
| Sprint 3 | E5 测试覆盖 | 5h | CI 集成 |

---

## 5. 非功能需求

| 类别 | 要求 |
|------|------|
| 性能 | 验证层 overhead < 5ms/route |
| 兼容性 | 不破坏现有 API consumer |
| 安全性 | 所有高风险路由 100% 覆盖 |
| 可维护性 | Schema 集中管理在 `src/lib/schemas/` |

---

## 6. 实施约束

- Zod v4 已安装（`zod: ^4.3.6`），零新增依赖
- 渐进式改造，每个路由独立测试后再上线
- GitHub 路径正则：`/^[a-zA-Z0-9_.-]+$/`
- Chat message 最大长度：10000 字符
- Plan requirement 最大长度：50000 字符
- 密码强度：大小写+数字+特殊字符，最少 8 位
