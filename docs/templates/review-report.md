# 评审报告 — {{project}}

> 由 reviewer-entry.sh 自动生成
> 时间: {{timestamp}}

## 基本信息

| 字段 | 值 |
|------|-----|
| **项目** | {{project}} |
| **PR/Commit** | {{commit_id}} |
| **评审者** | {{reviewer}} |
| **审查时间** | {{timestamp}} |
| **审查阶段** | {{phase}} (E1/E2/E3) |

## 执行摘要

| 阶段 | 描述 | 状态 | 详情 |
|------|------|------|------|
| E1 | 代码审查 | {{E1_status}} | [E1-code-review-summary.md](E1/E1-code-review-summary.md) |
| E2 | 测试审查 | {{E2_status}} | [E2-test-review-summary.md](E2/E2-test-review-summary.md) |
| E3 | 文档审查 | {{E3_status}} | [E3-doc-review-summary.md](E3/E3-doc-review-summary.md) |

## E1 代码审查

### 1.1 TypeScript 类型检查
- **状态**: {{E1_tsc_status}}
- **错误数**: {{E1_tsc_errors}}
- **日志**: [ts-check.log](E1/ts-check.log)

### 1.2 ESLint
- **状态**: {{E1_eslint_status}}
- **警告数**: {{E1_eslint_warnings}}
- **日志**: [eslint.log](E1/eslint.log)

### 1.3 依赖安全
- **npm audit**: {{E1_npm_audit_status}} ({{E1_npm_audit_count}} 高危漏洞)
- **gitleaks**: {{E1_gitleaks_status}} ({{E1_gitleaks_count}} 潜在泄露)
- **报告**: [npm-audit.json](E1/npm-audit.json), [gitleaks.json](E1/gitleaks.json)

## E2 测试审查

### 2.1 测试执行
- **状态**: {{E2_test_status}}
- **测试数**: {{E2_test_count}}
- **通过数**: {{E2_test_passed}}
- **失败数**: {{E2_test_failed}}
- **日志**: [test-output.log](E2/test-output.log)

### 2.2 覆盖率
| 指标 | 实际值 | 阈值 | 状态 |
|------|--------|------|------|
| 行覆盖 | {{E2_lines_pct}}% | 70% | {{E2_lines_status}} |
| 函数覆盖 | {{E2_funcs_pct}}% | 70% | {{E2_funcs_status}} |
| 分支覆盖 | {{E2_branches_pct}}% | 60% | {{E2_branches_status}} |

## E3 文档审查

### 3.1 必需文档

| 文档 | 状态 |
|------|------|
| IMPLEMENTATION_PLAN.md | {{E3_plan_status}} |
| CHANGELOG.md | {{E3_changelog_status}} |
| README.md | {{E3_readme_status}} |

### 3.2 文档质量

{{E3_doc_quality_notes}}

## 发现的问题

{{#if E1_issues}}
### E1 问题
{{#each E1_issues}}
- **[{{severity}}]** {{description}} ({{file}}:{{line}})
  - 建议: {{suggestion}}
{{/each}}
{{else}}
✅ E1 阶段未发现需修复的问题
{{/if}}

{{#if E2_issues}}
### E2 问题
{{#each E2_issues}}
- **[{{severity}}]** {{description}} ({{test_file}})
  - 建议: {{suggestion}}
{{/each}}
{{else}}
✅ E2 阶段测试全部通过
{{/if}}

## 总体结论

**评审结果**: {{overall_result}}

{{overall_notes}}

---

## 附录

- 完整 TypeScript 日志: [ts-check.log](E1/ts-check.log)
- 完整 ESLint 日志: [eslint.log](E1/eslint.log)
- npm audit 报告: [npm-audit.json](E1/npm-audit.json)
- gitleaks 报告: [gitleaks.json](E1/gitleaks.json)
- 测试输出: [test-output.log](E2/test-output.log)

*本报告由 reviewer-entry.sh 生成 | {{timestamp}}*
