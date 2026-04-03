# VibeX CanvasPage 拆分 Hooks — 实施计划

**项目**: canvas-split-hooks
**版本**: v1.0
**日期**: 2026-04-03

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 待 coord 创建项目并绑定
- **执行日期**: 2026-04-03

---

## 1. Sprint 排期

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Day 1 AM | E1 useCanvasState | 3h | Hook 就绪 + 测试 |
| Day 1 PM | E2 useCanvasStore | 2h | 封装 Hook 就绪 |
| Day 2 AM | E3 useCanvasRenderer | 3h | 派生数据 Hook 就绪 |
| Day 2 PM | E4 useAIController | 4h | AI 编排 Hook 就绪 |
| Day 3 AM | E5 useCanvasEvents | 3h | 事件 Hook 就绪 |
| Day 3 PM | E6 Phase1 引Hook | 2h | 所有 Hook 引入 CanvasPage |
| Day 4 | E6 Phase2 删代码 | 2h | CanvasPage < 300 行 |

**总工时**: 19h（~4 人天）

---

## 2. 开发顺序

```
Day 1 AM（E1，可最先）
  → useCanvasState 创建
  → 提取 pan/zoom/expand
  → 单元测试 > 80% 覆盖

Day 1 PM（E2，依赖 E1）
  → useCanvasStore 创建
  → 封装各 store selectors
  → 单元测试

Day 2 AM（E3，并行 E2）
  → useCanvasRenderer 创建
  → 提取 rects/edges/treeNodes memo
  → 单元测试

Day 2 PM（E4，依赖 E1）
  → useAIController 创建
  → 提取 AI 生成 + 冲突处理
  → 单元测试

Day 3 AM（E5，依赖 E1）
  → useCanvasEvents 创建
  → 提取搜索 + 键盘事件
  → 单元测试

Day 3 PM（E6，依赖 E1-E5）
  → Phase 1: import 所有 Hook
  → 逐步替换 CanvasPage 使用点
  → 并行运行验证

Day 4（E6 续）
  → Phase 2: 注释 → 测试 → 删除旧代码
  → CanvasPage < 300 行
  → 全量回归测试
```

---

## 3. 开发约束

### 3.1 Hook 编写规范

```typescript
// ✅ 正确：导出完整接口类型
interface UseCanvasStateReturn { ... }
export function useCanvasState(): UseCanvasStateReturn { ... }

// ❌ 错误：隐式返回类型
export function useCanvasState() { ... }
```

```typescript
// ✅ 正确：handlers 对象聚合
const handlers = useMemo(() => ({
  handleZoomIn: () => setZoomLevel(z => Math.min(z * 1.2, 3)),
  handleZoomOut: () => setZoomLevel(z => Math.max(z / 1.2, 0.2)),
}), []);

// ❌ 错误：handlers 直接定义（每次渲染新建引用）
const handleZoomIn = () => setZoomLevel(...);
```

### 3.2 派生数据规范

```typescript
// ✅ 正确：所有派生数据用 useMemo
const contextNodeRects = useMemo(() =>
  contextNodes.map(n => ({ id: n.nodeId, x: n.position?.x ?? 0, y: n.position?.y ?? 0 })),
[contextNodes]);

// ❌ 错误：派生数据直接计算（每次渲染重算）
const contextNodeRects = contextNodes.map(n => ({ ... }));
```

### 3.3 重构 Phase 1 规范

```typescript
// ✅ 正确：先加 Hook，逐步替换
import { useCanvasState } from '@/hooks/canvas/useCanvasState';

// Step: 替换一个 state
const newZoomLevel = canvasState.zoomLevel;
// 保留旧逻辑对比
const oldZoomLevel = computeOldZoom();
// DEV 环境 diff 检测
if (process.env.NODE_ENV === 'development') {
  if (oldZoomLevel !== newZoomLevel) {
    console.error('[CanvasPage] zoomLevel mismatch!');
  }
}

// ❌ 错误：一次性删除旧代码
```

### 3.4 禁止事项

- ❌ 新 Hook 不得创建 Zustand store（只封装现有 store）
- ❌ 不得在 Hook 内直接修改多个 store（统一走现有 action）
- ❌ Phase 2 前不得删除 CanvasPage 旧代码

---

## 4. 验证命令

```bash
# E1-E5: 每个 Hook 独立测试
pnpm test -- --testPathPattern="useCanvasState"
pnpm test -- --testPathPattern="useAIController"

# E6: CanvasPage 行数
wc -l src/components/canvas/CanvasPage.tsx
# 期望: < 300

# E6: 无直接 store 引用
grep -c "useContextStore\|useUIStore" src/components/canvas/CanvasPage.tsx
# 期望: 0

# 全量回归
pnpm test -- --testPathPattern="canvas"
# 期望: 全部通过
```

---

*实施计划版本: v1.0 | 架构师: Architect Agent | 日期: 2026-04-03*
