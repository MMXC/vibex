# Epic E3 Spec: Playwright E2E 测试覆盖率提升

## 基本信息

| 字段 | 内容 |
|------|------|
| Epic ID | E3 |
| 名称 | Playwright E2E 测试覆盖率提升 |
| 优先级 | P2 |
| 状态 | 待开发 |
| 工时 | 4h |
| 对应提案 | D-002（Option A 推荐方案） |

## 背景

Jest 不支持 `navigator.sendBeacon`，debounce 计时在单元测试中无法可靠验证真实浏览器行为。auto-save 功能的 beacon 触发和版本历史面板交互缺少 E2E 覆盖，存在测试金字塔缺口。

## Story 列表

| 功能 ID | Story | 功能点 | 验收标准 | 页面集成 | 工时 | 依赖 |
|---------|-------|--------|----------|----------|------|------|
| E3-S1 | Playwright fixture 搭建与基础配置 | 完善 Playwright 配置，搭建 canvas 场景 fixture | `expect(playwrightConfig.projects).toHaveLength(2)` | 无 | 1h | 无 |
| E3-S2 | auto-save 完整流程 E2E 测试 | 测试编辑 → debounce 等待 → 保存 → 指示器更新完整链路 | `expect(saveIndicator.textContent).toContain('已保存')` | 无 | 1h | E3-S1 |
| E3-S3 | Beacon 触发场景测试 | 测试 `beforeunload` 场景下 beacon 调用被正确触发 | `expect(beaconRequest.completed).toBe(true)` | 无 | 1h | E3-S1 |
| E3-S4 | VersionHistoryPanel 交互测试 | 测试版本历史面板打开、版本切换交互 | `expect(panel.isVisible()).toBe(true)` | 【需页面集成】 | 1h | E3-S1 |

## 验收标准（完整 expect 断言）

### E3-S1

```typescript
// Playwright 配置验证
const playwrightConfig = readFile('playwright.config.ts');

expect(playwrightConfig).toContain("testDir: './tests/e2e'");
expect(playwrightConfig).toContain('projects:');
expect(playwrightConfig).toContain("use: { ...devices['Desktop Chrome'] }");
expect(playwrightConfig).toContain("use: { ...devices['iPhone 12'] }");

// 配置文件可正常解析
const configParseResult = execSync('npx playwright test --list', { encoding: 'utf-8' });
expect(configParseResult).not.toContain('error');
```

### E3-S2

```typescript
// auto-save 流程测试
test('auto-save flow: edit → debounce → save → indicator update', async ({ page }) => {
  await page.goto('/canvas/test-canvas');

  // 初始状态
  const saveIndicator = page.locator('[data-testid="save-indicator"]');
  await expect(saveIndicator).toBeVisible();

  // 初始应显示"已保存"或空闲状态
  const initialText = await saveIndicator.textContent();
  expect(['已保存', '已同步', '']).toContain(initialText?.trim());

  // 编辑内容
  const canvas = page.locator('[data-testid="canvas-editor"]');
  await canvas.click();
  await canvas.fill('test content for auto-save');

  // 保存中状态应出现（debounce 开始后）
  await expect(saveIndicator).toContainText(/保存中|saving/i);

  // 等待 debounce (1000ms) + 保存完成
  await page.waitForTimeout(2000);
  await expect(saveIndicator).toContainText(/已保存|已同步|saved/i);

  // 再次编辑，验证保存指示器再次变为"保存中"
  await canvas.fill('new content for second save');
  await expect(saveIndicator).toContainText(/保存中|saving/i);
});
```

### E3-S3

```typescript
// Beacon 触发测试
test('beacon triggered on beforeunload', async ({ page }) => {
  const beaconRequests: Request[] = [];

  await page.route('**/*', route => {
    const req = route.request();
    if (req.method() === 'POST' && req.url().includes('snapshots')) {
      beaconRequests.push(req);
    }
    route.continue();
  });

  await page.goto('/canvas/test-canvas');
  const canvas = page.locator('[data-testid="canvas-editor"]');
  await canvas.click();
  await canvas.fill('content before close');

  // 触发 beforeunload（通过 page.close()）
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('snapshots')),
    page.close()
  ]);

  // beacon 或请求被发出（可能是同步 XHR fallback）
  expect(beaconRequests.length).toBeGreaterThan(0);
});

// 验证 beacon 失败时 XHR fallback
test('XHR fallback when beacon fails', async ({ page }) => {
  // 模拟 beacon 失败
  let beaconFailed = false;
  await page.addInitScript(() => {
    const originalSendBeacon = navigator.sendBeacon;
    navigator.sendBeacon = () => { beaconFailed = true; return false; };
  });

  await page.goto('/canvas/test-canvas');
  const canvas = page.locator('[data-testid="canvas-editor"]');
  await canvas.fill('fallback test');
  await page.close();

  // 如果 beacon 返回 false，应有 XHR fallback 请求
  if (beaconFailed) {
    const xhrRequests = [];
    page.on('request', req => {
      if (req.method() === 'POST' && req.url().includes('snapshots')) {
        xhrRequests.push(req);
      }
    });
    expect(xhrRequests.length).toBeGreaterThan(0);
  }
});
```

### E3-S4

```typescript
// VersionHistoryPanel 交互测试
test('version history panel: open, list versions, switch', async ({ page }) => {
  await page.goto('/canvas/test-canvas');

  // 创建多个版本
  const canvas = page.locator('[data-testid="canvas-editor"]');
  await canvas.fill('version 1 content');
  await page.waitForTimeout(2000);

  await canvas.fill('version 2 content');
  await page.waitForTimeout(2000);

  // 打开版本历史面板
  const historyButton = page.getByRole('button', { name: /版本历史|history/i });
  await historyButton.click();

  const panel = page.getByRole('dialog');
  await expect(panel).toBeVisible();

  // 列出版本
  const versionItems = page.locator('[data-testid="version-item"]');
  await expect(versionItems).toHaveLength(2);

  // 显示版本元信息
  const firstVersion = versionItems.first();
  await expect(firstVersion.getByText(/version 1/i)).toBeVisible();
  await expect(firstVersion.getByText(/\d{4}-\d{2}-\d{2}/)).toBeVisible(); // 日期

  // 切换到第一个版本
  await firstVersion.click();

  // canvas 内容应变为 version 1 内容
  await expect(canvas).toContainText('version 1 content');

  // 面板关闭
  await expect(panel).not.toBeVisible();
});
```

## 技术规格

### 测试文件结构

```
tests/e2e/
├── auto-save/
│   ├── auto-save-flow.spec.ts      # E3-S2
│   ├── beacon-trigger.spec.ts       # E3-S3
│   └── version-history.spec.ts      # E3-S4
├── fixtures/
│   └── canvas.fixture.ts            # 共享 canvas fixture
└── playwright.config.ts
```

### 约束

- 使用 `waitForResponse` 代替硬 `waitForTimeout`，减少 flaky
- 所有测试必须在 headless 和 mobile viewport 下通过
- E2E 测试在 CI 中作为 gate，不得在 PR 中跳过

## DoD

- [ ] ≥ 4 个 Playwright E2E 测试用例通过
- [ ] E3-S2: auto-save 完整流程测试通过
- [ ] E3-S3: Beacon 触发测试通过（含 XHR fallback）
- [ ] E3-S4: VersionHistoryPanel 交互测试通过
- [ ] CI 中 E2E 通过率 > 90%
