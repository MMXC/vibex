# Spec F1: atomic_write_json 辅助函数

## 函数签名

```python
def atomic_write_json(path: str, data: dict, indent: int = 2) -> None:
    """
    将 data 写入 path，使用 temp + rename 保证原子性。

    Args:
        path: 目标文件路径
        data: 要写入的字典（会被 json.dump）
        indent: JSON 缩进，默认 2

    Raises:
        OSError: temp 文件创建失败或写入失败（cleanup 后抛出）
    """
```

## 实现逻辑

1. 在 `path` 所在目录调用 `tempfile.mkstemp(suffix=".json")` 创建临时文件 fd
2. 用 `os.fdopen(fd, "w")` 写入 JSON（`ensure_ascii=False`）
3. `os.rename(tmp_path, path)` 原子替换（POSIX 保证原子性）
4. 任何异常发生时：`os.unlink(tmp_path)` 清理，然后重新抛出

## 验收测试

```python
import tempfile, os

def test_atomic_write_normal():
    path = tempfile.mktemp(suffix=".json")
    atomic_write_json(path, {"status": "done"})
    with open(path) as f:
        data = json.load(f)
    expect(data["status"]) == "done"

def test_atomic_write_preserves_on_error():
    path = tempfile.mktemp(suffix=".json")
    with open(path, "w") as f:
        json.dump({"original": True}, f)
    try:
        atomic_write_json(path, raise_exception())  # 模拟异常
    except:
        pass
    with open(path) as f:
        data = json.load(f)
    expect(data["original"]) == True  # 原文件未改变
```

## 约束

- 临时文件必须在同一文件系统（与 `path` 同目录），否则 rename 可能不是原子操作
- 不使用 `shutil.move`，因为它在大文件时可能回退到 copy+remove
