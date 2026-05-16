# VibeX 键盘快捷键文档

> Epic: [vibex-proposals-sprint37](https://github.com/MMXC/vibex) — F001 键盘快捷键完整实现

## 概述

VibeX 画布支持完整的键盘快捷键系统，通过 `src/hooks/useKeyboardShortcuts.ts` 提供全局键盘事件处理。

**快捷键焦点保护**: 快捷键在输入框（`<input>`, `<textarea>`, `<select>` 或 `contenteditable` 元素）聚焦时**不触发**，但 `Escape` 除外。

## 快捷键速查表

### 编辑操作

| 快捷键 | 功能 | Epic |
|--------|------|------|
| `Ctrl+Z` / `Cmd+Z` | 撤销 (undo) | E001 |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` 或 `Ctrl+Y` / `Cmd+Y` | 重做 (redo) | E001 |
| `Escape` | 取消选择 / 关闭对话框 | E001 |
| `Del` / `Backspace` | 删除选中的节点 | — |
| `Ctrl+A` / `Cmd+A` | 全选当前树的节点 | — |

### 节点操作

| 快捷键 | 功能 | Epic |
|--------|------|------|
| `N` (单独) | 在当前树新建节点 | — |
| `Ctrl+N` / `Cmd+N` | 在当前树新建节点 | E002 |
| `Ctrl+G` / `Cmd+G` | 快速生成 (Quick Generate) — 层级: Context → Flow → Component | E003 |

### 标签页切换

| 快捷键 | 功能 | Epic |
|--------|------|------|
| `Tab` | 切换到下一个标签页 | E002 |
| `Shift+Tab` | 切换到上一个标签页 | E002 |
| `Alt+1` | 切换到 Context 标签页 | — |
| `Alt+2` | 切换到 Flow 标签页 | — |
| `Alt+3` | 切换到 Component 标签页 | — |

### 画布导航

| 快捷键 | 功能 |
|--------|------|
| `+` / `=` | 放大 |
| `-` | 缩小 |
| `0` | 重置缩放 |
| `Ctrl+K` / `Cmd+K` 或 `/` | 打开搜索面板 |
| `Ctrl+Shift+R` / `Cmd+Shift+R` | 设计评审 (Design Review) |

### 上下文操作

| 快捷键 | 功能 | Epic |
|--------|------|------|
| `Ctrl+Shift+C` / `Cmd+Shift+C` | 确认选中的上下文节点 | F4.1 |
| `Ctrl+Shift+G` / `Cmd+Shift+G` | 从选中的节点生成上下文 | F4.2 |
| `?` | 显示键盘快捷键帮助覆盖层 | E003 |

## 实现详情

### 核心 Hook

**文件**: `src/hooks/useKeyboardShortcuts.ts`

```typescript
useKeyboardShortcuts({
  undo,              // Ctrl+Z → undo()
  redo,              // Ctrl+Y / Ctrl+Shift+Z → redo()
  onClearSelection,  // Escape → clear selection
  onNextTab,         // Tab → next tab
  onPrevTab,         // Shift+Tab → prev tab
  onNewNode,         // Ctrl+N → create new node
  onQuickGenerate,   // Ctrl+G → AI cascade generate
  onHelp,            // ? → show overlay
  enabled,           // toggle all shortcuts
});
```

### 动态快捷键 (P003)

系统通过 `src/stores/shortcutStore.ts` 支持用户自定义快捷键（通过 `shortcutStore.customShortcuts`）。用户可在运行时重新绑定快捷键。

**注意**: 以下动作为硬编码优先级，不会被动态绑定覆盖：
- undo, redo, open-search, zoom-in/out/reset, delete, selectall
- clear-selection, new-node, quick-generate, confirm-selected
- generate-context, switch-to-context/flow/component
- next-tab, prev-tab, design-review, help

### 单元测试

**文件**: `src/hooks/__tests__/useKeyboardShortcuts.test.ts`

- 57+ 测试用例，覆盖 `undo` / `redo` / `Escape` / `Tab` / `Ctrl+N` / `Ctrl+G` / `?`
- 覆盖率: Stmts 90.64%, Branches 93.79%, Lines 92.96%

### E2E 测试

**文件**: `tests/e2e/keyboard-shortcuts.spec.ts`

覆盖 F001 快捷键的 Playwright E2E 测试：

| 测试 ID | 描述 |
|---------|------|
| `F001-E001-1` | Ctrl+Z 不崩溃 |
| `F001-E001-2` | Ctrl+Y 不崩溃 |
| `F001-E001-3` | Ctrl+Shift+Z 不崩溃 |
| `F001-E001-4` | Escape 清除选择 |
| `F001-E002-1` | Tab 标签切换 |
| `F001-E002-2` | Shift+Tab 反向切换 |
| `F001-E002-3` | Ctrl+N 新建节点 |
| `F001-E003-1` | Ctrl+G 快速生成 |
| `F001-E003-2` | ? 显示帮助覆盖层 |
| `F001-E003-3` | 输入框聚焦时不触发 ? |
| `F001-smoke` | 所有快捷键连续触发 |

**运行**:
```bash
BASE_URL=http://localhost:3000 npx playwright test tests/e2e/keyboard-shortcuts.spec.ts
```

## Epic 关联

| Epic | 分支 | 功能 |
|------|------|------|
| E001 | `epic/f001-keyboard-shortcuts-undo-redo` | 核心 Hook + Undo/Redo/Cancel 单元测试 |
| E002 | `epic/f001-keyboard-shortcuts-tab-node` | Tab 切换 + Ctrl+N 新建节点 |
| E003 | `epic/f001-keyboard-shortcuts-tab-node` | Ctrl+G 快速生成 + ? 帮助覆盖层 |
| E004 | `epic/f001-keyboard-shortcuts-e2e` | E2E 测试 + 文档（本文件） |

## 已知约束

1. **焦点保护**: 快捷键在输入框聚焦时不触发（除 `Escape` 外）
2. **历史栈为空时**: Undo/Redo 调用不报错但无效果
3. **Tab 切换**: 仅在画布非输入框聚焦时触发
4. **Ctrl+G**: 需要 AI controller 配置；未配置时不报错但无操作
