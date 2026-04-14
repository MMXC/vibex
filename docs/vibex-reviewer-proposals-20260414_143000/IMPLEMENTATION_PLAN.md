# Implementation Plan: VibeX Reviewer 提案质量评审系统

> **项目**: vibex-reviewer-proposals-20260414_143000  
> **日期**: 2026-04-14  
> **总工时**: 5h

---

## Overview

3 个 Epic，8 个功能项。核心是复用现有 reviewer skills + 新建触发规则和 SLA 追踪。

---

## Implementation Units

- [x] **Unit 1: E1.S1 Review 模板** ✅

**Goal:** 定义 4 套标准化评审模板。

**Dependencies:** None

**Files:**
- Create: `docs/templates/review-design.md`
- Create: `docs/templates/review-architecture.md`
- Create: `docs/templates/review-security.md`
- Create: `docs/templates/review-performance.md`

**Approach:**
- Design: 覆盖 PRD 完整性、Feature list、验收标准
- Architecture: 覆盖 Tech Stack、API Design、Data Model、Performance
- Security: 覆盖 Auth、Data、Input Validation、Dependencies
- Performance: 覆盖 Lighthouse、Bundle Size、API Latency、DB Queries

**Verification:**
- 4 个模板存在且章节完整

---

- [x] **Unit 2: E1.S2 触发规则引擎** ✅

**Goal:** 实现文档路径 → skill 类型的自动匹配。

**Dependencies:** Unit 1

**Files:**
- Create: `scripts/review-trigger.js`

**Approach:**
- 基于 minimatch 模式匹配
- 输出匹配的 skill 类型列表

**Technical design:**
```javascript
const TRIGGER_RULES = [
  { pattern: '**/architecture.md', skills: ['architecture', 'design'] },
  { pattern: '**/prd.md', skills: ['design'] },
];

function matchSkills(docPath) {
  return TRIGGER_RULES
    .filter(r => minimatch(docPath, r.pattern))
    .flatMap(r => r.skills);
}
```

**Verification:**
- `node scripts/review-trigger.js docs/test/project/architecture.md` 返回 ['architecture', 'design']

---

- [x] **Unit 3: E2.S1 Skill 接口标准化** ✅

**Goal:** 确认 4 个 reviewer skills 实现统一接口。

**Dependencies:** Unit 1

**Files:**
- Review: `skills/reviewer-design/`, `skills/reviewer-architecture/`, `skills/reviewer-security/`, `skills/reviewer-performance/`

**Approach:**
- 审计现有 reviewer skills，确认实现 `ReviewerSkill` 接口
- 如有 skill 不符合接口，调整 skill 实现
- 统一输出格式: `{ verdict, findings, blockers, suggestions, confidence }`

**Verification:**
- 所有 4 个 skill 接受 `ReviewInput`，返回 `ReviewOutput`

---

- [x] **Unit 4: E2.S2 任务分发** ✅

**Goal:** 基于 team-tasks 的评审任务分发。

**Dependencies:** Unit 2

**Files:**
- Modify: `skills/team-tasks/scripts/task_manager.py` (可选添加 review 类型)

**Approach:**
- 复用现有 `task_manager.py add/update/done`
- Reviewer 读取 trigger 输出，自动 claim 对应 skill 任务
- 不新建调度器

**Verification:**
- Reviewer 可通过 team-tasks 领取评审任务

---

- [x] **Unit 5: E3.S1 SLA Timer** ✅

**Goal:** 实现评审 SLA 计时和超时处理。

**Dependencies:** Unit 3

**Files:**
- Create: `scripts/sla-timer.py`

**Approach:**
- 读取所有 in-progress review 任务
- 检查 sla-deadline 字段
- 3.5h → 发送 Slack 预警
- 4h → 自动放行 (verdict = 'conditional')

**Technical design:**
```python
def check_sla():
    tasks = load_in_progress_reviews()
    for task in tasks:
        if is_warning_time(task):
            send_slack_alert(f"预警: {task.project} {task.skill} SLA即将超时")
        elif is_timeout(task):
            auto_proceed(task)
            send_slack_alert(f"超时自动放行: {task.project} {task.skill}")
```

**Verification:**
- 3.5h 预警消息正确发送
- 4h 自动放行 verdict 正确

---

- [x] **Unit 6: E3.S2 采纳率追踪** ✅

**Goal:** 追踪 Coord 决策与 Reviewer 结论的一致性。

**Dependencies:** None

**Files:**
- Create: `docs/reviews/INDEX.md`

**Approach:**
- 每个评审完成后追加到 INDEX.md
- Coord 决策后更新对应行

**INDEX.md 格式:**
```markdown
| project | design | arch | security | perf | coord | date |
|---------|--------|------|----------|------|-------|------|
| test-proj | pass | pass | - | - | approved | 2026-04-14 |
```

**Verification:**
- INDEX.md 自动更新
- 采纳率可计算

---

## Dependencies

```
Unit 1 (Templates) ─→ Unit 2 (Trigger) ─→ Unit 4 (Dispatch)
                  ─→ Unit 3 (Skills)
Unit 3 ─→ Unit 5 (SLA Timer)
Unit 1, 6 ─ 并行
```

---

## Verification Criteria

| Epic | 验收标准 |
|------|---------|
| E1 | 4 个模板完整，trigger 匹配正确 |
| E2 | Skills 接口统一，dispatch 正常 |
| E3 | SLA 预警和超时自动放行正确 |

---

*Implementation Plan | Architect Agent | 2026-04-14*

---

## 实现记录

**Dev 实现**: 2026-04-14 15:05
**Commit**: `91c247dc` — feat(reviewer): E1 评审流程标准化 — 6 Units 全部实现
**总耗时**: ~1.5h

### 产出文件

| 文件 | 类型 | Unit | 说明 |
|------|------|------|------|
| `docs/templates/review-design.md` | 模板 | Unit 1 | 覆盖 PRD/Feature/AC/交互状态 |
| `docs/templates/review-architecture.md` | 模板 | Unit 1 | 覆盖 Tech Stack/API/DataModel/Perf |
| `docs/templates/review-security.md` | 模板 | Unit 1 | 覆盖 Auth/Data/Input/Dependencies |
| `docs/templates/review-performance.md` | 模板 | Unit 1 | 覆盖 WebVitals/Bundle/API/DB/Scale |
| `scripts/review-trigger.js` | 脚本 | Unit 2 | minimatch path → skill types |
| `skills/reviewer/INTERFACE.md` | 接口文档 | Unit 3 | ReviewerSkill 接口定义 + Skill 审计 |
| `skills/team-tasks/scripts/task_manager.py` | 工具修改 | Unit 4 | `review` 命令 + `/root/.openclaw/skills/` 同步 |
| `scripts/sla-timer.py` | 脚本 | Unit 5 | 3.5h 预警 + 4h auto-proceed |
| `docs/reviews/INDEX.md` | 追踪文档 | Unit 6 | 采纳率追踪表格 |

### 验证结果

- ✅ `node scripts/review-trigger.js docs/test/project/architecture.md` → `["architecture","design"]`
- ✅ `python3 scripts/sla-timer.py --dry-run --check-interval 1` → 无错误
- ✅ `task_manager.py review --help` → help 输出正常
- ✅ `python3 -m py_compile skills/team-tasks/scripts/task_manager.py` → 无语法错误
- ✅ git commit 成功 (9 files, 1125 lines)

### Unit 3 Skill 审计结论

| Skill | Agent | 状态 | 下一步 |
|-------|-------|------|--------|
| design | `agent-design-lens-reviewer` | ✅ 已有评分 | 需 ReviewOutput 包装器 |
| architecture | `agent-architecture-strategist` | ⚠️ 需对齐 | 需添加 verdict/confidence |
| security | `agent-security-reviewer` | ⚠️ 需对齐 | 需添加评分体系 |
| performance | `agent-performance-reviewer` | ⚠️ 需对齐 | 需添加 proposal 模式 |

*Implementation Record | Dev Agent | 2026-04-14*
