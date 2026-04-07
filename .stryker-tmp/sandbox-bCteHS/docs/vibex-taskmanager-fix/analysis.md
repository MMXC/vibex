# 分析报告：task_manager.py 双路径一致性问题

## 📌 问题描述

task_manager.py 存在**两套数据路径**：

| 路径类型 | 路径 |
|---------|------|
| **新路径** | `/root/.openclaw/workspace-coord/team-tasks/` |
| **旧路径** | `/home/ubuntu/clawd/data/team-tasks/` |

**症状**：每天 3-4 次虚假驳回（任务被错误判定为"未完成"或"幽灵完成"）。

---

## 🔍 根因分析

### 2.1 路径变量定义（task_manager.py）

```python
# 第 86-88 行
TEAM_TASKS_DIR_DEFAULT = "/root/.openclaw/workspace-coord/team-tasks"  # 新路径
LEGACY_TASKS_DIR       = "/home/ubuntu/clawd/data/team-tasks"        # 旧路径
TASKS_DIR              = os.environ.get("TEAM_TASKS_DIR", TEAM_TASKS_DIR_DEFAULT)
```

### 2.2 task_file() 的三路查询逻辑

`task_file()` 函数按以下优先级查找项目文件：

```
1. 新布局:  /workspace-coord/team-tasks/projects/{project}/tasks.json
2. 旧平铺:  /workspace-coord/team-tasks/{project}.json
3. 旧路径:  /home/ubuntu/clawd/data/team-tasks/{project}.json  ← 只读查找
4. 默认:    /workspace-coord/team-tasks/{project}.json  (不存在则返回)
```

**写操作**（save_project）：只写新路径或当前任务文件路径，**不写旧路径**。

### 2.3 两套路径的调用点汇总

#### 新路径（正确）
| 文件 | 行为 |
|------|------|
| `task_manager.py:task_file()` | **读**：优先查新路径 |
| `task_manager.py:save_project()` | **写**：写新路径或当前任务路径 |
| `task_manager.py:cmd_list()` | **读**：扫描 `TASKS_DIR` + `TASKS_DIR/projects/` |
| `task_manager.py:cmd_phase1/phase2` | **读写**：创建/更新任务 |
| `cmd_update/claim/ready/status` 等 | **读**：通过 `load_project()` → `task_file()` |

#### 旧路径（残留，只读）
| 文件 | 行为 | 风险等级 |
|------|------|----------|
| `workspace-coord/scripts/fill-heartbeat-template-v3.sh:9` | **读**：`TASKS_DIR="/home/ubuntu/clawd/data/team-tasks"` | 🔴 高 |
| `workspace-coord/scripts/get-agent-tasks.sh:12` | **读**：`${TEAM_TASKS_DIR:-/home/ubuntu/clawd/data/team-tasks}` | 🔴 高 |
| `workspace-coord/scripts/project-board.py:12` | **读**：`DATA_DIR = Path("/home/ubuntu/clawd/data/team-tasks")` | 🔴 高 |
| `vibex/scripts/dedup/dedup.py:278` | **读**：仅引用旧路径字符串（注释/备查） | 🟡 中 |

### 2.4 Phantom Completion 机制

幽灵完成的**两条路径**：

**路径 A（虚假驳回）**：
1. Agent 用 task_manager.py 读写任务 → 文件在 `/workspace-coord/team-tasks/{project}.json`
2. 心跳脚本 `fill-heartbeat-template-v3.sh` 扫描 `/home/ubuntu/clawd/data/team-tasks/`
3. 旧路径里**没有**该任务（或状态更旧）→ 判定为"待处理"

**路径 B（虚假完成）**：
1. 旧路径有已完成的任务（历史遗留）
2. 新路径里该任务状态为 pending/in-progress
3. Agent 认为任务未完成，但心跳看到的是旧路径的 done 状态

**频率估算**：心跳每 10 分钟执行一次，每次扫描所有 .json 文件，多个项目可能恰好落在不一致的边界上，导致每天 3-4 次虚假驳回。

---

## 📊 现状数据

```
/workspace-coord/team-tasks/       → 活跃项目主路径（当前正在使用）
  ├── vibex-taskmanager-fix.json   → 当前的待分析项目
  ├── vibex-*.json                → 历史 + 活跃项目（平铺布局）
  ├── projects/                   → 新布局（部分项目）
  │   ├── vibex-auth-state-sync/
  │   ├── vibex-new-process-impl-20260318/
  │   └── ...
  └── completed/                  → 已归档

/home/ubuntu/clawd/data/team-tasks/ → 旧路径（只读，残留）
  ├── fix-epic1-topic-tracking.json
  ├── vibex-epic1-toolchain-20260324.json
  ├── vibex-epic2-frontend-20260324.json
  └── vibex-epic3-architecture-20260324.json
```

**结论**：旧路径有 4 个残留项目（Epic1-3 + fix）；新路径有所有活跃项目。

---

## ✅ 统一方案

### 3.1 方案选择：统一到新路径

**决策**：所有脚本统一使用 `/root/.openclaw/workspace-coord/team-tasks/` 作为唯一数据源。

**理由**：
- 新路径是当前活跃项目所在位置
- task_manager.py 已内置新路径支持
- 旧路径无活跃写入，迁移成本低
- 不影响生产环境

### 3.2 需要修改的文件

| 优先级 | 文件 | 修改内容 |
|--------|------|----------|
| P0 | `workspace-coord/scripts/fill-heartbeat-template-v3.sh` | `TASKS_DIR` 改为 `/root/.openclaw/workspace-coord/team-tasks` |
| P0 | `workspace-coord/scripts/get-agent-tasks.sh` | `TEAM_TASKS_DIR` 默认值改为 `/root/.openclaw/workspace-coord/team-tasks` |
| P0 | `workspace-coord/scripts/project-board.py` | `DATA_DIR` 改为 `/root/.openclaw/workspace-coord/team-tasks` |
| P1 | `vibex/scripts/task_manager.py` | `LEGACY_TASKS_DIR` 保留但标记废弃（向后兼容） |
| P2 | `vibex/scripts/dedup/dedup.py:278` | 移除旧路径字符串引用 |

### 3.3 数据迁移计划

**无需数据迁移**。原因：
- 旧路径 4 个残留项目（Epic1-3 + fix）均为已完成或已废弃状态
- 活跃项目全部在新路径
- 修改脚本后，旧路径自动降级为"无数据"，不影响功能

**可选清理**（P2）：
```bash
# 确认旧路径内容后再清理
ls -la /home/ubuntu/clawd/data/team-tasks/
# 迁移完成确认后删除旧路径（可选）
# sudo rm -rf /home/ubuntu/clawd/data/team-tasks/
```

---

## 🎯 验收标准

| ID | 标准 | 验证方法 |
|----|------|----------|
| V1 | `fill-heartbeat-template-v3.sh` 不再引用旧路径 | `grep -c "clawd/data" fill-heartbeat-template-v3.sh` → 0 |
| V2 | `get-agent-tasks.sh` 不再引用旧路径 | `grep -c "clawd/data" get-agent-tasks.sh` → 0 |
| V3 | `project-board.py` 不再引用旧路径 | `grep -c "clawd/data" project-board.py` → 0 |
| V4 | 心跳脚本扫描结果与 `task_manager.py list` 一致 | diff 对比两个来源的项目列表 |
| V5 | 连续 24h 无 phantom completion | 心跳报告无"虚假驳回"条目 |
| V6 | 旧路径文件保持不变（无写入） | `inotifywait` 或定期校验 mtime |

---

## ⚠️ 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 旧路径有未同步的活跃任务 | 低 | 高 | 确认旧路径仅 4 个残留项目，全为历史项目 |
| 迁移后部分脚本路径硬编码 | 中 | 中 | 修改后用 V1-V4 验证 |
| cron 调度脚本未更新 | 低 | 中 | 检查所有 cron 配置引用 |

---

## 📋 实施计划

| 步骤 | 操作 | 负责 |
|------|------|------|
| 1 | 修改 `fill-heartbeat-template-v3.sh` 路径变量 | analyst → dev |
| 2 | 修改 `get-agent-tasks.sh` 路径变量 | analyst → dev |
| 3 | 修改 `project-board.py` DATA_DIR | analyst → dev |
| 4 | 运行 V1-V4 验收测试 | tester |
| 5 | 观察 24h 心跳报告，确认无 phantom completion | coord |
| 6 | 可选：清理旧路径残留文件 | coord |
