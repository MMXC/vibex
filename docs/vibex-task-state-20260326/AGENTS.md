# AGENTS.md: task_state CLI 开发约束

**项目**: vibex-task-state-20260326
**版本**: 1.0
**日期**: 2026-03-26

---

## 1. ADR 决策清单

- [ADR-001] ✅ 乐观锁 + 原子写入（不做文件锁服务）
- [ADR-002] ✅ CLI + Python API 双暴露（不做单一入口）

---

## 2. 代码规范

### 2.1 JSON 写入规范
- 所有写入必须通过 `save_project_with_lock()`（乐观锁保护）
- 禁止直接使用 `open(path, "w")` 或 `json.dump()`
- 原子写入使用 `atomic_write_json()`

### 2.2 revision 规范
- revision 初始为 `0`（无 revision 的旧文件视为 `0`）
- 每次成功写入 +1
- 不在业务代码中手动修改 revision

### 2.3 CLI 规范
- 命令: `update` / `claim` / `status` / `lock`
- 所有命令返回整数退出码（0=成功，1=失败）
- 所有输出到 stdout，错误到 stderr

---

## 3. 禁止事项

- ❌ 禁止在 task_manager.py 外部直接调用 `json.dump()`
- ❌ 禁止在 agent 脚本中使用 `open(path, "w")` 写 JSON
- ❌ 禁止在并发场景中直接读-改-写（race condition）
- ❌ 禁止手动设置 revision 值

---

## 4. 验证命令

```bash
# 验证无直接 JSON 写入
grep -r 'open.*\.json.*"w"' skills/team-tasks/scripts/ --include="*.py" || echo "✅ 无直接写入"

# 验证 atomic_write_json 存在
grep -c 'atomic_write_json' skills/team-tasks/scripts/task_manager.py || echo "❌ atomic_write_json 缺失"

# 验证 task_state.py 存在
test -f skills/team-tasks/scripts/task_state.py && echo "✅ CLI 存在"
```

---

## 5. 测试要求

每个 PR 必须通过：
1. `test_concurrent.py` — 4 进程并发 revision 递增
2. `test_atomic.py` — SIGKILL 注入后文件未损坏
3. CLI 集成测试 — update/claim/status/lock 全部返回 0

---

*AGENTS.md 完成时间: 2026-03-26 12:04 UTC+8*
