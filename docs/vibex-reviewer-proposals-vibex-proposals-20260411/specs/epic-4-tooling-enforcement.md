# SPEC — Epic 4: Tooling Enforcement

**Epic ID**: EP-004  
**Epic 名称**: 工具强制约束（Tooling Enforcement）  
**所属项目**: vibex-proposals-20260411  
**优先级**: P1  
**工时**: 3h  
**依赖 Epic**: Epic 1（as any 清理完成后才能启用相关规则）

---

## 1. Overview

通过 ESLint 严格规则和 CI 强制配置，防止新的技术债务产生，将代码质量约束固化到开发流程中。

---

## 2. 文件修复清单

### S4.1 — 引入 TypeScript ESLint 严格规则

**目标文件**: `.eslintrc.json`（vibex-fronted 和 vibex-backend）

**新增规则**:
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "no-console": ["error", { "allow": ["error", "warn"] }],
    "no-empty-catch": "error",
    "eslint-comments/require-description": "error"
  }
}
```

**引入策略**（渐进式）:
1. Phase 1: 先以 `warn` 级别引入，让开发者看到存量警告
2. Phase 2: 确认无遗留问题后，将 P0 相关规则升为 `error`

**验收**: ESLint 配置文件中包含上述所有规则。

---

### S4.2 — 修复新规则产生的 lint 错误

**策略**: 修复 Phase 1 中以 warn 级别出现的错误。

**验证**:
```bash
cd vibex-fronted && npm run lint 2>&1 | grep -E "error|warning"
```

**预期结果**: 0 errors（warnings 可选处理）。

---

### S4.3 — 配置 CI 拦截

**目标文件**: `.github/workflows/ci.yml` 或对应的 CI 配置文件

**新增 job**:
```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    - name: Install dependencies
      run: npm ci
    - name: Run ESLint
      run: npm run lint
      # 失败则阻断 CI
```

**阻断条件**: ESLint 检查失败 → PR 不可合并。

**验收**: 
- CI 配置包含 lint job
- `npm run lint` 失败时 CI job 状态为 failed

---

## 3. 验收标准

| Story | 验收条件 |
|-------|---------|
| S4.1 | .eslintrc.json 包含 5 条新增规则 |
| S4.2 | `npm run lint` 在两个项目中均输出 0 errors |
| S4.3 | GitHub Actions CI 中 lint job 存在，失败时阻断 merge |
| 整体 | 新增 `as any` 或空 catch 将触发 CI 失败 |
