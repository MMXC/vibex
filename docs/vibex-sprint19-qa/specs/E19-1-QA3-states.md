# Spec: E19-1-QA3 UI 四态规范 — ReviewReportPanel

**Epic**: E19-1-QA3 | **Story**: S1 四态可达性验证
**文件**: `vibex-fronted/src/components/design-review/ReviewReportPanel.tsx`
**状态**: 规格定义

---

## 1. 四态定义

| 状态 | 触发条件 | UI 元素 | data-testid |
|------|---------|---------|-------------|
| **加载态（loading）** | `isLoading === true` | 骨架屏 + spinner + "Analyzing design..." 文案 | `panel-loading` / `review-loading` |
| **错误态（error）** | `error !== null && !isLoading` | 错误图标 + 友好文案 + 重试按钮 | `panel-error` / `panel-error-message` / `panel-retry` |
| **空状态（empty）** | `result === null && !isLoading && !error && isOpen` | 空状态图标 + "暂无评审结果" + Ctrl+Shift+R 引导 | `panel-empty` |
| **成功态（success）** | `result !== null && !isLoading && !error` | 三 tab 导航 + 各 tab 内容 | `panel-tabs` / `tab-compliance` / `tab-accessibility` / `tab-reuse` |

---

## 2. 加载态（Loading State）

### 理想态
- 骨架屏占位（不跳动的灰色块）
- spinner 动画（`animation: spin 1s linear infinite`）
- 文案："Analyzing design compliance..."

### 空状态（不应该发生）
- 如果 `isLoading` 且 panel 不可见 → BUG

### 加载态 → 错误态
- API 返回 500 或 fetch 失败
- `error.includes('500')` → 文案："设计评审暂时不可用，请稍后再试"
- `error.includes('fetch')` → 文案："网络连接异常，请检查网络后重试"

### 加载态 → 成功态
- API 返回 200 + 有效 `DesignReviewReport`

---

## 3. 错误态（Error State）

### 理想态
- 错误图标 ⚠
- 根据错误类型显示对应文案（区分 500 vs 网络错误）
- 重试按钮（`data-testid="panel-retry"`）

### 空状态
- 无（错误态本身就是一种显示状态）

### 错误态 → 成功态
- 点击"重试"按钮 → `runReview()` 重新发起请求
- 重试成功 → `isLoading` → `result` 更新

### 错误态 → 空状态
- 无此路径

---

## 4. 空状态（Empty State）

### 理想态
- 空状态图标 📋
- 主文案："暂无评审结果"
- 引导文案："按 Ctrl+Shift+R 触发评审"
- 禁止只留白

### 空状态 → 成功态
- 用户按 `Ctrl+Shift+R` → 触发 `design-review:open` 事件 → `runReview()`
- API 返回 200

### 空状态 → 加载态
- `runReview()` 调用后立即设置 `isLoading = true`

---

## 5. 成功态（Success State）

### 理想态
- 三 tab 导航（Compliance / Accessibility / Reuse）
- 各 tab 下展示 IssueCard 或 RecommendationCard
- count badge 显示各分类数量

### Tab 内容

| Tab | 空内容展示 | Issue Card 字段 |
|-----|---------|----------------|
| Compliance | "No compliance issues found." | SeverityBadge + location + message |
| Accessibility | "No accessibility issues found." | SeverityBadge + location + message |
| Reuse | "No reuse recommendations." | PriorityBadge + message |

---

## 6. 组件边界

- ReviewReportPanel 内部管理 `isOpen`/`isLoading`/`result`/`error` 状态
- 与 `useDesignReview` hook 的状态映射由 hook 内部处理
- Tab 切换由组件自身 `useState` 管理（`activeTab`）
- 关闭按钮触发的 `close()` 仅设置 `isOpen = false`，不清理 `result`

---

## 7. 响应式规范

- Panel 宽度：`max-width: 600px`，居中显示
- Overlay：`position: fixed`，覆盖全屏，`background: rgba(0,0,0,0.5)`
- Tab 栏：`overflow-x: auto`，支持横向滚动
- IssueCard：`margin-bottom: 12px`，可堆叠

---

## 8. 验收核对

- [ ] 四态 data-testid 全部存在：`panel-loading` / `panel-error` / `panel-empty` / `panel-tabs`
- [ ] 加载态：骨架屏（不是 spinner 纯动画）
- [ ] 错误态：区分 500 错误和网络错误
- [ ] 空状态：有引导文案，禁止纯白
- [ ] 重试按钮：点击后重新发起 API 请求
- [ ] 关闭按钮：dismiss panel，不清理 result
