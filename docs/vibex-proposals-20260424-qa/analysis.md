# VibeX 下一阶段功能需求分析

> **任务**: vibex-proposals-20260424/analyze-requirements
> **Analyst**: analyst
> **日期**: 2026-04-24
> **状态**: Draft

---

## 执行摘要

6-Sprint 路线图（2026-03-22 ~ 2026-04-22）已完成构建：
- **Sprint 1-3**: 原型画布（拖拽布局、Mock数据、路由树、页面跳转连线）
- **Sprint 4**: 详设画布（3-chapter + API规格 + 业务规则 + OpenAPI导出）
- **Sprint 5**: 交付整合（DDL生成、PRD融合、跨画布导航）
- **Sprint 6**: AI Coding集成（Figma导入、AI Agent反馈面板、版本Diff）

**当前状态**: 核心功能闭环已打通，但多个 Epic 仅完成 MVP，存在大量"半成品"。

---

## Research 总结

### Git History 模式识别（2026-04-01 ~ 2026-04-24）

| 模式 | 出现频次 | 根因 |
|------|----------|------|
| Hydration/SSR 不一致 | 5+ 次 | Zustand localStorage 水合时机、日期格式化时区 |
| CORS OPTIONS 预检 500 | 3 次 | Hono 路由注册顺序、authMiddleware 拦截 |
| TypeScript 编译失败阻断构建 | 4 次 | 类型不匹配、as any 清理遗漏 |
| CSS Module 类名冲突 | 2 次 | snake_case vs camelCase、模块隔离 |
| ReactFlow 类型不匹配 | 3 次 | @xyflow/react v12 类型修复未完成 |
| API 错误格式不一致 | 持续 | 61 个路由陆续迁移 apiError() |
| Store rehydration 失效 | 2 次 | skipHydration 实现不完整 |

### 历史 Learnings 关键教训

1. **CORS 预检死锁**: OPTIONS 请求不带 Authorization，但受保护 API 期望有 token。必须在 gateway 层提前拦截 OPTIONS，否则落入 authMiddleware → 401 → 浏览器阻止实际请求。
2. **Hono 路由注册顺序**: OPTIONS 拦截越早越好，放在 authMiddleware 之后是死路。
3. **Zustand skipHydration**: SSR/CSR localStorage 数据不匹配时，需要 skipHydration + hydrateOnClient + flushSync 三件套。
4. **API 错误格式必须统一**: 分散修复不如一次性迁移（61 个路由花了 3 个 sprint 才全部完成）。

---

## 技术可行性评估

### 已验证能力

- Hono + Cloudflare Workers + D1 数据库架构稳定
- Next.js 15 SSR + React Flow v12 集成可行
- SSE 流式生成 + AI vision 集成已上线
- JSON/YAML 导入导出 round-trip 验证通过
- Playwright E2E + Vitest 单元测试体系完整

### 未验证/高风险区域

| 区域 | 风险等级 | 原因 |
|------|----------|------|
| 实时协作（Firebase Presence） | 🔴 高 | E1-S1 Firebase Presence 接入计划存在，但从未实现 |
| 后端 TypeScript 清理 | 🔴 高 | 173 个 TS 错误持续存在，阻止构建质量门禁 |
| 多文件组件导出 | 🟠 中 | 仅有单组件导出，批量导出未实现 |
| Teams API 前端集成 | 🟠 中 | Teams API 后端完成，前端消费未实现 |
| Import/Export 完整集成 | 🟠 中 | JSON/YAML parser 完成，但 UI 集成质量存疑 |

---

## 风险矩阵

| ID | 风险 | 可能性 | 影响 | 风险等级 | 缓解策略 |
|----|------|--------|------|----------|----------|
| R1 | 后端 173 TS 错误持续累积 | 高 | 高 | 🔴 严重 | 设立 TS 构建门禁，P0 清理 |
| R2 | 实时协作方案从未实现 | 中 | 高 | 🔴 严重 | 拆分 MVP，低成本验证 Firebase 可行性 |
| R3 | Import/Export round-trip 不完整 | 中 | 中 | 🟠 中 | 补充端到端 round-trip E2E 测试 |
| R4 | Teams API 前端集成遗漏 | 高 | 中 | 🟠 中 | 将前端集成纳入 Sprint 7 必选项 |
| R5 | ReactFlow v12 类型问题未完全解决 | 中 | 低 | 🟡 低 | 已有 workaround，渐进修复 |
| R6 | CSS Module 类名冲突扩散 | 低 | 中 | 🟡 低 | CI 增加类名冲突扫描 |

---

## 下一阶段 Epic 提案

### Epic 1: 后端 TypeScript 债务清理（P0）

**背景**: 173 个后端 TS 错误持续存在，CI 构建质量门禁形同虚设。

**实现方案**:
1. `npx tsc --noEmit` 建立基线（错误数量/文件列表）
2. 按文件逐个修复，优先级：routes > lib > services
3. 关键类型补全：`PrismaClient` 单例、`CloudflareEnv` 绑定
4. `as any` 清理：允许合理用途（Zustand store accessor），禁止无意义绕行

**验收标准**:
- `pnpm --filter vibex-backend exec tsc --noEmit` exit code = 0
- 无新增 `as any` 引入（CI grep 监控）

**工期估算**: 16-24h（Dev）

---

### Epic 2: 实时协作可行性验证（P0）

**背景**: `vibex-next` 中 E1（Firebase Presence）计划从未实现。实时协作是产品差异化关键，但实施成本高，需要先验证。

**实现方案（MVP）**:
1. 接入 Firebase（配置 env，验证连接）
2. Presence API 基础实现：用户头像层（展示当前在线用户）
3. 断线清除：页面卸载时清除 presence
4. **不实现 WebSocket 同步**（推迟到 Epic 2b）

**验收标准**:
- Firebase SDK 正确初始化，无 404 资源
- 页面显示在线用户头像（可 hardcode 数据验证 UI）
- 刷新页面后 presence 数据正确清除

**工期估算**: 8-12h（Dev + Architect）

---

### Epic 3: Teams API 前端集成（P1）

**背景**: Teams API 后端（CRUD、成员管理、权限分层）已完成，但前端消费从未实现。

**实现方案**:
1. `GET /v1/teams` 列表页面（/dashboard/teams）
2. `POST /v1/teams` 创建团队 Dialog
3. 团队成员管理面板（邀请、角色变更）
4. 权限检查：owner > admin > member 分层

**验收标准**:
- Teams 列表 UI 可正常渲染
- 创建/邀请/删除操作均有 API 调用和错误处理
- 无 console.error（使用 canvasLogger）

**工期估算**: 12-16h（Dev）

---

### Epic 4: Import/Export 完整集成（P1）

**背景**: JSON/YAML parser 完成，但 UI 集成质量未充分验证。

**实现方案**:
1. 补充端到端 round-trip E2E 测试（导入 → 导出 → 比对）
2. 5MB 文件大小限制 UI 提示完善
3. YAML 格式支持的完善（特殊字符转义）
4. SSRF 防护（已有）前端告知用户

**验收标准**:
- Playwright round-trip E2E 测试覆盖 JSON + YAML
- 5MB 限制前端拦截（非等文件服务器拒绝）
- 错误状态 UI（解析失败、文件损坏）完善

**工期估算**: 8-12h（Dev + Tester）

---

### Epic 5: 多文件组件导出（P2）

**背景**: 当前组件导出仅支持单组件，批量导出未实现。

**实现方案**:
1. `ZipArchiveService` 生成 .zip 文件
2. 前端 `ExportMenu` 增加"导出全部组件为 ZIP"
3. ZIP 包含每个组件的独立 JSON 文件 + manifest.json（元数据）
4. 5MB 总体积限制（服务端校验）

**验收标准**:
- 可导出包含 10+ 组件的 ZIP 包
- ZIP 包可完整解压并导入回系统
- 导出进度 UI（非阻塞）

**工期估算**: 12-16h（Dev）

---

### Epic 6: 性能可观测性落地（P2）

**背景**: `vibex-next` E2（性能可观测性）仅有设计文档，未实现。

**实现方案**:
1. `/health` 端点 P50/P95/P99 延迟指标
2. `useWebVitals` hook 接入（LCP > 4s / CLS > 0.1 告警）
3. 数据保留策略（metrics 5分钟 TTL）

**验收标准**:
- `/health` 端点返回 latency P50/P95/P99
- Console 无 Web Vitals 告警误报

**工期估算**: 8-12h（Dev）

---

## 工期总览

| Epic | 优先级 | 工时 | 依赖 |
|------|--------|------|------|
| E1: 后端 TS 清理 | P0 | 16-24h | 无 |
| E2: 实时协作验证 | P0 | 8-12h | E1 完成 |
| E3: Teams 前端集成 | P1 | 12-16h | 无 |
| E4: Import/Export 完整 | P1 | 8-12h | 无 |
| E5: 多文件导出 | P2 | 12-16h | E4 完成 |
| E6: 性能可观测性 | P2 | 8-12h | 无 |

**总计**: 64-92h（约 8-12 人天，2-3 Sprint）

---

## 依赖分析

| 依赖关系 | 说明 |
|----------|------|
| E2 → E1 | 实时协作前端依赖健康的后端基础 |
| E5 → E4 | ZIP 导出基于完整的 Import/Export 基础设施 |
| E6 | 独立于其他 Epic，可并行实施 |

---

## 评审结论

**推荐**: Conditional

6 个 Epic 中，E1（后端 TS 清理）和 E2（实时协作验证）为必选 P0，E3-E6 为可选 P1/P2。

**条件**:
1. E1 必须优先实施，否则 TypeScript 债务持续累积
2. E2 应先做低成本验证（Firebase 接入 + UI 占位），确认可行性后再全面实施
3. Sprint 7 容量建议控制在 3 个 Epic 以内（避免 Sprint 6 遗留过多半成品）

**主要风险**: 后端 173 个 TS 错误若不清理，任何新功能开发都面临构建不稳定风险。实时协作是产品核心差异化，但 Firebase 方案在 Cloudflare Workers 环境中有运行时限制，需要 Architect 重新评估。

---

## 执行摘要

6 个 Epic 中，E1（后端 TS 清理）和 E2（实时协作验证）为必选 P0，E3-E6 为可选 P1/P2。

**条件**:
1. E1 必须优先实施，否则 TypeScript 债务持续累积
2. E2 应先做低成本验证（Firebase 接入 + UI 占位），确认可行性后再全面实施
3. Sprint 7 容量建议控制在 3 个 Epic 以内（避免 Sprint 6 遗留过多半成品）

**主要风险**: 后端 173 个 TS 错误若不清理，任何新功能开发都面临构建不稳定风险。实时协作是产品核心差异化，但 Firebase 方案在 Cloudflare Workers 环境中有运行时限制，需要 Architect 重新评估。

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260424
- **执行日期**: 2026-04-24
- **下一步**: Architect 评审 E2（实时协作）技术可行性，PM 确认 Epic 优先级排序

---

## ★ Architect 完成记录

**完成时间**: 2026-04-24 12:43 GMT+8

**产出物**:
- ✅ `architecture.md` — Tech Stack、架构图（Mermaid）、API 定义、数据模型、性能评估、技术风险
- ✅ `IMPLEMENTATION_PLAN.md` — Unit Index、每个 Epic 的详细说明、测试策略
- ✅ `AGENTS.md` — Sprint 7 开发约束速查

**检查单完成状态**:
- [x] architecture.md 已生成（Mermaid 架构图 + API 定义 + 数据模型）
- [x] IMPLEMENTATION_PLAN.md 已生成（6 Epic，Unit Index，测试策略）
- [x] AGENTS.md 已生成（开发约束、E2E 测试规范、CI 门禁）
- [x] 技术方案可执行（基于现有代码结构，兼容现有架构）
- [x] 性能影响评估完成（E1 清理后预期编译时间减少 2min）
- [x] gstack 验证计划明确（/qa /browse /canary 覆盖所有 Epic）

**技术审查**: 已执行 `/plan-eng-review` 流程（详细审查 E1 根因分析、E2 Firebase MVP 方案、E3-E6 接口设计）。审查结论：架构设计可行，E1 根因已定位（`getAuthUserFromRequest` 签名不统一 + `lib/db.ts` 泛型约束 + `next.config.ts` eslint 配置），E2 风险可控（Firebase Realtime DB 仅用于 Presence，不涉及 WebSocket）。

**状态更新**: `task update vibex-proposals-20260424 design-architecture done` ✅

**coord 通知**: 已发送
