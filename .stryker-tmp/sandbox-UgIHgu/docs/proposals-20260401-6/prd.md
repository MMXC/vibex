# PRD: proposals-20260401-6 — 全面收尾 + 质量加固

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

Batches 1-5 全部完成（23 Epic，~101h）。第六批聚焦：PNG/SVG 批量导出实现（B5 待实现）、代码质量审查（Batch 1-5 新增功能）、用户手册文档。

### 目标

完成遗留项 + 质量加固 + 文档完善。总工时 10h。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| PNG/SVG 导出 | 可用 | E2E 测试通过 |
| 代码质量 | TS 0 error, ESLint 0 warn | CI 报告 |
| 用户手册 | 5+ 操作说明 | 文档审查 |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 工时 | 优先级 | 产出文件 |
|------|------|------|--------|----------|
| E1 | PNG/SVG 批量导出 | 4h | P1 | specs/e1-export-format.md |
| E2 | 代码质量审查 | 4h | P1 | specs/e2-code-review.md |
| E3 | 用户手册文档 | 2h | P2 | specs/e3-user-guide.md |

**总工时**: 10h

---

### Epic 1: PNG/SVG 批量导出

**工时**: 4h | **优先级**: P1 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | PNG 导出 | 导出面板增加 PNG 选项 | `expect(exportOptions).toContain('PNG')` | 【需页面集成】 |
| F1.2 | SVG 导出 | 导出面板增加 SVG 选项 | `expect(exportOptions).toContain('SVG')` | 【需页面集成】 |
| F1.3 | 批量 zip | 全部节点导出到 zip 文件 | `expect(zipFileName).toMatch(/\.zip$/)` | 【需页面集成】 |
| F1.4 | E2E 覆盖 | Playwright 测试 PNG/SVG/zip 导出 | `expect(testPassed).toBe(true)` | ❌ |

#### DoD

- [ ] 导出面板支持 PNG/SVG 选择
- [ ] 批量导出生成 zip 文件
- [ ] E2E 测试覆盖

---

### Epic 2: 代码质量审查

**工时**: 4h | **优先级**: P1 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | TS 严格模式 | Batch 1-5 新增代码 TS 严格模式无错误 | `expect(tsErrors).toBe(0)` | ❌ |
| F2.2 | ESLint 检查 | 新增代码无 ESLint 警告 | `expect(eslintWarnings).toBe(0)` | ❌ |
| F2.3 | 键盘冲突检查 | Ctrl+G / Alt+1/2/3 无键盘冲突 | `expect(hasConflict).toBe(false)` | ❌ |
| F2.4 | 内存泄漏检查 | rAF / eventListener 有对应 cleanup | `expect(hasLeak).toBe(false)` | ❌ |
| F2.5 | reviewer 审查 | 代码审查通过 | `expect(reviewApproved).toBe(true)` | ❌ |

#### DoD

- [ ] TypeScript 0 error
- [ ] ESLint 0 warn
- [ ] reviewer 代码审查通过

---

### Epic 3: 用户手册文档

**工时**: 2h | **优先级**: P2 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | user-guide.md | `docs/user-guide.md` 存在 | `expect(exists('docs/user-guide.md')).toBe(true)` | ❌ |
| F3.2 | 核心操作说明 | 包含 5+ 核心操作（画布/导出/快捷键） | `expect(operationCount).toBeGreaterThanOrEqual(5))` | ❌ |
| F3.3 | /help 入口 | 用户可通过 /help 访问手册 | `expect(helpEndpoint.exists).toBe(true)` | 【需页面集成】 |

#### DoD

- [ ] user-guide.md 存在且 ≥ 10 章节
- [ ] 5+ 核心操作说明
- [ ] /help 入口可访问

---

## 3. 验收标准（汇总）

| Epic | expect() 断言 |
|------|--------------|
| E1 | `expect(exportOptions).toContain('PNG')` |
| E1 | `expect(zipFileName).toMatch(/\.zip$/)` |
| E2 | `expect(tsErrors).toBe(0)` |
| E2 | `expect(eslintWarnings).toBe(0)` |
| E2 | `expect(hasLeak).toBe(false)` |
| E3 | `expect(exists('docs/user-guide.md')).toBe(true)` |
| E3 | `expect(operationCount >= 5)` |

---

## 4. DoD

### 全局 DoD

1. **代码规范**: `npm run lint` 无 error
2. **TypeScript**: `npx tsc --noEmit` 0 error
3. **审查**: reviewer 代码审查通过

### Epic 专属 DoD

| Epic | 专属 DoD |
|------|----------|
| E1 | PNG/SVG 导出可用；zip 批量导出；E2E 通过 |
| E2 | TS/ESLint 全绿；内存泄漏 0；reviewer 审查通过 |
| E3 | user-guide.md 存在；5+ 操作说明；/help 可访问 |

---

## 5. 优先级矩阵

| 优先级 | Epic | 排期 |
|--------|------|------|
| P1 | E1, E2 | Sprint 6（第 1-2 天） |
| P2 | E3 | Sprint 6（第 3 天） |

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 21:05 GMT+8*
