# GLM Bot Canvas Optimization Roadmap — Analyst Review

**审查日期**: 2026-04-05
**审查者**: Analyst Agent
**文档基准**: `ae63742f` (2026-04-05), 498行路线图
**代码验证**: 7个文件/模块实测对照

---

## 1. 评分验证 (Scorecard)

| 维度 | 路线图评分 | 验证结果 | 问题 |
|------|-----------|---------|------|
| 架构分层 | ⭐⭐⭐⭐ | ✅ 准确 | 三层清晰已验证 |
| 类型安全 | ⭐⭐⭐⭐ | ✅ 准确 | 无 any 泄漏 |
| 代码规范 | ⭐⭐⭐⭐⭐ | ⚠️ **虚高** | 后端 13 处 console.error/console.log，前端零问题是事实，但整体应扣一分 |
| 可维护性 | ⭐⭐⭐ | ✅ 准确 | CanvasPage 1086行(≈1120)，三棵树 1005/988/644行 |
| 数据层 | ⭐⭐ | ✅ 准确 | JSON blob 三字段确认存在 |
| 性能 | ⭐⭐⭐ | ✅ 准确 | `computeBoundedEdges` 确认 O(n²) 两两配对 |
| 可靠性 | ⭐⭐⭐ | ✅ 准确 | Canvas 模块无 ErrorBoundary 确认 |
| 测试 | ⭐⭐⭐ | ✅ 准确 | 11 E2E + 57 单元，关键路径缺集成 |

**建议修订**: 代码规范 5⭐ → 4⭐（整体规范分）

---

## 2. Phase 分解审查

### Phase 0: 清理 (4h 估算)

| 子项 | 路线图描述 | 验证结果 | 估算合理性 |
|------|-----------|---------|-----------|
| 0.1 deprecated.ts | 12个函数无外部调用 | ✅ `canvasStore.ts:34` 有 re-export，需同步删除 | 0.5h ✅ |
| 0.2 cascade cascade 函数 | 无调用方 | ⚠️ `cascade/index.ts:2-3` 仍有 re-export，虽无调用方但导出语句需同步删除 | 0.5h ✅ |
| 0.3 dddApi.ts | 无调用方 | ⚠️ **重要遗漏**: `services/api/modules/ddd.ts` 是另一个活跃文件，被 `homepage/hooks/useHomeGeneration.ts` 调用；`lib/canvas/api/dddApi.ts` 本身只是 re-export wrapper。删除 0.25h，但需先确保 homepage 迁移到新 API，否则 homepage 功能 break | **风险项** |
| 0.4 Mock 数据 | BoundedContextTree + ComponentTree | ✅ 确认存在 MOCK_TEMPLATE 字段 | 1h ✅ |
| 0.5 后端日志 | 13处 console | ✅ 逐一确认（export ×1, generate-components ×3, generate-contexts ×3, generate-flows ×3, generate ×2, project ×1, status ×1）| 1.5h ✅ |

**Phase 0 总体**: 估算合理，**但 0.3 存在 homepage 依赖风险，需在 Phase 0 执行前确认 homepage 已迁移**。

### Phase 1: 数据层统一 (19h 估算)

| 子项 | 工时估算 | 风险评估 |
|------|---------|---------|
| 1.1 统一类型 (4h) | 偏低 | packages/types 新增 canvas canonical model + 前后端适配层，涉及 3 个包的类型同步，保守估计 6-8h |
| 1.2 消除 JSON Blob (8h) | 合理 | Prisma 结构化模型已存在，新数据写入 + 旧数据 migration script，实际风险是 migration 脚本的兼容性测试 |
| 1.3 API 响应标准化 (3h) | 合理偏低 | 后端 route 重构 + response transformer，实际改点多（13个 route 文件） |
| 1.4 Snapshot API (4h) | 合理 | 需后端新增路由 + 前端对接 |

**Phase 1 修订**: 建议 **19h → 24-28h**（1.1 和 1.3 偏低）

### Phase 2: 组件拆分 (18h 估算)

| 子项 | 路线图行数 | 实测行数 | 估算合理性 |
|------|-----------|---------|-----------|
| 2.1 CanvasPage (6h) | 1120行 | 1086行 ✅ | 合理 |
| 2.2 三棵树 (8h) | 1005/988/644 | 1005/988/644 ✅ | 合理 |
| 2.3 Store 规范 (4h) | 327行 history | 未验证行数，按规范标准 | 偏低（historySlice 327行重构风险高）|

**Phase 2 修订**: 建议 **18h → 20-22h**（historySlice 拆分复杂度高于预期）

### Phase 3: 性能优化 (10h 估算)

| 子项 | 路线图描述 | 验证结果 | 估算合理性 |
|------|-----------|---------|-----------|
| 3.1 O(n²)→O(n) (2h) | `computeBoundedEdges` 两两配对 | ✅ 实测代码确认：nested for loop 遍历所有节点对，硬编码 type→relationship 映射 | 合理 |
| 3.2 Persist 优化 (3h) | partialize + history 不持久化 | ✅ 确认 5 个 store 全量 persist | 合理 |
| 3.3 虚拟化 (4h) | 节点>20时启用 | ✅ 确认无虚拟化 | 合理 |
| 3.4 as unknown as (1h) | 类型断言 | ✅ 确认存在 | 合理 |

**Phase 3 总体**: ✅ 准确

### Phase 4: 可靠性加固 (11h 估算)

| 子项 | 估算合理性 |
|------|-----------|
| 4.1 ErrorBoundary (3h) | ✅ 确认无 ErrorBoundary |
| 4.2 API 错误增强 (3h) | ✅ handleResponseError 确认只抛通用 Error |
| 4.3 SSE 健壮性 (3h) | ✅ 需检查重连逻辑 |
| 4.4 并发控制 (2h) | ✅ 确认无锁机制 |

**Phase 4 总体**: ✅ 准确

### Phase 5: 高级特性 (32h 估算)

**Phase 5 为远期规划，工时估算弹性较大，无需逐项核实。** 关键点：5.1 实时协作涉及 conflict resolution UI，属于复杂交互，8h 可能偏少。

---

## 3. 风险识别

### 🔴 高风险 (阻断)

**R1: dddApi 删除风险**
- **问题**: `services/api/modules/ddd.ts` ≠ `lib/canvas/api/dddApi.ts`。前者是 homepage 活跃使用的 API，后者是 re-export wrapper。路线图说 dddApi 无调用方是正确的，但"删除 dddApi.ts"会误删 canvas 模块的 wrapper，而 homepage 实际依赖 `services/api/modules/ddd.ts`。
- **影响**: 如果 homepage 尚未迁移，Phase 0 执行后 homepage 生成功能 break。
- **缓解**: Phase 0 开始前，先验证 `homepage/hooks/useHomeGeneration.ts` 是否已改用 `canvasSseApi`，若未改则 0.3 改为"确认 dddApi.ts 是纯 wrapper 后删除"。

**R2: JSON Blob Migration 数据丢失风险**
- Phase 1.2 涉及旧 JSON 数据的 migration script，若脚本有 bug，现有项目数据不可恢复。
- **缓解**: Migration 前必须 full backup + 灰度迁移（先写结构化，再删 JSON）。

### 🟡 中风险 (需关注)

**R3: historySlice 拆分复杂度被低估**
- 327行的 historySlice 重构涉及 undo/redo 状态机，改动面大，容易引入 bug。
- **缓解**: historySlice 拆分应放在 Phase 2 末尾（有了 ErrorBoundary 和测试覆盖后），并优先补充 historySlice 单元测试。

**R4: Phase 1 和 Phase 2 互相依赖**
- Phase 2 组件拆分依赖 Phase 1 的类型统一结果。如果边拆分边修类型，改动量翻倍。
- **缓解**: 严格按 0→1→4→2→3→5 顺序执行，不要并行。

**R5: 缺少 snapshot 版本规划**
- Phase 1.4 Snapshot API 和 Phase 5.1 实时协作都依赖 Project.version 字段。当前 version 字段在 Prisma 中的定义需要确认（是否有 unique index，是否有 increment 逻辑）。

### 🟢 低风险 (优化项)

**R6: 边计算利用 `relationships` 字段**
- Phase 3.1 提到 `BoundedContextNode.relationships` 已定义但未使用。需要确认这个字段在前端类型定义中是否真的存在，以及它和后端的映射关系。

**R7: 后端 console.log 的审计价值**
- Phase 0.5 清理 console.log 是对的，但部分 console.log 是调试遗留还是有意为之需要确认。尤其是 `generate-contexts/flows` 中的 `console.log` 可能是保留给 AI 服务日志的。

---

## 4. 与今日提案的重叠分析

> **注**: 今日(20260407) Sprint 提案目录在 `/docs/proposals/` 中未找到（按文件修改时间排序，最近的提案为 20260405-1321）。以下基于路线图本身注明的提案代号分析。

### 重叠项 A: canvas-split-components vs Phase 2

- **我们的 A-P0-1 (canvas-split-components)**: 未找到对应实现文档，但 Phase 2 明确包含 CanvasPage 拆分(2.1) 和三棵树拆分(2.2)。
- **结论**: ✅ 高度重叠，Phase 2 应作为 A-P0-1 的正式技术方案来源。**建议 A-P0-1 直接引用 Phase 2 拆分方案，避免重复分析。**

### 重叠项 B: Zustand deduplication vs Phase 1.2 Persist 优化

- **我们的 A-P1-2 (Zustand deduplication)**: 未找到对应实现文档。
- **Phase 3.2 Zustand Persist 优化**: partialize + history 不持久化。
- **结论**: ⚠️ 存在交集但粒度不同。Phase 3.2 是 persist 优化，A-P1-2 可能是指 store 内部状态的 dedup（如 contextNodes 去重）。**建议澄清 A-P1-2 的具体范围，若只是 persist 层则合并到 Phase 3.2。**

### 重叠项 C: Canvas API Phase1 vs Phase 1 API 标准化

- **20260405-1321 目录中存在 `canvas-api-completion`**: 这是已存在的提案。
- **Phase 1.3 API 响应标准化 + 1.4 Snapshot API**: 与 `canvas-api-completion` 存在功能重叠。
- **结论**: 🔴 **严重重叠风险**。如果 canvas-api-completion 已经规划了 API 标准化，Phase 1 的 1.3 和 1.4 应该引用该提案而非重复规划。**需要协调：Phase 1 的 API 部分应与 canvas-api-completion 合并或明确分工。**

### 重叠项 D: canvas-testing-strategy vs Phase 4 可靠性

- **20260405-1321 目录中存在 `canvas-testing-strategy`**: E2E 测试覆盖提案。
- **Phase 4.1 ErrorBoundary**: 需要配合测试才能验证边界场景。
- **结论**: ✅ 互补关系，canvas-testing-strategy 应在 Phase 4 开始前或进行中落地。

---

## 5. 修订建议

### 建议保留 (KEEP)

| 项目 | 理由 |
|------|------|
| ✅ Phase 0 全部内容 | 零风险热身，立竿见影，4h 工时极低 |
| ✅ Phase 3.1 O(n²) 优化 | 实测代码确认，2h 投入产出比极高 |
| ✅ Phase 3.2 Persist 优化 | 改善 localStorage 膨胀，立竿见影 |
| ✅ Phase 4.1 ErrorBoundary | 生产必备，防止白屏 |
| ✅ Phase 4.4 并发控制 | 防止重复请求浪费 AI token |

### 建议修订 (REVISE)

| 项目 | 修订内容 |
|------|---------|
| ⚠️ Phase 0.3 dddApi | 增加 homepage 迁移确认步骤，或标注为"条件删除" |
| ⚠️ Phase 1 工时 | 19h → 24-28h（1.1 和 1.3 偏低）|
| ⚠️ Phase 2 工时 | 18h → 20-22h（historySlice 复杂度）|
| ⚠️ Phase 1.1 类型统一 | 需与 `canvas-api-completion` 提案协调，避免重复 |
| ⚠️ 代码规范评分 | 5⭐ → 4⭐（后端 13 处 console）|

### 建议合并 (MERGE)

| 合并方案 | 理由 |
|---------|------|
| A-P1-2 (Zustand dedup) → Phase 3.2 | 同一问题的不同视角，合并避免重复 |
| A-P0-1 (canvas-split) → Phase 2 | 直接引用，Phase 2 已是成熟方案 |
| Phase 1 API 部分 → canvas-api-completion | 避免同一问题的两个规划文档 |

### 建议新增 (ADD)

| 新增项 | 理由 |
|--------|------|
| 📌 Phase 0 前置检查 | "dddApi homepage 迁移确认" + "historySlice 调用链审计" |
| 📌 Phase 1 中增加 Prisma version 字段验证 | 确认 Project.version 的 unique index 和 increment 逻辑 |
| 📌 Phase 2 后增加 historySlice 集成测试 | historySlice 重构必须有测试保护 |

---

## 6. 工时汇总修订

| Phase | 原估算 | 修订后 | 变更原因 |
|-------|--------|--------|---------|
| Phase 0 | 4h | 4h (+0.5h 验证) | dddApi 迁移确认 |
| Phase 1 | 19h | 26h | 1.1 和 1.3 偏低 |
| Phase 2 | 18h | 21h | historySlice 复杂度 |
| Phase 3 | 10h | 10h | ✅ 准确 |
| Phase 4 | 11h | 11h | ✅ 准确 |
| Phase 5 | 32h | 32h | 远期规划 |
| **合计** | **94h** | **104h** | +10h |

**最小可行改进** (Phase 0+1+4): 41h → **49h ≈ 6个工作日**

---

## 7. 路线图质量评价

| 维度 | 评分 | 说明 |
|------|------|------|
| 现状调研深度 | ⭐⭐⭐⭐ | 代码行数、函数调用链都有实测数据 |
| 方案可行性 | ⭐⭐⭐ | 大方向正确，但 dddApi 误判是明显漏洞 |
| 工时估算精度 | ⭐⭐⭐ | Phase 1 整体偏低，Phase 3/4 准确 |
| 与现有提案协调 | ⭐⭐ | 严重遗漏 canvas-api-completion 的重叠 |
| 风险管理 | ⭐⭐⭐ | 识别了主要风险但未标注 dddApi homepage 依赖 |

**总体评价**: 是一份**有价值的路线图**，技术分析扎实，数据支撑充分。主要问题是 dddApi 误判（影响 Phase 0 执行安全性）和与 canvas-api-completion 的重叠未处理。修订后可直接作为 Sprint 规划输入。

---

## 8. 下一步行动建议

1. **立即行动** (Phase 0 前): 验证 `homepage/hooks/useHomeGeneration.ts` 是否已迁移到 `canvasSseApi`，若是则 Phase 0.3 可执行，若否则延后。
2. **Sprint 规划**: 本周 Sprint 采用 Phase 0 + Phase 3（最小可行改进），4h+10h=14h ≈ 2个工作日。
3. **提案协调**: 由 PM 协调 canvas-api-completion 与 Phase 1 的分工，明确哪个提案主导 API 标准化。
4. **历史数据**: Phase 1 开始前，由 data-migration-expert 审查 Prisma migration 脚本。
