# PRD: Dev 自检提案实施 — 2026-03-31

> **任务**: vibex-dev-proposals-20260331_060315/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **项目路径**: /root/.openclaw/vibex
> **产出物**: /root/.openclaw/vibex/docs/vibex-dev-proposals-20260331_060315/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | Dev 自检提案，5 条改进方向：exec freeze 修复、Vitest 加速、task_manager 统一、health check、P0-3 待补充 |
| **目标** | 解决开发基础设施问题，恢复团队日常工作效率 |
| **成功指标** | exec 正常；Vitest 单文件 < 10s；task_manager 单一版本 |

---

## 2. Epic 拆分

### Epic 1: Exec 管道修复（P0，工程 Sprint）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | sandbox 环境 PATH 恢复 | 1h | `expect(exec('echo test').output).toBe('test');` |
| S1.2 | git 操作验证 | 0.5h | `expect(exec('git status').code).toBe(0);` |
| S1.3 | task_manager update 验证 | 0.5h | `expect(exec('python3 task_manager.py status test', { cwd: TASK_DIR }).code).toBe(0);` |

**DoD**: `exec echo "TEST"` 返回 "TEST"，git 和 task_manager 均正常工作

---

### Epic 2: Vitest 测试速度优化（P0，工程 Sprint）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | Vitest 配置优化 | 0.5h | `expect(vitestRunTime).toBeLessThan(10);` |
| S2.2 | 增量测试配置 | 0.5h | `expect(changedOnly).toPass();` |

**DoD**: 单文件测试 < 10s，完整套件 < 3min

---

### Epic 3: task_manager 路径统一（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | 现有路径审计 | 1h | `expect(taskManagerLocations.length).toBe(1);` |
| S3.2 | 统一到单一 canonical 路径 | 2h | `expect(allAgentsUseSameVersion).toBe(true);` |

**DoD**: 只有一个 canonical task_manager，所有 agent 使用相同版本

---

### Epic 4: HEARTBEAT exec 健康检查（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S4.1 | heartbeat 脚本增加 exec 测试 | 0.5h | `expect(exec('echo HEALTH_CHECK').output).toMatch('HEALTH_CHECK');` |
| S4.2 | 断裂时告警 | 0.5h | `expect(slackAlertOnBroken).toBe(true);` |

**DoD**: exec 断裂时心跳报告 EXEC_BROKEN 并发送 Slack 告警

---

## 3. 实施计划

| Epic | 工时 | 优先级 | 负责人 |
|------|------|--------|--------|
| Epic 1: Exec 管道修复 | 2h | P0 | dev |
| Epic 2: Vitest 速度优化 | 1h | P0 | dev |
| Epic 3: task_manager 统一 | 3h | P1 | dev |
| Epic 4: Health Check | 1h | P1 | dev |

**总工时**: 7h
