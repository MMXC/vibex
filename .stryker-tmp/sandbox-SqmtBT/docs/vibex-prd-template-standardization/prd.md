# PRD: PRD 模板标准化 — 2026-03-31

> **任务**: vibex-prd-template-standardization/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/vibex-prd-template-standardization/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | PRD 格式不统一，驳回率高（~25%），评审效率低 |
| **目标** | 统一 PRD 模板，评审时间 ≤ 10min，驳回率 ≤ 10% |
| **成功指标** | PRD 评审时间 ≤ 10min，驳回率 ≤ 10% |

---

## 2. Epic 拆分

### Epic 1: PRD 模板标准化（P2）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 统一 PRD 模板（含执行摘要/Epic拆分/验收标准/DoD） | 1h | `expect(template).toContain('执行摘要'); expect(template).toContain('验收标准');` |
| S1.2 | AGENTS.md 固化模板规范 | 0.5h | `expect(AGENTS.md).toContain('PRD_TEMPLATE');` |
| S1.3 | 模板验证脚本 | 1h | `expect(validatePrd(doc)).toBe(true);` |

**DoD**: 所有新 PRD 使用统一模板，包含执行摘要/Epic/验收标准/DoD

---

**总工时**: 2.5h
