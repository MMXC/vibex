# PRD: VibeX Analyst Proposals 2026-04-08

> **项目**: vibex-analyst-proposals-vibex-proposals-20260408
> **目标**: 落地 Analyst 提案（提案追踪、Snapshot CRUD、Changelog、Zustand Audit、Subagent Checkpoint）
> **来源**: proposals/20260408/analyst.md
> **PRD 作者**: pm agent
> **日期**: 2026-04-08
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
2026-04-06 和 2026-04-07 两轮提案收集共产生 11 个提案（A-P0-1~A-P2-1），**至今零落地**。提案生命周期在 "proposed" 阶段停滞，核心阻塞点：
1. **A-P0-2** Snapshot CRUD：前端已封装 6 个端点，后端 0/6 实现，阻塞 Epic E4 (Version History)
2. **A-P0-1** 提案追踪：缺乏执行追踪机制，P0 提案无人认领
3. **A-P1-1** Changelog 断层：2026-04-06/07 无版本记录
4. **A-P1-2** Zustand 双仓库：canvas-split-hooks 完成后旧 stores 未清理
5. **A-P2-1** Subagent Checkpoint：子代理超时丢工作问题未解决

### 提案来源
| Agent | 提案数 | P0 | P1 | P2 |
|-------|--------|-----|-----|-----|
| analyst | 5 | 2 | 2 | 1 |

### 目标
- P0: 建立提案追踪机制 + 完成 Snapshot CRUD（6 端点）
- P1: 补录 Changelog + 完成 Zustand Audit Phase1（分析）
- P2: Subagent Checkpoint 脚本

### 成功指标
- AC1: `docs/proposals/TRACKING.md` 存在且 48h 内有 P0 被派发
- AC2: Snapshot 6 端点全部可调用（CORS + HTTP 正确）
- AC3: CHANGELOG.md 包含 2026-04-06/07 全部 Epic
- AC4: `stores/audit.md` 存在，TypeScript 编译通过
- AC5: `checkpoint.sh` 可执行，超时后可恢复

---

## 2. Planning — Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 | 优先级 |
|----|--------|------|---------|------|--------|
| F1.1 | 提案追踪表 | docs/proposals/TRACKING.md，含 status + assignee | A-P0-1 | 1h | P0 |
| F2.1 | Snapshot create | POST /api/v1/canvas/snapshots | A-P0-2 | 1h | P0 |
| F2.2 | Snapshot list | GET /api/v1/canvas/snapshots?projectId= | A-P0-2 | 0.5h | P0 |
| F2.3 | Snapshot get | GET /api/v1/canvas/snapshots/:id | A-P0-2 | 0.5h | P0 |
| F2.4 | Snapshot restore | POST /api/v1/canvas/snapshots/:id/restore | A-P0-2 | 1h | P0 |
| F2.5 | Snapshot latest | GET /api/v1/canvas/snapshots/latest | A-P0-2 | 1h | P0 |
| F2.6 | Snapshot delete | DELETE /api/v1/canvas/snapshots/:id | A-P0-2 | 1h | P0 |
| F3.1 | Changelog 补录 | 补录 2026-04-06/07 所有 Epic | A-P1-1 | 0.5h | P1 |
| F3.2 | Changelog 规范 | CLAUDE.md 中添加更新规范 | A-P1-1 | 0.5h | P1 |
| F4.1 | Zustand Audit Phase1 | stores/audit.md + alias.ts（向后兼容） | A-P1-2 | 3h | P1 |
| F5.1 | Subagent Checkpoint | checkpoint.sh + WIP commits + 超时恢复 | A-P2-1 | 4h | P2 |
| **合计** | | | | **14h** | |

---

## 3. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 提案来源 |
|------|------|--------|------|----------|
| E1 | 提案执行追踪 | P0 | 1h | A-P0-1 |
| E2 | Snapshot CRUD 端点 | P0 | 5h | A-P0-2 |
| E3 | Changelog 补录 + 规范 | P1 | 1h | A-P1-1 |
| E4 | Zustand Audit Phase1 | P1 | 3h | A-P1-2 |
| E5 | Subagent Checkpoint | P2 | 4h | A-P2-1 |
| **合计** | | | **14h** | |

---

### Epic 1: 提案执行追踪

**问题根因**: 提案提出后无追踪机制，P0 提案无人认领，生命周期停滞。

**提案引用**: A-P0-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 创建 TRACKING.md | 0.5h | 文件存在 |
| S1.2 | 录入 2026-04-06/07 提案 | 0.5h | 全部提案录入 |

**S1.1 验收标准**:
- `expect(fs.existsSync('docs/proposals/TRACKING.md')).toBe(true)` ✓

**S1.2 验收标准**:
- `expect(grep -c 'status:' docs/proposals/TRACKING.md).toBeGreaterThan(10)` ✓
- `expect(grep '2026-04-06' docs/proposals/TRACKING.md).not.toBe(null)` ✓

**DoD**:
- [ ] `docs/proposals/TRACKING.md` 包含 2026-04-06 和 2026-04-07 全部提案
- [ ] 每条提案有 `status` 和 `assignee` 字段
- [ ] Coord 在心跳扫描中主动派发 P0 提案

---

### Epic 2: Snapshot CRUD 端点

**问题根因**: 前端封装 6 个端点，后端 0/6 实现。Hono 和 Next.js 双后端 schema 不一致。

**提案引用**: A-P0-2

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | Schema 审计 + 确定源后端 | 1h | schema 差异文档 |
| S2.2 | 实现 create + list | 1.5h | HTTP 201/200 |
| S2.3 | 实现 get + restore | 1.5h | HTTP 200 |
| S2.4 | 实现 latest + delete | 1h | HTTP 200/204 |
| S2.5 | CORS OPTIONS + 集成测试 | 1h | curl 204 + test pass |

**S2.2 验收标准**:
- `expect(POST /snapshots).toMatchObject({ id: expect.any(String) })` ✓
- `expect(GET /snapshots?projectId=x).toBeInstanceOf(Array)` ✓
- `expect(status).not.toBe(500)` ✓

**S2.3 验收标准**:
- `expect(GET /snapshots/:id).toMatchObject({ id: expect.any(String) })` ✓
- `expect(POST /snapshots/:id/restore).toMatchObject({ success: true })` ✓

**S2.4 验收标准**:
- `expect(GET /snapshots/latest?projectId=x).toMatchObject({ id: expect.any(String) })` ✓
- `expect(DELETE /snapshots/:id).toBe(204)` ✓

**S2.5 验收标准**:
- `expect(curl -X OPTIONS -I /snapshots).toBe(204)` ✓
- `expect(pnpm test --testPathPattern="snapshots").toBe(0)` ✓

**DoD**:
- [ ] Hono 后端 6 端点全部实现（create/list/get/restore/latest/delete）
- [ ] CORS OPTIONS 在 gateway 层处理
- [ ] Prisma CanvasSnapshot model 验证通过
- [ ] gstack 截图验证前端 `canvasApi.listSnapshots()` 端到端可调用
- [ ] 并发写入触发 409 optimistic locking 响应

---

### Epic 3: Changelog 补录 + 规范

**问题根因**: CHANGELOG.md 最后记录是 2026-04-05，2026-04-06/07 共完成至少 8 个 Epic 无记录。

**提案引用**: A-P1-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 补录 2026-04-06/07 Epic | 0.5h | changelog 完整 |
| S3.2 | CLAUDE.md 添加规范 | 0.5h | 规范存在 |

**S3.1 验收标准**:
- `expect(grep '2026-04-06' CHANGELOG.md).toBeTruthy()` ✓
- `expect(grep '2026-04-07' CHANGELOG.md).toBeTruthy()` ✓
- `expect(grep 'commit' CHANGELOG.md).toBeTruthy()` ✓（含 commit hash）

**S3.2 验收标准**:
- `expect(grep 'CHANGELOG' CLAUDE.md).toBeTruthy()` ✓

**DoD**:
- [ ] `git log --oneline --since='2026-04-06' --until='2026-04-08' | wc -l` ≥ 8
- [ ] 每个 changelog 条目含 Epic 名称 + commit hash
- [ ] `CLAUDE.md` 包含 changelog 更新规范

---

### Epic 4: Zustand Audit Phase1

**问题根因**: `/src/stores/`（20个）与 `/canvas/stores/`（6个）双仓库，canvas-split-hooks 后旧 stores 未清理。

**提案引用**: A-P1-2

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | 编写 stores/audit.md | 2h | audit 文档完整 |
| S4.2 | 创建 canvas/stores/alias.ts | 1h | TS 编译通过 |

**S4.1 验收标准**:
- `expect(fs.existsSync('stores/audit.md')).toBe(true)` ✓
- `expect(grep '重叠' stores/audit.md).toBeTruthy()` ✓

**S4.2 验收标准**:
- `expect(pnpx tsc --noEmit stores/canvas/stores/alias.ts).toBe(0)` ✓
- `expect(pnpm build).toBe(0)` ✓

**DoD**:
- [ ] `stores/audit.md` 包含状态重叠矩阵
- [ ] `canvas/stores/alias.ts` 导出所有向后兼容别名
- [ ] TypeScript 编译无新增错误
- [ ] **Phase 1 仅分析不修改**，不破坏现有功能

---

### Epic 5: Subagent Checkpoint

**问题根因**: `sessions_spawn` 用 `disown` 模式，无 `runTimeoutSeconds`，子代理超时后工作完全丢失。

**提案引用**: A-P2-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S5.1 | checkpoint.sh 脚本 | 2h | 脚本可执行 |
| S5.2 | WIP commit 规范 | 1h | git log 无 WIP 残留 |
| S5.3 | 超时恢复验证 | 1h | 恢复测试通过 |

**S5.1 验收标准**:
- `expect(fs.existsSync('/root/.openclaw/scripts/checkpoint.sh')).toBe(true)` ✓
- `expect(fs.statSync('/root/.openclaw/scripts/checkpoint.sh').mode & 0o111).toBeTruthy()` ✓
- 模拟 30s 超时后，`/root/.openclaw/checkpoints/$task_id.json` 存在 ✓

**S5.2 验收标准**:
- `expect(grep 'WIP' git log).toBeFalsy()` after squash ✓

**S5.3 验收标准**:
- 重新 spawn 相同任务，从 checkpoint 恢复，不从头开始 ✓

**DoD**:
- [ ] `/root/.openclaw/scripts/checkpoint.sh` 存在且可执行
- [ ] checkpoint 更新频率 ≤ 10min
- [ ] 正常完成的子代理，WIP commits 被 squash
- [ ] 超时后重新 spawn 可从 checkpoint 恢复

---

## 4. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 提案追踪表 | E1 | expect(TRACKING.md).toExist() | 无 |
| F2.1 | Snapshot create | E2 | expect(status).toBe(201) | 无 |
| F2.2 | Snapshot list | E2 | expect(Array.isArray()) | 无 |
| F2.3 | Snapshot get | E2 | expect(id).toBeDefined() | 无 |
| F2.4 | Snapshot restore | E2 | expect(success).toBe(true) | 无 |
| F2.5 | Snapshot latest | E2 | expect(id).toMatch(/^snap-/) | 无 |
| F2.6 | Snapshot delete | E2 | expect(status).toBe(204) | 无 |
| F3.1 | Changelog 补录 | E3 | expect('2026-04-06').toBeIn(CHANGELOG) | 无 |
| F3.2 | Changelog 规范 | E3 | expect(CLAUDE.md).toContain(CHANGELOG) | 无 |
| F4.1 | Zustand Audit | E4 | expect(alias.ts).toCompileWithoutError() | 无 |
| F5.1 | Checkpoint 脚本 | E5 | expect(checkpoint.sh).toBeExecutable() | 无 |

---

## 5. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | Coord 心跳扫描 | P0 提案待处理 | 48h 内派发完成 |
| AC2 | `POST /snapshots` | 正常请求 | HTTP 201 + id 字段 |
| AC3 | `GET /snapshots/latest` | 有 snapshot | 返回最新一条 |
| AC4 | `DELETE /snapshots/:id` | 存在 snapshot | HTTP 204 |
| AC5 | `curl -X OPTIONS` | Snapshot 端点 | HTTP 204 + CORS headers |
| AC6 | Changelog | git log 分析 | 2026-04-06/07 各 ≥ 4 条目 |
| AC7 | TypeScript | `tsc --noEmit` | 0 errors（含 alias.ts） |
| AC8 | Checkpoint | 模拟超时 | checkpoint.json 存在 |

---

## 6. DoD (Definition of Done)

### E1: 提案执行追踪
- [ ] `docs/proposals/TRACKING.md` 存在
- [ ] 包含 2026-04-06 和 2026-04-07 全部提案
- [ ] 每条含 `status` + `assignee` 字段

### E2: Snapshot CRUD 端点
- [ ] 6 端点全部可调用（create/list/get/restore/latest/delete）
- [ ] CORS OPTIONS 返回 204
- [ ] 并发写入触发 409
- [ ] gstack 截图验证前端可调用

### E3: Changelog 补录 + 规范
- [ ] `CHANGELOG.md` 包含 2026-04-06/07 全部 Epic
- [ ] 每条含 commit hash
- [ ] `CLAUDE.md` 含更新规范

### E4: Zustand Audit Phase1
- [ ] `stores/audit.md` 存在，含状态重叠矩阵
- [ ] `canvas/stores/alias.ts` TypeScript 编译通过
- [ ] `pnpm build` 无新增错误

### E5: Subagent Checkpoint
- [ ] `checkpoint.sh` 可执行
- [ ] 超时后 checkpoint 文件存在
- [ ] WIP commits 被 squash，无残留

---

## 7. 实施计划

### Sprint 1 (P0, 6h)
| Epic | 内容 | 工时 |
|------|------|------|
| E1 | 提案执行追踪 | 1h |
| E2 | Snapshot CRUD 端点 | 5h |

### Sprint 2 (P1, 4h)
| Epic | 内容 | 工时 |
|------|------|------|
| E3 | Changelog 补录 + 规范 | 1h |
| E4 | Zustand Audit Phase1 | 3h |

### Sprint 3 (P2, 4h)
| Epic | 内容 | 工时 |
|------|------|------|
| E5 | Subagent Checkpoint | 4h |

---

## 8. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | Snapshot 列表查询 < 200ms |
| 兼容性 | 新端点不影响现有 canvas 页面 |
| 可观测性 | Snapshot 操作写入 structured log |
| 安全性 | Snapshot delete 需 projectId 校验 |

---

## 9. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| Snapshot schema 不匹配 | 先审计 Prisma schema，再实现 |
| 双后端迁移风险 | Option B：保持 Next.js + Hono 双后端，逐步迁移 |
| Checkpoint 影响 disown 逻辑 | 先在 staging 测试，30min timeout 作为 fallback |

---

*文档版本: v1.0 | 最后更新: 2026-04-08*
