# Spec — DDS Canvas 加载态（Loading State）

**文件**: `spec-dds-canvas-loading-state.md`
**组件**: DDSCanvasPage / DDSScrollContainer
**Epic**: Epic 5 — S5.1
**状态**: 进行中

---

## 1. 原则

加载时**必须使用骨架屏**，禁止使用 loading spinner / 转圈 / loading 文字。任何情况下 spinner 只作为次级辅助（如下拉刷新），主加载态必须是骨架屏。

---

## 2. 骨架屏规格

### 2.1 整体页面加载骨架

**触发条件**: `pageState === 'loading'`

**DOM 结构**:
```html
<div data-testid="dds-loading-skeleton">
  <!-- Toolbar 骨架 -->
  <div class="skeleton-toolbar">
    <div class="skeleton-pill"></div>  <!-- 章节标签 -->
    <div class="skeleton-pill"></div>
    <div class="skeleton-pill"></div>
    <div class="skeleton-button"></div>  <!-- AI 草稿按钮 -->
  </div>

  <!-- 3 个章节面板骨架 -->
  <div class="skeleton-chapters">
    <div class="skeleton-panel" data-chapter="requirement">
      <div class="skeleton-header"></div>  <!-- 章节标题 -->
      <div class="skeleton-cards">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>
    <div class="skeleton-panel" data-chapter="context">
      <div class="skeleton-header"></div>
      <div class="skeleton-cards">
        <div class="skeleton-card"></div>
      </div>
    </div>
    <div class="skeleton-panel" data-chapter="flow">
      <div class="skeleton-header"></div>
      <div class="skeleton-cards">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>
  </div>
</div>
```

**骨架元素样式**:

| 元素 | 尺寸 | 圆角 | 背景动画 |
|------|------|------|---------|
| skeleton-pill | 60px × 28px | 14px | shimmer 从左到右 1.5s |
| skeleton-button | 100px × 32px | 6px | shimmer |
| skeleton-header | 120px × 20px | 4px | shimmer |
| skeleton-card | 280px × 160px | 8px | shimmer |
| skeleton-panel | min-height: 400px, flex: 1 | 0 | 无 |

**Shimmer 动画规格**:
```css
@keyframes skeleton-shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton-element {
  background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
  background-size: 800px 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}
```

**骨架卡片数量规则**:
- 每个章节随机显示 1~4 个骨架卡片
- 使用 deterministic seed（如基于章节 index），避免每次刷新数量跳动

### 2.2 局部刷新骨架（单章节）

**触发条件**: 单章节重新加载（如点击重试后仅刷新当前章节）

**表现**: 仅当前章节显示骨架，其他章节正常展示已有内容

```html
<div class="skeleton-panel" data-chapter="context" data-loading="true">
  <!-- 章节标题保留 -->
  <div class="skeleton-header"></div>
  <!-- 内容区域替换为骨架 -->
  <div class="skeleton-cards">
    <div class="skeleton-card"></div>
  </div>
</div>
```

---

## 3. Toolbar 加载态

**规格**:
- Toolbar 本身不骨架，固定显示（Toolbar 是导航锚点）
- 当前章节标签在加载时显示 skeleton-pill 动画
- AI 草稿按钮保持可用（加载期间仍可触发 AI 操作）

---

## 4. 与错误态的区分

| 条件 | 展示 |
|------|------|
| `pageState === 'loading'` | 骨架屏 |
| `pageState === 'error'` | 错误态组件（见 spec-error-state） |
| `pageState === 'ready'` | 实际内容 |

加载骨架和错误态**互斥**，不同时出现。

---

## 5. 验收标准

```typescript
// 骨架屏可见
expect(document.querySelector('[data-testid="dds-loading-skeleton"]')).toBeVisible();

// 3 个章节面板骨架
expect(document.querySelectorAll('.skeleton-panel').length).toBe(3);

// Toolbar 骨架
expect(document.querySelector('.skeleton-toolbar')).toBeVisible();

// 无 spinner
expect(document.querySelector('.loading-spinner')).toBeNull();
expect(document.querySelector('[aria-label="加载中..."]')).toBeNull();

// 骨架消失后显示实际内容
expect(pageState).toBe('ready');
expect(document.querySelector('[data-testid="dds-loading-skeleton"]')).toBeNull();
```

---

## 6. 性能要求

- 骨架屏首次渲染时间 ≤ 100ms（骨架应在数据返回前先渲染）
- 骨架屏到内容切换无闪烁（内容透明度 0→1，300ms ease-out）

---

*PM Agent | 2026-04-17*
