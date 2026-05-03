# E2-Design-Review-Diff 实现方案

## 背景

Sprint 23 Epic E2: Design Review 反馈闭环，当前状态：
- ReviewReportPanel 已存在（S2.1 重评按钮缺失）
- useDesignReview 支持 previousReportId（S2.2 缺失）
- DiffView 组件（S2.3 缺失）
- 后端 diff API（S2.4，由 Backend 负责）

## 分析

### 现有代码结构

| 文件 | 状态 |
|------|------|
| `vibex-fronted/src/components/design-review/ReviewReportPanel.tsx` | 存在，缺少 re-review-btn |
| `vibex-fronted/src/hooks/useDesignReview.ts` | 存在，缺少 previousReportId 支持 |
| `vibex-fronted/src/components/design-review/ReviewReportPanel.module.css` | 存在 |
| `vibex-fronted/src/components/design-review/DiffView.tsx` | **不存在，需创建** |
| `vibex-fronted/src/lib/reviewDiff.ts` | **不存在，需创建** |

### 影响范围

- ReviewReportPanel 新增 re-review-btn 和 DiffView tab
- useDesignReview 新增 `previousReportId` 参数和 diff 相关状态
- 新增 DiffView 组件展示 added（红）/ removed（绿）对比

## 方案设计

### S2.1: ReviewReportPanel 添加 re-review-btn

在 ReviewReportPanel 头部 header 区域添加"重新评审"按钮：
- 位置：header 右侧，与 closeButton 并列
- 样式：`reReviewButton`，与 `closeButton` 类似但用 primary 色
- data-testid: `re-review-btn`

### S2.2: useDesignReview 支持 previousReportId

Hook 新增：
```typescript
interface UseDesignReviewOptions {
  autoTrigger?: boolean;
  previousReportId?: string | null;
}
```

- `previousReportId` prop 可选，传入时启用 diff 模式
- diff 模式下：调用 `/api/mcp/review_diff` 而非 `/api/mcp/review_design`
- 新增 state: `diffResult: ReviewDiff | null`

### S2.3: DiffView 组件 + diff 算法

**算法（reviewDiff.ts）**：
- 输入：新报告 `DesignReviewResult`，旧报告 `DesignReviewResult`
- 基于 `item.id` 比对
- 相同 id 不同 score → changed（added + removed 都有）
- 新有旧无 → added
- 旧有新无 → removed
- 新旧都有相同 → unchanged

**DiffView.tsx**：
- 接收 `diff: ReviewDiff` prop
- 两个 section：Added（红）/ Removed（绿）
- 每个 item 显示位置和消息
- data-testid: `diff-view`, `diff-item-added`, `diff-item-removed`

## 实施步骤

1. **reviewDiff.ts** — diff 算法
2. **useDesignReview.ts** — 新增 previousReportId + diffResult state
3. **DiffView.tsx** + `DiffView.module.css` — diff 展示组件
4. **ReviewReportPanel.tsx** — 添加 re-review-btn + DiffView tab
5. **UNIT 测试** — 各组件单元测试
6. **TypeScript 编译验证**

## 验收标准

- [ ] `data-testid="re-review-btn"` 存在
- [ ] `data-testid="diff-view"` 存在
- [ ] `data-testid="diff-item-added"` 存在（红色样式）
- [ ] `data-testid="diff-item-removed"` 存在（绿色样式）
- [ ] `pnpm exec tsc --noEmit` → 0 errors
- [ ] ReviewReportPanel 单元测试通过
- [ ] IMPLEMENTATION_PLAN.md E2 Epic Unit 状态更新为 ✅
- [ ] commit message 包含 `Epic2a` 或 `E2` 标识

## 回滚计划

- diff 视图出错 → 隐藏 diff tab，回退到单报告展示
- 按钮点击异常 → 保持 ReviewReportPanel 原功能，回退 re-review-btn 样式
