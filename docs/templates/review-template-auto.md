# 审查报告自动化模板

**版本**: 2.0
**创建日期**: 2026-03-18
**维护人**: Reviewer Agent
**用途**: 标准化审查报告产出，支持自动化填充

---

## 1. 报告元数据

| 字段 | 占位符 | 说明 |
|------|---------|------|
| 项目名称 | `{{PROJECT_NAME}}` | 项目标识符 |
| 任务ID | `{{TASK_ID}}` | 具体任务名称 |
| 审查人 | `{{REVIEWER}}` | Reviewer Agent |
| 审查时间 | `{{TIMESTAMP}}` | ISO 8601 格式 |
| Commit ID | `{{COMMIT_HASH}}` | 审查对应的提交 |

---

## 2. 审查报告标准结构

```markdown
# Code Review Report

**项目**: {{PROJECT_NAME}}
**任务**: {{TASK_ID}}
**审查人**: {{REVIEWER}}
**时间**: {{TIMESTAMP}}
**Commit**: {{COMMIT_HASH}}

---

## 1. Summary

{{SUMMARY_DECISION}} - {{ONE_LINE_CONCLUSION}}

---

## 2. 实现内容

### {{FEATURE_NAME}}
- {{IMPLEMENTATION_DETAIL}}

---

## 3. 代码审查

| 检查项 | 结果 |
|--------|------|
| 文件存在 | ✅/❌ |
| 类型安全 | ✅/❌ |
| 构建验证 | ✅/❌ |
| 安全检查 | ✅/❌ |

---

## 4. Files Changed

| 文件 | 变更 |
|------|------|
| {{FILE_NAME}} | {{CHANGE_TYPE}} |

---

## 5. Security Issues

### {{ISSUE_TITLE}}
- **严重性**: {{SEVERITY}}
- **位置**: {{FILE_PATH}}:{{LINE_NUMBER}}
- **描述**: {{DESCRIPTION}}
- **修复建议**: {{SUGGESTION}}

---

## 6. Performance Issues

### {{ISSUE_TITLE}}
- **影响**: {{IMPACT}}
- **位置**: {{FILE_PATH}}:{{LINE_NUMBER}}
- **建议**: {{SUGGESTION}}

---

## 7. Code Quality

### {{ISSUE_TITLE}}
- **类型**: {{TYPE}}
- **位置**: {{FILE_PATH}}:{{LINE_NUMBER}}
- **建议**: {{SUGGESTION}}

---

## 8. Conclusion

**{{DECISION}}** {{ICON}}

{{DETAILED_CONCLUSION}}

---

**Build**: {{BUILD_STATUS}}
**Commit**: {{COMMIT_HASH}}
```

---

## 3. 决策判定规则

### 3.1 决策选项

| 决策 | 条件 |
|------|------|
| **PASSED** | ✅ 无阻塞问题<br>✅ 代码规范符合<br>✅ 安全检查通过<br>✅ 功能实现完整 |
| **CONDITIONAL PASS** | 🟡 有建议性问题但不影响交付<br>🟡 需要后续改进但非阻塞 |
| **FAILED** | 🔴 存在安全漏洞<br>🔴 阻塞性问题未修复<br>🔴 功能实现不完整 |

### 3.2 严重性评级

| 级别 | 标记 | 说明 |
|------|------|------|
| 关键 | 🔴 BLOCKER | 必须修复，否则无法合并 |
| 高 | 🟡 HIGH | 强烈建议修复 |
| 中 | 🟡 MEDIUM | 建议修复 |
| 低 | 💭 LOW/NIT | 可选优化 |

---

## 4. 检查清单 (Checklist)

### 4.1 安全检查 (Security)

- [ ] XSS 漏洞检查
- [ ] SQL 注入检查
- [ ] 命令注入检查
- [ ] 敏感信息泄露检查
- [ ] 认证/授权检查
- [ ] 依赖漏洞检查 (`npm audit`)

### 4.2 代码规范 (Code Quality)

- [ ] TypeScript 类型安全
- [ ] ESLint 检查通过
- [ ] 变量命名清晰
- [ ] 注释充分
- [ ] 代码无重复

### 4.3 性能检查 (Performance)

- [ ] 无 N+1 查询
- [ ] 无大循环阻塞
- [ ] 资源懒加载
- [ ] 缓存合理使用

### 4.4 功能检查 (Functionality)

- [ ] 构建成功 (`npm build`)
- [ ] 测试通过 (`npm test`)
- [ ] 功能符合需求

---

## 5. 自动化脚本接口

### 5.1 输入参数

```typescript
interface ReviewInput {
  project: string;
  taskId: string;
  commitHash: string;
  filesChanged: string[];
  diffContent: string;
}
```

### 5.2 输出格式

```typescript
interface ReviewOutput {
  metadata: {
    project: string;
    taskId: string;
    reviewer: string;
    timestamp: string;
    commitHash: string;
  };
  summary: {
    decision: 'PASSED' | 'CONDITIONAL PASS' | 'FAILED';
    oneLineConclusion: string;
  };
  security: {
    issues: SecurityIssue[];
  };
  performance: {
    issues: PerformanceIssue[];
  };
  codeQuality: {
    issues: CodeQualityIssue[];
  };
  conclusion: string;
}
```

### 5.3 报告生成函数

```typescript
function generateReviewReport(input: ReviewInput): string {
  const { project, taskId, commitHash, diffContent } = input;
  
  // 1. 安全检查
  const securityIssues = runSecurityScan(diffContent);
  
  // 2. 代码规范检查
  const lintResults = runLintCheck(diffContent);
  
  // 3. 性能检查
  const performanceIssues = runPerformanceScan(diffContent);
  
  // 4. 生成决策
  const decision = determineDecision(securityIssues, lintResults);
  
  // 5. 填充模板
  return fillTemplate({
    project,
    taskId,
    commitHash,
    timestamp: new Date().toISOString(),
    securityIssues,
    lintResults,
    performanceIssues,
    decision,
  });
}
```

---

## 6. 使用示例

### 6.1 手动使用

```bash
# 生成审查报告
node scripts/generate-review-report.js \
  --project vibex-button-split \
  --task review-action-buttons \
  --commit d1a666d
```

### 6.2 CI 集成

```yaml
# .github/workflows/review.yml
name: Auto Review
on: [push]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Review
        run: node scripts/generate-review-report.js
      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: review-report
          path: reports/review-*.md
```

---

## 7. 附录

### A. 常用命令

```bash
# 安全检查
npm audit

# Lint 检查
npm run lint

# 类型检查
npx tsc --noEmit

# 构建验证
npm run build
```

### B. 文件位置

| 文件 | 路径 |
|------|------|
| 审查报告输出 | `workspace-reviewer/reports/` |
| 模板文件 | `docs/templates/review-template-auto.md` |
| 自动化脚本 | `scripts/generate-review-report.js` |

---

**版本**: 2.0
**最后更新**: 2026-03-18
**维护人**: Reviewer Agent
