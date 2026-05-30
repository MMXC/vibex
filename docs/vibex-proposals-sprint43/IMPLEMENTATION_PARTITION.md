# IMPLEMENTATION_PARTITION — VibeX Sprint 43

> **Agent**: coord (architect-review self-implement)
> **日期**: 2026-05-30
> **项目**: vibex-proposals-sprint43

---

## Epic 流水线

```
E1 (Presence 集成) → E2 (SSE 流式) → E3 (性能优化) → E4 (导出) → E5 (快捷键)
```

---

## E1: Presence DDSCanvasPage 集成收尾

**开发分支**: `epic/s43-e1-presence-dds-integration`  
**基于**: `origin/main`  
**工作目录**: `/root/.openclaw/vibex`

### DoD 清单
- [ ] DDSCanvasPage import `useWebSocketPresence` from `@/lib/collaboration/useWebSocketPresence`
- [ ] 移除 `usePresence` import from `@/lib/firebase/presence`
- [ ] 替换 `const { isAvailable } = usePresence(projectId, userId)` → `useWebSocketPresence({ projectId, userId, userName })`
- [ ] 渲染 `<PresenceOverlay />` 替换 `<PresenceAvatars />` + `<RemoteCursor />`
- [ ] E4 cursorVisible 设置联动 PresenceOverlay 显示/隐藏
- [ ] `grep -rn "usePresence" vibex-fronted/src/` 返回空
- [ ] vitest: `presenceStore.test.ts` 4/4 PASS
- [ ] TypeScript 编译通过

### 关键文件
- `src/components/dds/DDSCanvasPage.tsx` — 主集成点
- `src/lib/collaboration/presenceStore.ts` — store（已有）
- `src/lib/collaboration/useWebSocketPresence.ts` — hook（已有）
- `src/components/dds/presence/PresenceOverlay.tsx` — overlay（已有）
- `src/stores/userPreferencesStore.ts` — cursorVisible（已有）

### 测试策略
- vitest: presenceStore 状态测试（4 cases）
- E2E: 协作光标显示测试

---

## E2: AI Agent 流式响应界面（SSE）

**开发分支**: `epic/s43-e2-ai-sse-streaming`  
**基于**: `origin/main`  
**工作目录**: `/root/.openclaw/vibex`

### DoD 清单
- [ ] 后端 `POST /api/ai/generate` 支持 `stream: true` → `text/event-stream`
- [ ] `curl http://localhost:8787/api/ai/generate -d '{"message":"hi","stream":true}'` 返回 event-stream
- [ ] 前端 `AgentFeedbackPanel` 支持 `isStreaming` mode → 逐字追加
- [ ] 流式/非流式双模式兼容（Content-Type 检测）
- [ ] loading 状态：响应开始前显示"正在生成..."
- [ ] AbortController 取消按钮
- [ ] E2E test: `tests/e2e/ai-streaming.spec.ts`
- [ ] dual-CHANGELOG 更新

### 关键文件
- `vibex-backend/src/routes/ai.ts` — SSE 端点
- `src/components/agent/AgentFeedbackPanel.tsx` — 流式渲染
- `src/hooks/useStreamingAgent.ts` — 新建

### 测试策略
- E2E: AI streaming response test (Playwright, 5s timeout)

---

## E3: Canvas 大型画布性能优化

**开发分支**: `epic/s43-e3-canvas-perf`  
**基于**: `origin/main`  
**工作目录**: `/root/.openclaw/vibex`

### DoD 清单
- [ ] `DDSFlow.tsx` 添加 `onlyRenderVisibleElements={true}`
- [ ] `viewportBoundsStore` 与 DDSFlow viewport 同步
- [ ] 100节点画布首次加载 < 2s（Performance API）
- [ ] 滚动 FPS > 30
- [ ] vitest: viewportBounds 计算正确性（3+ tests）
- [ ] 回归测试：E1-E5 功能无退化
- [ ] dual-CHANGELOG 更新

### 关键文件
- `src/components/dds/DDSFlow.tsx` — 视口裁剪激活
- `src/lib/canvas/viewportBoundsStore.ts` — 视口边界 store

### 测试策略
- vitest: viewportBounds 计算单元测试
- 手动：Chrome DevTools Performance panel

---

## E4: 画布导出（PNG/SVG/PDF）

**开发分支**: `epic/s43-e4-canvas-export`  
**基于**: `origin/main`  
**工作目录**: `/root/.openclaw/vibex`

### DoD 清单
- [ ] `pnpm add jspdf` 添加依赖
- [ ] `src/lib/canvas/export.ts` — exportToPNG / exportToSVG / exportToPDF
- [ ] DDSToolbar Export 按钮 + DropdownMenu
- [ ] i18n keys: exportBtn, exportPNG, exportSVG, exportPDF
- [ ] 导出 loading spinner
- [ ] vitest: export logic 3+ tests
- [ ] dual-CHANGELOG 更新

### 关键文件
- `src/lib/canvas/export.ts` — 新建
- `src/components/dds/toolbar/DDSToolbar.tsx` — Export 按钮

### 测试策略
- vitest: export functions (mock canvas)
- E2E: export spec（可选）

---

## E5: 键盘快捷键自定义面板

**开发分支**: `epic/s43-e5-shortcut-custom`  
**基于**: `origin/main`  
**工作目录**: `/root/.openclaw/vibex`

### DoD 清单
- [ ] Settings 页面新增 Shortcuts section
- [ ] 快捷键录制 UI: keydown → 绑定 action
- [ ] toggle 启用/禁用单个快捷键
- [ ] `ShortcutManager` 从 `userPreferencesStore.shortcutCustomization` 读取
- [ ] 冲突检测（复用 ShortcutManager 已有逻辑）
- [ ] IndexedDB 持久化（`persistence.ts` 写入）
- [ ] i18n: shortcuts namespace keys
- [ ] vitest: ShortcutManager 配置读取 + 冲突检测（5+ tests）
- [ ] dual-CHANGELOG 更新

### 关键文件
- `src/app/settings/page.tsx` — Shortcuts section
- `src/lib/keyboard/shortcutManager.ts` — 配置化改造
- `src/stores/userPreferencesStore.ts` — shortcutCustomization（已有）

### 测试策略
- vitest: ShortcutManager 单元测试
- 手动：Settings → Shortcuts → 绑定/解绑

---

## 分支命名规范

```
epic/s43-e1-presence-dds-integration
epic/s43-e2-ai-sse-streaming
epic/s43-e3-canvas-perf
epic/s43-e4-canvas-export
epic/s43-e5-shortcut-custom
```

## commit message 规范
```
feat(S43-P001-E1): integrate useWebSocketPresence in DDSCanvasPage
feat(S43-P002-E2): add SSE streaming to AgentFeedbackPanel
perf(S43-P003-E3): enable onlyRenderVisibleElements for large canvas
feat(S43-P004-E4): add PNG/SVG/PDF export
feat(S43-P005-E5): add keyboard shortcut customization panel
```
