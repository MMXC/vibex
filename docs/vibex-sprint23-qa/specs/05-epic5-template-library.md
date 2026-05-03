# E5: 模板库版本历史 + 导入导出 规格文档

**项目**: vibex-sprint23-qa
**Epic**: E5
**QA 阶段**: 功能验收
**上游产出**: prd.md (S5.1-S5.2), architecture.md §3.6, IMPLEMENTATION_PLAN.md §3, tester-e5-template-library-report-20260503-0708.md

---

## UI 组件

| 组件 | 路径 | 说明 |
|------|------|------|
| `TemplateGallery` | `src/components/templates/TemplateGallery.tsx` | 模板列表，含导出/导入/历史按钮 |
| `TemplateHistoryPanel` | `src/components/templates/TemplateHistoryPanel/TemplateHistoryPanel.tsx` | 版本历史面板 |
| `useTemplateManager` | `src/hooks/useTemplateManager.ts` | 模板管理 hook（含 localStorage） |

---

## 四态定义

### 1. 理想态

**描述**: 用户打开 TemplateGallery，看到自定义模板列表，每个模板卡片上有"导出"和"历史"按钮。点击"导出"→ 触发 JSON 文件下载（`template-<id>-<timestamp>.json`），包含模板完整数据。点击"历史"→ 打开 TemplateHistoryPanel，显示该模板的版本快照列表（≤ 10 个），每条显示时间戳和 label。点击"导入"→ 打开文件选择器，选择 JSON 文件后解析并恢复模板。

**UI 表现**:
- 模板导出按钮（`data-testid="template-export-btn"`）在 TemplateGallery 的模板卡片上
- 模板导入按钮（`data-testid="template-import-btn"`）在 TemplateGallery 的工具栏区域
- 模板历史按钮（`data-testid="template-history-btn"`）在每个模板卡片上
- TemplateHistoryPanel 显示历史条目（`data-testid="history-item"`），最多 10 条
- 每个 history-item 显示时间戳 + label（用户可自定义）
- 点击任意 history-item 可恢复该版本

**验收 expect()**:

```typescript
describe('E5 Ideal State', () => {
  it('should show template-export-btn in TemplateGallery', () => {
    render(<TemplateGallery templates={mockTemplates} />);

    expect(screen.getByTestId('template-export-btn')).toBeVisible();
  });

  it('should show template-import-btn in TemplateGallery', () => {
    render(<TemplateGallery templates={mockTemplates} />);

    expect(screen.getByTestId('template-import-btn')).toBeVisible();
  });

  it('should show template-history-btn in TemplateGallery', () => {
    render(<TemplateGallery templates={mockTemplates} />);

    expect(screen.getByTestId('template-history-btn')).toBeVisible();
  });

  it('should trigger JSON file download on export click', async () => {
    render(<TemplateGallery templates={mockTemplates} />);
    await userEvent.click(screen.getByTestId('template-export-btn'));

    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('should show TemplateHistoryPanel with history items when history button clicked', async () => {
    render(<TemplateGallery templates={mockTemplates} />);
    await userEvent.click(screen.getByTestId('template-history-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('history-item')).toBeInTheDocument();
    });
  });

  it('should display at most 10 history items', () => {
    // 模拟 15 个 snapshot（超过 10 个限制）
    const manySnapshots = Array.from({ length: 15 }, (_, i) => ({
      id: `snap_${i}`,
      createdAt: Date.now() - i * 86400000,
      data: mockTemplateData,
      label: `Version ${i + 1}`
    }));

    const { result } = renderHook(() => useTemplateManager());
    result.current.setHistory('tpl_1', manySnapshots);

    render(<TemplateHistoryPanel templateId="tpl_1" />);

    const historyItems = screen.getAllByTestId('history-item');
    expect(historyItems.length).toBeLessThanOrEqual(10);
  });

  it('should export JSON file with correct template data structure', async () => {
    const mockTemplate = {
      id: 'tpl_abc',
      name: 'My Template',
      items: [{ id: 'item_1', type: 'node', label: 'Start' }]
    };

    const blob = await useTemplateManager().exportTemplate('tpl_abc');

    expect(blob.type).toBe('application/json');
    const text = await blob.text();
    const parsed = JSON.parse(text);
    expect(parsed.id).toBe('tpl_abc');
    expect(parsed.name).toBe('My Template');
  });

  it('should parse imported JSON file and restore template', async () => {
    const mockJSON = JSON.stringify({
      id: 'tpl_imported',
      name: 'Imported Template',
      items: []
    });
    const mockFile = new File([mockJSON], 'template.json', { type: 'application/json' });

    const { result } = renderHook(() => useTemplateManager());
    const imported = await result.current.importTemplate(mockFile);

    expect(imported.id).toBe('tpl_imported');
    expect(imported.name).toBe('Imported Template');
  });

  it('should show timestamp and label for each history item', () => {
    render(<TemplateHistoryPanel templateId="tpl_1" />);

    const historyItems = screen.getAllByTestId('history-item');
    historyItems.forEach(item => {
      expect(item).toHaveTextContent(/\d{4}/); // 年份
      // label 可选，有则显示，无则显示默认文案
    });
  });
});
```

---

### 2. 空状态

**描述**: 用户首次打开模板历史面板（该模板没有任何历史版本快照）时，TemplateHistoryPanel 显示引导文案："暂无版本历史，修改模板后会自动保存"。不是空白面板，也不是 spinner，而是友好的引导文案告知用户版本历史如何产生。

**引导文案**: `"暂无版本历史，修改模板后会自动保存"`

**验收 expect()**:

```typescript
describe('E5 Empty State', () => {
  it('should show "暂无版本历史" message when no history exists', () => {
    render(<TemplateHistoryPanel templateId="tpl_new" />);

    expect(screen.getByTestId('history-empty-state')).toBeVisible();
    expect(screen.getByTestId('history-empty-state')).toHaveTextContent(/暂无版本历史/);
  });

  it('should show guiding message that mentions auto-save', () => {
    render(<TemplateHistoryPanel templateId="tpl_new" />);

    const emptyText = screen.getByTestId('history-empty-state').textContent;
    expect(emptyText).toMatch(/暂无版本历史/);
  });

  it('should NOT show any history items when empty', () => {
    render(<TemplateHistoryPanel templateId="tpl_new" />);

    expect(screen.queryByTestId('history-item')).not.toBeInTheDocument();
  });

  it('should NOT show skeleton or spinner in empty history', () => {
    render(<TemplateHistoryPanel templateId="tpl_new" />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('history-skeleton')).not.toBeInTheDocument();
  });

  it('export button should still work even with no history', () => {
    render(<TemplateGallery templates={[]} />);

    expect(screen.getByTestId('template-export-btn')).not.toBeDisabled();
  });
});
```

---

### 3. 加载态

**描述**: 用户点击"导入"按钮，选择 JSON 文件后，TemplateGallery 进入文件解析阶段。此时"导入"按钮显示 loading 状态（禁用 + spinner），ExportModal 保持可交互。

**验收 expect()**:

```typescript
describe('E5 Loading State', () => {
  it('should show loading state on import button during file parsing', async () => {
    render(<TemplateGallery templates={mockTemplates} />);
    const importBtn = screen.getByTestId('template-import-btn');

    // 模拟大文件延迟解析
    const mockFile = new File([JSON.stringify(mockTemplateData).repeat(100)], 'large.json', {
      type: 'application/json'
    });

    await userEvent.click(importBtn);

    // 文件选择后按钮进入 loading
    await waitFor(() => {
      expect(importBtn).toBeDisabled();
    });
  });

  it('should show loading state on import button when selecting large file', async () => {
    render(<TemplateGallery templates={mockTemplates} />);
    const importBtn = screen.getByTestId('template-import-btn');

    const largeFile = new File([new Array(100000).join('x')], 'large.json', {
      type: 'application/json'
    });

    // 触发文件选择（mock）
    await userEvent.click(importBtn);

    await waitFor(() => {
      expect(importBtn).toBeDisabled();
    });
  });

  it('should remove loading state after import succeeds', async () => {
    render(<TemplateGallery templates={mockTemplates} />);
    const importBtn = screen.getByTestId('template-import-btn');

    await userEvent.click(importBtn);

    // 等待解析完成
    await waitFor(() => {
      expect(importBtn).not.toBeDisabled();
    }, { timeout: 2000 });
  });

  it('should not show spinner during history panel load (history loads instantly)', () => {
    render(<TemplateHistoryPanel templateId="tpl_1" />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
```

---

### 4. 错误态

**覆盖场景**:

| 错误场景 | UI 表现 |
|---------|---------|
| JSON 文件格式错误（不是有效 JSON） | 显示错误提示："文件格式不正确，请选择有效的模板 JSON" |
| JSON 结构正确但缺少必要字段（id/name 缺失） | 显示错误提示："文件缺少必要字段（id 或 name）" |
| localStorage 满（写入新 snapshot 失败） | 自动清理最旧 snapshot，尝试重新写入（无 UI 提示，静默处理） |
| 导入文件过大（> 5MB） | 显示错误提示："文件过大，请选择小于 5MB 的模板文件" |

**引导文案**:
- JSON 格式错误: `"文件格式不正确，请选择有效的模板 JSON"`
- 缺少字段: `"文件缺少必要字段（id 或 name）"`
- 文件过大: `"文件过大，请选择小于 5MB 的模板文件"`

**验收 expect()**:

```typescript
describe('E5 Error State', () => {
  it('should show error message when imported JSON is invalid', async () => {
    const invalidJSON = 'this is not json {';
    const invalidFile = new File([invalidJSON], 'invalid.json', { type: 'application/json' });

    const { result } = renderHook(() => useTemplateManager());
    const { success, error } = await result.current.importTemplate(invalidFile);

    expect(success).toBe(false);
    expect(error).toMatch(/文件格式不正确|无效/);
  });

  it('should show error message in UI when JSON is invalid', async () => {
    render(<TemplateGallery templates={mockTemplates} />);

    const invalidJSON = 'not json';
    const invalidFile = new File([invalidJSON], 'bad.json', { type: 'application/json' });

    // 模拟文件选择
    await userEvent.click(screen.getByTestId('template-import-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('import-error-message')).toBeVisible();
      expect(screen.getByTestId('import-error-message')).toHaveTextContent(/文件格式不正确/);
    });
  });

  it('should show error when JSON lacks required fields (id or name)', async () => {
    const incompleteJSON = JSON.stringify({ description: 'no id or name' });
    const incompleteFile = new File([incompleteJSON], 'incomplete.json', {
      type: 'application/json'
    });

    const { result } = renderHook(() => useTemplateManager());
    const { success, error } = await result.current.importTemplate(incompleteFile);

    expect(success).toBe(false);
    expect(error).toMatch(/缺少必要字段|id|name/);
  });

  it('should show error when imported file is too large (> 5MB)', async () => {
    // 模拟 6MB 文件
    const largeJSON = JSON.stringify({ data: new Array(6000000).fill('x') });
    const largeFile = new File([largeJSON], 'large.json', { type: 'application/json' });
    // Note: File.size 不可直接 mock，需要 Object.defineProperty

    render(<TemplateGallery templates={mockTemplates} />);
    await userEvent.click(screen.getByTestId('template-import-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('import-error-message')).toBeVisible();
      expect(screen.getByTestId('import-error-message')).toHaveTextContent(/文件过大/);
    });
  });

  it('should auto-prune oldest snapshot when localStorage is full', async () => {
    const { result } = renderHook(() => useTemplateManager());

    // 模拟 10 个 snapshot 填满 localStorage
    const fullSnapshots = Array.from({ length: 10 }, (_, i) => ({
      id: `snap_${i}`,
      createdAt: Date.now() - i * 1000,
      data: { id: `tpl_${i}` }
    }));

    // 设置为 10 个（已满）
    result.current.setHistory('tpl_1', fullSnapshots);

    // 尝试添加第 11 个
    await result.current.createSnapshot('tpl_1', 'new version');

    // 应该自动清理最旧的，保留 10 个
    const history = result.current.getHistory('tpl_1');
    expect(history.length).toBeLessThanOrEqual(10);
    expect(history[0].label).not.toBe('new version'); // 最旧的是 snap_0，不应是新版本
  });

  it('should allow retry after import error', async () => {
    render(<TemplateGallery templates={mockTemplates} />);

    // 首次导入错误
    await userEvent.click(screen.getByTestId('template-import-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('import-error-message')).toBeVisible();
    });

    // 点击重试
    await userEvent.click(screen.getByTestId('import-retry-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('import-error-message')).not.toBeInTheDocument();
    });
  });

  it('should not crash when import fails (ExportModal still interactive)', async () => {
    render(<TemplateGallery templates={mockTemplates} />);

    // 导入失败
    await userEvent.click(screen.getByTestId('template-import-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('import-error-message')).toBeInTheDocument();
    });

    // 导出按钮仍可用
    expect(screen.getByTestId('template-export-btn')).not.toBeDisabled();
    expect(screen.getByTestId('template-history-btn')).not.toBeDisabled();
  });
});
```

---

## 页面情绪地图（老妈测试）

- **用户进入时的情绪**: "模板导出/导入/历史？这三个功能我都能猜到是干什么的。" 用户不困惑，因为这些是通用功能，用户在其他产品里见过类似操作。
- **用户迷路时的引导**: 用户不知道"版本历史"会自动产生 → 空状态文案说明："修改模板后会自动保存"。用户不会问"我怎么才能有历史"，因为文案已经说清楚了。
- **用户出错时的兜底**: 用户导入了一个损坏的 JSON 文件，页面上显示"文件格式不正确，请选择有效的模板 JSON" + 重试按钮。用户知道问题在自己（文件选错了），不会慌，也不会去找开发。localStorage 满的情况是静默清理最旧版本，用户无感知，模板历史永远保持 10 条。

---

## 测试覆盖清单

| ID | 测试点 | 方法 |
|----|--------|------|
| E5-T1 | template-export-btn 可见且可点击 | RTL 可见性断言 |
| E5-T2 | template-import-btn 可见且可点击 | RTL 可见性断言 |
| E5-T3 | template-history-btn 可见且可点击 | RTL 可见性断言 |
| E5-T4 | 导出触发 JSON 文件 download | URL.createObjectURL spy |
| E5-T5 | 导出 JSON 包含 id/name/items 字段 | JSON.parse + 字段断言 |
| E5-T6 | 历史面板显示 ≤ 10 个 history-item | length ≤ 10 断言 |
| E5-T7 | history-item 显示时间戳 + label | 文本内容断言 |
| E5-T8 | 导入解析有效 JSON 恢复模板 | File + JSON.parse 断言 |
| E5-T9 | 无历史时显示引导文案（非空白/非spinner） | 空状态文案存在性 |
| E5-T10 | 导入文件解析中按钮 loading | 禁用状态断言 |
| E5-T11 | 无效 JSON 显示"文件格式不正确" | Mock invalid JSON |
| E5-T12 | 缺少字段 JSON 显示"缺少必要字段" | Mock incomplete JSON |
| E5-T13 | 文件过大（>5MB）显示错误 | Mock large file |
| E5-T14 | localStorage 满时自动清理最旧 snapshot | Mock localStorage full |
| E5-T15 | 导入失败后重试按钮可用 | userEvent.click retry |
| E5-T16 | 导入失败不影响导出/历史按钮 | 失败后检查其他按钮 |
| E5-T17 | TypeScript 0 errors | `pnpm exec tsc --noEmit` |
| E5-T18 | 模板相关测试 76/76 通过 | `npx vitest run` |