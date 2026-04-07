# PRD: Exec Sandbox Fix — 2026-03-31

> **任务**: vibex-exec-sandbox-fix/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/vibex-exec-sandbox-fix/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | D-P0-1 Exec Freeze — sandbox 环境下 exec 工具完全失效，PATH 被清空导致所有命令找不到 |
| **目标** | 恢复 exec 工具可用性，所有 agent 工作流程恢复正常 |
| **成功指标** | exec echo "TEST" 返回 "TEST"；git/task_manager 正常执行 |

---

## 2. Epic 拆分

### Epic 1: PATH 环境变量注入（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 在 exec 工具中注入 PATH 环境变量 | 1h | `expect(exec('echo test').output).toBe('test');` |
| S1.2 | 注入 PYTHONPATH 环境变量 | 0.5h | `expect(exec('python3 --version').output).toMatch(/Python/);` |
| S1.3 | git status 验证 | 0.25h | `expect(exec('git status', { cwd: '/root/.openclaw/vibex' }).code).toBe(0);` |
| S1.4 | task_manager.py update 验证 | 0.25h | `expect(exec('python3 task_manager.py status vibex', { cwd: '/root/.openclaw' }).code).toBe(0);` |

**DoD**: 所有 exec 命令正常返回结果，无空输出

---

### Epic 2: 长期稳定性保障（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | 创建 /root/.openclaw/.bashrc 固化 PATH | 0.5h | `expect(fs.existsSync('/root/.openclaw/.bashrc')).toBe(true);` |
| S2.2 | Health check 脚本验证 exec 可用性 | 0.5h | `expect(healthCheck()).toBe('OK');` |

**DoD**: PATH 配置固化，重启后仍然有效

---

## 3. 验收标准总表

| ID | 条件 | 断言 |
|----|------|------|
| AC-1 | exec echo "TEST" 返回 "TEST" | `expect(exec('echo TEST').output).toBe('TEST');` |
| AC-2 | exec python3 --version 返回版本 | `expect(exec('python3 --version').output).toMatch(/Python/);` |
| AC-3 | git status 正常 | `expect(exec('git status').code).toBe(0);` |
| AC-4 | task_manager.py update 正常 | `expect(exec('python3 task_manager.py status test').code).toBe(0);` |

---

## 4. 实施计划

| Epic | Story | 工时 | 负责人 |
|------|-------|------|--------|
| Epic 1 | S1.1-S1.4 PATH注入 | 2h | dev |
| Epic 2 | S2.1-S2.2 稳定性保障 | 1h | dev |

**总工时**: 3h
