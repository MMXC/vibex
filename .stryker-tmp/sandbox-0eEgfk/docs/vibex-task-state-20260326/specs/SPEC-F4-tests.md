# Spec F4: 测试套件规格

## 测试文件结构

```
skills/team-tasks/scripts/
├── test_concurrent.py    # 并发写入测试
├── test_atomic.py        # 原子写入 + 异常注入测试
├── test_compatibility.py # 旧文件兼容性测试
└── test_cli.py           # CLI 集成测试
```

---

## F4.1 test_concurrent.py — 并发写入测试

### 测试用例

#### TC-01: 多进程并发写入 revision 递增

```python
def test_concurrent_update_revision_sequential():
    """
    场景: 4 个进程并发更新同一任务的 status
    预期: revision 精确递增 4 次，无丢失
    """
    # Setup
    project = "test-concurrent"
    stage = "analyze-requirements"
    init_data = {
        "project": project,
        "goal": "test",
        "status": "active",
        "revision": 0,
        "stages": {stage: {"status": "pending", "agent": ""}}
    }
    save_project_raw(project, init_data)

    # 并发执行
    with concurrent.futures.ProcessPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(run_update, project, stage, f"done-{i}")
            for i in range(4)
        ]
        results = [f.result() for f in futures]

    # 验证
    data, rev = load_project_with_rev(project)
    expect(rev) == 5  # 0 → 1 → 2 → 3 → 4 → 5（1次初始化 + 4次更新）
    statuses = [r["stages"][stage]["status"] for r in results]
    expect(len(set(statuses))) == 4  # 4 个不同值都写入了
```

#### TC-02: 并发 claim 互斥

```python
def test_concurrent_claim_mutual_exclusion():
    """
    场景: 10 个 Agent 并发 claim 同一 pending stage
    预期: 只有 1 个成功，其余收到冲突错误
    """
    results = parallel_claim("test-proj", "analyze-requirements", agents=10)
    successes = [r for r in results if r.returncode == 0]
    conflicts = [r for r in results if r.returncode == 2]
    expect(len(successes)) == 1
    expect(len(conflicts)) == 9
```

---

## F4.2 test_atomic.py — 原子写入 + 异常注入

### 测试用例

#### TC-03: 写入异常不损坏原文件

```python
def test_atomic_write_no_corruption_on_error():
    """
    场景: atomic_write_json 执行中 os.kill
    预期: 原文件保持上次成功写入的状态
    """
    path = tempfile.mktemp(suffix=".json")
    good_data = {"status": "done", "value": 42}
    bad_data = {"status": "in-progress", "value": 99}

    # 写入好数据
    atomic_write_json(path, good_data)

    # 模拟写入中途失败（mock atomic_write_json 内部 raise）
    try:
        with mock.patch("os.rename", side_effect=OSError("mock kill")):
            atomic_write_json.__wrapped__(path, bad_data)  # 绕过异常处理测试
    except OSError:
        pass

    with open(path) as f:
        final = json.load(f)
    expect(final["value"]) == 42  # 好数据保留
```

#### TC-04: temp 文件清理

```python
def test_atomic_write_cleanup_on_error():
    """
    场景: temp 文件创建成功但写入失败
    预期: 无残留 temp 文件
    """
    # 列出所有 .json 的 temp 文件（带前缀 mkstemp 返回的名称）
    # 执行 atomic_write 失败场景
    # expect(残留文件数) == 0
```

---

## F4.3 test_compatibility.py — 旧文件兼容性

### 测试用例

#### TC-05: 无 revision 字段文件迁移

```python
def test_migration_from_no_revision():
    """
    场景: 读取和写入无 revision 字段的旧 JSON
    预期: 读取正常（revision=0），写入后 revision=1，后续正常递增
    """
    old_data = {
        "project": "legacy-proj",
        "goal": "old task",
        "status": "active",
        "stages": {"a": {"status": "pending"}}
        # 无 revision 字段
    }
    save_project_raw("legacy-proj", old_data)

    # 读取
    data, rev = load_project_with_rev("legacy-proj")
    expect(rev) == 0
    expect(data["goal"]) == "old task"

    # 写入
    data["goal"] = "updated task"
    save_project_with_lock("legacy-proj", data)

    # 验证
    final_data, final_rev = load_project_with_rev("legacy-proj")
    expect(final_rev) == 1
    expect(final_data["goal"]) == "updated task"
```

#### TC-06: 旧格式 stage 结构兼容

```python
def test_old_stage_structure():
    """
    场景: 旧 JSON 的 stage 缺少 agent/startedAt 等字段
    预期: 读取和更新不报错，缺失字段初始化
    """
    old_data = {
        "project": "old-format",
        "revision": 3,
        "stages": {
            "analyze": {"status": "done"}  # 只有 status
        }
    }
    save_project_raw("old-format", old_data)

    data, rev = load_project_with_rev("old-format")
    expect(data["stages"]["analyze"].get("agent")) == ""  # 默认空字符串
    expect(data["stages"]["analyze"].get("startedAt")) is None
```

---

## F4.4 test_cli.py — CLI 集成测试

### 测试用例

#### TC-07: update 命令端到端

```python
def test_cli_update_command():
    setup_test_project("cli-test")
    result = subprocess.run([
        "python3", TASK_STATE_CLI,
        "update", "cli-test", "analyze-requirements", "in-progress",
        "--agent", "pm"
    ], capture_output=True, text=True)
    expect(result.returncode) == 0
    data, rev = load_project_with_rev("cli-test")
    expect(data["stages"]["analyze-requirements"]["status"]) == "in-progress"
    expect(data["stages"]["analyze-requirements"]["agent"]) == "pm"
```

#### TC-08: status 命令格式化输出

```python
def test_cli_status_output_format():
    setup_test_project("cli-test")
    result = subprocess.run([
        "python3", TASK_STATE_CLI, "status", "cli-test"
    ], capture_output=True, text=True)
    expect("revision=" in result.stdout) == True
    expect("analyze-requirements" in result.stdout) == True
    expect("✅" in result.stdout or "done" in result.stdout.lower()) == True
```

#### TC-09: claim 命令互斥

```python
def test_cli_claim_exclusive():
    setup_test_project("cli-test")
    results = parallel_run([
        ["python3", TASK_STATE_CLI, "claim", "cli-test", "--agent", f"agent-{i}"]
        for i in range(5)
    ])
    successes = [r for r in results if r.returncode == 0]
    expect(len(successes)) == 1
```

#### TC-10: lock 命令 TTL 过期

```python
def test_cli_lock_ttl_expires():
    result1 = subprocess.run([
        "python3", TASK_STATE_CLI, "lock", "cli-test",
        "analyze-requirements", "--ttl", "1", "--agent", "dev"
    ], capture_output=True)
    expect(result1.returncode) == 0

    time.sleep(1.5)  # TTL 过期

    result2 = subprocess.run([
        "python3", TASK_STATE_CLI, "lock", "cli-test",
        "analyze-requirements", "--agent", "dev2"
    ], capture_output=True)
    expect(result2.returncode) == 0  # 可以重新获取
```

---

## 测试覆盖率要求

| 模块 | 覆盖率目标 |
|------|-----------|
| atomic_write_json | ≥ 90% |
| save_project_with_lock | ≥ 85% |
| load_project_with_rev | ≥ 90% |
| task_state CLI (all commands) | ≥ 80% |

---

## 测试运行方式

```bash
cd /root/.openclaw/skills/team-tasks/scripts
python3 -m pytest test_concurrent.py test_atomic.py test_compatibility.py test_cli.py -v --tb=short
```
