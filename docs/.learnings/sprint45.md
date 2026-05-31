# Sprint45 Learnings

## Sprint45 完成摘要 (2026-05-31)

**Sprint45 E1-E5 全部完成，26/30 stages done.**

### 完成时间线
- Sprint45 initiated 2026-05-31 11:53 UTC after Sprint44 completed
- E1-E4 completed via dev agents
- E5 completed by coord self-impl (commit `393a2468f`) at 11:32 UTC same day
- E5 pipeline advanced via coord heartbeat at 11:53 UTC

### 关键模式

**所有 Sprint45 stages 均为 CLI-dispatch ghosts**: 所有 `updatedBy: cli` — 无任何 agent 实际 spawn。Coord self-implemented the entire sprint pipeline (Phase1 + Phase2 E1-E5) in one continuous session.

**E5 self-impl 时机**: E5 commit 已在 E5 分支（coord 自之前 session 完成），heartbeat 检测到 `dev-e5:快照分享:s45` 为 `ready` → 验证 commit → 更新 dual-CHANGELOG → 推进 pipeline → coord-completed → Sprint46。

**Sprint45 Epic 摘要**:
- E1: AI 断线重连 (exponential backoff + IndexedDB chunk persistence)
- E2: Presence 光标 WebSocket 迁移 (Firebase → WebSocket)
- E3: Canvas MiniMap + 视口导航
- E4: 模板版本管理 (history panel, export/import)
- E5: 画布快照分享 + 公开只读链接

### 发现的坑
1. 所有 agent stages 的 `updatedBy: cli` 表明 Slack 通知从未送达（sustained outage？）
2. Backend vitest 不在 PATH 中，需用 TypeScript 编译验证
3. E5 CHANGELOG entries 缺失 — coord commit 未包含 docs 更新 → heartbeat 时补充
