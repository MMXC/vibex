# API 服务层重构 PRD

**项目**: vibex-api-service-refactor  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement

`src/services/api.ts` 文件包含 **1471 行代码**，是一个典型的"上帝类"（God Class）反模式。文件将类型定义、HTTP 客户端配置、多个业务域的 API 方法全部集中在一个文件中，违反了单一职责原则（SRP），导致：
- 代码难以维护和测试
- 新增功能时容易引入回归
- 开发人员定位问题成本高

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 按业务域将 `api.ts` 拆分为 8-10 个独立模块
- 定义清晰的模块边界和依赖关系
- 确保拆分后无功能回归
- 提升测试覆盖率达到 > 60%

### 2.2 Non-Goals
- 不修改 API 业务逻辑
- 不改变现有接口的请求/响应格式
- 不添加新功能

---

## 3. Module Boundary Definition (模块边界定义)

### 3.1 核心模块 (8 个)

| # | 模块名 | 文件路径 | 职责 | 行数估算 |
|---|--------|---------|------|---------|
| 1 | `client.ts` | `src/services/api/client.ts` | Axios 实例 + 请求/响应拦截器 | ~60 |
| 2 | `auth.ts` | `src/services/api/modules/auth.ts` | 登录、注册、登出、当前用户 | ~80 |
| 3 | `user.ts` | `src/services/api/modules/user.ts` | 用户信息 CRUD | ~50 |
| 4 | `project.ts` | `src/services/api/modules/project.ts` | 项目 CRUD + 软删除 + 角色 | ~150 |
| 5 | `message.ts` | `src/services/api/modules/message.ts` | 消息 CRUD | ~60 |
| 6 | `flow.ts` | `src/services/api/modules/flow.ts` | 流程图 CRUD + AI 生成 | ~60 |
| 7 | `agent.ts` | `src/services/api/modules/agent.ts` | Agent CRUD | ~80 |
| 8 | `page.ts` | `src/services/api/modules/page.ts` | 页面 CRUD | ~80 |

### 3.2 扩展模块 (5 个)

| # | 模块名 | 文件路径 | 职责 | 行数估算 |
|---|--------|---------|------|---------|
| 9 | `domain-entity.ts` | `src/services/api/modules/domain-entity.ts` | 领域实体 CRUD | ~100 |
| 10 | `entity-relation.ts` | `src/services/api/modules/entity-relation.ts` | 实体关系 CRUD | ~100 |
| 11 | `prototype.ts` | `src/services/api/modules/prototype.ts` | 原型快照 CRUD | ~80 |
| 12 | `requirement.ts` | `src/services/api/modules/requirement.ts` | 需求 CRUD + 分析 | ~80 |
| 13 | `ddd.ts` | `src/services/api/modules/ddd.ts` | DDD 生成 API | ~50 |

### 3.3 工具模块 (3 个)

| # | 模块名 | 文件路径 | 职责 |
|---|--------|---------|------|
| 14 | `cache.ts` | `src/services/api/cache.ts` | 本地缓存读写 |
| 15 | `retry.ts` | `src/services/api/retry.ts` | 重试机制封装 |
| 16 | `index.ts` | `src/services/api/index.ts` | 统一导出入口 |

### 3.4 类型定义目录

```
src/services/api/types/
├── common.ts       # SuccessResponse, ApiError
├── auth.ts         # User, LoginRequest, AuthResponse
├── user.ts         # UserUpdate
├── project.ts      # Project, ProjectCreate, ProjectUpdate
├── message.ts      # Message, MessageCreate
├── flow.ts         # FlowData, FlowDataUpdate
├── agent.ts        # Agent, AgentCreate, AgentUpdate
├── page.ts         # Page, PageCreate, PageUpdate
└── prototype/      # AI 原型相关类型
    ├── index.ts
    ├── requirement.ts
    ├── domain.ts
    ├── analysis.ts
    └── ui-schema.ts
```

---

## 4. Migration Order (迁移顺序)

### 4.1 阶段 1: 准备工作 (Day 1)

| 步骤 | 操作 | 依赖 |
|------|------|------|
| 1.1 | 创建目录结构 `src/services/api/` | - |
| 1.2 | 提取类型定义到 `types/` 目录 | - |
| 1.3 | 补充现有 `api.ts` 单元测试 | - |

### 4.2 阶段 2: 基础设施拆分 (Day 1-2)

| 步骤 | 操作 | 依赖 |
|------|------|------|
| 2.1 | 提取 `client.ts` - Axios 实例 + 拦截器 | 1.1 |
| 2.2 | 提取 `cache.ts` - 缓存工具 | 2.1 |
| 2.3 | 提取 `retry.ts` - 重试机制 | 2.1 |

### 4.3 阶段 3: 业务模块拆分 (Day 2-3)

| 步骤 | 操作 | 迁移顺序 | 依赖 |
|------|------|---------|------|
| 3.1 | 提取 `auth.ts` | 1 (最低依赖) | 2.1 |
| 3.2 | 提取 `ddd.ts` | 1 (独立函数) | 2.1 |
| 3.3 | 提取 `user.ts` | 2 | 2.1, 3.1 |
| 3.4 | 提取 `project.ts` | 2 | 2.1, 3.1 |
| 3.5 | 提取 `message.ts` | 3 | 2.1, 3.3 |
| 3.6 | 提取 `flow.ts` | 3 | 2.1, 3.3 |
| 3.7 | 提取 `agent.ts` | 3 | 2.1, 3.3 |
| 3.8 | 提取 `page.ts` | 3 | 2.1, 3.3 |

### 4.4 阶段 4: 高级模块拆分 (Day 3)

| 步骤 | 操作 | 迁移顺序 | 依赖 |
|------|------|---------|------|
| 4.1 | 提取 `domain-entity.ts` | 4 | 3.4 |
| 4.2 | 提取 `entity-relation.ts` | 4 | 3.4 |
| 4.3 | 提取 `prototype.ts` | 4 | 3.4 |
| 4.4 | 提取 `requirement.ts` | 4 | 3.4, 4.1 |

### 4.5 阶段 5: 统一入口 (Day 3-4)

| 步骤 | 操作 | 依赖 |
|------|------|------|
| 5.1 | 创建 `index.ts` 统一导出 | 3.x, 4.x |
| 5.2 | 更新所有导入路径 | 5.1 |
| 5.3 | 删除原 `api.ts` | 5.2 |
| 5.4 | 运行完整测试套件 | 5.3 |

---

## 5. Definition of Done (验收标准)

### 5.1 功能验收

| # | 验收条件 | 测试方法 |
|---|---------|---------|
| DoD-1 | 所有 API 调用正常工作 | 手动测试 + 自动化测试 |
| DoD-2 | 认证拦截器正确注入 token | 审查代码 + 实际登录测试 |
| DoD-3 | 401 响应正确触发登出 | 模拟 401 响应测试 |
| DoD-4 | 缓存读写正常 | 清除缓存后验证数据加载 |
| DoD-5 | 重试机制正常 | 模拟网络失败验证重试 |
| DoD-6 | 所有导入路径已更新 | TypeScript 编译通过 |
| DoD-7 | 无循环依赖警告 | `npm run build` 无警告 |

### 5.2 质量验收

| # | 验收条件 | 目标值 |
|---|---------|-------|
| DoD-8 | 单元测试覆盖率 | > 60% |
| DoD-9 | TypeScript 编译 | 0 errors |
| DoD-10 | ESLint 检查 | 0 errors |
| DoD-11 | 功能回归测试 | 0 失败 |

### 5.3 回归测试用例

| 场景 | 预期结果 |
|------|---------|
| 用户登录 | 正常返回 token，存储到 localStorage |
| 获取项目列表 | 返回项目数组，包含分页信息 |
| 创建项目 | 创建成功，返回新项目对象 |
| 更新项目 | 更新成功，缓存自动清除 |
| 删除项目 | 软删除成功，列表不显示 |
| AI 生成流程图 | 返回 Mermaid 代码，渲染正常 |
| 离线模式 | 网络恢复后自动重发请求 |

---

## 6. Risk Mitigation

| 风险 | 等级 | 缓解措施 |
|-----|------|---------|
| 导入路径变更导致编译错误 | 🟡 中 | 使用统一导出 (index.ts)，逐步迁移 |
| 单例模式破坏 | 🟡 中 | 保持 client 单例，Facade 模式聚合 |
| 缓存键冲突 | 🟢 低 | 统一缓存键前缀规范 |
| 循环依赖 | 🟡 中 | 严格模块边界，依赖单向 |
| 测试覆盖缺失 | 🟡 中 | 先补充测试再拆分 |

---

## 7. Non-Functional Requirements

| 需求类型 | 要求 |
|---------|-----|
| **性能** | 拆分不影响 API 调用延迟 |
| **兼容性** | 保留原有 API 接口签名 |
| **可维护性** | 模块单一职责，代码可读 |
| **可测试性** | 每个模块可独立单元测试 |

---

## 8. Timeline Estimate

| 阶段 | 工作量 | 说明 |
|-----|-------|------|
| 阶段1: 准备 | 4h | 目录结构 + 类型提取 + 测试补充 |
| 阶段2: 基础设施 | 4h | client + cache + retry |
| 阶段3: 业务模块 | 8h | auth~page 8个模块 |
| 阶段4: 高级模块 | 4h | domain-entity~requirement 4个模块 |
| 阶段5: 统一入口 | 4h | index + 路径更新 + 删除旧文件 |
| **总计** | **24h (3人日)** | |

---

## 9. Dependencies

- **前置**: analyze-api-structure (已完成)
- **后续**: dev 实现
- **外部依赖**: axios, reactflow

---

## 10. File Change Summary

| 操作 | 文件数 |
|------|-------|
| 新增 | ~20 个文件 |
| 修改 | ~10 个文件 (导入路径) |
| 删除 | 1 个文件 (api.ts) |

---

*PRD 完成于 2026-03-05 (PM Agent)*
