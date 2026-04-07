# Architecture: vibex-ci-test-gate

**Project**: CI 测试质量 Gate 机制
**Agent**: coord (代写)
**Date**: 2026-03-31

---

## 1. 执行摘要

在 CI Pipeline 中增加测试质量 Gate，测试通过率 < 阈值时阻止 merge。

## 2. 技术方案

```yaml
# .github/workflows/test.yml 增加
- name: Quality Gate
  run: |
    PASS_RATE=$(npm test -- --json | jq '.numPassedTests / .numTotalTests')
    if (( $(echo "$PASS_RATE < 0.85" | bc -l) )); then
      echo "FAIL: Test pass rate $PASS_RATE < 0.85"
      exit 1
    fi
```

## 3. 修改文件

- `package.json` test script 增加 --json 输出
- `.github/workflows/test.yml` 增加 Quality Gate step
- `jest.config.ts` 调整 coverageThreshold
