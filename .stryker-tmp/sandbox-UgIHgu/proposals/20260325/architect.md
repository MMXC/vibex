# Architect 提案: OpenViking API Gateway 重构

**Agent**: Architect
**日期**: 2026-03-25
**优先级**: P1
**工时**: 4h（Phase 3 可选）

---

## 1. 提案标题

**OpenViking API Gateway: 从 JSON 并发写入损坏到统一任务状态服务**

---

## 2. 问题陈述

OpenViking 多智能体系统当前存在根本性架构问题：**任务状态分散在多个 JSON 文件中，无统一 API 层**。

### 症状
- Dev 提案：bash 心跳脚本与 Python task_manager 使用不同路径 → 状态不一致
- Reviewer 提案：提案路径在 HEARTBEAT.md 和 scripts 中不统一
- Architect 观察：当前 fix 是补丁而非架构，不能解决并发损坏根因

### 根因
```
Agent A: write JSON (File A)
Agent B: write JSON (File A)  ← 并发覆盖，损坏
Agent C: read JSON (File B)    ← 读取旧数据，状态陈旧
```

---

## 3. 提案内容

### 3.1 核心方案：TaskGateway API

**新建**: `scripts/task_gateway.py`

```python
# 统一的任务状态 API
class TaskGateway:
    def read_state(project, stage) -> dict
    def write_state(project, stage, status, **kwargs) -> bool
    def list_projects() -> list[str]
    def validate_state(project) -> bool  # 事务性验证
```

**约束**: 所有 bash 心跳脚本必须通过 TaskGateway，不直接读写 JSON。

### 3.2 存储层演进

| 阶段 | 存储 | 说明 |
|------|------|------|
| Phase 1 | JSON（现有） | 快速止血，API 封装 |
| Phase 2 | JSON 双路径 | 兼容旧路径，降级支持 |
| Phase 3 | SQLite | 事务性，彻底解决并发 |

### 3.3 健康度监控

```python
def scan_consistency() -> dict:
    """心跳准确性扫描"""
    bash_reports = parse_heartbeat_reports()
    api_states = task_gateway.list_all_states()
    return {
        "inconsistencies": diff(bash_reports, api_states),
        "silent_failures": detect_silent_failures(),
        "accuracy": compute_accuracy(bash_reports, api_states),
    }
```

---

## 4. 与 Dev 提案的关系

Dev 提案（HEARTBEAT 任务状态双写一致性修复）解决的是"路径不一致"问题的症状。
本提案从架构层面提供一个统一的 TaskGateway，从根本上消除状态分散问题。

**建议优先级**: Dev 提案（快速修复 2h）先上，Architect 提案（API Gateway 4h）作为 Epic 实施。

---

## 5. 验收标准

| ID | 标准 |
|----|------|
| V1 | `expect(task_gateway.read_state() == bash_heartbeat_report)` 一致性 100% |
| V2 | `expect(len(silent_failures) == 0)` 无静默失败 |
| V3 | `expect(scan_consistency()['accuracy'] >= 99%)` 心跳准确性 |
| V4 | 所有 agent 心跳脚本通过 TaskGateway，无直接 JSON 读写 |

---

## 6. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 迁移破坏现有 agent | Phase 1 只加 API，不改现有调用方式 |
| SQLite 迁移复杂 | Phase 2 充分验证后再迁移 |

---

*提案完成时间: 2026-03-25 22:33 UTC+8*
