# Analysis: vibex-exec-sandbox-fix

**Goal**: D-P0-1 Exec Freeze 修复 — 恢复 sandbox PATH 环境变量

**Priority**: P0  
**Date**: 2026-03-31  
**Analyst**: analyst

---

## 1. 执行摘要

Exec 工具在 sandbox 环境下完全失效，所有命令返回 exit 0 但无 stdout/stderr。根因是 sandbox 进程环境中 PATH 被清空，导致命令无法被找到。

**推荐方案**: 最小修复 — 在 exec 工具启动时注入 PATH 环境变量（1-2h）。

---

## 2. 问题定位

### 2.1 现象

```
exec echo "hello" → exit 0, stdout: "", stderr: ""
exec python3 -c "print(1)" → exit 0, stdout: "", stderr: ""
exec git status → 无响应/超时
```

### 2.2 根因分析

**当前 PATH**（正常环境）:
```
/usr/bin:/usr/local/bin:/root/.local/bin:/root/.bun/bin:/bin:/root/.npm-global/bin:/root/bin:/root/.volta/bin
```

**sandbox 环境**（推测）:
- 启动新进程时未继承父进程 PATH
- PYTHONPATH 也被清空
- stdin/stdout/stderr 管道断裂（返回空输出）

### 2.3 影响范围

- 所有 agent 无法执行 git 操作
- `task_manager.py update` 等 Python 脚本无法运行
- `exec` 工具完全失效
- 所有 git 操作需通过其他 agent 代理

---

## 3. 方案对比

### 方案 A: 在 exec 工具中注入 PATH（推荐，1-2h）

**思路**: 在 exec 工具创建进程时，显式注入 PATH 环境变量。

```typescript
// 工具内部，在 spawn/process 创建时
const env = {
  ...process.env,
  PATH: '/usr/bin:/usr/local/bin:/bin:/root/bin:/root/.bun/bin:/root/.npm-global/bin',
  PYTHONPATH: '/root/.openclaw:/usr/lib/python3',
};
```

**优点**: 不修改 sandbox 底层实现，改动最小  
**缺点**: 硬编码 PATH 值，可能随系统变化失效

### 方案 B: 创建 .bashrc 初始化脚本（0.5h）

**思路**: 在 `/root/.openclaw/` 创建 `.bashrc` 设置环境变量，sandbox 启动时 source。

```bash
# /root/.openclaw/.bashrc
export PATH="/usr/bin:/usr/local/bin:/bin:..."
export PYTHONPATH="/root/.openclaw:..."
```

**优点**: 无需修改工具代码  
**缺点**: sandbox 可能不加载 .bashrc

### 方案 C: 修复 sandbox 底层（4h+）

**思路**: 修改 sandbox 进程启动逻辑，恢复 PATH 继承。

**优点**: 从根本上解决问题  
**缺点**: 涉及 OpenClaw 核心代码，改动大

---

## 4. 推荐方案

**方案 A** — 理由：
1. 改动最小，不影响 sandbox 底层
2. 立即可用，1-2h 可完成
3. 可通过 health check 验证

### 具体实现

在 exec 工具代码中，spawn 进程时注入环境变量：

```typescript
// 注入的环境变量
const EXEC_ENV = {
  PATH: [
    '/usr/bin',
    '/usr/local/bin',
    '/bin',
    '/sbin',
    '/root/bin',
    '/root/.bun/bin',
    '/root/.npm-global/bin',
    '/root/.volta/bin',
    '/root/.local/bin',
  ].join(':'),
  PYTHONPATH: [
    '/root/.openclaw',
    '/usr/lib/python3',
    '/usr/local/lib/python3.12',
  ].join(':'),
  HOME: '/root',
  TERM: 'xterm-256color',
};
```

---

## 5. 验收标准

| # | 标准 | 验证命令 |
|---|------|---------|
| 1 | `exec echo "TEST"` 返回 "TEST" | `exec echo "TEST"` |
| 2 | `exec python3 --version` 返回 Python 版本 | `exec python3 --version` |
| 3 | `exec git status` 正常返回 | `exec git status` |
| 4 | `exec ls /root/.openclaw` 正常列出目录 | `exec ls /root/.openclaw` |

---

## 6. 相关文件

```
openclaw/src/tools/exec.ts          # exec 工具实现
openclaw/src/sandbox/              # sandbox 进程管理
/root/.bashrc                     # shell 初始化脚本
```

---

## 7. 技术风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| PATH 值硬编码 | 系统路径变化时失效 | 定期检查 PATH 完整性 |
| PYTHONPATH 不完整 | Python 导入失败 | 包含主要 Python 路径 |
| sandbox 重启失效 | 修复后重启又失效 | 固化到配置文件中 |
