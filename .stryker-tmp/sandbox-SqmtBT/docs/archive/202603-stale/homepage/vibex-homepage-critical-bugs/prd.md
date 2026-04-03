# PRD: 首页关键 Bug 修复

**项目**: vibex-homepage-critical-bugs
**日期**: 2026-03-15
**优先级**: 🔴 P0 紧急

---

## Epic 1: 限界上下文图渲染修复 🔴 P0

### F1: 限界上下文图显示 【需页面集成】

| ID | 功能点 | 验收标准 |
|----|--------|----------|
| F1.1 | API 调用正常 | `expect(contextMermaidCode).toBeDefined()` |
| F1.2 | Mermaid 渲染成功 | `expect(svgElement).toBeInTheDocument()` |
| F1.3 | 错误处理 | `expect(errorMessage).not.toBeVisible()` |

---

## Epic 2: 进度条添加 🔴 P0

### F2: 分析进度条 【需页面集成】

| ID | 功能点 | 验收标准 |
|----|--------|----------|
| F2.1 | 进度条组件 | `expect(screen.getByRole('progressbar')).toBeInTheDocument()` |
| F2.2 | 步骤显示 | `expect(screen.getByText('步骤 1/5')).toBeInTheDocument()` |
| F2.3 | 动态更新 | `expect(progressValue).toBe(40)` |

---

## Epic 3: 面板最小化修复 🔴 P0

### F3: 面板自适应 【需页面集成】

| ID | 功能点 | 验收标准 |
|----|--------|----------|
| F3.1 | 自适应填充 | `expect(otherPanelSize).toBe(100)` |
| F3.2 | 展开按钮 | `expect(screen.getByText('展开')).toBeInTheDocument()` |
| F3.3 | 动画效果 | `expect(buttonStyle).toContain('transition')` |

---

## Epic 4: 步骤渐进渲染 🟡 P1

### F4: 步骤动画 【需页面集成】

| ID | 功能点 | 验收标准 |
|----|--------|----------|
| F4.1 | 步骤完成动画 | `expect(stepElement).toHaveClass('completed')` |
| F4.2 | 内容渐进显示 | `expect(contentOpacity).toBe(1)` |

---

## 实施计划

| Epic | 工时 |
|------|------|
| Epic 1: 限界上下文 | 2h |
| Epic 2: 进度条 | 2h |
| Epic 3: 面板自适应 | 2h |
| Epic 4: 步骤动画 | 1h |

**总计**: 7h (1 天内完成)