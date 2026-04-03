# Epic1: 工具链修复 — AI Agent 执行规范

**项目**: vibex-epic1-toolchain-20260324
**创建时间**: 2026-03-25
**负责人**: Dev

---

## 任务: P1-2 Heartbeat 幽灵任务误报修复

**问题**: 心跳脚本扫描 team-tasks JSON 时，会报告项目目录不存在的任务（幽灵任务），导致 agent 收到无法执行的虚假任务通知。

**根因**: `get_agent_tasks()` 和 `get_active_projects_json()` 未验证项目目录存在性。

**修复方案**:

### 1. common.sh — get_agent_tasks() 幽灵任务过滤

在读取任务之前，检查项目目录是否存在于以下路径之一：
- `/root/.openclaw/vibex/<project>/`
- `/root/.openclaw/workspace-coord/<project>/`
- `/root/.openclaw/workspace-dev/<project>/`

如果项目目录不存在，跳过该 JSON 文件中的所有任务。

```bash
# Phantom task guard: 跳过项目目录不存在的任务
if [ ! -d "/root/.openclaw/vibex/$project" ] && \
   [ ! -d "/root/.openclaw/workspace-coord/$project" ] && \
   [ ! -d "/root/.openclaw/workspace-dev/$project" ]; then
    continue
fi
```

### 2. coord-heartbeat.sh — get_active_projects_json() Python 幽灵项目过滤

在 Python 扫描逻辑中，同步添加相同的目录存在性检查：

```python
# Phantom task guard: skip if project directory doesn't exist
if not (os.path.isdir('/root/.openclaw/vibex/' + project_name) or
        os.path.isdir('/root/.openclaw/workspace-coord/' + project_name) or
        os.path.isdir('/root/.openclaw/workspace-dev/' + project_name)):
    continue
```

### 3. 其他潜在扫描点

检查以下脚本是否也需要类似修复：
- `task_manager.py` — `list` 和 `scan` 命令（如果涉及项目目录验证）

**影响范围**:
- `/root/.openclaw/scripts/heartbeats/common.sh`
- `/root/.openclaw/scripts/coord-heartbeat.sh`

**验收标准**:
- [ ] `get_agent_tasks()` 不返回目录不存在的项目任务
- [ ] `get_active_projects_json()` 不包含目录不存在的项目
- [ ] 对 `vibex-epic1-toolchain-20260324`（目录不存在）的任务扫描返回空
- [ ] `git status --porcelain` 无未提交文件
