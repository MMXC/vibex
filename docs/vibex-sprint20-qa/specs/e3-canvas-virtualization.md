# Spec: E3 Canvas 虚拟化

**Epic**: E3 — Canvas 虚拟化
**文件**: `src/components/ChapterPanel.tsx`（使用 `@tanstack/react-virtual`）

---

## 状态机定义

### ChapterPanel 主容器

| 状态 | 触发条件 | 视觉表现 |
|------|----------|----------|
| 理想态 | ≥ 1 个 chapter 可渲染 | 虚拟化列表，节点渐现 |
| 空状态 | 0 个 chapter（正常状态下不会出现，但需处理） | 显示引导插图+文案「暂无章节内容」 |
| 加载态 | 首次加载，数据正在获取 | 骨架屏（10 条灰色卡片等距排列） |
| 错误态 | 数据获取失败 | 错误卡片「加载失败」+ 重试按钮 |

### 虚拟化边界行为

**选中卡片跨边界保持**:
- `selectedCardSnapshot` 在节点滚出视口后仍保持
- 节点滚回视口时，高亮状态立即恢复（不重新请求）
- 跨边界选择时，视觉高亮不闪烁

### 空状态规范

**引导文案**（禁止只写「无内容」）:
- 主文案：「还没有章节」
- 副文案：「创建章节后，内容将在这里显示」

### 加载态规范（禁止转圈）

**骨架屏**:
- 10 条等高卡片（等效 estimateSize: 120px）
- 卡片内: 左侧灰色方块（图标占位）+ 右侧两条灰色横线（标题/描述占位）
- 宽度: 60%、80%、70% 交替（模拟真实内容长度）

### 错误态覆盖

| 错误类型 | 显示 |
|----------|------|
| 网络异常 | 卡片显示「无法加载章节，请检查网络」+ 重试按钮 |
| 权限不足 | 显示「无权限查看章节」 |
| 接口超时 | 显示「加载超时，请稍后重试」 |

---

## 虚拟化配置（useVirtualizer）

```typescript
const virtualizer = useVirtualizer({
  count: chapters.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 120,    // 固定值，不允许硬编码数字以外的值
  overscan: 3,               // 上下各渲染 3 个节点
});
```

**参数约束**:
- `estimateSize`: 必须为 120（与卡片实际高度一致）
- `overscan`: 必须为 3（性能与内存的平衡点）
- 禁止动态修改这两个参数（防止性能退化）

---

## 原子化规范（神技5）

**间距**: 全部使用 8 的倍数
- 卡片内 padding: 16px
- 卡片间距: 12px
- 卡片内部元素间距: 8px / 16px

**颜色 Token**:
- 卡片背景: `var(--color-bg-card)`
- 卡片选中: `var(--color-bg-selected)`
- 边框: `var(--color-border)`
- 文字: `var(--color-text-primary)` / `var(--color-text-secondary)`
- 错误: `var(--color-error)`
- 加载骨架: `#E5E7EB` → `#F3F4F6` 渐变

**禁止硬编码**: 所有颜色和间距必须使用 Token。

---

## 性能目标（E3-S2, E3-S3）

| 指标 | 目标 | 验证方式 |
|------|------|----------|
| 100 节点 P50 | < 100ms | Playwright E2E `canvas-virtualization-perf.spec.ts` |
| 150 节点 dropped frames | < 2 | Playwright performance trace |
| Overscan 边界渲染 | 上下各 3 个 | 代码审查确认 |