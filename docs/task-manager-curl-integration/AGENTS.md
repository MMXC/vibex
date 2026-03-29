# AGENTS.md: task_manager.py 内置 curl 催办通知 — Agent 协作指南

> **项目**: task-manager-curl-integration
> **日期**: 2026-03-30

---

## 角色与职责

| Agent | 职责 | 产出物 |
|-------|------|--------|
| **Analyst** | 问题根因分析 | analysis.md ✅ |
| **PM** | PRD 细化 | prd.md ✅ |
| **Architect** | 架构设计 + 实现计划 | architecture.md ✅, IMPLEMENTATION_PLAN.md ✅ |
| **Dev** | 实施通知模块 + 命令集成 | PR + 代码变更 |
| **Reviewer** | 代码审查 | review 报告 |

---

## 开发流程

### Phase 1: Epic 1 — 通知模块开发 (Dev, 2h)

1. 阅读 `task_manager.py` 顶部结构
2. 新增 `AGENT_CHANNEL` 和 `AGENT_TOKEN` 配置
3. 实现 `_curl_slack()` 基础函数
4. 实现 `notify_new_task()` / `notify_stage_done()` / `notify_stage_rejected()`
5. 单元测试验证（mock urllib.request）

### Phase 2: Epic 2 — 命令集成 (Dev, 4h)

1. 在 `cmd_phase1()` 末尾集成 `notify_new_task()`
2. 在 `cmd_phase2()` 末尾集成 `notify_new_task()`
3. 实现 `get_downstream_agent()` 函数
4. 在 `cmd_update()` 集成 `notify_stage_done()` / `notify_stage_rejected()`
5. 手动测试各场景

### Phase 3: Epic 3 — 环境配置 (Dev, 1h)

1. 创建 `.env.example` 文件
2. 更新 `TOOLS.md` 添加配置说明
3. Coord 配置各 Agent 的 Slack Token

---

## 关键文件

| 文件 | 作用 | 修改者 |
|------|--------|--------|
| `task_manager.py` | 通知模块 + 命令集成 | Dev |
| `.env.example` | 环境变量模板 | Dev (新建) |
| `TOOLS.md` | 配置说明 | Dev (更新) |

---

## 协作约定

- **Epic 1 完成后** → 单独测试 `_curl_slack()` 函数
- **Epic 2 完成后** → 手动测试 phase1/phase2/update 通知
- **PR 创建后** → Reviewer 代码审查
- **重要**: Token 通过环境变量注入，不硬编码
