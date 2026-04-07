# PRD: VibeX Sprint 0 — P0 快速修复

**项目**: vibex-p0-quick-fixes
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
VibeX 前端 CI/CD 门禁因三类问题处于**阻断状态**：
1. **TypeScript 编译失败** — `npx tsc --noEmit` 失败（9 处错误集中在被污染的测试文件）
2. **ESLint 检查失败** — pre-test-check 中 ESLint 报告问题
3. **潜在安全漏洞** — DOMPurify 依赖链需审查

### 目标
在 0.5-1h 内解除 CI 门禁阻断，使 `npm run test` 全绿。

### 成功指标

| KPI | 当前 | 目标 |
|-----|------|------|
| `npx tsc --noEmit` | ❌ 9 errors | ✅ exit 0 |
| `npm run test` | ❌ ESLint fail | ✅ 全绿 |
| DOMPurify 版本 | 3.3.3 | 保持最新 |

---

## Epic 拆分

### Epic 1: TypeScript 错误修复（D-001）
**工时**: 0.25h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 恢复/删除污染的 test 文件 | 0.25h | expect(tscExitCode).toBe(0) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 污染文件处理 | tests/e2e/canvas-expand.spec.ts 恢复或删除 | expect(tscExitCode).toBe(0) | ❌ |
| F1.2 | 回归验证 | npm run build 继续通过 | expect(buildExitCode).toBe(0) | ❌ |

---

### Epic 2: ESLint 问题修复（D-002）
**工时**: 0.25h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | 运行 eslint --fix 自动修复 | 0.1h | expect(eslintIssueCount).toBeLessThanOrEqual(5) |
| E2-S2 | 手动修复剩余问题 | 0.15h | expect(eslintExitCode).toBe(0) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | eslint --fix | 自动修复可修复问题 | expect(fixedCount).toBeGreaterThan(0) | ❌ |
| F2.2 | 手动修复 | 剩余 ESLint 问题 | expect(eslintExitCode).toBe(0) | ❌ |
| F2.3 | pre-test-check 全绿 | npm run test 输出全绿 | expect(allChecksGreen).toBe(true) | ❌ |

---

### Epic 3: DOMPurify 安全审查（R-P0-2）
**工时**: 0.25h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | 确认 DOMPurify 无 CVE | 0.1h | expect(npmAuditHighCritical).toBe(0) |
| E3-S2 | 添加 overrides（如需要）| 0.15h | expect(dompurifyVersion).toMatch(/3\.[3-9]/) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | npm audit 检查 | 无 high/critical 漏洞 | expect(highCriticalCount).toBe(0) | ❌ |
| F3.2 | DOMPurify 版本 | >= 3.3.3 | expect(version).toBe('3.3.3') | ❌ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | TypeScript 错误修复 | 0.25h | P0 |
| E2 | ESLint 问题修复 | 0.25h | P0 |
| E3 | DOMPurify 安全审查 | 0.25h | P0 |
| **总计** | | **0.75h** | |

---

## Sprint 排期建议

**Sprint 0 (0.5 天)**:
- E1: 污染文件恢复/删除（0.25h）
- E2: ESLint 修复（0.25h）
- E3: DOMPurify 确认（0.25h）

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 污染蔓延其他文件 | 中 | 高 | 立即 git blame 检查 |
| DOMPurify 实际有 CVE | 低 | 高 | pnpm audit 验证 |
| 快速修复后再次污染 | 中 | 中 | 添加 git hooks |

---

## DoD (Definition of Done)

### Epic 1: TypeScript 错误修复
- [ ] `npx tsc --noEmit` exit 0
- [ ] `npm run build` 继续 exit 0（回归）
- [ ] git status 显示污染文件已处理

### Epic 2: ESLint 问题修复
- [ ] `npx eslint .` exit 0
- [ ] `npm run test` 输出全绿

### Epic 3: DOMPurify 安全审查
- [ ] `npm audit` 无 high/critical
- [ ] DOMPurify 版本 >= 3.3.3

---

## 验收标准汇总（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 执行 tsc | --noEmit | exit code = 0 |
| AC1.2 | 执行 build | npm run build | exit code = 0 |
| AC2.1 | 执行 eslint | npx eslint . | exit code = 0 |
| AC2.2 | 执行 test | npm run test | 全绿（5/5 ✅）|
| AC3.1 | 执行 audit | npm audit | high/critical = 0 |
| AC3.2 | 检查版本 | DOMPurify | >= 3.3.3 |
