# Spec: E1 Canvas 部署修复

## 问题

`/canvas` 页面源代码存在于 `src/app/canvas/` 或 `pages/canvas.tsx`，但 Vercel 部署后返回 404。

## 根因假设

1. Next.js 14 App Router：`app/canvas/page.tsx` 存在但未被 Vercel build 包含
2. 旧版 Pages Router：`pages/canvas.tsx` 存在但 `next.config.js` 缺少 `pageExtensions` 配置
3. Vercel deployment 未包含最新 build（build cache 问题）

## 排查步骤

### Step 1: 检查页面源文件
```bash
# 检查 App Router
ls -la src/app/canvas/
# 检查 Pages Router
ls -la pages/canvas.tsx
```

### Step 2: 检查 next.config.js
```bash
cat next.config.js | grep -A5 "pageExtensions"
```

### Step 3: 检查 Vercel 部署状态
```bash
vercel ls
vercel logs [deployment-url] --since=2026-03-29
```

### Step 4: 本地验证
```bash
cd /root/.openclaw/vibex
pnpm build
# 检查 .next/server/app/canvas/ 是否存在
ls -la .next/server/app/canvas/
```

## 修复方案

### 方案 A: App Router 路由问题
```javascript
// next.config.js 确认包含 app 目录
experimental: {
  appDir: true
}
```

### 方案 B: 重新触发部署
```bash
vercel --prod --force
```

## 验收标准

```typescript
// 使用 gstack browse 验证
const response = await browse.goto("https://[domain]/canvas");
expect(response.status()).toBe(200);
// 截图验证内容非 404 错误页
const screenshot = await browse.screenshot();
// expect(screenshot).toContain("canvas") // 页面包含画布相关元素
```

## 输出

- 修复 commit（若有代码变更）
- Vercel deployment URL
- gstack 截图证据
