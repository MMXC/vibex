# Spec: E6 - Bundle 审计 + Dynamic Import 规格

## E6.1 Bundle 审计规范

```typescript
// E6.1.1 审计命令
// 前端 bundle 分析
npx bundlephobia-cli --json --dir .next/static/chunks

// 或使用 webpack-bundle-analyzer
npx webpack-bundle-analyzer .next/stats.json

// 识别 > 200KB 的直接依赖
interface BundleReport {
  dependencies: Array<{
    name: string;
    size: number; // bytes
    isDirect: boolean;
  }>;
  targets: Array<{ name: string; size: number }>; // > 200KB
}
```

## E6.2 Dynamic Import 规范

```typescript
// E6.2.1 Dynamic import 模式
// 组件层面
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

// E6.2.2 Dynamic import 目标（示例）
const DYNAMIC_IMPORTS = [
  { path: '@/components/canvas/ReactFlowEditor', currentSize: 245000 },
  { path: '@/components/charts/AnalyticsDashboard', currentSize: 312000 },
  { path: '@/components/mermaid/MermaidRenderer', currentSize: 189000 }, // 临界
  { path: '@/lib/d3', currentSize: 420000 },
  { path: '@/components/prototype/PrototypeBuilder', currentSize: 267000 },
];

// E6.2.3 Fallback UI
const FALLBACK_COMPONENT = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="dynamic-import-fallback">
    <p>组件加载失败</p>
    <button onClick={retry}>重新加载</button>
  </div>
);
```

## E6.3 CI 阈值配置

```json
// size-limit.config.json
{
  "limits": [
    {
      "path": ".next/static/chunks/pages/**/*.js",
      "limit": "500 kB",
      "baseline": "baseline-20260414.json"
    },
    {
      "path": ".next/static/chunks/app/**/*.js",
      "limit": "300 kB",
      "baseline": "baseline-20260414.json"
    }
  ]
}
```

## E6.4 首屏性能验收

```typescript
// E6.2.2 Lighthouse CI
// .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "total-blocking-time": ["warn", { maxNumericValue: 200 }]
      }
    }
  }
}
```

## E6.5 Bundle 基线记录

```json
// baseline-20260414.json
{
  "date": "2026-04-14",
  "totalSizeKB": 1247,
  "chunks": {
    "pages/index": 89,
    "pages/canvas": 456,
    "pages/dashboard": 234,
    "lib/vendor": 312
  },
  "largeDeps": [
    { "name": "d3", "size": 420 },
    { "name": "reactflow", "size": 312 },
    { "name": "mermaid", "size": 189 }
  ]
}
```
