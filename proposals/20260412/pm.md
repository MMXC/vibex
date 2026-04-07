# PM 提案 — 2026-04-12

**Agent**: pm
**日期**: 2026-04-12
**产出**: proposals/20260412/pm.md

---

## 1. PM 视角提案汇总

### 1.1 来自其他 Agent 的提案评审

| 来源 | 提案数 | PM 评审意见 |
|------|--------|-------------|
| Architect | 6 | 支持 A-P1-2（ErrorBoundary 补全），P1 优先级 |
| Dev | 9 | P001 TypeScript 修复应 P0 处理，阻塞 CI/CD |

---

## 2. PM 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P-P0-1 | developer-experience | TypeScript 编译错误 P0 修复 | CI/CD | P0 |
| P-P1-1 | developer-experience | packages/types API Schema 落地 | 类型安全 | P1 |
| P-P1-2 | reliability | Canvas 三栏 Error Boundary 补全 | 稳定性 | P1 |
| P-P1-3 | api-evolution | API v0→v1 迁移收尾 | API 版本 | P1 |
| P-P2-1 | developer-experience | 测试框架统一（Vitest） | DX | P2 |

---

## 3. 提案详情

### P-P0-1: TypeScript 编译错误 P0 修复

**优先级**: P0 — 全团队阻塞

**问题**: Dev 提案 P001 识别了 4 类 TypeScript 错误阻塞 CI/CD，包括：
- `EntityAttribute.required` 类型冲突
- `NextResponse` 值导入错误
- `Function` 泛型约束违反
- `CloudflareEnv` 不安全断言

**PM 评估**:
- **影响**: 阻塞所有开发工作，CI gate 失效
- **价值**: 修复后团队可正常提交代码

**建议**:
- 立即处理，纳入 Sprint 0 紧急修复
- 修复后添加 `pnpm tsc --noEmit` 到 CI pre-check

**工时**: 2h
**依赖**: 无

---

### P-P1-1: packages/types API Schema 深化落地

**优先级**: P1 — 长期类型安全

**来源**: Architect 提案 A-P1-1

**问题**: backend 和 frontend 并未完全引用共享的 `@vibex/types` 包，各端独立维护 API 类型存在不一致风险。

**PM 评估**:
- **影响**: API 契约不一致会导致隐性 bug
- **价值**: 统一类型定义后，类型检查覆盖率提升

**建议**:
- 先从无引用处开始，逐步替换
- 重点覆盖 `/api/v1/canvas/*` 路由

**工时**: 2h
**依赖**: 无

---

### P-P1-2: Canvas 三栏 Error Boundary 补全

**优先级**: P1 — 用户体验稳定性

**来源**: Architect 提案 A-P1-2

**问题**: ComponentTree / FlowTree / ContextTree 各栏无独立 ErrorBoundary，任一栏崩溃会导致整页白屏。

**PM 评估**:
- **影响**: 用户在某个面板出错时完全无法使用 Canvas
- **价值**: 独立恢复能力，减少 support ticket

**建议**:
- 优先处理 ComponentTree（用户最常用）
- 通用 ErrorBoundary 组件复用

**工时**: 1h
**依赖**: 无

---

### P-P1-3: API v0→v1 迁移收尾

**优先级**: P1 — API 版本管理

**来源**: Architect 提案 A-P1-3

**问题**: `/api/projects`, `/api/plan/analyze` 等 v0 路由尚未迁移到 v1，无 Deprecation Header。

**PM 评估**:
- **影响**: v0 API 无法追踪使用情况，难以规划下线
- **价值**: 明确的 API 版本策略便于未来演进

**建议**:
- 迁移后 frontend 统一使用 v1
- 添加 Sunset Header 提示客户端

**工时**: 2h
**依赖**: frontend team 配合更新调用方

---

### P-P2-1: 测试框架统一（Vitest）

**优先级**: P2 — Developer Experience

**来源**: Dev 提案 P008

**问题**: 后端同时使用 Jest 和 Vitest，维护两套配置增加认知负担。

**PM 评估**:
- **影响**: 开发者需理解两套测试配置
- **价值**: 统一后 CI 配置简化，新人上手更快

**建议**:
- 纳入技术债务清理 sprint
- 先在 backend 新文件试点，再迁移旧文件

**工时**: 2h
**依赖**: 无

---

## 4. PM 优先级建议

| 排序 | 提案 | 优先级 | 理由 |
|------|------|--------|------|
| 1 | P-P0-1 TypeScript 修复 | P0 | 阻塞所有开发 |
| 2 | P-P1-2 ErrorBoundary | P1 | 用户体验稳定性 |
| 3 | P-P1-1 packages/types | P1 | 长期类型安全 |
| 4 | P-P1-3 v0→v1 迁移 | P1 | API 版本管理 |
| 5 | P-P2-1 Vitest 统一 | P2 | DX 优化 |

---

## 5. Sprint 建议

**Sprint 0（紧急）**: P-P0-1 TypeScript 修复
**Sprint 1**: P-P1-2 + P-P1-1
**Sprint 2**: P-P1-3 + P-P2-1

---

*PM Agent | 2026-04-12*
