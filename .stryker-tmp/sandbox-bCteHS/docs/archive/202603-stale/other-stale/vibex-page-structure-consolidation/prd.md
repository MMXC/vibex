# PRD: VibeX 页面结构整合重构

**项目**: vibex-page-structure-consolidation  
**版本**: 1.0  
**日期**: 2026-03-21  
**PM**: PM Agent  
**状态**: In Progress  
**目标**: 消除 `/confirm`/`/design`/`/requirements` 三套并行流程，统一为 Homepage 单一入口

---

## 1. Problem Statement

### 1.1 问题描述

VibeX 存在四套并行的页面流程（`/`、`/confirm/*`、`/design/*`、`/requirements/*`），共用相同的 Store 但使用不同的 UI 组件，导致：
- 代码重复维护成本高（同一功能在 3-4 处实现）
- 用户体验不一致
- 状态管理分散，难以追踪
- 新人理解成本高（~35 个页面）

### 1.2 根因

历史演进 — 不同迭代时期创建的并行实现，从未统一整合。

### 1.3 影响范围

- **严重程度**: P1（重构，无 P0 阻塞）
- **影响用户**: 所有使用 `/confirm`、`/design`、`/requirements` 的用户
- **影响路径**: 路由重定向 + 页面合并

---

## 2. Success Metrics

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 并行流程消除率 | 100% | 无 `/confirm/*`、`/requirements/*` 页面可用 |
| Homepage 功能覆盖率 | ≥ 95% | 所有原 `/design/*` 核心步骤在 Homepage 可用 |
| 回归测试通过率 | 100% | E2E 测试全部通过 |
| 代码行数减少 | ≥ 2000 行 | 废弃目录删除前后对比 |
| 重定向成功率 | 100% | 访问旧路由返回 301/302 |

---

## 3. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US1 | 用户 | 访问 `/` 时有清晰的五步流程 | 不需要在多个入口之间选择 |
| US2 | 用户 | 访问旧路由（`/confirm/*`、`/requirements/*`）时自动跳转 | 不迷路，继续完成任务 |
| US3 | 开发者 | 修改一个功能只需要改一个地方 | 降低同步成本和遗漏风险 |
| US4 | 维护者 | 状态流清晰可追踪 | 快速定位和修复问题 |
| US5 | 用户 | `/design` 的 UI 生成和澄清功能仍然可用 | 核心设计工具不受影响 |

---

## 4. Epic Breakdown

### Epic 1: 路由重定向（止血）
**目标**: `/confirm/*` 和 `/requirements/*` 全部重定向到 `/`，导航栏移除废弃入口  
**工时**: 1 天  
**优先级**: P0  

| Story | 功能点 | 描述 | 验收标准 |
|-------|--------|------|----------|
| ST1.1 | Next.js 重定向配置 | 配置 `/confirm/*` → `/` 和 `/requirements/*` → `/` 的重定向 | expect(response.status).toBe(301); expect(header.location).toBe('/') |
| ST1.2 | 导航栏更新 | 移除导航栏中的 `/confirm` 和 `/requirements` 入口 | expect(screen.queryByRole('link', {name: /confirm/i})).toBeNull() |
| ST1.3 | Deprecation 注释 | 在废弃页面文件头部添加废弃说明注释 | expect(fileContent).toContain('@deprecated') |
| ST1.4 | 重定向验证测试 | E2E 测试访问旧路由能正确重定向 | page.goto('/confirm/context'); await expect(page).toHaveURL('/') 【需页面集成】 |

### Epic 2: Homepage 流程强化
**目标**: 确保 Homepage 包含所有核心步骤，覆盖用户工作流  
**工时**: 3-5 天  
**优先级**: P0  

| Story | 功能点 | 描述 | 验收标准 |
|-------|--------|------|----------|
| ST2.1 | 需求输入步骤 | StepRequirementInput 覆盖原 Requirements 流程需求 | expect(screen.getByRole('textbox', {name: /requirement/i})).toBeInTheDocument() 【需页面集成】 |
| ST2.2 | 限界上下文步骤 | StepBoundedContext 覆盖原 Confirm/Design 的 context | expect(screen.getByRole('button', {name: /generate context/i})).toBeInTheDocument() 【需页面集成】 |
| ST2.3 | 领域模型步骤 | StepDomainModel 覆盖原 Confirm/Design 的 model | expect(screen.getByRole('button', {name: /generate model/i})).toBeInTheDocument() 【需页面集成】 |
| ST2.4 | 业务流程步骤 | StepBusinessFlow 覆盖原 Confirm/Design 的 flow | expect(screen.getByRole('button', {name: /generate flow/i})).toBeInTheDocument() 【需页面集成】 |
| ST2.5 | Design 澄清步骤评估 | 评估 `/design/clarification` 是否需要迁移到 Homepage | 评估报告产出在 specs/clarification-assessment.md |
| ST2.6 | Design UI 生成步骤评估 | 评估 `/design/ui-generation` 是否需要迁移到 Homepage | 评估报告产出在 specs/ui-generation-assessment.md |

### Epic 3: Design 步骤合并（渐进迁移）
**目标**: 将 Design 流程中有价值的步骤合并到 Homepage  
**工时**: 5-7 天  
**优先级**: P1  

| Story | 功能点 | 描述 | 验收标准 |
|-------|--------|------|----------|
| ST3.1 | Clarification 步骤迁移 | 将 `/design/clarification` 功能合并到 Homepage Step 之间 | expect(page.url()).toMatch(/\/$/); expect(screen.getByText(/clarification/i)).toBeInTheDocument() 【需页面集成】 |
| ST3.2 | UI Generation 步骤集成 | 将 `/design/ui-generation` 作为 Homepage 最后一个可选步骤 | expect(screen.getByRole('button', {name: /generate ui/i})).toBeInTheDocument() 【需页面集成】 |
| ST3.3 | 状态管理统一 | 确认 `confirmationStore` 覆盖所有迁移后的状态需求 | expect(Object.keys(store.getState())).toContain('boundedContexts') |
| ST3.4 | 迁移后 E2E 测试 | 完整 Homepage 流程 E2E 测试通过 | expect(await page.evaluate(() => document.title)).toBeTruthy() |

### Epic 4: 废弃代码清理
**目标**: 删除 `/confirm`、`/requirements` 目录和废弃组件  
**工时**: 1-2 天  
**优先级**: P2（Phase 3 执行）  

| Story | 功能点 | 描述 | 验收标准 |
|-------|--------|------|----------|
| ST4.1 | `/confirm` 目录删除 | 删除 `src/app/confirm/` 目录 | expect(fs.existsSync('/confirm')).toBe(false) |
| ST4.2 | `/requirements` 目录删除 | 删除 `src/app/requirements/` 目录 | expect(fs.existsSync('/requirements')).toBe(false) |
| ST4.3 | 废弃组件清理 | 删除 `ConfirmationSteps` 和其他废弃组件 | expect(fs.existsSync('ConfirmationSteps.tsx')).toBe(false) |
| ST4.4 | 废弃 Store 清理 | 清理废弃的 store 代码 | expect(store).not.toContain('legacyConfirmationStore') |
| ST4.5 | 文档和路由图更新 | 更新 README 和路由图文档 | expect(readme).toContain('single entry point') |

---

## 5. 功能点总表

| ID | Epic | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|------|--------|------|----------|----------|
| F1.1 | Epic 1 | Next.js 重定向配置 | `/confirm/*` → `/`, `/requirements/*` → `/` | expect(status).toBe(301) | - |
| F1.2 | Epic 1 | 导航栏更新 | 移除废弃入口链接 | expect(link).toBeNull() | 【需页面集成】 src/components/layout/* |
| F1.3 | Epic 1 | Deprecation 注释 | 废弃文件添加 @deprecated 注释 | expect(content).toContain('@deprecated') | - |
| F1.4 | Epic 1 | 重定向验证 | E2E 验证旧路由重定向 | expect(url).toBe('/') | 【需页面集成】 |
| F2.1 | Epic 2 | 需求输入覆盖 | Homepage StepRequirementInput 完整 | expect(element).toBeInTheDocument() | 【需页面集成】 Homepage |
| F2.2 | Epic 2 | 限界上下文覆盖 | Homepage StepBoundedContext 完整 | expect(element).toBeInTheDocument() | 【需页面集成】 Homepage |
| F2.3 | Epic 2 | 领域模型覆盖 | Homepage StepDomainModel 完整 | expect(element).toBeInTheDocument() | 【需页面集成】 Homepage |
| F2.4 | Epic 2 | 业务流程覆盖 | Homepage StepBusinessFlow 完整 | expect(element).toBeInTheDocument() | 【需页面集成】 Homepage |
| F2.5 | Epic 2 | Clarification 评估 | 评估是否迁移 | 产出评估报告 | - |
| F2.6 | Epic 2 | UI Generation 评估 | 评估是否迁移 | 产出评估报告 | - |
| F3.1 | Epic 3 | Clarification 迁移 | 合并到 Homepage | expect(element).toBeInTheDocument() | 【需页面集成】 Homepage |
| F3.2 | Epic 3 | UI Generation 集成 | 作为可选步骤 | expect(element).toBeInTheDocument() | 【需页面集成】 Homepage |
| F3.3 | Epic 3 | 状态管理统一 | confirmationStore 覆盖全流程 | expect(keys).toContain('boundedContexts') | - |
| F3.4 | Epic 3 | 迁移后 E2E | 全流程测试通过 | expect(test).toPass() | 【需页面集成】 |
| F4.1 | Epic 4 | 删除 /confirm | 删除废弃目录 | expect(exists).toBe(false) | - |
| F4.2 | Epic 4 | 删除 /requirements | 删除废弃目录 | expect(exists).toBe(false) | - |
| F4.3 | Epic 4 | 废弃组件清理 | 删除 ConfirmationSteps 等 | expect(exists).toBe(false) | - |
| F4.4 | Epic 4 | 废弃 Store 清理 | 清理 legacy store | expect(store).not.toContain('legacy') | - |
| F4.5 | Epic 4 | 文档更新 | 更新 README 和路由图 | expect(doc).toContain('single entry') | - |

---

## 6. 优先级矩阵

| 功能 | 价值 | 成本 | 风险 | 优先级 |
|------|------|------|------|--------|
| F1.1 重定向 | 🔴 高 | 🟢 低 | 🟢 低 | **P0** |
| F1.2 导航栏更新 | 🔴 高 | 🟢 低 | 🟢 低 | **P0** |
| F1.3 Deprecation 注释 | 🟡 中 | 🟢 低 | 🟢 低 | **P0** |
| F1.4 重定向验证 | 🔴 高 | 🟢 低 | 🟢 低 | **P0** |
| F2.1-F2.4 Homepage 覆盖 | 🔴 高 | 🟡 中 | 🟡 中 | **P0** |
| F2.5-F2.6 评估 | 🟡 中 | 🟢 低 | 🟢 低 | **P1** |
| F3.1-F3.4 Design 合并 | 🟡 中 | 🔴 高 | 🟡 中 | **P1** |
| F4.1-F4.5 清理 | 🟢 低 | 🟡 中 | 🟡 中 | **P2** |

---

## 7. 实施计划

### Phase 1: 重定向（1 天）
1. 配置 Next.js 重定向
2. 更新导航栏
3. 添加 Deprecation 注释
4. E2E 测试验证

### Phase 2: Homepage 覆盖确认（3-5 天）
1. 确认所有核心步骤在 Homepage 完整
2. 评估 Design 独特功能
3. 迁移有价值的功能到 Homepage

### Phase 3: Design 合并（5-7 天）
1. 迁移 Clarification
2. 集成 UI Generation
3. 统一状态管理
4. 全流程 E2E 测试

### Phase 4: 清理（1-2 天）
1. 删除废弃目录和组件
2. 清理废弃 Store
3. 更新文档

---

## 8. API 规格

> 详细 API 定义见：[specs/api-spec-supplement.md](./specs/api-spec-supplement.md)

### 8.1 Homepage 步骤与 API 映射

| 步骤 | API 端点 | 方法 | 说明 |
|------|---------|------|------|
| 需求输入 | `/api/requirements` | POST | 创建需求 |
| 需求输入 | `/api/requirements/{id}/analyze` | POST | 触发 AI 分析 |
| 限界上下文 | `/api/domain-entities?requirementId=` | GET | 获取上下文列表 |
| 限界上下文 | `/api/requirements/{id}/domains` | POST | 创建上下文 |
| 澄清（可选） | `/api/requirements/{id}/clarifications` | GET | 获取澄清问题 |
| 澄清（可选） | `/api/clarifications/{id}` | PUT | 回答/跳过澄清 |
| 领域模型 | `/api/domain-entities?requirementId=` | GET/PUT/DELETE | 领域实体管理 |
| 业务流程 | `/api/flows/{id}` | GET/PUT/DELETE | 流程管理 |
| 业务流程 | `/api/flows/generate` | POST | AI 生成流程 |
| Design 保留 | `/api/requirements/{id}/ui-schema` | GET | 获取 UI Schema |

### 8.2 通用响应格式

```json
// 成功
{ "success": true, "data": { ... }, "timestamp": "..." }

// 失败
{ "success": false, "error": "错误消息", "code": "ERROR_CODE", "details": {} }
```

### 8.3 关键错误码

| 错误码 | HTTP Status | 说明 |
|--------|-------------|------|
| `AUTH_001` | 401 | 未认证 |
| `VALIDATION_001` | 400 | 参数错误 |
| `NOT_FOUND_001` | 404 | 资源不存在 |
| `NOT_FOUND_002` | 404 | 关联资源不存在 |

---

## 9. Out of Scope

- 不改变现有 Homepage 步骤的内部逻辑（仅迁移组件）
- 不合并 `designStore` 到 `confirmationStore`（Design 流程独立保留）
- 不修改 `/design/clarification` 和 `/design/ui-generation` 的内部功能（仅评估是否迁移）

---

## 10. Dependencies

| 依赖 | 说明 |
|------|------|
| analysis.md | Analyst 已产出 ✅ |
| vibex-homepage-flow-redesign | Homepage 流程已重构 ✅ |
| vibex-step-modular-architecture | 步骤已模块化 ✅ |
| vibex-proposal-five-step-flow | 五步流程已定义 ✅ |

---

## 11. Risks

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 用户已有 /confirm 书签 | 🟡 中 | 301 重定向保留 SEO |
| Design 有独特价值无法合并 | 🟡 中 | 评估后决定保留 |
| 迁移期间功能退化 | 🟡 中 | 每步骤完整测试 |
| 代码删除影响其他依赖 | 🔴 高 | 全面 grep + 单元测试 |

---

*PRD version 1.0 | PM Agent | 2026-03-21*
