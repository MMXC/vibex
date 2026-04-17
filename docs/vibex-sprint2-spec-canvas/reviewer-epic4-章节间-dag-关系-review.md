# Code Review Report: Epic4 章节间DAG关系

**Dev Commit**: `2b3d69f4` (feat(dds): Epic4 跨章节DAG边实现 (E4-U1 + E4-U2))
**Previous Approval**: `aa966492`
**Reviewer**: reviewer (agent)
**Date**: 2026-04-17
**Files Reviewed**:
- `vibex-fronted/src/components/dds/canvas/CrossChapterEdgesOverlay.tsx` (NEW)
- `vibex-fronted/src/stores/dds/DDSCanvasStore.ts`
- `vibex-fronted/src/hooks/dds/useDDSCanvasFlow.ts`
- `vibex-fronted/src/types/dds/index.ts`
- `vibex-fronted/src/components/dds/canvas/DDSScrollContainer.tsx`
- `vibex-fronted/src/components/dds/DDSCanvasPage.tsx`

---

## 🔴 Blockers

None. No security or data-corruption blockers found.

---

## 🟡 Suggestions (Should Fix)

### 1. [E4-U1] `collapsedOffsets` 计算错误 — 硬编码80px不考虑展开状态

**文件**: `CrossChapterEdgesOverlay.tsx:116-123`

```tsx
const collapsedOffsets = (() => {
  const offsets: Record<ChapterType, number> = {
    requirement: 0,
    context: COLLAPSED_WIDTH_PX,
    flow: COLLAPSED_WIDTH_PX * 2,
  };
  return offsets;
})();
```

**问题**: 当某个面板展开时（flex:1），其他两个面板仍保持80px collapsed。这是正确的假设，但 `cardAbsoluteCenter` 使用这些固定偏移量，会导致展开章节的卡片X坐标严重错误（被80px偏移压住）。

**影响**: 跨章节边的端点会错位，可能偏移数百像素。

**建议**: 使用 ResizeObserver 测量每个面板的实际宽度，或从 DDSPanel 的 CSS class/width 计算。当前实现适用于 collapsed 状态，但展开时位置错误。

---

### 2. [E4-U1] `DDSCard.chapter` 字段不存在 — 跨章节检测依赖链可能断裂

**文件**: `useDDSCanvasFlow.ts:121-122`

```tsx
const sourceChapter = (sourceCard as DDSCard & { chapter?: ChapterType }).chapter ?? chapter;
const targetChapter = (targetCard as DDSCard & { ChapterType }).chapter ?? chapter;
```

**问题**: `chapter` 字段在任何 `DDSCard` 类型（UserStoryCard/BoundedContextCard/FlowStepCard）中均未定义。fallback 逻辑 `?? chapter` 会将所有未标记卡片的章节回退到当前活跃章节，导致:
- 如果用户在 context 面板拖出一条连接到 requirement 面板的卡片，源章节会被识别为 `context`（正确），但目标章节会被识别为当前激活章节（可能是 `flow`），错误地触发跨章节判断。

**建议**: 使用 `findCardChapter(edge.source, chapters)` 作为回退（与 overlay 中的逻辑一致），或确保每张卡片在创建时被正确标记 chapter 字段。

---

### 3. [E4-U1] 同章节边同步到 React Flow — 跨章节边未同步

**文件**: `useDDSCanvasFlow.ts:155-161`

```tsx
} else {
  // 同章节边：添加到 chapter edges（现有行为）
  const newEdge: DDSEdge = { ... };
  ddsChapterActions.addEdge(chapter, newEdge);
  // 同步到 React Flow
  setEdges((eds) => [...eds, { ... }]);
}
```

**问题**: 跨章节边（sourceChapter !== targetChapter）只写入 `crossChapterEdges`，**不**写入任何 React Flow 的 `edges` 状态。但 `CrossChapterEdgesOverlay` 依赖 `crossChapterEdges` 从 store 渲染 SVG，**不**依赖 React Flow edges。这是设计决策（SVG overlay 独立于 React Flow 渲染），但如果将来有组件依赖 React Flow 的 edges 来渲染边（如自定义 edge 组件），跨章节边会丢失。

**建议**: 文档化这个设计决策（comment），说明 crossChapterEdges 是独立于 React Flow 的 overlay 系统。

---

## 💭 Nits (Nice to Have)

### 4. Dead constants — `CHAPTER_OFFSETS` 和 `CHAPTER_ORDER` 未使用

**文件**: `CrossChapterEdgesOverlay.tsx:30-39`

```tsx
const CHAPTER_ORDER: ChapterType[] = ['requirement', 'context', 'flow'];  // used
const CHAPTER_OFFSETS: Record<ChapterType, number> = { requirement: 0, context: 1/3, flow: 2/3 };  // unused
```

`CHAPTER_OFFSETS` 和 `CHAPTER_ORDER[0]` 未被使用。`CHAPTER_ORDER` 用于 `findCardChapter` 遍历顺序，可保留。建议删除 `CHAPTER_OFFSETS` 常量或添加 `@ts-ignore` 注释解释其用途。

---

### 5. SVG path bezier 计算 `dy` 变量未使用

**文件**: `CrossChapterEdgesOverlay.tsx:189-200`

```tsx
const dx = Math.abs(to.x - from.x);
const dy = to.y - from.y;  // ← computed but never used

const path = `
  M ${from.x} ${from.y}
  C ${from.x + Math.min(dx * 0.5, 80)} ${from.y},
    ${to.x - Math.min(dx * 0.5, 80)} ${to.y},
    ${to.x} ${to.y}
`;
```

`dy` 被计算但未使用（bezier control points 仅基于 dx 和 from.y/to.y）。删除 `dy` 消除困惑，或改为 `const _dy = to.y - from.y` 明确标注。

---

### 6. Dead code — `collapsedOffsets` IIFE 在组件内重复执行

**文件**: `CrossChapterEdgesOverlay.tsx:116`

`collapsedOffsets` 每次渲染都通过 IIFE 重新创建，值是常量（{ requirement: 0, context: 80, flow: 160 }），应提到组件外作为 const：

```tsx
const COLLAPSED_OFFSETS: Record<ChapterType, number> = {
  requirement: 0,
  context: 80,
  flow: 160,
};
```

---

### 7. 跨章节边删除功能 — 悬空 hit area 无处理

**文件**: `CrossChapterEdgesOverlay.tsx:210-217`

```tsx
<path
  d={path}
  fill="none"
  stroke="transparent"
  strokeWidth={16}
  style={{ pointerEvents: 'stroke' }}
  data-edge-id={edge.id}
/>
```

透明 hit area 已设置 `data-edge-id`，但**没有任何 click 处理器**来响应用户点击删除边。需要后续实现删除交互，或移除此 hit area 以避免误导。

---

### 8. `loadChapter` 中的 TODO 注释

**文件**: `DDSCanvasStore.ts:38-60`

`loadChapter` 有 `// TODO: 调用 useDDSAPI().getCards(chapterId)` 占位注释。这是一个已知的 placeholder，不阻塞本次审查，但应尽快实现。

---

## INV Checklist Results

| ID | Item | Status | Notes |
|----|------|--------|-------|
| INV-0 | Self-review documented | ⚠️ PARTIAL | 缺少 formal self-review 文档 |
| INV-1 | TypeScript type safety | ✅ PASS | `DDSEdge` 扩展了 `sourceChapter/targetChapter`，类型一致 |
| INV-2 | Edge ID generation | ✅ PASS | `crypto.randomUUID()` — 正确 |
| INV-3 | Cross-chapter detection | ⚠️ PARTIAL | 检测逻辑正确，但 chapter 字段假设可能断裂（见 🟡 #2） |
| INV-4 | SVG overlay renders | ✅ PASS | memo + RAF + ResizeObserver 三层保护 |
| INV-5 | Dashed lines correct | ✅ PASS | `strokeDasharray="6 4"` 虚线 + arrow marker |
| INV-6 | No XSS risk | ✅ PASS | SVG text 使用 `edge.label`（store 数据），无用户输入透传 |
| INV-7 | Build compiles | ✅ PASS | `npm run build` exit code 0, 34 static routes generated |

---

## Logic Correctness Analysis

### handleConnect 跨章节检测 ✅
```tsx
const sourceChapter = (sourceCard as DDSCard & { chapter?: ChapterType }).chapter ?? chapter;
const targetChapter = (targetCard as DDSCard & { chapter?: ChapterType }).chapter ?? chapter;
if (sourceChapter !== targetChapter) {
  ddsChapterActions.addCrossChapterEdge(newEdge);
}
```
逻辑正确：比较章节差异，跨章节走 overlay，同章节走 React Flow。

### CrossChapterEdgesOverlay SVG 渲染 ✅
- `memo` 包裹组件，避免父组件重渲染导致 SVG 重绘
- `ResizeObserver` 监听容器尺寸变化，RAF 节流
- 虚线 `strokeDasharray="6 4"` + `markerEnd` arrow 标识清晰
- `aria-hidden="true"` 正确（装饰性 SVG）

### cardAbsoluteCenter 位置计算 ⚠️ PARTIAL
硬编码 `PANEL_HEADER_HEIGHT_PX = 48` 和 `COLLAPSED_WIDTH_PX = 80`。当面板展开时宽度计算会错误（见 🟡 #1）。

---

## Build Verification

```
✅ npm run build — exit code 0
✅ 34 static routes generated
✅ 0 TypeScript errors
```

---

## Overall Verdict

**CONDITIONAL PASS** ✅

代码整体质量良好，核心逻辑正确，安全无隐患，构建干净。但有两项中等优先级问题建议修复：

1. **🟡 #1 (Medium)**: `collapsedOffsets` 在展开面板时计算错误 — 影响边的端点位置
2. **🟡 #2 (Medium)**: `DDSCard.chapter` 字段不存在 — 可能导致跨章节判断失败

这两项属于"可能出错"而非"确定错误"。修复建议已在上述表格中说明。

如果后续会有用户在实际场景中使用跨章节连边功能，建议优先修复 🟡 #2。

---

## Changelog Assessment

当前 `CHANGELOG.md` 中 E4 条目：

```markdown
### [Unreleased] vibex-sprint2-spec-canvas Epic4: 章节间 DAG 关系 — 2026-04-17
- **E4-U1 跨章节边创建**: `DDSCanvasStore.ts` — addCrossChapterEdge/deleteCrossChapterEdge, crossChapterEdges state
- **E4-U2 跨章节边渲染**: `useDDSCanvasFlow.ts` — 自动识别跨章节连接, CrossChapterEdgesOverlay SVG
- 提交: vibex-sprint2-spec-canvas/dev-epic4-章节间-dag-关系
```

**评估**: 条目存在，涵盖了主要功能点。但可以进一步丰富，因为本次实现包含多个具体技术决策：
- SVG overlay 使用 ResizeObserver + RAF 双层监听
- 虚线样式 `strokeDasharray="6 4"` + 箭头 marker
- `crypto.randomUUID()` 生成边 ID
- crossChapterEdges 独立于 React Flow edges 的双轨设计

建议 enrich。

---

## Actions Required

- [ ] **OPTIONAL (Medium)**: 修复 🟡 #2 — `DDSCard.chapter` 字段缺失问题，改为 `findCardChapter` 回退
- [ ] **OPTIONAL (Medium)**: 修复 🟡 #1 — `collapsedOffsets` 展开状态计算
- [ ] **OPTIONAL (Low)**: 删除 dead constant `CHAPTER_OFFSETS`
- [ ] **OPTIONAL (Low)**: 删除未使用 `dy` 变量
- [ ] **OPTIONAL (Low)**: 实现跨章节边点击删除（data-edge-id hit area）
- [ ] **TODO**: `loadChapter` 占位注释实现真实 API 调用
- [ ] **OPTIONAL**: Enrich CHANGELOG.md with more technical details