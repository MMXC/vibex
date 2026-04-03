# VibeX Architect 提案 — Agent 协作指南

**项目**: vibex-architect-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**角色**: Architect

---

## 角色与职责分配

| Agent | 负责范围 | 主要交付物 |
|-------|---------|-----------|
| **Dev** | E1-S1, E1-S2, E2-S2, E2-S3 | 代码实现、PR |
| **Tester** | E1-S3, E5-S2 | E2E 测试、测试迁移 |
| **Architect** | 全局架构设计、ADR | architecture.md、IMPLEMENTATION_PLAN.md |
| **Reviewer** | Code Review | PR Review 报告 |
| **PM** | 进度跟踪、约束管理 | Sprint 计划更新 |

---

## Sprint 4 任务分配

### 📌 领取任务

```bash
# Dev 领取
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py update vibex-architect-proposals-20260403_024652 design-implementation ready

# Dev 领取 E1-S1
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py update vibex-sync-protocol implement-e1-s1 ready
```

### 📋 具体任务分配

#### Dev Agent — Sprint 4

**E1-S1: 自动保存携带版本号**（2h）
- 文件: `vibex-fronted/src/hooks/canvas/useAutoSave.ts`
- 文件: `vibex-fronted/src/lib/canvas/api/canvasApi.ts`
- 文件: `vibex-backend/src/routes/v1/canvas/snapshots.ts`
- 产出: PR 到 `feature/E4-sync-protocol`

**E1-S2: ConflictDialog 冲突解决 UI**（3h）
- 新建目录: `vibex-fronted/src/components/canvas/ConflictDialog/`
- 文件: `index.tsx`, `DiffViewer.tsx`, `MergeEditor.tsx`
- 集成: 在 Canvas 编辑器主组件中监听冲突状态
- 产出: PR 到 `feature/E4-sync-protocol`

**E2-S2: CascadeUpdateManager 迁移**（2h）
- 新建文件: `vibex-fronted/src/lib/canvas/stores/cascadeUpdateStore.ts`
- 修改: `vibex-fronted/src/lib/canvas/canvasStore.ts`（删除迁移逻辑）
- 修改: 所有引用 CascadeUpdateManager 的组件
- 产出: PR 到 `feature/facade-cleanup`

**E2-S3: 剩余逻辑分批迁移**（3h）
- 按 Batch A/B/C 执行迁移（见 IMPLEMENTATION_PLAN.md）
- 每个 commit 后运行 `npm test` 验证无 regression
- 产出: PR 到 `feature/facade-cleanup`

---

#### Tester Agent — Sprint 4

**E1-S3: 冲突场景 E2E 测试**（2h）
- 新建文件: `vibex-fronted/e2e/conflict-sync.spec.ts`
- 覆盖 4 个核心场景（见 architecture.md 6.2 节）
- 验证: `npx playwright test e2e/conflict-sync.spec.ts` 全部通过

**E5-S2: beacon/rAF 测试迁移**（Sprint 6，2h）
- 从 Jest 迁移到 Playwright 的测试:
  - `vibex-fronted/src/hooks/canvas/__tests__/useAutoSave.test.ts`（beacon 部分）
  - `vibex-fronted/src/hooks/__tests__/useVisualization.test.ts`（rAF 部分）
- 新建 `vibex-fronted/e2e/auto-save-beacon.spec.ts`

---

## 代码规范约束

### E1: Sync Protocol 约束

1. **乐观锁检查必须在 Prisma 查询层执行**，不能在前端 JS 层做假检测
2. **ConflictDialog 必须使用原生 `<dialog>` 元素**，不使用自定义 Modal 实现
3. **Merge Editor 必须提供逐字段对比视图**，不能是纯文本 diff
4. **beacon 保存不得阻塞页面卸载**，使用 `navigator.sendBeacon` 而非 `fetch`

### E2: Facade 清理约束

1. **每步迁移必须独立 commit**，message 格式: `refactor(canvasStore): migrate <module> to stores/`
2. **迁移后 canvasStore.ts 行数必须减少**，不能一边迁移一边新增
3. **禁止删除组件引用**，先迁移再修改引用
4. **stores/ 模块必须独立可导入**，每个模块 ≤ 200 行
5. **回归测试**: 每个迁移 commit 后 `npm test -- --testPathPattern="canvas"` 必须通过

### E3: TypeScript Strict 约束

1. **禁止使用 `@ts-ignore`**，除非 PM 书面授权
2. **允许使用 `@ts-expect-error`** 用于第三方库类型声明
3. **any 类型减少按文件优先级**: `lib/` > `components/` > `hooks/` > 其他

### E4: API 契约测试约束

1. **契约规范使用 YAML 格式**，存储在 `tests/contracts/openapi.yaml`
2. **Consumer 测试和 Provider 测试必须成对出现**
3. **契约破坏必须 blocking CI**，不能是 warning

---

## 沟通与升级

### 阻塞上报

当以下情况发生时，立即上报 Architect：

| 场景 | 上报方式 |
|------|---------|
| E2 迁移遇到无法分类的逻辑 | 在 #dev 频道 @architect |
| E1 冲突场景测试不稳定 | 在 #test 频道 @architect |
| 发现新的 any 类型热点 | 记录到 `any-errors.txt`，在 standup 中报告 |
| 架构决策与 PRD 冲突 | 在 #architect 频道发起讨论 |

### 决策升级路径

```
Dev/Tester 遇到架构问题
  ↓
Architect 分析并给出决策
  ↓
如果涉及跨 Epic 影响 → 发起 #architect 讨论
  ↓
形成 ADR 记录 → 更新 architecture.md
```

---

## 验收与 DoD

### 全局 DoD（每个 Story 必须满足）

- [ ] 代码变更已 commit 到对应 feature 分支
- [ ] 所有相关 `npm test` 通过，无 regression
- [ ] 验收标准中的 `expect()` 断言均已通过
- [ ] Code Review 已通过（至少 1 名 team member approve）
- [ ] 如涉及 API 变更，后端 API 文档已更新
- [ ] 迁移类 Story（E2 系列）无新增 `console.error` warning

### Epic 级别 DoD

| Epic | DoD |
|------|-----|
| E1 (Sync Protocol) | ConflictDialog 三选项均可正常触发版本更新；Playwright E2E 覆盖率 ≥ 80% |
| E2 (Facade Cleanup) | `canvasStore.ts` 行数 ≤ 300；所有组件引用已切换到 stores/ 模块 |
| E3 (TS Strict) | `tsc --strict` 零 error；CI step 存在且 blocking |
| E4 (API 契约) | 契约测试在 PR 级别运行；破坏契约的 PR 无法 merge |
| E5 (测试策略) | 文档经 team review；Jest/Playwright 边界清晰 |

---

## 分支策略

```
main
  ├── feature/E4-sync-protocol       # E1 系列开发分支
  │     └── PR → main (Sprint 4 Day 5)
  ├── feature/facade-cleanup         # E2 系列开发分支
  │     └── PR → main (Sprint 4 Day 5)
  ├── feature/ts-strict             # E3 系列开发分支
  │     └── PR → main (Sprint 5)
  ├── feature/contract-testing       # E4 系列开发分支
  │     └── PR → main (Sprint 7+)
  └── feature/testing-strategy      # E5 系列开发分支
        └── PR → main (Sprint 6)
```

**约束**: 禁止 `direct commit to main`，所有变更必须通过 PR

---

## 文件清单

| 文件路径 | 负责人 | 状态 |
|---------|-------|------|
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts` | Dev | 待修改 |
| `vibex-fronted/src/hooks/canvas/useAutoSave.ts` | Dev | 待修改 |
| `vibex-fronted/src/lib/canvas/stores/cascadeUpdateStore.ts` | Dev | 新建 |
| `vibex-fronted/src/components/canvas/ConflictDialog/` | Dev | 新建 |
| `vibex-backend/src/routes/v1/canvas/snapshots.ts` | Dev | 待修改 |
| `vibex-backend/prisma/schema.prisma` | Dev | 待修改（新增 ConflictLog 表）|
| `vibex-fronted/e2e/conflict-sync.spec.ts` | Tester | 新建 |
| `vibex-fronted/docs/TESTING_STRATEGY.md` | Tester | 新建 |
| `vibex-fronted/tests/contracts/openapi.yaml` | Dev | Sprint 7+ |
| `vibex-fronted/tsconfig.json` | Dev | 已启用 strict |

---

## 关键约束（Constraints from PRD）

| 约束 ID | 描述 | Agent 影响 |
|---------|------|-----------|
| C1 | E2 Facade 清理必须逐 commit 验证 | Dev: 每步迁移后测试 |
| C2 | E3 TypeScript Strict 分阶段启用，宽限期 2 周 | Dev: 先 noImplicitAny，再 strict |
| C3 | E4 契约测试仅覆盖 `/v1/canvas/snapshots` 和 `/v1/canvas/rollback` | Dev: 不扩展范围 |
| C4 | ConflictDialog 遵循现有 VibeX 设计系统，不引入新 design token | Dev: 使用现有组件库 |
| C5 | 所有前端代码变更必须通过 Code Review | Dev/Reviewer: 协作流程 |
| C6 | E5 策略文档编写前需与 Dev/Tester 协商 | PM: 协调会议 |
| C7 | Sprint 4 并行 E1+E2，但 E2-S3 需在 E1-S2 之后合并 | Dev: 注意合并顺序 |

---

## Slack 通知约定

| 事件 | 通知频道 | 格式 |
|------|---------|------|
| Sprint 启动 | #dev | `🚀 Sprint 4 启动: E1+E2 实施` |
| 每个 Story 完成 | #dev | `✅ Story 完成: E1-S1 版本号携带` |
| PR 创建 | #dev | `📝 PR: feature/E4-sync-protocol → main` |
| Sprint 完成 | #coord | `✅ Sprint 4 完成: E1+E2 已 merge` |
| 架构问题 | #architect | `@architect 发现架构问题: ...` |

---

*本文档由 Architect Agent 生成于 2026-04-03 03:12 GMT+8*
*协作约定版本: v1.0*
