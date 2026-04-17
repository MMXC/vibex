# Spec — DDS Canvas 理想态（Ideal State）

**文件**: `spec-dds-canvas-ideal-state.md`
**组件**: DDSCanvasPage / DDSScrollContainer / DDSFlow
**Epic**: Epic 1 & 2 & 3 & 4
**状态**: 进行中

---

## 1. 理想态定义

用户在 Spec Canvas 的正常状态：数据已加载、章节可见、卡片可交互、AI 抽屉可打开。

---

## 2. 页面理想态布局

```
┌──────────────────────────────────────────────────────────────────┐
│  DDSToolbar                                                       │
│  [← 返回] [需求 ▼] [上下文] [流程]              [AI 草稿] [全屏] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─ requirement ──┐  ┌─ context ───┐  ┌─ flow ───────┐         │
│  │ [章节标题] 需求   │  │ [章节标题]    │  │ [章节标题]    │         │
│  │                │  │   上下文     │  │   流程       │         │
│  │  ┌──────────┐  │  │              │  │              │         │
│  │  │ Card: US │  │  │  ┌────────┐  │  │  ┌────────┐  │         │
│  │  │ role     │  │  │  │Card:BC │  │  │  │Card:FS │  │         │
│  │  │ action   │  │  │  │ name   │  │  │  │ step   │  │         │
│  │  │ benefit  │  │  │  │ desc   │  │  │  │ actor  │  │         │
│  │  └──────────┘  │  │  └────────┘  │  │  └────────┘  │         │
│  │                │  │              │  │              │         │
│  │  [+ 添加卡片]  │  │  [+ 添加卡片] │  │  [+ 添加卡片] │         │
│  └────────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. 组件理想态规格

### 3.1 DDSToolbar（工具栏）

**可见元素**:
- 返回按钮（左侧）
- 章节标签组：需求 / 上下文 / 流程（当前章节高亮，`bg: var(--accent-primary)`）
- AI 草稿按钮（右侧，`bg: var(--accent-primary)`, 图标 + 文字）
- 全屏切换按钮（右侧，图标按钮）

**交互**:
- 点击章节标签 → 滚奏到对应章节
- 点击 AI 草稿 → 打开 AIDraftDrawer
- 点击全屏 → 切换 `isFullscreen` 状态

### 3.2 DDSScrollContainer（横向滚奏容器）

**布局**:
- 3 个章节面板等宽排列（flex: 1 each）
- `scroll-snap-type: x mandatory`
- 每个面板 `scroll-snap-align: center`
- 鼠标拖动切换章节，松手后吸附到最近面板

**章节面板**:
- 顶部固定标题栏（章节名称 + 卡片计数）
- 主体为 React Flow DAG 画布
- 底部固定操作栏（+ 添加卡片）

### 3.3 DDSFlow（卡片 DAG 画布）

**节点渲染**:
| 卡片类型 | 节点样式 |
|---------|---------|
| user-story | 左侧彩色边条（优先级色），标题 + role/action/benefit 摘要 |
| bounded-context | 双圆角矩形，name 居中，描述截断 |
| flow-step | 菱形节点，stepName + actor 标签 |

**边渲染**:
- 同章节内：实线，`type: smoothstep`
- 跨章节：虚线 + 章节色标记
- AI 生成：带 animated 标记（虚线流动动画）

### 3.4 AIDraftDrawer（AI 草稿抽屉）

**展开状态**:
- 右侧滑入，宽度 480px
- 顶部标题"AI 草稿"
- 对话历史（消息列表）
- 输入框（textarea，placeholder: "描述你想要生成的卡片内容..."）
- 发送按钮

---

## 4. 验收标准

```typescript
// 工具栏可见且可交互
expect(DDSToolbar).toBeVisible();
expect(screen.getByText('需求')).toBeVisible();
expect(clickAIButton()).toOpenDrawer();

// 3 个章节面板可见
expect(document.querySelectorAll('.chapter-panel').length).toBe(3);

// 卡片节点正确渲染
expect(document.querySelectorAll('.dds-node').length).toBeGreaterThan(0);

// 跨章节边正确渲染
expect(document.querySelectorAll('.dds-edge[cross-chapter="true"]').length).toBe(0); // 无跨章节边时

// 滚奏交互
expect(scrollBy({ deltaX: 500 })).toChange(activeChapter, to('context'));

// 全屏切换
expect(clickFullscreen()).toChange(isFullscreen, to(true));
```

---

*PM Agent | 2026-04-17*
