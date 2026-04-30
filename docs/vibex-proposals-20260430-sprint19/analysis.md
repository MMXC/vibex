# VibeX Sprint 19 提案分析报告

**日期**: 2026-04-30
**Agent**: analyst-review
**验证方法**: 代码扫描 + gstack 子代理并行验证

---

## 执行摘要

4 个提案经 gstack 验证后，2 个问题不真实需驳回，1 个问题真实需实施，1 个问题真实性存疑需重新评估。

| ID | 标题 | 验证结果 | 决策 |
|----|------|----------|------|
| P001 | MCP Tool 治理缺失 | ❌ 不真实 | **驳回** |
| P002 | Design Review 真实 MCP 集成 | ✅ 真实（严重） | **采纳** |
| P003 | 后端 TS 债务残留 | ⚠️ 存疑 | **驳回（重新评估）** |
| P004 | 版本历史跨版本 Diff | ❌ 不真实 | **驳回** |

---

## P001: MCP Tool 治理缺失

### 验证结果

| 检查项 | 路径 | 结果 |
|--------|------|------|
| INDEX.md | `docs/mcp-tools/INDEX.md` | ✅ 已存在 |
| generate-tool-index.ts | `scripts/generate-tool-index.ts` | ✅ 已存在 |
| /health 端点 | `packages/mcp-server/src/routes/health.ts` | ✅ 已存在（三层实现） |

**验证发现**：三项基础设施不仅存在，且实现完整：
- `routes/health.ts` — 独立 HTTP 端点
- `tools/list.ts` — `health_check` MCP tool 已注册
- `tools/execute.ts` — `health_check` 执行逻辑已接入
- `__tests__/health.test.ts` — 完整测试覆盖

### 驳回理由

**P001 问题不真实**。提案基于旧快照数据，误将「已完成」的功能标记为「缺失」。CHANGELOG 中「S16-P2-2-DoD gaps」标注可能是临时状态，当前 main branch 已完整交付。

### 决策

```
task update vibex-sprint19 analyst-review rejected --failure-reason "P001问题不真实：docs/mcp-tools/INDEX.md + scripts/generate-tool-index.ts + /health端点三项均已存在，gstack验证通过"
```

---

## P002: Design Review 真实 MCP 集成

### 验证结果 ✅

| 层级 | 状态 | 证据 |
|------|------|------|
| 前端 `useDesignReview` hook | ❌ 纯 Mock | 注释写明 `// Mock implementation — replace with real MCP call when review_design tool is available` |
| `callReviewDesignMCP()` | ❌ 硬编码 | `setTimeout(resolve, 1500)` + 固定 9 条假数据 |
| `review_design.ts` MCP tool | ✅ 已实现 | 真实调用 `checkDesignCompliance`、`checkA11yCompliance`、`analyzeComponentReuse` |
| execute.ts 注册 | ✅ 已注册 | `case 'review_design':` 路由已接入 |
| 前端连接 | ❌ 断连 | hook 从未调用 `executeTool('review_design', ...)` |

### 问题严重性

**比预期更严重**。不是「部分 mock」，而是「100% 假数据」——用户按 Ctrl+Shift+R 看到的评审报告与真实设计状态毫无关系。真实 MCP tool 底层逻辑完整，缺的只是前端连接层。

### 根因

前端 `useDesignReview` 在设计阶段写成了 mock 占位符，标注「等 MCP tool 可用后替换」，但这个替换从未执行。

---

### 技术方案

#### 方案 A（推荐）：HTTP 代理桥接

前端通过 Next.js API Route 调用 MCP server HTTP 端点（MCP server 已暴露 REST 接口）。

```
前端 useDesignReview
  → POST /api/mcp/review_design
    → MCP server HTTP 端点（需新增）
      → reviewDesign() 核心逻辑
        → checkDesignCompliance + checkA11y + componentReuse
```

**优点**：无需引入 MCP 客户端 SDK，前端改动最小
**缺点**：需要新增 API Route 层；MCP server 是否支持 HTTP 需确认
**实施成本**：低（0.5-1d）

#### 方案 B：MCP SDK 客户端

前端引入 MCP SDK，直接调用 `review_design` tool。

**优点**：架构统一，MCP tool 调用标准方式
**缺点**：引入新依赖；MCP SDK 在浏览器端支持度需调研
**实施成本**：中（1-2d）

---

### 风险识别

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| MCP server HTTP 接口不支持 tool 调用 | 低 | 高 | 方案 A 先调研接口能力 |
| mock 变回真数据后评审质量差 | 低 | 中 | graceful degradation：评审失败时显示友好错误 |
| review_design tool 性能慢（涉及 AST 扫描） | 中 | 低 | 异步加载 + loading state |

---

### 验收标准（可测试）

- [ ] `useDesignReview` 注释中「Mock implementation」已移除或标注为 deprecated
- [ ] Ctrl+Shift+R 触发后，ReviewReportPanel 展示的数据来自 `review_design.ts` 真实逻辑
- [ ] E2E 测试覆盖真实 MCP 调用路径（`tests/e2e/design-review.spec.ts` 已有，需验证路径为真实调用）
- [ ] `pnpm run build` → 0 errors
- [ ] Design Review 不可用时（server error）显示优雅降级文案（非白屏/非假数据）
- [ ] `grep -r "setTimeout.*1500\|mock\|simulated" src/hooks/useDesignReview` → 0 matches

---

### 决策

**采纳。** 根因明确，修复路径清晰，方案 A 实施成本极低。

---

## P003: 后端 TS 债务残留

### 验证结果 ⚠️

| 指标 | 提案声称 | 实际值 |
|------|----------|--------|
| TS 编译错误数 | 有错误残留 | **0（干净通过）** |
| `as any` 总数 | 基线 163 | **67（现有）** |
| index 相关错误 | 342 个 | **0** |
| 基线文件 | AS_ANY_BASELINE.md | **不存在** |

**关键发现**：

1. **TS 编译完全干净** — `tsc --noEmit` 无任何错误
2. **`as any` 实际 67 个**，远低于提案引用的「基线 163」
3. **`AS_ANY_BASELINE.md` 不存在于仓库** — 基线数字来源不可核实
4. **noUncheckedIndexedAccess 错误为零** — S17 defer 的 342 个错误在后续 Sprint 中已全部修复

### 驳回理由

**P003 基于过时数据**。提案引用的基线数字（163 as any、342 index errors）来自 Sprint 7/17 的历史快照，当前状态已被后续 Sprint 完全清理。无可操作的技术债务。

### 决策

```
task update vibex-sprint19 analyst-review rejected --failure-reason "P003问题不真实：tsc --noEmit当前0错误，as any仅67个（非163），noUncheckedIndexedAccess错误0个，基线文件AS_ANY_BASELINE.md不存在；S17 defer的342个错误已被后续Sprint清理"
```

---

## P004: 版本历史跨版本 Diff

### 验证结果

| 组件 | 路径 | 对比功能 |
|------|------|---------|
| VersionHistoryPanel (Canvas) | `components/canvas/features/VersionHistoryPanel.tsx` | ✅ checkbox 多选 → 自动 diff |
| VersionHistoryPanel (version-history) | `components/version-history/VersionHistoryPanel.tsx` | ❌ 本身无对比（由父页面提供） |
| version-history/page | `app/version-history/page.tsx` | ✅ 双下拉选择器 + diff modal |
| VersionDiff (UI) | `components/version-diff/VersionDiff.tsx` | ✅ modal UI |
| VersionDiff (Logic) | `lib/version/VersionDiff.ts` | ✅ jsondiffpatch 实现 |

### 驳回理由

**P004 问题不真实**。对比功能已完整实现：
- Canvas 侧边栏：checkbox 勾选 2 个快照 → 自动触发 diff（`SnapshotDiffView`）
- version-history 页面：双下拉选择器选择任意两个快照 → diff modal

提案误将「VersionHistoryPanel.tsx 组件本身无对比按钮」理解为「功能缺失」，但对比入口在父页面已提供。

### 决策

```
task update vibex-sprint19 analyst-review rejected --failure-reason "P004问题不真实：对比功能已完整实现——Canvas侧边栏checkbox对比+version-history页面双下拉选择器+VersionDiff组件全部存在"
```

---

## 综合结论

### 采纳情况

| 提案 | 决策 | 理由 |
|------|------|------|
| P001 | ❌ 驳回 | 问题不真实，三项基础设施均已存在 |
| P002 | ✅ **采纳** | 问题真实，mock 占位符未替换；修复路径清晰 |
| P003 | ❌ 驳回 | 问题基于过时数据，当前 TS 编译干净 |
| P004 | ❌ 驳回 | 问题不真实，对比功能已完整实现 |

**采纳率：1/4（25%）**

### 验证反思

P001/P003/P004 均被驳回，核心原因：提案分析依赖 CHANGELOG 快照数据，未与当前 main branch 实际代码交叉验证。**根因：缺乏基于代码的实时验证机制**。

### 建议

P002 修复优先级：P002 > P003-reassess > P004-verify

P002 修复后建议增加 DoD 验证步骤：每次 Sprint 结束后，Dev agent 必须用 gstack/代码扫描验证 CHANGELOG 中「⚠️」标注项是否已修复，防止旧问题积压成新提案。

---

## 执行决策

- **决策**: 已采纳（P002）
- **执行项目**: vibex-sprint19
- **执行日期**: 2026-04-30
- **采纳提案**: P002（Design Review 真实 MCP 集成）
- **驳回提案**: P001、P003、P004（问题不真实）
- **后续**: P002 进入实施阶段，剩余 3 个提案重新评估后决定

---

*分析时间: 2026-04-30 11:40 GMT+8*
*验证方法: 4 个 gstack 子代理并行代码扫描*
