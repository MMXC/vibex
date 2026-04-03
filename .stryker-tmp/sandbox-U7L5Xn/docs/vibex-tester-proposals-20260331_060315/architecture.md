# Architecture: vibex-tester-proposals-20260331_060315

**Project**: Tester 自检提案 — E2E 规范 + CI 质量 Gate + 测试报告标准化
**Agent**: architect
**Date**: 2026-03-31
**PRD**: docs/vibex-tester-proposals-20260331_060315/prd.md

---

## 1. Epic 1: E2E Playwright 规范

### 目录统一
```
vibex-fronted/
├── tests/
│   └── e2e/
│       ├── canvas/
│       │   ├── checkbox.spec.ts
│       │   ├── f11-fullscreen.spec.ts
│       │   ├── esc-cancel.spec.ts
│       │   ├── modal-dialog.spec.ts
│       │   └── drag-node.spec.ts
│       ├── homepage/
│       │   └── step-flow.spec.ts
│       └── setup.ts
├── playwright.config.ts
```

### 5 个核心 E2E 用例
| ID | 用例 | 覆盖场景 |
|----|------|---------|
| E2E-1 | F11 全屏切换 | canvas/fullscreen.spec.ts |
| E2E-2 | ESC 取消操作 | canvas/esc-cancel.spec.ts |
| E2E-3 | Checkbox 勾选确认 | canvas/checkbox.spec.ts |
| E2E-4 | Modal 对话框 | canvas/modal-dialog.spec.ts |
| E2E-5 | 节点拖拽 | canvas/drag-node.spec.ts |

### CI Blocking 配置
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ... },
    },
  ],
  // CI 中 E2E 失败则 non-blocking；但 PR 必须 green
  reporter: process.env.CI ? [['github']] : [['html']],
});
```

---

## 2. Epic 2: CI 测试质量 Gate

### Gate 机制
```yaml
# .github/workflows/ci.yml
- name: Quality Gates
  run: |
    # 1. 覆盖率 gate
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage $COVERAGE < 80%, blocking"
      exit 1
    fi

    # 2. 覆盖率下降 gate
    BASE_COVERAGE=80
    DROP=$(echo "$BASE_COVERAGE - $COVERAGE" | bc)
    if (( $(echo "$DROP > 5" | bc -l) )); then
      echo "Coverage dropped ${DROP}%, blocking"
      exit 1
    fi
```

### Slack 通知延迟 < 5min
```yaml
- name: Slack Notification
  if: failure()
  run: |
    sleep 10  # 等待 CI 稳定
    curl -X POST "$SLACK_WEBHOOK" \
      -H 'Content-type: application/json' \
      --data "{\"text\":\"CI 失败: $GITHUB_JOB\"}"
```

---

## 3. Epic 3: 测试报告标准化

### 报告模板
```typescript
// reports/test-report-template.md
# Test Report: {date}

## Summary
| 指标 | 值 |
|------|-----|
| 总用例 | {total} |
| 通过 | {passed} |
| 失败 | {failed} |
| 覆盖率 | {coverage}% |

## Failed Tests
{failures}

## Trends
{trend_chart_url}
```

### 自动化生成
```bash
# scripts/generate-test-report.sh
DATE=$(date +%Y-%m-%d)
npx jest --json > /tmp/jest-results.json
node scripts/test-report-generator.js --date $DATE --input /tmp/jest-results.json
```

---

*Architect 产出物 | 2026-03-31*
