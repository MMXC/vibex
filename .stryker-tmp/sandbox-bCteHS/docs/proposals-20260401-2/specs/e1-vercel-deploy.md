# Spec: E1 - 一键部署到 Vercel

## 概述
在导出面板增加「Deploy to Vercel」按钮，实现从原型到在线可访问 URL 的无缝体验。

## F1.1: Vercel OAuth 集成

### 规格
- 授权流程: OAuth 2.0，scopes: `deployment`, `project`
- Token 存储: 后端 session，不暴露到前端
- 刷新: Vercel Access Token 自动刷新

### 验收
```typescript
test('Vercel OAuth redirect URL is correct', () => {
  const oauthUrl = buildVercelOAuthUrl();
  expect(oauthUrl).toContain('vercel.com/oauth');
  expect(oauthUrl).toContain('client_id');
  expect(oauthUrl).toContain('scope=deployment+project');
});
```

---

## F1.2: 部署 API

### 规格
- API: `POST /api/deploy`（后端） → `POST https://api.vercel.com/v13/deployments`
- 输入: 生成的代码 zip 文件流 + team ID
- 输出: `{ url: string, id: string, status: string }`
- 超时: 60s，超过则返回错误

### 验收
```typescript
test('deploy response contains vercel.app URL', async () => {
  const response = await api.deploy({ projectId: 'test', zipData: Buffer });
  expect(response.url).toMatch(/^[a-z0-9-]+\.vercel\.app$/);
  expect(response.status).toBe('QUEUED');
});
```

---

## F1.3: 导出面板部署按钮

### 规格
- 位置: 导出面板底部，与「Download ZIP」并列
- 状态: OAuth 未授权时显示「Connect Vercel」；已授权显示「Deploy to Vercel」
- 反馈: 点击后显示 spinner，部署完成后显示 URL 可复制

### 验收
```typescript
// e1-s3 Playwright E2E
test('deploy button visible in export panel', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="export-btn"]');
  expect(page.locator('[data-testid="vercel-deploy-btn"]')).toBeVisible();
});
```

### 【需页面集成】✅

---

## F1.4: 部署状态 UI

### 规格
- 进度: spinner → "Deploying..." → URL 显示
- 时限: 60s 内出 URL，超时显示「Deploy timeout, please try again」
- 错误: API 错误显示具体信息

### 验收
```typescript
test('URL appears within 60 seconds', async ({ page }) => {
  await page.goto('/canvas/export');
  await page.click('[data-testid="vercel-deploy-btn"]');
  
  const start = Date.now();
  await page.waitForSelector('[data-testid="deploy-url"]', { timeout: 65000 });
  expect(Date.now() - start).toBeLessThan(60000);
  
  const url = await page.textContent('[data-testid="deploy-url"]');
  expect(url).toMatch(/vercel\.app/);
});
```

### 【需页面集成】✅
