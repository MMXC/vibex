# Epic 3: E2E 测试稳定性加固 — Spec

**Epic ID**: E3
**优先级**: P0
**工时**: 3h
**页面集成**: CI/CD pipeline / Playwright 配置

---

## 功能点列表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|-------|------|---------|---------|
| E3-S1 | 修复 TypeScript 配置 | 修复 tsconfig include 路径缺失；`tsc --noEmit` 确认 0 错误 | `expect(execSync('npx tsc --noEmit').status).toBe(0)` | tsconfig.json |
| E3-S2 | 替换 waitForTimeout | 将所有 `waitForTimeout` 替换为 Playwright 条件等待 | `expect(sourceCode.match(/waitForTimeout/g)).toBeNull()` | 所有 E2E 测试文件 |
| E3-S3 | 稳定关键选择器 | 替换不稳定选择器为 data-testid；添加等待条件 | `expect(unstableSelectors.length).toBe(0)` | E2E 测试文件 |
| E3-S4 | 验证 CI 通过率 | 连续 3 次 CI 运行全部通过 | `expect(ciRuns.filter(r => r.status === 'passed').length).toBeGreaterThanOrEqual(3)` | CI/CD |

---

## 详细验收条件

### E3-S1: 修复 TypeScript 配置

- [ ] `tsconfig.json` include 路径包含 `src/**` 和 `tests/**`
- [ ] `npx tsc --noEmit` 返回 0 错误
- [ ] 修复前：9 个 TS 错误 → 修复后：0 错误

### E3-S2: 替换 waitForTimeout

- [ ] `grep -r "waitForTimeout" tests/` 返回 0 结果
- [ ] 所有异步等待改用 Playwright 条件等待：
  - `await page.waitForSelector('.tree-node', { state: 'visible' })`
  - `await page.waitForResponse('**/api/**')`
  - `await expect(locator).toBeVisible()`
- [ ] E2E 测试执行时间不显著增加（增加 < 20%）

### E3-S3: 稳定关键选择器

- [ ] 所有关键交互元素有 `data-testid` 属性
- [ ] 选择器优先级：`data-testid` > `role` > `text` > `CSS selector`
- [ ] 无 `nth=0` 等脆弱选择器
- [ ] `expect(testFlakinessRate).toBeLessThan(5)`（5% 以下 flaky 率）

### E3-S4: 验证 CI 通过率

- [ ] CI E2E 测试连续 3 次通过
- [ ] `expect(ciPassRate).toBeGreaterThanOrEqual(95)`

---

## 实现注意事项

1. **条件等待优先**：始终用条件等待代替固定延时
2. **选择器稳健性**：优先使用语义选择器（role / text），避免 CSS 路径
3. **CI 环境隔离**：确保 CI 环境与本地环境一致（Node 版本、Playwright 版本）
