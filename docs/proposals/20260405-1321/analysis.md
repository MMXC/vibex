# Analysis: subagent-timeout-strategy

**Project**: subagent-timeout-strategy  
**Phase**: analyze-requirements  
**Analyst**: analyst  
**Date**: 2026-04-05  
**Status**: ✅ Research Complete → Analysis Complete

---

## 1. Business Scenario

### Problem Statement

当 subagent 通过 `sessions_spawn` 启动后，如果运行时间超过 OpenClaw 的会话超时阈值，已完成的代码会**完全丢失**。父会话无法感知子代理的进度，重新 spawn 会从头开始，造成重复劳动和进度丢失。

**影响**：
- 开发效率：重复执行已完成的工作
- 进度不可靠：无法信任 subagent 的进度报告
- 团队士气：agent 工作成果随时可能归零

### Target Users

| User | Need |
|------|------|
| 所有 agent（dev/analyst/architect 等） | subagent 执行长时间任务时不丢进度 |
| Coord（编排者） | 任务可恢复，进度可追踪 |
| 团队 | 整体开发效率不受 subagent 超时影响 |

---

## 2. Root Cause Analysis

### 2.1 现状：sessions_spawn 的脆弱性

当前 spawn 模式（参考 `architect-heartbeat.sh`）：

```bash
sessions_spawn \
    --task "$msg" \
    --label "task-$project-$task" \
    --runtime "subagent" \
    --agentId "$agent_id" \
    --mode "session" \
    2>&1 | head -3 &
disown   # ← 分离模式，不等待结果
```

**问题**：
| 问题 | 说明 |
|------|------|
| 无超时配置 | OpenClaw 默认超时触发时强制终止会话 |
| 无进度持久化 | 子代理写磁盘的内容可能不完整（未 flush 或事务未提交）|
| 无结果收集 | `disown` 模式让父会话无法获取子代理的最终状态 |
| 无恢复路径 | `stuck task` 检测只能重新 spawn，从头开始 |

### 2.2 OpenClaw 会话超时机制

基于代码分析：

- subagent 会话存储路径：`/root/.openclaw/agents/main/sessions/sessions.json`
- 会话有 `abortedLastRun` 字段，标记上次是否被中止
- **OpenClaw 核心**：会话超时由 Gateway 配置控制，不在 workspace 脚本中设置
- **sessions_spawn 工具参数**：`runTimeoutSeconds` 控制子代理最大运行时长

### 2.3 已有防护 vs 缺失防护

| 已有的防护 | 能力 | 缺失 |
|-----------|------|------|
| File Lock (`~/.task_locks/`) | 防止任务重复认领 | 不保存代码 |
| Stuck Task 检测 (>1h in-progress) | 重新 spawn | 不恢复工作 |
| Git Worktree | 隔离工作区 | 子代理不使用 worktree |
| 定期提交（人工） | 人工操作 | 子代理不自动 commit |

---

## 3. Core Jobs-To-Be-Done (JTBD)

| JTBD | 描述 | Priority |
|------|------|---------|
| JTBD-1 | subagent 执行过程中能定期保存进度 | P0 |
| JTBD-2 | 超时后能恢复子代理的工作状态 | P0 |
| JTBD-3 | 父会话能感知子代理的当前进度 | P1 |
| JTBD-4 | 每个子代理有隔离的工作区，不污染主分支 | P2 |

---

## 4. Technical Solution Options

### 方案 A：WIP Commit + Checkpoint Protocol（推荐）

**核心思路**：子代理定期将工作状态 commit 到 git，形成 WIP commit 链。超时后，下一次 spawn 先检查是否有未完成的 WIP commit，如有则恢复。

**实现机制**：

```
1. 子代理启动 → 检查是否有 WIP commit → 如有则 checkout
2. 子代理执行 → 每 N 分钟执行一次 "git add . && git commit -m 'WIP: $task/$step'"
3. 子代理完成 → squash WIP commits 或留作历史
4. 超时 → 任务标记 blocked，下次 spawn 恢复 WIP
```

**优点**：
- 利用 git 作为状态存储，无新基础设施
- 每个 checkpoint 都是完整状态
- 可追溯（git log 记录进度历史）
- 兼容现有 file lock 机制

**缺点**：
- 子代理必须 `git add` 精确文件，不能 `git add .`（避免 add 测试临时文件）
- WIP commit 会污染 git 历史
- 频繁 commit 可能影响性能

**工时**：4h（改造 heartbeat + spawn wrapper + 子代理脚本）

---

### 方案 B：Worktree Isolation + External Result Store

**核心思路**：每个子代理分配独立的 git worktree + 结果文件（如 JSON）。超时后 worktree 内容保留，外部脚本读取结果文件决定是否恢复。

**实现机制**：

```
1. spawn 前 → 创建独立 worktree: git worktree add /tmp/subagent-$uuid $branch
2. 子代理运行在 worktree 内 → 结果写入 /tmp/subagent-$uuid/.subagent_result.json
3. 完成 → 合并 worktree 到主分支
4. 超时 → worktree 保留，下次恢复时检查 result.json 进度
```

**优点**：
- 完美隔离，不污染主工作区
- worktree 内容在超时后仍然存在
- 结果文件可携带结构化状态

**缺点**：
- 需要管理大量 worktree（清理机制复杂）
- worktree 合并可能产生冲突
- 基础设施改造量大

**工时**：8h

---

### 方案 C：sessions_spawn runTimeoutSeconds + Incremental File Checkpoint

**核心思路**：利用 `sessions_spawn` 的 `runTimeoutSeconds` 参数设置合理的超时时间，子代理通过写文件到指定目录来 checkpoint。

**实现机制**：

```bash
# spawn 时设置合理超时
sessions_spawn \
    --task "$msg" \
    --runTimeoutSeconds 2700 \   # 45分钟，合理上限
    --label "task-$project-$task" \
    --runtime "subagent" \
    --mode "session"   # 非 disown，等待结果

# 子代理内：每 10 分钟 checkpoint
echo "{\"step\": \"phase1\", \"progress\": 0.5, \"timestamp\": $(date +%s)}" \
    > /tmp/checkpoints/$task_id.json
```

**优点**：
- OpenClaw 原生参数，无需修改核心
- 最小改造
- checkpoint 文件结构化、可解析

**缺点**：
- 需要修改所有 spawn 调用点
- `mode: session`（非 disown）会阻塞父会话
- 仍然需要恢复逻辑

**工时**：2h（参数调整 + checkpoint 脚本）

---

### 方案对比

| 维度 | 方案A (WIP Commit) | 方案B (Worktree) | 方案C (Timeout+Checkpoint) |
|------|-------------------|-----------------|--------------------------|
| 改造量 | 中（4h） | 大（8h） | 小（2h） |
| 状态完整性 | ✅ Git 托管 | ✅ Worktree | ⚠️ 需实现 |
| 恢复能力 | ✅ 强 | ✅ 强 | ⚠️ 需实现 |
| 基础设施 | 0（用 git） | 需要 worktree 管理 | 最小 |
| 维护成本 | 中（清理 WIP commits） | 高（worktree 清理） | 低 |
| 侵入性 | 低 | 高 | 中 |

---

## 5. Recommended Solution: Hybrid (A + C)

**推荐方案 A（短期）+ 方案 C（长期补充）**：

### 短期（立即实施，2h）

1. **设置合理的 `runTimeoutSeconds`**：所有 `sessions_spawn` 调用增加 `runTimeoutSeconds` 参数（建议 30 分钟）
2. **创建 checkpoint 脚本** `/root/.openclaw/scripts/checkpoint.sh`：

```bash
#!/bin/bash
# checkpoint.sh - 轻量级进度保存
TASK_ID=$1
PROGRESS=$2
CHECKPOINT_DIR="/root/.openclaw/checkpoints"
mkdir -p "$CHECKPOINT_DIR"
echo "{\"task\":\"$TASK_ID\",\"progress\":$PROGRESS,\"updated\":\"$(date -Iseconds)\"}" \
    > "$CHECKPOINT_DIR/$TASK_ID.json"
```

3. **修改 spawn 脚本**：在 `spawn_task_session()` 中增加 timeout 参数
4. **改造 stuck task 检测**：超时后读取 checkpoint.json 恢复进度

### 长期（1-2 周内，4h）

1. **WIP Commit 机制**：子代理定期 `git commit -m 'WIP: $task'`
2. **进度报告协议**：子代理在 `.subagent_progress` 文件记录当前步骤
3. **Squash 清理**：任务完成后 squash WIP commits

---

## 6. Risk Assessment

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| WIP commit 污染 git 历史 | 中 | 任务完成后自动 squash |
| checkpoint 文件被误删 | 低 | 多副本备份到 S3/gist |
| 子代理长时间占用 worktree | 低 | 自动清理 >24h 未完成的 worktree |
| timeout 设置过短 | 中 | 根据任务类型动态调整（分析 30m vs 开发 60m）|

---

## 7. Verification Criteria

| 标准 | 验证方法 |
|------|---------|
| 子代理超时后工作可恢复 | 模拟 30s 超时，检查 checkpoint.json 存在 |
| 父会话可感知子代理进度 | 读取 .subagent_progress 文件 |
| WIP commit 不影响主分支 | `git log --oneline` 无 WIP 在主分支 |
| 改造后原有功能正常 | 现有 heartbeat 脚本执行无报错 |

**具体验收测试**：
1. 启动一个 2 分钟的子代理，在 30s 处 kill（模拟超时），检查 checkpoint 文件
2. 重新 spawn 相同任务，验证从 checkpoint 恢复
3. 连续 3 次超时-恢复循环，验证状态连续性
4. 正常完成子代理，验证 WIP commits 被 squash

---

## 8. Implementation Sketch

### Phase 1: Short-term (立即可用)

| 文件 | 修改内容 |
|------|---------|
| `/root/.openclaw/scripts/heartbeats/common.sh` | `spawn_task_session()` 增加 `--runTimeoutSeconds 1800` |
| `/root/.openclaw/scripts/checkpoint.sh` | 新建：checkpoint 保存脚本 |
| `/root/.openclaw/scripts/heartbeats/architect-heartbeat.sh` | 改造 stuck task 检测，读取 checkpoint |
| `/root/.openclaw/scripts/heartbeats/dev-heartbeat.sh` | 同上 |

### Phase 2: Long-term (1-2周)

| 文件 | 修改内容 |
|------|---------|
| 子代理模板 | 增加 WIP commit 调用 |
| git hooks | 自动 squash 已完成任务的 WIP commits |
| 监控告警 | checkpoint 缺失超过阈值时告警 |

---

*Research sources: `architect-heartbeat.sh`, `common.sh`, `task_manager.py`, sessions.json analysis, OpenClaw docs (sessions/subagents)*
