# Architect 每日提案 — 2026-04-11

> **Author**: Architect Agent  
> **Date**: 2026-04-11  
> **Status**: `proposed`

---

## ARC-P0-1: 统一错误处理基础设施

**Summary**: 统一前后端的错误分类、映射和中间件实现，消除重复代码，提升可维护性。

**Problem**: 
- 前端 `src/lib/` 和后端 `src/lib/` 各有一套 ErrorClassifier、ErrorMiddleware、ErrorCodeMapper
- 错误处理逻辑分散，维护成本高
- 前后端错误码不统一，用户体验不一致

**Solution**:
```
packages/
  └── error-handling/           # 新共享包
      ├── src/
      │   ├── classifier.ts     # 统一错误分类器
      │   ├── mapper.ts         # 统一错误码映射
      │   ├── middleware.ts     # 统一中间件
      │   └── types.ts          # 共享类型定义
      └── package.json
```
- 后端/前端同时依赖此共享包
- 保留各端特定适配器，但共享核心逻辑
- 统一错误码前缀: NETWORK(E10), CLIENT(E40), SERVER(E50)

**Impact**: 
| Dimension | Impact |
|-----------|--------|
| Maintainability | +40% 减少重复代码 |
| Consistency | 统一错误用户体验 |
| Dev Experience | 单一错误处理学习成本 |

**Effort**: 6h

---

## ARC-P0-2: 前端 RBAC 权限控制缺失

**Summary**: 后端实现了完整 RBAC，但前端仅有目录结构无实际权限控制，需补全前端权限校验。

**Problem**:
- 后端 `lib/rbac.ts` 实现了角色权限矩阵 (admin/editor/viewer)
- 前端 `src/rbac/index.ts` 仅导出空模块，无权限校验
- 用户可在前端执行无权限操作（如删除），直到后端拒绝

**Solution**:
```typescript
// src/rbac/index.ts
export function hasPermission(role: UserRole, permission: Permission): boolean
export function usePermission(permission: Permission): boolean
export function requirePermission(permission: Permission): void

// 组件级防护示例
{hasPermission(userRole, 'delete') && (
  <DeleteButton onClick={handleDelete} />
)}
```

**Impact**:
| Dimension | Impact |
|-----------|--------|
| Security | 防止前端越权操作 |
| UX | 提前隐藏无权限按钮 |
| Consistency | 前后端权限一致 |

**Effort**: 4h

---

## ARC-P1-1: API 客户端统一重构

**Summary**: 统一前端 API 服务层，合并 `src/lib/api-resilience.ts` 和 `src/services/api/` 的重复实现。

**Problem**:
- `src/lib/api-resilience.ts`: axios + 重试 + 熔断
- `src/services/api/client.ts`: axios 客户端工厂
- `src/services/api/retry.ts`: 重试服务
- `src/services/api/cache.ts`: 缓存服务 (localStorage)
- 职责重叠，维护困难

**Solution**:
```
src/services/api/
├── client.ts        # 统一 HttpClient (合并 retry + circuit breaker)
├── cache.ts         # 缓存服务 (保留)
├── endpoints/       # 按域分组 API
│   ├── canvas.ts
│   ├── auth.ts
│   └── ...
└── index.ts         # 统一导出
```

**Impact**:
| Dimension | Impact |
|-----------|--------|
| Maintainability | +30% 减少重复 |
| Performance | 统一熔断策略 |
| Bundle Size | 可能减小 |

**Effort**: 4h

---

## ARC-P1-2: 建立 ADR 文档体系

**Summary**: 创建 Architecture Decision Records 目录，记录关键架构决策及其上下文。

**Problem**:
- 无 ADR 目录
- 架构决策散落在各 ARCH.md 文档中
- 新成员无法理解决策背景

**Solution**:
```
docs/adr/
├── 0001-use-nextjs-app-router.md
├── 0002-use-hono-for-backend.md
├── 0003-adopt-zustand-for-state.md
├── 0004-mermaid-for-diagrams.md
├── 0005-use-d1-for-storage.md
└── TEMPLATE.md
```

每条 ADR 包含:
- Status: proposed/accepted/deprecated/superseded
- Context: 决策背景
- Decision: 决定内容
- Consequences: 正面/负面影响

**Impact**:
| Dimension | Impact |
|-----------|--------|
| Onboarding | +50% 降低新成员理解成本 |
| Maintainability | 保留决策上下文 |
| Traceability | 可追溯架构演进 |

**Effort**: 3h

---

## ARC-P2-1: 状态管理治理

**Summary**: 审计并治理前端 Zustand stores，定义边界，减少耦合。

**Problem**:
- 20+ stores 存在，职责边界不清
- `designStore.ts` (综合), `confirmationStore.ts`, `templateStore.ts` 等
- Store 间可能有隐式依赖
- 缺少 store 文档

**Solution**:
1. 审计现有 stores，绘制依赖图
2. 按bounded context分组:
   - canvas/: flowStore, designStore
   - project/: templateStore, projectStore  
   - auth/: authStore
3. 创建 store index 文档
4. 提取共享逻辑到 hooks

**Impact**:
| Dimension | Impact |
|-----------|--------|
| Maintainability | +25% 降低耦合 |
| Debugging | 更容易定位问题 |
| Performance | 减少不必要的 re-render |

**Effort**: 6h

---

## ARC-P2-2: Next.js 版本对齐

**Summary**: 统一前后端 Next.js 版本，消除潜在的兼容性问题。

**Problem**:
- backend: `"next": "16.1.6"`
- frontend: `"next": "16.2.0"`
- API 可能存在 subtle 行为差异

**Solution**:
```bash
# 在 pnpm-workspace.yaml 中统一版本
# 或者使用 resolutions 强制统一
```

**Impact**:
| Dimension | Impact |
|-----------|--------|
| Reliability | 消除版本不一致风险 |
| Predictability | 行为一致 |

**Effort**: 1h

---

## ARC-P3-1: 后端 Auth 抽象

**Summary**: 将后端认证逻辑抽象为可复用模块，兼容多种认证方式 (JWT, OAuth, API Key)。

**Problem**:
- `lib/auth.ts` 硬编码 JWT 实现
- `lib/apiAuth.ts` 处理 API Key
- `lib/authFromGateway.ts` Gateway 认证
- 三套独立认证逻辑

**Solution**:
```
src/lib/auth/
├── strategy.ts       # 认证策略接口
├── jwt.ts            # JWT 实现
├── api-key.ts        # API Key 实现
├── gateway.ts        # Gateway 实现
└── index.ts          # 统一导出
```

**Impact**:
| Dimension | Impact |
|-----------|--------|
| Extensibility | 易于添加新认证方式 |
| Maintainability | 统一认证逻辑 |

**Effort**: 4h

---

## 实施建议

**优先级排序**:
1. **ARC-P0-1** (统一错误处理) - 基础架构，影响面广
2. **ARC-P0-2** (前端 RBAC) - 安全关键
3. **ARC-P1-1** (API 统一) - 日常开发高频
4. **ARC-P1-2** (ADR) - 长期价值
5. **ARC-P2-1** (状态管理) - 可渐进重构
6. **ARC-P2-2** (Next.js 对齐) - 简单快速
7. **ARC-P3-1** (Auth 抽象) - 可选，取决于需求

**预计总工时**: 28h
