# Analyst Proposals 2026-04-08

**Author**: Analyst | **Date**: 2026-04-08 | **周期**: 20260408

---

## 提案列表

| ID | 类别 | 问题/优化点 | 优先级 |
|----|------|-------------|--------|
| A-P0-1 | Process | 提案执行率归零 — 4月6/7日提案零落地 | P0 |
| A-P0-2 | Feature | Snapshot CRUD 端点仍 100% 缺失，阻塞 Epic E4 | P0 |
| A-P1-1 | Bug | Changelog 断层 — 2026-04-06/07 无版本记录 | P1 |
| A-P1-2 | Process | Zustand 双仓库遗留，canvas-split-hooks Epic 完成后未清理 | P1 |
| A-P2-1 | Tech Debt | Subagent checkpoint 提案（来自4月7日）仍未纳入 Sprint | P2 |

---

## 详细提案

### A-P0-1: 提案执行率归零 — 4月6/7日提案零落地

**问题描述**: 
2026-04-06 发出 5 个 Analyst 提案（A-P0-1 checkpoint、A-P0-2 Snapshot API、A-P1-1 覆盖率、A-P1-2 Reviewer SOP、A-P1-3 Zustand去重），2026-04-07 发出 6 个提案，**至今零落地**。提案生命周期在"proposed"阶段停滞，无人去领任务。

**影响范围**: 
- 已识别的问题持续影响开发效率（如 subagent 超时丢工作）
- Epic E4 (Version History) 被 Snapshot API 缺失持续阻塞
- Sprint 规划失去公信力，提案变成"愿望清单"

**建议方案**:
1. **提案执行追踪表**: 在 `docs/proposals/TRACKING.md` 维护所有提案状态
2. **Triage 机制**: Coord 在每日心跳中扫描提案，对 P0/P1 提案主动派发任务
3. **Analyst 提案验收**: 每轮提案收集后，Analyst 明确标注"本轮需 coord 派发的 P0 任务"
4. **废弃执行率低的提案**: 超过 2 周未启动的提案，状态改为 `stale`，允许新人重新评估

**验收标准**:
- [ ] `docs/proposals/TRACKING.md` 存在且包含 2026-04-06 和 2026-04-07 全部提案
- [ ] 每条提案有 `status` 字段（proposed/in-progress/done/stale）和 `assignee`
- [ ] 本轮（2026-04-08）提案在 48h 内至少有 1 个 P0 被派发

---

### A-P0-2: Snapshot CRUD 端点仍 100% 缺失，阻塞 Epic E4

**问题描述**: 
Analyst 在 2026-04-06 提案 A-P0-2 中已识别：Canvas API 前端封装了 6 个 Snapshot 端点（create/list/get/restore/delete/latest），后端 **0/6 实现**。此提案至今未排入 Sprint，Epic E4 (Version History) 完全无法落地。

**影响范围**: 
- 用户无法保存/恢复画布快照
- Version History Panel（已有 UI）功能空转
- Epic E4 后续所有功能依赖本提案完成

**建议方案**:
**Option A（推荐）**: 独立 Epic，快速突击
```
阶段 1 (2h): Snapshot Service + Schema 验证
  - 复用已有 Prisma CanvasSnapshot model
  - 实现 snapshots.service.ts（共享业务逻辑）
  - Zod schemas 类型安全
阶段 2 (2h): 6 个端点实现
  - POST /snapshots (create)
  - GET /snapshots (list)  
  - GET /snapshots/:id (get)
  - POST /snapshots/:id/restore (restore)
  - GET /snapshots/latest (latest)
  - DELETE /snapshots/:id (delete)
阶段 3 (1h): 测试 + CORS OPTIONS 预检
```

**Option B（备选）**: 纳入 Canvas API Epic
将 Snapshot CRUD 作为 Canvas API Epic 的 Phase 2（Phase 1 是 Context/Flow/Component CRUD）。

**验收标准**:
- [ ] `POST /api/v1/canvas/snapshots` 返回 201 + 正确存入 Prisma
- [ ] `GET /api/v1/canvas/snapshots?projectId=xxx` 返回时间倒序列表
- [ ] `POST /api/v1/canvas/snapshots/:id/restore` 正确恢复项目状态
- [ ] 并发写入触发 409 optimistic locking 响应
- [ ] CORS OPTIONS 在 gateway 层正确响应（参考 canvas-cors learnings）
- [ ] 前端 `canvasApi.listSnapshots()` 端到端可调用（gstack 截图验证）

---

### A-P1-1: Changelog 断层 — 2026-04-06/07 无版本记录

**问题描述**: 
`CHANGELOG.md` 最后一条记录是 2026-04-05（`canvas-quick-generate-command E1`）。2026-04-06 和 2026-04-07 共完成至少以下工作：
- canvas-button-cleanup E4: 移除未使用 `.selectionCheckbox` CSS
- canvas-button-cleanup E5: 批量删除 `deleteAllNodes`
- canvas-jsonrender-preview E3: 预览编辑同步
- P0 fixes (OPTIONS、checkbox、flowId)

**影响范围**: 
- 开发者无法追溯最近的变更
- Reviewer 在代码审查时无法对照 changelog 确认变更范围
- 版本发布时 changelog 不完整

**建议方案**:
1. **立即补录**: 将 2026-04-06 和 2026-04-07 的 changelog 补录到 `CHANGELOG.md`
2. **强制规范**: 在 `HEARTBEAT.md` 或 `CLAUDE.md` 中明确：`每完成一个 Epic 必须更新 CHANGELOG.md`，未更新不允许合并 PR

**验收标准**:
- [ ] `CHANGELOG.md` 包含 2026-04-06 和 2026-04-07 所有完成的 Epic 条目
- [ ] 每个 changelog 条目包含：Epic 名称、Story 描述、commit hash
- [ ] `CLAUDE.md` 中有 changelog 更新规范（可测试：新建 Epic 后忘记更新 changelog，reviewer 应发现）

---

### A-P1-2: Zustand 双仓库遗留 — canvas-split-hooks Epic 完成后未清理

**问题描述**: 
Analyst 在 2026-04-07 提案 A-P1-3 识别了 Zustand 双仓库问题（`/src/stores/` 20个文件 vs `/canvas/stores/` 6个文件），该提案至今未执行。同时，`canvas-split-hooks` Epic 拆分出的新 hooks（如 `useCanvasRenderer`）已引用 canvas/stores，但旧 stores 仍被 CanvasPage 直接引用。

**影响范围**: 
- 状态定义重复，维护成本增加
- CanvasPage 引用混乱，两套 stores 混用
- 未来重构时边界不清

**建议方案**:
1. **Phase 1（本次）**: 编写 `stores/audit.md`，识别所有重叠状态，**不修改任何代码**
2. **Phase 2**: 创建 `canvas/stores/alias.ts` 向后兼容别名（如 `export { useFlowStore as useDesignFlowStore }`）
3. **Phase 3**: 旧 stores 改为从 canvas/stores 读取（read-only wrapper）

**验收标准**:
- [ ] `stores/audit.md` 完整记录所有重叠状态（含状态字段对比表）
- [ ] `canvas/stores/alias.ts` 导出所有向后兼容别名（TypeScript 编译通过）
- [ ] `pnpm build` 在 alias 引入后无新增错误

---

### A-P2-1: Subagent checkpoint 提案（来自4月7日）仍未纳入 Sprint

**问题描述**: 
Analyst 在 2026-04-07 提案 A-P0-1 中识别：`sessions_spawn` 使用 `disown` 模式分离，无 `runTimeoutSeconds`，导致子代理超时后工作完全丢失。2026-04-05 就发现 3 个子代理超时（含 2 个未 commit）。此提案优先级 P0，但至今无人认领。

**影响范围**: 
- 所有子代理任务面临超时丢工作风险
- Coord 无法感知真实进度
- 已完成工作归零，开发效率损失

**建议方案**:
```
Phase 1 (2h): 短期快速止血
  - 所有 sessions_spawn 增加 runTimeoutSeconds 1800（30分钟）
  - 创建 checkpoint 脚本：/root/.openclaw/scripts/checkpoint.sh
  - checkpoint 每 10min 更新一次（子代理主动写）

Phase 2 (2h): 子代理模板增强
  - WIP commit：每 15min git commit -m 'WIP: $task/$step'
  - 任务完成后自动 squash WIP commits
```

**验收标准**:
- [ ] `curl` 或测试模拟 30s 超时后，`/root/.openclaw/checkpoints/$task_id.json` 存在
- [ ] 重新 spawn 相同任务，验证从 checkpoint 恢复（不从头开始）
- [ ] 正常完成的子代理，WIP commits 被 squash，git log 无 WIP 残留

---

## 提案间依赖关系

```
A-P0-1 (提案执行追踪)
    └── 为 A-P0-2、A-P1-2、A-P2-1 提供派发机制

A-P0-2 (Snapshot CRUD)
    └── 解锁 Epic E4 (Version History)
    └── 独立实施，无前置依赖

A-P1-1 (Changelog 补录)
    └── 独立实施，立即执行

A-P1-2 (Zustand 去重 Phase 1)
    └── 独立实施，Phase 1 仅分析不修改

A-P2-1 (Subagent checkpoint)
    └── 独立实施，Coord 层改动
```

## 关键风险与缓解

| 提案 | 主要风险 | 缓解措施 |
|------|---------|---------|
| A-P0-1 | Coord 不配合派发流程 | Analyst 主动在 Slack @coord 跟进 |
| A-P0-2 | Prisma schema 与前端期望不匹配 | 先读 schema 确认兼容性 |
| A-P1-1 | changelog 补录可能遗漏 | 依赖 git log + PR 记录双重验证 |
| A-P1-2 | Phase 1 分析结果无法落地 | 保持小步快跑，每次只做向后兼容变更 |
| A-P2-1 | sessions_spawn 重构影响其他任务 | 先在 staging 测试，30min timeout 仅作为 fallback |

## 自我评估

**Analyst 评分**: 7/10

- 分析覆盖率: 8/10（覆盖5个提案，引用历史数据）
- 优先级判断: 7/10（A-P0-1 执行追踪是元问题，但影响力最大）
- 验收标准具体性: 7/10（可测试，但部分依赖 gstack 截图验证）

**最大盲点**: 不确定 2026-04-06/07 的 dev/architect 提案中是否有与本轮重复的提案，需要 coord 合并去重。
