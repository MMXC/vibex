# PRD — canvas-api-500-fix

**Agent**: PM
**日期**: 2026-04-04 23:50
**仓库**: /root/.openclaw/vibex
**基于**: docs/canvas-api-500-fix/analysis.md

---

## 执行摘要

### 背景
`POST /api/v1/canvas/generate-contexts` 返回 500 错误，错误信息为 `TypeError: Promise did not resolve to Response`。用户无法使用 AI 生成限界上下文功能。其他三个 Canvas API（generate-flows、generate-components、snapshots）均正常。

### 目标
修复 generate-contexts 的 500 错误，增强错误处理，确保所有错误场景返回有意义的 HTTP Response 而非抛出未捕获异常。

### 成功指标
| KPI | 当前 | 目标 |
|-----|------|------|
| generate-contexts 成功率 | 0%（500错误） | ≥95% |
| 错误响应可读性 | 无（500崩溃） | 400/500 有明确错误信息 |
| API 健康检查 | 无 | 有（200/503） |

---

## Epic 总览

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | 错误处理增强 | 1h | P0 |
| E2 | API 健康检查端点 | 0.5h | P1 |
| E3 | 单元测试覆盖 | 0.5h | P1 |

---

## Epic 1: 错误处理增强

### Stories

#### Story E1-S1: 输入验证 — requirementText 空值检测
- **问题**: 未验证 `requirementText` 是否为空字符串，导致 AI 服务收到无效输入
- **工时**: 0.25h
- **验收标准**:
```typescript
// E1-S1.1: 空字符串返回 400
const res1 = await fetch('/api/v1/canvas/generate-contexts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ requirementText: '' }),
});
expect(res1.status).toBe(400);

// E1-S1.2: 纯空白字符串返回 400
const res2 = await fetch('/api/v1/canvas/generate-contexts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ requirementText: '   ' }),
});
expect(res2.status).toBe(400);

// E1-S1.3: 缺少 requirementText 字段返回 400
const res3 = await fetch('/api/v1/canvas/generate-contexts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
});
expect(res3.status).toBe(400);
```
- **页面集成**: 无

#### Story E1-S2: 环境变量验证 — MINIMAX_API_KEY 检查
- **问题**: API Key 缺失时 fetch 失败返回 500，应返回有意义的错误
- **工时**: 0.25h
- **验收标准**:
```typescript
// E1-S2.1: 无 API Key 时返回 500 但 body 包含 error 字段
// Mock 环境变量缺失场景
const res = await fetch('/api/v1/canvas/generate-contexts', {
  method: 'POST',
  body: JSON.stringify({ requirementText: '测试需求' }),
});
// 无论成功或失败，必须返回有效 Response（不抛出 Promise reject）
expect(res.status).toBeDefined();
const body = await res.json();
expect(typeof body).toBe('object');
```
- **页面集成**: 无

#### Story E1-S3: AI 服务错误捕获 — .catch() 处理
- **问题**: `aiService.generateJSON()` 抛出未捕获异常导致 500
- **工时**: 0.5h
- **验收标准**:
```typescript
// E1-S3.1: aiService.generateJSON 返回 { success: false } 时不抛异常
// 修改前: const result = await aiService.generateJSON(...)
// 修改后: const result = await aiService.generateJSON(...).catch(err => ({ success: false, error: err.message }))
// 验证: 调用后 response 始终为有效 Response 对象

// E1-S3.2: AI 返回错误时 response.status 为 500，body.error 有内容
const res = await fetch('/api/v1/canvas/generate-contexts', {
  method: 'POST',
  body: JSON.stringify({ requirementText: '测试' }),
});
expect(res.status).toBeLessThanOrEqual(500);
const body = await res.json();
expect(body).toHaveProperty('success');
expect(body).toHaveProperty('contexts');
expect(body.success).toBe(false);  // 预期失败因为无真实 AI key
```
- **页面集成**: 无

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E1-F1 | 输入验证 | requirementText 空值/缺失返回400 | expect(status === 400) | 无 |
| E1-F2 | 环境检查 | 无API Key时有意义错误响应 | expect(valid Response) | 无 |
| E1-F3 | AI错误捕获 | generateJSON().catch()防止500 | expect(valid Response) | 无 |

### DoD
- [ ] `generate-contexts/route.ts` 添加 `requirementText` 空值验证，返回 400
- [ ] `generate-contexts/route.ts` 添加 `MINIMAX_API_KEY` 缺失检查
- [ ] `aiService.generateJSON()` 调用添加 `.catch()` 防止未捕获异常
- [ ] 所有错误路径返回 `NextResponse.json()` 而非抛出异常
- [ ] API 返回的 JSON 始终包含 `success`、`contexts`、`error` 字段

---

## Epic 2: API 健康检查端点

### Stories

#### Story E2-S1: 健康检查端点实现
- **问题**: 无法快速判断 Canvas API 是否健康
- **工时**: 0.5h
- **验收标准**:
```typescript
// E2-S1.1: GET /api/v1/canvas/health 返回 200
const res = await fetch('/api/v1/canvas/health');
expect(res.status).toBe(200);

// E2-S1.2: 响应包含 status/hasApiKey/timestamp
const body = await res.json();
expect(body).toHaveProperty('status');       // 'healthy' | 'degraded'
expect(body).toHaveProperty('hasApiKey');    // boolean
expect(body).toHaveProperty('timestamp');    // ISO string

// E2-S1.3: hasApiKey=false 时 status 为 'degraded'
// Mock 环境变量缺失时
expect(body.status).toBe('healthy');
```
- **页面集成**: 无

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E2-F1 | 健康检查端点 | GET /api/v1/canvas/health | expect(status=200 && hasApiKey) | 无 |

### DoD
- [ ] 新增 `src/app/api/v1/canvas/health/route.ts`
- [ ] 端点检查 `MINIMAX_API_KEY` 是否存在
- [ ] 返回 `status: 'healthy' | 'degraded'` 和 `hasApiKey: boolean`

---

## Epic 3: 单元测试覆盖

### Stories

#### Story E3-S1: API 路由单元测试
- **问题**: generate-contexts 缺乏测试覆盖，无法验证修复正确性
- **工时**: 0.5h
- **验收标准**:
```typescript
// E3-S1.1: 空 requirementText 返回 400
expect(await testGenerateContexts({ requirementText: '' })).toMatchObject({ status: 400 });

// E3-S1.2: 有效输入返回 200 或 500（不崩溃）
const result = await testGenerateContexts({ requirementText: '在线预约系统' });
expect(result.status).toBeGreaterThanOrEqual(200);
expect(typeof result.body).toBe('object');

// E3-S1.3: 响应结构一致（无论成功失败）
const r1 = await testGenerateContexts({ requirementText: 'a' });
expect(r1.body).toHaveProperty('success');
expect(r1.body).toHaveProperty('contexts');
expect(r1.body).toHaveProperty('error');
```
- **页面集成**: 无

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E3-F1 | API单元测试 | generate-contexts + health 测试覆盖 | expect(all paths tested) | 无 |

### DoD
- [ ] `generate-contexts.test.ts` 覆盖 400/500/200 三种响应
- [ ] `health.test.ts` 覆盖 healthy/degraded 两种状态
- [ ] 所有测试 `npm test -- generate-contexts` 通过

---

## 验收标准汇总

### P0 验收（Epic1）

| 功能ID | 验收断言 | 测试方式 |
|--------|----------|----------|
| E1-F1 | `expect(status).toBe(400)` | Playwright/API 测试 |
| E1-F2 | `expect(valid Response object)` | API 测试 |
| E1-F3 | `expect(valid Response object)` | API 测试 |

### P1 验收（Epic2+3）

| 功能ID | 验收断言 | 测试方式 |
|--------|----------|----------|
| E2-F1 | `expect(status).toBe(200)` | Playwright |
| E3-F1 | `expect(all paths tested)` | 单元测试 |

### 最终验证
```bash
# API 错误不再出现
curl -X POST /api/v1/canvas/generate-contexts \
  -H 'Content-Type: application/json' \
  -d '{"requirementText":"测试"}'
# 期望: 200 或 500（不是 500 crash），body 有 success/error 字段

# 健康检查端点正常
curl /api/v1/canvas/health
# 期望: {"status":"healthy","hasApiKey":true,"timestamp":"..."}
```

---

## 非功能需求

| 类型 | 要求 |
|------|------|
| 兼容性 | Next.js 14 App Router |
| 性能 | API 响应时间 < 5s（AI 调用超时） |
| 错误规范 | 所有 API 错误返回 JSON body（含 success/error/contexts） |

---

**PRD 状态**: ✅ 完成
**下一步**: Architect 架构确认 → Dev 实现
