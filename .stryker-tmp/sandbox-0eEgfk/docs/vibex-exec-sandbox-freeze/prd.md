# PRD: Sandbox Exec 冻结修复

> **项目**: vibex-exec-sandbox-freeze
> **创建日期**: 2026-03-30
> **类型**: Bug 修复
> **状态**: Draft
> **负责人**: PM Agent

---

## 1. 执行摘要

### 背景
Sandbox 模式下 `exec` 工具返回 exit code 0 但无任何 stdout/stderr 输出，所有命令静默失败。

### 目标
- 恢复 exec 输出可见性
- 添加超时保护
- 提供根本性修复方案

### 关键指标
| 指标 | 目标 |
|------|------|
| exec 输出恢复率 | 100% |
| 命令冻结次数 | 0 |
| 健康检查准确率 | ≥ 99% |

---

## 2. Epic 拆分

### Epic 1: 健康检查机制（P0）

**目标**: 在执行关键命令前检测 exec 是否正常

**故事点**: 2h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F1.1 | 健康检查函数 | 添加 `_exec_test()` 检测 stdout 是否正常 | `expect(echo_test).toContain('EXEC_HEALTH_TEST')` | P0 |
| F1.2 | 警告机制 | 检测到问题时输出警告 | `expect(warn).toBeLogged()` | P0 |
| F1.3 | 状态报告 | 返回 exec 健康状态 | `expect(status).toBeIn(['healthy', 'broken'])` | P1 |

**DoD for Epic 1**:
- [ ] 健康检查函数存在且可调用
- [ ] 能检测出当前 pipe 断裂问题
- [ ] 警告输出到 stderr

---

### Epic 2: 超时保护（P0）

**目标**: 防止命令永久卡住

**故事点**: 1h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F2.1 | 超时包装器 | 使用 `timeout` 命令包装执行 | `expect(sleep_60).toBeTerminatedAfter(30s)` | P0 |
| F2.2 | 可配置 timeout | COMMAND_TIMEOUT 环境变量 | `expect(custom_timeout).toWork()` | P1 |
| F2.3 | 超时错误处理 | 超时时返回明确错误 | `expect(timeout_error).toBeDescriptive()` | P1 |

**DoD for Epic 2**:
- [ ] 默认 30s 超时
- [ ] 可配置超时时间
- [ ] 超时时正确终止进程

---

### Epic 3: 输出恢复（P0）

**目标**: 修复 stdout/stderr 捕获

**故事点**: 3h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F3.1 | stdout 捕获 | echo 命令输出被正确捕获 | `expect(echo_test).toOutput('test')` | P0 |
| F3.2 | stderr 捕获 | stderr 重定向正常工作 | `expect(stderr_redirect).toCapture('error')` | P0 |
| F3.3 | 混合输出 | `2>&1` 正确合并输出 | `expect(combined_output).toContain('test')` | P0 |

**DoD for Epic 3**:
- [ ] `echo "test"` 输出 "test"
- [ ] `2>&1` 重定向正常
- [ ] exit code 正确传递

---

### Epic 4: OpenClaw 源码修复（长期）

**目标**: 根本性修复 pipe 处理

**故事点**: 8h（延期）

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F4.1 | exec.ts 分析 | 分析 `src/core/exec.ts` pipe 处理 | `expect(analysis).toBeComplete()` | P2 |
| F4.2 | process.ts 修复 | 修复 `src/sandbox/process.ts` | `expect(stdout_pipe).toBeFixed()` | P2 |
| F4.3 | 测试覆盖 | 添加 exec 工具测试 | `expect(test_coverage).toBe(100)` | P2 |

**DoD for Epic 4**:
- [ ] 根因分析完成
- [ ] 源码修复已提交
- [ ] 测试覆盖 100%

---

## 3. Workaround 文档

### Workaround 1: 文件写入验证
```bash
echo "result_$(date +%s)" > /tmp/result.txt
cat /tmp/result.txt
```

### Workaround 2: 验证 exit code
```bash
# 非零 exit code 一定失败
command || echo "Failed with exit code $?"
```

---

## 4. 验收标准汇总

### P0
| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 健康检查 | `echo "test"` | 输出包含 "test" |
| AC2.1 | 超时命令 | `sleep 60` | 30s 后终止 |
| AC3.1 | stdout | `echo "test"` | 输出 "test" |
| AC3.2 | stderr | `echo "error" 2>&1` | 输出包含 "error" |
| AC3.3 | exit code | `exit 1` | 返回 exit code 1 |

### P1
| ID | Given | When | Then |
|----|-------|------|------|
| AC1.2 | 警告机制 | exec broken | 警告输出到 stderr |
| AC2.2 | 自定义超时 | `COMMAND_TIMEOUT=60` | 使用 60s 超时 |

---

## 5. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 健康检查本身丢失输出 | 高 | 高 | 使用文件写入验证 |
| 超时设置不合理 | 中 | 中 | 可配置，默认 30s |
| OpenClaw 源码难以调试 | 高 | 中 | 借助 workarounds |

---

## 6. 快速验收单

```bash
# 健康检查
echo "EXEC_HEALTH_TEST" | grep "EXEC_HEALTH_TEST"

# 超时测试
timeout 5 sleep 60; echo "Exit code: $?"

# 输出测试
echo "test_output" | grep "test_output"

# stderr 测试
echo "error" 2>&1 | grep "error"
```

---

## 7. 工作量估算

| Epic | 工时 |
|------|------|
| Epic 1: 健康检查机制 | 2h |
| Epic 2: 超时保护 | 1h |
| Epic 3: 输出恢复 | 3h |
| Epic 4: 源码修复（延期） | 8h |
| **总计** | **6h（Epic 1-3）** |

---

**文档版本**: v1.0
**下次审查**: 2026-03-31
