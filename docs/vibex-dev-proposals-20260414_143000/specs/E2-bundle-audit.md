# Spec: E2 - Bundle 审计 + Dynamic Import 规格

## E2.1 Bundle 审计工具

```bash
# 使用 webpack-bundle-analyzer
npx webpack-bundle-analyzer .next/stats.json

# 或 bundlephobia
npx bundlephobia-cli --json --dir .next/static/chunks
```

## E2.2 识别大依赖（> 200KB）

```typescript
interface LargeDep {
  name: string;
  size: number; // bytes
  path: string;
}

const LARGE_DEPS_THRESHOLD = 200 * 1024; // 200KB

// 识别目标：3+ 个 > 200KB 的依赖
const targets = [
  { name: 'd3', size: 420000 },
  { name: 'reactflow', size: 312000 },
  { name: 'mermaid', size: 189000 }, // 临界
];
```

## E2.3 Dynamic Import 模式

```typescript
// 正确模式
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <ComponentSkeleton />,
  ssr: false,
});

// Fallback UI
const FALLBACK = ({ retry }: { retry: () => void }) => (
  <div className="dynamic-error">
    <p>组件加载失败</p>
    <button onClick={retry}>重新加载</button>
  </div>
);
```

## E2.4 CI Bundle Size 阈值

```json
// size-limit.config.json
{
  "limits": [
    {
      "path": ".next/static/chunks/pages/**/*.js",
      "limit": "500 kB"
    },
    {
      "path": ".next/static/chunks/app/**/*.js",
      "limit": "300 kB"
    }
  ]
}
```

## E2.5 验收测试

```typescript
// LCP 验证
test('首屏 LCP < 2.5s', async () => {
  await page.goto('/dashboard');
  const lcp = await page.evaluate(() => {
    const entries = performance.getEntriesByType('largestContentfulPaint');
    return entries[entries.length - 1]?.startTime;
  });
  expect(lcp).toBeLessThan(2500);
});
```
