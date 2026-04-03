# Implementation Plan: Vibex Reviewer 提案落地

**项目**: vibex-reviewer-proposals-20260402_201318
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## Sprint 排期

| Sprint | Epic | 工时 | 优先级 |
|--------|------|------|--------|
| Sprint R0 | E1 | 4h | P0 |
| Sprint R1 | E2 + E3 | 8.5h | P0/P1 |
| Sprint R2 | E4 | 5h | P2 |
| **总计** | | **17.5h** | |

---

## Sprint R0: 测试质量 P0（4h）

### E1-S1: TS 错误修复（1h）
- 修复 `canvas-expand.spec.ts` TS 错误
- `npm run build` 验证

### E1-S2: ESLint CI（2h）
- `.github/workflows/ci.yml` 添加 tsc --noEmit
- PR 验证 TS error 时 CI 失败

### E1-S3: npm audit CI（1h）
- 添加 `npm audit --audit-level=moderate` 到 CI
- moderate+ 漏洞阻断 CI

---

## Sprint R1: 安全+规范（8.5h）

### E2-S1: CHANGELOG（0.5h）
- 记录 `GHSA-v2wj-7wpq-c8vv` 到 CHANGELOG

### E2-S2: 漏洞监控（2h）
- 脚本：`scripts/check-vulns.sh`
- 每 sprint 运行

### E3-S1: AGENTS.md（0.5h）
- 添加多 Epic 共 commit 规范

### E3-S2: TS 严格模式（4h）
- 启用 `@typescript-eslint/no-explicit-any`
- `as any` 减少 50%

### E3-S3: reports 索引（2h）
- 创建 `reports/INDEX.md`
- 新增报告自动追加

---

## Sprint R2: 低优先级（5h）

- E4-S1: commit-msg hook
- E4-S2: 覆盖率 CI
- E4-S3: CHANGELOG 规范

---

## 验收清单

- [ ] npm run build 0 TS error
- [ ] CI 有 tsc + eslint + npm audit 门禁
- [ ] CHANGELOG 有漏洞记录
- [ ] AGENTS.md 有共 commit 规范
- [ ] reports/INDEX.md 存在
