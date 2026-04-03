# PRD: homepage-v4-fix-reviewer-aipanel-fix

> **项目**: homepage-v4-fix-reviewer-aipanel-fix  
> **版本**: 1.0  
> **日期**: 2026-03-22  
> **负责人**: PM Agent  
> **状态**: ✅ PRD 完成

---

## 1. 执行摘要

**背景**: Reviewer 审查被 tester 失败阻塞，根因是 Jest 配置错误——Jest 尝试执行 Playwright e2e 测试（ES Module 语法），导致 241 个测试套件失败。

**目标**: 修复 Jest 配置，排除 e2e 目录

**关键指标**:
- 问题类型: 配置错误
- 影响范围: 241 测试套件
- 预估工时: 1h

---

## 2. Epic 拆分

### Epic 1: Jest 配置修复
**优先级**: P0 — 阻塞审查流程

| Story ID | 描述 | 验收标准 | DoD |
|----------|------|----------|-----|
| ST-1.1 | 修改 jest.config.ts 排除 e2e | `expect(testPathIgnorePatterns).toContain('/e2e/')` | `testPathIgnorePatterns` 包含 `/e2e/` |
| ST-1.2 | 验证 Jest 运行正常 | `expect(exitCode).toBe(0)` | `npx jest` 退出码为 0 |
| ST-1.3 | 验证 e2e 测试不受影响 | Playwright 测试独立运行 | `npx playwright test` 正常 |

**DoD**:
- `jest.config.ts` 中 `testPathIgnorePatterns` 包含 `/e2e/`
- `npx jest` 退出码为 0
- Playwright 测试可独立运行

---

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC-01 | 运行 `npx jest` | 配置修改后 | 无 "Cannot use import statement" 错误 |
| AC-02 | 运行 `npx jest` | 配置修改后 | 退出码为 0 |
| AC-03 | 运行 `npx playwright test` | 配置修改后 | e2e 测试正常运行 |

---

## 4. 回归测试

| ID | 描述 | 预期 |
|----|------|------|
| RG-1 | 单元测试套件 | 全部通过 |
| RG-2 | e2e 测试套件 | 全部通过 |
| RG-3 | CI/CD 构建 | 成功 |

---

## 5. 非功能需求

- **修复时间**: < 1h
- **零风险**: 仅修改配置，不影响业务代码

---

## 6. 实施计划

| 阶段 | Epic | 内容 | 工时 |
|------|------|------|------|
| Phase 1 | Epic 1 | Jest 配置修复 | 1h |

---

*PRD 完成，等待 Dev 领取修复任务*
