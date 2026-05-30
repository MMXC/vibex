# Architecture — VibeX Sprint 43

> **Agent**: coord (architect-review self-implement — architect CLI-dispatch ghost)
> **日期**: 2026-05-30
> **项目**: vibex-proposals-sprint43
> **PRD**: docs/vibex-proposals-sprint43/prd.md
> **代码状态核实**: 已执行（见 Section 5）

---

## 1. 架构决策：Presence DDSCanvasPage 集成（E1）

### 当前状态（代码核实）
- ✅ `presenceStore.ts` 存在 — Zustand store，remoteUsers[], cursor positions
- ✅ `useWebSocketPresence.ts` 存在 — WebSocket-backed presence hook，实现 onPresence 回调
- ✅ `PresenceOverlay.tsx` 存在 — 画布绝对定位 overlay
- ❌ `useWebSocketPresence` NOT imported in DDSCanvasPage — Firebase `usePresence` still active
- ⚠️ DDSCanvasPage has Firebase `usePresence` + `PresenceAvatars` + `RemoteCursor` imports (Sprint42 partial implementation)

### 决策：迁移 Firebase → WebSocket Presence
**选择**: 完全替换 Firebase presence → WebSocket presence

| 方案 | 优点 | 缺点 |
|------|------|------|
| A: 保留 Firebase + 添加 WS | 功能并存 | 两套系统增加 bundle size；Firebase 配置复杂性 |
| B: 完全替换 Firebase → WebSocket | 代码量减少；单一系统 | 需要移除现有 Firebase presence 逻辑 |

**推荐 B**：Sprint41 已选 WebSocket 路线，Firebase 不再是首选。

### 实施决策
1. DDSCanvasPage: `import { useWebSocketPresence }` → 替换 `import { usePresence }`
2. 替换 `usePresence(projectId, userId)` → `useWebSocketPresence({ projectId, userId, userName })`
3. 渲染: `<PresenceOverlay />` → 替换 `<PresenceAvatars />` + `<RemoteCursor />`
4. 移除 Firebase presence import

---

## 2. 架构决策：AI SSE 流式（E2）

### 当前状态（代码核实）
- ✅ `AgentFeedbackPanel.tsx` 存在 — AI 反馈组件（非流式）
- ✅ `src/app/ai/page.tsx` 存在 — AI 页面
- ❌ `useAgentFeedback.ts` 不存在 — AI feedback 在 AgentFeedbackPanel 内直接实现
- ⚠️ 后端 SSE 能力：需确认 vibex-backend 是否已有 `/api/ai/stream` 端点

### 方案选择

| 方案 | 描述 | 风险 |
|------|------|------|
| A: SSE 前端 | 前端 EventSource/ReadableStream 解析 SSE | 中：需要后端端点 |
| B: WebSocket streaming | 复用现有 ws.vibex.top WebSocket 通道 | 高：需扩展 WS 协议 |
| C: Server-Sent Events (SSE) | 后端新增 SSE 端点，前端 fetch+stream | 低：HTTP/2 友好 |

**推荐 C**：SSE 是 HTTP 标准，简单可靠，与现有 REST API 风格一致。

### 实施决策
1. 后端：`POST /api/ai/generate` 支持 `stream: true` 参数 → 返回 `text/event-stream`
2. 前端：`AgentFeedbackPanel` 支持 `isStreaming` prop → 逐字追加显示
3. 双模式：`streamingMode` state toggle，自动检测 response Content-Type

---

## 3. 架构决策：Canvas 性能优化（E3）

### 当前状态（代码核实）
- ⚠️ `viewportBoundsStore` 需确认是否存在（Sprint42 E4 引入）
- ✅ `@xyflow/react ^12.10.1` 内置 `MiniMap`, `Controls`, `Background`, `Panel`

### 方案选择

| 方案 | 描述 | 风险 |
|------|------|------|
| A: 只读视口裁剪 | `onlyRenderVisibleElements={true}` | 低：@xyflow/react 原生支持 |
| B: 节点虚拟化 | 只渲染视口内节点 DOM | 中：需自定义节点渲染器 |
| C: 分片加载 | IndexedDB 分片懒加载 | 中：需协调渲染时机 |

**推荐 A**：最简单有效。@xyflow/react 的 `onlyRenderVisibleElements` 在内部实现节点 DOM 懒挂载，无需自定义渲染器。

### 实施决策
1. `DDSFlow.tsx` 添加 `onlyRenderVisibleElements={true}` prop
2. 验证 `viewportBoundsStore` 存在且与 DDSFlow viewport 同步
3. 性能基准测试：100 节点画布 before/after 对比

---

## 4. 架构决策：画布导出（E4）

### 当前状态（代码核实）
- ✅ `html-to-image` 在 package.json（`toPng`, `toSvg`）
- ❌ `jspdf` 不在 package.json（PDF 导出需要）
- ✅ DDSToolbar 存在

### 方案选择

| 方案 | 工具 | 风险 |
|------|------|------|
| A: html-to-image + jspdf | PNG/SVG: html-to-image; PDF: html-to-image → jspdf | 低 |
| B: canvas.toDataURL + pdf-lib | 原生 canvas API + pdf-lib | 中：需手动布局 |
| C: 截图服务 | 外部截图 API | 高：依赖外部服务 |

**推荐 A**：html-to-image 已安装，jspdf 体积小（~200KB），实现最简单。

### 实施决策
1. 添加 `jspdf` 依赖
2. 新增 `src/lib/canvas/export.ts` — `exportToPNG`, `exportToSVG`, `exportToPDF`
3. DDSToolbar 添加 Export 按钮 + DropdownMenu（PNG / SVG / PDF）
4. i18n keys: exportBtn, exportPNG, exportSVG, exportPDF

---

## 5. 代码状态核实记录

### E1: Presence DDSCanvasPage
```bash
# ✅ 确认文件存在
ls src/lib/collaboration/presenceStore.ts      # exists
ls src/lib/collaboration/useWebSocketPresence.ts # exists
ls src/components/dds/presence/PresenceOverlay.tsx # exists
ls src/components/dds/DDSCanvasPage.tsx        # exists, has Firebase usePresence

# ❌ Firebase → WebSocket 未完成
grep "useWebSocketPresence" src/components/dds/DDSCanvasPage.tsx  # empty = 未集成
grep "usePresence" src/components/dds/DDSCanvasPage.tsx           # exists = Firebase 仍在用
```

### E2: AI SSE
```bash
ls src/components/agent/AgentFeedbackPanel.tsx  # exists
ls src/hooks/useAgentFeedback.ts               # ❌ NOT exists
ls src/app/ai/page.tsx                        # exists
```

### E3: Performance
```bash
grep "viewportBoundsStore" src/ -r  # Sprint42 E4 引入，需确认
```

### E4: Export
```bash
grep "html-to-image" package.json  # ✅ 已安装
grep "jspdf" package.json          # ❌ 需添加
```

### E5: Shortcuts
```bash
grep "shortcutCustomization" src/stores/userPreferencesStore.ts  # ✅ 已存在
```

---

## 6. 技术风险表

| Epic | 风险 | 可能性 | 影响 | 缓解 |
|------|------|--------|------|------|
| E1 | DDSCanvasPage 重构导致回归 | 中 | 高 | 回归测试 + vitest |
| E2 | 后端 SSE 端点不存在 | 高 | 中 | E2 优先确认后端能力 |
| E3 | 视口裁剪导致闪烁 | 低 | 低 | 渐进式激活 |
| E4 | jspdf 添加导致 bundle size | 低 | 低 | tree-shaking 优化 |
| E5 | 快捷键冲突检测复杂 | 中 | 中 | 复用 ShortcutManager |
