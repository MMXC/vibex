# Implementation Plan: VibeX 系统性风险治理

**项目**: vibex-analyst-proposals-20260402_061709
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## Sprint 排期总览

| Sprint | 内容 | 工时 | Epic |
|--------|------|------|------|
| **Sprint 0** | D-001 TS错误清理 + D-002 Jest稳定 | 0.5天 | Dev前置 |
| **Sprint 1** | E1 三树选择模型统一 | 4-6h | E1 |
| **Sprint 2** | E2 canvasStore 拆分（最大风险） | 8-12h | E2 |
| **Sprint 3** | E3 Canvas信息架构 + E4 交互反馈 | 6-8h | E3+E4 |
| **Sprint 4** | E5 测试覆盖率提升 + E6 PRD模板 | 8-10h + 3-4h | E5+E6 |
| **Sprint 5** | E7 设计系统一致性审计 | 6-8h | E7 |

**总计**: 39-54h（约 5-6 个 Sprint）

---

## Sprint 0: 前置清理（0.5天）

### 步骤 S0.1: D-001 TypeScript 错误清理

```bash
cd vibex-fronted
npm run build 2>&1 | grep "error TS"
```

修复 9 个预存 TS 错误，分类处理：
- 废弃 API → 升级或替换
- 类型定义缺失 → 补充 inline 类型
- 路径别名错误 → 修复 tsconfig.json

### 步骤 S0.2: D-002 Jest 稳定性

```javascript
// jest.config.js 添加
{
  maxWorkers: 2,
  workerIdleMemoryLimit: '512MB',
  testTimeout: 10000,
}
```

验证: `npm test -- --passWithNoTests` 全部通过。

---

## Sprint 1: E1 — 三树选择模型统一（4-6h）

### 步骤 1.1: 定义 NodeState 枚举

**新文件**: `src/components/canvas/types/NodeState.ts`

```typescript
export enum NodeState {
  Idle = 'idle',
  Selected = 'selected',
  Confirmed = 'confirmed',
  Error = 'error',
}

export const NodeStatus = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Error: 'error',
} as const;
export type NodeStatusType = typeof NodeStatus[keyof typeof NodeStatus];
```

### 步骤 1.2: BoundedContextTree 修复

- 删除 selectionCheckbox（绝对定位）
- 保留 confirmCheckbox 作为唯一 checkbox
- 添加确认状态绿色 ✓ SVG
- checkbox 移到 type badge 前

### 步骤 1.3: ComponentTree 修复

- checkbox 移到 type badge 前
- 移除 div 包裹，inline input
- 保留 activeBadge SVG 确认反馈

### 步骤 1.4: nodeUnconfirmed 黄色边框移除

**文件**: `canvas.module.css`

删除 `border-color: var(--color-warning)` 和 `box-shadow`。

### 步骤 1.5: 补充 activeBadge CSS

```css
.activeBadge,
.confirmedBadge {
  display: inline-flex;
  align-items: center;
  margin-left: 0.25rem;
  vertical-align: middle;
}
```

### 步骤 1.6: Playwright 测试

```typescript
// E2E 测试三树选择成功率
// journey-create-context.spec.ts
```

---

## Sprint 2: E2 — canvasStore 拆分（8-12h，最大风险）

### 步骤 2.1: 创建 contextStore

**新文件**: `src/lib/canvas/contextStore.ts`

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ContextState {
  contextNodes: ContextNode[];
  selectedNodeId: string | null;
  addContextNode: (draft: BoundedContextDraft) => ContextNode;
  confirmContextNode: (nodeId: string) => void;
  deleteContextNode: (nodeId: string) => void;
  resetAll: () => void;
}
```

### 步骤 2.2: 迁移 contextNodes

将 canvasStore 中的 contextNodes 相关逻辑迁移到 contextStore：
- 状态字段
- Actions（add/delete/confirm）
- Middleware（persist）

### 步骤 2.3: 创建 flowStore

**新文件**: `src/lib/canvas/flowStore.ts`

同上，迁移 flowNodes 相关逻辑。

### 步骤 2.4: 创建 componentStore

**新文件**: `src/lib/canvas/componentStore.ts`

同上，迁移 componentNodes 相关逻辑。

### 步骤 2.5: 创建 uiStore

**新文件**: `src/lib/canvas/uiStore.ts`

迁移 UI 状态（expandMode, messages, SSE, panels）。

### 步骤 2.6: 降级 canvasStore 为代理层

**修改**: `src/lib/canvas/canvasStore.ts`

保留接口兼容，所有操作转发到子 store。

### 步骤 2.7: 回归测试

```bash
npm test -- --testPathPattern="BoundedContextTree|ComponentTree|BusinessFlowTree"
npm run build
```

运行 full E2E suite 验证三树功能正常。

---

## Sprint 3: E3 + E4（6-8h）

### 步骤 3.1: scrollTop = 0

在 CanvasPage.tsx 添加 useEffect，页面加载时设置 scrollTop = 0。

### 步骤 3.2: 工具栏 sticky

```css
.canvasToolbar {
  position: sticky;
  top: 0;
  z-index: var(--z-toolbar);
}
```

### 步骤 3.3: z-index 协议

**新文件**: `src/styles/canvas-z-index.css`

定义 CSS Variables，组件逐步迁移引用。

### 步骤 3.4: 面板动画统一

所有面板 transition 改为 `300ms ease-in-out`。

### 步骤 3.5: 定义 FeedbackToken

**新文件**: `src/components/canvas/types/FeedbackToken.ts`

定义枚举 + 使用示例。

### 步骤 3.6: 创建 useFeedback hook

**新文件**: `src/hooks/useFeedback.ts`

### 步骤 3.7: 替换 window.confirm

全文搜索 `window.confirm`，逐个替换为 `feedback.show()`。

---

## Sprint 4: E5 + E6（11-14h）

### 步骤 4.1: 创建 journey-create-context.spec.ts

Playwright E2E，覆盖创建上下文→填写→确认全流程。

### 步骤 4.2: 创建 journey-generate-flow.spec.ts

Playwright E2E，覆盖选择→生成→确认全流程。

### 步骤 4.3: 创建 journey-multi-select.spec.ts

Playwright E2E，覆盖多选→批量确认全流程。

### 步骤 4.4: GIVEN/WHEN/THEN 模板

在 PRD 模板中强制要求 Story 包含 GIVEN/WHEN/THEN 格式。

### 步骤 4.5: pre-commit hook

```bash
# .husky/pre-commit
npx lint-staged
```

---

## Sprint 5: E7（6-8h）

### 步骤 5.1: emoji 扫描与替换

```bash
grep -r "emoji\|🟢\|🔴\|✅\|❌" packages/canvas/src --include="*.tsx"
```

批量替换为 SVG 图标。

### 步骤 5.2: spacing token 定义

```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}
```

### 步骤 5.3: DESIGN.md 完整版

整理现有设计约定，输出完整 DESIGN.md。

---

## 回滚计划

| 变更 | 回滚方式 |
|------|----------|
| canvasStore 拆分 | 恢复 canvasStore.ts 历史版本 |
| window.confirm 替换 | 恢复 window.confirm 调用 |
| nodeUnconfirmed 边框移除 | 恢复 CSS 中的 border-color |
| z-index 改动 | 恢复硬编码数字 |

---

## 验收清单

### E1
- [ ] NodeState 枚举定义完成
- [ ] 三树 checkbox 均在 type badge 前
- [ ] 确认节点显示绿色 ✓
- [ ] 未确认节点无黄色边框
- [ ] E2E 测试: 30 次操作成功率 = 100%

### E2
- [ ] contextStore < 300 行
- [ ] flowStore < 300 行
- [ ] componentStore < 300 行
- [ ] canvasStore < 100 行
- [ ] 三树功能回归测试通过
- [ ] contextStore 覆盖率 ≥ 70%

### E3
- [ ] scrollTop = 0
- [ ] 工具栏 sticky
- [ ] z-index 协议定义
- [ ] 面板动画 300ms

### E4
- [ ] window.confirm = 0
- [ ] 删除操作有 toast + 撤销
- [ ] FeedbackToken 定义完成
- [ ] 拖拽 opacity 规范

### E5
- [ ] journey-create-context.spec.ts 通过率 ≥ 95%
- [ ] journey-generate-flow.spec.ts 通过率 ≥ 95%
- [ ] journey-multi-select.spec.ts 通过率 ≥ 95%

### E6
- [ ] GIVEN/WHEN/THEN 模板定义
- [ ] pre-commit hook 工作正常
- [ ] 历史 Story 补充 ≤ 20%

### E7
- [ ] canvas 范围 emoji = 0
- [ ] spacing token 定义完成
- [ ] DESIGN.md 包含颜色/spacing/组件规范
