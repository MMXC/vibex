# AGENTS.md — VibeX Canvas Feature Gap Development Constraints

> **项目**: vibex-canvas-feature-gap-20260329  
> **版本**: v1.0.0  
> **日期**: 2026-03-29  
> **Owner**: architect agent  
> **生效范围**: 所有参与此项目的 Agent（dev / tester / reviewer）

---

## 🔴 红线约束（绝对禁止）

> 以下约束任何人不得以任何理由绕过。违反即触发 Code Review 驳回。

### 1. 不破坏现有功能
- ❌ **禁止删除** `CanvasPage`、`TreePanel`、`BoundedContextTree`、`BusinessFlowTree`、`ComponentTree` 现有渲染逻辑
- ❌ **禁止删除** 现有 `useCanvasStore` 中任何已存在的 slice
- ❌ **禁止删除** 现有 `confirmationStore` 中的 `ConfirmationSnapshot` 和 `undo/redo` 方法（如存在）
- ❌ **禁止删除** 现有 `@xyflow/react` 导入或现有 ReactFlow 实例配置
- ❌ 回归测试必须 100% 通过后再提交 PR

### 2. 不引入破坏性变更
- ❌ **禁止修改** `src/lib/canvas/types.ts` 中已有的类型定义（`Phase`、`TreeType`、`NodeStatus` 等）
- ❌ **禁止修改** `src/lib/canvas/canvasStore.ts` 中已存在的 slice 结构（phase、nodes、panel state、drag slice）
- ❌ **禁止删除** `Persist` middleware；如需调整 `partialize`，新增字段且不删除已有字段
- ❌ 禁止修改 `package.json` 中的已有依赖版本（zustand、@xyflow/react、html-to-image）
- ❌ 不修改 `next.config.js` 中的输出配置（output: 'export' 相关）

### 3. 数据安全
- ❌ 禁止在代码中硬编码 API 地址（统一使用 `NEXT_PUBLIC_API_URL` 环境变量）
- ❌ 禁止将 `localStorage` 数据明文发送到第三方 API
- ❌ 禁止在日志中打印用户节点数据（业务数据脱敏）

### 4. 类型安全
- ❌ 禁止使用 `any` 类型（除 `catch (e: any)` 外）
- ❌ 禁止使用 `// @ts-ignore`
- ❌ 禁止使用 `as unknown as X` 做类型断言

---

## 🟡 编码规范

### 1. 文件组织

| 目录 | 规范 |
|------|------|
| `src/components/canvas/features/` | 新功能组件，一个功能一个文件 |
| `src/hooks/canvas/` | 新 Hooks，一个 hook 一个文件 |
| `src/lib/canvas/` | 新增工具函数；不修改已有文件（types.ts 除外） |
| `src/__tests__/canvas/` | 单元/集成测试 |

### 2. 新增 Store 字段规范

```typescript
// ✅ 正确：在 canvasStore.ts 末尾追加新 slice
const useCanvasStore = create<CanvasStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ... 现有 slice ...

        // === History Slice (新增)
        history: { /* ... */ },
        recordAction: (treeType, label) => { /* ... */ },

        // === Search Slice (新增)
        search: { /* ... */ },
        openSearch: () => set((s) => ({ search: { ...s.search, isOpen: true } })),

        // === Shortcut Slice (新增)
        isShortcutPanelOpen: false,
        toggleShortcutPanel: () => set((s) => ({ isShortcutPanelOpen: !s.isShortcutPanelOpen })),
      }),
      // ...
    ),
    { name: 'canvasStore' }
  )
);

// ❌ 错误：修改现有 slice 字段类型
```

### 3. 组件规范

```typescript
// ✅ 正确：Props 接口 + JSDoc
interface SearchDialogProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 选中结果回调 */
  onSelect: (result: SearchResult) => void;
}

// ❌ 错误：无类型 Props
const SearchDialog = ({ open, onClose }) => { ... }
```

### 4. 导入规范

```typescript
// ✅ 正确：使用路径别名
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { useKeyboardShortcuts } from '@/hooks/canvas/useKeyboardShortcuts';
import type { TreeType } from '@/lib/canvas/types';

// ❌ 错误：相对路径过深
import { useCanvasStore } from '../../../../../lib/canvas/canvasStore';
```

### 5. 快捷键实现规范

```typescript
// ✅ 正确：焦点隔离，input 聚焦时跳过画布快捷键
useHotkeys(
  '/',
  () => { if (!isInputFocused()) openSearch(); },
  { preventDefault: true }
);

// ❌ 错误：无焦点判断，影响文本输入
useHotkeys('/', openSearch);
```

### 6. Undo/Redo 规范

```typescript
// ✅ 正确：操作后记录，拖拽节流，深度限制 50 步
const recordAction = useCallback(
  debounce((treeType: TreeType, label: string) => {
    if (past.length >= 50) past.shift();  // 超限丢弃最旧
    set({ history: { ...past, snapshot } });
  }, 300),
  [past]
);

// ❌ 错误：拖拽中实时记录历史（性能杀手）
onDragMove: () => recordAction(),  // ❌ 禁止
```

---

## 🟢 代码质量门（提交前必须通过）

### Pre-commit 检查清单

```bash
# 1. 类型检查
npx tsc --noEmit

# 2. ESLint
npx eslint src/components/canvas/features/ --ext .ts,.tsx
npx eslint src/hooks/canvas/ --ext .ts,.tsx

# 3. 测试覆盖（新功能）
npx vitest run src/__tests__/canvas/features/

# 4. 构建验证
cd vibex-fronted && npm run build

# 5. Playwright E2E（可选，有 CI 时执行）
npx playwright test --project=chromium
```

### PR 提交信息规范

```
feat(canvas): add undo/redo with history slice

What:
- Add history slice to canvasStore with past/future stacks
- Implement recordAction with 50-step depth limit
- Add UndoRedoButtons component to ProjectBar
- Bind Ctrl+Z / Ctrl+Shift+Z via useKeyboardShortcuts

Why:
- Closes G1 (P0): Undo/Redo is the #1 missing feature per analysis.md

Tested:
- Ctrl+Z undo last node creation ✓
- Ctrl+Shift+Z redo ✓
- Button disabled when nothing to undo ✓
- 60 operations still allows 50-step undo ✓
```

---

## 📁 文件变更白名单

> 以下文件在此次项目中**允许修改**。修改任何其他文件需经过 Coord 确认。

### 允许修改的文件

| 文件路径 | 修改原因 |
|---------|---------|
| `vibex-fronted/src/lib/canvas/canvasStore.ts` | 新增 History/Search/Shortcut slice |
| `vibex-fronted/src/lib/canvas/types.ts` | 新增 HistorySnapshot / SearchResult 类型 |
| `vibex-fronted/src/components/canvas/ProjectBar.tsx` | 添加 Undo/Redo/Export/History 按钮 |
| `vibex-fronted/src/components/canvas/CanvasPage.tsx` | 集成新 feature 组件 |
| `vibex-fronted/src/components/canvas/features/*.tsx` | 新功能组件（新建） |
| `vibex-fronted/src/components/canvas/nodes/StickyNoteNode.tsx` | 新增贴纸节点 |
| `vibex-fronted/src/hooks/canvas/*.ts` | 新 Hooks（新建） |
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts` | 新增快照/导出 API 方法 |
| `vibex-fronted/package.json` | 新增依赖（fuse.js / @dnd-kit/sortable / react-hotkeys-hook） |
| `vibex-fronted/src/styles/globals.css` | 新增 canvas feature 相关样式 |
| `vibex-fronted/src/__tests__/canvas/**/*.ts` | 新增测试（新建目录） |

### 禁止修改的文件

| 文件路径 | 原因 |
|---------|------|
| `vibex-fronted/src/stores/designStore.ts` | 无关功能 store |
| `vibex-fronted/src/stores/confirmationStore.ts` | 无关功能 store |
| `vibex-fronted/src/components/canvas/BoundedContextTree.tsx` | 核心树组件，保持稳定 |
| `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx` | 核心树组件，保持稳定 |
| `vibex-fronted/src/components/canvas/ComponentTree.tsx` | 核心树组件，保持稳定 |
| `vibex-fronted/src/components/canvas/TreePanel.tsx` | 核心面板组件，保持稳定 |
| `vibex-fronted/src/lib/canvas/cascade/*` | 级联状态管理，与 feature gap 无关 |
| `vibex-fronted/next.config.js` | 部署配置，禁止修改 |

---

## 📦 依赖管理

### 新增依赖（安装命令）

```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm add fuse.js @dnd-kit/sortable @dnd-kit/core react-hotkeys-hook
pnpm add -D @tanstack/react-virtual  # 搜索结果虚拟化
```

### 依赖安装后必做

1. ✅ 运行 `pnpm build` 验证无构建错误
2. ✅ 运行 `npx tsc --noEmit` 验证类型正确
3. ✅ 在 `CLAUDE.md` 中记录新增依赖

---

## ⚠️ 风险预警

| 风险 | 缓解措施 | 触发条件 |
|------|---------|---------|
| 历史栈内存爆炸 | `maxDepth: 50`，超出自动 shift | 连续快速操作 > 50 次 |
| localStorage 配额 | `partialize` 仅存核心字段，节点数量大时切换纯 API | 节点数 > 500 且持续操作 |
| ReactFlow 与 @dnd-kit 拖拽冲突 | `useDndSortable` 在拖拽开始时 `suspendReactFlowEvents()` | 拖拽时出现闪烁 |
| Fuse.js 搜索性能 | `debounce 200ms` + 结果虚拟化 | 节点数 > 1000 |
| 快捷键与浏览器冲突 | `preventDefault: true` + 焦点隔离 | 按 / 无响应时检查 |

---

## 📞 升级路径

遇到以下情况，**立即停止开发**并向 Coord 报告：

1. 修改了「禁止修改的文件」列表中的文件
2. 发现新功能与现有功能产生视觉/交互冲突
3. 构建失败且无法在 30 分钟内解决
4. 新增依赖导致 `pnpm build` 体积增加 > 10%

---

*本文档由 architect agent 生成 | 2026-03-29*
*Reviewer 负责验证所有 PR 符合本约束*
