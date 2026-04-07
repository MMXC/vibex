# 需求分析报告: vibex-reviewer-proposals-20260402_201318

**任务**: 需求分析：收集 reviewer 提案
**分析师**: analyst
**日期**: 2026-04-03（补分析）
**说明**: 下游 PRD/Architecture 已完成，本文档补齐 analyst 分析环节

---

## 业务场景分析

### VibeX 质量门禁现状

从 Reviewer 视角审查 Sprint 1-3 代码，识别出 4 类质量问题：

| 类别 | 核心问题 | 影响 |
|------|---------|------|
| 类型安全 | canvas-expand.spec.ts TS 错误阻塞 CI | 所有测试 CI 失败 |
| 安全漏洞 | DOMPurify XSS 风险（GHSA-v2wj-7wpq-c8vv） | 线上安全风险 |
| 代码规范 | 多 Epic 共 commit 无规范，TS strict 未启用 | 审查效率低 |
| 流程治理 | reports/ 无索引，ESLint disable 16+ 处 | 问题难以追溯 |

---

## 核心 JTBD

### JTBD 1: Reviewer 需要可靠的 CI 质量门禁
**触发**: TypeScript 错误无法被拦截，导致带 TS 错误的代码进入 main
**对应**: E1-S2 ESLint 门禁

### JTBD 2: Reviewer 需要可追溯的审查记录
**触发**: reports/ 目录无索引，同类问题在多个 Epic 重复驳回
**对应**: E3-S3 reports/INDEX.md

### JTBD 3: Reviewer 需要明确的 commit 规范
**触发**: 多 Epic 共 commit 边界不清，Reviewer 不知道审多少遍
**对应**: E3-S1 AGENTS.md 多 Epic 约定

### JTBD 4: Reviewer 需要标准化的安全扫描
**触发**: DOMPurify XSS 漏洞无追踪，npm audit 未集成 CI
**对应**: E2 安全漏洞监控

---

## 方案评估

### 方案 A: 全量落地（推荐）

| Epic | 内容 | 工时 |
|------|------|------|
| E1（P0） | TS错误修复 + ESLint门禁 + npm audit | 4h |
| E2（P0） | XSS漏洞追踪 + 安全监控 | 2h |
| E3（P1） | 多Epic约定 + TS严格 + INDEX索引 | 3h |
| E4（P2） | commit-msg hook + 覆盖率门禁 | 3h |

**总工时**: ~12h（可在 Sprint 内完成）

### 方案 B: 仅 P0 hotfix

只做 E1-S1（TS错误修复）+ E2（安全），不做流程规范。

**缺点**: TS strict、INDEX 等结构性缺陷仍存在

---

## 风险矩阵

| 风险 | 影响 | 缓解 |
|------|------|------|
| TS 严格模式导致新错误爆发 | 中 | 分阶段引入，先只开启关键规则 |
| commit-msg hook 影响现有提交 | 低 | husky 仅拦截未来 commit |

---

## 验收标准

- [ ] `npm run build` 零 TS error
- [ ] `npm run lint` 在 PR 阶段阻断不符合规范的提交
- [ ] `npm audit --audit-level=moderate` 失败时 CI 阻断
- [ ] `reports/INDEX.md` 索引包含最近 10 份审查报告
- [ ] AGENTS.md 包含多 Epic 共 commit 约定
- [ ] DOMPurify XSS 漏洞 CHANGELOG 有记录

---

## 与其他 Agent 提案的关系

| 其他提案 | 关联 | 说明 |
|---------|------|------|
| Dev D-001 TS清理 | 完全一致 | 同一问题的不同视角 |
| Architect A-TS | 承接 | E3-S2 TS严格模式是 A-TS 的前置条件 |
| Reviewer R-Script | 承接 | E3-S1 AGENTS.md 约定是 R-Script 的基础 |
