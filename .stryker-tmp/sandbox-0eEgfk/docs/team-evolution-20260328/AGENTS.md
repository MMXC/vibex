# AGENTS.md — team-evolution-20260328 开发者约束

**Agent**: Architect
**Date**: 2026-03-28
**Project**: Harness Engineering 自我进化机制

---

## 角色职责

| Agent | 职责 | 关键约束 |
|-------|------|---------|
| **dev** | 实现 self-score-hook.sh / auto-error-log.sh / delta-tracker.sh | 见下方禁止事项 |
| **tester** | 编写并执行 BATS 回归测试套件 | 所有测试必须全绿才能 close PR |
| **reviewer** | 审查代码质量、安全性、向后兼容 | 不接受修改 task_manager.py 或 score.sh 签名的 PR |
| **analyst** | 验证 error pattern 覆盖率和 delta 阈值调优 | 阈值调整需数据分析支撑 |
| **pm** | 验收标准检查 | 里程碑验收见 IMPLEMENTATION_PLAN.md |
| **architect** | 架构决策记录（ADR） | 开放问题决策后更新 architecture.md |

---

## dev 开发约束

### ✅ 必须做

1. **self-score-hook.sh**:
   - 读取 `SCORING_RUBRICS.md` 确定维度权重
   - phase 文件关键词 → 维度得分的映射逻辑必须有注释
   - 评分失败 `→ exit 0`（不阻塞主流程）
   - 输出格式: `✅ self-score recorded: X.X/10 (rater=self)`

2. **auto-error-log.sh**:
   - 写入 HEARTBEAT.md 前必须先 `cp {path} {path}.bak.$(date +%s)`
   - 使用 Python3 原子写入（防止并发写入破坏格式）
   - 错误条目格式: `| E0xx | 时间 | 项目 | 模式 | 描述 | 教训 |`
   - 查重逻辑: 新条目与已有 E00x 描述相似度 > 0.7 时不新建

3. **delta-tracker.sh**:
   - 从 `scores.tsv` 读取同一 `run_tag` 的 self 和 scorer 记录
   - delta 计算: `scorer_score - self_score`
   - Slack 提醒内容必须包含: agent 名、self 分、scorer 分、delta 值、维度对比

### ❌ 禁止做

1. **不要修改** `task_manager.py` — 任何协调逻辑改动必须经过 architect + coord 审批
2. **不要修改** `score.sh` 的 `record` 函数签名 — 保持向后兼容
3. **不要在 bash 中直接 `echo >> HEARTBEAT.md`** — 必须用 Python3 原子写入
4. **不要在 self-score hook 中 `exit 1`** — 评分失败时 `exit 0` + `⚠️` 警告
5. **不要在 HEARTBEAT.md 写入时加锁** — 依赖 bash 单线程顺序执行保证

### 📁 文件路径约定

```
/root/.openclaw/
├── scripts/heartbeats/
│   ├── self-score-hook.sh      # 新建
│   ├── auto-error-log.sh      # 新建
│   └── delta-tracker.sh       # 新建
├── team-evolution/
│   ├── scores.tsv             # 追加写入（新增 delta 列）
│   └── analyst-results.tsv    # 追加写入（新增 delta-record 类型）
└── workspace-*/HEARTBEAT.md  # 各 agent workspace，task_done hook 追加
```

---

## tester 测试约束

### ✅ 必须覆盖

1. **self-score-hook.sh**:
   - 有效 phase 文件 → scores.tsv 有 rater=self 记录
   - 无效 phase 文件 → 不报错，exit 0
   - 评分计算 → 加权总分正确
   - 权限错误 → 优雅降级

2. **auto-error-log.sh**:
   - 5 种错误模式全检测（rate-limit / timeout / claim-locked / failure / inconsistent）
   - 相似错误 → 不重复创建 E00x
   - 备份文件存在性
   - HEARTBEAT.md 格式不被破坏

3. **delta-tracker.sh**:
   - self=8, scorer=6 → delta=-2
   - 只有 self 无 scorer → 优雅处理
   - delta ≥ 2 → Slack 提醒被触发
   - scores.tsv delta 列被正确追加

### 测试框架

```bash
# 运行测试
bats /root/.openclaw/scripts/tests/test_self_evolution.bats

# 覆盖率报告
coverage run -m pytest scripts/tests/test_self_evolution.py --cov
coverage report
```

---

## reviewer 审查约束

### 审查清单

- [ ] self-score-hook.sh 中评分失败不阻塞主流程
- [ ] auto-error-log.sh 使用 Python 原子写入
- [ ] delta-tracker.sh 不修改 score.sh 或 task_manager.py
- [ ] 所有新脚本有 `set -euo pipefail`
- [ ] 所有新脚本有 shebang `#!/usr/bin/env bash` 或 `#!/usr/bin/env python3`
- [ ] 没有硬编码路径（使用变量）
- [ ] BATS 测试覆盖率 > 80%
- [ ] 新增文件在 `scripts/heartbeats/` 下，不污染其他目录

### 驳回条件

- ❌ 修改了 `task_manager.py` 或 `score.sh` 的 `record` 签名
- ❌ `bash echo >> HEARTBEAT.md`（不用 Python 原子写入）
- ❌ self-score hook 中 `exit 1`（会阻塞任务完成）
- ❌ BATS 测试有任何 FAIL

---

## 错误处理策略

| 场景 | 处理方式 |
|------|---------|
| scores.tsv 无写权限 | echo 警告 + exit 0 |
| HEARTBEAT.md 无写权限 | echo 警告 + exit 0 |
| phase 文件不存在 | echo 警告 + exit 0 |
| 评分计算异常 | echo 警告 + exit 0 |
| Python 写入 HEARTBEAT.md 失败 | 保留 .bak，恢复原文件 + exit 2 |
| Slack 提醒发送失败 | 降级为日志记录，不阻塞 |

---

## 依赖关系

```
Epic 1 (self-score)          Epic 2 (error-log)          Epic 3 (delta)
     │                             │                            │
     ├── SCORING_RUBRICS.md ──────┼────────────────────────────┤
     ├── scores.tsv ──────────────┼────────────────────────────┤
     │                             │                            │
     │                             ├── HEARTBEAT.md ────────────┤
     │                             │                            │
     └── task_done hook ───────────┘                            │
                              │                                 │
                              └──────── scores.tsv ─────────────┤
                                           │                   │
                                           └── analyst-evolution.sh
```

所有三个 Epic 共享: `SCORING_RUBRICS.md`（只读）、`scores.tsv`（append only）、`HEARTBEAT.md`（append only）
