# PRD: 按钮拆分方案

**项目**: vibex-button-split
**产品经理**: PM Agent
**日期**: 2026-03-17
**版本**: 1.0
**状态**: Done
**优先级**: P1

---

## 1. 执行摘要

### 1.1 背景

首页当前有一个统一的"🚀 开始生成"按钮，拆分为 4 个独立按钮，提供更细粒度的用户控制。

> ⚠️ **小羊澄清 (2026-03-17 19:11)**:
> - 页面结构分析是**新功能**
> - 流程分析按钮**仅生成业务流程**（领域模型不要了）
> - 保留原"开始生成"按钮作为快捷入口

### 1.2 目标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 按钮数量 | 1 | 4 |
| 用户控制粒度 | 粗 | 细 |
| 流程透明度 | 低 | 高 |

### 1.3 预估工时

1-2 天

---

## 2. 功能需求

### F1: ActionButtons 组件创建

**描述**: 创建独立的 ActionButtons 组件，包含 4 个拆分按钮 + 保留原按钮【需页面集成】

**验收标准**:
- [ ] F1.1: 4 个独立按钮正确渲染 (expect(4 buttons rendered))
- [ ] F1.2: 保留原"开始生成"按钮作为快捷入口 (expect(original button preserved))
- [ ] F1.3: 按钮放置在 InputArea 底部 (expect(buttons in InputArea footer))
- [ ] F1.4: 按钮样式与现有设计一致 (expect(style matches existing))

### F2: 按钮状态控制

**描述**: 按钮根据前置条件动态启用/禁用

**验收标准**:
- [ ] F2.1: 上下文分析按钮：requirementText.trim().length > 0 时启用 (expect(context button enabled when text exists))
- [ ] F2.2: 流程分析按钮：boundedContexts.length > 0 时启用 (expect(flow button enabled when contexts exist))
- [ ] F2.3: 页面结构按钮：businessFlow !== null 时启用 (expect(page button enabled when flow exists))
- [ ] F2.4: 创建项目按钮：pageStructureAnalyzed === true 时启用 (expect(create button enabled when page analyzed))
- [ ] F2.5: 禁用状态显示 tooltip (expect(disabled tooltip shown))

### F3: 按钮事件绑定

**描述**: 每个按钮绑定正确的点击事件

**验收标准**:
- [ ] F3.1: 点击上下文分析 → 调用 generateContexts() (expect(onGenerateContexts called))
- [ ] F3.2: 点击流程分析 → 仅调用 generateBusinessFlow() (仅业务流程) (expect(only business flow generated))
- [ ] F3.3: 点击页面结构 → 调用 analyzePageStructure() (新功能) (expect(page analysis triggered))
- [ ] F3.4: 点击创建项目 → 调用 onCreateProject() (expect(project creation triggered))
- [ ] F3.5: 点击原"开始生成" → 保留原有逻辑 (expect(original behavior preserved))

### F4: 状态管理扩展

**描述**: 扩展 useHomePage hook 支持新状态

**验收标准**:
- [ ] F4.1: 新增 pageStructureAnalyzed 状态 (expect(state exists))
- [ ] F4.2: 新增 pageStructure 状态 (expect(state exists))
- [ ] F4.3: 新增 analyzePageStructure 回调 (expect(callback exists))

### F5: 加载状态指示

**描述**: 生成过程中显示加载状态

**验收标准**:
- [ ] F5.1: 加载时按钮显示 loading 图标 (expect(loading icon shown))
- [ ] F5.2: 当前生成按钮高亮 (expect(active button highlighted))
- [ ] F5.3: 加载完成状态清除 (expect(state cleared on complete))

---

## 3. Epic 拆分

| Epic ID | 名称 | 工作量 | 负责人 |
|---------|------|--------|--------|
| E-001 | ActionButtons 组件 | 2h | Dev |
| E-002 | 按钮状态逻辑 | 2h | Dev |
| E-003 | 状态管理扩展 | 2h | Dev |
| E-004 | 集成测试 | 2h | Tester |

**总工作量**: 8 小时

---

## 4. 验收标准

### 4.1 成功标准

| ID | 标准 | 验证方法 |
|----|------|----------|
| AC-001 | 4 按钮正确渲染 | E2E 测试 |
| AC-002 | 按钮状态动态变化 | 手动测试 |
| AC-003 | 加载状态正确显示 | 手动测试 |
| AC-004 | 不破坏现有布局 | 视觉检查 |

### 4.2 DoD

- [ ] 所有按钮点击事件正常工作
- [ ] 状态控制逻辑正确
- [ ] 现有测试通过
- [ ] 代码审查通过

---

## 5. 约束条件

- ✅ 不修改现有 API 接口
- ✅ 保持现有测试通过
- ✅ 仅修改 InputArea 和相关 hooks
