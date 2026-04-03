# AGENTS.md — 开发约束

**项目**: vibex-canvas-tree-bulk-ops-20260329
**版本**: v1.0
**日期**: 2026-03-29
**角色**: Dev Agent 开发约束手册

---

## 📁 工作目录
- 项目路径: `/root/.openclaw/vibex/vibex-fronted`
- 文档目录: `/root/.openclaw/vibex/docs/vibex-canvas-tree-bulk-ops-20260329/`

---

## 🎯 核心功能点

| ID | 功能 | 验收标准 |
|----|------|----------|
| F001 | ⊞ 全选按钮 | 有节点时显示，点击后所有 checkbox 变为 checked |
| F002 | ⊠ 取消全选按钮 | 有选中项时显示，点击后所有 checkbox 取消勾选 |
| F003 | 🗑 清空画布按钮 | 有节点且非 readonly 时显示，红色，确认后清空画布，可撤销 |

---

## 🚫 红线约束

> **⚠️ 以下约束必须严格遵守，违反即驳回**

### R1: 禁止删除现有功能
- **不得删除** `multiSelectControls` 中的"全选"/"取消选择"/"删除"按钮
- **不得删除** `contextTreeControls` 中的任何现有按钮（AI生成/重新生成/继续→原型/手动新增）
- **不得修改** `selectAllNodes` 和 `clearNodeSelection` 的现有实现

### R2: 禁止绕过 React Hooks 规则
- `handleClearCanvas` 必须提取为 `useCallback`，不得内联在 `.onClick` 中调用 `useCanvasStore`
- 使用 `useCanvasStore.getState()` 获取 store 状态，**禁止**在事件处理器中调用 `useCanvasStore()` hook

### R3: 禁止硬编码魔法值
- 所有字符串文案（confirm 文本、aria-label）必须与 PRD 保持一致
- 颜色使用 `var(--color-danger, #ef4444)`，禁止硬编码十六进制

### R4: 撤销能力不得绕过
- `clearComponentCanvas` **必须**调用 `historyStore.recordSnapshot` 记录清空前状态
- **禁止**直接调用 `setComponentNodes([])` 清空（不记录历史）

### R5: TypeScript 编译零错误
- 所有新增代码必须通过 `tsc --noEmit`
- **禁止** `as any` 类型断言

### R6: 不得新增外部依赖
- 零新增 npm 包
- 零新增 CSS 变量
- 仅使用已有 `useCanvasStore`、`getHistoryStore`、`styles` 命名空间

---

## ✅ DoD（开发完成定义）

### 代码检查清单
- [ ] `clearComponentCanvas` action 在 `canvasStore.ts` 中新增
- [ ] `handleClearCanvas` 使用 `useCallback` 包裹
- [ ] 三个按钮在 `.contextTreeControls` 内正确条件渲染
- [ ] `.dangerButton` CSS 样式新增
- [ ] TypeScript 编译通过：`npx tsc --noEmit`
- [ ] ESLint 无 error：`npx eslint src/components/canvas/ComponentTree.tsx src/lib/canvas/canvasStore.ts`

### 功能检查清单
- [ ] 有节点时显示"⊞ 全选"按钮，点击后所有 checkbox 变为 checked
- [ ] 有选中项时显示"⊠ 取消全选"按钮，点击后所有 checkbox 取消勾选
- [ ] 有节点且非 readonly 时显示"🗑 清空画布"按钮（红色 `.dangerButton`）
- [ ] 点击清空画布弹出 confirm 对话框，内容包含"清空画布"
- [ ] 确认后画布显示"暂无组件"空状态
- [ ] 清空后可按 Ctrl+Z 恢复

### 回归检查清单
- [ ] 现有 AI 生成组件功能正常
- [ ] 现有重新生成组件树功能正常
- [ ] 现有手动新增组件功能正常
- [ ] 现有节点确认功能正常
- [ ] 现有框选功能正常
- [ ] 现有历史面板正常

---

## 📝 代码规范

### BEM 命名
```css
/* ✅ 正确 */
.dangerButton { ... }
.dangerButton:hover { ... }

/* ❌ 错误 */
.bulkOpsButton { ... }
.clearCanvasBtn { ... }
```

### Zustand Store 调用模式
```typescript
// ✅ 正确：事件处理器中用 getState()
const handleClearCanvas = useCallback(() => {
  if (window.confirm('确定清空画布？所有组件将被删除。')) {
    useCanvasStore.getState().clearComponentCanvas();
  }
}, []);

// ❌ 错误：在事件处理器中调用 useCanvasStore hook
const clearCanvas = useCanvasStore((s) => s.clearComponentCanvas);
// ... 然后 onClick={clearCanvas} // 违反 hooks 规则
```

### Aria-Label 规范
```tsx
// ✅ 正确：描述性 aria-label
aria-label="全选所有组件"
aria-label="取消全选所有组件"
aria-label="清空画布"

// ❌ 错误：仅图标无描述
aria-label="全选"
aria-label="清空"
```

---

## 🔧 调试指南

### 清空画布不生效？
1. 检查 `clearComponentCanvas` 是否已导出
2. 检查 `getHistoryStore()` 是否在模块初始化时已实例化
3. 检查 `set({ componentNodes: [] })` 是否正确

### 撤销不生效？
1. 检查 `historyStore.recordSnapshot` 是否在清空前调用
2. 检查 historyStore 是否有 maxSize 限制导致快照被丢弃

### 按钮不显示？
1. 检查 `hasNodes` 条件：`componentNodes.length > 0`
2. 检查 `!readonly` 条件：清空画布按钮必须在非 readonly 模式
3. 检查条件渲染是否在正确的父容器内

---

## 📂 参考文件

| 文件 | 路径 | 用途 |
|------|------|------|
| PRD | `docs/vibex-canvas-tree-bulk-ops-20260329/prd.md` | 功能详细规格 |
| 架构 | `docs/vibex-canvas-tree-bulk-ops-20260329/architecture.md` | 架构设计 |
| canvasStore | `src/lib/canvas/canvasStore.ts` | 状态管理 |
| ComponentTree | `src/components/canvas/ComponentTree.tsx` | UI 组件 |
| canvas.module.css | `src/components/canvas/canvas.module.css` | 样式 |
| historySlice | `src/lib/canvas/historySlice.ts` | 撤销历史 |

---

*AGENTS.md 创建时间：2026-03-29 12:56 GMT+8*
*architect subagent: heartbeat-spawn-architect-bulkops*
