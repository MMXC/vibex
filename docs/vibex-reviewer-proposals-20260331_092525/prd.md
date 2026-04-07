# PRD: Reviewer 自检提案 — 2026-03-31 批次2

> **任务**: vibex-reviewer-proposals-20260331_092525/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/vibex-reviewer-proposals-20260331_092525/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | Reviewer 自检提案：路径规范(P0)、SOP文档化(P1)、通知过滤(P1) |
| **目标** | 建立标准化审查流程，减少协作噪音 |
| **成功指标** | 报告路径统一；SOP 可执行；重复通知 ≤ 2 次 |

---

## 2. Epic 拆分

### Epic 1: 自检报告路径规范化（P0）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S1.1 路径规范文档化 | 0.5h | `expect(doc).toMatch(/workspace-\\w+\\/proposals\\/\\d{8}/);` |
| S1.2 各 agent 路径迁移 | 1h | `expect(allReports).toMatchPath(PATTERN);` |
| S1.3 路径验证脚本 | 0.5h | `expect(validateScript).toExist();` |

**DoD**: 所有自检报告位于 `/workspace-{agent}/proposals/YYYYMMDD/{agent}.md`

---

### Epic 2: 两阶段审查 SOP 文档化（P1）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S2.1 阶段一审查清单编写 | 1h | `expect(checklist).toHaveLength(10);` |
| S2.2 阶段二审查清单编写 | 1h | `expect(smokeTest).toBeDefined();` |
| S2.3 SOP 文档化 | 1h | `expect(sop).toExist();` |

**DoD**: 新 agent 可通过阅读 SOP 独立完成审查

---

### Epic 3: 重复通知过滤机制（P1）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S3.1 Coord 心跳去重逻辑 | 1h | `expect(duplicateNotifications).toBeLessThanOrEqual(2);` |
| S3.2 通知频率测试验证 | 1h | `expect(sameTaskNotificationCount).toBeLessThanOrEqual(2);` |

**DoD**: 同一任务通知 ≤ 2 次

---

**总工时**: 7h
