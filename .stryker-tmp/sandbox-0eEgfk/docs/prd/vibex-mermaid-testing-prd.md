# Mermaid 组件测试 PRD

**项目**: vibex-mermaid-testing  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement

Mermaid 组件现有覆盖率约 **60%**，需要扩展测试覆盖。当前状态：
- MermaidPreview 有基础测试
- MermaidEditor 缺少测试
- MermaidCodeEditor 缺少测试
- 错误处理场景需要完善

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 每个 Mermaid 组件有测试用例
- 覆盖率目标 > 80%
- 错误处理和多种图表类型覆盖

### 2.2 Non-Goals
- 不修改组件实现
- 不添加新功能

---

## 3. Test Coverage Goals

### 3.1 当前覆盖率

| 组件 | 当前 | 目标覆盖率覆盖率 |
|-----|----------|----------|
| MermaidPreview | ~70% | > 80% |
| MermaidEditor | ~0% | > 80% |
| MermaidCodeEditor | ~0% | > 80% |
| **总体** | **~60%** | **> 80%** |

### 3.2 增量目标

| 组件 | 新增测试用例 | 覆盖率提升 |
|-----|------------|----------|
| MermaidEditor | 15+ | 0% → 80%+ |
| MermaidCodeEditor | 12+ | 0% → 80%+ |
| MermaidPreview | 5+ | 70% → 85%+ |
| **总计** | **30+** | **60% → 80%+** |

---

## 4. Test Cases by Component

### 4.1 MermaidEditor Tests

| # | 测试场景 | 验证点 |
|---|---------|-------|
| ME-01 | 渲染空状态 | 无 code 时显示占位 |
| ME-02 | 渲染代码编辑器 | CodeEditor 可见 |
| ME-03 | 渲染预览面板 | Preview 可见 |
| ME-04 | 代码编辑更新 | onChange 被调用 |
| ME-05 | 预览同步更新 | 代码变化时重新渲染 |
| ME-06 | 布局切换 | 切换 TB/LR 布局 |
| ME-07 | 主题切换 | light/dark 主题 |
| ME-08 | 只读模式 | 只读时禁止编辑 |
| ME-09 | 高度自定义 | 自定义 height prop |
| ME-10 | 错误传播 | 子组件错误正确处理 |

### 4.2 MermaidCodeEditor Tests

| # | 测试场景 | 验证点 |
|---|---------|-------|
| MCE-01 | 渲染编辑器 | Monaco/textarea 可见 |
| MCE-02 | 值绑定 | value prop 正确绑定 |
| MCE-03 | onChange 调用 | 编辑时回调正确 |
| MCE-04 | 只读模式 | 只读时禁止输入 |
| MCE-05 | 自定义高度 | height prop 正确应用 |
| MCE-06 | 语言设置 | language 设置为 mermaid |
| MCE-07 | 主题适配 | light/dark 主题正确 |
| MCE-08 | 占位符 | placeholder 正确显示 |
| MCE-09 | 禁用状态 | disabled prop 正确处理 |
| MCE-10 | 类名传递 | className 正确应用 |

### 4.3 MermaidPreview Tests (扩展)

| # | 测试场景 | 验证点 |
|---|---------|-------|
| MP-01 | 空代码处理 | 显示占位文字 |
| MP-02 | 空白代码处理 | 视为空 |
| MP-03 | 流程图渲染 | graph TD 正确渲染 |
| MP-04 | 类图渲染 | classDiagram 正确渲染 |
| MP-05 | 状态图渲染 | stateDiagram 正确渲染 |
| MP-06 | 流程图渲染 | flowchart 正确渲染 |
| MP-07 | 序列图渲染 | sequenceDiagram 正确渲染 |
| MP-08 | TB 布局 | layout="TB" 正确 |
| MP-09 | LR 布局 | layout="LR" 正确 |
| MP-10 | BT 布局 | layout="BT" 正确 |
| MP-11 | RL 布局 | layout="RL" 正确 |
| MP-12 | 渲染失败处理 | 错误状态显示 |
| MP-13 | onError 回调 | 错误时回调触发 |
| MP-14 | 自定义高度 | height prop 正确 |
| MP-15 | 自定义类名 | className 正确 |

---

## 5. Diagram Types Coverage

### 5.1 需要覆盖的图表类型

| 类型 | 语法示例 | 测试优先级 |
|-----|---------|----------|
| Flowchart | `graph TD\nA --> B` | P0 |
| Flowchart (alt) | `flowchart TD\nA --> B` | P0 |
| Class Diagram | `class A\nclass B` | P0 |
| State Diagram | `state A\nstate B` | P0 |
| Sequence Diagram | `sequenceDiagram\nA->>B: Hello` | P1 |
| ER Diagram | `erDiagram\nUSER ||--o{ ORDER` | P1 |
| Gantt | `gantt\ntitle Test` | P2 |
| Pie Chart | `pie\n"A": 10` | P2 |
| Journey | `journey\nsection Test` | P2 |

---

## 6. Error Handling Coverage

### 6.1 错误场景

| # | 错误场景 | 预期行为 |
|---|---------|---------|
| EH-01 | 无效 Mermaid 语法 | 显示错误状态 |
| EH-02 | 空代码 | 显示占位 |
| EH-03 | 渲染超时 | 超时处理 |
| EH-04 | Mermaid 库加载失败 | 错误提示 |
| EH-05 | 恶意代码 (XSS) | 已由 securityLevel: strict 处理 |

### 6.2 验证点

- 错误状态 UI 正确显示
- onError 回调被正确调用
- 用户可重试
- 错误信息清晰

---

## 7. Implementation Plan

### 步骤 1: 补充 MermaidEditor 测试
- 创建 `MermaidEditor.test.tsx`
- 15+ 测试用例

### 步骤 2: 创建 MermaidCodeEditor 测试
- 创建 `MermaidCodeEditor.test.tsx`
- 12+ 测试用例

### 步骤 3: 扩展 MermaidPreview 测试
- 补充遗漏的图表类型
- 完善错误处理测试

### 步骤 4: 运行覆盖率检查
- 确认 > 80%

---

## 8. Acceptance Criteria (验收标准)

### 8.1 覆盖率

| # | 验收条件 | 目标 |
|---|---------|------|
| AC-01 | MermaidPreview 覆盖率 | > 80% |
| AC-02 | MermaidEditor 覆盖率 | > 80% |
| AC-03 | MermaidCodeEditor 覆盖率 | > 80% |
| AC-04 | 总体覆盖率 | > 80% |

### 8.2 功能

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-05 | 所有图表类型测试通过 | npm test |
| AC-06 | 错误处理测试通过 | npm test |
| AC-07 | 布局方向测试通过 | npm test |

---

## 9. Definition of Done (DoD)

### 9.1 功能 DoD

| # | 条件 |
|---|------|
| DoD-1 | MermaidEditor 有 15+ 测试用例 |
| DoD-2 | MermaidCodeEditor 有 12+ 测试用例 |
| DoD-3 | MermaidPreview 扩展到 15+ 测试用例 |
| DoD-4 | 覆盖所有图表类型 (flowchart, class, state, sequence) |
| DoD-5 | 覆盖所有错误处理场景 |
| DoD-6 | 覆盖所有布局方向 (TB, LR, BT, RL) |

### 9.2 质量 DoD

| # | 条件 |
|---|------|
| DoD-7 | 所有测试通过 |
| DoD-8 | 总体测试覆盖率 > 80% |
| DoD-9 | 每个组件覆盖率 > 80% |
| DoD-10 | 无测试警告 |

---

## 10. Timeline Estimate

| 阶段 | 工作量 |
|------|--------|
| MermaidEditor 测试 | 2h |
| MermaidCodeEditor 测试 | 1.5h |
| MermaidPreview 扩展 | 1h |
| 覆盖率验证 | 0.5h |
| **总计** | **5h** |

---

## 11. Dependencies

- **前置**: analyze-testing-needs (已完成)
- **依赖**: Jest, Testing Library

---

*PRD 完成于 2026-03-05 (PM Agent)*
