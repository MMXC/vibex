# VibeX Sprint 9 功能提案 — Analyst 评审汇总

**Agent**: analyst
**日期**: 2026-04-25
**项目**: vibex-proposals-20260425-143000
**仓库**: /root/.openclaw/vibex
**状态**: proposed
**数据来源**: `docs/vibex-proposals-20260425/` (Sprint 8 PRD/Analysis/Architecture) + `docs/vibex-proposals-20260424/` (Sprint 7) + `proposals/20260425/analyst.md` (Sprint 8 Analyst 提案)

---

## 执行摘要

Sprint 1-8 已交付核心功能闭环：Canvas 画布、Delivery 中心、Dashboard、Auth 系统。但从 Sprint 7/8 的 CHANGELOG 和 PRD 完成情况看，存在**三条未完成的关键路径**：

1. Firebase 实时协作停留在 MVP，无生产验证
2. Analytics 数据采集了但 Dashboard 未展示
3. Teams API 后端完成但前端从未集成

Sprint 9 定位为**用户可见价值冲刺**——不是扫尾，而是基于已验证的 MVP 基础设施，交付用户真正能用的功能。技术上无新增依赖，以 Sprint 8 验证结论为输入。

---

## 提案列表

| ID | 类别 | 标题 | Sprint 8 关联 | 优先级 |
|----|------|------|--------------|--------|
| S9-P0-1 | feature | Analytics Dashboard 数据展示 | P002-S4 未完成 | P0 |
| S9-P0-2 | feature | Teams API 前端集成 | P003-S1 未完成 | P0 |
| S9-P1-1 | feature | Firebase 实时协作升级 | P002 可行性验证待完成 | P1 |
| S9-P1-2 | improvement | DDL/PRD Generation v2 | Sprint 5/6 MVP 基础 | P1 |
| S9-P2-1 | improvement | Canvas 三树渲染性能优化 | Sprint 1-3 技术债 | P2 |
| S9-P2-2 | feature | 全局搜索能力 | Sprint 4 延伸 | P2 |

---

## S9-P0-1: Analytics Dashboard 数据展示

### 问题描述

Sprint 7 PRD (E4) 要求 Analytics 看板"在 `/dashboard` 增加 widget 展示 page_view/canvas_open/component_create/delivery_export 事件趋势"。P002-S4 验收标准明确：`expect(isVisible('.analytics-widget')).toBe(true)`。

Sprint 8 PRD 再次将 P002-S4 列为 1.5d 工时。Sprint 8 `analysis.md` 验证时发现：Analytics SDK 已在 `src/lib/analytics/` 实现，数据采集代码存在，但 `/dashboard` 无 widget 可见——这是**连续两个 Sprint 未交付**的功能。

### 根因分析

5Why：
1. 为什么 P002-S4 未交付？→ Sprint 7 容量不足，排在 E1/E2/E3 之后
2. 为什么容量不足？→ E1 后端 TS 债务（16-24h）超出 Sprint 容量
3. 为什么 E1 占用这么多？→ 173 个 TS 错误分散，无优先级排序
4. 为什么没有优先级排序？→ 没有基线错误分类，按文件随机修
5. 为什么 P002-S4 被反复推迟？→ 功能价值不如"让 CI 跑起来"直观，但 Analytics 是衡量产品是否被使用的关键指标

**证据**：`docs/vibex-proposals-20260425/analysis.md` 1.1 章节标注 P002-S4 为 ❌ 未完成；Sprint 7 PRD E4 验收标准完整但无 commit 记录。

### 影响范围

- `/dashboard` 页面
- `src/lib/analytics/`（已有数据采集）
- `src/app/dashboard/page.tsx`

### 解决思路

Analytics SDK 已有采集逻辑，欠的是**展示层**。复用 Sprint 8 AGENTS.md 约束（React 19 + CSS Modules + Zustand），不引入新库。

具体方案：
1. 在 `/dashboard` 页面左侧或顶部增加 `.analytics-widget` 组件
2. 数据来源：已有 `src/lib/analytics/` REST API 调用（Firebase Analytics REST API）
3. 展示内容：7 天 page_view / canvas_open / component_create / delivery_export 事件趋势图（SVG 折线图，无新依赖）
4. 状态设计（四态）：空态（"暂无数据，开始使用吧"）、加载态（skeleton）、正常态（折线图）、错误态（"数据加载失败"）

### 验收标准

- [ ] `expect(isVisible('.analytics-widget')).toBe(true)` 在 `/dashboard` 页面通过
- [ ] 展示 page_view / canvas_open / component_create / delivery_export 4 个指标
- [ ] 7 天趋势数据正确渲染（无假数据）
- [ ] 四态完整：空态/加载态/正常态/错误态均有 UI
- [ ] `npx vitest run analytics.test.ts` 通过（单元测试）
- [ ] `npx playwright test analytics-widget.spec.ts` 通过（E2E）
- [ ] Console 无 error

### 技术风险评估

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| Firebase Analytics REST API 鉴权失效 | 低 | 高 | 复用 `presence.ts` 的 token 管理模式 |
| Dashboard 页面加载性能下降 | 中 | 中 | SVG 图表延迟加载，不阻塞 LCP |
| 数据延迟（RTDB → 展示 > 5s）| 中 | 中 | 添加 loading skeleton，减少 FOUT |

**风险评级**: 🟡 中等 — 技术路径清晰（Sprint 5 Analytics SDK 已有），展示层工作量小（1.5d），主要风险是 API 鉴权续期。

---

## S9-P0-2: Teams API 前端集成

### 问题描述

Sprint 7 PRD (E3) 要求实现 `/dashboard/teams` 页面——调用 Teams CRUD API + 成员管理 + 权限分层。Sprint 7 估算 12-16h，后端 API 已完成但前端从未集成。

P003-S1 验收标准：`expect(isVisible('.teams-list')).toBe(true)`，至今无 commit 记录。这是**团队协作的基础入口**，缺失意味着用户无法通过 UI 管理团队。

### 根因分析

5Why：
1. 为什么 E3 Teams 前端未实现？→ Sprint 7 规划为 P1，排在 E1 TS 债务之后
2. 为什么 E1 优先？→ CI 构建失败阻断所有 PR，必须先修
3. 为什么 E1 没有按时完成？→ 173 个错误，估算不准，实际超容
4. 为什么 E3 前端比后端优先级低？→ 后端 API 是其他功能的依赖
5. 为什么 E3 前端在 E1 完成后仍未做？→ Sprint 7 PRD 把 E3/E4 标为 P1，但没有明确 DoD 和验收里程碑

### 影响范围

- `/dashboard/teams` 页面
- `src/app/teams/page.tsx`（存在但无 API 集成）
- `src/components/teams/`（组件需新建）

### 解决思路

后端 API 已完成，前端页面框架存在。需要的是**消费 API + UI 集成**。

方案：参考 `docs/vibex-proposals-20260425/prd.md` P003 Epic 设计：
1. Teams 列表页：调用 `GET /v1/teams`，渲染团队卡片列表
2. 创建团队 Dialog：表单提交 `POST /v1/teams`
3. 成员管理面板：邀请/移除成员 `POST/DELETE /v1/teams/:id/members`
4. 权限分层 UI：基于后端 `role` 字段，展示 Owner/Admin/Member 权限梯度

技术约束：
- 使用 Zustand（现有状态管理）
- 使用 CSS Modules + CSS Token（不引入新样式方案）
- Error Boundary：API 错误时显示 `.teams-error` 组件

### 验收标准

- [ ] `expect(isVisible('.teams-list')).toBe(true)` — 列表页正确渲染
- [ ] 团队创建：表单提交后列表更新（乐观更新或重新 fetch）
- [ ] 成员邀请/移除：API 调用成功，UI 即时更新
- [ ] 权限展示：Owner/Admin/Member 三级 UI 区分清晰
- [ ] 错误态：API 401/403/500 有友好错误提示
- [ ] 空态：未加入团队时显示引导创建 UI
- [ ] `npx playwright test teams-page.spec.ts` E2E 全通过

### 技术风险评估

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 后端 API 路由变更 | 低 | 高 | 先写 E2E 测试再开发，测试驱动 |
| 权限 UI 设计复杂 | 中 | 低 | 使用已有 Design Token，简化到 Owner=全部，其他=只读 |
| 多 Tab 并发编辑冲突 | 中 | 中 | 前端乐观更新，冲突时弹窗提示用户刷新 |

**风险评级**: 🟡 中等 — 前后端接口契约需确认（建议 Architect 在 Sprint 9 产出一份 Teams API 文档），UI 复杂度中等。

---

## S9-P1-1: Firebase 实时协作升级

### 问题描述

Sprint 7/8 将 Firebase 实时协作列为 P0，但交付物停留在 MVP：`presence.ts` 实现了单用户降级 + 5s timeout，ConflictBubble UI 存在。**生产可行性未验证**（P002-S1 Architect 评审报告未产出）。

Sprint 8 `analysis.md` 明确标注：
- ❌ 冷启动延迟未量化
- ❌ 5 用户并发场景未测试
- ❌ Architect 可行性评审报告未产出

直接进入协作升级存在技术风险。

### 根因分析

根本原因：**Firebase on Cloudflare Workers 的冷启动性能没有量化数据**。V8 isolate 环境与 Node.js 不同，Firebase Admin SDK 初始化涉及 TLS 握手 + JWT 验证，在冷启动场景可能超过 3s 可接受阈值。Sprint 7 直接实现 MVP，跳过了这一步。

### 影响范围

- `/canvas` 页面实时协作功能
- `src/lib/firebase/presence.ts`（可能需重构）
- Cloudflare Workers 冷启动性能

### 解决思路

**前提**：Sprint 8 必须完成 P002-S1（Firebase + Cloudflare Workers 可行性评审）和 P002-S2（冷启动 < 500ms）。

在 Sprint 8 验证结论基础上，Sprint 9 的 Firebase 协作升级分两阶段：

**Phase 1（基于 Sprint 8 验证结果）**：
- 如果 Firebase 可行（冷启动 < 500ms）→ 继续 Phase 2
- 如果 Firebase 不可行 → 切换到 PartyKit/HocusPocus 备选方案

**Phase 2**：
- Presence 指标升级：显示用户头像 + 名称（当前只显示在线/离线）
- Cursor 同步：显示其他用户的光标位置（React Flow 内）
- ConflictBubble 增强：冲突提示细化（是哪个节点冲突 + 解决建议）

### 验收标准

- [ ] Sprint 8 P002 可行性验证通过（冷启动 < 500ms）— **前置条件**
- [ ] 5 用户并发 presence 更新延迟 < 3s
- [ ] Canvas 画布显示其他用户头像 + 名称
- [ ] Cursor 同步在 React Flow 内可达 < 500ms
- [ ] ConflictBubble 显示冲突节点 ID + 解决建议文本
- [ ] 断线重连后 presence 状态正确恢复
- [ ] Playwright E2E 测试：5 用户并发场景通过

### 技术风险评估

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| Firebase 冷启动 > 500ms | 中 | 高 | Sprint 8 必须先完成验证，不通过则换方案 |
| 5 用户并发 RTDB quota 超限 | 低 | 中 | Firebase RTDB 免费额度 100 并发，需监控 |
| Cursor 同步频率过高导致性能问题 | 中 | 中 | 节流到 100ms，更新频率可配置 |

**风险评级**: 🟠 中高 — 依赖 Sprint 8 P002 验证结论。Phase 1 未通过则整个 Epic 需要重构。**建议 Sprint 8 优先完成 Firebase 可行性评审**。

---

## S9-P1-2: DDL/PRD Generation v2

### 问题描述

Sprint 5/6 已交付 DDL Generator 和 PRD Generator MVP：
- `DDLGenerator` 从 Canvas 节点生成 SQL DDL
- `PRDGenerator` 从 Canvas 节点生成 Markdown PRD

MVP 验证了技术可行性，但当前版本：
1. **DDL**：只支持基础字段类型（VARCHAR, INT, DATE），不支持 ENUM/JSON/UUID/ARRAY 等现代数据库类型
2. **PRD**：只输出 Markdown，缺乏结构化（无法直接导入其他工具）
3. **UX**：一次性生成，无编辑/预览/版本管理

### 影响范围

- `/canvas/delivery` 页面
- `src/components/delivery/`（DDLDrawer, PRDGenerator 组件）
- `src/lib/generators/`（DDL/PRD 生成逻辑）

### 解决思路

基于 Sprint 5/6 MVP 扩展，不重写：

**DDL v2**：
- 支持现代 PostgreSQL 类型：ENUM、JSONB、UUID、ARRAY、TSVECTOR
- 添加索引生成（主键/外键/唯一索引）
- 生成 `CREATE INDEX` 语句

**PRD v2**：
- 输出结构化 JSON Schema（可导入 Notion/Obsidian）
- 添加预览面板（WYSIWYG Markdown 编辑器）
- 版本历史：每次生成记录版本 diff

技术约束：使用 Zustand 存储生成历史，不引入新状态管理。

### 验收标准

- [ ] DDL 支持 ENUM/JSONB/UUID/ARRAY 四种类型生成
- [ ] DDL 生成包含 CREATE INDEX 语句
- [ ] PRD 输出 JSON Schema + Markdown 双格式
- [ ] PRD Generator 有预览面板
- [ ] 历史版本可查看 diff
- [ ] `npx vitest run generators.test.ts` 全通过
- [ ] Playwright E2E: DDL → 粘贴到 pgAdmin 可执行

### 技术风险评估

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| DDL 类型推断不准确 | 中 | 中 | 从 Canvas 节点属性推断，提供手动覆盖选项 |
| JSON Schema 版本兼容性 | 低 | 低 | 固定 JSON Schema draft-07，不追新 |

**风险评级**: 🟢 低 — 纯前端/后端逻辑扩展，不涉及架构变更，风险可控。

---

## S9-P2-1: Canvas 三树渲染性能优化

### 问题描述

Sprint 1-3 交付的 Canvas 使用三树结构（ComponentTree/BusinessFlowTree/BoundedContextTree）并行渲染。`docs/vibex-proposals-20260425/analysis.md` 1.1 章节提到三树结构"已实现"，但没有量化渲染性能。

React Flow 画布在节点数 > 100 时可能存在性能问题。当前三树是否做了虚拟化（virtualization）未知。

### 影响范围

- `/canvas` 页面
- `src/components/canvas/` 三树组件
- `src/lib/react-flow/` 相关逻辑

### 解决思路

先用 Playwright Lighthouse 量化当前性能基线，再决定优化方向：

1. 测量指标：LCP、FID、CLS（Core Web Vitals）
2. 识别瓶颈：React Profiler + Lighthouse 报告
3. 常见优化：虚拟化列表、懒加载非可视节点、减少 re-render

由于无具体数据，优化方案待 Sprint 9 启动后由 Dev 评估后给出。

### 验收标准

- [ ] Canvas 页面 Lighthouse Performance ≥ 90（基准）
- [ ] 节点数 100 时 FPS ≥ 30
- [ ] 三树切换延迟 < 200ms
- [ ] Lighthouse 报告存档（用于后续回归对比）

### 技术风险评估

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| React Flow 本身性能上限 | 低 | 中 | 考虑是否切换到轻量画布库 |
| 虚拟化与 React Flow 冲突 | 中 | 中 | 先在小数据集测试，确认兼容后再全量 |

**风险评级**: 🟡 中等 — 优化类工作，结果不确定，建议 Sprint 9 预留 2-3d 做探索性优化。

---

## S9-P2-2: 全局搜索能力

### 问题描述

Sprint 4 交付了 Dashboard 项目搜索（`/dashboard` 搜索框），但这是**项目级别的**。用户无法：
- 跨项目搜索节点/组件
- 在 Canvas 内搜索特定节点
- 搜索团队成员

这是一个 P2 延伸功能，不紧急但有价值。

### 影响范围

- `/canvas` 页面内搜索
- `/dashboard` 全局搜索扩展
- 后端搜索 API（可能需要新增）

### 解决思路

分两阶段：
1. **Phase 1**：Canvas 内搜索（搜索当前 Canvas 的节点标题/ID），纯前端实现
2. **Phase 2**：跨 Canvas 搜索（调用后端 API，搜索所有 Canvas 的节点），需要后端索引

### 验收标准

- [ ] Canvas 内搜索框可输入 + 实时过滤节点
- [ ] 搜索结果高亮显示
- [ ] 无匹配时显示"未找到"
- [ ] 键盘快捷键 `/` 可快速聚焦搜索框
- [ ] `npx vitest run search.test.ts` 通过

### 技术风险评估

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| Phase 2 后端索引性能 | 中 | 中 | Phase 1 纯前端验证 UX，Phase 2 再评估后端方案 |

**风险评级**: 🟢 低 — P2，功能价值明确，技术路径清晰（Phase 1 无后端依赖）。

---

## 风险矩阵

| 提案 | 可能性 | 影响 | 综合风险 | 工时估算 |
|------|--------|------|----------|----------|
| S9-P0-1 Analytics Dashboard | 低 | 高 | 🟡 中 | 1.5d |
| S9-P0-2 Teams 前端集成 | 中 | 高 | 🟠 中高 | 2d |
| S9-P1-1 Firebase 协作升级 | 中 | 高 | 🟠 中高 | 4d |
| S9-P1-2 DDL/PRD v2 | 低 | 中 | 🟢 低 | 2d |
| S9-P2-1 Canvas 性能优化 | 中 | 中 | 🟡 中 | 2-3d |
| S9-P2-2 全局搜索 | 低 | 中 | 🟢 低 | 1.5d |

---

## Sprint 9 容量建议

| 提案 | 工时 | 优先级 |
|------|------|--------|
| S9-P0-1 Analytics Dashboard | 1.5d | 必选 |
| S9-P0-2 Teams 前端集成 | 2d | 必选 |
| S9-P1-1 Firebase 协作升级 | 4d | 可选（依赖 Sprint 8 P002 验证） |
| S9-P1-2 DDL/PRD v2 | 2d | 可选 |
| S9-P2-1 Canvas 性能优化 | 2-3d | 备选 |
| S9-P2-2 全局搜索 | 1.5d | 备选 |

**建议 Sprint 9 分两批交付**：
- **第一批（3.5d）**：S9-P0-1 + S9-P0-2 — 用户可见价值，零新增依赖
- **第二批（4-6d）**：S9-P1-1 或 S9-P1-2 — 技术增强，视 Sprint 8 验证结论决定

**总工时**：7.5-9.5d（基于 2 人 Sprint 容量）

---

## 约束条件

1. Sprint 9 不引入新的前端状态管理（继续使用 Zustand）
2. Sprint 9 不引入新的 CSS 方案（继续使用 CSS Modules + CSS Token）
3. Sprint 9 Firebase 协作升级必须基于 Sprint 8 P002 验证结论，不跳过可行性验证
4. 所有 UI 变更必须包含四态表（空态/加载态/正常态/错误态）
5. 所有颜色必须使用 CSS Token，禁止硬编码

---

## 附录：Sprint 8 扫尾任务

以下 Sprint 8 任务在本文档日期时尚未完成，需确认是否带入 Sprint 9：

| Sprint 8 任务 | 状态 | 建议 |
|--------------|------|------|
| P001-S2 剩余 TS 错误修复 | 进行中 | 带入 Sprint 9，优先完成 |
| P001-S3 CI tsc gate | 待启动 | 带入 Sprint 9，作为首个 CI 门禁 |
| P002-S1 Architect 评审 | 未开始 | **Critical** — S9-P1-1 的前置条件 |
| P002-S2 Firebase 冷启动验证 | 未开始 | Critical — S9-P1-1 的前置条件 |
| P002-S3 Presence 更新延迟 | 未开始 | 依赖 P002-S1 |
| P002-S5 SSE bridge 验证 | 未开始 | 低优先级 |
| P003-S2 JSON round-trip E2E | 未开始 | 建议 Sprint 9 先补完 |
| P003-S3 YAML round-trip E2E | 未开始 | 建议 Sprint 9 先补完 |
| P004 Coord 评审检查点 | 进行中 | 带入 Sprint 9，作为质量门禁 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260425-143000
- **执行日期**: 待 Sprint 8 完成（建议 2026-05-03 开始 Sprint 9）
- **前置条件**: Sprint 8 P001-S2、Sprint 8 P002-S1 必须完成

*文档版本: v1.0 | 2026-04-25 | analyst*
