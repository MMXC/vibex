# PRD: homepage-v4-fix-epic3-layout-test

> **项目**: homepage-v4-fix-epic3-layout-test  
> **版本**: 1.0  
> **日期**: 2026-03-22  
> **负责人**: PM Agent  
> **状态**: ✅ PRD 完成

---

## 1. 执行摘要

**背景**: Epic3 布局测试失败，根因是 Babel 解析错误（@babel/parser 无法解析某些语法），导致 257 个测试套件失败。

**目标**: 修复 Babel/Jest 配置

**关键指标**:
- 问题类型: 配置错误
- 影响范围: 257 测试套件
- 预估工时: 1h

---

## 2. Epic 拆分

### Epic 1: Babel/Jest 配置修复
**优先级**: P0 — 阻塞性问题

| Story ID | 描述 | 验收标准 | DoD |
|----------|------|----------|-----|
| ST-1.1 | 修改 jest.config.ts 排除 e2e | `expect(jest).notToRunE2E()` | `testPathIgnorePatterns` 包含 `/e2e/` |
| ST-1.2 | 升级 Babel preset 配置 | `expect(babel).toParseTSCode()` | `@babel/preset-typescript` 正确加载 |
| ST-1.3 | 验证测试运行正常 | `expect(exitCode).toBe(0)` | `npx jest` 退出码为 0 |

**DoD**:
- `jest.config.ts` 中 `testPathIgnorePatterns` 包含 `/e2e/`
- `babel.config.js` 包含 `@babel/preset-typescript`
- `npx jest` 无 Babel 解析错误

---

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC-01 | 运行 `npx jest` | 配置修改后 | 无 "Parser.parse" 错误 |
| AC-02 | 运行 `npx jest` | 配置修改后 | 退出码为 0 |
| AC-03 | 运行 `npx jest` | 配置修改后 | 无 "Cannot use import statement" 错误 |

---

## 4. 回归测试

| ID | 描述 | 预期 |
|----|------|------|
| RG-1 | 单元测试套件 | 全部通过 |
| RG-2 | Epic3 布局组件 | 渲染正常 |
| RG-3 | CI/CD 构建 | 成功 |

---

## 5. 非功能需求

- **修复时间**: < 1h
- **零风险**: 仅修改配置，不影响业务代码

---

## 6. 依赖

| 依赖 | 说明 |
|------|------|
| @babel/preset-typescript | TypeScript 解析 |
| @babel/preset-env | 环境适配 |
| @babel/preset-react | React JSX 解析 |

---

## 7. 实施计划

| 阶段 | Epic | 内容 | 工时 |
|------|------|------|------|
| Phase 1 | Epic 1 | Babel/Jest 配置修复 | 1h |

---

*PRD 完成，等待 Dev 领取修复任务*
