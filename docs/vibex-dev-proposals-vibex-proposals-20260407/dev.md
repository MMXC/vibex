# Vibex Developer Proposals — 2026-04-07 Cycle

> 本文档为 2026-04-07 开发周期提供优先级建议，源自近期技术分析。

---

## P0-1: Canvas API Phase1 — Snapshot CRUD

**Problem/Opportunity**
当前 32 个 Canvas API 端点中仅实现 9/32（28%），Phase1 的 Snapshot CRUD 6 个端点缺失，直接阻塞 Epic E4 进度。

**Solution**
实现以下 6 个 Snapshot CRUD 端点：
- `POST /api/canvas/snapshots` — 创建快照
- `GET /api/canvas/snapshots/:id` — 获取单个快照
- `GET /api/canvas/snapshots` — 列表查询（含分页/过滤）
- `PUT /api/canvas/snapshots/:id` — 更新快照
- `DELETE /api/canvas/snapshots/:id` — 删除快照
- `POST /api/canvas/snapshots/:id/restore` — 恢复快照

**Impact**
- 工时：~7 人天（平均每个端点含 schema/handler/validation/error = 1.2d）
- 解除 Epic E4 阻塞

**Implementation Sketch**
```
Phase 1a (2d): Schema + handler skeleton + CRUD routes
Phase 1b (3d): 业务逻辑填充 + validation middleware
Phase 1c (2d): Integration test + API docs
```

**Verification Criteria**
- [ ] 6 个端点全部通过 API integration test
- [ ] OpenAPI schema 同步更新
- [ ] Epic E4 相关 Story 解除 Blocked 状态

**Blocked by:** canvas-api-completion analysis
**Unblocks:** Epic E4

---

## P0-2: sessions_spawn Timeout — Checkpoint Protocol + runTimeoutSeconds

**Problem/Opportunity**
当前 subagent `sessions_spawn` 无超时机制，长时运行任务可能永久挂起，无法优雅中断。缺乏 checkpoint 协议导致超时后无法续跑。

**Solution**
1. **新增 `runTimeoutSeconds` 参数**：传入 `sessions_spawn`，超时后自动终止并返回 checkpoint 数据
2. **实现 Checkpoint Protocol**：每 N 分钟生成 `{step, state, timestamp}` snapshot，超时时可从最近 checkpoint 恢复

**Impact**
- 工时：~5 人天（timeout controller 2d + checkpoint store 2d + integration 1d）
- 提升 subagent 可靠性，避免僵尸会话

**Implementation Sketch**
```
src/
  sessions/
    spawn.ts         # 添加 runTimeoutSeconds 参数
    timeout-controller.ts  # 超时信号 + graceful shutdown
    checkpoint-store.ts    # 持久化 checkpoint 到 Redis/DB
    checkpoint-protocol.ts # step 快照序列化格式
```

**Verification Criteria**
- [ ] `sessions_spawn { runTimeoutSeconds: 300 }` 能在 5min 后自动终止
- [ ] 超时后 `GET /sessions/:id/checkpoint` 返回最近快照
- [ ] 从 checkpoint 恢复的 subagent 能从断点继续执行

---

## P0-3: Vitest Coverage Threshold Fix — Vitest Native Threshold

**Problem/Opportunity**
当前 Vitest 配置使用 `vitest-coverage-minimum-threshold`（第三方插件），与 Vitest Native Threshold API 不兼容。覆盖率门禁失效，测试质量无量化保障。

**Solution**
迁移到 Vitest Native Threshold 配置：
```ts
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      }
    }
  }
})
```

**Impact**
- 工时：~6 小时（3 阶段）
  - Phase 1: 移除旧插件 + 配置迁移 (1h)
  - Phase 2: 调整阈值基线 (3h)
  - Phase 3: CI pipeline 验证 (2h)
- 覆盖率门禁恢复正常

**Implementation Sketch**
```
Phase 1 (1h):
  1. npm uninstall vitest-coverage-minimum-threshold
  2. 删除 .github/workflows/coverage.yml 旧配置引用

Phase 2 (3h):
  3. 在 vitest.config.ts 添加 native thresholds
  4. 运行 vitest --coverage 获得当前基线
  5. 调整 thresholds 略低于当前覆盖率（避免 initial failure）

Phase 3 (2h):
  6. PR CI 验证通过
  7. 通知 team 覆盖率门禁已生效
```

**Verification Criteria**
- [ ] `vitest --coverage` 无报错
- [ ] CI pipeline coverage check 绿灯
- [ ] `.github/workflows` 中覆盖率 job 状态可见

---

## P1-1: Canvas Testing Pyramid Phase1 — Unit Tests for 6 New Hooks

**Problem/Opportunity**
6 个新增 Canvas hooks 缺少测试覆盖，导致重构风险高、bug 难以发现。需建立第一层测试金字塔（unit tests）。

**Solution**
为以下 6 个 hooks 编写单元测试（Vitest + React Testing Library）：
- `useCanvasViewport`
- `useCanvasHistory`
- `useCanvasTool`
- `useCanvasSelection`
- `useCanvasExport`
- `useCanvasCollaborative`

**Impact**
- 工时：~4 人天（每个 hook ~4-6 测试用例 × 6 hooks）
- 覆盖建议：70% branch coverage 作为 Phase1 基线

**Implementation Sketch**
```
src/
  hooks/
    __tests__/
      useCanvasViewport.test.ts   # 6 cases
      useCanvasHistory.test.ts    # 8 cases (含 undo/redo edge)
      useCanvasTool.test.ts       # 5 cases
      useCanvasSelection.test.ts  # 7 cases
      useCanvasExport.test.ts     # 5 cases
      useCanvasCollaborative.test.ts  # 6 cases
```

**Verification Criteria**
- [ ] `vitest run src/hooks/__tests__/useCanvas*.test.ts` 全绿
- [ ] 每个 hook ≥ 5 个 test cases
- [ ] Coverage report lines ≥ 70% for tested hooks

---

## P1-2: Zustand Store Deduplication — simplifiedFlowStore → flowStore Migration

**Problem/Opportunity**
当前存在两个高度重复的 Zustand store：`simplifiedFlowStore` 和 `flowStore`，造成维护负担（两套状态同步逻辑）和 bundle size 浪费。

**Solution**
1. 分析两个 store 的字段和方法重叠度
2. 将 `simplifiedFlowStore` 的特有能力合并到 `flowStore`
3. 统一导出点，删除 `simplifiedFlowStore`
4. 全局搜索引用，更新所有 consumer

**Impact**
- 工时：~3 人天（分析 0.5d + 合并 1.5d + 迁移 1d）
- 减少维护成本，缩小 bundle size

**Implementation Sketch**
```
Phase 1 (0.5d): diff simplifiedFlowStore vs flowStore，找出 unique fields
Phase 2 (1.5d):
  - 在 flowStore 中添加 missing unique fields
  - 统一 action naming
  - 删除 simplifiedFlowStore exports
Phase 3 (1d):
  - grep -r "simplifiedFlowStore" src/ — 更新所有引用
  - vitest 全量回归
```

**Verification Criteria**
- [ ] `simplifiedFlowStore` 文件已删除
- [ ] `grep -r simplifiedFlowStore src/` 无结果
- [ ] 全量测试通过

---

## P2-1: Canvas Split Components Phase1 — CanvasPage → 300L Refactor

**Problem/Opportunity**
`CanvasPage` 组件超过 300 行（含 UI/状态/渲染逻辑），违反组件单一职责原则，难以维护和测试。

**Solution**
Phase1：将 `CanvasPage` 拆分为子组件，提取：
- `CanvasToolbar` — 工具栏
- `CanvasViewport` — 视口区域
- `CanvasSidebar` — 侧边栏

保持 `CanvasPage` 作为容器组件（仅含布局逻辑）。

**Impact**
- 工时：~4 人天（提取 3 个子组件 + 样式迁移 + 测试）
- 为后续 Epic E5/E6 的功能扩展奠定基础

**Implementation Sketch**
```
src/
  canvas/
    components/
      CanvasPage.tsx       # 容器，< 50L
      CanvasToolbar.tsx    # 新组件
      CanvasViewport.tsx   # 新组件
      CanvasSidebar.tsx    # 新组件
    __tests__/
      CanvasPage.test.tsx  # 简化后的容器测试
```

**Verification Criteria**
- [ ] `CanvasPage.tsx` 行数 ≤ 50
- [ ] 新组件各有独立测试
- [ ] E2E 测试（Playwright）CanvasPage 区域功能正常

---

## Summary

| # | Proposal | Priority | Impact | 
|---|----------|----------|--------|
| 1 | Canvas API Phase1 — Snapshot CRUD | P0 | ~7d |
| 2 | sessions_spawn Timeout + Checkpoint | P0 | ~5d |
| 3 | Vitest Coverage Threshold Fix | P0 | ~6h |
| 4 | Canvas Testing Pyramid Phase1 | P1 | ~4d |
| 5 | Zustand Store Deduplication | P1 | ~3d |
| 6 | Canvas Split Components Phase1 | P2 | ~4d |

**建议周期工作量**: P0 × 3 + P1 × 2 + P2 × 1 ≈ 2 周 Sprint
