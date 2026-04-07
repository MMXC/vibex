# Reviewer 提案 — 2026-04-12

**Agent**: reviewer
**日期**: 2026-04-12
**基于**: E-P0-1 ~ E-P0-5 阶段审查发现

---

## P0 — 紧急（影响团队效率）

### R-P0-1: playwright.ci.config.ts grepInvert 需要自动化验证

**问题**: `playwright.ci.config.ts` 中的 `grepInvert: /@ci-blocking/` 是手动维护的排除规则。随着 CI 测试增加，@ci-blocking 标记的测试可能误用于正常测试场景，导致漏测。

**根因**: 
1. 无自动化检查 `@ci-blocking` 标记的测试是否应该被排除
2. 无 CI 门禁验证 grepInvert 配置的正确性

**修复方案**:
1. 添加 CI 检查：`grepInvert` 规则变更必须附带理由
2. 定期审计 `@ci-blocking` 标记的测试数量和用途
3. 考虑用 `@slow`/`@flaky` 替代 `@ci-blocking` 更精确分类

**验收标准**: `grepInvert` 配置变更记录在 CHANGELOG 或专门测试配置文档中

**影响**: 测试质量保障
**工时**: 1h

---

### R-P0-2: disconnectTimeout 常量未集中管理

**问题**: E-P0-6 设置 `disconnectTimeout=300000` (5min)，但这个值在 `connectionPool.ts` 中硬编码为默认值，理论上在 `CollaborationRoom.ts` 中可以 override，但未统一管理。

**根因**: WebSocket 超时配置分散在多个文件中，无统一配置源。

**修复方案**:
1. 在 `vibex-backend/src/config/` 中创建 `websocket.ts` 集中管理所有 WebSocket 配置
2. `ConnectionPool` 和 `CollaborationRoom` 从同一配置源读取超时值
3. 配置支持环境变量覆盖

```typescript
// src/config/websocket.ts
export const WEBSOCKET_CONFIG = {
  maxConnections: parseInt(env.MAX_CONNECTIONS || '100'),
  disconnectTimeout: parseInt(env.WS_DISCONNECT_TIMEOUT || '300000'),
  heartbeatInterval: parseInt(env.WS_HEARTBEAT_INTERVAL || '30000'),
} as const;
```

**验收标准**: `WEBSOCKET_CONFIG` 作为唯一配置源，所有 WebSocket 超时值从中读取

**影响**: 配置可维护性
**工时**: 0.5h

---

## P1 — 重要（提升代码质量）

### R-P1-1: HealthCheckResult 类型需要版本化

**问题**: `packages/mcp-server/src/health.ts` 中 `HealthCheckResult` 接口的 `version: '0.1.0'` 是硬编码字符串。如果 MCP 版本升级，health check 返回的版本可能与实际版本不同步。

**根因**: health.ts 中的 version 未从 package.json 或环境变量读取。

**修复方案**:
1. 从 `package.json` 读取 `version` 字段
2. 或在构建时通过 Vite/Webpack 注入版本号

```typescript
// 从 package.json 动态读取
import { version } from './package.json';

// 或使用 define 在构建时注入
// vite.config.ts: define: { __VERSION__: JSON.stringify(pkg.version) }
```

**验收标准**: `healthCheck.version === packageJson.version`

**影响**: 可观测性 + API 契约
**工时**: 0.3h

---

### R-P1-2: console.* 清理需要 pre-commit hook 守卫

**问题**: E-P0-10 的 `console.*` 清理是一次性的。开发者可能在未来 commit 中重新引入 `console.log`。

**根因**: `eslint no-console` 规则已有，但 CI `--max-warnings=0` 未严格执行（可能在某些 CI 阶段被绕过）。

**修复方案**:
1. 添加 pre-commit hook：`lint-staged` 在 commit 前运行 ESLint
2. 在 `.husky/pre-commit` 中运行 `pnpm lint --cached`
3. 确保 CI 阶段无法用 `--no-verify` 跳过

```bash
# .husky/pre-commit
pnpm lint-staged
```

**验收标准**: `console.log` 在 commit 前被 ESLint 拦截，无法进入 git history

**影响**: 代码清洁度长期保持
**工时**: 0.5h

---

## P2 — 改进（持续优化）

### R-P2-1: CHANGELOG 更新流程自动化

**问题**: 每次审查通过后，reviewer 需要手动更新 3 个 CHANGELOG 文件（root CHANGELOG.md、frontend CHANGELOG.md、changelog/page.tsx mockChangelog）。这个过程容易遗漏且重复。

**根因**: CHANGELOG 结构分散，格式不统一（root 用 markdown、frontend 用类似格式、page.tsx 用 JS 数组）。

**修复方案**:
1. 创建统一格式规范（推荐：[Keep a Changelog](https://keepachangelog.com/)）
2. 开发 CLI 工具自动更新所有 CHANGELOG 文件
3. 工具接受 `pnpm changelog:add <version> <entry>` 命令

```typescript
// scripts/update-changelog.ts
// 读取 proposals 条目 → 生成 markdown → 更新 root CHANGELOG.md
// 同时更新 frontend CHANGELOG.md
// 同时更新 page.tsx 的 mockChangelog 数组
```

**验收标准**: `pnpm changelog:add` 可以一键更新 3 个文件，格式统一

**影响**: 流程效率
**工时**: 2h

---

### R-P2-2: WebSocket 连接数监控可观测性

**问题**: `MAX_CONNECTIONS=100` 限制了 WebSocket 连接数，但没有监控告警。当连接数接近上限时，运维无法感知。

**根因**: 连接池仅有内存状态，无 metrics 上报。

**修复方案**:
1. 在 `ConnectionPool` 中添加 metrics 暴露方法
2. 集成到 MCP `/health` 端点的 checks 数组
3. 添加 `websocket_active_connections` 指标

```typescript
// health.ts checks 数组新增
{
  name: 'websocket_capacity',
  status: pool.getSize() < MAX_CONNECTIONS * 0.9 ? 'pass' : 'warn',
  message: `${pool.getSize()}/${MAX_CONNECTIONS} connections`,
}
```

**验收标准**: `/health` 返回中包含 WebSocket 连接数健康状态

**影响**: 可观测性
**工时**: 1h

---

## 提案汇总

| ID | 标题 | 优先级 | 工时 | 状态 |
|----|------|--------|------|------|
| R-P0-1 | grepInvert 自动化验证 | P0 | 1h | 待评审 |
| R-P0-2 | WebSocket 配置集中管理 | P0 | 0.5h | 待评审 |
| R-P1-1 | HealthCheckResult 版本同步 | P1 | 0.3h | 待评审 |
| R-P1-2 | console.* pre-commit hook | P1 | 0.5h | 待评审 |
| R-P2-1 | CHANGELOG 自动化更新 | P2 | 2h | 待评审 |
| R-P2-2 | WebSocket 连接数监控 | P2 | 1h | 待评审 |

**总工时**: 5.3h

---

*本文档由 Reviewer Agent 自动生成，基于 E-P0-1 ~ E-P0-5 阶段审查发现*
