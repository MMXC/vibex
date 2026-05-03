# E4: Canvas 导出格式扩展 规格文档

**项目**: vibex-sprint23-qa
**Epic**: E4
**QA 阶段**: 功能验收
**上游产出**: prd.md (S4.1-S4.3), architecture.md §3.5, IMPLEMENTATION_PLAN.md §3, tester-e4-export-formats-report-20260503-0652.md

---

## UI 组件

| 组件 | 路径 | 说明 |
|------|------|------|
| `DDSToolbar` | `src/components/dds/DDSToolbar.tsx` | 含 ExportModal 的工具栏 |
| `ExportModal` | DDSToolbar 内的模态框 | 显示导出选项列表 |
| `PlantUMLExporter` | `src/lib/exporters/plantuml.ts` | PlantUML 导出器 |
| `SVGExporter` | `src/lib/exporters/svg.ts` | SVG 导出器（含降级） |
| `JSONSchemaExporter` | `src/lib/exporters/json-schema.ts` | JSON Schema 导出器 |

---

## 四态定义

### 1. 理想态

**描述**: 用户点击 DDSToolbar 的导出按钮，打开 ExportModal，看到所有导出选项：PlantUML / SVG / JSON Schema（与 PNG/Mermaid/HTML 等现有选项并列）。点击任意一个导出选项，触发文件下载，下载文件名正确（`.puml` / `.svg` / `.schema.json`）。

**UI 表现**:
- ExportModal 打开时有 3 个新增选项：`PlantUML` / `SVG` / `JSON Schema`
- 每个选项有 `data-testid` 标识：`plantuml-option` / `svg-option` / `schema-option`
- 点击 PlantUML 选项 → 下载 `vibex-canvas-<timestamp>.puml` 文件
- 点击 SVG 选项 → 下载 `vibex-canvas-<timestamp>.svg` 文件
- 点击 JSON Schema 选项 → 下载 `vibex-canvas-<timestamp>.schema.json` 文件
- 按钮点击后触发 download，无页面跳转

**验收 expect()**:

```typescript
describe('E4 Ideal State', () => {
  it('should show PlantUML export option in ExportModal', () => {
    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));

    expect(screen.getByTestId('plantuml-option')).toBeVisible();
    expect(screen.getByTestId('plantuml-option')).toHaveTextContent(/PlantUML/i);
  });

  it('should show SVG export option in ExportModal', () => {
    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));

    expect(screen.getByTestId('svg-option')).toBeVisible();
    expect(screen.getByTestId('svg-option')).toHaveTextContent(/SVG/i);
  });

  it('should show JSON Schema export option in ExportModal', () => {
    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));

    expect(screen.getByTestId('schema-option')).toBeVisible();
    expect(screen.getByTestId('schema-option')).toHaveTextContent(/JSON Schema/i);
  });

  it('should trigger .puml file download on PlantUML click', async () => {
    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));
    await userEvent.click(screen.getByTestId('plantuml-option'));

    // createObjectURL 应被调用（download 触发）
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('should trigger .svg file download on SVG click', async () => {
    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));
    await userEvent.click(screen.getByTestId('svg-option'));

    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('should trigger .schema.json file download on JSON Schema click', async () => {
    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));
    await userEvent.click(screen.getByTestId('schema-option'));

    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('PlantUML export file name ends with .puml', () => {
    const plantumlExporter = new PlantUMLExporter();
    const result = plantumlExporter.generate(mockCanvasData);

    expect(result.filename).toMatch(/\.puml$/);
  });

  it('JSON Schema export produces valid JSON', () => {
    const exporter = new JSONSchemaExporter();
    const result = exporter.generate(mockCanvasData);

    expect(() => JSON.parse(result.content)).not.toThrow();
  });

  it('SVG export produces valid SVG markup', () => {
    const exporter = new SVGExporter();
    const result = exporter.generate(mockCanvasData);

    expect(result.content).toContain('<svg');
    expect(result.content).toContain('</svg>');
  });
});
```

---

### 2. 空状态

**描述**: 当 Canvas 无内容（空白画布）时，ExportModal 中的 PlantUML / SVG / JSON Schema 选项应该 disabled，或者显示提示"当前视图无内容，无法导出"。其他选项（如 PNG）保持可用（截图可以为空图）。

**验收 expect()**:

```typescript
describe('E4 Empty State', () => {
  it('should disable export options when canvas is empty', () => {
    render(<DDSToolbar canvasData={null} onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));

    const plantumlOption = screen.getByTestId('plantuml-option');
    expect(plantumlOption).toBeDisabled();
  });

  it('should show tooltip message when export disabled on empty canvas', () => {
    render(<DDSToolbar canvasData={null} onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));

    const plantumlOption = screen.getByTestId('plantuml-option');

    // 鼠标悬停或 tooltip 区域可见
    expect(plantumlOption.closest('[data-tooltip]') ||
      screen.getByText(/当前视图无内容/)).toBeInTheDocument();
  });

  it('should show "当前视图无内容" message for all new format options', () => {
    render(<DDSToolbar canvasData={null} onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));

    expect(screen.getByTestId('plantuml-option')).toBeDisabled();
    expect(screen.getByTestId('svg-option')).toBeDisabled();
    expect(screen.getByTestId('schema-option')).toBeDisabled();
  });

  it('should allow PNG export on empty canvas (screenshot always available)', () => {
    render(<DDSToolbar canvasData={null} onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));

    const pngOption = screen.getByTestId('png-option');
    expect(pngOption).not.toBeDisabled();
  });
});
```

---

### 3. 加载态

**描述**: 用户点击导出选项后，ExportModal 中的按钮进入 loading 状态：按钮禁用 + 显示 spinner。导出生成（PlantUML / SVG / JSON Schema）通常 < 200ms，但 UI 仍需提供 loading 反馈。

**验收 expect()**:

```typescript
describe('E4 Loading State', () => {
  it('should show loading state on PlantUML button during export generation', async () => {
    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));
    const plantumlBtn = screen.getByTestId('plantuml-option');

    await userEvent.click(plantumlBtn);

    // 按钮进入 loading 状态
    await waitFor(() => {
      expect(plantumlBtn).toBeDisabled();
    });
  });

  it('should show loading state on SVG button during export generation', async () => {
    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));
    const svgBtn = screen.getByTestId('svg-option');

    await userEvent.click(svgBtn);

    await waitFor(() => {
      expect(svgBtn).toBeDisabled();
    });
  });

  it('should show loading state on JSON Schema button during export generation', async () => {
    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));
    const schemaBtn = screen.getByTestId('schema-option');

    await userEvent.click(schemaBtn);

    await waitFor(() => {
      expect(schemaBtn).toBeDisabled();
    });
  });

  it('should remove loading state after download completes', async () => {
    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));
    const plantumlBtn = screen.getByTestId('plantuml-option');

    await userEvent.click(plantumlBtn);
    expect(plantumlBtn).toBeDisabled();

    // 等待 download 触发后恢复
    await waitFor(() => {
      expect(plantumlBtn).not.toBeDisabled();
    }, { timeout: 1000 });
  });

  it('should show spinner inside button during loading', () => {
    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));
    await userEvent.click(screen.getByTestId('schema-option'));

    const schemaBtn = screen.getByTestId('schema-option');
    // spinner 可见（可能是 icon 或 text）
    expect(schemaBtn.querySelector('[role="progressbar"]') ||
      schemaBtn.textContent?.includes('...')).toBeTruthy();
  });
});
```

---

### 4. 错误态

**覆盖场景**:

| 错误场景 | UI 表现 |
|---------|---------|
| SVG 导出失败（canvas 数据无法序列化为 SVG） | 显示降级文案："当前视图不支持 SVG 导出"，ExportModal 保持可交互 |
| PlantUML 语法错误（canvas 数据格式异常） | 显示错误提示："PlantUML 导出失败，请检查画布内容" |
| JSON Schema 生成失败 | 显示错误提示："导出失败，请重试" |
| 导出超时（> 5s） | 按钮恢复默认状态，显示 "导出超时，请重试" |

**引导文案**:
- SVG 失败: `"当前视图不支持 SVG 导出"`
- PlantUML 失败: `"PlantUML 导出失败，请检查画布内容"`
- 通用失败: `"导出失败，请重试"`

**验收 expect()**:

```typescript
describe('E4 Error State', () => {
  it('should show "当前视图不支持 SVG 导出" when SVG generation fails', async () => {
    // Mock SVG exporter throws
    vi.spyOn(SVGExporter.prototype, 'generate').mockImplementation(() => {
      throw new Error('SVG serialization failed');
    });

    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));
    await userEvent.click(screen.getByTestId('svg-option'));

    await waitFor(() => {
      expect(screen.getByTestId('svg-error-message')).toBeVisible();
      expect(screen.getByTestId('svg-error-message')).toHaveTextContent(/当前视图不支持/);
    });
  });

  it('should show error message for PlantUML generation failure', async () => {
    vi.spyOn(PlantUMLExporter.prototype, 'generate').mockImplementation(() => {
      throw new Error('Invalid PlantUML syntax');
    });

    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));
    await userEvent.click(screen.getByTestId('plantuml-option'));

    await waitFor(() => {
      expect(screen.getByTestId('plantuml-error-message')).toBeVisible();
      expect(screen.getByTestId('plantuml-error-message')).toHaveTextContent(/PlantUML/);
    });
  });

  it('should allow retry after export failure', async () => {
    vi.spyOn(JSONSchemaExporter.prototype, 'generate')
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ filename: 'test.schema.json', content: '{}' });

    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));
    await userEvent.click(screen.getByTestId('schema-option'));

    // 首次失败，显示错误
    await waitFor(() => {
      expect(screen.getByTestId('schema-error-message')).toBeVisible();
    });

    // 重试
    await userEvent.click(screen.getByTestId('schema-retry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('schema-error-message')).not.toBeInTheDocument();
    });
  });

  it('should not crash ExportModal when one format fails', async () => {
    vi.spyOn(SVGExporter.prototype, 'generate').mockImplementation(() => {
      throw new Error('SVG failed');
    });

    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));

    // SVG 失败
    await userEvent.click(screen.getByTestId('svg-option'));
    await waitFor(() => {
      expect(screen.getByTestId('svg-error-message')).toBeInTheDocument();
    });

    // 其他选项仍可用（PNG / PlantUML）
    expect(screen.getByTestId('plantuml-option')).not.toBeDisabled();
    expect(screen.getByTestId('png-option')).not.toBeDisabled();
  });

  it('should show "导出超时" after 5s timeout', async () => {
    vi.useFakeTimers();
    vi.spyOn(PlantUMLExporter.prototype, 'generate').mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 10000))
    );

    render(<DDSToolbar onExportClick={() => {}} />);
    userEvent.click(screen.getByRole('button', { name: /导出/i }));
    const plantumlBtn = screen.getByTestId('plantuml-option');

    const exportPromise = userEvent.click(plantumlBtn);

    // 快进 6 秒
    await vi.advanceTimersByTime(6000);
    await exportPromise;

    await waitFor(() => {
      expect(screen.getByTestId('plantuml-error-message'))
        .toHaveTextContent(/超时|timeout/i);
    });

    vi.useRealTimers();
  });

  it('validatePlantUML returns false for empty input', () => {
    const exporter = new PlantUMLExporter();
    expect(exporter.validate('')).toBe(false);
  });

  it('validatePlantUML returns true for valid PlantUML', () => {
    const exporter = new PlantUMLExporter();
    const validPlantUML = '@startuml\nAlice -> Bob : Hello\n@enduml';
    expect(exporter.validate(validPlantUML)).toBe(true);
  });
});
```

---

## 页面情绪地图（老妈测试）

- **用户进入时的情绪**: "导出选项比之前多了三个——PlantUML、SVG、JSON Schema。" 用户在 ExportModal 里看到新增选项，不会困惑，因为选项名称通用易懂。
- **用户迷路时的引导**: 如果用户不确定 PlantUML 是什么 → 选项旁有一个小问号图标 hover："导出为 PlantUML 图表格式，可被 StarUML 等工具打开"。
- **用户出错时的兜底**: SVG 导出失败了，页面上不是一片空白或卡死，而是显示"当前视图不支持 SVG 导出"。用户知道这是因为当前视图内容无法生成 SVG（可能含有不支持的元素），不是自己操作错了，也不需要找开发反馈。

---

## 测试覆盖清单

| ID | 测试点 | 方法 |
|----|--------|------|
| E4-T1 | PlantUML 选项可见且文字正确 | RTL 可见性断言 |
| E4-T2 | SVG 选项可见且文字正确 | RTL 可见性断言 |
| E4-T3 | JSON Schema 选项可见且文字正确 | RTL 可见性断言 |
| E4-T4 | 点击 PlantUML 触发 .puml 文件下载 | URL.createObjectURL spy |
| E4-T5 | 点击 SVG 触发 .svg 文件下载 | URL.createObjectURL spy |
| E4-T6 | 点击 JSON Schema 触发 .schema.json 下载 | URL.createObjectURL spy |
| E4-T7 | 空 canvas 时导出选项 disabled | 禁用状态断言 |
| E4-T8 | 空 canvas 显示"当前视图无内容" | 文本内容断言 |
| E4-T9 | 导出中按钮 loading 状态（禁用 + spinner） | 禁用 + role 检查 |
| E4-T10 | SVG 导出失败显示"当前视图不支持 SVG 导出" | Mock SVG exception |
| E4-T11 | PlantUML 导出失败显示错误提示 | Mock PlantUML exception |
| E4-T12 | 一个格式失败不影响其他选项 | Mock failure + 检查其他选项 |
| E4-T13 | 重试按钮可用 | userEvent.click retry |
| E4-T14 | PlantUML 语法验证（空输入 false） | exporter.validate('') |
| E4-T15 | PlantUML 语法验证（合法输入 true） | exporter.validate(valid) |
| E4-T16 | TypeScript 0 errors | `pnpm exec tsc --noEmit` |
| E4-T17 | Exporter 单元测试 17/17 通过 | `npx vitest run exporter.test.ts` |