# Architecture: vibex-ci-test-gate

**Project**: CI 测试质量 Gate 机制
**Agent**: architect
**Date**: 2026-03-31
**Analysis**: /root/.openclaw/vibex/docs/ci-test-gate/analysis.md

---

## 1. CI Quality Gate 设计

### 1.1 覆盖率 Gate

```yaml
# .github/workflows/test.yml
- name: Coverage Check
  run: |
    pnpm test -- --coverage --coverageReporters="json-summary"
    COVERAGE=$(node -e "console.log(require('./coverage/coverage-summary.json').total.lines.pct)")
    echo "Coverage: $COVERAGE%"
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage $COVERAGE% < 80%, blocking merge"
      exit 1
    fi
```

### 1.2 覆盖率下降 Gate

```yaml
- name: Coverage Delta Check
  run: |
    BASE=80
    CURRENT=$(node -e "console.log(require('./coverage/coverage-summary.json').total.lines.pct)")
    DELTA=$(echo "$BASE - $CURRENT" | bc)
    echo "Coverage delta: ${DELTA}%"
    if (( $(echo "$DELTA > 5" | bc -l) )); then
      echo "Coverage dropped ${DELTA}% > 5%, blocking merge"
      exit 1
    fi
```

### 1.3 Slack 通知 < 5min

```yaml
- name: Slack Notification
  if: failure()
  run: |
    sleep 10
    curl -X POST "$SLACK_WEBHOOK" \
      -H 'Content-type: application/json' \
      -d "{\"text\":\"CI 失败: $GITHUB_JOB\"}"
```

---

## 2. 每日健康度报告

```bash
#!/bin/bash
# scripts/daily-test-report.sh
DATE=$(date +%Y-%m-%d)
pnpm test -- --coverage --coverageReporters="json" > /tmp/jest-results.json
COVERAGE=$(node -e "console.log(require('./coverage/coverage-summary.json').total.lines.pct)")
PASSED=$(node -e "console.log(require('/tmp/jest-results.json').numPassedTests)")
FAILED=$(node -e "console.log(require('/tmp/jest-results.json').numFailedTests)")

cat > /root/.openclaw/vibex/reports/test-report-${DATE}.md << EOF
# 测试报告: ${DATE}

| 指标 | 值 |
|------|-----|
| 覆盖率 | ${COVERAGE}% |
| 通过 | ${PASSED} |
| 失败 | ${FAILED} |
EOF
```

---

## 3. 文件变更

| 文件 | 操作 |
|------|------|
| `.github/workflows/test.yml` | 修改，增加 coverage gate |
| `scripts/daily-test-report.sh` | 新增 |

---

## 4. 阈值配置

| Gate | 阈值 | 行为 |
|------|------|------|
| 覆盖率 | ≥ 80% | block merge |
| 覆盖率下降 | ≤ 5% vs 80% | block merge |
| Slack 通知延迟 | < 5min | 告警 |

---

*Architect 产出物 | 2026-03-31*
