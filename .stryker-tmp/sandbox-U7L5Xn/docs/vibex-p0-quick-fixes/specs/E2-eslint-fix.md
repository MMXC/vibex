# Spec: E2 - ESLint 问题修复

## 1. 概述

**工时**: 0.25h | **优先级**: P0
**依赖**: 无（可与 E1 并行）

## 2. 修复方案

### 2.1 自动修复

```bash
npx eslint . --fix --format stylish 2>&1 | head -50
```

### 2.2 手动修复剩余问题

如果 `--fix` 后仍有问题，逐个审查并修复。

### 2.3 验证

```bash
npx eslint . --format stylish 2>&1 | wc -l
# 期望: < 5 行
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E2-AC1 | 执行 eslint --fix | 自动修复 | fixedCount > 0 |
| E2-AC2 | 执行 eslint | 剩余问题 | exit code = 0 |
| E2-AC3 | 执行 test | npm run test | 全绿（5/5 ✅）|

## 4. DoD

- [ ] eslint . exit 0
- [ ] npm run test 全绿
