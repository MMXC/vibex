# AGENTS.md: Agent 自进化工具集

**Project**: `vibex-proposals-20260322`

---

## Phase 1 (Day 1): Epic1 + Epic3

### dev
- 创建 `docs/test-quality-checklist.md`
- 将检查清单引用集成到 `skills/analysis-methods/SKILL.md` 和 `skills/code-review-checklist/SKILL.md`

### analyst
- 创建 `docs/knowledge/patterns/` 目录 + 4 个问题模式文件
- 创建 `docs/knowledge/templates/` 目录 + 3 个分析模板文件
- 填充 `_index.md` 索引

---

## Phase 2 (Day 2): Epic2

### dev
- 实现 `skills/team-tasks/scripts/log_analysis.py`
- 扩展 `task_manager.py` 增加 `log-analysis` 子命令
- 扩展 `update` 子命令增加 `--log-analysis` 选项

### tester
- 为 `log_analysis.py` 编写单元测试
- 验证 MEMORY.md 更新功能

---

## Phase 3 (Day 3): Epic4

### dev
- 修改 `scripts/heartbeats/analyst-heartbeat.sh` 增加主动扫描
- 实现 `cooldown.json` 读写逻辑
- 创建 `cooldown.json` 初始化文件

### analyst
- 验证主动扫描在真实场景工作
- 验证冷却机制（24h 不重复）

---

## Workflow

```
Phase 1 → Phase 2 → Phase 3
  (P0)      (P1)       (P2)
```

No circular dependencies. Phase order is by priority.
