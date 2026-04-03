# Canvas 双侧常驻抽屉面板 — 需求分析

**项目**: canvas-drawer-persistent  
**阶段**: analyze-requirements  
**Analyst**: analyst  
**日期**: 2026-03-31  
**状态**: ✅ 完成

---

## 1. 业务场景分析

### 1.1 背景

VibeX Canvas 当前是一个纯居中的三列树形面板编辑器，存在以下体验缺口：

| 缺口 | 现状 | 期望 |
|------|------|------|
| 自然语言输入仅在 `input` 阶段可用 | 用户进入 `context/flow` 阶段后无法继续输入需求 | 左抽屉常驻，随时可输入自然语言需求 |
| 无进度/中止控制 | AI 生成过程中无可视化进度，用户无法中止 | 右抽屉显示 AI 状态 + 一键中止 |
| 面板不可调宽度 | 三列面板宽度固定，无法适应不同屏幕 | 抽屉宽度可拖动调整 |

### 1.2 与 canvas-drawer-msg 的关系

> **注意**: `canvas-drawer-msg` 项目（2026-03-31）已设计右侧消息抽屉（消息列表 + 命令面板 + 选择控制面板）。本项目的右抽屉专注于 **AI 进度/状态/中止请求**，与消息抽屉是**不同的功能**，但需要明确共存策略。

### 1.3 核心 Jobs-To-Be-Done (JTBD)

| # | JTBD | 用户故事 | 优先级 |
|---|------|----------|--------|
| JTBD-1 | **持续输入需求** | 作为用户，我在任何阶段（context/flow/component）都能通过左抽屉持续输入自然语言需求，而不必回到 input 阶段 | P0 |
| JTBD-2 | **AI 进度可见** | 作为用户，我希望实时看到 AI 生成过程的进度和状态（正在分析/正在生成/完成），而不只是等待 | P0 |
| JTBD-3 | **快速中止 AI** | 作为用户，我希望能一键中止正在进行的 AI 请求，而不必等待超时 | P0 |
| JTBD-4 | **布局适配** | 作为用户，我希望能调整抽屉宽度以适应我的屏幕和操作习惯 | P1 |

---

## 2. 现有代码审计

### 2.1 当前布局结构

```
canvasContainer (flex column)
├── phaseProgressBarWrapper     (flex-shrink: 0)
├── projectBarWrapper           (flex-shrink: 0)
├── phaseLabelBar
├── expandControls
└── treePanelsGrid             (flex: 1, fills remaining)
    ├── expandCol (24px) ← 将被替换为左抽屉
    ├── context panel
    ├── flow panel
    ├── component panel
    └── expandCol (24px) ← 将被替换为右抽屉
```

### 2.2 现有相关组件

| 组件 | 路径 | 功能 | 复用可能性 |
|------|------|------|-----------|
| `HoverHotzone` | `src/components/canvas/HoverHotzone.tsx` | 左右边缘悬停区域检测 | 可参考宽度拖拽逻辑 |
| `RightDrawer` | `src/components/homepage/RightDrawer/RightDrawer.tsx` | AI 思考过程展示（已存在） | 可参考抽屉样式，不能直接复用（高度/位置不同） |
| `expandCol` | `canvas.module.css:231` | 24px 展开按钮列 | 将被完全替换 |
| `requirementTextarea` | `CanvasPage.tsx:1009` | 当前需求输入框（仅 input 阶段） | 迁移到左抽屉 |
| `aiThinking/aiThinkingMessage` | `canvasStore` | AI 思考状态 | 右抽屉数据源 |

### 2.3 现有 store 数据

```typescript
// canvasStore 中的相关状态
aiThinking: boolean;
aiThinkingMessage: string;
flowGenerating: boolean;
flowGeneratingMessage: string;

// SSE 相关（需新增）
sseStatus: SSEStatus;  // 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'
```

---

## 3. 技术方案对比

### 方案 A：CSS Flex + 绝对定位抽屉（推荐）

**思路**: 将 `canvasContainer` 改为 flex row，左抽屉和右抽屉通过 `position: absolute` 或 `flex-shrink: 0` 占据固定宽度，`treePanelsGrid` 通过 `flex: 1` 填充剩余空间。

```
canvasContainer (flex row)
├── LeftDrawer (width: var(--left-drawer-width, 200px), flex-shrink: 0)
├── treePanelsGrid (flex: 1, min-width: 0)
└── RightDrawer (width: var(--right-drawer-width, 200px), flex-shrink: 0)
```

**优点**:
- 布局改动最小，不影响现有三列 grid
- 抽屉折叠时完全不占空间
- 拖拽调整宽度通过 CSS 变量 `var(--left-drawer-width)` 实现

**缺点**:
- 需要处理 `position: absolute` 下的 z-index 层叠
- 抽屉内部滚动需要独立处理

**预估工时**: 10-14h

---

### 方案 B：改造 treePanelsGrid 为 7 列 CSS Grid

**思路**: 将现有的 5 列 grid 改为 7 列：
```
expandCol | LeftDrawer | context | flow | component | RightDrawer | expandCol
```

**优点**:
- 布局完全 CSS Grid，语义清晰

**缺点**:
- grid 列太多（7列），布局复杂
- 折叠需要切换 `grid-template-columns`，逻辑复杂
- 拖拽调整宽度需要 JS 操作 CSS 变量

**预估工时**: 14-18h

---

## 4. 推荐方案（方案 A 细化）

### 4.1 布局改造

```css
/* canvas.module.css */
.canvasContainer {
  display: flex;
  flex-direction: row;  /* 改为 row，支持左右抽屉 */
  height: 100vh;
}

.leftDrawer {
  width: var(--left-drawer-width, 200px);
  flex-shrink: 0;
  transition: width 0.3s ease;
  /* 与 canvas 同级高度，覆盖左侧区域 */
}

.rightDrawer {
  width: var(--right-drawer-width, 200px);
  flex-shrink: 0;
  transition: width 0.3s ease;
  /* 与 canvas 同级高度，覆盖右侧区域 */
}

.treePanelsGrid {
  flex: 1;
  min-width: 0;
  /* 移除 grid-template-columns 的固定写法，改为动态计算 */
}
```

### 4.2 左抽屉组件设计

```typescript
interface LeftDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  width: number;           // 可拖动
  onWidthChange: (w: number) => void;
}

// 功能：
// 1. 自然语言输入框（textarea）+ 发送按钮
// 2. 与 canvasStore.requirementText / generateContexts 联动
// 3. 显示最近 3-5 条输入历史（sessionStorage）
// 4. 拖拽调整宽度
```

### 4.3 右抽屉组件设计

```typescript
interface RightDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  width: number;
  onWidthChange: (w: number) => void;
}

// 功能：
// 1. AI 进度指示器（环形进度/步骤列表）
// 2. SSE 连接状态（idle/connecting/connected/reconnecting/error）
// 3. 一键中止按钮（调用 AbortController）
// 4. 错误信息展示
// 5. 拖拽调整宽度
```

### 4.4 与 canvasStore 联动

```typescript
// 新增 store 状态
leftDrawerOpen: boolean;
rightDrawerOpen: boolean;
leftDrawerWidth: number;   // 默认 200
rightDrawerWidth: number;  // 默认 200

// 右抽屉数据源（复用现有）
aiThinking: boolean;
aiThinkingMessage: string;
flowGenerating: boolean;
flowGeneratingMessage: string;
abortGeneration: () => void;  // 新增中止方法
```

### 4.5 共存策略（与 canvas-drawer-msg）

> `canvas-drawer-msg` 的右抽屉定位：消息列表 + 命令面板 + 选择控制  
> 本项目右抽屉定位：AI 进度/状态/中止请求

**决策**: 本项目的右抽屉**替代** `canvas-drawer-msg` 的右抽屉功能。原因：
1. 功能定位不同（进度控制 vs 消息记录）
2. 两个右抽屉不能同时存在于同一位置
3. 建议在 `canvas-drawer-msg` 的 PRD 中调整，将消息功能合并到本项目的右抽屉中

---

## 5. 技术风险识别

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 宽度拖拽与三列 grid 布局冲突 | 高 | 使用 flex + CSS 变量方案，避免操作 grid 列 |
| 右抽屉与 canvas-drawer-msg 右抽屉功能重叠 | 中 | 与 coord 确认合并策略，统一右抽屉功能 |
| 抽屉展开时画布宽度收缩，影响操作 | 中 | 设定最小画布宽度（400px），宽度不足时提示 |
| AbortController 中止 SSE 请求需要后端配合 | 中 | 前端先实现中止 UI，后端中止逻辑后续迭代 |
| 拖拽调整宽度时边界检测 | 低 | 设定 min/max 宽度范围（100-400px） |

---

## 6. 验收标准

| ID | 验收条件 | 测试方法 |
|----|----------|----------|
| AC-1 | 左抽屉默认收起，按钮点击后展开，展开宽度默认 200px | 刷新页面 → 检查初始状态 → 点击展开 |
| AC-2 | 左抽屉展开后，`requirementTextarea` 可见可输入 | gstack snapshot 检查 |
| AC-3 | 在任意阶段（context/flow/component）都能在左抽屉输入需求并触发 `generateContexts` | 切换 phase → 左抽屉输入 → 验证 AI 生成 |
| AC-4 | 右抽屉展开后，显示 AI 进度状态（idle/generating/complete/error） | 触发 AI 生成 → 观察右抽屉状态变化 |
| AC-5 | 右抽屉有「中止」按钮，点击后取消正在进行的 AI 请求 | gstack eval 调用中止 → 验证请求取消 |
| AC-6 | 拖拽抽屉边缘可调整宽度，范围 100-400px | 手动拖拽 → 检查宽度变化和边界限制 |
| AC-7 | 抽屉折叠后，画布宽度恢复正常（不受影响） | 展开抽屉 → 折叠 → 测量画布宽度 |
| AC-8 | 左抽屉和右抽屉可同时展开/折叠，互不干扰 | 同时展开两侧抽屉 → 验证独立 |
| AC-9 | 抽屉展开/折叠有平滑动画过渡（300ms） | CSS 动画验证，无跳跃 |

---

## 7. 实施计划（初步）

| Epic | 内容 | 工时 |
|------|------|------|
| Epic 1 | canvasStore 扩展（新增 drawer 状态 + abortGeneration） | 1h |
| Epic 2 | 左抽屉组件（NaturalLanguageDrawer）| 4-5h |
| Epic 3 | 右抽屉组件（AIStatusDrawer）+ 中止逻辑 | 3-4h |
| Epic 4 | 宽度拖拽交互（mouse drag resize） | 2h |
| Epic 5 | 与 canvas-drawer-msg 的功能合并协调 | 1h |
| Epic 6 | E2E 测试覆盖 | 2h |

**总预估工时**: 13-17h

---

## 8. 下一步

1. **Coord**: 确认与 `canvas-drawer-msg` 的右抽屉合并策略
2. **PM**: 评审 Epic/Story 拆分（与 canvas-drawer-msg 的关系需明确）
3. **Architect**: 确认 flex 布局改造方案不影响现有功能

---

*分析文档完毕。*
