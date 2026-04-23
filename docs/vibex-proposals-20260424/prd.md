# VibeX Sprint 7 PRD — 债务清理与能力补全

> **项目**: vibex-proposals-20260424
> **PM**: pm
> **日期**: 2026-04-24
> **状态**: Draft
> **目标**: 基于 6-Sprint 完成状态，产出 Sprint 7 功能清单与验收标准

---

## 1. 执行摘要

6-Sprint 路线图已完成核心功能闭环，但存在两类问题：
1. **技术债务**：后端 173 个 TypeScript 错误持续累积，CI 构建门禁失效
2. **能力缺口**：多个 Epic 仅完成 MVP（实时协作从未实现、Teams API 前端未集成等）

Sprint 7 定位为**债务清理 + 能力补全**，共规划 6 个 Epic，其中 P0 必选 2 个，P1 可选 2 个，P2 备选 2 个。

---

## 2. Epic 1: 后端 TypeScript 债务清理

### 2.1 概述

| 字段 | 值 |
|------|-----|
| **Epic ID** | E1 |
| **优先级** | P0（必选） |
| **工期估算** | 16-24h（Dev） |
| **依赖** | 无 |

**背景**: `vibex-backend` 存在 173 个 TypeScript 编译错误，持续累积超过 3 个 Sprint。任何新功能开发都面临构建不稳定风险，CI 质量门禁形同虚设。

### 2.2 用户故事

**US-E1-1: 作为开发者，我希望 `pnpm tsc --noEmit` 零错误通过，这样新功能 PR 才能通过 CI 构建门禁**

- **当前状态**: `pnpm --filter vibex-backend exec tsc --noEmit` exit code = 1，173 个错误
- **目标状态**: exit code = 0，零错误

**US-E1-2: 作为维护者，我希望新增代码不引入 `as any`，这样类型安全不会退化**

- **约束**: CI grep 监控 `as any` 引入量，允许合理用途（Zustand store accessor），禁止无意义绕行

### 2.3 验收标准（Acceptance Criteria）

| ID | 验收标准 | 测试方式 |
|----|----------|----------|
| AC-E1-1 | `pnpm --filter vibex-backend exec tsc --noEmit` exit code = 0 | CI 构建验证 |
| AC-E1-2 | 无新增 `as any` 引入（以 `git diff HEAD~1` 为基准） | CI grep 脚本 |
| AC-E1-3 | 关键类型已补全：`PrismaClient` 单例、`CloudflareEnv` 绑定、API Response 类型 | 代码审查 |
| AC-E1-4 | `as any` 合理用途有注释说明：`// safe: Zustand store accessor` | 代码审查 |

### 2.4 实施步骤

1. **建立基线**: `npx tsc --noEmit > baseline_errors.txt`，记录错误数量/文件列表
2. **按优先级修复**: routes > lib > services
3. **关键类型补全**: PrismaClient 单例模式、CloudflareEnv 类型绑定、API Response 泛型
4. **as any 清理**: 允许合理用途，禁止无意义绕行
5. **CI 门禁**: 添加 tsc --noEmit 检查 + as any grep 监控

### 2.5 Definition of Done

- [ ] `pnpm --filter vibex-backend exec tsc --noEmit` exit code = 0
- [ ] `as any` 使用量不增加（允许合理用途）
- [ ] CI 构建通过
- [ ] 代码审查通过（无回归）

---

## 3. Epic 2: 实时协作可行性验证

### 3.1 概述

| 字段 | 值 |
|------|-----|
| **Epic ID** | E2 |
| **优先级** | P0（必选） |
| **工期估算** | 8-12h（Dev + Architect） |
| **依赖** | E1 完成 |

**背景**: `vibex-next` 中 E1（Firebase Presence）计划从未实现。实时协作是产品差异化关键，但 Firebase 方案在 Cloudflare Workers 环境中存在运行时限制，需要先低成本验证。

### 3.2 用户故事

**US-E2-1: 作为用户，我希望在画布上看到其他在线用户头像，这样我知道谁和我一起工作**

- **当前状态**: 无实时协作功能
- **目标状态**: Firebase Presence 接入，页面显示在线用户头像

**US-E2-2: 作为开发者，我希望验证 Firebase 在 Cloudflare Workers 环境的可行性，这样我可以判断是否继续投入**

- **MVP 范围**: Firebase SDK 初始化 + 用户头像展示层 + 断线清除
- **排除范围**: WebSocket 同步（推迟到 Epic 2b）

### 3.3 验收标准（Acceptance Criteria）

| ID | 验收标准 | 测试方式 |
|----|----------|----------|
| AC-E2-1 | Firebase SDK 正确初始化，无 404 资源 | Playwright E2E：检查网络请求 |
| AC-E2-2 | 页面显示在线用户头像（可 hardcode 数据验证 UI） | Playwright E2E：断言头像可见 |
| AC-E2-3 | 刷新页面后 presence 数据正确清除 | Playwright E2E：刷新后 presence 数据验证 |
| AC-E2-4 | 断线/页面卸载时 Firebase presence 正确清除 | Playwright E2E：beforeunload 验证 |
| AC-E2-5 | Architect 评审确认 Firebase + Cloudflare Workers 可行性 | 架构评审文档 |

### 3.4 实施步骤

1. **Firebase 配置**: env 变量接入，验证 SDK 连接
2. **Presence API 基础实现**: 用户头像层（展示当前在线用户）
3. **断线清除**: 页面卸载时清除 presence
4. **UI 验证**: Playwright E2E 验证头像显示
5. **Architect 评审**: Firebase + Cloudflare Workers 运行时限制评估

### 3.5 Definition of Done

- [ ] Firebase SDK 初始化成功，无 404
- [ ] 在线用户头像 UI 可正常显示
- [ ] 刷新/断线后 presence 正确清除
- [ ] Architect 产出可行性评审报告

---

## 4. Epic 3: Teams API 前端集成

### 4.1 概述

| 字段 | 值 |
|------|-----|
| **Epic ID** | E3 |
| **优先级** | P1（可选） |
| **工期估算** | 12-16h（Dev） |
| **依赖** | 无 |

**背景**: Teams API 后端（CRUD、成员管理、权限分层）已完成，但前端消费从未实现。用户无法通过 UI 管理团队。

### 4.2 用户故事

**US-E3-1: 作为团队管理员，我希望通过 UI 管理团队列表，这样我不需要用 curl 命令操作 API**

- **页面**: `/dashboard/teams`
- **功能**: 团队列表展示、创建团队 Dialog

**US-E3-2: 作为团队所有者，我希望通过 UI 管理成员和权限，这样我可以邀请/移除成员**

- **功能**: 团队成员管理面板（邀请、角色变更、删除）
- **权限分层**: owner > admin > member

### 4.3 验收标准（Acceptance Criteria）

| ID | 验收标准 | 测试方式 |
|----|----------|----------|
| AC-E3-1 | `GET /v1/teams` 列表 UI 可正常渲染，数据与 API 响应一致 | Playwright E2E |
| AC-E3-2 | `POST /v1/teams` 创建团队 Dialog 可用，提交后列表更新 | Playwright E2E |
| AC-E3-3 | 成员邀请/角色变更/删除操作均有 API 调用和错误处理 | Playwright E2E + console 监控 |
| AC-E3-4 | 无 `console.error`（使用 canvasLogger 替代） | Playwright E2E：console 断言 |
| AC-E3-5 | 权限检查生效：非 owner 无法删除团队，非 admin 无法变更角色 | Playwright E2E：权限验证 |

### 4.4 实施步骤

1. **团队列表页面**: `/dashboard/teams`，调用 `GET /v1/teams`
2. **创建团队 Dialog**: 表单验证 + `POST /v1/teams`
3. **成员管理面板**: 邀请/角色变更/删除操作
4. **权限分层**: owner > admin > member 分层 UI 控制

### 4.5 Definition of Done

- [ ] Teams 列表 UI 可正常渲染
- [ ] 创建/邀请/删除操作均有 API 调用
- [ ] 无 console.error（使用 canvasLogger）
- [ ] 权限分层生效

---

## 5. Epic 4: Import/Export 完整集成

### 5.1 概述

| 字段 | 值 |
|------|-----|
| **Epic ID** | E4 |
| **优先级** | P1（可选） |
| **工期估算** | 8-12h（Dev + Tester） |
| **依赖** | 无 |

**背景**: JSON/YAML parser 完成，但 UI 集成质量未充分验证，round-trip 端到端测试缺失。

### 5.2 用户故事

**US-E4-1: 作为设计师，我希望导入 JSON/YAML 文件后可以完整导出回来，这样我的数据不会丢失**

- **功能**: 端到端 round-trip 测试覆盖
- **约束**: 5MB 文件大小限制、YAML 特殊字符转义

**US-E4-2: 作为用户，我希望导入失败时看到友好提示，这样我知道哪里出了问题**

- **功能**: 错误状态 UI（解析失败、文件损坏）

### 5.3 验收标准（Acceptance Criteria）

| ID | 验收标准 | 测试方式 |
|----|----------|----------|
| AC-E4-1 | JSON round-trip E2E 测试通过（导入 → 导出 → 比对，无数据丢失） | Playwright E2E |
| AC-E4-2 | YAML round-trip E2E 测试通过（含特殊字符转义） | Playwright E2E |
| AC-E4-3 | 5MB 限制前端拦截，非等文件服务器拒绝 | Playwright E2E：断言错误提示 |
| AC-E4-4 | 解析失败时 UI 显示友好错误（文件名、错误类型） | Playwright E2E：断言错误提示 |

### 5.4 Definition of Done

- [ ] JSON + YAML round-trip E2E 测试通过
- [ ] 5MB 限制前端拦截
- [ ] 错误状态 UI 完善

---

## 6. Epic 5: 多文件组件导出

### 6.1 概述

| 字段 | 值 |
|------|-----|
| **Epic ID** | E5 |
| **优先级** | P2（备选） |
| **工期估算** | 12-16h（Dev） |
| **依赖** | E4 完成 |

**背景**: 当前组件导出仅支持单组件，批量导出未实现。用户无法一次性导出多个组件。

### 6.2 用户故事

**US-E5-1: 作为设计师，我希望一次性导出多个组件为 ZIP 包，这样我不需要逐个导出**

- **功能**: `ZipArchiveService` 生成 .zip 文件
- **内容**: 每个组件独立 JSON + manifest.json

### 6.3 验收标准（Acceptance Criteria）

| ID | 验收标准 | 测试方式 |
|----|----------|----------|
| AC-E5-1 | 可导出包含 10+ 组件的 ZIP 包，体积 < 5MB | Playwright E2E |
| AC-E5-2 | ZIP 包可完整解压并导入回系统（数据完整性） | Playwright E2E：解压验证 |
| AC-E5-3 | 导出进度 UI（非阻塞） | Playwright E2E：进度条验证 |

### 6.4 Definition of Done

- [ ] 10+ 组件 ZIP 导出成功
- [ ] ZIP 可完整解压并导入
- [ ] 进度 UI 非阻塞

---

## 7. Epic 6: 性能可观测性落地

### 7.1 概述

| 字段 | 值 |
|------|-----|
| **Epic ID** | E6 |
| **优先级** | P2（备选） |
| **工期估算** | 8-12h（Dev） |
| **依赖** | 无 |

**背景**: `vibex-next` E2（性能可观测性）仅有设计文档，未实现。无法量化系统性能状态。

### 7.2 用户故事

**US-E6-1: 作为运维人员，我希望看到 API 响应延迟 P50/P95/P99，这样我可以评估系统性能**

- **功能**: `/health` 端点返回 latency 指标

**US-E6-2: 作为前端开发者，我希望 Web Vitals 告警自动化，这样 LCP/CLS 问题可及时发现**

- **功能**: `useWebVitals` hook 接入，LCP > 4s / CLS > 0.1 告警

### 7.3 验收标准（Acceptance Criteria）

| ID | 验收标准 | 测试方式 |
|----|----------|----------|
| AC-E6-1 | `/health` 端点返回 `latency_p50`、`latency_p95`、`latency_p99` | curl + jq 验证 |
| AC-E6-2 | Console 无 Web Vitals 误报（阈值合理：LCP > 4s, CLS > 0.1） | Playwright E2E |
| AC-E6-3 | metrics 数据保留策略（5分钟 TTL） | 代码审查 |

### 7.4 Definition of Done

- [ ] `/health` 返回 P50/P95/P99 指标
- [ ] Web Vitals 告警无误报
- [ ] metrics 5分钟 TTL 策略实现

---

## 8. 优先级矩阵

| Epic | 名称 | 优先级 | 工时 | 依赖 | 价值 |
|------|------|--------|------|------|------|
| E1 | 后端 TS 债务清理 | P0 | 16-24h | 无 | 解除构建阻塞 |
| E2 | 实时协作可行性验证 | P0 | 8-12h | E1 | 验证产品差异化 |
| E3 | Teams API 前端集成 | P1 | 12-16h | 无 | 完整功能闭环 |
| E4 | Import/Export 完整集成 | P1 | 8-12h | 无 | 提升数据可靠性 |
| E5 | 多文件组件导出 | P2 | 12-16h | E4 | 提升导出效率 |
| E6 | 性能可观测性落地 | P2 | 8-12h | 无 | 运维能力补全 |

**Sprint 7 建议容量**: E1 + E2 + E3（48-52h，约 6 人天）

---

## 9. 依赖关系图

```
E1 (TS清理)
  ↓
E2 (实时协作) ──────────┐
  ↓                     ↓
E5 (多文件导出)    E3/E4/E6 (并行)
  ↑
E4 (Import/Export)
```

---

## 10. 风险与缓解

| ID | 风险 | 可能性 | 影响 | 缓解策略 |
|----|------|--------|------|----------|
| R1 | 后端 173 个 TS 错误超出估算 | 中 | 高 | 预留 buffer，每日 standup 同步进度 |
| R2 | Firebase + Cloudflare Workers 不兼容 | 中 | 高 | E2 优先做可行性验证，Architect 评审 |
| R3 | Teams 前端集成发现新的 API 问题 | 低 | 中 | AC-E3-3 全面覆盖 API 错误处理 |
| R4 | Import/Export round-trip 存在隐藏 bug | 中 | 中 | AC-E4-1/2 端到端测试覆盖 |

---

## 11. 执行决策

- **决策**: 待评审
- **执行项目**: vibex-proposals-20260424
- **执行日期**: 待定
- **下一步**: Architect 评审 E2（实时协作）技术可行性，Coord 确认 Sprint 7 容量

---

## 12. 附录

### 12.1 历史 Learnings（来自 Analysis）

| 模式 | 教训 |
|------|------|
| Hydration/SSR 不一致 | Zustand skipHydration + hydrateOnClient + flushSync 三件套 |
| CORS 预检死锁 | OPTIONS 拦截越早越好，放在 authMiddleware 之后是死路 |
| API 错误格式不一致 | 分散修复不如一次性迁移（61 个路由花了 3 个 sprint） |

### 12.2 Git History 关键问题

| 模式 | 出现频次 |
|------|----------|
| Hydration/SSR 不一致 | 5+ 次 |
| CORS OPTIONS 预检 500 | 3 次 |
| TypeScript 编译失败 | 4 次 |
| ReactFlow 类型不匹配 | 3 次 |
