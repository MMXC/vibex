# AGENTS.md — wow-harness OpenClaw 实装项目编码规范

> **项目**: vibex
> **版本**: 1.0
> **日期**: 2026-04-13

---

## 1. 项目约束

### 1.1 变更范围（红线内）

本次迭代 **仅限** 以下文件/目录：

| 文件/目录 | 允许操作 |
|-----------|----------|
| `~/.openclaw/openclaw.json` | 修改 `tools.subagents.tools.deny` |
| `~/.openclaw/skills/team-tasks/scripts/task_manager.py` | 扩展 D8 检查、loop detection 集成 |
| `~/.openclaw/agent-governance/`（新建） | 全部新建文件 |
| `~/.openclaw/progress.json` | D8 通过后自动写入 |
| `~/.openclaw/failure-patterns.jsonl` | Pattern DB 初始化 |
| `~/.openclaw/agent-governance/tests/` | 新建测试文件 |

### 1.2 禁止变更范围

以下文件/目录 **不得修改**（本次迭代锁死）：

- `~/.openclaw/skills/team-tasks/scripts/config.py`（现有配置结构）
- `~/.openclaw/skills/team-tasks/scripts/__init__.py`（包结构）
- `~/.openclaw/openclaw.json` 的 `agents` 和 `channels` 配置段
- OpenClaw 核心代码（`/usr/lib/node_modules/openclaw/`）

### 1.3 技术栈锁定

| 技术 | 版本要求 | 约束理由 |
|------|----------|----------|
| Python | 3.10+ | task_manager.py 现有依赖 |
| pytest | latest | 现有测试框架 |
| JSON5 / JSON | — | 配置文件格式 |
| JSONL | — | metrics 和 pattern DB 格式 |

---

## 2. 代码规范

### 2.1 task_manager.py 扩展规范

```python
# ✅ 正确：在现有 validate_task_completion 函数中增加 D8 钩子
def validate_task_completion(project, stage_id, stage_info, old_status=None, repo=DEFAULT_WORK_DIR):
    # ... 现有逻辑（commit 检查）...
    
    # E2: D8 机械化检查（新增）
    d8 = run_d8_check(repo=repo)
    write_progress_json("pass" if d8["passed"] else "fail", f"{project}/{stage_id}", d8["errors"])
    if not d8["passed"]:
        warnings.append(f"D8 CHECK FAILED: {'; '.join(d8['errors'])}")
        return {"valid": False, "warnings": warnings, "commit": current_commit}
    
    return {"valid": True, "warnings": warnings, "commit": current_commit}

# ❌ 错误：修改现有函数签名（参数个数和类型不能变）
def validate_task_completion(project, stage_id, stage_info, old_status=None, repo=DEFAULT_WORK_DIR, new_param=None):
```

### 2.2 D8 检查规范

```python
# ✅ 正确：检查命令存在性，graceful 降级
def run_d8_check(repo, commands=None, timeout=300):
    if commands is None:
        commands = ["pnpm build", "pnpm test"]
    for cmd in commands:
        try:
            r = subprocess.run(cmd, shell=True, cwd=repo, ...)
        except FileNotFoundError:
            results["errors"].append(f"command not found: {cmd.split()[0]}")
            results[label] = -2
        except subprocess.TimeoutExpired:
            results["errors"].append(f"{cmd} timeout")
            results[label] = -1

# ❌ 错误：不做错误处理，命令不存在时直接崩溃
r = subprocess.run(cmd, shell=True, cwd=repo)  # 无 try/except
```

### 2.3 Loop Detector 规范

```python
# ✅ 正确：按文件路径隔离计数，不同文件互不影响
class LoopDetector:
    def record_edit(self, file_path: str, tool: str = "edit") -> Optional[str]:
        counts = self._state["edit_counts"]
        counts[file_path] = counts.get(file_path, 0) + 1
        threshold = self._state["config"].get("loop_threshold", 5)
        if counts[file_path] == threshold:
            return f"⚠️ Loop Detection: '{file_path}' ..."

# ❌ 错误：全局计数器（不区分文件）
self._state["edit_count"] += 1  # 不区分文件！
```

### 2.4 Pattern DB 规范

```python
# ✅ 正确：追加写入 JSONL
def add_pattern(entry: dict):
    with open(PATTERN_DB, "a") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

# ❌ 错误：覆盖写入（会丢失已有 pattern）
with open(PATTERN_DB, "w") as f:  # ❌
    f.write(json.dumps(entry) + "\n")
```

### 2.5 Metrics 规范

```python
# ✅ 正确：session 结束时写入
class MetricsCollector:
    def write(self):
        self.finalize()
        with open(self._path, "a") as f:
            f.write(json.dumps(self.data, ensure_ascii=False) + "\n")

# ❌ 错误：每次 record_tool 都写（性能问题）
def record_tool(self, tool: str):
    self.data["toolCalls"][tool] += 1
    self.write()  # ❌ 每次都写！
```

---

## 3. 安全红线（🚨 绝对禁止）

### 🚨 红线 1: 禁止修改 task_manager.py 函数签名

```
现有函数的参数个数、类型、默认值不能改变
```

- ❌ 在 `validate_task_completion` 中添加必需参数
- ❌ 修改参数顺序
- ✅ 新增可选参数带默认值：`def f(..., new_opt=None)`

### 🚨 红线 2: 禁止删除现有 validate_task_completion 逻辑

```
commit 检查逻辑是已有功能，必须保留
```

- ❌ 删除整个函数重写
- ❌ 删除 commit 检查分支
- ✅ 在函数末尾增加 D8 检查

### 🚨 红线 3: 禁止修改 openclaw.json 的 agents/channels 配置

```
工具策略配置仅通过 agents.list[].tools.sandbox.tools.allow 增加 reviewer agent 白名单
```

- ❌ 修改 `agents.list` 中非 reviewer 的 agent 配置
- ❌ 删除现有 agent 配置
- ❌ 修改 `channels` 配置段
- ✅ 仅在 reviewer agent 的 `tools.sandbox.tools.allow` 中增加读操作工具

### 🚨 红线 4: 禁止 Metrics 实时写入

```
Metrics 必须在 session 结束时一次性写入
```

- ❌ `record_tool()` 中调用 `write()`
- ❌ `record_guard_hit()` 中调用 `write()`
- ✅ `write()` 仅在 session 结束时调用（`finalize()` 后）

---

## 4. Git 提交规范

### 4.1 Commit Message 格式

```
<type>(<scope>): <subject>

# 示例
feat(agent-governance): add run_d8_check function
feat(agent-governance): add LoopDetector class
feat(agent-governance): add MetricsCollector class
feat(agent-governance): add Pattern DB with 12 initial patterns
feat(agent-governance): integrate D8 check into task_manager
feat(agent-governance): integrate loop detector into task_manager
config(openclaw): add reviewer agent tools deny list
test(agent-governance): add D8 check unit tests
test(agent-governance): add LoopDetector tests
```

### 4.2 分支命名

```
feature/wow-harness-agent-governance
fix/wow-harness-xxx
test/wow-harness-metrics
```

---

## 5. 代码审查清单（Reviewer 用）

### 5.1 必查项

- [ ] `task_manager.py` 的 `validate_task_completion` 函数签名未被修改
- [ ] 现有 commit 检查逻辑仍然存在
- [ ] D8 检查在函数末尾，不在函数开头
- [ ] `run_d8_check` 有超时保护（timeout 参数）
- [ ] `run_d8_check` 有 FileNotFoundError 处理
- [ ] `progress.json` 写入后 status 字段正确（"pass" 或 "fail"）
- [ ] LoopDetector 按文件路径隔离计数
- [ ] LoopDetector 的阈值从 config.json 读取
- [ ] MetricsCollector 仅在 `write()` 时写入文件
- [ ] Pattern DB 使用追加写入（"a" 模式）
- [ ] `openclaw.json` 的 reviewer agent `tools.sandbox.tools.allow` 包含 `read`、`grep`、`sessions_history`，不包含 `write`、`edit`、`exec`、`apply_patch`
- [ ] `failure-patterns.jsonl` 至少有 12 条记录
- [ ] pytest 测试全绿

### 5.2 专项检查

- [ ] D8 检查失败时 task status 保持 pending
- [ ] D8 检查通过后 progress.json status = "pass"
- [ ] Loop Detection 超阈值时输出警告（print 到 stdout）
- [ ] Metrics JSONL 格式正确（每行一个完整 JSON）
- [ ] 新增代码无 `except: pass`（必须有具体异常类型或处理逻辑）

---

*编码规范: ✅ 完成*
*Next: Dev 按规范实现 → Reviewer 按清单审查*
