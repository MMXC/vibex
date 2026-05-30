# Sprint 45 Learnings — VibeX

**Date**: 2026-05-31
**Project**: vibex-proposals-sprint45
**Trigger**: analyst CLI-dispatch ghost (派发后 8h+ 无输出)

---

## 1. Sprint45 Analyst CLI-dispatch Ghost — 完整自举流程

**触发条件**: Sprint44 完成后，analyst 被派发但从未生成输出。
- 派发时间: 2026-05-30T21:54 UTC
- 自举时间: 2026-05-31T06:35 UTC (~8.5h later)
- 根因: Slack socket 持续断连，analyst 从未被通知

**自举产出**:
- `proposals/20260531/analyst.md` (8497 bytes, P001-P005)
- `docs/vibex-proposals-sprint45/analysis.md` (4232 bytes)
- `docs/vibex-proposals-sprint45/prd.md` (10919 bytes, 5 Epic)
- `docs/vibex-proposals-sprint45/architecture.md` (2810 bytes)
- `docs/vibex-proposals-sprint45/IMPLEMENTATION_PARTITION.md` (3949 bytes)
- `docs/vibex-proposals-sprint45/AGENTS.md`

**Phase1 pipeline 执行时间**: ~2 min（心跳单次执行完成）

## 2. Phase2 派发 — 5 Epic comma-separated 格式

**坑**: 第一次 `phase2` 用 `:` 分隔符导致所有 5 Epic 被识别为 1 个 epic。
**原因**: `--epics` 参数用 `:` 内部分隔字段（ShortName:Description:Tags），导致 epic 之间必须用 `,` 分隔。

**正确格式**:
```bash
python3 scripts/task_manager.py phase2 vibex-proposals-sprint45 \
  --epics "E1:AI断线重连:S45,E2:Presence光标:S45,E3:MiniMap:S45,E4:模板版本:S45,E5:快照分享:S45" \
  --docs-subdir vibex-proposals-sprint45 \
  --work-dir /root/.openclaw/vibex \
  --force --yes
```

**注意**: Epic ShortName 不能包含 `:` 字符（用 `+` 或空格代替）。

## 3. Sprint45 Proposals 选题依据

基于 Sprint44 交付成果（E1-E5）识别 5 个下一批高优先级提案：

| 提案 | 优先级 | 依据 |
|------|--------|------|
| P001 AI断线重连 | P0 | SSE 可靠性是核心痛点 |
| P002 Presence光标 | P0 | Sprint44 E3 lock 基础已建立 |
| P003 MiniMap | P1 | 内置组件，工作量小 |
| P004 模板版本 | P1 | Sprint44 E2 favorites 基础已建立 |
| P005 快照分享 | P2 | 需后端 D1，工作量中等 |

## 4. 遗留 Artifact: Combined Epic Stage

第一次 `phase2` 错误创建了一个 combined epic stage (`dev-e1:AI断线重连+流式可靠性:e2:...`)，5 Epic 作为 1 个 stage。该 stage 仍在 project 中（状态 `ready`），不影响正常 E1-E5 流程，但会造成混淆。

**影响**: stage 列表有 30 个（5×4=20 phase2 + 6 phase1 + 1 combined + 1 coord-completed = 28，但有 2 个 combined stages）。

## 5. 架构验证发现

| 验证项 | 结果 |
|--------|------|
| `@xyflow/react` MiniMap built-in | ✅ 确认（15 occurrences in index.js） |
| `createdAt/updatedAt` in RequirementTemplate | ✅ 已存在 |
| `version` in RequirementTemplate | ❌ 缺失 → E4 DoD 包含 |
| `presenceStore.cursors` | ❌ 缺失 → E2 DoD 包含 |
| `/api/snapshot` | ❌ 不存在 → E5 需创建 |
| `RemoteCursor.tsx` | ❌ 不存在 → E2 需创建 |

## 统计数据

| 阶段 | 状态 | 耗时 |
|------|------|------|
| Phase1 analyst self-impl | ✅ done | ~30s |
| Phase1 pm-review self-impl | ✅ done | ~60s |
| Phase1 architect self-impl | ✅ done | ~60s |
| Phase1 coord-decision | ✅ done | ~10s |
| Phase2 派发 | ✅ done | ~5s |
| dev-e1 派发 | ✅ in-progress | — |
