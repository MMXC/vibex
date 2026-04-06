# IMPLEMENTATION_PLAN: VibeX Tester Proposals 2026-04-11

> **项目**: vibex-tester-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## Sprint 规划

| Sprint | 周期 | 内容 | 工时 |
|--------|------|------|------|
| Sprint 1 | Day 1 AM | E1: 测试基础设施修复 | 1.75h |
| Sprint 2 | Day 1 PM | E2: 新功能 E2E | 2h |
| Sprint 3 | Day 2 | E3: waitForTimeout 清理 | 4h |
| Sprint 4 | Day 3 | E4: 单元测试补充 | 2.75h |

**总工时**: 10.5h | **团队**: 1 Dev

---

## Sprint 1: 测试基础设施（1.75h）

### E1-S1: 删除 grepInvert

```bash
rm -f tests/e2e/playwright.config.ts
```

### E1-S2: 删除双重配置

```bash
rm -f tests/e2e/playwright.config.ts  # 已在 S1 完成
```

### E1-S3: 修复 stability.spec.ts

```typescript
// stability.spec.ts
const testDir = path.resolve(__dirname, '..');
const files = globSync('**/*.spec.ts', { cwd: testDir });
```

---

## Sprint 2: 新功能 E2E（2h）

### E2: flowId E2E

```typescript
test('generate-components includes valid flowId', async ({ page }) => {
  await page.fill('[data-testid="requirement-input"]', 'create a login form');
  await page.click('[data-testid="analyze-button"]');
  const flowId = await page.evaluate(() => window.__FLOW_ID__);
  expect(flowId).toMatch(/^[0-9a-f-]{36}$/);
});
```

---

## Sprint 3: waitForTimeout 清理（4h）

```bash
grep -rn "waitForTimeout" tests/e2e/ --include="*.spec.ts" | wc -l
# 输出: 87
```

逐文件替换：
- `conflict-resolution.spec.ts`: 8 处
- `conflict-dialog.spec.ts`: 6 处
- `auto-save.spec.ts`: 5 处
- 其他文件: 68 处

---

## Sprint 4: 单元测试（2.75h）

### E4: ai-service JSON 解析测试

```typescript
test('extracts JSON from markdown', () => {
  expect(extractJSON('```json\n{"id":1}\n```')).toEqual({ id: 1 });
});
```

### E4: WebSocket logger 测试

```typescript
test('WebSocket logger replaces console', () => {
  expect(logger.info).toHaveBeenCalledWith('connection_added', expect.any(Object));
});
```

---

## 验收命令

```bash
echo "=== Playwright 配置 ===" && find . -name "playwright.config.ts" | wc -l
echo "=== grepInvert ===" && grep "grepInvert" playwright.config.ts | wc -l
echo "=== waitForTimeout ===" && grep -rn "waitForTimeout" tests/e2e/ | wc -l
pnpm playwright test
pnpm vitest run
```

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
