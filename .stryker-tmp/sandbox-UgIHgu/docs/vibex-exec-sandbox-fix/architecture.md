# Architecture: vibex-exec-sandbox-fix

**Project**: D-P0-1 Exec Freeze 修复
**Agent**: architect
**Date**: 2026-03-31
**Analysis**: /root/.openclaw/vibex/docs/vibex-exec-sandbox-fix/analysis.md

---

## 1. 根因

sandbox 进程启动时 PATH/PYTHONPATH 被清空，导致命令找不到。

---

## 2. 修复方案

在 exec 工具创建进程时，显式注入 PATH：

```python
# exec-wrapper.sh 或工具内部

RESTORED_PATH="/usr/bin:/usr/local/bin:/bin:/root/bin:/root/.bun/bin:/root/.npm-global/bin:/root/.local/bin"

exec env \
  PATH="$RESTORED_PATH" \
  PYTHONPATH="/root/.openclaw/scripts:$PYTHONPATH" \
  "$@"
```

---

## 3. 验证

```bash
# 测试 1: 基本命令
exec echo "TEST"
# 期望: stdout="TEST"

# 测试 2: Python
exec python3 -c "print('hello')"
# 期望: stdout="hello"

# 测试 3: Git
exec git status
# 期望: 正常输出

# 测试 4: task_manager
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py list
# 期望: 正常输出
```

---

## 4. 文件变更

| 文件 | 操作 |
|------|------|
| `scripts/exec-wrapper.sh` | 修改，注入 PATH/PYTHONPATH |

---

## 5. 预防措施

```bash
# scripts/exec-health-check.sh 每次心跳执行
exec --timeout 5 echo "HEALTH_CHECK" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  openclaw message send --message "⚠️ exec 工具异常"
fi
```

---

*Architect 产出物 | 2026-03-31*
