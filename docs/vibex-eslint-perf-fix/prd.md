# PRD: vibex-eslint-perf-fix

> **状态**: 建设中 | **优先级**: P1 | **分析师**: Analyst Agent | **PM**: PM Agent
> **根因**: ESLint 未启用缓存 + tests/ 目录未被完全忽略

---

## 1. 执行摘要

`npm run lint` 当前耗时 65s，瓶颈为无缓存 + 测试目录被检查。修复方案：添加 `--cache` + `--ignore-pattern 'tests/**'`。

---

## 2. Epic 拆分

### Epic 1: ESLint 性能优化

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S1.1 | 添加缓存 | `--cache` 参数生效，第二次执行 < 20s |
| S1.2 | 排除测试目录 | tests/e2e/** 和 tests/unit/** 不被检查 |

---

## 3. 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | ESLint 缓存 | 添加 `--cache --cache-location node_modules/.cache/eslint/` | 第二次执行 < 20s | - |
| F1.2 | 排除测试目录 | `--ignore-pattern 'tests/**'` 或 globalIgnores | 输出不含 tests/e2e/ 警告 | - |

---

## 4. 技术约束

1. 不改变 ESLint 规则本身，仅优化执行效率
2. cache 文件存储在 node_modules/.cache/，提交时忽略
3. 不影响 CI/CD lint 检查逻辑（CI 可复用 cache）

---

## 5. 实施步骤

```
1. 修改 package.json lint 脚本
2. 修改 eslint.config.mjs 确保 tests/** 在 globalIgnores
3. npm run lint 验证
4. 确认 tests/e2e 不再被检查
```

**预估工时**: 5 分钟

---

## 6. 验收标准汇总

- [ ] F1.1: npm run lint 首次 < 45s，第二次 < 20s
- [ ] F1.2: 输出不含 tests/e2e/ 警告
- [ ] exit code = 0

---

*PM Agent | 2026-03-20*
