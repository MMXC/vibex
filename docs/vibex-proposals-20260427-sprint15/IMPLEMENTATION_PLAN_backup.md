# Analysis: VibeX Sprint 15 功能提案规划

**Agent**: analyst
**项目**: vibex-proposals-20260427-sprint15
**日期**: 2026-04-28
**状态**: ✅ 完成

---

## 执行摘要

基于 Sprint 1-14 交付物盘点，识别 6 个高优先级功能增强方向。其中 1 个 Epic（E15-P001 AI Coding Agent）已在 Sprint 15 中提出，其余 5 个为建议增补。

**核心结论**：VibeX 已完成核心画布功能和 AI 辅助能力的基础建设。下一步应聚焦"从工具到平台"的跨越：真实 AI Agent 集成、多用户协作 merge 策略、Token 版本管理、规模化性能验证。

| 方向 | 优先级 | 可行性 | 备注 |
|------|--------|--------|------|
| E15-P001 AI Coding Agent 真实集成 | 🔴 P0 | ✅ | 已在 sprint 中 |
| Real-time merge 策略实现 | 🔴 P0 | ⚠️ 待验证 | E8 keep-local 为占位 |
| Token Versioning 落地 | 🟠 P1 | ✅ | S14 defer，S15 应落地 |
| 多用户协作 E2E | 🟠 P1 | ⚠️ 待验证 | Firebase presence 已就绪 |
| 性能/负载测试 | 🟠 P1 | ✅ | 无压测基础设施 |
| API Contract Integration Testing | 🟡 P2 | ✅ | 无 API 集成测试 |

---

## 1. Sprint 1-14 交付物盘点

### 1.1 按类别分组总结

| 类别 | Sprint | Epic | 交付内容 | 状态 |
|------|--------|------|---------|------|
| **画布核心** | S9 | E3 | 画布搜索（5-chapter 全文搜索、debounce 300ms） | ✅ |
| | S9 | E2 | 画布快捷键（Delete/Esc/? 键） | ✅ |
| | S10 | E6 | Canvas 本地持久化（Zustand persist） | ✅ |
| **代码生成** | S12 | E6 | AST 安全扫描（手写 walker，18-24ms/5000行） | ✅ |
| | S12 | E10 | 设计稿代码生成（TSX/CSS Module/ZIP 下载） | ✅ |
| | S14 | E1 | Design-to-Code Pipeline（token 提取、bidirectional sync） | ✅ R3 |
| **AI 能力** | S12 | E9 | AI 设计评审（MCP tool + compliance/a11y/reuse 分析） | ✅ |
| | S12 | E7 | MCP Server 可观测性（structured logging + sanitize） | ✅ |
| | S15 | P001 | AI Coding Agent 真实集成 | 🔄 进行中 |
| **协作** | S11 | E4 | Firebase 实时协作（presence avatars + cursor） | ✅ |
| | S12 | E8 | 冲突解决（LWW + ConflictDialog + Firebase lock） | ✅ |
| | S14 | E2 | Canvas Import/Export（JSON schema + 验证） | ✅ |
| **分析/数据** | S10 | E1 | Analytics API + Dashboard Widget（纯 SVG funnel） | ✅ |
| | S14 | E4 | Analytics Dashboard Enhancement（FunnelWidget + CSV export） | ✅ |
| **质量基础设施** | S7 | E1 | CI TypeScript Gate（tsc --noEmit gate） | ✅ |
| | S7 | E2 | Firebase 真实接入（零 SDK，fetch/EventSource） | ✅ |
| | S14 | E3 | E2E Test Coverage（Playwright suite） | ✅ R4 |
| | S12 | P001 | TypeScript 债务清理（197→0 errors） | ✅ |
| **基础设施** | S11 | E1 | 后端 TS 债务清理（Zod4 + DurableObject） | ✅ |
| | S14 | E1 | Design-to-Code Pipeline（feature flags + routing） | ✅ R3 |

### 1.2 技术成熟度矩阵

| 能力 | 成熟度 | 说明 |
|------|--------|------|
| 画布渲染 | ✅ 稳定 | S9 完成，E2E 覆盖 |
| 本地持久化 | ✅ 稳定 | Zustand persist |
| Firebase 协作 | ⚠️ 基础 | presence 已有，实时 merge 占位 |
| AI 设计评审 | ⚠️ mock | MCP tool 注册，真实 Figma 数据未验证 |
| AI 代码生成 | ⚠️ mock | CodeGenPanel 已有，真实 AI Agent 未接入 |
| Design-to-Code | ⚠️ beta | E1 R3 才通过，bidirectional sync 待验证 |
| Import/Export | ✅ 稳定 | JSON schema 1.2.0 |
| Analytics | ✅ 稳定 | FunnelWidget 纯 SVG |
| CI/CD | ✅ 稳定 | TypeScript gate + E2E |
| E2E 测试 | ⚠️ 建设中 | S14 E3 R4 才稳定 |

### 1.3 高频修改文件（技术债来源）

基于 git log 分析，以下文件被重复修改：

| 文件 | 修改频率 | 模式 | 风险 |
|------|---------|------|------|
| `DDSCanvasPage.tsx` | 极高 | 多 epic 争抢同一文件 | 🔴 merge conflict 高发 |
| `canvasStore.ts` / `DDSCanvasStore.ts` | 高 | 多 epic 读写同一 store | 🟠 状态同步风险 |
| `codeAnalyzer.ts` | 中 | S12 新增，尚未经历大型重构 | 🟡 无 |
| `ConflictDialog.tsx` | 高 | S12 E8 重写两次（ae5f566e1） | 🟠 接口不稳定 |
| `CodeGenPanel.tsx` | 高 | S12 E10 + S14 E3 修复 visibility | 🟠 UI 不稳定 |

**结构性建议**：引入模块化边界，每个 Epic 应有独立的 store/hook，不应在 `DDSCanvasPage.tsx` 中直接写入所有逻辑。

---

## 2. 历史教训（Learnings 检索）

| 教训 | 来源 | 影响 | 防范措施 |
|------|------|------|---------|
| mock store 过简导致假通过 | canvas-testing-strategy | Sprint 12 E6 测试通过但运行报错 | mock 必须模拟真实数据结构 |
| IMPLEMENTATION_PLAN scope drift | vibex-e2e-test-fix | E2/E3 task chain 永远 pending | IMPLEMENTATION_PLAN scope 对照 PRD |
| 虚假完成检测 | vibex-e2e-test-fix | project-level status 显示 completed 但子项全 pending | 完成判定需验证所有 Epic 状态 |
| CORS 预检不带 Auth | canvas-cors-preflight-500 | OPTIONS → auth → 401 → 死锁 | gateway 层单独处理 OPTIONS |
| 路由顺序敏感 | canvas-api-completion | /latest 被 :id 匹配 | 路由优先级需标注并测试 |
| fix commit 模式 | Sprint 12 自有 | 3 次修复 commit（E8×2, E10×1） | 修复 commit 应触发 re-review |

---

## 3. 提案分析：已提出的 Epic

### E15-P001 — AI Coding Agent 真实集成

**目标**：将 CodeGenPanel 的 mock 生成替换为真实 AI Agent 调用，实现 Design-to-Code 端到端闭环。

**技术路径选项**：

**方案 A：Direct API Integration（推荐）**
- 路由：`POST /api/v1/agent/generate`
- 调用外部 AI Agent REST API，传入 DesignContext
- 优点：实现简单，解耦清晰，可独立测试
- 缺点：需要 AI Agent API 稳定 endpoint

**方案 B：MCP Server Integration**
- 通过 MCP protocol 调用 AI Agent
- 优点：复用 S12 E9 的 MCP infrastructure
- 缺点：需要 MCP server 环境配置（尚未完成）

**可行性**：✅ 高
- S14 E1 已完成 DesignContext 类型定义
- S12 E10 CodeGenPanel UI 已就绪
- S12 E7 MCP logging infrastructure 可复用
- 当前风险：AI Agent API contract 尚未定义

**风险**：
- R1: AI Agent API 不稳定（影响：端到端不通）→ 缓解：定义 API contract 后再开发
- R2: DesignContext 格式与 AI Agent 期望不匹配（影响：生成结果质量差）→ 缓解：Mock service 先验证 pipeline

---

## 4. 建议增补 Epic

### 🔴 P0 — Real-time Merge 策略实现

**现状**：Sprint 12 E8 ConflictDialog 使用 `onConflict: 'keep-local'` 作为占位，真实合并逻辑未实现。

**目标**：实现 LWW merge + 3-way merge 双策略，让多用户协作从"冲突解决"升级为"冲突预防"。

**技术路径**：
- S1: 检测 conflictStore.checkConflict 的不同版本差
- S2: 实现 `mergeRemote(local, remote, strategy)` 核心逻辑
- S3: UI：ConflictBubble 显示 merge 预览
- S4: E2E：多用户并发编辑场景测试

**工期估算**：6h（1 sprint）
**可行性**：⚠️ 中（需要 Firebase RTDB schema 支持）

---

### 🟠 P1 — Token Versioning 落地

**现状**：Sprint 14 E5 因 S13-E2 未完成而 defer 到 Sprint 15。当前无 token 版本管理。

**目标**：实现 token 版本历史、diff、rollback，支撑 Design-to-Code bidirectional sync。

**技术路径**：
- S1: TokenPaletteStore.versions[] 持久化（localStorage 或 API）
- S2: saveVersion / restoreVersion / diff 逻辑
- S3: UI：VersionHistoryPanel + DiffView
- S4: E2E：save/restore/diff 完整流程

**工期估算**：5h
**可行性**：✅ 高（S14 architecture.md 已有完整 data model）

---

### 🟠 P1 — 多用户协作 E2E 验证

**现状**：Sprint 14 E3 E2E 测试已覆盖 CodeGenPanel，但多用户并发场景无测试。

**目标**：为 Firebase realtime collaboration 编写 Playwright 多用户 E2E 测试。

**技术路径**：
- S1: 编写 presence-avatars.spec.ts（两个浏览器实例）
- S2: 编写 conflict-resolution-multiuser.spec.ts
- S3: 验证 Firebase RTDB lock 60s timeout
- S4: 验证 graceful fallback（Firebase unconfigured）

**工期估算**：3h
**可行性**：✅ 高（Playwright 支持多 browser contexts）

---

### 🟠 P1 — Performance Baseline 建立

**现状**：无性能测试基础设施。S12 E6 有 perf test（18-24ms/5000行），但无端到端压测。

**目标**：建立性能基准，确保 500+ 节点画布流畅运行。

**技术路径**：
- S1: 使用 Playwright + Lighthouse CI 建立性能 baseline
- S2: 测试指标：LCP / CLS / TTI / Canvas render time
- S3: 设置性能回归告警（与 baseline 偏差 >20%）
- S4: 大规模节点测试（500+ nodes）

**工期估算**：4h
**可行性**：✅ 高（Lighthouse CI 开箱即用）

---

### 🟡 P2 — API Contract Integration Testing

**现状**：单元测试覆盖工具函数，但 API route 集成测试缺失。

**目标**：为 `/api/v1/canvas/export`、`/api/v1/analytics/funnel` 等关键 API 编写 Vitest + MSW 集成测试。

**技术路径**：
- S1: 定义 API contract（request/response schema）
- S2: 编写 API 集成测试（Vitest + MSW）
- S3: 覆盖 happy path + error cases
- S4: CI gate：集成测试必须通过才能 merge

**工期估算**：3h
**可行性**：✅ 高

---

## 5. 风险矩阵（建议增补 Epic）

| # | Epic | 风险描述 | 可能性 | 影响 | 级别 | 缓解 |
|---|------|---------|--------|------|------|------|
| R-M1 | Merge | 真实 merge 策略设计复杂，可能影响 E8 已完成功能 | 🟠 中 | 🟠 中 | 🟠 中 | 先做 keep-remote，观察效果再扩展 |
| R-M2 | Merge | Firebase RTDB schema 可能需要迁移 | 🟡 低 | 🟠 中 | 🟡 低 | 参考 S14 E4 RTDB 模式 |
| R-M3 | TokenVer | S13-E2 未交付导致前提条件缺失 | 🟡 低 | 🟠 中 | 🟡 低 | Token 版本可先做 localStorage 存储，API 层后续加 |
| R-M4 | E2E Multi | Firebase test environment 需要真实配置 | 🟠 中 | 🟡 低 | 🟡 低 | Mock Firebase + 真实 RTDB fallback |
| R-L1 | Perf | Lighthouse CI 与手头环境兼容性问题 | 🟡 低 | 🟡 低 | 🟡 低 | 先手动验证再 CI 集成 |
| R-L2 | API | MSW mock 与真实 API 行为可能不一致 | 🟡 低 | 🟡 低 | 🟡 低 | 保留真实 endpoint 测试作为 smoke test |

---

## 6. 验收标准

### E15-P001 — AI Coding Agent 真实集成

- [ ] `POST /api/v1/agent/generate` 端到端可调用（mock 或真实）
- [ ] DesignContext 传入 AI Agent 并返回 CodeGenResponse
- [ ] CodeGenPanel 显示真实生成的代码（而非 mock）
- [ ] `pnpm exec tsc --noEmit` → 0 errors
- [ ] API error 时 graceful degradation（显示错误提示而非崩溃）

### Real-time Merge 策略

- [ ] `mergeRemote(local, remote, 'lww')` 正确合并节点
- [ ] `mergeRemote(local, remote, '3way')` 正确合并节点
- [ ] ConflictBubble 显示 merge 预览（若 merge 可行）
- [ ] 多用户并发 E2E 测试覆盖
- [ ] Firebase RTDB lock 60s timeout 验证

### Token Versioning

- [ ] `saveVersion('v1.0')` 创建不可变快照
- [ ] `restoreVersion(versionId)` 恢复历史版本
- [ ] `diff(v1, v2)` 返回 added/removed/changed tokens
- [ ] VersionHistoryPanel UI 可浏览版本列表
- [ ] E2E：save → modify → restore → verify 流程

### 多用户协作 E2E

- [ ] `presence-avatars.spec.ts`：两个 browser context，验证实时头像
- [ ] `conflict-resolution-multiuser.spec.ts`：验证冲突检测和 ConflictDialog
- [ ] Firebase unconfigured 时 graceful fallback 正常

### Performance Baseline

- [ ] Lighthouse CI 配置完成，baseline 保存
- [ ] LCP < 2500ms / CLS < 0.1 / TTI < 3500ms
- [ ] 500 节点画布 render time < 500ms
- [ ] 性能回归告警正常触发（>20% 偏差）

### API Contract Integration Testing

- [ ] `/api/v1/canvas/export` 集成测试覆盖 happy path + error cases
- [ ] `/api/v1/analytics/funnel` 集成测试覆盖 7d/30d + error cases
- [ ] CI gate 包含集成测试

---

## 7. 结论

### 评审结论：推荐通过（Recommended）

E15-P001 AI Coding Agent 真实集成是最高优先级，已在 Sprint 15 中提出。配合 5 个建议增补 Epic，VibeX 可在 Sprint 15 完成从"工具原型"到"生产可用平台"的关键跨越。

**优先级排序**：
1. 🔴 E15-P001 AI Coding Agent（已在 sprint）
2. 🔴 Real-time Merge 策略（协作核心功能）
3. 🟠 Token Versioning（Design-to-Code bidirectional 前提）
4. 🟠 多用户协作 E2E（质量保障）
5. 🟠 Performance Baseline（规模化前提）
6. 🟡 API Contract Testing（工程质量）

**已知风险**：
- E15-P001 依赖 AI Agent API contract 定义，若 contract 未就绪可能影响开发进度
- Real-time Merge 与现有 E8 代码存在集成风险，需单独 regression 测试
- Token Versioning 依赖 localStorage 持久化方案，API 层方案待定

### 量化评估

| 维度 | 得分 | 说明 |
|------|------|------|
| Sprint 交付完整性 | 95% | S1-14 核心功能均已交付 |
| 技术债务可见性 | ✅ | 高频修改文件已识别 |
| 下一 sprint 方向清晰度 | ✅ | 6 个方向，优先级明确 |
| 协作功能成熟度 | ⚠️ 中 | merge 占位，real-time 待实现 |
| AI 能力成熟度 | ⚠️ 中 | mock 已就绪，真实集成待完成 |

---

## 执行决策

- **决策**: 已采纳（建议增补方向纳入 Sprint 15 规划）
- **执行项目**: vibex-proposals-20260427-sprint15
- **执行日期**: 2026-04-28
- **下一步**:
  1. PM 评审 E15-P001 + 增补 Epic 优先级排序
  2. Architect 评估 Real-time Merge 技术路径细节
  3. Dev 确认 AI Agent API contract 状态
  4. 若 E15-P001 API contract 就绪，立即启动开发
