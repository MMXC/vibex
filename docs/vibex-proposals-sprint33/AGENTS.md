# VibeX Sprint 33 — 开发约束

**Agent**: ARCHITECT | **日期**: 2026-05-09 | **项目**: vibex-proposals-sprint33

---

## 1. 文件归属

| 文件 | Owner | 说明 |
|------|-------|------|
| `vibex-fronted/src/stores/dds/DDSCanvasStore.ts` | coder | E1 collapsedGroups 状态 |
| `vibex-fronted/src/components/dds/DDSFlow.tsx` | coder | E1 折叠按钮 + E2 ConflictBubble 集成 |
| `vibex-fronted/src/components/dds/canvas/CanvasThumbnail.tsx` | coder | E4-Q1 data-testid |
| `vibex-fronted/src/components/canvas/OfflineBanner.tsx` | coder | E4-Q2 data-sync-progress |
| `vibex-fronted/src/components/canvas/ConflictBubble.tsx` | coder | E2 已有（75行），需集成 |
| `vibex-fronted/src/components/ConflictDialog/` | coder | E2 已有（含测试） |
| `vibex-fronted/src/lib/canvas/stores/conflictStore.ts` | coder | E2 已有（260行），API 不变 |
| `vibex-fronted/src/lib/firebase/presence.ts` | coder | E3 扩展 intention 字段 |
| `vibex-fronted/src/components/presence/RemoteCursor.tsx` | coder | E3 增加 intention prop + 气泡 |
| `vibex-fronted/src/components/presence/IntentionBubble.tsx` | coder | E3 新组件 |
| `vibex-fronted/tests/e2e/sprint33.spec.ts` | coder | E2+E3 E2E 测试 |

---

## 2. 代码规范

### 2.1 TypeScript 约定

- `strict: true`，无 `any` 逃逸（已配置于 tsconfig.json）
- 导出所有公共接口：`export type` / `export interface`
- `'use client'` 标注所有客户端组件

### 2.2 Epic 1 — Group/Folder 折叠规范

**Group 节点检测**：通过 `parentId === null` + `children?.length > 0` 判断（Group 是有子节点的父级节点）。

**折叠按钮位置**：`top: 4px; left: 4px`，尺寸 24x24px。

**折叠动画**：
```css
/* 展开动画: scaleY(0→1), 300ms ease-out */
.collapsed-child {
  transform-origin: top;
  transform: scaleY(0);
  opacity: 0;
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}
```

**localStorage Key**：`vibex-dds-collapsed-{canvasId}`
- 读取: `JSON.parse(raw ?? '[]')` → `Set<string>`
- 写入: `JSON.stringify([...collapsedGroups])`
- 错误处理: `try/catch`，读取失败返回 `new Set()`

### 2.3 Epic 2 — 冲突可视化规范

**ConflictBubble 集成位置**：DDSFlow 外层容器（非 ReactFlow 内部）。

**高亮动画**：
```css
@keyframes conflict-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50%       { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}
[data-conflict="true"] {
  border: 2px solid #ef4444;
  animation: conflict-pulse 1.5s infinite ease-in-out;
}
```

**超时仲裁**：30s 默认 keep-local，显示 toast。

### 2.4 Epic 3 — 意图气泡规范

**意图类型映射**：

| 操作 | type | 气泡文案 |
|------|------|----------|
| 鼠标悬停节点上 | `edit` | "正在编辑" |
| 鼠标悬停空白区域 | `select` | "正在选择" |
| 鼠标拖拽节点 | `drag` | "正在拖拽" |
| 静止 > 3s | `idle` | 无气泡 |

**气泡样式**：
```css
.intention-bubble {
  position: absolute;
  bottom: 100%; /* above cursor */
  left: 50%;
  transform: translateX(-50%);
  top: -32px; /* 8px gap from cursor */
  animation: bubble-in 200ms ease-out;
}
@keyframes bubble-in {
  from { transform: translateX(-50%) scale(0.9); opacity: 0; }
  to   { transform: translateX(-50%) scale(1);   opacity: 1; }
}
```

**显示/消失逻辑**：
- 停留 > 500ms → 显示气泡（动画 200ms ease-out）
- 状态变为 `idle` 或 3s 无操作 → 气泡淡出消失（opacity 1→0, 300ms）
- 气泡已消失后移动 → 重新计时 500ms 后显示

### 2.5 Epic 4 — data 属性规范

```tsx
// CanvasThumbnail.tsx — 外层 div
<div
  className={styles.container}
  data-testid="canvas-thumbnail"  // ✅ 新增
  aria-label="画布缩略图"
  role="img"
>

// OfflineBanner.tsx — 进度条 div
<div
  className={styles.progressBar}
  role="progressbar"
  data-sync-progress="true"  // ✅ 新增
  aria-valuenow={totalCount - pendingCount}
>
```

---

## 3. 测试要求

### 3.1 单元测试（Vitest）

| Epic | 覆盖率目标 | 关键测试路径 |
|------|-----------|-------------|
| E1: collapsedGroups | > 80% | toggleCollapse, isCollapsed, getVisibleNodes, localStorage |
| E2: conflict resolution | > 80% | activeConflict, keep-local, use-remote, timeout |
| E3: intention bubble | > 80% | show/hide, delay, types, idle, mock mode |
| E3: presence updateCursor | > 80% | type parameter, RTDB write |

### 3.2 E2E 测试（Playwright）

```typescript
// sprint33.spec.ts — 关键场景
test('E1: Group 折叠/展开流程', async ({ page }) => {
  // collapse button visible → click → children hidden → badge shows
});

test('E2: 冲突高亮 + 仲裁', async ({ page }) => {
  // conflict triggered → node highlight → dialog → resolve → highlight gone
});

test('E3: 意图气泡显示/消失', async ({ page }) => {
  // cursor moves → 500ms delay → bubble shows → 3s idle → bubble hides
});
```

### 3.3 视觉回归

- E1: `reference/group-collapsed.png`, `reference/group-expanded.png`
- E2: `reference/conflict-highlight.png`
- E3: `reference/intention-bubble-edit.png`, `reference/intention-bubble-drag.png`

---

## 4. 集成约束

### 4.1 Epic 2 前置确认

Epic 2 的 ConflictBubble 已存在（75行），已使用 conflictStore。但 PRD §5 DoD 标注："**前置条件**: architect 已确认 RTDB presence 节点变更方案"。

架构设计确认：**Epic 2 不需要新的 RTDB schema**，仅使用现有的 `conflicts/{canvasId}` 节点，ConflictBubble 已有监听器。

Epic 2 依赖冲突检测逻辑（E2-F2 Firebase 冲突监听）已在 spec 中明确，冲突事件写入 RTDB `conflicts/{canvasId}/{nodeId}` 路径。

### 4.2 Epic 3 前置确认

Epic 3 依赖 presence 扩展（`presence/{canvasId}/{userId}/intention` 字段）。

RTDB 变更范围：**仅 presence 节点**，不影响项目主数据。无数据迁移需求（现有文档缺少字段 → 视为 `idle`）。

### 4.3 Epic 1 数据模型确认

`DDSCard.parentId` 已存在于 `vibex-fronted/src/types/dds/index.ts`。Epic 1 无需数据迁移。

---

## 5. CI/CD 约束

- TypeScript 类型检查: `pnpm run type-check`（exit 0, 0 errors）
- 单元测试: `pnpm run test:unit`（exit 0）
- Coverage gate: `pnpm run test:unit:coverage` ≥ 60%（当前基线），Epic 新增代码 ≥ 80%
- E2E: `pnpm exec playwright test`（exit 0）

---

## 6. QA 验收检查单

| 检查项 | 验证方式 |
|--------|----------|
| E1: collapse-toggle 存在 | `grep 'data-testid="collapse-toggle"' DDSFlow.tsx` |
| E1: collapsed-badge 存在 | `grep 'data-testid="collapsed-badge"'` |
| E1: collapsedGroups state | `grep 'collapsedGroups.*Set<string>' DDSCanvasStore.ts` |
| E1: localStorage 持久化 | `grep 'vibex-dds-collapsed' DDSCanvasStore.ts` |
| E2: ConflictBubble 集成 | `grep 'ConflictBubble' DDSFlow.tsx` |
| E2: data-conflict 属性 | `grep 'data-conflict' DDSFlow.tsx` 或相关组件 |
| E3: intention 字段 | `grep "intention.*'edit'\|'select'\|'drag'\|'idle'" presence.ts` |
| E3: IntentionBubble 组件 | `ls src/components/presence/IntentionBubble.tsx` |
| E3: intention-bubble testid | `grep 'data-testid="intention-bubble"' IntentionBubble.tsx` |
| E4: canvas-thumbnail testid | `grep 'data-testid="canvas-thumbnail"' CanvasThumbnail.tsx` |
| E4: data-sync-progress | `grep 'data-sync-progress' OfflineBanner.tsx` |
| E4: baseline screenshots | `find tests -name '*.png' -path '*/reference/*' \| wc -l` |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint33
- **执行日期**: 2026-05-09