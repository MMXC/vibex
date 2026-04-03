# Analysis: vibex-selfcheck-path-normalization

**Goal**: 规范化各 Agent 自检报告路径
**Priority**: P0
**Date**: 2026-03-31
**Analyst**: PM (补写)

---

## 1. 问题描述

各 agent 自检报告路径不统一（有的在 workspace-coord/proposals/，有的在其他位置），reviewer 审查时需要多轮猜测路径。

## 2. 根因分析

- 无统一的报告存放规范
- 各 agent 自行决定路径

## 3. 建议方案

统一路径：`/workspace-{agent}/proposals/YYYYMMDD/{agent}.md`

| 功能 | 描述 | 工时 |
|------|------|------|
| S1 | 路径规范文档化 | 0.5h |
| S2 | 迁移现有报告到统一路径 | 1h |
| S3 | 路径验证脚本 | 0.5h |

**总工时**: 2h
