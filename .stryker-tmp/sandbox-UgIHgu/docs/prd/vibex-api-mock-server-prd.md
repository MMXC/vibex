# API Mock 服务器 PRD

**项目**: vibex-api-mock-server  
**版本**: 1.0  
**日期**: 2026-03-06  
**状态**: Draft

---

## 1. Problem Statement

项目缺少 API Mock 服务器，测试依赖真实 API，导致：
- 集成测试依赖外部服务
- 开发调试不便
- 测试不稳定

**推荐方案**: MSW (Mock Service Worker)

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 每个 Epic 有明确验收标准
- P0 端点: 8 个核心 API

### 2.2 Non-Goals
- 不修改生产代码
- 不覆盖所有边界情况

---

## 3. Epic Breakdown

### Epic 1: MSW 基础架构 (P0)

| Story | 描述 | 工作量 |
|-------|------|--------|
| 1.1 | 安装 MSW 依赖 | 0.5h |
| 1.2 | 创建 browser.ts 配置 | 0.5h |
| 1.3 | 创建 node.ts 配置 | 0.5h |

### Epic 2: 认证 API Mock (P0)

| Story | 描述 | 工作量 |
|-------|------|--------|
| 2.1 | /auth/login Mock | 0.5h |
| 2.2 | /auth/register Mock | 0.5h |
| 2.3 | /auth/me Mock | 0.5h |
| 2.4 | /auth/logout Mock | 0.5h |

### Epic 3: 项目 API Mock (P0)

| Story | 描述 | 工作量 |
|-------|------|--------|
| 3.1 | GET /projects Mock | 0.5h |
| 3.2 | POST /projects Mock | 0.5h |
| 3.3 | GET /projects/:id Mock | 0.5h |
| 3.4 | PUT /projects/:id Mock | 0.5h |
| 3.5 | DELETE /projects/:id Mock | 0.5h |

### Epic 4: 其他 API Mock (P1)

| Story | 描述 | 工作量 |
|-------|------|--------|
| 4.1 | 消息 API Mock | 1h |
| 4.2 | 需求 API Mock | 1h |
| 4.3 | DDD API Mock | 1h |

### Epic 5: Jest 集成 (P1)

| Story | 描述 | 工作量 |
|-------|------|--------|
| 5.1 | setupServer 配置 | 0.5h |
| 5.2 | 集成到 jest.setup.ts | 0.5h |

---

## 4. Priority Matrix

### 4.1 P0 端点 (8 个)

| # | 端点 | 方法 | 模块 |
|---|------|------|------|
| 1 | /auth/login | POST | 认证 |
| 2 | /auth/register | POST | 认证 |
| 3 | /auth/me | GET | 认证 |
| 4 | /auth/logout | POST | 认证 |
| 5 | /projects | GET | 项目 |
| 6 | /projects | POST | 项目 |
| 7 | /projects/:id | GET | 项目 |
| 8 | /projects/:id | PUT | 项目 |

### 4.2 P1 端点 (12 个)

| # | 端点 | 方法 | 模块 |
|---|------|------|------|
| 9 | /projects/:id | DELETE | 项目 |
| 10 | /messages | GET | 消息 |
| 11 | /messages | POST | 消息 |
| 12 | /requirements | GET | 需求 |
| 13 | /requirements | POST | 需求 |
| 14 | /requirements/:id/analyze | POST | 需求 |
| 15 | /domain-entities | GET | DDD |
| 16 | /entity-relations | GET | DDD |
| 17 | /ddd/bounded-context | POST | DDD |
| 18 | /ddd/domain-model | POST | DDD |
| 19 | /ddd/business-flow | POST | DDD |
| 20 | /flows/:id | GET | 流程图 |

---

## 5. Acceptance Criteria (验收标准)

### 5.1 Epic 1: 基础架构

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-01 | MSW 依赖安装成功 | `npm list msw` |
| AC-02 | browser.ts 配置正确 | 代码审查 |
| AC-03 | node.ts 配置正确 | 代码审查 |

### 5.2 Epic 2: 认证 API

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-04 | /auth/login 返回 token | 实际请求测试 |
| AC-05 | /auth/register 返回用户 | 实际请求测试 |
| AC-06 | /auth/me 返回当前用户 | 实际请求测试 |
| AC-07 | /auth/logout 清除 session | 实际请求测试 |

### 5.3 Epic 3: 项目 API

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-08 | GET /projects 返回项目列表 | 实际请求测试 |
| AC-09 | POST /projects 创建项目 | 实际请求测试 |
| AC-10 | GET /projects/:id 返回项目 | 实际请求测试 |
| AC-11 | PUT /projects/:id 更新项目 | 实际请求测试 |
| AC-12 | DELETE /projects/:id 删除项目 | 实际请求测试 |

### 5.4 Epic 4: 其他 API

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-13 | 消息 API 正常响应 | 实际请求测试 |
| AC-14 | 需求 API 正常响应 | 实际请求测试 |
| AC-15 | DDD API 正常响应 | 实际请求测试 |

### 5.5 Epic 5: Jest 集成

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-16 | 测试中使用 Mock | 运行测试 |
| AC-17 | 测试隔离正常 | describe 分组测试 |

---

## 6. Definition of Done (DoD)

### 6.1 功能 DoD

| # | 条件 |
|---|------|
| DoD-1 | MSW 基础架构配置完成 |
| DoD-2 | P0 端点 (8个) Mock 实现 |
| DoD-3 | P1 端点 (12个) Mock 实现 |
| DoD-4 | Jest 集成完成 |
| DoD-5 | 开发环境可切换 Mock/真实 API |

### 6.2 质量 DoD

| # | 条件 |
|---|------|
| DoD-6 | Mock 数据符合实际 API 格式 |
| DoD-7 | 错误场景 Mock 完整 |
| DoD-8 | 测试可重复执行 |

---

## 7. File Structure

```
vibex-fronted/
├── src/
│   └── mocks/
│       ├── browser.ts
│       ├── node.ts
│       ├── handlers/
│       │   ├── auth.ts
│       │   ├── projects.ts
│       │   ├── messages.ts
│       │   ├── requirements.ts
│       │   └── ddd.ts
│       └── data/
│           ├── users.ts
│           ├── projects.ts
│           └── generators.ts
└── jest.setup.ts
```

---

## 8. Timeline Estimate

| Epic | 工作量 |
|------|--------|
| Epic 1: 基础架构 | 1.5h |
| Epic 2: 认证 API | 2h |
| Epic 3: 项目 API | 2.5h |
| Epic 4: 其他 API | 3h |
| Epic 5: Jest 集成 | 1h |
| **总计** | **10h (1.5 人日)** |

---

## 9. Dependencies

- **前置**: analyze-mock-needs (已完成)
- **依赖**: MSW 2.x, Jest

---

*PRD 完成于 2026-03-06 (PM Agent)*
