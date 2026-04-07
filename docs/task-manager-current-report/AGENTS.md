# 开发约束 (AGENTS.md): task_manager.py current-report

> **项目**: task-manager-current-report
> **阶段**: Phase1 — D1+D2+D3 决策要素实现
> **版本**: 2.0.0
> **日期**: 2026-03-30
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex

---

## 1. 技术栈约束

| 维度 | 约束 |
|------|------|
| **CLI 框架** | argparse（现有） |
| **数据存储** | tasks.json（现有） |
| **提案库** | proposals/YYYYMMDD/*.md（现有） |
| **测试框架** | pytest |
| **额外依赖** | ❌ 无（使用标准库） |

---

## 2. 文件操作约束

### 2.1 允许修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/task_manager/current_report/__init__.py` | 新建 | 模块入口 |
| `src/task_manager/current_report/d1_ready_analyzer.py` | 新建 | Ready 任务分析 |
| `src/task_manager/current_report/d2_blocked_analyzer.py` | 新建 | 阻塞根因分析 |
| `src/task_manager/current_report/d3_proposal_recommender.py` | 新建 | 提案推荐 |
| `src/task_manager/current_report/report_generator.py` | 新建 | 报告生成 |
| `src/task_manager/current_report/*.py` | 新建 | 测试文件 |
| `task_manager.py` | 修改 | 添加 current-report 子命令 |

### 2.2 禁止操作

| 操作 | 原因 |
|------|------|
| ❌ 删除 tasks.json 结构 | 保持向后兼容 |
| ❌ 引入 psutil 等新依赖 | PRD v2 明确不需要服务器信息 |
| ❌ 实现虚假完成检测 | PRD v2 明确删除此项 |
| ❌ 修改现有子命令 | 保持稳定性 |

---

## 3. 代码规范

### 3.1 类型定义

```python
# ✅ 正确：使用 dataclass
@dataclass
class ReadyTask:
    project: str
    task_id: str
    decision: str  # "do it now" | "skip" | "lower priority"

# ❌ 错误：使用 dict
def analyze(tasks):
    return {"decision": "do it now"}  # 无类型提示
```

### 3.2 决策建议格式

```python
# ✅ 正确：标准化的决策值
decision = "do it now"  # ✅
decision = "do it now "  # ❌ 有多余空格
decision = "skip"        # ✅
decision = "lower priority"  # ✅

# ❌ 错误：非标准值
decision = "execute"
decision = "do it later"
```

### 3.3 根因分类

```python
# ✅ 正确：标准化的根因值
root_cause = "agent_down"              # ✅
root_cause = "dependency_not_done"     # ✅
root_cause = "unknown"                 # ✅

# ❌ 错误：非标准值
root_cause = "agent crashed"
root_cause = "dependency failed"
```

---

## 4. 输出格式规范

### 4.1 文本输出

```
=== Coord Decision Report ===
Generated: 2026-03-30T14:42:00

--- Ready to Execute ---
📋 task-manager/design-architecture [architect]
   依赖: create-prd ✅
   等待: 23min
   决策: ✅ do it now — 下游 coord-decision 阻塞中

--- Blocked Tasks ---
🔴 None

--- Idle Status ---
⏳ 0 active | 📋 0 ready | 连续空转: 3/3
   → 提案库 Top 推荐:
   → Top1: canvas-phase2-expand [dev]
```

### 4.2 JSON 输出

```json
{
  "generated_at": "2026-03-30T14:42:00",
  "ready_tasks": [
    {
      "project": "task-manager",
      "task_id": "design-architecture",
      "agent": "architect",
      "waiting_min": 23,
      "decision": "do it now",
      "reason": "下游 coord-decision 阻塞中",
      "depends_on": ["create-prd"]
    }
  ],
  "blocked_tasks": [],
  "idle": {
    "active": 0,
    "ready": 0,
    "consecutive_idle": 3,
    "top_proposals": [
      {"name": "canvas-phase2-expand", "proposer": "dev", "rank": 1, "score": 8.5}
    ]
  }
}
```

---

## 5. 测试要求

### 5.1 单元测试覆盖率

| 模块 | 覆盖率要求 |
|------|-----------|
| d1_ready_analyzer.py | ≥ 80% |
| d2_blocked_analyzer.py | ≥ 80% |
| d3_proposal_recommender.py | ≥ 75% |
| report_generator.py | ≥ 85% |

### 5.2 测试用例示例

```python
# tests/test_d1_ready_analyzer.py

def test_decision_do_it_now_when_terminal():
    """末端任务应标记为 do it now"""
    tasks_json = {
        "projects": {
            "test": {
                "tasks": [
                    {"id": "t1", "status": "done", "doneAt": "2026-03-30T10:00:00"},
                    {"id": "t2", "status": "pending", "dependsOn": ["t1"], "agent": "dev"}
                ]
            }
        }
    }
    
    result = analyze_ready_tasks(tasks_json)
    
    assert len(result) == 1
    assert result[0].decision == "do it now"


def test_no_ready_when_dependency_pending():
    """依赖未完成时不应标记为 ready"""
    tasks_json = {
        "projects": {
            "test": {
                "tasks": [
                    {"id": "t1", "status": "pending"},
                    {"id": "t2", "status": "pending", "dependsOn": ["t1"], "agent": "dev"}
                ]
            }
        }
    }
    
    result = analyze_ready_tasks(tasks_json)
    
    assert len(result) == 0
```

---

## 6. 提交流程

```
1. dev 完成代码
2. 运行: pytest tests/task_manager/current_report/ -v
3. 运行: python -m task_manager current-report --json | python -m json.tool
4. 提交: git commit -m "feat(task-manager): current-report v2 decision-oriented"
5. 推送: git push
6. tester 审查 → reviewer 二审 → 合并
```

---

## 7. 性能要求

| 指标 | 要求 |
|------|------|
| 执行时间 | < 2 秒 |
| 内存占用 | < 100MB |
| 无外部依赖 | ✅ |

---

## 8. 回滚计划

| 场景 | 应对 |
|------|------|
| CLI 命令失败 | revert commit，保留旧版 summary |
| JSON 格式错误 | 检查 json.dumps 参数 |
| 提案扫描失败 | graceful fallback，返回空列表 |

---

## 9. 相关文档

| 文档 | 路径 |
|------|------|
| 架构文档 | `docs/task-manager-current-report/architecture.md` |
| PRD v2 | `docs/task-manager-current-report/prd.md` |
| 旧版架构（已废弃） | `architecture.md.deprecated` |

---

*本文档由 Architect Agent 生成，用于约束 dev 的开发行为。*
