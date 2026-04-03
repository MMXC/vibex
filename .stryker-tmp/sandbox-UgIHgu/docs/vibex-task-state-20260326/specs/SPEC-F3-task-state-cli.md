# Spec F3: task_state CLI 命令行接口

## 概览

`task_state.py` 是统一的 CLI，封装所有任务状态读写操作。所有 Agent 应通过此 CLI 而非直接操作 JSON 文件。

## 命令总览

```
task_state.py <command> [args]

Commands:
  update    更新任务状态
  claim     领取任务
  status    查看项目所有任务状态
  lock      锁定任务（防重复领取）
  help      显示帮助
```

---

## F3.1 update 命令

```bash
python3 task_state.py update <project> <stage> <status> [--expected-rev N]
```

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project | string | ✅ | 项目名 |
| stage | string | ✅ | 阶段名（如 analyze-requirements） |
| status | string | ✅ | 新状态（pending/ready/in-progress/done/blocked） |
| --expected-rev | int | ❌ | 乐观锁：期望的当前 revision，不匹配则重试 |

### 行为

1. 调用 `load_project_with_rev(project)` 读取当前数据和 revision
2. 更新 `stages[stage].status = status`
3. 若有 `--expected-rev`，验证当前 revision == 期望值
4. 调用 `save_project_with_lock(project, data)`
5. 输出成功信息

### 退出码

- 0: 成功
- 1: 项目或 stage 不存在
- 2: revision 不匹配（乐观锁冲突）

### 验收测试

```python
def test_update_increments_revision():
    result = subprocess.run([
        "python3", "task_state.py", "update",
        "test-proj", "analyze-requirements", "in-progress"
    ], capture_output=True)
    expect(result.returncode) == 0
    expect(b"revision" in result.stdout) == True
```

---

## F3.2 claim 命令

```bash
python3 task_state.py claim <project> [--stage <stage>] [--agent <agent>]
```

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project | string | ✅ | 项目名 |
| --stage | string | ❌ | 指定领取的 stage，不指定则领取第一个 pending |
| --agent | string | ❌ | Agent ID，默认从环境变量 AGENT 读取 |

### 行为

1. 查找目标 stage（pending 状态，agent 为空或与 --agent 不同）
2. 使用乐观锁更新 `status=in-progress`，`agent=<agent>`
3. 若乐观锁失败（revision 不匹配），重试（最多 3 次）
4. 输出结果

### 退出码

- 0: 成功领取
- 1: 项目不存在
- 2: 无可用 stage（已全被领取）
- 3: 重试耗尽（并发激烈）

### 验收测试

```python
def test_concurrent_claim_only_one_wins():
    def claim():
        return subprocess.run([
            "python3", "task_state.py", "claim", "test-proj", "--agent", "dev"
        ], capture_output=True)
    results = [claim() for _ in range(3)]
    successes = sum(1 for r in results if r.returncode == 0)
    expect(successes) == 1  # 只有 1 个成功
```

---

## F3.3 status 命令

```bash
python3 task_state.py status <project>
```

### 输出格式

```
Project: vibex-task-state-20260326 (revision=42)

Stage                   Status       Agent     Updated
----------------------  -----------  --------  ----------
analyze-requirements    ✅ done      analyst   2026-03-26 11:52
create-prd              🔄 in-prog   pm        2026-03-26 11:54
design-architecture     ⏳ pending   -         -
coord-decision          ⏳ pending   -         -
```

### 退出码

- 0: 成功
- 1: 项目不存在

---

## F3.4 lock 命令

```bash
python3 task_state.py lock <project> <stage> [--ttl N]
```

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project | string | ✅ | 项目名 |
| stage | string | ✅ | 阶段名 |
| --ttl | int | ❌ | 锁超时时间（秒），默认 300（5 分钟） |

### 行为

1. 检查 stage 是否已有有效锁（`locked_by` 字段 + `locked_at` + TTL）
2. 若有有效锁且 `locked_by != current_agent`，拒绝
3. 否则写入新锁（`locked_by=<agent>`, `locked_at=<timestamp>`）
4. TTL 过期后锁自动失效（`locked_at + ttl < now` 时视为无效）

### JSON 扩展字段

```json
{
  "stages": {
    "analyze-requirements": {
      "locked_by": "analyst",
      "locked_at": "2026-03-26T11:54:00+08:00",
      "locked_ttl": 300
    }
  }
}
```

### 退出码

- 0: 成功获取锁
- 1: 已被他人锁定
- 2: 锁已存在且属于自己（可重入，但刷新 TTL）

---

## F3.5 输出格式化规则

| 状态 | 颜色 | 图标 |
|------|------|------|
| pending | 灰色 | ⏳ |
| ready | 蓝色 | 🔔 |
| in-progress | 黄色 | 🔄 |
| done | 绿色 | ✅ |
| blocked | 红色 | 🚫 |
