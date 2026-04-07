# AGENTS.md: proposals-20260401-9 — Sprint 3

**Agent**: architect
**Date**: 2026-04-02
**Project**: proposals-20260401-9

---

## 角色与任务分配

| Agent | 负责 Epic | 工时 | 产出 |
|--------|-----------|------|------|
| **dev-1** | E1 (Checkbox) | 4-6h | 修改文件 + Vitest |
| **dev-2** | E2 (抽屉) | 8-10h | 修改文件 + Playwright |
| **dev-1 或 dev-3** | E3 (响应式) | 5-7h | CSS + MobileDrawer |
| **dev-1 或 dev-3** | E4 (快捷键) | 3-4h | Keyboard hook |
| **tester** | 全 Epic 验收 | 4h | gstack + Playwright 报告 |

**总工时**: 24-31h（含测试）

---

## dev-1: E1 Checkbox 修复

### 任务清单

- [ ] **D1.1**: `canvasStore.ts` 新增 `confirmContextNode` action
- [ ] **D1.2**: `BoundedContextTree.tsx` 第 239 行，ContextCard checkbox onChange 改为调用 `confirmContextNode`
- [ ] **D1.3**: `BusinessFlowTree.tsx` FlowCard 顶 checkbox 语义修正（调用 confirm 而非 toggleSelect）
- [ ] **D1.4**: `BusinessFlowTree.tsx` SortableStepRow 新增确认 checkbox + `.stepConfirmCheckbox` 样式
- [ ] **D1.5**: `tsc --noEmit` 验证无错误
- [ ] **D1.6**: Vitest 测试通过 4/4

### 关键代码片段

```typescript
// canvasStore.ts
confirmContextNode: (nodeId: string) => {
  set((state) => ({
    contextNodes: state.contextNodes.map((n) =>
      n.nodeId === nodeId
        ? { ...n, isActive: true, status: 'confirmed' }
        : n
    ),
  }));
},
```

### 验收

- Vitest 4/4 通过
- Playwright: 点击 checkbox 两次，confirmed 在 true/false 间切换

---

## dev-2: E2 消息抽屉

### 任务清单

- [ ] **D2.1**: 新建 `src/lib/canvas/canvasEvents.ts`（事件类型定义）
- [ ] **D2.2**: `canvasStore.ts` 新增 `submitCanvas()` + `openRightDrawer()` action
- [ ] **D2.3**: `CommandInput.tsx` executeCommand 中调用 `openRightDrawer()`
- [ ] **D2.4**: Playwright 测试文件（7 个用例）
- [ ] **D2.5**: `tsc --noEmit` 验证无错误

### 关键代码片段

```typescript
// canvasEvents.ts
export type CanvasEventType = 'canvas:submit' | 'canvas:gen-context' | 'canvas:gen-flow';

// canvasStore.ts
submitCanvas: () => {
  console.log('[Command] /submit triggered');
  addCommandMessage('/submit', '提交画布到后端');
},
openRightDrawer: () => { set({ rightDrawerOpen: true }); },
```

### 验收

- Playwright: `/submit` → 控制台出现 `[Command] /submit triggered`
- Playwright: 输入 `/` → 抽屉自动展开
- Playwright: 点选节点后 `/` → `/update-card` 出现在命令列表

---

## dev (E3 或共享): E3 响应式布局

### 任务清单

- [ ] **D3.1**: 新建 `src/hooks/useResponsiveMode.ts`
- [ ] **D3.2**: 新建 `src/components/canvas/MobileDrawer.tsx` + `mobileDrawer.module.css`
- [ ] **D3.3**: `CanvasPage.tsx` 集成 `useResponsiveMode`，移动端 Tab 渲染
- [ ] **D3.4**: `canvas.module.css` 新增媒体查询（768px / 375px）
- [ ] **D3.5**: Tab 栏样式调整（移动端显示，桌面端隐藏）
- [ ] **D3.6**: Vitest `useResponsiveMode.test.ts` 通过

### 关键代码片段

```typescript
// useResponsiveMode.ts
export function useResponsiveMode() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
}
```

### 验收

- Playwright 1024px: 截图验证两列
- Playwright 375px: 截图验证 Tab 导航 + 单列
- Playwright 375px: 点击 Tab 切换面板

---

## dev (E4 或共享): E4 快捷键

### 任务清单

- [ ] **D4.1**: 新建 `src/hooks/useKeyboardShortcuts.ts`（或扩展现有）
- [ ] **D4.2**: `CanvasPage.tsx` 绑定 `onConfirmSelected` + `onGenerateContext`
- [ ] **D4.3**: `ShortcutHintPanel.tsx` SHORTCUTS 追加 Ctrl+Shift+C/G
- [ ] **D4.4**: Vitest 测试通过

### 关键代码片段

```typescript
// useKeyboardShortcuts.ts
if (e.ctrlKey && e.shiftKey && e.key === 'C') {
  e.preventDefault();
  onConfirmSelected?.();
}
if (e.ctrlKey && e.shiftKey && e.key === 'G') {
  e.preventDefault();
  onGenerateContext?.();
}
```

### 验收

- Playwright: 按 Ctrl+Shift+C → 选中节点 confirmed = true
- Playwright: 按 Ctrl+Shift+G → 上下文数量 > 0

---

## tester: 全 Epic 验收

### gstack 强制验证

```bash
export CI=true
export BROWSE_SERVER_SCRIPT=/root/.openclaw/gstack/browse/src/server.ts
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
B="/root/.openclaw/workspace/skills/gstack-browse/bin/browse"

# 启动
$B goto http://localhost:3000/canvas
$B wait 2000
$B screenshot /tmp/sprint3-e1-before.png

# E1: Checkbox
$B click "[aria-label='展开上下文树']"
$B wait 1000
$B click "[role='checkbox']:first-of-type"
$B wait 500
$B eval "document.querySelector('[class*=\"nodeConfirmed\"]') ? 'PASS' : 'FAIL'"

# E2: /submit
$B fill "[aria-label*='命令']" "/submit"
$B press "[aria-label*='命令']" "Enter"
$B wait 500
$B eval "window.__eventLog ? 'PASS' : 'CHECK'"

# E3: 768px 断点
$B setViewportSize 1024 768
$B wait 500
$B screenshot /tmp/sprint3-e3-768.png

# E4: 快捷键
$B setViewportSize 1280 800
$B goto http://localhost:3000/canvas
$B wait 1000
$B keyboard.press "Control+Shift+C"
$B wait 500
$B screenshot /tmp/sprint3-e4-shortcut.png
```

### Playwright 验收测试

所有 PRD 断言对应的 Playwright 测试：

```typescript
// E1
test('confirmed toggles both directions');
test('subStepsConfirmed after FlowCard toggle');

// E2
test('/submit triggers event');
test('filteredCmds < allCmds');

// E3
test('768px: 2 columns');
test('375px: 1 column with tabs');

// E4
test('Ctrl+Shift+C confirms card');
test('Ctrl+Shift+G generates context');
test('/ opens command panel');
```

---

## 协作约定

1. **E1 和 E2 可完全并行** — 修改不同文件，共享 canvasStore
2. **E3 和 E4 可完全并行** — 修改不同文件
3. **canvasStore 修改需协调** — E1/E2/E4 都写 canvasStore，谁先 merge 谁为准，其他 rebase
4. **gstack 验证在 dev 完成自测后执行** — tester 负责
5. **每日 standup**: 同步进度，识别阻塞

---

## 验收标准（汇总）

| # | 条件 | 验证者 |
|---|------|--------|
| 1 | E1: Vitest 4/4 + Playwright checkbox 双向切换 | dev-1 + tester |
| 2 | E2: Playwright 7/7 通过 + /submit 日志可查 | dev-2 + tester |
| 3 | E3: Playwright 5/5 断点测试通过 | dev + tester |
| 4 | E4: Playwright 3/3 快捷键测试通过 | dev + tester |
| 5 | gstack 截图验证 4 Epic UI | tester |
| 6 | TypeScript 0 error | CI |
| 7 | ESLint 0 error | CI |
