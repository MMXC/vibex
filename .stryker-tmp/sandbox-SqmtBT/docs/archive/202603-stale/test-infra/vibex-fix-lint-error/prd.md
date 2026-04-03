# PRD: vibex-fix-lint-error

## 1. 执行摘要

| 属性 | 值 |
|------|-----|
| **项目** | vibex-fix-lint-error |
| **类型** | Bug 修复 |
| **目标** | 修复所有 lint 错误，确保 CI 构建通过 |
| **完成标准** | `npm run lint` 无 error，`npm run build` 成功 |
| **工作量** | 0.5 天 |
| **页面集成** | 【无需页面集成】构建/工具链修复 |

---

## 2. 问题陈述

项目存在 lint 错误导致 CI 构建失败，影响开发效率。错误类型包括 unused-vars、import-order、type-errors、missing-deps。

---

## 3. Epic 拆分

### Epic 1: Lint 修复执行

**Story F1.1**: 扫描并分类错误
- 运行 `npm run lint` 获取完整错误列表
- 按类型分类：unused-vars / import-order / type-errors / missing-deps
- **验收标准**:
  - `expect(exec('npm run lint 2>&1').exitCode).toBeDefined()`
  - `expect(errorList.length).toBeGreaterThanOrEqual(0)`

**Story F1.2**: 自动修复可修复项
- 使用 `npm run lint -- --fix` 自动修复
- **验收标准**:
  - `expect(exec('npm run lint -- --fix').exitCode).toBe(0)`
  - `expect(fixedCount).toBeGreaterThanOrEqual(0)`

**Story F1.3**: 手动修复剩余错误
- 修复不能自动修复的错误
- **验收标准**:
  - `expect(unusedVars.length).toBe(0)`
  - `expect(importErrors.length).toBe(0)`
  - `expect(typeErrors.length).toBe(0)`

### Epic 2: 质量保障

**Story F2.1**: 配置 pre-commit hook
- 添加 lint-staged 防止 lint 错误引入
- **验收标准**:
  - `expect(fs.existsSync('.husky/pre-commit')).toBe(true)`
  - `expect(content).toContain('lint-staged')`

**Story F2.2**: CI 验证
- 确保 `npm run build` 成功
- **验收标准**:
  - `expect(exec('npm run build').exitCode).toBe(0)`
  - `expect(exec('npm run lint').exitCode).toBe(0)`

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 执行 `npm run lint` | 扫描完成 | 输出中无 error |
| AC1.2 | 执行 `npm run build` | 构建完成 | 退出码为 0 |
| AC1.3 | 执行 `git commit` | 提交代码 | pre-commit hook 触发 |
| AC2.1 | 修复 unused-vars | 保存文件 | 变量被使用或删除 |
| AC2.2 | 修复 import-order | 保存文件 | 导入顺序符合规范 |
| AC2.3 | 修复 type-errors | 保存文件 | 类型检查通过 |

---

## 5. 非功能需求

- **可靠性**: CI 构建成功率 100%
- **性能**: Lint 检查 < 30s
- **可维护性**: 错误消息清晰易理解

---

## 6. 风险评估

| 风险 | 缓解措施 |
|------|----------|
| 修复引入新错误 | 完整测试覆盖 |
| 业务逻辑被误改 | Code Review 审核 |

---

## 7. DoD

- [ ] `npm run lint` 无 error
- [ ] `npm run build` 成功
- [ ] pre-commit hook 配置完成
- [ ] Code Review 通过
