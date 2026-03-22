# Implementation Plan: Agent 自进化工具集

**Project**: `vibex-proposals-20260322`

---

## Phase 1: Epic1 + Epic3 (Day 1)

### Task 1.1: Create test-quality-checklist.md ✅
**Agent**: dev
**Output**: `/root/.openclaw/vibex/docs/test-quality-checklist.md`
**Status**: DONE (2026-03-22) - 包含 Global State/Mock Isolation/Async Cleanup/Quality Criteria 四个维度

### Task 1.2: Integrate checklist into templates ✅
**Agent**: dev
**Files**: 
- `/root/.openclaw/skills/analysis-methods/SKILL.md`
- `/root/.openclaw/skills/code-review-checklist/SKILL.md`

Add reference: `本流程需参考 test-quality-checklist.md`
**Status**: DONE (2026-03-22) - 两个 SKILL.md 的 References 章节均已添加引用

```markdown
# Test Quality Checklist

## 1. Global State Management
- [ ] beforeAll 修改全局状态 → 必须有对应的 afterAll 恢复
- [ ] 使用 jest.spyOn → 需调用 .mockRestore() 或 .mockReset()

## 2. Mock Isolation
- [ ] `jest.clearAllMocks()` — 清除调用记录，保留 mock 实现
- [ ] `jest.resetAllMocks()` — 清除调用记录 + 重置实现
- [ ] `jest.restoreAllMocks()` — 恢复原始实现（推荐）

## 3. Module State Isolation
- [ ] 每个测试文件独立 setup/teardown
- [ ] 共享状态修改后必须恢复

## 4. Async Cleanup
- [ ] 未resolved 的 Promise 需在 afterAll 中 cancel
- [ ] setTimeout/setInterval 需在 afterAll 中 clear
```

### Task 1.2: Integrate checklist into templates
**Agent**: dev
**Files**: 
- `/root/.openclaw/skills/analysis-methods/SKILL.md`
- `/root/.openclaw/skills/code-review-checklist/SKILL.md`

Add reference: `本流程需参考 test-quality-checklist.md`

### Task 1.3: Create knowledge base structure
**Agent**: analyst
**Output**: `/root/.openclaw/vibex/docs/knowledge/`

```bash
mkdir -p docs/knowledge/patterns
mkdir -p docs/knowledge/templates
```

Populate with 4 patterns + 3 templates (see architecture.md §Epic3)

---

## Phase 2: Epic2 (Day 2)

### Task 2.1: Implement log_analysis.py ✅
**Agent**: dev
**Output**: `/root/.openclaw/skills/team-tasks/scripts/log_analysis.py`
**Status**: DONE (2026-03-22) - commit 701f5a4b
- `append_to_memory(project, task_id, summary, key_finding, workspace)` - 幂等追加到 MEMORY.md
- `clean_cooldown(file, ttl_seconds)` - 清理过期 cooldown 条目（支持 ISO 和 Unix 时间戳）
- CLI: `python log_analysis.py append ...` 和 `clean-cooldown ...`

### Task 2.2: Extend task_manager.py ✅
**Agent**: dev
**Status**: DONE (2026-03-22) - commit 701f5a4b
**Commands**: 
- `task_manager.py log-analysis <project> <task> --summary "..." --key-finding "..."`
- `task_manager.py update <project> <task> <status> --log-analysis`
- `task_manager.py clean-cooldown [--file FILE] [--ttl-seconds SECONDS]`

### Task 2.3: Tests for log_analysis ✅
**Agent**: dev (自测)
**Status**: DONE (2026-03-22)
**Verify**: `pytest test_log_analysis.py -v` → **13 passed**

---

## Phase 3: Epic4 (Day 3)

### Task 3.1: Enhance analyst-heartbeat.sh
**Agent**: dev
**Output**: `/root/.openclaw/scripts/heartbeats/analyst-heartbeat.sh` (修改版)

Add functions:
- `scan_for_new_issues()` — 扫描 docs/*test-fix* 无分析的目录
- `is_cooled()` — 检查 cooldown.json
- `set_cooldown()` — 写入 cooldown.json

### Task 3.2: Create cooldown.json
**Agent**: dev
**Output**: `/root/.openclaw/workspace-analyst/cooldown.json` (初始化为空对象 `{}`)

### Task 3.3: Verify active scanning
**Agent**: analyst
**Verify**: 创建测试目录后，analyst 心跳能检测到并尝试领取

---

## Dev Checklist Summary

| # | Task | Output | Phase | Status |
|---|------|--------|-------|--------|
| 1.1 | test-quality-checklist.md | docs/test-quality-checklist.md | P1 | ✅ DONE |
| 1.2 | 模板集成 | skills/*/SKILL.md 更新 | P1 | ✅ DONE |
| 1.3 | 知识库结构 | docs/knowledge/ 目录 | P1 |
| 2.1 | log_analysis.py | scripts/log_analysis.py | P2 | ✅ DONE |
| 2.2 | task_manager.py 扩展 | CLI 新命令 | P2 | ✅ DONE |
| 2.3 | Tests for log_analysis | test_log_analysis.py | P2 | ✅ DONE |
| 3.1 | analyst-heartbeat 增强 | 扫描函数 | P3 |
| 3.2 | cooldown.json | 初始化文件 | P3 |

---

## Reviewer Checklist

- [ ] 无新增外部依赖
- [ ] 冷却机制 24h 正确实现
- [ ] MEMORY.md 更新幂等（不重复追加）
- [ ] 扫描不会重复领取已有分析的问题
- [ ] 所有 CLI 工具有 --help
