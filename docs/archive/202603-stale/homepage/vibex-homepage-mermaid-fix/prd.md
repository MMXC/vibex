# PRD: vibex-homepage-mermaid-fix

> **状态**: 建设中 | **优先级**: P1 | **分析师**: Analyst Agent | **PM**: PM Agent
> **根因**: 未明确定位（需 Debug 阶段确认是数据层/渲染层/UI层问题）

---

## 1. 执行摘要

用户完成业务流程（Step 4）后返回首页，预览区应显示 Mermaid 流程图，但显示占位图。根因待定位，需三步诊断：数据层 → 渲染层 → UI层。

---

## 2. Epic 拆分

### Epic 1: Debug 定位根因

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S1.1 | 数据层诊断 | 确认 confirmationStore.flowMermaidCode 有值 |
| S1.2 | 渲染层诊断 | 确认 MermaidManager.isInitialized() = true |
| S1.3 | UI层诊断 | 确认 PreviewArea 正确订阅并渲染 |

### Epic 2: 修复验证

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S2.1 | 预览区修复 | 修复诊断发现的问题 |
| S2.2 | 回归验证 | Playwright E2E 验证流程图显示 |

---

## 3. 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 数据层检查 | 在 PreviewArea 添加 console.debug 观察 flowMermaidCode | 有值时日志输出代码前50字符 | **【需页面集成】** PreviewArea.tsx |
| F1.2 | MermaidManager 状态 | 确认 MermaidManager 预初始化完成 | MermaidManager.getInstance().isInitialized() = true | - |
| F1.3 | 预览区订阅修复 | PreviewArea 正确使用 useConfirmationStore 订阅 flowMermaidCode | 有值时渲染 MermaidPreview | **【需页面集成】** PreviewArea.tsx |
| F2.1 | 降级提示 | flowMermaidCode 为空时显示友好提示（而非空白） | expect(screen.getByText(/暂无预览内容/)).toBeInTheDocument() | **【需页面集成】** PreviewArea.tsx |
| F2.2 | E2E 验证 | Playwright 测试：生成业务流 → 返回首页 → 确认 SVG 显示 | 等待SVG出现，超时10s | - |

---

## 4. 依赖关系

- **上游**: vibex-mermaid-render-fix（如果 MermaidManager 问题则共享）
- **下游**: vibex-homepage-mermaid-fix / test-preview（Tester）

---

## 5. 实施步骤

```
Phase 1: Debug 定位 (20min)
  - PreviewArea 添加 console.debug 观察 flowMermaidCode
  - 确认 store 数据是否存在
  - 确认 MermaidManager 初始化状态

Phase 2: 修复 (10min)
  - 根据 debug 结果修复对应层
  - 添加降级提示

Phase 3: 验证 (10min)
  - Playwright E2E 测试
  - 确认首页显示 SVG
```

**预估总工时**: 40 分钟（不含 debug 等待时间）

---

## 6. 验收标准汇总

- [ ] F1.1: Debug 日志确认数据流状态
- [ ] F1.2: MermaidManager 初始化正常
- [ ] F1.3: PreviewArea 正确订阅渲染
- [ ] F2.1: 降级提示正常显示
- [ ] F2.2: E2E 测试通过
- [ ] npm run build 成功

---

*PM Agent | 2026-03-20*
