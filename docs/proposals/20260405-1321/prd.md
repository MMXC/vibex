# PRD: Subagent Timeout Strategy

> **项目**: subagent-timeout-strategy  
> **目标**: 解决 subagent 超时导致已完成代码丢失的问题  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
subagent 通过 `sessions_spawn` 启动后，如果运行时间超过 OpenClaw 会话超时阈值，已完成的代码会完全丢失。父会话无法感知子代理的进度，重新 spawn 会从头开始。

### 目标
- P0: 超时后工作可恢复
- P0: 定期保存进度
- P1: 父会话感知子代理进度
- P2: 隔离工作区

### 成功指标
- AC1: 子代理超时后工作可恢复
- AC2: 父会话可感知子代理进度
- AC3: WIP commit 不污染主分支
- AC4: 改造后原有功能正常

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 方案来源 |
|------|------|--------|------|----------|
| E1 | runTimeoutSeconds 配置 | P0 | 0.5h | 方案C |
| E2 | Checkpoint 脚本 | P0 | 1h | 方案C |
| E3 | WIP Commit 机制 | P1 | 2h | 方案A |
| E4 | 进度报告协议 | P1 | 0.5h | 方案A |
| **合计** | | | **4h** | |

---

### Epic 1: runTimeoutSeconds 配置

**问题根因**: sessions_spawn 无超时配置，导致无限期运行后被强制终止。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 增加 runTimeoutSeconds 参数 | 0.5h | 见下方 |

**S1.1 验收标准**:
- `expect(spawnCall).toContain('--runTimeoutSeconds 1800')` ✓
- 默认超时 30 分钟 ✓

**DoD**:
- [ ] `spawn_task_session()` 增加 `--runTimeoutSeconds 1800`
- [ ] 所有 spawn 调用点增加参数
- [ ] 测试验证超时行为

---

### Epic 2: Checkpoint 脚本

**问题根因**: 无进度持久化，超时后工作丢失。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | checkpoint.sh 脚本 | 0.5h | checkpoint 文件存在 ✓ |
| S2.2 | 恢复逻辑 | 0.5h | 恢复后继续执行 ✓ |

**S2.1 验收标准**:
- `expect(checkpointExists).toBe(true)` after 30s ✓
- `expect(checkpoint.progress).toBeGreaterThan(0)` ✓
- checkpoint 保存在 `/root/.openclaw/checkpoints/` ✓

**S2.2 验收标准**:
- 重新 spawn 后读取 checkpoint ✓
- 从 checkpoint 记录的步骤继续 ✓

**DoD**:
- [ ] `/root/.openclaw/scripts/checkpoint.sh` 创建
- [ ] 子代理内每 10 分钟调用 checkpoint
- [ ] 恢复逻辑读取 checkpoint 继续执行
- [ ] 模拟超时-恢复测试通过

---

### Epic 3: WIP Commit 机制

**问题根因**: 无中间 commit，超时后代码丢失。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | WIP commit 脚本 | 1h | WIP commit 存在 ✓ |
| S3.2 | Squash 清理 | 1h | 主分支无 WIP ✓ |

**S3.1 验收标准**:
- `expect(gitLog).toContain('WIP:')` 在子代理工作分支 ✓
- `expect(wipCommitCount).toBeGreaterThan(0)` after 2+ phases ✓

**S3.2 验收标准**:
- `expect(gitLog).not.toMatch(/WIP:.*main/)` ✓
- 任务完成后 WIP commits 被 squash ✓

**DoD**:
- [ ] 子代理模板增加 WIP commit 调用
- [ ] 每 10 分钟 `git add . && git commit -m 'WIP: $task'`
- [ ] 任务完成后 squash WIP commits
- [ ] git log 无 WIP 在主分支

---

### Epic 4: 进度报告协议

**问题根因**: 父会话无法感知子代理当前进度。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | .subagent_progress 文件 | 0.5h | 进度文件可读 ✓ |

**S4.1 验收标准**:
- `expect(progressFile).toContain('step:')` ✓
- `expect(progressFile).toContain('timestamp:')` ✓
- 父会话可读取 `.subagent_progress` ✓

**DoD**:
- [ ] `.subagent_progress` 文件记录当前步骤
- [ ] 父会话通过 heartbeat 检测进度
- [ ] 进度可视化（可选）

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | runTimeoutSeconds 配置 | E1 | expect(timeout).toBe(1800) | 无 |
| F2.1 | checkpoint.sh 脚本 | E2 | expect(checkpointExists).toBe(true) | 无 |
| F2.2 | 恢复逻辑 | E2 | expect(restoredFrom).toBe('checkpoint') | 无 |
| F3.1 | WIP commit | E3 | expect(gitLog).toContain('WIP:') | 无 |
| F3.2 | Squash 清理 | E3 | expect(mainBranch).not.toContain('WIP') | 无 |
| F4.1 | 进度报告文件 | E4 | expect(progressFile.step).toBeDefined() | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 子代理超时 | 30s 超时模拟 | checkpoint.json 存在 |
| AC2 | 重新 spawn | 读取 checkpoint | 从上一步继续 |
| AC3 | 父会话 | 检测 heartbeat | 读取 .subagent_progress |
| AC4 | 任务完成 | WIP commits 存在 | 自动 squash |
| AC5 | main 分支 | git log | 无 WIP commits |

---

## 5. DoD (Definition of Done)

### E1: runTimeoutSeconds 配置
- [ ] `spawn_task_session()` 增加 `--runTimeoutSeconds 1800`
- [ ] 所有 spawn 调用点增加参数
- [ ] 测试验证超时行为

### E2: Checkpoint 脚本
- [ ] `/root/.openclaw/scripts/checkpoint.sh` 创建
- [ ] 子代理每 10 分钟调用
- [ ] 恢复逻辑测试通过

### E3: WIP Commit 机制
- [ ] WIP commit 每 10 分钟执行
- [ ] 任务完成后 squash
- [ ] main 分支无 WIP

### E4: 进度报告协议
- [ ] `.subagent_progress` 文件存在
- [ ] 父会话可读取
- [ ] 进度可视化

---

## 6. 实施计划

### Sprint 1 (短期, 1.5h)
| Epic | 内容 | 工时 |
|------|------|------|
| E1 | runTimeoutSeconds 配置 | 0.5h |
| E2 | Checkpoint 脚本 | 1h |

### Sprint 2 (长期, 2.5h)
| Epic | 内容 | 工时 |
|------|------|------|
| E3 | WIP Commit 机制 | 2h |
| E4 | 进度报告协议 | 0.5h |

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | checkpoint 不影响子代理主流程 |
| 可靠性 | 超时-恢复 3 次循环验证 |
| 兼容性 | 不破坏现有 heartbeat 脚本 |

---

## 8. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| WIP commit 污染历史 | 任务完成后自动 squash |
| checkpoint 被误删 | 多副本备份 |
| 超时设置过短 | 根据任务类型动态调整 |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
