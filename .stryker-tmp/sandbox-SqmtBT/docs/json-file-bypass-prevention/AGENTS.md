# 开发约束 (AGENTS.md): JSON 文件越权编辑防护

> **项目**: json-file-bypass-prevention
> **阶段**: Phase1 — 安全修复
> **版本**: 1.0.0
> **日期**: 2026-03-31
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw

---

## 1. 技术栈约束

| 维度 | 约束 |
|------|------|
| **语言** | Python 3（标准库优先） |
| **日志格式** | JSONL（追加写入） |
| **权限控制** | os.chmod（标准库） |

---

## 2. 文件操作约束

### 2.1 允许修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/task_manager/output_verifier.py` | 新建 | 产出物验证 |
| `src/task_manager/hmac_verifier.py` | 新建 | HMAC 验证 |
| `src/task_manager/session_tracker.py` | 新建 | Session 追踪 |
| `src/task_manager/audit_logger.py` | 新建 | 审计日志 |
| `src/task_manager/cli.py` | 修改 | 集成验证 |

### 2.2 禁止操作

| 操作 | 原因 |
|------|------|
| ❌ 删除现有验证逻辑 | 保持向后兼容 |
| ❌ 修改 tasks.json 加载逻辑 | 避免破坏性变更 |
| ❌ 引入新依赖 | 保持轻量 |

---

## 3. 代码规范

### 3.1 错误处理

```python
# ✅ 正确：明确错误类型
if not is_valid:
    raise OutputVerificationError(f"产出物不存在: {path}")

# ❌ 错误：静默失败
if not is_valid:
    pass
```

### 3.2 日志格式

```python
# ✅ 正确：JSONL 格式
entry = {
    "time": datetime.now().isoformat(),
    "action": "update",
    "project": project,
    "stage": stage,
    "status": status
}
f.write(json.dumps(entry) + "\n")
```

---

## 4. 安全规范

### 4.1 HMAC 验证

- 所有任务 JSON 文件必须有 `_mac` 字段
- 无签名文件必须拒绝加载
- 签名使用 HMAC-SHA256

### 4.2 文件权限

- tasks.json 权限必须为 600
- audit 目录权限必须为 700

---

## 5. 测试要求

```bash
# 运行所有测试
pytest tests/test_*.py -v

# 覆盖率要求
pytest tests/ --cov=src --cov-report=term-missing
# 覆盖率 > 80%
```

---

## 6. 提交流程

```
1. dev 完成代码
2. pytest tests/ -v
3. 覆盖率检查
4. git commit -m "fix(task_manager): add output verification"
5. git push
```

---

## 7. 回滚计划

| 场景 | 应对 |
|------|------|
| 验证阻断正常更新 | 添加 --skip-verification 参数 |
| HMAC 影响加载 | 使用环境变量 DISABLE_HMAC=1 |
| 审计日志占用空间 | 设置日志保留期限（如 30 天） |

---

## 8. 相关文档

| 文档 | 路径 |
|------|------|
| PRD | `prd.md` |
| 架构 | `architecture.md` |

---

*本文档由 Architect Agent 生成*
