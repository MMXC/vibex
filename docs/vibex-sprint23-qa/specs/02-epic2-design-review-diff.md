# E2: Design Review Diff 视图 规格文档

**项目**: vibex-sprint23-qa
**Epic**: E2
**QA 阶段**: 功能验收
**上游产出**: prd.md (S2.1-S2.3), architecture.md §3.3, IMPLEMENTATION_PLAN.md §3, tester-e2-design-review-diff-report-20260503-0610.md

---

## UI 组件

| 组件 | 路径 | 说明 |
|------|------|------|
| `ReviewReportPanel` | `src/components/design-review/ReviewReportPanel.tsx` | 含 re-review-btn 的报告面板 |
| `DiffView` | `src/components/design-review/DiffView.tsx` | 显示 added/removed 列表的 diff 组件 |
| `reviewDiff.ts` | `src/lib/reviewDiff.ts` | diff 算法（无 UI，纯逻辑） |
| `useDesignReview` | `src/hooks/useDesignReview.ts` | 支持 previousReportId 参数 |

---

## 四态定义

### 1. 理想态

**描述**: 用户打开 Design Review 报告后，点击 `re-review-btn`（重新评审），ReviewReportPanel 切换到 DiffView tab，显示两次评审的差异：新增问题用红色标签标记（`text-red-500`），移除问题用绿色标签标记（`text-green-500`）。diff 列表显示每个变更问题的位置、描述和评分变化。

**UI 表现**:
- `re-review-btn` 可见，文字为"重新评审"（`data-testid="re-review-btn"`）
- DiffView 容器可见（`data-testid="diff-view"`）
- 每个 added 条目红色背景（`data-testid="diff-item-added"`）
- 每个 removed 条目绿色背景（`data-testid="diff-item-removed"`）
- 顶部显示变更统计：added N 项 / removed M 项（`data-testid="diff-added-count"`, `data-testid="diff-removed-count"`）
- 每个条目显示位置标签（`data-testid="diff-item-location-added"`）和描述（`data-testid="diff-item-message-added"`）

**验收 expect()**:

```typescript
describe('E2 Ideal State', () => {
  it('should show re-review-btn in ReviewReportPanel', () => {
    render(<ReviewReportPanel report={mockReport} />);
    expect(screen.getByTestId('re-review-btn')).toBeVisible();
    expect(screen.getByTestId('re-review-btn')).toHaveTextContent(/重新评审/);
  });

  it('should display diff-view after re-review triggered', async () => {
    render(<ReviewReportPanel report={mockReport} />);
    await userEvent.click(screen.getByTestId('re-review-btn'));

    // diff 数据加载后，DiffView 可见
    await waitFor(() => {
      expect(screen.getByTestId('diff-view')).toBeInTheDocument();
    });
  });

  it('should render added items in red', () => {
    render(<DiffView diff={mockDiff} />);

    const addedItems = screen.getAllByTestId('diff-item-added');
    addedItems.forEach(item => {
      expect(item).toHaveClass(/text-red|background-red/);
    });
  });

  it('should render removed items in green', () => {
    render(<DiffView diff={mockDiff} />);

    const removedItems = screen.getAllByTestId('diff-item-removed');
    removedItems.forEach(item => {
      expect(item).toHaveClass(/text-green|background-green/);
    });
  });

  it('should show diff-added-count and diff-removed-count', () => {
    render(<DiffView diff={mockDiff} />);

    expect(screen.getByTestId('diff-added-count')).toHaveTextContent(/\d+/);
    expect(screen.getByTestId('diff-removed-count')).toHaveTextContent(/\d+/);
  });

  it('should show location and message for each diff item', () => {
    render(<DiffView diff={mockDiff} />);

    const addedLocations = screen.getAllByTestId('diff-item-location-added');
    const addedMessages = screen.getAllByTestId('diff-item-message-added');
    expect(addedLocations.length).toBeGreaterThan(0);
    expect(addedMessages.length).toBeGreaterThan(0);
  });
});
```

---

### 2. 空状态

**描述**: 用户首次打开 Design Review 面板（无历史报告可用），点击重新评审后，diff 区域无法对比，因为没有上一次报告的 ID。此时 DiffView 显示引导文案："暂无历史报告，无法对比"（`data-testid="diff-empty-state"`），而不是显示空白或报错。

**引导文案**: `"暂无历史报告，无法对比。请先完成一次评审，再进行对比分析。"`

**验收 expect()**:

```typescript
describe('E2 Empty State', () => {
  it('should show empty state message when no previous report exists', async () => {
    // previousReportId 不存在（首次评审）
    const { result } = renderHook(() =>
      useDesignReview({ canvasId: 'c1', previousReportId: null })
    );

    await waitFor(() => {
      // diff 为空时应显示引导文案
      expect(screen.getByTestId('diff-empty-state')).toBeVisible();
      expect(screen.getByTestId('diff-empty-state')).toHaveTextContent(/暂无历史报告/);
    });
  });

  it('should NOT show diff view items when empty', () => {
    render(<DiffView diff={{ added: [], removed: [], unchanged: [] }} />);

    expect(screen.queryByTestId('diff-item-added')).not.toBeInTheDocument();
    expect(screen.queryByTestId('diff-item-removed')).not.toBeInTheDocument();
  });

  it('empty state message is specific (not generic "no content")', () => {
    render(<DiffView diff={{ added: [], removed: [], unchanged: [] }} />);
    const emptyText = screen.getByTestId('diff-empty-state').textContent;
    expect(emptyText).toMatch(/暂无历史报告|先完成一次评审/);
  });
});
```

---

### 3. 加载态

**描述**: 用户点击 `re-review-btn` 后，DiffView 进入重新评审流程：API 调用中 → DiffView 显示骨架屏（skeleton placeholder），**禁止使用 spinner**。骨架屏使用灰色占位块填充 diff 列表区域，保持布局稳定，不产生跳变。

**骨架屏规则**:
- 禁止使用 `loading` spinner 或 `Spinner` 组件
- 使用 3-5 个灰色矩形占位块模拟列表行
- 不显示任何文案（骨架屏阶段避免文案错误）
- 骨架屏与真实内容切换无闪烁（通过 CSS opacity 过渡）

**验收 expect()**:

```typescript
describe('E2 Loading State', () => {
  it('should show skeleton screen during re-review (no spinner)', () => {
    render(<ReviewReportPanel report={mockReport} />);
    userEvent.click(screen.getByTestId('re-review-btn'));

    // 立即显示骨架屏（异步 API 调用中）
    const skeleton = screen.getByTestId('diff-view-skeleton');
    expect(skeleton).toBeInTheDocument();

    // 不应该有 spinner
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should not show diff items during loading', () => {
    render(<ReviewReportPanel report={mockReport} />);
    userEvent.click(screen.getByTestId('re-review-btn'));

    // 加载中 diff-item 不可见
    expect(screen.queryByTestId('diff-item-added')).not.toBeInTheDocument();
    expect(screen.queryByTestId('diff-item-removed')).not.toBeInTheDocument();
  });

  it('should replace skeleton with real content after API returns', async () => {
    render(<ReviewReportPanel report={mockReport} />);
    userEvent.click(screen.getByTestId('re-review-btn'));

    // 骨架屏可见
    expect(screen.getByTestId('diff-view-skeleton')).toBeVisible();

    // API 返回后骨架屏消失
    await waitFor(() => {
      expect(screen.queryByTestId('diff-view-skeleton')).not.toBeInTheDocument();
      expect(screen.getByTestId('diff-view')).toBeInTheDocument();
    });
  });

  it('skeleton has no text content (placeholder only)', () => {
    render(<DiffViewSkeleton />);
    const skeletonText = screen.queryByText(/暂无|历史|评审/);
    expect(skeletonText).not.toBeInTheDocument();
  });
});
```

---

### 4. 错误态

**覆盖场景**:

| 错误场景 | UI 表现 |
|---------|---------|
| 网络异常（API 请求失败/超时） | DiffView 显示错误消息 + 重试按钮 |
| 评审服务不可用（503） | DiffView 显示错误消息 + 重试按钮 |
| previousReportId 非法（404） | DiffView 显示错误消息"报告不存在" |
| 两次报告数据损坏 | DiffView 显示错误消息"数据无法解析" |

**引导文案 + 重试按钮**:
```
网络连接失败，无法获取评审对比结果。

[重新加载]

提示：检查网络后点击"重新加载"重试。
```

**验收 expect()**:

```typescript
describe('E2 Error State', () => {
  it('should show error message on network failure', async () => {
    server.use(
      rest.post('/design/review-diff', (req, res, ctx) => {
        return res.networkError();
      })
    );

    render(<ReviewReportPanel report={mockReport} />);
    await userEvent.click(screen.getByTestId('re-review-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('diff-error-message')).toBeVisible();
      expect(screen.getByTestId('diff-error-message')).toHaveTextContent(/网络|失败|无法/);
    });
  });

  it('should show error message on 503 service unavailable', async () => {
    server.use(
      rest.post('/design/review-diff', (req, res, ctx) => {
        return res.status(503).json({ error: 'Service unavailable' });
      })
    );

    render(<ReviewReportPanel report={mockReport} />);
    await userEvent.click(screen.getByTestId('re-review-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('diff-error-message')).toBeVisible();
    });
  });

  it('should show retry button when error occurs', () => {
    render(<DiffViewError message="网络连接失败" />);

    const retryBtn = screen.getByTestId('diff-retry-btn');
    expect(retryBtn).toBeVisible();
    expect(retryBtn).toHaveTextContent(/重新加载|重试/);
  });

  it('should retry and show skeleton again on retry click', async () => {
    render(<ReviewReportPanel report={mockReport} />);

    // 触发错误后
    expect(screen.getByTestId('diff-error-message')).toBeVisible();

    // 点击重试
    await userEvent.click(screen.getByTestId('diff-retry-btn'));

    // 骨架屏再次出现
    await waitFor(() => {
      expect(screen.getByTestId('diff-view-skeleton')).toBeInTheDocument();
    });
  });

  it('should show "report not found" when previousReportId is invalid (404)', async () => {
    server.use(
      rest.post('/design/review-diff', (req, res, ctx) => {
        return res.status(404).json({ error: 'Report not found' });
      })
    );

    render(<ReviewReportPanel report={mockReport} />);
    await userEvent.click(screen.getByTestId('re-review-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('diff-error-message'))
        .toHaveTextContent(/报告不存在|不存在/);
    });
  });
});
```

---

## 页面情绪地图（老妈测试）

- **用户进入时的情绪**: "这个 diff 视图看起来很直观——红色是新增的，绿色是去掉的，一眼就知道设计变好还是变差了。" 用户不会感到困惑，因为颜色语义和常规版本控制工具一致。
- **用户迷路时的引导**: 如果用户不知道"重新评审"是什么意思，旁边应该有一个小的问号图标 hover 提示：`"对比当前报告与上次评审的变化，高亮新增和移除的问题"`。
- **用户出错时的兜底**: 网络断了，diff 加载不出来。页面上不是一片空白或崩溃，而是显示"网络连接失败" + 重试按钮。用户不会慌，因为明确知道这是网络问题，而不是自己操作错了。

---

## 测试覆盖清单

| ID | 测试点 | 方法 |
|----|--------|------|
| E2-T1 | re-review-btn 可见且文字正确 | RTL 可见性断言 |
| E2-T2 | 重新评审触发后 diff-view 可见 | userEvent.click → waitFor |
| E2-T3 | added 条目红色样式（data-testid + class） | DOM 属性检查 |
| E2-T4 | removed 条目绿色样式（data-testid + class） | DOM 属性检查 |
| E2-T5 | diff-added-count / diff-removed-count 显示数字 | 文本内容断言 |
| E2-T6 | 无历史报告时显示引导文案（非空白） | 空状态文案存在性 |
| E2-T7 | 重新评审中显示骨架屏（禁止 spinner） | 无 role=progressbar |
| E2-T8 | 骨架屏无文本内容 | 查询文案文本 |
| E2-T9 | 网络异常显示错误消息 + 重试按钮 | Mock network error |
| E2-T10 | 重试按钮可点击重新触发加载 | userEvent.click |
| E2-T11 | previousReportId 404 显示"报告不存在" | Mock 404 response |
| E2-T12 | TypeScript 0 errors | `pnpm exec tsc --noEmit` |
| E2-T13 | 19 个单元测试 100% 通过 | `npx vitest run` |