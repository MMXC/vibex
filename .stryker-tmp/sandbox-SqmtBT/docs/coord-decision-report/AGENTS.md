# 开发约束 (AGENTS.md): coord-decision-report

> **项目**: coord-decision-report
> **阶段**: Phase1 — CLI 实现
> **版本**: 1.0.0
> **日期**: 2026-03-30
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex

---

## 1. 技术栈约束

| 维度 | 约束 |
|------|------|
| **脚本语言** | Python 3 |
| **CLI** | argparse（标准库） |
| **分析器** | 复用 task-manager-current-report |
| **测试框架** | pytest |
| **额外依赖** | ❌ 无（仅标准库） |

---

## 2. 文件操作约束

### 2.1 允许修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `coord_decision_report.py` | 新建 | CLI 入口脚本 |
| `tests/coord_decision_report/` | 新建 | 测试目录 |

### 2.2 禁止操作

| 操作 | 原因 |
|------|------|
| ❌ 修改 task-manager-current-report 分析器 | 复用原则，需保持一致性 |
| ❌ 引入新依赖 | 保持轻量 |
| ❌ 修改 tasks.json 结构 | 保持向后兼容 |

---

## 3. 代码规范

### 3.1 CLI 参数规范

```python
# ✅ 正确：标准化参数
parser.add_argument("--json", action="store_true")
parser.add_argument("--idle", type=int)
parser.add_argument("--workspace", default="/root/.openclaw/vibex")

# ❌ 错误：参数名不一致
parser.add_argument("--format", choices=["text", "json"])  # 用 --json
parser.add_argument("--count", type=int)  # 用 --idle
```

### 3.2 退出码规范

```python
# ✅ 正确：明确的退出码
sys.exit(0)   # 正常，无问题
sys.exit(1)   # 有阻塞任务或连续空转 >= 3

# ❌ 错误：静默失败
sys.exit()  # 不明确
```

### 3.3 错误处理

```python
# ✅ 正确：graceful fallback
try:
    # 正常逻辑
    report = generate_report(...)
except ImportError:
    # 分析器未找到，使用简化输出
    print("⚠️ 警告: 使用简化输出")
    print_simplified_report()

# ❌ 错误：直接崩溃
report = generate_report(...)  # 可能 ImportError
```

---

## 4. 输出格式规范

### 4.1 文本输出

```
=== Coord Decision Report ===
Generated: 2026-03-30T15:06:00

--- Ready to Execute ---
📋 project/task-id [agent]
   依赖: dep1, dep2 ✅
   等待: 23min
   决策: ✅ do it now — reason

--- Blocked Tasks ---
🔴 project/task-id blocked
   原因: root_cause_detail
   建议: suggested_action

--- Idle Status ---
⏳ N active | 📋 N ready | 连续空转: N/3
   → 提案库 Top 推荐:
   → Top1: proposal-name [proposer]
```

### 4.2 JSON 输出

```json
{
  "generated_at": "2026-03-30T15:06:00",
  "ready_tasks": [...],
  "blocked_tasks": [...],
  "idle": {
    "active": 0,
    "ready": 0,
    "consecutive_idle": 3,
    "top_proposals": [...]
  }
}
```

---

## 5. 测试要求

### 5.1 测试用例

```python
def test_cli_json_output():
    """测试 JSON 输出"""
    result = subprocess.run(
        ["python", "coord_decision_report.py", "--json"],
        capture_output=True,
        text=True
    )
    data = json.loads(result.stdout)
    assert "ready_tasks" in data
    assert "blocked_tasks" in data
    assert "idle" in data


def test_cli_exit_code():
    """测试退出码"""
    # 有阻塞时返回 1
    result = subprocess.run(
        ["python", "coord_decision_report.py"],
        capture_output=True
    )
    # 至少不崩溃
    assert result.returncode in [0, 1]
```

### 5.2 集成测试

```bash
# 所有检查
python coord_decision_report.py
python coord_decision_report.py --json | python -m json.tool
python coord_decision_report.py --idle 3
time python coord_decision_report.py
```

---

## 6. 提交流程

```
1. dev 完成代码
2. 运行: pytest tests/coord_decision_report/ -v
3. 运行: python coord_decision_report.py --json | python -m json.tool
4. 提交: git commit -m "feat(coord): decision-report CLI"
5. 推送: git push
6. tester 审查 → 合并
```

---

## 7. 性能要求

| 指标 | 要求 |
|------|------|
| 执行时间 | < 2 秒 |
| 内存占用 | < 50MB |
| 启动时间 | < 1 秒 |

---

## 8. 回滚计划

| 场景 | 应对 |
|------|------|
| 分析器导入失败 | graceful fallback，输出简化报告 |
| tasks.json 损坏 | 返回空报告，不崩溃 |
| proposals 目录不存在 | 跳过提案推荐部分 |

---

## 9. 相关文档

| 文档 | 路径 |
|------|------|
| 架构文档 | `docs/coord-decision-report/architecture.md` |
| PRD | `docs/coord-decision-report/prd.md` |
| 分析文档 | `docs/coord-decision-report/analysis.md` |
| 复用分析器 | `docs/task-manager-current-report/architecture.md` |

---

## 10. 复用声明

本项目**完全复用** `task-manager-current-report` 的分析器模块：

```python
# 复用方式
sys.path.insert(0, str(Path(workspace) / "src" / "task_manager"))
from current_report import (
    generate_report,
    format_as_text,
    format_as_json
)
```

如果 `task-manager-current-report` 的分析器有变更，需要同步更新。

---

*本文档由 Architect Agent 生成，用于约束 dev 的开发行为。*
