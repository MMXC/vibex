# PRD — VibeX Sprint 43

> **项目**: vibex-proposals-sprint43
> **版本**: 1.0
> **日期**: 2026-05-30
> **作者**: Coord (pm-review self-implement — pm CLI-dispatch ghost)
> **分析文档**: docs/vibex-proposals-sprint43/analysis.md

---

## Epic 1: Presence DDSCanvasPage 集成收尾

### 概述
Sprint42 E2 Presence 光标同步：presenceStore、useWebSocketPresence、PresenceOverlay 已实现，但 DDSCanvasPage 未集成，导致远程用户光标不可见。本 Epic 完成画布主页集成，激活 Presence 功能。

### Epic 1 Story 表格

| ID | 功能 | 验收标准 | DoD |
|----|------|----------|-----|
| S43-E1-S1 | DDSCanvasPage 集成 useWebSocketPresence | 组件 mount 时调用 hook，无 console.error | import + mount 在 DDSCanvasPage render 内部 |
| S43-E1-S2 | PresenceOverlay 渲染 | 远程用户头像+名称显示在画布 overlay 层 | `<PresenceOverlay />` 在 `<svg>` 之上渲染 |
| S43-E1-S3 | Firebase usePresence 移除 | 全局无 Firebase presence 调用 | `grep -rn "usePresence" vibex-fronted/src/` 返回空 |
| S43-E1-S4 | cursorVisible 设置联动 | Settings → Canvas → cursorVisible=false 时 overlay 隐藏 | toggle → overlay return null |
| S43-E1-S5 | vitest 覆盖 | presenceStore 4种状态测试 | 4/4 PASS |

### expect() 断言

```typescript
// presenceStore.test.ts
expect(store.getState().remoteUsers.length).toBeGreaterThanOrEqual(0)
expect(store.getState().remoteUsers[0]).toMatchObject({
  id: expect.any(String),
  name: expect.any(String),
  color: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
  viewport: { x: expect.any(Number), y: expect.any(Number) }
})
```

### 页面集成标注
- 改动文件: `src/components/dds/DDSCanvasPage.tsx`
- 新增 import: `useWebSocketPresence`
- 新增组件: `PresenceOverlay`

---

## Epic 2: AI Agent 流式响应界面（SSE）

### 概述
当前 AgentFeedbackPanel 一次性展示 AI 完整响应。实现 SSE 流式响应，逐字展示 AI 输出，提升用户反馈感知。

### Epic 2 Story 表格

| ID | 功能 | 验收标准 | DoD |
|----|------|----------|-----|
| S43-E2-S1 | 后端 SSE 端点 | `GET /api/ai/stream?message=xxx` 返回 `text/event-stream` | curl 验证返回 event-stream |
| S43-E2-S2 | 前端 SSE 解析 | 逐字追加到 AgentFeedbackPanel，不闪烁 | 字符逐增，无闪烁/抖动 |
| S43-E2-S3 | 流式/非流式双模式 | 自动检测或 toggle 开关 | 两种模式均可正常工作 |
| S43-E2-S4 | loading 状态 | 生成期间显示"正在生成..." | 响应开始前有 loading indicator |
| S43-E2-S5 | 取消生成 | AbortController 中断 SSE | cancel button 停止响应 |
| S43-E2-S6 | E2E 测试 | 流式响应完整渲染验证 | Playwright test 5s 内完成 |

### expect() 断言

```typescript
// streaming.test.ts
expect(response.headers.get('content-type')).toContain('text/event-stream')
expect(streamText).toContain('正在') // initial loading state
// after stream complete
expect(streamText.length).toBeGreaterThan(10)
```

### 页面集成标注
- 改动文件: `src/components/agent/AgentFeedbackPanel.tsx`
- 新增 hook: `useStreamingAgent`
- 新增 API: `GET /api/ai/stream` (via vibex-backend proxy)

---

## Epic 3: Canvas 大型画布性能优化

### 概述
当画布节点数 >100 时，无视口裁剪导致卡顿。激活 @xyflow/react `onlyRenderVisibleElements` + viewportBoundsStore 联动，实现视口裁剪 + 渐进式加载。

### Epic 3 Story 表格

| ID | 功能 | 验收标准 | DoD |
|----|------|----------|-----|
| S43-E3-S1 | 视口裁剪激活 | `onlyRenderVisibleElements={true}` 在 DDSFlow prop | TypeScript 类型正确 |
| S43-E3-S2 | viewportBoundsStore 联动 | 视口滚动/缩放时 store 同步更新 | 缩放后 store.x/y/zoom 更新 |
| S43-E3-S3 | 首次加载性能 | 100节点画布 < 2s render | Performance API 测量 |
| S43-E3-S4 | 滚动流畅度 | FPS > 30 (60 FPS 目标) | Chrome DevTools Performance |
| S43-E3-S5 | vitest | viewportBounds 计算正确性 | 3+ boundary 测试用例 |
| S43-E3-S6 | 回归测试 | E1-E5 功能无退化 | vitest 全部通过 |

### expect() 断言

```typescript
// viewportBounds.test.ts
const bounds = computeViewportBounds(nodes, edges)
expect(bounds.width).toBeGreaterThan(0)
expect(bounds.height).toBeGreaterThan(0)
expect(bounds.x).toBeLessThanOrEqual(0)
expect(bounds.y).toBeLessThanOrEqual(0)
```

### 页面集成标注
- 改动文件: `src/components/dds/DDSFlow.tsx` (props)
- 改动文件: `src/lib/canvas/viewportBoundsStore.ts` (新建或扩展)

---

## Epic 4: 画布导出（PNG / SVG / PDF）

### 概述
用户需要将画布导出为图片（PNG/SVG）或文档（PDF），用于分享和存档。

### Epic 4 Story 表格

| ID | 功能 | 验收标准 | DoD |
|----|------|----------|-----|
| S43-E4-S1 | PNG 导出 | DDSToolbar → Export → PNG → 下载 .png 文件 | 文件名 `canvas-{timestamp}.png` |
| S43-E4-S2 | SVG 导出 | Export → SVG → 下载 .svg 文件 | 文件名 `canvas-{timestamp}.svg` |
| S43-E4-S3 | PDF 导出 | Export → PDF → 下载 .pdf 文件 | A4 页面，含画布全内容 |
| S43-E4-S4 | 导出 loading | 大画布导出显示 spinner | 渲染期间 loading overlay |
| S43-E4-S5 | i18n keys | exportBtn, exportPNG, exportSVG, exportPDF | 中英文 key 存在 |
| S43-E4-S6 | vitest | 导出逻辑单元测试 | 3+ 导出格式测试 |

### expect() 断言

```typescript
// export.test.ts
const blob = await exportToPNG(nodes, edges)
expect(blob.type).toBe('image/png')
expect(blob.size).toBeGreaterThan(0)
```

### 页面集成标注
- 改动文件: `src/components/dds/toolbar/DDSToolbar.tsx` (Export 按钮)
- 新增文件: `src/lib/canvas/export.ts`

---

## Epic 5: 键盘快捷键自定义面板

### 概述
当前键盘快捷键硬编码（Sprint41 E5），用户无法自定义。实现快捷键绑定 UI + userPreferencesStore 持久化。

### Epic 5 Story 表格

| ID | 功能 | 验收标准 | DoD |
|----|------|----------|-----|
| S43-E5-S1 | Settings Shortcuts section | Settings 页面新增 Shortcuts tab | 入口路径正确 |
| S43-E5-S2 | 快捷键绑定 UI | 按键录制 → 绑定到 action | 录制时显示 "Press keys..." |
| S43-E5-S3 | 启用/禁用单个快捷键 | toggle 开关控制每个 action | toggle 状态持久化 |
| S43-E5-S4 | ShortcutManager 配置化 | 从 userPreferencesStore 读取配置 | 非硬编码，配置可覆盖 |
| S43-E5-S5 | 冲突检测 | 重复绑定时显示 Warning | ShortcutManager 复用 |
| S43-E5-S6 | IndexedDB 持久化 | 刷新页面后自定义绑定保留 | persistence.ts 写入 |
| S43-E5-S7 | i18n | shortcuts namespace keys | 中英文 key 存在 |
| S43-E5-S8 | vitest | ShortcutManager 配置读取 + 冲突检测 | 5+ 测试用例 |

### expect() 断言

```typescript
// shortcutManager.test.ts
const manager = new ShortcutManager(userPrefs)
expect(manager.getBinding('undo')).toEqual(expect.arrayContaining([expect.any(String)]))
expect(manager.detectConflict('undo', ['Ctrl+Z'])).toBe(false)
expect(manager.detectConflict('redo', ['Ctrl+Z'])).toBe(true) // conflict with undo
```

### 页面集成标注
- 改动文件: `src/app/settings/page.tsx` (新增 Shortcuts section)
- 改动文件: `src/lib/keyboard/shortcutManager.ts` (配置化改造)

---

## DoD 总清单

每个 Epic 必须满足：

1. ✅ 所有 Story 验收标准达成
2. ✅ expect() 断言全部在测试中体现
3. ✅ TypeScript 编译通过（`pnpm exec tsc --noEmit --skipLibCheck`）
4. ✅ vitest 单元测试通过
5. ✅ E2E 测试覆盖（Playwright spec 存在）
6. ✅ i18n keys 完整（中英文 key 存在且正确）
7. ✅ dual-CHANGELOG 更新（root + vibex-fronted）
8. ✅ 页面集成标注清晰（改动文件列表）

---

## Epic 流水线顺序

```
E1 (Presence 集成) → E2 (SSE) → E3 (性能优化) → E4 (导出) → E5 (快捷键)
```

**E1 → E2 依赖**: E1 完成 → AI FeedbackPanel 组件就绪，E2 流式改进更顺畅  
**E3 → E4 依赖**: E3 性能优化后，大画布导出不会超时  
**E5 无前置依赖**: 可与 E3/E4 并行，但按顺序实现降低复杂度
