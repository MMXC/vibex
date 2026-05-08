# VibeX Sprint 32 — Analyst Review 分析报告

**Agent**: analyst
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint32
**仓库**: /root/.openclaw/vibex

---

## 执行决策

- **决策**: 有条件采纳（需修正 P001 事实性错误）
- **执行项目**: vibex-proposals-sprint32
- **执行日期**: 待定

---

## 提案列表（风险修订版）

| ID | 类别 | 标题 | 优先级 | 风险 |
|----|------|------|--------|------|
| P001 | core | 画布性能强化：500+节点虚拟化 + 缩略图导航 | P0 | ⚠️ 中（事实性错误需修正） |
| P002 | ai | AI 评审自动化：从人工触发到持续 Gate | P0 | ⚠️ 高（依赖缺口） |
| P003 | collab | 协作感知增强：冲突可视化 + 操作历史追溯 | P1 | ⚠️ 高（需 RTDB 数据模型变更） |
| P004 | infra | 离线模式增强：冲突离线合并 + 后台同步队列 | P1 | ✅ 低（独立模块） |
| P005 | quality | 测试覆盖率升级：组件级 Snapshot + 视觉回归 | P1 | ✅ 低（CI 扩展） |

---

## P001 详细分析：画布性能强化

### 事实核查结果

| Claim | 核查结论 |
|-------|----------|
| react-window virtualizer | ✅ 实际存在，使用 `List` 固定行高虚拟化 |
| estimateSize / overscan 配置 | ❌ **不存在** — 当前为 `FixedSizeList` 模式，`rowHeight=120` 固定常量，不需要这些参数 |
| 100+ 节点性能测试 | ⚠️ 部分验证 — 默认 100 节点基准测试，但测量的是 Node.js 合成负载，不是真实 DOM 渲染性能 |
| Group/Folder 层级抽象 | ❌ **不存在** — 代码中无相关逻辑 |
| 缩略图导航面板 | ❌ **不存在** — CanvasPage 中未发现缩略图导航组件 |

### 根因分析

**根因**：当前虚拟化解决了列表渲染性能，但没有解决画布认知导航问题。真实痛点是 **"300+ 节点画布用户找不到节点"**，而非渲染性能瓶颈。

**证据**：
- `ChapterPanel.tsx:288` — `CARD_ITEM_HEIGHT = 120 as const`，固定行高虚拟列表
- `benchmark-canvas.ts:54` — 默认 `--nodes=100`，且明确注明"测量的是 Node.js 字符串操作耗时，不是真实 DOM 渲染性能"
- `DDSCanvasStore.ts` — `selectedCardSnapshot.wasVisible` 字段说明跨虚拟边界选中追踪已实现，但无层级分组

### 技术风险

1. **P001 提案表述误导**：声称使用 `estimateSize`/`overscan` 证明 100+ 节点性能，但这些参数在当前固定行高模式下不存在
2. **Group/Folder 涉及数据模型变更**：现有 `DDSCard` 类型需增加 `parentId` 字段，可能影响已有数据迁移
3. **缩略图导航是全新组件**：需要与 ReactFlow viewport 联动，技术复杂度高

### 修正建议

P001 应拆分为两个独立提案：
- **P001-A**：Canvas 缩略图导航面板（优先级 P0，解决核心痛点）
- **P001-B**：Group/Folder 层级抽象（优先级 P1，属于长期优化）

---

## P002 详细分析：AI 评审自动化

### 事实核查结果

| Claim | 核查结论 |
|-------|----------|
| AI 设计评审依赖人工触发 | ✅ 确认 — `.github/workflows/test.yml` 中无 `review_design` CI job，AI 评审通过 MCP bridge 手动调用 |
| 评审结果结构化存储 | ❌ **不存在** — `mcp-bridge.ts` 无评审结果持久化逻辑 |
| Code Generation 质量评分 | ❌ **不存在** — `OpenClawBridge.ts` 无质量评分机制 |

### 根因分析

**根因**：AI 能力停留在"单次问答"模式，缺乏与 CI/CD 流程深度集成基础设施。Sprint 29 `E07-mcp-server.md` 文档已存在 MCP 健康检查协议，但无评审结果写入路径。

**证据**：
- `.github/workflows/test.yml` — e2e job 中仅 `e2e:summary:slack`，无 AI 评审集成
- `vibex-fronted/src/lib/mcp-bridge.ts` — 5s 超时 + graceful degradation，无结果持久化
- `vibex-backend/src/services/OpenClawBridge.ts` — `spawnAgent()` 仅返回 agent 会话，无质量评分

### 技术风险

1. **高风险：需要新基础设施** — 评审结果结构化存储需要新增数据库表或文件存储，超出单个 Sprint scope
2. **中风险：CI 集成需要 GitHub Actions 写权限** — 评审结果写入需 `workflow_run` 或 `check_run` API
3. **P002 建议分阶段**：Sprint 32 仅实现"PR 触发评审 + 结果写入 JSON 文件"，后续 Sprint 再扩展数据库持久化

---

## P003 详细分析：协作感知增强

### 事实核查结果

| Claim | 核查结论 |
|-------|----------|
| LWW 仲裁解决数据冲突 | ✅ 确认 — `useRealtimeSync.ts` 使用 Last-Write-Wins 冲突解决 |
| 冲突可视化（高亮显示冲突区域） | ❌ **不存在** — `presence.ts` 仅同步最终状态，无冲突事件通知 |
| 操作历史时间线 | ❌ **不存在** — `sw.js` Service Worker 无变更队列；版本历史仅存储快照，不记录操作流 |
| 协作者意图气泡 | ❌ **不存在** — `RemoteCursor.tsx` 仅显示位置和用户名，无意图状态 |

### 根因分析

**根因**：实时协作基础设施（Sprint 27-29）解决了"同步"问题，但没有解决"感知"问题。当前 RTDB 数据模型是键值存储，缺少操作意图和冲突事件语义。

**证据**：
- `vibex-fronted/src/lib/firebase/presence.ts:98` — `updateCursor` 仅同步 `cursor {x, y, nodeId, timestamp}`，无 `intention` 字段
- `sw.js:30-60` — fetch interceptor 处理离线 API 请求返回 503，但无变更队列写入本地 IndexedDB
- Sprint 29 CHANGELOG — E05 离线模式仅包含 `OfflineBanner` 提示，无冲突diff UI

### 技术风险

1. **高风险：RTDB 数据模型变更** — 需新增 `intention` / `conflictEvent` 字段，影响已上线用户
2. **高风险：操作历史存储成本** — 操作级历史记录数据量是快照的 10-100 倍，需评估存储方案
3. **建议**：P003 降级为 Sprint 33 提案，Sprint 32 聚焦 P001/P002/P004

---

## P004 详细分析：离线模式增强

### 事实核查结果

| Claim | 核查结论 |
|-------|----------|
| PWA 离线模式 | ✅ 确认 — `sw.js` Service Worker 实现 cacheFirst/networkFirst |
| 离线冲突合并队列 | ❌ **不存在** — `sw.js` 仅对 API 请求返回 503，无离线写入队列 |
| 同步队列可视化 | ❌ **不存在** — `OfflineBanner.tsx` 仅提示离线状态，无同步进度 |

### 根因分析

**根因**：当前 PWA 离线模式是"只读离线"，即离线时无法编辑，但可以访问缓存内容。缺少离线写入能力。

**证据**：
- `sw.js:37` — `if (request.method !== 'GET') return` — 所有非 GET 请求离线时直接放弃
- `OfflineBanner.tsx` — 纯 UI 组件，无状态同步逻辑
- Sprint 29 CHANGELOG E05 — 离线模式范围是"Service Worker 缓存 + 离线 banner"，无写入队列

### 技术风险

1. **低风险：独立模块** — 离线队列为新增能力，不改动现有核心数据模型
2. **中风险：IndexedDB 写入** — 需引入 idb 库或原生 IndexedDB API
3. **回滚计划**：feature flag 控制，离线队列可禁用降级到 LWW

---

## P005 详细分析：测试覆盖率升级

### 事实核查结果

| Claim | 核查结论 |
|-------|----------|
| API 模块测试 94 tests | ✅ 确认 — `services/api/modules/__tests__/` 存在完整测试 |
| 组件级单元测试缺失 | ⚠️ 部分确认 — 有 `__tests__` 目录但 `ChapterPanel`/`DDSCanvasStore` 无快照测试 |
| 视觉回归测试 | ❌ **不存在** — CI workflow 无 screenshot diff 步骤 |

### 根因分析

**根因**：Sprint 24 已建立 API 测试基础，但组件级 snapshot testing 和视觉回归是空白领域。

**证据**：
- `vibex-fronted/src/hooks/__tests__/useProjectSearch.test.ts` — 存在 hook 单元测试
- `stores/dds/__tests__/DDSCanvasStore.test.ts` — 存在 store 测试（+131 行，selectedCardSnapshot 覆盖）
- `.github/workflows/test.yml` — unit job 运行 `test:unit` + `test:unit:coverage`，coverage gate 60%

### 技术风险

1. **低风险：基于已有 CI 基础设施扩展**
2. **Vitest Snapshot**：需配置 `expect.createSnapshot()`，组件渲染环境需 jsdom
3. **视觉 diff**：需引入 `pixelmatch` 或 Playwright screenshot 对比，增加 CI 时长

---

## 风险矩阵（Risk Matrix）

| 提案 | 可能性 | 影响 | 风险等级 | 主要风险点 |
|------|--------|------|----------|------------|
| P001 | 中 | 高 | ⚠️ 中 | Group/Folder 数据模型变更；缩略图导航需全新组件 |
| P002 | 高 | 高 | ⚠️ 高 | 评审结果存储需新基础设施；CI 权限依赖 |
| P003 | 中 | 高 | ⚠️ 高 | RTDB 数据模型变更；操作历史存储成本高 |
| P004 | 高 | 中 | ⚠️ 中 | IndexedDB 写入复杂度；同步队列状态管理 |
| P005 | 高 | 低 | ✅ 低 | CI 时长增加；jsdom 环境配置 |

---

## 工期估算（Effort Estimate）

| 提案 | 预计工时 | 说明 |
|------|----------|------|
| P001-A（缩略图导航） | 3d | 新组件，与 ReactFlow viewport 联动 |
| P001-B（Group/Folder） | 3d | 数据模型变更 + UI 折叠逻辑 |
| P002（CI Gate 集成） | 2d | GitHub Actions job + JSON 结果存储 |
| P003（协作感知） | 4d | RTDB 字段扩展 + 冲突事件 + 意图气泡（高风险，建议延后） |
| P004（离线队列） | 2d | IndexedDB 写入 + 冲突diff UI |
| P005（Snapshot + 视觉diff） | 2d | Vitest snapshot + Playwright screenshot |

---

## 依赖分析（Dependency Analysis）

- **P001-B** 依赖 `DDSCard` 类型变更 → 影响范围大，需协调
- **P002** 依赖 GitHub Actions 写权限 → 需协调 repo admin
- **P003** 依赖 Firebase RTDB schema → 需 Firebase 项目配置变更
- **P004** 依赖 `sw.js` 架构调整 → 需 SW 重构
- **P005** 无外部依赖 → 独立推进

---

## 评审结论

**推荐 Sprint 32 聚焦 P001-A + P002 + P004 + P005**（4 个提案，工时约 9d，团队 1-2 人可行）

**有条件拒绝**：
- P001-B（Group/Folder）：建议延后至 Sprint 33，数据模型变更需额外 review
- P003（协作感知）：建议延后至 Sprint 33，RTDB 数据模型变更风险高

**关键修正**：P001 提案需修正事实性错误 — 当前实现为 `FixedSizeList`，不存在 `estimateSize`/`overscan` 参数；Group/Folder 和缩略图导航均为不存在的能力。
