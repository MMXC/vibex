# Implementation Plan: team-evolution-20260328

**Agent**: Architect
**Date**: 2026-03-28
**Based on**: `architecture.md`

---

## 开发者约束

### 环境要求
- Bash ≥ 4.0
- Python3 ≥ 3.8
- `/root/.openclaw/team-evolution/scores.tsv` 可写
- `/root/.openclaw/*/HEARTBEAT.md` 可写

### 禁止事项
- ❌ 不要修改 `task_manager.py`（协调点）
- ❌ 不要修改 `score.sh` 的 `record` 函数签名（保持向后兼容）
- ❌ 不要在 `auto-error-log.sh` 中直接 `echo >>` HEARTBEAT.md（使用 Python 原子写入）
- ❌ 不要在 self-score hook 中 `exit 1`（评分失败必须 `exit 0`）

### 代码规范
- 所有 Python 脚本: `#!/usr/bin/env python3 -u`（无缓冲）
- 所有 bash 脚本: `set -euo pipefail`
- 错误信息 → `stderr`，正常输出 → `stdout`

---

## Phase 1: Self-Score 基础 (~1.5h)

**Status**: ✅ DONE (2026-03-28 dev commit)

### 1.1 创建 self-score-hook.sh

**文件**: `/root/.openclaw/scripts/heartbeats/self-score-hook.sh`

**实现要点**:
1. 输入: `<phase_file> <agent_name> <run_tag>`
2. 解析 phase 文件，提取: agent_type, task_type, completion_time
3. 读取 SCORING_RUBRICS.md 确定 9 维权重
4. 从 phase 文件关键词推断各维度得分（正则匹配关键句子）
5. 计算加权总分
6. 直接写入 scores.tsv (bypasses shell param ambiguity)
7. **关键**: 任何异常 `exit 0`（不阻塞主流程）

**Phase 文件评分规则**（从文字推断）:
- `格式`: 检查标题层级、表格、列表结构
- `完整度`: 检查 `验收标准`/`产出清单`/`验收清单` 是否存在
- `约束`: 检查 `约束`/`限制`/`假设` 关键词
- `可行性`: 检查 `技术栈`/`依赖` 是否明确
- `可读`: 检查无大量 `???`/`TODO`/`未完成`

**Status**: ✅ DONE — 9维评分函数实现，Python temp file 写入 scores.tsv

### 1.2 创建测试用 phase 文件

**文件**: `/root/.openclaw/vibex/docs/team-evolution-20260328/test-phase.md`

**Status**: ✅ DONE — E2E 测试通过

### 1.3 端到端测试

```bash
bash /root/.openclaw/scripts/heartbeats/self-score-hook.sh \
    /root/.openclaw/vibex/docs/team-evolution-20260328/test-phase.md \
    architect \
    $(date +%m%d-%H%M)

# 验证
grep "rater=self" /root/.openclaw/team-evolution/scores.tsv
```

**Status**: ✅ DONE — scores.tsv 有 rater=self 记录，description 含 9 维详情

### 1.4 推广到 6 个 agent

**修改文件**（每个 agent workspace）:
- `workspace-analyst/HEARTBEAT.md`
- `workspace-pm/HEARTBEAT.md`
- `workspace-architect/HEARTBEAT.md`
- `workspace-dev/HEARTBEAT.md`
- `workspace-tester/HEARTBEAT.md`
- `workspace-reviewer/HEARTBEAT.md`

**Status**: ✅ DONE — 6/6 HEARTBEAT.md task_done hook 就位

---

## Phase 2: Error-Log 自动化 (~1h)

**Status**: ✅ DONE (2026-03-28 dev-phase2 commit)

### 2.1 创建 auto-error-log.sh

**文件**: `/root/.openclaw/scripts/heartbeats/auto-error-log.sh`

**实现要点**:
1. 输入: `<phase_file> <agent_name>`
2. 读取 phase 文件全文
3. Python3 正则扫描 5 种错误模式
4. 查重: `grep "^| E[0-9]" HEARTBEAT.md` 比对描述相似度
5. 构造 E00x 条目
6. 备份: `cp HEARTBEAT.md HEARTBEAT.md.bak.$(date +%s)`
7. Python3 原子写入（读→解析→插入→写回）
8. 追加 `"教训引用: E00x"` 到 phase 文件末尾

**Python 原子写入函数**:
```python
def append_e_entry(heartbeat_path: str, entry: str) -> None:
    with open(heartbeat_path, 'r') as f:
        lines = f.readlines()
    # 找到 E00x 区最后一行，插入
    insert_idx = find_last_e_entry(lines)
    lines.insert(insert_idx + 1, entry)
    with open(heartbeat_path, 'w') as f:
        f.writelines(lines)
```

### 2.2 HEARTBEAT.md task_done hook 更新

**修改文件**: 6/6 agent HEARTBEAT.md
- `workspace-analyst/HEARTBEAT.md`
- `workspace-pm/HEARTBEAT.md`
- `workspace-architect/HEARTBEAT.md`
- `workspace-dev/HEARTBEAT.md`
- `workspace-tester/HEARTBEAT.md`
- `workspace-reviewer/HEARTBEAT.md`

将 task_done hook 从单 `self-score-hook.sh` 更新为并行 `{self-score-hook.sh + auto-error-log.sh}` 调用。

**Status**: ✅ DONE (2026-03-28) — 6/6 HEARTBEAT.md task_done hook 追加 auto-error-log.sh 并行调用

### 2.3 E2E 错误检测测试

```bash
# 模拟包含错误的 phase 文件
echo "ERROR: 429 rate limit exceeded at line 42" > /tmp/bad-phase.md

bash /root/.openclaw/scripts/heartbeats/auto-error-log.sh \
    /tmp/bad-phase.md \
    architect

# 验证 HEARTBEAT.md E00x 区有新条目
grep -E "^| E[0-9]" <agent-workspace>/HEARTBEAT.md

# 验证备份存在
ls <agent-workspace>/HEARTBEAT.md.bak.*
```

**Status**: ✅ DONE — E2E 验证通过，检测多种错误模式，备份正常，教训引用已回填

---

## Phase 3: Delta 追踪 (~0.5h)

**Status**: ✅ DONE (2026-03-28 pipeline commit)

### 3.1 创建 delta-tracker.sh

**文件**: `/root/.openclaw/scripts/heartbeats/delta-tracker.sh`

**实现要点**:
1. 输入: `<run_tag> <agent_name>`
2. 从 scores.tsv 读取 agent 最新 self 和 scorer 记录
3. 若只有 self → 记录 awaiting，exit 0
4. 若两者都有 → 计算 delta
5. 追加 delta 到 scores.tsv 末尾列
6. 写入 analyst-evolution.sh: `delta-record` 类型
7. 若 `|delta| >= 2`: 调用 analyst-evolution.sh 提醒

**Status**: ✅ DONE — delta-tracker.sh implemented, 5 delta records in scores.tsv

### 3.2 扩展 analyst-evolution.sh

**Status**: ✅ DONE — delta-record branch exists in analyst-evolution.sh (6 occurrences), writes to analyst-results.tsv

### 3.3 端到端测试

```bash
bash /root/.openclaw/scripts/heartbeats/delta-tracker.sh \
    test-run-001 architect

# 验证 delta 记录
grep "delta" /root/.openclaw/team-evolution/scores.tsv
```

**Status**: ✅ DONE — Delta records present in scores.tsv (delta column populated for multiple agents)

---

## Phase 4: 全量覆盖 + 回归测试 (~1h)

**Status**: ✅ DONE (2026-03-28 dev-phase2 commit)

### 4.1 完整覆盖验证

```bash
# 检查所有 6 个 agent HEARTBEAT.md 都有 self-score-hook.sh
for agent in analyst pm architect dev tester reviewer; do
    grep -q "self-score-hook.sh" \
        /root/.openclaw/workspace-$agent/HEARTBEAT.md \
        && echo "✅ $agent" \
        || echo "❌ $agent MISSING"
done

# 检查所有 6 个 agent HEARTBEAT.md 都有 auto-error-log.sh
for agent in analyst pm architect dev tester reviewer; do
    grep -q "auto-error-log.sh" \
        /root/.openclaw/workspace-$agent/HEARTBEAT.md \
        && echo "✅ $agent" \
        || echo "❌ $agent MISSING"
done
```

**Status**: ✅ DONE — 6/6 HEARTBEAT.md 包含 self-score-hook.sh + auto-error-log.sh

### 4.2 回归测试套件

**测试文件**: `/root/.openclaw/scripts/tests/test_self_evolution.bats`

```bash
bats /root/.openclaw/scripts/tests/test_self_evolution.bats
```

**Status**: ✅ DONE — 11/11 BATS 测试全绿
**测试文件**: `/root/.openclaw/scripts/tests/test_heartbeat_format.py`
**Status**: ✅ DONE — 4/4 Python 测试全绿

---

## 交付清单

| # | 交付物 | 位置 | 验收 |
|---|--------|------|------|
| 1 | `self-score-hook.sh` | `scripts/heartbeats/` | scores.tsv 有 rater=self 记录 |
| 2 | `auto-error-log.sh` | `scripts/heartbeats/` | HEARTBEAT.md E00x 有新条目，教训引用回填 phase 文件 |
| 3 | `delta-tracker.sh` | `scripts/heartbeats/` | analyst-evolution.sh 有 delta 记录 |
| 4 | 6 个 agent HEARTBEAT.md task_done hook | 各 workspace | self-score-hook.sh + auto-error-log.sh 并行调用 |
| 5 | BATS 回归测试 | `scripts/tests/test_self_evolution.bats` | `bats` 11/11 全绿 |
| 6 | Python 格式测试 | `scripts/tests/test_heartbeat_format.py` | pytest 4/4 全绿 |
| 7 | E2E 测试验证 | - | auto-error-log E2E 检测8种模式，备份正常 |
