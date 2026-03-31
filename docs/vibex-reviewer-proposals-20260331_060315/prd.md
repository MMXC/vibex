# PRD: Reviewer 自检提案实施 — 2026-03-31

> **任务**: vibex-reviewer-proposals-20260331_060315/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **项目路径**: /root/.openclaw/vibex
> **产出物**: /root/.openclaw/vibex/docs/vibex-reviewer-proposals-20260331_060315/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | Reviewer 自检提案，3 条改进方向：报告路径规范、SOP 文档化、通知过滤 |
| **目标** | 建立标准化审查流程，提升团队协作效率 |
| **成功指标** | 报告路径统一；SOP 存在；重复通知 ≤ 2 次 |

---

## 2. Epic 拆分

### Epic 1: 自检报告路径规范化（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 规范路径文档化 | 0.5h | `expect(doc).toMatch(/workspace-\\w+\\/proposals\\/\\d{8}/);` |
| S1.2 | 各 agent 路径迁移 | 1h | `expect(allReports).toMatchPath(PATTERN);` |
| S1.3 | 路径验证脚本 | 0.5h | `expect(validateScript).toExist();` |

**DoD**: 所有自检报告位于 `/workspace-{agent}/proposals/YYYYMMDD/{agent}.md`

---

### Epic 2: 两阶段审查 SOP 文档化（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | 阶段一审查清单编写 | 1h | `expect(checklist).toHaveLength(10);` |
| S2.2 | 阶段二审查清单编写 | 1h | `expect(smokeTest).toBeDefined();` |
| S2.3 | SOP 文档化到 CLAUDE.md 或独立文件 | 1h | `expect(sop).toExist();` |

**DoD**: 新 agent 可通过阅读 SOP 独立完成审查，SOP 包含完整检查清单

---

### Epic 3: 重复通知过滤机制（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | Coord 心跳脚本增加去重逻辑 | 1h | `expect(duplicateNotifications).toBeLessThanOrEqual(2);` |
| S3.2 | 通知频率测试 | 1h | `expect(sameTaskNotificationCount).toBeLessThanOrEqual(2);` |

**DoD**: 同一任务通知 ≤ 2 次

---

## 3. 实施计划

| Epic | 工时 | 优先级 | 负责人 |
|------|------|--------|--------|
| Epic 1: 报告路径规范 | 2h | P0 | reviewer+dev |
| Epic 2: SOP 文档化 | 3h | P1 | reviewer |
| Epic 3: 通知过滤 | 2h | P1 | reviewer+coord |

**总工时**: 7h
