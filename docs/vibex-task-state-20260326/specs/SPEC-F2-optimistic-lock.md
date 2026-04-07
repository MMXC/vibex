# Spec F2: save_project_with_lock — 乐观锁写入

## 函数签名

```python
def save_project_with_lock(project: str, data: dict, max_retries: int = 3) -> None:
    """
    以乐观锁方式写入项目 JSON 文件。

    流程：
    1. 读取当前文件的 revision
    2. data["revision"] = 当前 revision + 1
    3. 原子写入
    4. 若写入后读取发现 revision 不一致，说明有并发写入，重试

    Args:
        project: 项目名
        data: 要写入的数据（不含 revision，函数会自动注入）
        max_retries: 最大重试次数，默认 3

    Raises:
        RuntimeError: 重试次数耗尽（max_retries 次都不成功）
    """
```

## 实现逻辑

```python
def save_project_with_lock(project: str, data: dict, max_retries: int = 3):
    path = task_file(project)
    for attempt in range(max_retries):
        # 1. 读取当前 revision
        with open(path) as f:
            current = json.load(f)
        expected_rev = current.get("revision", 0)

        # 2. 注入新 revision
        data["revision"] = expected_rev + 1

        # 3. 原子写入
        atomic_write_json(path, data)

        # 4. 验证（可选但推荐）
        with open(path) as f:
            verify = json.load(f)
        if verify.get("revision") == expected_rev + 1:
            return  # 成功
        # else: 并发写入干扰，重试
    raise RuntimeError(f"Failed to save {project} after {max_retries} retries")
```

## 兼容性

- 若当前 JSON 无 `revision` 字段，`current.get("revision", 0)` 返回 0，初始化为 revision=1
- 保持 `data` 中其他字段不变（只注入 revision）

## 验收测试

```python
import multiprocessing, json

def test_concurrent_write_no_loss():
    path = tempfile.mktemp(suffix=".json")
    init_data = {"project": "test", "revision": 0, "stages": {"a": {"status": "pending"}}}
    with open(path, "w") as f:
        json.dump(init_data, f)

    def writer(i):
        data = json.loads(json.dumps(init_data))
        data["stages"]["a"]["status"] = f"done-{i}"
        save_project_with_lock.__wrapped__(data)  # 绕过 retry 逻辑直接测

    with multiprocessing.Pool(4) as pool:
        pool.map(writer, range(4))

    with open(path) as f:
        final = json.load(f)
    # revision 应为 5（0 + 4次写入 + 1次初始化 init = 实际 5 次 write）
    # 但 init 是手动写入，测试重点是 4 次并发都成功
    expect(final["revision"]) >= 4  # revision >= 并发数
    expect(any(final["stages"]["a"]["status"].startswith("done-"))) == True
```

## 约束

- `max_retries` 不应小于 3（正常场景几乎不会触发第 3 次重试）
- 不要在锁函数内部调用 `task_file()` 以外的路径查找（保持幂等）
