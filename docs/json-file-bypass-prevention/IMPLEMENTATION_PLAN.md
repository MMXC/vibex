# Implementation Plan: JSON 文件越权编辑防护

> **项目**: json-file-bypass-prevention
> **阶段**: Phase1 — 安全修复
> **版本**: 1.0.0
> **日期**: 2026-03-31
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw

---

## 1. 概述

### 目标
修复 task_manager.py 的安全漏洞，防止 agents 绕过 CLI 直接修改 JSON。

### 工作量估算
| Epic | 工时 |
|------|------|
| Epic 1: 产出物验证 | 2h |
| Epic 2: Session 追踪 | 1h |
| Epic 3: 审计日志 | 2h |
| Epic 4: HMAC 修复 | 1h |
| **总计** | **6h** |

---

## 2. Epic 详细计划

### Epic 1: 产出物验证（2h）

| Story | 功能 | 验收标准 |
|--------|------|----------|
| F1.1 | 产出物验证 | `verify_output(stage) == true` |
| F1.2 | 验证失败阻断 | 报错并阻断 |
| F1.3 | 验证命令支持 | 支持 custom_verify |

### Epic 2: Session 追踪（1h）

| Story | 功能 | 验收标准 |
|--------|------|----------|
| F2.1 | session_key 记录 | 日志包含 session_key |
| F2.2 | agent_id 记录 | 日志包含 agent_id |

### Epic 3: 审计日志（2h）

| Story | 功能 | 验收标准 |
|--------|------|----------|
| F3.1 | JSONL 格式 | 审计日志为有效 JSONL |
| F3.2 | 审计字段 | 包含 time/project/stage/action/agent |

### Epic 4: HMAC 修复（1h）

| Story | 功能 | 验收标准 |
|--------|------|----------|
| F4.1 | 无签名拒绝 | 无 _mac 字段时拒绝加载 |
| F4.2 | 权限收紧 | JSON 文件权限 600 |

---

## 3. 文件变更

```
/root/.openclaw/
├── src/
│   └── task_manager/
│       ├── output_verifier.py    # 新建
│       ├── hmac_verifier.py      # 新建
│       ├── session_tracker.py     # 新建
│       ├── audit_logger.py        # 新建
│       └── cli.py                # 修改
├── tests/
│   └── test_*.py               # 新建
└── audit/                       # 新建目录
```

---

## 4. 快速验收单

```bash
# 产出物验证
python3 task_manager.py update test done

# 审计日志
ls /audit/$(date +%Y%m%d).jsonl

# 权限检查
stat -c %a tasks.json
```

---

## 5. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 验证逻辑影响性能 | 异步验证 |
| HMAC 影响加载速度 | 缓存验证结果 |
| 审计日志占用空间 | 定期归档 |

---

*本文档由 Architect Agent 生成*
