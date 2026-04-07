# PRD: Dev 自检提案 — 2026-03-31 批次2

> **任务**: vibex-dev-proposals-20260331_092525/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/vibex-dev-proposals-20260331_092525/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | Dev 自检提案：Exec Freeze(P0)、Vitest加速(P0)、task_manager统一(P1)等 |
| **目标** | 解除开发基础设施阻塞，恢复团队日常工作效率 |
| **成功指标** | exec 正常；Vitest 单文件 < 10s；task_manager 单一版本 |

---

## 2. Epic 拆分

### Epic 1: Exec 管道修复（P0）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S1.1 sandbox PATH 恢复 | 1h | `expect(exec('echo test').output).toBe('test');` |
| S1.2 git 操作验证 | 0.5h | `expect(exec('git status').code).toBe(0);` |
| S1.3 task_manager update 验证 | 0.5h | `expect(exec('python3 task_manager.py status test').code).toBe(0);` |

**DoD**: exec echo "TEST" 返回 TEST，git 和 task_manager 正常

---

### Epic 2: Vitest 测试速度优化（P0）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S2.1 Vitest 配置优化 | 0.5h | `expect(vitestRunTime).toBeLessThan(10);` |
| S2.2 增量测试配置 | 0.5h | `expect(changedOnly).toPass();` |

**DoD**: 单文件 < 10s，完整套件 < 3min

---

### Epic 3: task_manager 路径统一（P1）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S3.1 现有路径审计 | 1h | `expect(taskManagerLocations.length).toBe(1);` |
| S3.2 统一到 canonical 路径 | 2h | `expect(allAgentsUseSameVersion).toBe(true);` |

**DoD**: 只有一个 canonical 版本，所有 agent 使用相同版本

---

### Epic 4: HEARTBEAT exec 健康检查（P1）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S4.1 heartbeat 增加 exec 测试 | 0.5h | `expect(exec('echo HEALTH').output).toMatch('HEALTH');` |
| S4.2 断裂时告警 | 0.5h | `expect(slackAlertOnBroken).toBe(true);` |

**DoD**: exec 断裂时心跳报告 EXEC_BROKEN

---

### Epic 5: Epic4 F4.1 Undo/Redo 修复（P2）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S5.1 handleCheckboxToggle 集成 historyStore | 1h | `expect(history.recordSnapshot).toHaveBeenCalled();` |
| S5.2 验证撤销/重做功能 | 1h | `expect(ctrlZ).toUndo(); expect(ctrlShiftZ).toRedo();` |

**DoD**: checkbox 操作可撤销/重做

---

**总工时**: 9h
