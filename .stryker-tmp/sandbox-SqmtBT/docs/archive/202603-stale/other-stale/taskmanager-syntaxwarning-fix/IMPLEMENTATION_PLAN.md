# Implementation Plan: taskmanager-syntaxwarning-fix

**项目**: taskmanager-syntaxwarning-fix
**Architect**: architect
**日期**: 2026-03-23
**状态**: ✅ 完成

---

## 1. Sprint 概览

| Phase | 内容 | 工期 | 负责 |
|-------|------|------|--------|
| Phase 1 | 修复 SyntaxWarning | 0.5h | Dev |
| Phase 2 | 验证修复 | 0.5h | Dev |

**预计总工期**: 1 小时

---

## 2. Phase 详细

### Phase 1 — 修复 (0.5h)

**任务**: 将 docstring 内 `\\[` 改为 `\\\\[`

```bash
sed -i 's/## \\\[/## \\\\[/g' task_manager.py
```

**验收标准**:
- [ ] `python3 -W error task_manager.py list > /dev/null 2>&1; echo $?` 输出 0
- [ ] `grep -c "\\\\\\\\[" task_manager.py` 有输出

---

### Phase 2 — 验证 (0.5h)

**任务**:
1. 运行所有 team-tasks 命令验证无警告
2. 6 个 heartbeat 脚本调用验证

**验收标准**:
- [ ] `python3 task_manager.py list` 无 SyntaxWarning
- [ ] `python3 task_manager.py status <any_project>` 无警告
- [ ] `bash -n` 对所有 heartbeat 脚本无报错

---

**实施计划完成**: 2026-03-23 12:41 (Asia/Shanghai)
