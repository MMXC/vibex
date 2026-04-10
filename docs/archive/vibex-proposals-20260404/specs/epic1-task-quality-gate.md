# Spec: Epic1 — 任务质量门禁

## 概述
防止任务虚假完成。当前 `task_manager.py` 仅记录 `completedAt`，缺乏 git commit 验证，导致 Dev/Reviewer 多次报告虚假完成。

## 影响文件
- `~/.openclaw/skills/team-tasks/scripts/task_manager.py`

---

## Spec E1-F1: commit hash 记录

### 行为
`task update <project> <stage> done` 执行时，在任务 JSON info 中记录当前 git commit hash。

### 实现
```python
def update(project, stage, action, ...):
    if action == 'done':
        try:
            repo = os.environ.get('GIT_REPO', '/root/.openclaw')
            commit = subprocess.check_output(
                ['git', 'rev-parse', 'HEAD'], 
                cwd=repo, 
                stderr=subprocess.DEVNULL
            ).decode().strip()
            info['commit'] = commit
        except Exception:
            pass  # git 不可用时静默跳过
```

### 验收
```python
def test_commit_recorded_on_done():
    # 创建临时任务
    # 执行 update done
    # 读取任务 JSON，验证 commit 字段存在
    assert 'commit' in info
    assert len(info['commit']) == 40  # SHA-1 hash 长度
```

---

## Spec E1-F2: commit 变更验证

### 行为
执行 `done` 时，若当前 commit hash 与 info 中记录的 hash 相同（任务已完成过一次），输出警告。

### 实现
```python
if action == 'done':
    if 'commit' in info:
        current = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo).decode().strip()
        if current == info['commit']:
            print(f"⚠️ Warning: No new commit since last done. Task may be虚假完成.")
            # 不阻塞，仅警告
```

### 验收
```python
def test_no_new_commit_warning():
    # 模拟已有 commit 的任务
    # 再次执行 done
    # 验证输出包含警告信息
    assert 'Warning' in output or '⚠️' in output
```

---

## Spec E1-F3: Dev 任务测试文件检查

### 行为
当 `stage` 包含 `dev` 或 `create-prd` 时（Dev agent 任务），done 时检查 `git diff --name-only` 是否包含测试文件。

### 实现
```python
def check_test_coverage():
    changed = subprocess.check_output(
        ['git', 'diff', '--name-only', 'HEAD~1'],
        cwd=repo
    ).decode().splitlines()
    
    test_files = [f for f in changed if re.search(r'\.test\.(ts|tsx|js|jsx)$', f)]
    if not test_files:
        print("⚠️ Warning: Dev task completed without test file changes")
        return False
    return True
```

### 验收
```python
def test_dev_task_requires_test():
    # Dev 任务 done，无测试文件 → 输出警告
    # Dev 任务 done，有测试文件 → 正常完成
```

---

## 依赖

无外部依赖，纯内部 task_manager.py 改动。

---

## 工时

- E1-F1: 1h
- E1-F2: 1h
- E1-F3: 1h
- 总计: 3h
