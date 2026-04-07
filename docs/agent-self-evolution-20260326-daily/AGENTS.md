# AGENTS.md: Agent Self-Evolution System 开发约束

**项目**: agent-self-evolution-20260326-daily
**版本**: 1.0
**日期**: 2026-03-26

---

## 1. ADR 决策清单

- [ADR-001] ✅ heartbeat-coord 主动创建（不做 agent 被动拉取）
- [ADR-002] ✅ 固定章节模板（不做自由格式）
- [ADR-003] ✅ task_manager 钩子检测虚假完成（不做事后补救）

---

## 2. 代码规范

### 2.1 自检报告必须包含 4 个固定章节
1. 今日工作统计（含具体数字）
2. 主要活动
3. 改进建议（P0/P1/P2 优先级）
4. 红线约束

### 2.2 虚假完成检测
- task_manager.update() 在状态改为 done 前必须校验文件存在性
- Git 提交日期必须匹配当日

---

## 3. 禁止事项

- ❌ 禁止在 task_manager 状态 done 前跳过文件存在性校验
- ❌ 禁止在无 Git 提交的情况下标记 done
- ❌ 禁止修改固定章节名称

---

*AGENTS.md 完成时间: 2026-03-26 09:10 UTC+8*
