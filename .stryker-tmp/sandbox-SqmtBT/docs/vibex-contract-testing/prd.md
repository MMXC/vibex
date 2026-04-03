# PRD: 前后端契约测试体系 — 2026-03-31

> **任务**: vibex-contract-testing/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **项目路径**: /root/.openclaw/vibex
> **产出物**: /root/.openclaw/vibex/docs/vibex-contract-testing/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | canvas-selection-filter-bug 的根因是前后端契约未对齐：前端发全部 contexts，后端不校验 confirmed 状态，导致静默错误 |
| **目标** | 建立 Zod Schema 契约 + CI 契约测试，防止同类问题再次发生 |
| **成功指标** | generateFlows 拒绝 unconfirmed contexts；CI 契约测试 blocking merge |

---

## 2. Epic 拆分

### Epic 1: API 契约 Schema 定义（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | Zod schema 文件建立（packages/types/api/canvas.ts） | 1h | `expect(fs.existsSync('packages/types/api/canvas.ts')).toBe(true);` |
| S1.2 | ContextSchema / GenerateFlowsRequestSchema / ResponseSchema | 1h | `expect(ContextSchema.shape).toHaveProperty('confirmed'); expect(GenerateFlowsRequestSchema.shape.contexts[0].types).toBeDefined();` |

**DoD**: 每个 canvas API 都有 Zod schema，关键字段（confirmed）已定义

---

### Epic 2: 后端输入校验中间件（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | validate.ts 中间件实现 | 1h | `expect(middleware).toBeDefined();` |
| S2.2 | generateFlows 集成校验 | 0.5h | `expect(validate({contexts:[{confirmed:false}]})).resolves.toHaveProperty('status', 400);` |
| S2.3 | generateComponents 集成校验 | 0.5h | `expect(validate({contexts:[], flows:[]})).resolves.toHaveProperty('status', 400);` |

**DoD**: 4 个 canvas API 均有校验，unconfirmed/undefined 时返回 400

---

### Epic 3: 前端 Response 校验（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | canvasApi.ts response 校验集成 | 0.5h | `expect(() => parseResponse(invalidResponse)).toThrow();` |
| S3.2 | 校验失败时的 error 处理 | 0.5h | `expect(console.error).toHaveBeenCalledWith(/schema.*failed/i);` |

**DoD**: 响应 schema 校验失败时记录错误，不静默使用脏数据

---

### Epic 4: CI 契约测试（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S4.1 | 契约测试目录建立（`__tests__/contract/`） | 0.5h | `expect(testDir).toBe('__tests__/contract/');` |
| S4.2 | generateFlows 契约测试（confirmed=false → 400） | 1h | `expect(api.generateFlows({contexts:[{confirmed:false}]})).resolves.toHaveProperty('status', 400);` |
| S4.3 | CI 配置：契约测试失败 blocking merge | 1h | `expect(contractTests).toBeIncludedInCI();` |

**DoD**: CI 中契约测试失败 block merge，preventive 捕获同类 bug

---

## 3. 验收标准总表

| ID | 条件 | 测试断言 |
|----|------|---------|
| AC-1 | generateFlows 拒绝 confirmed=false | `expect(api.generateFlows({contexts:[{confirmed:false}]})).resolves.toHaveProperty('status', 400);` |
| AC-2 | 响应校验失败时 console.error | `expect(console.error).toHaveBeenCalledWith(/schema/i);` |
| AC-3 | CI 契约测试 blocking | `expect(contractTestFailures).toBlockMerge();` |
| AC-4 | canvas-selection-filter 类 bug 在 CI 捕获 | `expect(contractTests).toCatch('unconfirmed-contexts');` |

---

## 4. 实施计划

| Epic | Story | 工时 | 负责人 |
|------|-------|------|--------|
| Epic 1 | S1.1+S1.2 Schema 定义 | 2h | architect |
| Epic 2 | S2.1+S2.2+S2.3 后端校验 | 2h | dev |
| Epic 3 | S3.1+S3.2 前端校验 | 1h | dev |
| Epic 4 | S4.1+S4.2+S4.3 CI 契约测试 | 2.5h | tester+dev |

**总工时**: 7.5h
