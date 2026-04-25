# S9 Epic 5 Spec: Canvas 性能优化

## 概述

Canvas 三树渲染无性能基线，节点数增长时存在卡顿风险。

---

## F5.1 性能基线建立

### 描述
建立 Lighthouse Performance 基线数据，用于后续回归对比。

### 执行步骤
1. `npx lighthouse https://vibex.top/canvas --output json --output-path reports/lighthouse-baseline.json`
2. 存档到 `reports/lighthouse-baseline.json`
3. 记录 `categories.performance.score` 作为基线值

### DoD
- [ ] `reports/lighthouse-baseline.json` 存在且可解析
- [ ] 基线 score > 0

---

## F5.2 三树渲染优化

### 描述
优化后节点数 100 时 FPS ≥ 30，三树切换 < 200ms。

### 优化方向（待 Profiler 确认）
- React Profiler 定位重渲染节点
- `React.memo` + `useMemo` 减少不必要渲染
- 三树切换时懒加载次要数据
- 虚拟化列表（`react-window`）处理大节点集

### DoD
- [ ] 节点数 100 时 FPS ≥ 30
- [ ] 三树切换延迟 < 200ms
- [ ] Lighthouse Performance 分数不劣化（基线 -5% 以内）
- [ ] Lighthouse 基线报告存档
