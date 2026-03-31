# Spec: E5 - 质量流程改进

## 概述
建立 CI 质量门禁、测试规范、审查 SOP 和 KPI 体系。

## F5.1: Playwright E2E 测试规范

### 规格
- 目录: `e2e/`
- 命名: `<feature>.spec.ts`
- Page Object: `e2e/pages/<Page>.ts`
- CI: 每次 PR 必须通过 E2E

### 验收
```typescript
// 至少 5 个 CI-blocking 用例
const testFiles = glob.sync('e2e/**/*.spec.ts');
expect(testFiles.length).toBeGreaterThanOrEqual(5);
```

---

## F5.2: CI 测试质量 Gate

### 规格
- 覆盖率阈值: ≥ 80%
- 实现: GitHub Actions `coverage` step
- 失败: coverage < 80% 时 CI failure

### 验收
```yaml
# .github/workflows/ci.yml
- name: Check coverage
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage $COVERAGE% < 80%, failing"
      exit 1
    fi
```

---

## F5.3: 两阶段审查 SOP

### 规格
1. 开发者 → reviewer（代码质量、安全、可测试性）
2. reviewer → architect（架构一致性、技术可行性）

### 验收
```typescript
expect(sopDoc.exists).toBe(true);
expect(sopDoc.content).toContain('reviewer');
expect(sopDoc.content).toContain('architect');
```
