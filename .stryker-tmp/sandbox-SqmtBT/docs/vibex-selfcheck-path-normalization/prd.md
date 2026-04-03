# PRD: 自检报告路径规范化 — 2026-03-31

> **任务**: vibex-selfcheck-path-normalization/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/vibex-selfcheck-path-normalization/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | 各 agent 自检报告路径不统一，reviewer 审查效率低 |
| **目标** | 所有报告位于统一路径，reviewer 可从单一位置查找 |
| **成功指标** | 所有报告符合路径规范 |

---

## 2. Epic 拆分

### Epic 1: 路径规范化（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 路径规范文档化 | 0.5h | `expect(doc).toMatch(/workspace-\\w+\\/proposals\\/\\d{8}/);` |
| S1.2 | 迁移现有报告到统一路径 | 1h | `expect(allReports).toMatchPath(PATTERN);` |
| S1.3 | 路径验证脚本 | 0.5h | `expect(validateScript).toExist();` |

**DoD**: 所有报告位于 `/workspace-{agent}/proposals/YYYYMMDD/{agent}.md`

---

**总工时**: 2h
