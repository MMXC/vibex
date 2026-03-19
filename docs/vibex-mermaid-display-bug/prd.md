# PRD: vibex-mermaid-display-bug

## 1. 执行摘要

| 属性 | 值 |
|------|-----|
| **项目** | vibex-mermaid-display-bug |
| **类型** | Bug 修复 |
| **目标** | 修复领域模型页面 mermaid 实时渲染未切换展示 |
| **完成标准** | 三个确认流程页面正确渲染 Mermaid 图表 |

---

## 2. 问题陈述

所有确认流程页面将 Mermaid 代码作为纯文本 `<pre>` 显示，而非使用 `MermaidPreview` 组件渲染为图表。

| 页面 | 当前 | 正确 |
|------|------|------|
| `/confirm/context/page.tsx` | `<pre>{contextMermaidCode}</pre>` | `<MermaidPreview code={contextMermaidCode} />` |
| `/confirm/model/page.tsx` | `<pre>{modelMermaidCode}</pre>` | `<MermaidPreview code={modelMermaidCode} />` |
| `/confirm/flow/page.tsx` | `<pre>{flowMermaidCode}</pre>` | `<MermaidPreview code={flowMermaidCode} />` |

---

## 3. Epic 拆分

### Epic 1: 页面修复 (P0)

**Story F1.1**: 修复 context 页面渲染
- **验收标准**:
  - `expect(screen.getByTestId('mermaid-context')).toBeDefined()`
  - `expect(screen.getByTestId('mermaid-context').tagName).toBe('svg')`

**Story F1.2**: 修复 model 页面渲染
- **验收标准**:
  - `expect(screen.getByTestId('mermaid-model')).toBeDefined()`
  - `expect(screen.getByTestId('mermaid-model').tagName).toBe('svg')`

**Story F1.3**: 修复 flow 页面渲染
- **验收标准**:
  - `expect(screen.getByTestId('mermaid-flow')).toBeDefined()`
  - `expect(screen.getByTestId('mermaid-flow').tagName).toBe('svg')`

### Epic 2: 实时切换 (P0)

**Story F2.1**: Mermaid 代码变化时图表实时更新
- **验收标准**:
  - `expect(fireEvent.click(button))`
  - `expect(await screen.findByTestId('mermaid-model')).toBeDefined()`
  - `await waitFor(() => { expect(screen.getByTestId('mermaid-model').tagName).toBe('svg') })`

---

## 4. DoD

- [ ] context 页面显示 Mermaid 图表
- [ ] model 页面显示 Mermaid 图表
- [ ] flow 页面显示 Mermaid 图表
- [ ] 代码变化时图表实时更新
