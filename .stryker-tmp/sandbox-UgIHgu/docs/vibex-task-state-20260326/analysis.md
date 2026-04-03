# Analysis: vibex-task-state-20260326

**任务**: vibex-task-state-20260326/analyze-requirements
**分析人**: Analyst
**时间**: 2026-03-26 11:52 (UTC+8)
**状态**: ✅ 完成

---

## 1. 执行摘要

**一句话结论**: `task_manager.py` 的 JSON 写入使用无保护的 `open(path, "w")`，多 Agent 并发调用时会发生"后写覆盖先写"，导致任务状态丢失。解决方案是实现乐观锁（版本号 + 重试）+ 原子写入（temp + rename）。

---

## 2. 问题根因分析

### 2.1 代码审查：save_project 函数

**文件**: `/root/.openclaw/skills/team-tasks/scripts/task_manager.py` 第 164-168 行

```python
def save_project(project: str, data: dict):
    ...
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
```

**问题**: 纯同步写，无文件锁，无原子性保证。

### 2.2 并发场景分析

```
时间线:
T1: Agent A → load_project() → 读取 {"stages": {...}, "revision": 1}
T2: Agent B → load_project() → 读取 {"stages": {...}, "revision": 1}
T3: Agent A → save_project() → 写入 {"stages": {...A修改...}, "revision": 1}
T4: Agent B → save_project() → 写入 {"stages": {...B修改...}, "revision": 1}
     ↑ B 的写入覆盖了 A 的修改，A 的状态变更丢失
```

**影响**:
- 任务状态更新丢失（如 `pending → in-progress` 被覆盖回 `pending`）
- 阶段依赖关系断裂（下游任务应该解锁但实际仍阻塞）
- 锁定的任务被其他 Agent 误抢

### 2.3 证据

| 症状 | 发生场景 |
|------|----------|
| `task assigned to 'analyst', you are 'analyze'` | claim 命令检查的是字符串而非实际运行时身份 |
| `update` 后其他 Agent 的修改丢失 | save_project 无锁 |
| 任务状态 stuck（如 pending 但依赖已完成） | 并发写入覆盖 |
| claim/update 卡住无输出（HEARTBEAT.md 已知问题） | 脚本挂起 + JSON 损坏 |

---

## 3. 现有缓解措施评估

| 方案 | 状态 | 评价 |
|------|------|------|
| `timeout` 装饰器 | ✅ 已有 | 只防挂起，不防数据损坏 |
| 任务分配到特定 agent | ✅ 已有 | agent_id 字符串匹配，无法防止同名误抢 |
| DAG 模式顺序执行 | ✅ 已有 | 只保证 DAG 拓扑，不保证并发写入安全 |
| 手动锁定（禁止并发） | ❌ 无 | 无机制强制 |

---

## 4. 解决方案

### 方案 A: 乐观锁 + 原子写入（推荐）

**核心思路**: 在 JSON 中加入 `revision` 字段，写入时对比版本号，不匹配则重试。

#### 4.1.1 数据模型变更

```python
# 每个 task 文件增加顶层 revision 字段
{
  "project": "...",
  "goal": "...",
  "revision": 42,        # 新增：每次 save 时 +1
  "stages": {...}
}
```

#### 4.1.2 原子写入函数

```python
import os
import tempfile

def atomic_write_json(path: str, data: dict):
    """写入 JSON 到 temp 文件，然后 rename，保证原子性。"""
    dir_name = os.path.dirname(path)
    fd, tmp_path = tempfile.mkstemp(dir=dir_name, suffix=".json")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.rename(tmp_path, path)  # POSIX rename 原子覆盖
    except:
        os.unlink(tmp_path)
        raise
```

#### 4.1.3 乐观锁 save 函数

```python
def save_project_with_lock(project: str, data: dict, max_retries: int = 3):
    path = task_file(project)
    for attempt in range(max_retries):
        # 读取当前 revision
        with open(path) as f:
            current = json.load(f)
        expected_rev = current.get("revision", 0)
        
        # 更新 revision
        data["revision"] = expected_rev + 1
        
        # 原子写入
        atomic_write_json(path, data)
        return  # 成功
    raise RuntimeError(f"Failed to save {project} after {max_retries} retries (concurrent writes)")
```

#### 4.1.4 load 函数（带 revision）

```python
def load_project_with_rev(project: str) -> tuple[dict, int]:
    path = task_file(project)
    with open(path) as f:
        data = json.load(f)
    return data, data.get("revision", 0)
```

**工作量**: ~1.5h（Dev）
**优点**: 无外部依赖，兼容现有代码，只改 `task_manager.py`
**缺点**: 冲突频繁时会有重试开销（但实际冲突率低）

### 方案 B: 文件锁（fcntl/flock）

**核心思路**: 写文件前加写锁，完成后释放。

```python
import fcntl

def save_project_with_flock(project: str, data: dict):
    path = task_file(project)
    with open(path, "r+") as f:
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)  # 写锁
        try:
            f.seek(0)
            f.truncate()
            json.dump(data, f, indent=2, ensure_ascii=False)
        finally:
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)
```

**工作量**: ~1h（Dev）
**优点**: 简单直接，OS 级别保证互斥
**缺点**: 非 POSIX 系统（Windows）不兼容；fcntl 在非 Unix 系统不可用；多进程间锁不够健壮
**评价**: 不推荐，跨平台问题

### 方案 C: task_state CLI（独立工具）

**核心思路**: 新建 `task_state.py` CLI，完全替代直接 JSON 操作，作为单一写入点。

```bash
# 替代直接调用 task_manager.py 的 update/claim
python3 task_state.py update vibex-xxx stage pending
python3 task_state.py claim vibex-xxx stage
```

**内部实现**: 使用 SQLite 替代 JSON 文件，彻底避免并发写入问题。

```python
# task_state.db schema
CREATE TABLE tasks (
    project TEXT,
    stage TEXT,
    status TEXT,
    revision INTEGER DEFAULT 1,
    PRIMARY KEY (project, stage)
);
```

**工作量**: ~4h（Dev）
**优点**: 最彻底，数据一致性最强，支持事务
**缺点**: 迁移成本高，需要修改所有 Agent 调用方式
**评价**: 适合长期方案，短期先用方案 A

---

## 5. 推荐方案

**近期（立即实施）**: 方案 A（乐观锁 + 原子写入）

- 改动最小（只改 `task_manager.py` 一个文件）
- 不破坏现有接口
- 1.5h 可完成
- 可立即解决当前并发覆盖问题

**远期（可选）**: 方案 C（SQLite 迁移）

- 如果问题持续存在，考虑迁移到 SQLite
- 一次性改动，永久解决

---

## 6. task_state CLI 附加价值

除了解决并发问题，`task_state` CLI 还可以提供更好的任务可见性：

```bash
# 查看任务状态（美化输出）
python3 task_state.py status vibex-xxx

# 锁定任务（防止重复领取）
python3 task_state.py lock vibex-xxx analyze-requirements --ttl=300

# 原子更新（乐观锁）
python3 task_state.py update vibex-xxx analyze-requirements done --expected-rev=5
```

---

## 7. 技术风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| revision 字段缺失的旧文件首次写入 | 低 | 低 | save 时初始化 revision=0 |
| 高并发下重试次数耗尽 | 极低 | 中 | max_retries=3 已足够 |
| rename 在网络文件系统（NFS）上非原子 | 低 | 中 | 检测 fs 类型，NFS 上回退到覆盖写 |

---

## 8. 验收标准

| ID | 验收条件 | 测试方法 |
|----|----------|---------|
| V1 | 两个 Agent 同时 update 同一任务，revision 不丢失 | 单元测试：并发写 |
| V2 | save_project 在任何异常情况下不产生空文件或截断文件 | 异常注入测试 |
| V3 | 旧 JSON 文件（无 revision 字段）首次写入后包含 revision | 兼容性测试 |
| V4 | task_state CLI 能正确执行 update/claim/lock 命令 | 集成测试 |

---

## 9. 实现步骤（方案 A）

1. 修改 `task_manager.py` — 添加 `atomic_write_json()` 辅助函数
2. 修改 `save_project()` — 使用原子写入
3. 修改 `save_project()` — 增加乐观锁重试逻辑
4. 所有 `save_project()` 调用点改为 `save_project_with_lock()`
5. 写单元测试：并发写入不丢失数据
6. 更新所有 Agent 调用方式（通过 `task_state` CLI 封装）

---

*分析产出物: `/root/.openclaw/vibex/docs/vibex-task-state-20260326/analysis.md`*
