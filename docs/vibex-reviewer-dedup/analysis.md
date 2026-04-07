# 分析报告：coord-completed/coord-summary 虚假 READY 触发问题

**项目**: vibex-reviewer-dedup  
**阶段**: analyze-requirements  
**日期**: 2026-04-05  
**分析人**: analyst  

---

## 1. 当前任务状态机行为

### 1.1 状态定义

| 状态 | 含义 |
|------|------|
| `pending` | 等待上游完成 |
| `ready` | 依赖已满足，可以领取 |
| `in-progress` | 执行中 |
| `done` | 已完成 |
| `rejected` | 失败/驳回 |
| `blocked` | 被阻塞 |
| `skipped` | 已跳过 |

### 1.2 READY 触发路径

READY 触发有两处代码路径：

**路径A — wake_downstream()（task_manager.py）**

当任意任务被标记为 done 时，调用 `wake_downstream(project, done_stage_id)`：

```python
def wake_downstream(data: dict, done_stage_id: str) -> list:
    for task_id, task in data["stages"].items():
        if task["status"] in ("done", "skipped"):
            continue          # ① 终态任务不处理
        deps = task.get("dependsOn", [])
        if done_stage_id not in deps:
            continue          # ② 不依赖此上游，跳过
        all_deps_done = all(
            data["stages"].get(d, {}).get("status") in ("done", "skipped")  # ③
            for d in deps
        )
        if not all_deps_done:
            continue          # ④ 还有其他依赖未完成，跳过
        task["status"] = "ready"  # ⑤ 标记 READY
```

**路径B — get_ready_tasks()（_ready_decision.py）**

心跳扫描时调用此函数扫描所有项目中所有 pending/ready 任务：

```python
def get_ready_tasks(tasks_dir) -> dict:
    for task_id, task_info in stages.items():
        status = task_info.get("status", "pending")
        if status not in ("pending", "ready"):
            continue          # ① 仅处理 pending/ready
        depends_on = task_info.get("dependsOn", [])
        all_done = True
        for dep_name in depends_on:
            dep_info = stages.get(dep_name, {})  # ② 仅查本项目 stages
            if dep_info.get("status") != "done":
                all_done = False
                break
        if all_done:
            ready_tasks.append(task_id)  # ③ 纳入 READY 列表
```

### 1.3 coord-completed 典型依赖结构

```python
reviewer_push_deps = [f"reviewer-push-{epic.lower().replace(' ', '-').replace('_', '-')}" for epic in epics]
# → ["reviewer-push-epic1", "reviewer-push-epic2", ...]
# coord-completed: depends_on = reviewer_push_deps
```

---

## 2. 根因分析：虚假触发的两个机制

### 根因 1：跨项目依赖查找范围不足（严重性：高）

**位置**: `_ready_decision.py` 第 91-99 行

**问题**: `get_ready_tasks()` 在计算 READY 时，只在**本项目**的 `stages` 字典中查找依赖。

```python
# _ready_decision.py - get_ready_tasks()
for dep_name in depends_on:
    dep_info = stages.get(dep_name, {})   # ← 只查本项目 stages！
    if dep_info.get("status") != "done":
        all_done = False
```

对比 `_blocked_analysis.py` 第 98-104 行，正确实现了跨项目解析：

```python
# _blocked_analysis.py - get_blocked_tasks()
for dep in depends_on:
    if "/" in dep:
        dep_key = dep                  # "projectX/reviewer-push-epic1"
    else:
        dep_key = f"{project_name}/{dep}"  # 本项目 → 自动补全
    dep_info = task_status.get(dep_key, {"status": "pending"})  # 查全局
```

**后果**：

| 场景 | dep_name 格式 | stages 查询结果 | all_done | 后果 |
|------|--------------|----------------|----------|------|
| 同项目依赖存在 | `reviewer-push-epic1` | ✅ 找到，status=done | True | 正常 |
| 同项目依赖 pending | `reviewer-push-epic1` | ✅ 找到，status=pending | False | 正常 |
| 跨项目依赖存在 | `projectB/reviewer-push-epic1` | ❌ 未找到，返回 `{}` | True (bug!) | **虚假 READY** |
| 依赖已删除/改名 | `reviewer-push-epic1` | ❌ 未找到，返回 `{}` | True (bug!) | **虚假 READY** |

关键：`{}.get("status")` 返回 `None`，`None not in ("done", "skipped")` → `all_done = True`！

### 根因 2：blocked 逻辑与 ready 逻辑行为不对称（中等）

**位置**: `_blocked_analysis.py` 第 104 行

```python
dep_info = task_status.get(dep_key, {"status": "pending"})  # 默认 pending
```

当跨项目依赖或改名依赖不存在时：
- **ready 逻辑**: 查不到 → `{}` → status=None → `None != "done"` → `all_done=True` → **虚假 READY**
- **blocked 逻辑**: 查不到 → 默认 `pending` → 任务被标记 blocked

两者行为不一致，且 `blocked` 的"默认 pending"也是一种误判（依赖不存在 ≠ 依赖 pending）。

### 根因 3：READY 状态可被重复触发（低，但加剧混乱）

当 `coord-summary` 已经是 `ready` 状态时，wake_downstream 仍会处理它（因为 `"ready" not in ("done", "skipped")`）。如果其依赖又完成了一次（重复标记 done），wake_downstream 会再次触发。但实际影响有限，因为 done 任务通常不会被重复标记。

---

## 3. 解决方案

### 方案 A：修复跨项目依赖解析（推荐）

**工作估计**: 2-3 小时

**改动点**:

1. **修改 `get_ready_tasks()`（`_ready_decision.py`）**：
   - 改为查全局 `task_status`（与 blocked_analysis 一致）
   - 跨项目依赖用 `dep_key = dep`（含 `/`），同项目用 `f"{project_name}/{dep}"`
   - 依赖不存在时，发出警告并**跳过**（不默认认为 done）

```python
# 改动示意
def get_ready_tasks(tasks_dir) -> dict:
    # 1. 构建全局 task_status（与 _blocked_analysis.py 相同）
    task_status = {}
    for project_name, project_data in result["projects"].items():
        for stage_name in project_data.get("stages", {}):
            key = f"{project_name}/{stage_name}"
            task_status[key] = project_data["stages"][stage_name]
            task_status[stage_name] = project_data["stages"][stage_name]  # 同项目别名

    for task_id, task_info in stages.items():
        status = task_info.get("status", "pending")
        if status not in ("pending", "ready"):
            continue
        depends_on = task_info.get("dependsOn", [])
        all_done = True
        missing_deps = []
        for dep_name in depends_on:
            # 跨项目解析
            dep_key = dep_name if "/" in dep_name else f"{project_name}/{dep_name}"
            dep_info = task_status.get(dep_key, {})
            if not dep_info:
                missing_deps.append(dep_key)
                all_done = False
            elif dep_info.get("status") not in ("done", "skipped"):
                all_done = False
        if all_done:
            ready_tasks.append({...})
        elif missing_deps:
            # 记录警告：依赖不存在
            print(f"⚠️  {project_name}/{task_id} 依赖不存在: {missing_deps}")
```

2. **修改 `wake_downstream()`（`task_manager.py`）**：
   - 同理使用全局 stages 查找
   - 依赖不存在时报错而非默认通过

**优点**: 根本性修复，与 blocked_analysis 行为一致  
**缺点**: 需要重新架构 `get_ready_tasks()` 使用全局视图

---

### 方案 B：引入显式"依赖不存在"警告层（保守修复）

**工作估计**: 1-2 小时

**核心思路**: 不改核心逻辑，改为在检测到依赖不存在时，输出警告并打上特殊标记。

```python
def get_ready_tasks(tasks_dir) -> dict:
    # ...现有逻辑...
    for dep_name in depends_on:
        dep_info = stages.get(dep_name, {})
        if not dep_info:  # 依赖不存在
            warnings.append(f"依赖 '{dep_name}' 不存在于项目 {project_name}")
            all_done = False  # 安全默认值：不标记 READY
        elif dep_info.get("status") not in ("done", "skipped"):
            all_done = False

    if all_done:
        ready_tasks.append(...)
    elif warnings:
        # 记录警告任务，但不纳入 READY
        warnings_tasks.append({"task_id": task_id, "warnings": warnings})
```

同时在心跳报告中增加 "依赖警告" 区块：

```
⚠️ 依赖缺失（n 项，不触发 READY）:
   - project/task: 依赖 "reviewer-push-epic1" 不存在
```

**优点**: 改动小，不影响现有逻辑  
**缺点**: 治标不治本，虚假 READY 仍可能通过其他路径触发

---

### 方案对比

| 维度 | 方案 A（推荐） | 方案 B（保守） |
|------|--------------|--------------|
| 修复彻底性 | ✅ 根本性修复 | ⚠️ 缓解，不根治 |
| 工作量 | 2-3h | 1-2h |
| 风险 | 低（与 blocked_analysis 一致） | 极低 |
| 长期价值 | ✅ 高 | ⚠️ 低，仍需后续重构 |
| 对 coord-summary 的效果 | ✅ 完全修复 | ⚠️ 仅警告 |
| 副作用 | 无明显副作用 | 无 |

---

## 4. 推荐方案

**推荐方案 A：修复跨项目依赖解析**

理由：
1. `_blocked_analysis.py` 已经证明了正确的跨项目解析方案，可以直接复用
2. 虚假 READY 问题只有方案 A 能根本解决
3. 改动范围可控（2 个文件，2-3 处函数）
4. 同步修复 `wake_downstream` 与 `get_ready_tasks` 的不一致性

---

## 5. 验收标准

### 5.1 功能验收

- [ ] `get_ready_tasks()` 对跨项目依赖（格式 `project/stage`）正确解析，不产生虚假 READY
- [ ] `get_ready_tasks()` 对不存在/已删除的依赖，跳过而非默认通过
- [ ] `wake_downstream()` 对跨项目依赖行为与 `get_ready_tasks()` 一致
- [ ] blocked 逻辑与 ready 逻辑对依赖不存在的处理行为对称（两者都标记警告/错误）
- [ ] 虚假完成（done 但 output 不存在）的检测逻辑保持不变

### 5.2 测试用例覆盖

| 用例 | 预期行为 |
|------|---------|
| 同项目依赖全部 done | 标记 READY ✅ |
| 同项目依赖部分 pending | 不标记 READY ✅ |
| 跨项目依赖存在且 done | 标记 READY ✅ |
| 跨项目依赖不存在 | 跳过（警告）✅ |
| 依赖指向已删除的 stage | 跳过（警告）✅ |
| 无依赖任务（dependsOn=[]） | 依赖已满足，标记 READY ✅ |

### 5.3 非功能验收

- [ ] 修改后心跳扫描延迟 < 5 秒（全局视图需优化查询）
- [ ] 改动不影响 `task_manager.py` 的 claim/update 核心逻辑
- [ ] 所有现有测试通过

---

## 附录：关键代码位置

| 文件 | 函数 | 问题 |
|------|------|------|
| `current_report/_ready_decision.py` | `get_ready_tasks()` | ❌ 只查本项目 stages，无跨项目解析 |
| `current_report/_blocked_analysis.py` | `get_blocked_tasks()` | ✅ 正确实现跨项目解析 |
| `task_manager.py` | `wake_downstream()` | ⚠️ 只查本项目 stages |
| `task_manager.py` | `compute_ready_tasks()` | 同 wake_downstream 问题 |
