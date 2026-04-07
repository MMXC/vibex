# Analysis: VibeX Canvas Three-Panel Expand Direction Fix

**Project**: vibex-canvas-expand-dir-20260328
**Analyst**: ANALYST
**Date**: 2026-03-28
**Status**: ✅ 分析完成

---

## 1. 问题定义

### 当前状态（代码分析）

三栏画布面板展开逻辑在 `canvasStore.ts` 的 `togglePanel` 中定义：

```typescript
// canvasStore.ts L327-346
togglePanel: (panel) => {
  // left: default → expand-right → default
  // center: default → expand-left → default
  // right: default → expand-left → default
}
```

| 面板 | 当前展开方向 | 期望展开方向 |
|------|------------|------------|
| 左侧 | 向右展开 (`expand-right`) | 向右展开 ✅ |
| 中间 | 向左展开 (`expand-left`) | 向两侧展开 ❌ |
| 右侧 | 向左展开 (`expand-left`) | 向左展开 ✅ |

**根因**：`togglePanel` 中 center 的状态机只支持单向展开（`expand-left`），没有实现向两侧展开的逻辑。

### 目标状态

- **左侧面板**：点击右侧边缘 → 向右展开（✅ 已正确）
- **中间面板**：点击左边缘 → 向左展开；点击右边缘 → 向右展开（❌ 当前只支持单向）
- **右侧面板**：点击左侧边缘 → 向左展开（✅ 已正确）

**关键需求**：中间面板需要双方向展开能力。

---

## 2. 技术方案

### 方案 A：双向状态机（推荐）

**思路**：扩展 center 的 expand 状态为 `expand-left` / `expand-right` / `default`，根据触发的边缘方向决定展开方向。

```typescript
// canvasStore.ts - togglePanel 修改
togglePanel: (panel, direction?) => {
  if (panel === 'center') {
    // direction: 'left' | 'right' - 根据触发的边缘传递
    // center: default → expand-left → default
    // center: default → expand-right → default
  }
}
```

**改动点**：
1. `togglePanel` 签名增加 `direction` 参数
2. `HoverHotzone` 传递触发的边缘方向
3. center 双向状态切换逻辑
4. CSS grid 列宽双向调整

**优点**：架构改动小，状态清晰
**缺点**：HoverHotzone 需要区分左右边缘触发

### 方案 B：独立 expand-left / expand-right toggle

**思路**：将 center 的 expand 状态从单向改为可切换的两方向。

```typescript
togglePanel: (panel) => {
  if (panel === 'center') {
    const { centerExpand } = get();
    // 双向循环：default → expand-left → expand-right → default
    // 需要区分当前应该向哪个方向展开
    const cycle = ['default', 'expand-left', 'expand-right'];
  }
}
```

**优点**：逻辑简单
**缺点**：用户需要多次点击才能切换方向

### 方案对比

| 方案 | 工作量 | 复杂度 | 用户体验 | 推荐 |
|------|--------|--------|----------|------|
| A: 双向状态机 | 4h | 中 | 好（精确控制） | ✅ |
| B: 独立 toggle | 2h | 低 | 差（需多次点击） | - |

---

## 3. JTBD 分析

| JTBD | 用户行为 | 验收条件 |
|------|----------|----------|
| JTBD-1: 展开查看左侧详情 | 悬停左面板右边缘 → 点击展开 | 左侧面板向右扩展，占 1.5fr |
| JTBD-2: 展开查看中间详情 | 悬停中间面板左/右边缘 → 点击展开 | 中间面板向对应方向扩展 |
| JTBD-3: 展开查看右侧详情 | 悬停右面板左边缘 → 点击展开 | 右侧面板向左扩展，占 1.5fr |

---

## 4. 验收标准

| ID | 验收条件 | 测试方法 |
|----|----------|----------|
| AC-1 | 点击左侧面板右边缘热区，中间/右侧列收缩，左侧列展开 | 交互测试 + 截图 |
| AC-2 | 点击中间面板左边缘热区，左侧列收缩，中间列向左展开 | 交互测试 + 截图 |
| AC-3 | 点击中间面板右边缘热区，右侧列收缩，中间列向右展开 | 交互测试 + 截图 |
| AC-4 | 点击右侧面板左边缘热区，中间/左侧列收缩，右侧列展开 | 交互测试 + 截图 |
| AC-5 | 双击热区恢复默认三等分布局 | 交互测试 |
| AC-6 | 展开动画流畅（0.3s ease） | 观察动画 |

---

## 5. 风险识别

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| HoverHotzone 需要区分左右边缘触发 | 中 | 在现有 HoverHotzone 上增加 direction prop |
| CSS grid 列宽组合爆炸 | 低 | 9 种组合均可覆盖（3 panel × 3 states） |
| 双向展开时另一侧已有内容 | 低 | grid-template-columns 支持动态计算 |
