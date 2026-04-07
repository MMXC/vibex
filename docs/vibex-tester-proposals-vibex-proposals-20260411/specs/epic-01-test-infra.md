# Epic 1: 测试基础设施修复（CI 门禁）

**Epic ID**: E1
**项目**: vibex-tester-proposals-vibex-proposals-20260411
**优先级**: P0
**工时**: 1.75h
**关联 Features**: F1, F2, F3

---

## 1. Story 列表

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|---------|
| E1-S1 | 删除 grepInvert 配置 | 0.5h | `grepInvert` 不出现在 `tests/e2e/playwright.config.ts`；CI 运行测试数 >= 50 |
| E1-S2 | 删除双重 Playwright 配置 | 1h | `tests/e2e/playwright.config.ts` 不存在；CI 使用根配置运行；expect timeout = 30000ms |
| E1-S3 | 修复 stability.spec.ts 路径 | 0.25h | `stability.spec.ts` 能正确检测到 `waitForTimeout` 违规（> 0 条）；globSync 路径为 `tests/e2e/**/*.spec.ts` |

---

## 2. E1-S1: 删除 grepInvert 配置

### 上下文

`vibex-fronted/tests/e2e/playwright.config.ts` 第11行包含：
```ts
grepInvert: process.env.CI ? /@ci-blocking/ : undefined,
```
此配置导致 GitHub Actions CI 跳过所有带 `@ci-blocking` 标记的测试（35+ 个），CI 门禁形同虚设。

### 修改内容

**文件**: `vibex-fronted/tests/e2e/playwright.config.ts`

**方案**: 删除 `grepInvert` 行，或删除整个文件（见 E1-S2）。本次 S1 仅修改该行为 `grepInvert: undefined`。

```ts
// 修改前（第11行）:
grepInvert: process.env.CI ? /@ci-blocking/ : undefined,

// 修改后:
grepInvert: undefined,
```

### 验收标准

```ts
// 验证 grepInvert 已移除
const configContent = readFileSync('tests/e2e/playwright.config.ts', 'utf-8');
expect(configContent).not.toContain('grepInvert');
expect(configContent).not.toContain('@ci-blocking');

// 验证 CI 运行测试数 >= 50
const testCount = execSync(
  'CI=true npx playwright test --list 2>/dev/null | grep "·" | wc -l',
  { cwd: 'vibex-fronted' }
).toString().trim();
expect(Number(testCount)).toBeGreaterThanOrEqual(50);
```

---

## 3. E1-S2: 删除双重 Playwright 配置

### 上下文

项目存在两个 Playwright 配置文件：

| 配置 | 文件 | expect timeout |
|------|------|---------------|
| 根配置 | `vibex-fronted/playwright.config.ts` | 30000ms ✅ |
| 内部配置 | `vibex-fronted/tests/e2e/playwright.config.ts` | 10000ms ❌ |

CI workflow 当前运行的是内部配置（10s timeout），导致测试断言容易超时。

### 修改内容

**文件 1**: 删除 `vibex-fronted/tests/e2e/playwright.config.ts`

**文件 2**: 更新 CI workflow（`.github/workflows/e2e.yml` 或类似）
```yaml
# 修改前:
- run: npx playwright test --config=tests/e2e/playwright.config.ts

# 修改后:
- run: npx playwright test
```

### 验收标准

```ts
// 验证内部配置已删除
const configExists = existsSync('tests/e2e/playwright.config.ts');
expect(configExists).toBe(false);

// 验证 CI 使用根配置
const rootConfig = readFileSync('playwright.config.ts', 'utf-8');
expect(rootConfig).toContain('expect');
const expectMatch = rootConfig.match(/timeout:\s*(\d+)/);
expect(Number(expectMatch?.[1])).toBe(30000);

// 验证 CI 能正常运行（无配置错误）
const ciResult = execSync('CI=true npx playwright test --list 2>&1', { cwd: 'vibex-fronted' });
expect(ciResult.toString()).not.toContain('Error');
```

---

## 4. E1-S3: 修复 stability.spec.ts 路径

### 上下文

`vibex-fronted/tests/e2e/stability.spec.ts` 第7行：
```ts
const testFiles = globSync('e2e/**/*.spec.ts', { cwd: resolve(__dirname, '../..') });
```
路径 `./e2e/` 在项目中不存在（实际位置是 `tests/e2e/`），导致 glob 永远返回空数组，稳定性检查形同虚设。

### 修改内容

**文件**: `vibex-fronted/tests/e2e/stability.spec.ts`

```ts
// 修改前（第7行）:
const testFiles = globSync('e2e/**/*.spec.ts', { cwd: resolve(__dirname, '../..') });

// 修改后:
const testFiles = globSync('tests/e2e/**/*.spec.ts', { cwd: resolve(__dirname, '../..') });
```

### 验收标准

```ts
// 验证 glob 路径正确
const spec = readFileSync('tests/e2e/stability.spec.ts', 'utf-8');
expect(spec).toContain("globSync('tests/e2e/**/*.spec.ts'");

// 验证能检测到 waitForTimeout 违规（> 0 条）
const stabilityResult = execSync(
  'npx playwright test stability.spec.ts 2>&1',
  { cwd: 'vibex-fronted' }
).toString();

// 应包含 "waitForTimeout" 违规报告
expect(stabilityResult).toContain('waitForTimeout');
// violationCount 应 > 0
const violationMatch = stabilityResult.match(/(\d+)\s+waitForTimeout/);
expect(Number(violationMatch?.[1] || 0)).toBeGreaterThan(0);
```

---

## 5. CI 集成验证

修复完成后，运行以下命令验证 CI 门禁有效性：

```bash
# 1. 验证配置正确
cd vibex-fronted

# 2. 确认测试数量 >= 50
CI=true npx playwright test --list 2>/dev/null | grep "·" | wc -l

# 3. 确认 expect timeout = 30000
grep -A2 "expect" playwright.config.ts

# 4. 确认 stability 能检测到违规
npx playwright test stability.spec.ts

# 5. 确认 CI 能正常运行（dry run）
CI=true npx playwright test --grep "@smoke" --reporter=line
```
