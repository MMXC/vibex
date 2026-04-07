# Analysis: Sandbox Exec Freeze — No stdout/stderr

**任务**: vibex-exec-sandbox-freeze/analyze-requirements
**日期**: 2026-03-30
**分析师**: analyst
**数据来源**: FIX.md

---

## 1. 问题概述

### 问题描述
Sandbox 模式下 `exec` 工具返回 exit code 0 但**无任何 stdout/stderr 输出**。所有命令静默成功，无法验证命令结果。

### 影响范围
- OpenClaw exec 工具（sandbox 模式）
- 所有使用 sandbox exec 的 agent
- task_manager.py update/status 命令（静默失败）
- git commit/push 操作
- 任何依赖输出的命令

---

## 2. 根因分析

### 直接根因
Sandbox exec 实现中 stdout/stderr pipe 处理断裂。子进程正常退出但输出流未被捕获/转发。

### 证据
| 现象 | 说明 |
|------|------|
| 所有命令返回 exit code 0 | 子进程确实运行了 |
| Python `print()` 输出丢失 | stdout 未捕获 |
| `2>&1` stderr 重定向丢失 | stderr pipe 断开 |
| `echo "test"` 输出丢失 | stdout pipe 断开 |
| subprocess pipes 似乎断开 | 底层 pipe 问题 |

### 时间线
1. 写文件的命令（不读输出）正常工作
2. 读输出的命令静默失败
3. 无错误消息产生
4. 即使命令失败也返回 exit code 0

---

## 3. Jobs-To-Be-Done (JTBD)

### JTBD 1: 检测 exec 健康状态
**用户**: 所有 agent
**目标**: 在执行关键命令前检测 exec 是否正常工作
**信号**: 命令输出丢失，无法验证结果

### JTBD 2: 添加命令超时保护
**用户**: 所有 agent
**目标**: 防止命令永久卡住
**信号**: sandbox 进程冻结无法响应

### JTBD 3: 修复 stdout/stderr 捕获
**用户**: OpenClaw 开发团队
**目标**: 根本性修复 pipe 处理
**信号**: 所有输出命令静默失败

---

## 4. 技术方案选项

### 方案 A: 健康检查 + 超时包装器（短期）

**实现**: 修改 `exec-wrapper.sh`
```bash
# 添加健康检查
_exec_test() {
    output=$(echo "EXEC_HEALTH_TEST_$(date +%s)" 2>&1)
    [ -z "$output" ] && echo "WARN: exec broken" >&2
}

# 添加超时
timeout "$COMMAND_TIMEOUT" bash -c "$1"
```

**优点**: 快速部署，无需修改 OpenClaw 核心
**缺点**: 临时方案，非根本修复

### 方案 B: OpenClaw 源码修复（长期）

**实现**: 修复 `src/core/exec.ts` 和 `src/sandbox/process.ts` 中的 pipe 处理

**优点**: 根本性解决
**缺点**: 需要深入理解 OpenClaw 架构，测试周期长

### 方案 C: 混合方案（推荐）

**短期**: 部署方案 A 健康检查 + 超时
**长期**: 推进方案 B 源码修复
**同时**: 提供 workaround 文档

---

## 5. 初步风险识别

| 风险 | 影响 | 缓解 |
|------|------|------|
| 健康检查本身也丢失输出 | 高 | 使用文件写入验证 |
| 超时设置不合理 | 中 | 提供可配置 timeout |
| OpenClaw 源码难以调试 | 高 | 借助 workarounds 绕过 |

---

## 6. 验收标准

| # | 标准 | 测试方法 |
|---|------|----------|
| 1 | exec 健康检查能检测出问题 | `echo "test"` 输出非空 |
| 2 | 超时命令被正确终止 | `sleep 60` 在 30s 后终止 |
| 3 | stdout/stderr 正确捕获 | `echo "test" 2>&1` 输出 "test" |
| 4 | 错误命令返回非零 exit code | `exit 1` 返回 exit code 1 |

---

## 7. Workaround

在修复部署前，使用以下 workaround：

### Workaround 1: 文件写入验证
```bash
echo "result_$(date +%s)" > /tmp/result.txt
cat /tmp/result.txt
```

### Workaround 2: 使用 subagent sessions
subagent 会话可能有正常的 exec

### Workaround 3: 验证 exit code
虽然 exit code 0 不保证成功，但非零 exit code 一定失败

---

## 8. 建议行动

| 优先级 | 行动 | 负责人 |
|--------|------|--------|
| P0 | 部署 exec-wrapper.sh 健康检查 | dev |
| P0 | 配置合理的 COMMAND_TIMEOUT | dev |
| P1 | 调查 OpenClaw exec.ts pipe 处理 | architect |
| P2 | 修复 OpenClaw 源码 | OpenClaw 团队 |
