# PRD: JSON 文件越权编辑防护

> **项目**: json-file-bypass-prevention
> **创建日期**: 2026-03-31
> **类型**: 安全修复
> **状态**: Draft
> **负责人**: PM Agent

---

## 1. 执行摘要

### 背景
当前 task_manager.py 存在多层绕过路径，agents 可绕过 CLI 直接修改任务 JSON 标记完成，但实际未完成工作。CLI update 时不验证产出物是否存在，且 audit log 不追踪具体 agent/session。

### 目标
- 实现产出物强制验证
- 添加 session 追踪
- 建立完整审计日志
- 修复 HMAC 绕过漏洞

### 关键指标
| 指标 | 目标 |
|------|------|
| 虚假完成率 | 0% |
| 产出物验证覆盖率 | 100% |
| 审计追踪完整率 | 100% |

---

## 2. Epic 拆分

### Epic 1: 产出物验证（P0）

**目标**: CLI update 时强制验证产出物

**故事点**: 2h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F1.1 | 产出物验证 | update done 时验证产出物存在 | `expect(verify_output(stage)).toBe(true)` | P0 |
| F1.2 | 验证失败阻断 | 产出物不存在时阻断并报错 | `expect(error).toContain('产出物验证失败')` | P0 |
| F1.3 | 验证命令支持 | 支持 `verification.command` 字段 | `expect(custom_verify).toWork()` | P1 |

**DoD for Epic 1**:
- [ ] 无产出物的任务无法标记 done
- [ ] 错误信息明确指出问题
- [ ] 验证逻辑可扩展

---

### Epic 2: Session 追踪（P1）

**目标**: 记录具体 agent/session 身份

**故事点**: 1h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F2.1 | session_key 记录 | 更新时记录 session_key | `expect(log).toContain('session_key')` | P1 |
| F2.2 | agent_id 记录 | 更新时记录 agent_id | `expect(log).toContain('agent_id')` | P1 |
| F2.3 | 环境变量获取 | 从 OPENCLAW_SESSION_KEY 获取 | `expect(session_var).toBeAccessible()` | P1 |

**DoD for Epic 2**:
- [ ] 日志包含完整身份信息
- [ ] 可追溯到具体 agent

---

### Epic 3: 审计日志（P1）

**目标**: 建立独立审计日志

**故事点**: 2h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F3.1 | audit log 格式 | JSONL 格式审计日志 | `expect(log_format).toBe('jsonl')` | P1 |
| F3.2 | 审计字段 | 包含 time/project/stage/action/agent | `expect(audit_fields).toBeComplete()` | P1 |
| F3.3 | 日志文件 | `/audit/<date>.jsonl` 格式 | `expect(log_file).toMatch('/audit/\\d{8}.jsonl')` | P1 |

**DoD for Epic 3**:
- [ ] 审计日志文件存在
- [ ] 格式为有效 JSONL
- [ ] 字段完整

---

### Epic 4: HMAC 绕过修复（P1）

**目标**: 修复 HMAC 自动补签漏洞

**故事点**: 1h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F4.1 | 无签名拒绝 | 无 _mac 字段时拒绝加载 | `expect(load_without_mac).toThrow()` | P1 |
| F4.2 | 权限收紧 | JSON 文件权限 600 | `expect(file_perm).toBe(0o600)` | P1 |

**DoD for Epic 4**:
- [ ] 无签名文件被拒绝
- [ ] 文件权限正确

---

## 3. 验收标准汇总

### P0
| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | update done | 产出物不存在 | 报错并阻断 |
| AC1.2 | update done | 产出物存在 | 正常完成 |

### P1
| ID | Given | When | Then |
|----|-------|------|------|
| AC2.1 | 日志查看 | 检查 update.log | 包含 session_key |
| AC3.1 | 审计日志 | 查看 /audit/ | 存在且格式正确 |
| AC4.1 | 无签名文件 | CLI 加载 | 报错退出 |

---

## 4. 快速验收单

```bash
# 产出物验证
test -f docs/xxx/prd.md && echo "OK" || echo "MISSING"

# 审计日志
ls /audit/$(date +%Y%m%d).jsonl

# 权限检查
stat -c %a task_manager.py
```

---

## 5. 工作量估算

| Epic | 工时 |
|------|------|
| Epic 1: 产出物验证 | 2h |
| Epic 2: Session 追踪 | 1h |
| Epic 3: 审计日志 | 2h |
| Epic 4: HMAC 修复 | 1h |
| **总计** | **6h** |

---

**文档版本**: v1.0
**下次审查**: 2026-04-01
