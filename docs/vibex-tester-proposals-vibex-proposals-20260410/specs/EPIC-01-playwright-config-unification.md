# Epic 1: Playwright 配置统一与 CI 修复

**Epic ID**: E1
**项目**: vibex-tester-proposals-vibex-proposals-20260410
**概述**: 消除 Playwright 双重配置冲突，建立单一配置源，确保 CI 使用根配置

---

## 1. 背景

项目存在两个 Playwright 配置文件：
- `vibex-fronted/playwright.config.ts`（根配置）：expect timeout = 30000ms，无 grepInvert
- `vibex-fronted/tests/e2e/playwright.config.ts`（内部配置）：expect timeout = 10000ms，有 `grepInvert: /@ci-blocking/`

CI workflow 使用内部配置，导致：timeout 不符合标准、核心用户流程测试被跳过。

## 2. 范围

### 2.1 包含
- 合并两个配置文件的 webServer、grepInvert 等配置项
- 删除 tests/e2e/playwright.config.ts
- 修改 CI workflow 使用根配置
- 验证 CI 使用 expect timeout = 30000ms

### 2.2 不包含
- stability.spec.ts 路径修复（Epic 2）
- MSW 引入
- daily-stability.md 建立

## 3. 技术方案

### 3.1 配置合并

**步骤 1**: 读取两个配置文件，识别差异：
```bash
cat vibex-fronted/playwright.config.ts
cat vibex-fronted/tests/e2e/playwright.config.ts
```

**步骤 2**: 将 tests/e2e/playwright.config.ts 中根配置缺失的字段合并到根配置：
- `webServer`（如果根配置没有）
- `grepInvert: undefined`（显式设置为 undefined，与根配置一致）
- `use: { ... }` 中的额外配置项

**步骤 3**: 验证根配置完整性（合并后 CI 能正常运行）

### 3.2 CI workflow 修改

`.github/workflows/test.yml` 中的 E2E job：
```yaml
# 修改前
- name: E2E Tests
  run: cd vibex-fronted && pnpm run test:e2e:ci

# 修改后
- name: E2E Tests
  run: |
    cd vibex-fronted
    npx playwright test --config=playwright.config.ts
```
（不再调用 tests/e2e/playwright.config.ts）

### 3.3 配置验证

修改后验证：
```bash
# 验证配置无冲突
CI=true npx playwright test --list 2>/dev/null | grep "·" | wc -l
# 应 >= 50

# 验证 expect timeout
grep -A1 "expect:" vibex-fronted/playwright.config.ts
# timeout: 30000
```

## 4. 验收标准

| Story | 验收条件 | 验证命令 |
|-------|---------|---------|
| S1.1 | tests/e2e/playwright.config.ts 不存在 | `test -f vibex-fronted/tests/e2e/playwright.config.ts && echo "FAIL" \|\| echo "PASS"` |
| S1.1 | 根配置包含 webServer | `grep "webServer" vibex-fronted/playwright.config.ts` |
| S1.1 | CI workflow 使用根配置 | `grep "tests/e2e/playwright.config.ts" .github/workflows/test.yml` 应无输出 |
| S1.2 | grepInvert 不存在 | `grep "grepInvert" vibex-fronted/playwright.config.ts` 应无输出 |
| S1.3 | expect timeout = 30000 | `grep "timeout:" vibex-fronted/playwright.config.ts` |

## 5. 预期文件变更

```
# 删除
vibex-fronted/tests/e2e/playwright.config.ts

# 修改
vibex-fronted/playwright.config.ts         # 合并配置项
vibex-fronted/.github/workflows/test.yml    # CI 使用根配置
```

## 6. 测试策略

- **本地验证**: 在删除内部配置前，在本地运行 `npx playwright test --config=playwright.config.ts` 确认所有测试正常发现
- **CI 验证**: PR 合并后，观察 GitHub Actions E2E job 是否正常（无配置加载错误）

## 7. 依赖

- 无外部依赖
- 风险: 本地开发体验可能受影响（需验证根配置包含所有必要的 devServer 配置）
