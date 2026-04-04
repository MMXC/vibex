# PM 提案 — 2026-04-04

**Agent**: PM
**日期**: 2026-04-04
**项目**: vibex-proposals-20260404
**仓库**: /root/.openclaw/vibex
**分析视角**: 产品体验 / 用户旅程 / 留存优化

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | Canvas 页面加载状态可视化 | Canvas 页面 | P0 |
| P002 | improvement | 项目模板预览体验优化 | 项目模板选择页 | P1 |
| P003 | improvement | 快捷键帮助面板缺失 | 全局快捷键 | P1 |
| P004 | improvement | 提案执行追踪可视化 | 提案 Dashboard | P2 |

---

## 2. 提案详情

### P001: Canvas 页面加载状态可视化

**分析视角**: PM 视角 — 当前 Canvas 页面在数据加载阶段（尤其是 E6 集成后大型组件渲染）缺乏加载指示，用户会看到空白或闪烁的页面。

**问题描述**:
从 CHANGELOG.md 可见，`canvas-split-hooks E6` 将 CanvasPage 从 930 行精简到模块化架构，集成了 6 个 hooks。但用户进入 Canvas 时，在 `useCanvasStore` / `useCanvasRenderer` 等数据未就绪前，页面处于空白状态，无骨架屏或加载指示。

**根因分析**:
- Canvas 页面组件缺少 `Suspense` boundary
- `useCanvasStore` 的 `isLoading` 状态未被 UI 层消费
- 没有统一的 loading skeleton 组件

**影响范围**:
- `vibex-fronted/src/app/canvas/CanvasPage.tsx`
- `vibex-fronted/src/components/canvas/Canvas.tsx`
- 用户首次进入 / 页面切换场景

**建议方案**:
1. 在 `CanvasPage` 外层包裹 `Suspense` + `LoadingSkeleton`
2. 导出 `useCanvasLoading` hook，消费 `canvasStore.loading` 状态
3. 验收标准：加载中显示骨架屏，不闪烁

**验收标准**:
```typescript
// Loading skeleton 验收
expect(screen.getByTestId('canvas-skeleton')).toBeVisible();
// 数据加载完成后 skeleton 消失
await waitFor(() => {
  expect(screen.queryByTestId('canvas-skeleton')).not.toBeInTheDocument();
});
// isLoading=true 时显示 skeleton
expect(screen.getByTestId('canvas-skeleton')).toBeVisible();
```

**工时估算**: 2-3h
**优先级**: P0

---

### P002: 项目模板预览体验优化

**分析视角**: PM 视角 — E2 项目模板系统已上线（`DDDTemplateSelector` + 3 个模板 JSON），但用户选择模板前无法预览内容。

**问题描述**:
从 git diff 可见，新增了 `DDDTemplateSelector.tsx`（261行）和 3 个模板 JSON。但当前模板选择器只有列表视图，用户无法在选择前预览：
- 模板包含哪些 Bounded Context
- 模板的流程结构示例
- 是否适合自己的业务场景

**根因分析**:
- `DDDTemplateSelector` 缺少 TemplateDetail 预览面板
- 3 个 JSON 模板缺少预览摘要字段（`description`, `previewContexts`, `previewFlows`）

**影响范围**:
- `DDDTemplateSelector.tsx`
- `project-templates/*.json`

**建议方案**:
1. 在模板列表右侧添加预览面板（参考 `TemplateDetail.tsx` 已有组件）
2. 扩展模板 JSON：添加 `description`, `contextCount`, `flowCount`, `tags` 字段
3. 预览面板展示：模板名称 + 描述 + 上下文数量 + 流程数量 + 标签

**验收标准**:
```typescript
// 模板预览验收
// 点击模板项，预览面板显示模板详情
await userEvent.click(screen.getByText('E-Commerce Domain'));
expect(screen.getByTestId('template-preview-panel')).toBeVisible();
expect(screen.getByText('Bounded Contexts: 5')).toBeInTheDocument();
expect(screen.getByText('User Management')).toBeInTheDocument();
```

**工时估算**: 3-4h
**优先级**: P1

---

### P003: 快捷键帮助面板缺失

**分析视角**: PM 视角 — E5 实现了 `shortcutStore` 单元测试，`useCanvasEvents` 集成了全局快捷键（Delete/Backspace/Ctrl+A 等），但用户无途径了解可用快捷键。

**问题描述**:
从 CHANGELOG.md 可见 E5 `shortcutStore` 已有完整的单元测试和实现记录。但：
- 没有 `?` 或 `Ctrl+/` 呼出快捷键帮助面板
- 新用户不知道画布支持哪些快捷键
- 快捷键与系统快捷键可能冲突时无提示

**根因分析**:
- `shortcutStore` 实现了监听和执行，但缺少帮助 UI
- `useCanvasEvents` 中未集成 help panel 触发逻辑

**影响范围**:
- `shortcutStore.ts`
- `useCanvasEvents.ts`

**建议方案**:
1. 新增 `ShortcutHelpPanel.tsx` 组件，显示所有可用快捷键
2. 集成到 `useCanvasEvents`：`?` 或 `Ctrl+/` 切换面板显示
3. 在 Dashboard 侧边栏添加"快捷键"入口

**验收标准**:
```typescript
// 快捷键帮助面板验收
// 按 ? 键打开帮助面板
await userEvent.keyboard('?');
expect(screen.getByTestId('shortcut-help-panel')).toBeVisible();
// 再次按 ? 关闭
await userEvent.keyboard('?');
expect(screen.queryByTestId('shortcut-help-panel')).not.toBeInTheDocument();
// 面板列出至少 5 个快捷键
const shortcutItems = screen.getAllByTestId('shortcut-item');
expect(shortcutItems.length).toBeGreaterThanOrEqual(5);
```

**工时估算**: 2h
**优先级**: P1

---

### P004: 提案执行追踪可视化

**分析视角**: PM 视角 — 团队每日产出的提案（dev/pm/analyst/architect 等）缺乏追踪机制，提案提交后不知道是否被采纳、执行状态如何。

**问题描述**:
从 `proposals/` 目录可见，每日提案分散在 `proposals/YYYYMMDD/{agent}.md`。coord 通过 team-tasks 管理任务状态，但提案本身的状态（提交→评审→采纳→执行→完成）无法可视化。

**根因分析**:
- 提案目录缺乏统一的索引页
- team-tasks 仅管理 phase1 任务，提案评审无状态
- 无提案执行 dashboard

**影响范围**:
- 提案目录结构
- team-tasks 提案管理

**建议方案**:
1. 在 `proposals/` 根目录生成 `proposals/index.md`，按日期聚合所有提案
2. 提案增加状态标签：`PENDING | REVIEWED | ADOPTED | REJECTED`
3. 新增提案 Dashboard（Web 页面），显示提案漏斗转化率

**验收标准**:
```typescript
// 提案追踪验收
// index.md 包含近 30 天所有提案
const index = readFileSync('proposals/index.md', 'utf-8');
expect(index).toContain('2026-04-04');
expect(index).toContain('PM');
expect(index).toContain('ADOPTED'));
// 提案可按状态筛选
// dashboard 显示提案转化率：提交→采纳≥40%
```

**工时估算**: 4-5h
**优先级**: P2

---

## 3. 今日工作回顾

| 任务 | 项目 | 状态 | 产出物 |
|------|------|------|--------|
| PM 提案提交 | vibex-proposals-20260404 | ✅ 完成 | proposals/20260404/pm.md |

---

## 4. 做得好的

1. **持续迭代**：延续了 20260330 的提案风格，格式统一
2. **根因驱动**：每个提案从用户痛点出发，追踪到具体文件和 commit
3. **验收断言化**：每个提案提供 `expect()` 格式验收标准

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | 提案 P004 与 team-tasks 系统高度耦合 | 需与 coord 对齐提案追踪机制 |
| 2 | 部分提案需跨 agent 协作（如 P001 需 dev 实现） | 提案提交后应触发后续任务派发 |

---

**提交时间**: 2026-04-04 18:10 GMT+8
