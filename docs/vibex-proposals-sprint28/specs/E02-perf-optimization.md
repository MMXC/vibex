# E02: Design Output 性能优化 — 详细规格

## 1. 范围

- S02.1 react-window 虚拟化列表
- S02.2 React.memo + useMemo 优化

## 2. 背景

"属性面板"在 VibeX 中对应 Canvas 三栏的 **Design Output（DDSCanvasPage）**。大型项目（>200 nodes）打开 Canvas 时卡片列表渲染卡顿。

## 3. S02.1: react-window 虚拟化

### 3.1 依赖安装
```bash
npm install react-window
npm install --save-dev @types/react-window
```

### 3.2 DDSCanvasPage 卡片列表改造
当前（非虚拟化）：
```tsx
// DDSCanvasPage.tsx
<div className="design-output-list">
  {nodes.map(node => <DesignCard key={node.id} node={node} />)}
</div>
```

改造后（虚拟化）：
```tsx
import { FixedSizeList as List } from 'react-window'

const ITEM_HEIGHT = 120  // 每个 DesignCard 高度

<List
  height={containerHeight}
  itemCount={nodes.length}
  itemSize={ITEM_HEIGHT}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <DesignCard node={nodes[index]} />
    </div>
  )}
</List>
```

### 3.3 关键约束
- `itemSize` 必须固定高度
- Container height 需要 `ResizeObserver` 动态获取
- 每行只渲染可视区域内的卡片（DOM 节点 200 → ~20）

### 3.4 验收标准（expect()）
```ts
expect(react-window imported in DDSCanvasPage)
expect(FixedSizeList renders with itemCount === nodes.length)
expect(DOM node count ~20 for 300-item list (not ~300))
expect(no visual jump during scroll)
expect(lighthouse_performance >= 85)
expect(300-node render time < 200ms (DevTools Performance tab))
```

## 4. S02.2: React.memo + useMemo

### 4.1 策略
| 组件 | 优化方式 |
|------|---------|
| DesignCard | `React.memo`（props 比较）|
| DesignCard 内容计算 | `useMemo`（避免重复计算）|
| 列表 Container | `ResizeObserver` + `useState` |

### 4.2 代码示例
```tsx
const DesignCard = React.memo(({ node }: { node: DesignNode }) => {
  const metadata = useMemo(() => parseMetadata(node.content), [node.content])
  return (
    <div className="design-card">
      <div className="card-title">{node.title}</div>
      <div className="card-meta">{metadata.summary}</div>
    </div>
  )
})
```

### 4.3 验收标准（expect()）
```ts
expect(all child components wrapped with React.memo)
expect(useMemo used for expensive computations (metadata parsing, filtering))
expect(tsc --noEmit exits 0)
expect(no regression bugs introduced by memo (re-render on prop change only))
```

## 5. 性能测试方法

### 5.1 DevTools Performance
1. 打开 DevTools → Performance
2. 录制 300-node DDSCanvasPage 加载
3. 主要脚本（Main）时间 < 200ms

### 5.2 Lighthouse CI
```bash
npm install @lhci/cli
lhci autorun
# 期望: Performance Score >= 85
```

### 5.3 内存测试
```bash
# 滚动前后对比 DOM 节点数
expect(document.querySelectorAll('.design-card').length <= 25)
```

## 6. DoD

- [ ] Lighthouse Performance Score >= 85
- [ ] 300 节点项目 DDSCanvasPage 渲染时间 < 200ms
- [ ] react-window FixedSizeList 正确工作，无滚动跳变
- [ ] 所有子组件 React.memo 未引入回归 bug
- [ ] TS 编译 0 errors
- [ ] 滚动时无视觉跳变
