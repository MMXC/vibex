# Architecture: VibeX Service Layer Separation

**项目**: vibex-process-optimization
**版本**: 1.0
**日期**: 2026-03-19

---

## 1. 现状分析

当前 `src/services/` 结构：

```
services/
├── api/                    # BFF 层
│   ├── client.ts
│   ├── modules/            # 按领域分组的 API 调用
│   │   ├── auth.ts
│   │   ├── project.ts
│   │   ├── agent.ts
│   │   └── ...
│   └── types/
├── ai-client.ts           # AI 服务调用
├── plan/                  # Plan 领域
├── ddd/                   # DDD 领域 (Bounded Context, Domain Model, Flowchart)
├── figma/                 # Figma 导入
├── github/                # GitHub 集成
└── ...
```

**问题**:
1. **BFF/领域边界模糊** — api/ 同时承担了 BFF 和领域逻辑
2. **跨层调用** — 领域服务直接调用 API 模块，违反分层原则
3. **重复模式** — 各领域服务有相似的缓存/重试逻辑

---

## 2. 目标架构

```
src/
├── lib/                   # 共享基础设施
│   ├── api-unwrap.ts     # 响应解包工具
│   ├── api-response.ts    # 统一响应格式
│   └── utils/
├── services/
│   ├── bff/              # BFF 层 (前端适配)
│   │   ├── api-client.ts # HTTP 客户端
│   │   ├── auth-bff.ts   # 认证 BFF
│   │   ├── project-bff.ts
│   │   └── ...
│   ├── domain/           # 领域层
│   │   ├── project/      # Project 领域
│   │   │   ├── project-service.ts
│   │   │   └── project-types.ts
│   │   ├── ddd/          # DDD 领域
│   │   │   ├── bounded-context-service.ts
│   │   │   ├── domain-model-service.ts
│   │   │   └── flowchart-service.ts
│   │   └── plan/         # Plan 领域
│   └── infra/            # 基础设施层
│       ├── cache.ts      # 缓存抽象
│       ├── retry.ts      # 重试策略
│       └── auth.ts       # 认证基础设施
├── components/            # 表现层
└── stores/               # 状态管理
```

---

## 3. 分层职责

### 3.1 BFF 层 (`services/bff/`)

**职责**: 适配前端需求，聚合多个领域服务，格式化 API 响应

- 调用 `domain/` 服务
- 处理 HTTP 请求/响应
- 前端缓存策略
- 不包含业务逻辑

### 3.2 领域层 (`services/domain/`)

**职责**: 纯业务逻辑，无 HTTP/API 依赖

- 业务规则验证
- 领域模型序列化
- 跨领域协调
- 可被测试而不需要网络

### 3.3 基础设施层 (`services/infra/`)

**职责**: 技术实现细节

- HTTP 客户端封装
- 缓存实现
- 重试策略
- 认证令牌管理

---

## 4. 并行流程支持

5步流程中，独立步骤可以并行执行：

```typescript
// 并行执行独立的步骤
const [contexts, flow] = await Promise.all([
  boundedContextService.getContexts(projectId),
  flowchartService.getFlow(projectId),
]);

// 依赖链顺序执行
const contexts = await boundedContextService.getContexts(projectId);
const models = await domainModelService.analyze(contexts);
const flow = await flowchartService.generate(models);
```

---

## 5. 实施计划

| 阶段 | 任务 | 工作量 |
|------|------|--------|
| Phase 1 | 提取 `infra/` 层（cache, retry, auth） | 2h |
| Phase 2 | 创建 `domain/project/` 服务，迁移业务逻辑 | 4h |
| Phase 3 | 创建 `domain/ddd/` 服务，解耦 API 依赖 | 6h |
| Phase 4 | 更新 `bff/` 层调用 domain 服务 | 3h |

---

*Architecture - 2026-03-19*
