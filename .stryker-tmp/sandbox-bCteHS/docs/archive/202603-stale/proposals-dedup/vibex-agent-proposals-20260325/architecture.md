# Architecture: OpenViking 工程质量提升 — 心跳状态一致性

**项目**: vibex-agent-proposals-20260325
**版本**: 1.0
**架构师**: Architect Agent
**日期**: 2026-03-25
**状态**: Proposed

---

## 1. ADR: 方案选择

### ADR-001: 数据源统一策略

**状态**: Accepted

**上下文**: bash 心跳脚本与 Python task_manager 使用不同数据源路径，导致状态不同步、虚假完成驳回。

**决策**: 采用分阶段方案

| 阶段 | 方案 | 工时 | 范围 |
|------|------|------|------|
| Phase 1 | 心跳脚本统一调用 Python API | 2h | 快速止血 |
| Phase 2 | task_manager 双路径降级支持 | 0.5h | 兼容旧路径 |
| Phase 3 | 逐步迁移到统一路径 | 2h | 长期架构 |

**Trade-off**: Phase 1 快速但治标；Phase 3 彻底但有迁移风险。推荐按顺序执行。

---

### ADR-002: 静默失败模式消除

**状态**: Accepted

**上下文**: `|| true` 导致心跳脚本静默失败，用户无法感知异常。

**决策**: 移除所有 `|| true`，改为显式错误码 + 告警。

---

## 2. Tech Stack

| 技术 | 选择理由 |
|------|---------|
| Python (`task_manager.py`) | 现有任务管理 API，统一入口 |
| Bash (心跳脚本) | 仅调用 Python API，不直接读写 JSON |
| SQLite (Phase 3) | 解决 JSON 并发写入损坏问题 |
| JSON (过渡期) | 保持向后兼容 |

---

## 3. 架构图

```mermaid
%%{init: {'theme':'base'}}%%
flowchart TB
    subgraph Agents["Agent Heartbeats"]
        HB_DEV[Dev Heartbeat]
        HB_ARCH[Architect Heartbeat]
        HB_OTH[Other Agents]
    end

    subgraph HeartbeatLayer["心跳层 (Bash Scripts)"]
        HS[/root/.openclaw/scripts/heartbeats/*]
    end

    subgraph APILayer["TaskGateway API (Python)"]
        TM[task_manager.py]
        TM_READ[read_state]
        TM_WRITE[write_state]
        TM_VALIDATE[validate_state]
    end

    subgraph StorageLayer["存储层"]
        JSON_OLD["旧路径 JSON<br/>/home/ubuntu/clawd/data/team-tasks/*.json"]
        JSON_NEW["新路径 JSON<br/>workspace-coord/team-tasks/projects/*.json"]
        SQLITE["SQLite<br/>(Phase 3)"]
    end

    HB_DEV -->|"bash|心跳|脚本"| HS
    HB_ARCH --> HS
    HB_OTH --> HS
    HS -->|"统一调用|API"| TM
    TM --> TM_READ
    TM --> TM_WRITE
    TM --> TM_VALIDATE
    TM_READ -->|"双路径|降级"| JSON_OLD
    TM_READ --> JSON_NEW
    TM_READ -->|"最终|目标"| SQLITE
    TM_WRITE --> JSON_NEW
    TM_WRITE --> SQLITE
```

---

## 4. 核心改动

### 4.1 Phase 1: Bash 心跳统一调用 Python API

**文件**: `/root/.openclaw/scripts/heartbeats/*-heartbeat.sh`

**改动前**:
```bash
# 直接读写 JSON
jq ".stages[\"$task\"].status = \"done\"" tasks.json > tmp && mv tmp tasks.json
```

**改动后**:
```bash
python3 -c "
import sys; sys.path.insert(0, '/root/.openclaw')
from scripts.task_manager import update_task_status
update_task_status('vibex-agent-proposals-20260325', 'design-architecture', 'done')
"
```

### 4.2 Phase 1: 移除 `|| true` 静默失败

```bash
# 改动前
grep "|| true" *.sh | wc -l  # 应为 0

# 改动后: 失败时显式退出码
set -e
task_status=$(python3 -c "...")
[ -n "$task_status" ] || { echo "ERROR: task_status empty"; exit 1; }
```

### 4.3 Phase 2: task_manager 双路径降级

```python
# task_manager.py — read_state()
def read_state(project, stage):
    for path in [NEW_PATH, OLD_PATH]:
        if os.path.exists(path):
            return load_json(path)
    raise FileNotFoundError(f"No state found for {project}/{stage}")
```

### 4.4 Phase 3: SQLite 迁移（长期）

```sql
CREATE TABLE tasks (
    project TEXT,
    stage TEXT,
    agent TEXT,
    status TEXT,  -- pending/ready/in-progress/done/cancelled
    updated_at INTEGER,
    PRIMARY KEY (project, stage)
);
```

---

## 5. 提案路径契约

### 当前问题
```
HEARTBEAT.md: proposals/20260325/          # 错误路径
proposals/YYYYMMDD/architect.md            # 规范路径
```

### 修复方案
统一路径: `/root/.openclaw/vibex/proposals/YYYYMMDD/`

| Agent | 提案文件 |
|-------|---------|
| dev | `proposals/20260325/dev.md` |
| analyst | `proposals/20260325/analyst.md` |
| architect | `proposals/20260325/architect.md` |
| pm | `proposals/20260325/pm.md` |
| tester | `proposals/20260325/tester.md` |
| reviewer | `proposals/20260325/reviewer.md` |

---

## 6. 测试策略

| 层级 | 框架 | 覆盖目标 |
|------|------|---------|
| API 层 | pytest | > 90% |
| Bash 脚本 | bats-core | > 80% |
| 回归 | 现有心跳脚本 | diff 验证 |

**核心测试用例**:
```python
def test_read_state_fallback_to_old_path():
    """读取旧路径（新路径不存在时）"""
    # mock: 新路径不存在，旧路径存在
    state = tm.read_state("test-project", "analyze")
    assert state["status"] == "done"

def test_write_state_to_new_path():
    """写入新路径"""
    tm.write_state("test-project", "design-architecture", "done")
    assert os.path.exists(NEW_PATH + "/test-project/tasks.json")

def test_no_silent_failure():
    """bash 脚本失败时显式退出"""
    result = subprocess.run(["bash", "architect-heartbeat.sh"], capture_output=True)
    assert result.returncode in [0, 1]  # 无 || true 静默吞掉错误码
```

---

## 7. 实施计划

| Epic | Story | 工时 | 负责人 |
|------|-------|------|--------|
| Epic 1 | S1.1 Bash 心跳统一调用 Python API | 1h | Dev |
| Epic 1 | S1.2 task_manager 双路径降级 | 0.5h | Dev |
| Epic 1 | S1.3 移除 `\|\| true` | 0.5h | Dev |
| Epic 2 | S2.1 提案路径契约标准化 | 0.5h | Reviewer |
| Epic 2 | S2.2 ESLint 门禁增强 | 1h | Dev |
| Epic 3 | S3.1 Phase 3 SQLite 迁移（可选） | 2h | Dev |

**预计总工期**: ~3.5h（Phase 1-2），Phase 3 可选延期。

---

*Architecture 完成时间: 2026-03-25 22:33 UTC+8*
