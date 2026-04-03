# PRD: homepage-v4-fix

**状态**: 进行中  
**创建日期**: 2026-03-21  
**项目经理**: PM Agent  
**目标**: 修复首页布局与设计文档不一致，集成右侧AI思考列表和底部面板组件

---

## 执行摘要

本项目旨在修复 `homepage-v4` 实现与设计稿的不一致问题。核心问题包括：布局方式差异（Flex vs Grid）、主题色差异（深色 vs 浅色）、右侧AI思考列表未集成、底部面板缺失。

| 指标 | 目标 | 当前状态 |
|------|------|----------|
| 布局一致性 | 100% 匹配设计稿 | ❌ 待修复 |
| AIPanel 集成 | 已集成并渲染 | ❌ 未使用 |
| 底部面板 | 380px 固定高度 | ❌ 缺失 |
| 主题一致性 | 浅色主题 | ❌ 深色主题 |

---

## 1. Epic 拆分

### Epic 1: 右侧AI思考列表集成（P0）

| Story ID | 描述 | 状态 | 验收标准 |
|----------|------|------|----------|
| ST-1.1 | AIPanel 组件集成到 HomePage | 🔄 pending | `expect(screen.queryByTestId('ai-panel')).toBeInTheDocument()` |
| ST-1.2 | thinkingMessages 数据渲染 | 🔄 pending | `expect(aiPanelItems.length).toBe(thinkingMessages.length)` |
| ST-1.3 | 新项目脉冲动画效果 | 🔄 pending | `expect(newItemAnimation).toBeVisible()` |

### Epic 2: 底部面板组件（P0）

| Story ID | 描述 | 状态 | 验收标准 |
|----------|------|------|----------|
| ST-2.1 | 底部面板布局结构 | 🔄 pending | `expect(bottomPanel.height).toBe(380)` |
| ST-2.2 | 收起手柄（30px） | 🔄 pending | `expect(handle.height).toBe(30)` |
| ST-2.3 | 需求录入区（80px） | 🔄 pending | `expect(inputArea.height).toBe(80)` |
| ST-2.4 | 操作按钮栏（50px） | 🔄 pending | `expect(actionButtons.height).toBe(50)` |
| ST-2.5 | AI展示区（flex 3列卡片） | 🔄 pending | `expect(aiCards.columns).toBe(3)` |

### Epic 3: 布局与主题调整（P1）

| Story ID | 描述 | 状态 | 验收标准 |
|----------|------|------|----------|
| ST-3.1 | 布局方式决策（Grid/Flex） | 🔄 pending | `expect(layoutMethod).toBeOneOf(['grid', 'flex'])` |
| ST-3.2 | 主题色调整（浅色） | 🔄 pending | `expect(theme).toBe('light')` |

### Epic 4: 视觉一致性验证（P1）

| Story ID | 描述 | 状态 | 验收标准 |
|----------|------|------|----------|
| ST-4.1 | 三栏宽度匹配设计稿 | 🔄 pending | `expect(leftDrawer.width).toBe(220); expect(rightDrawer.width).toBe(260)` |
| ST-4.2 | 左侧抽屉背景色 | 🔄 pending | `expect(leftDrawer.bg).toBe('#f9fafb')` |
| ST-4.3 | 预览区渐变背景 | 🔄 pending | `expect(previewArea.bg).toContain('linear-gradient')` |

---

## 2. 功能需求

### F1: AIPanel 集成

| 属性 | 值 |
|------|-----|
| 功能点 | 在 HomePage 右侧抽屉集成 AI 思考列表 |
| 验收标准 | `expect(AIPanel).toBeRendered(); expect(thinkingItems.length).toBeGreaterThan(0)` |
| 页面集成 | 右侧抽屉（260px） |

### F2: 底部面板

| 属性 | 值 |
|------|-----|
| 功能点 | 新增底部面板，包含收起手柄、输入区、按钮栏、AI展示 |
| 验收标准 | `expect(bottomPanel).toBeVisible(); expect(height).toBe(380)` |
| 页面集成 | 底部固定区域 |

### F3: 布局一致性

| 属性 | 值 |
|------|-----|
| 功能点 | 调整布局以匹配设计稿（Grid 或等效 Flex） |
| 验收标准 | `expect(layout).toMatchSnapshot('homepage-layout')` |
| 页面集成 | 全页布局 |

### F4: 主题一致性

| 属性 | 值 |
|------|-----|
| 功能点 | 调整主题为浅色以匹配设计稿 |
| 验收标准 | `expect(document.body).toHaveClass('theme-light')` |
| 页面集成 | 全局主题 |

---

## 3. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | 页面首次加载 < 2s |
| **响应式** | 最小宽度 1200px |
| **可访问性** | WCAG 2.1 AA 标准 |
| **兼容性** | Chrome/Firefox/Safari 最新版 |

---

## 4. 验收标准

### P0 — 必须完成

| ID | 验收项 | 测试断言 |
|----|--------|----------|
| AC-P0-1 | AIPanel 已集成 | `expect(screen.getByTestId('ai-panel')).toBeInTheDocument()` |
| AC-P0-2 | AI 思考列表可渲染 | `expect(screen.getAllByRole('listitem', { name: /AI思考/ })).toHaveLength(thinkingMessages.length)` |
| AC-P0-3 | 底部面板高度 380px | `expect(bottomPanel).toHaveAttribute('style', /height: 380px/)` |
| AC-P0-4 | 底部面板子组件存在 | `expect(handle).toBeVisible(); expect(inputArea).toBeVisible(); expect(buttons).toBeVisible(); expect(aiCards).toBeVisible()` |
| AC-P0-5 | 新建项目脉冲动画 | `expect(newProjectItem).toHaveClass(/pulse-animation/)` |

### P1 — 建议完成

| ID | 验收项 | 测试断言 |
|----|--------|----------|
| AC-P1-1 | 三栏布局宽度正确 | `expect(leftDrawer).toHaveStyle({ width: '220px' }); expect(rightDrawer).toHaveStyle({ width: '260px' })` |
| AC-P1-2 | 左侧抽屉浅色背景 | `expect(leftDrawer).toHaveStyle({ backgroundColor: '#f9fafb' })` |
| AC-P1-3 | 浅色主题应用 | `expect(document.body).toHaveClass('theme-light')` |

### P2 — 增强

| ID | 验收项 | 测试断言 |
|----|--------|----------|
| AC-P2-1 | 布局截图对比 | `expect(layout).toMatchSnapshot()` |

---

## 5. 工作量评估

| 任务 | 负责人 | 工时 | 状态 |
|------|--------|------|------|
| 分析需求 | Analyst | 1h | ✅ |
| AIPanel 集成 | Dev | 2h | 🔄 |
| 底部面板开发 | Dev | 4h | 🔄 |
| 布局调整 | Dev | 2h | 🔄 |
| 主题调整 | Dev | 1h | 🔄 |
| 测试验证 | Tester | 2h | 🔄 |

**待完成**: 11h

---

## 6. 依赖关系

| 前置任务 | 依赖方 | 说明 |
|----------|--------|------|
| analyze-requirements | create-prd | 本 PRD |
| create-prd | design-architecture | Architect 架构设计 |
| design-architecture | implement | Dev 实现 |
| implement | test | Tester 测试 |

---

## 7. 设计稿规格参考

### 布局结构
```
Grid: grid-template-rows: 50px 1fr 380px;
      grid-template-columns: 220px 1fr 260px;

+------------------------------------------+
|              Header (50px)               |
+----------+---------------+---------------+
|  Left    |    Preview    |    Right     |
|  Drawer  |     Area      |    Drawer    |
| (220px)  |    (1fr)      |   (260px)    |
+----------+---------------+---------------+
|           Bottom Panel (380px)            |
+------------------------------------------+
```

### 底部面板结构
```
+------------------------------------------+
|           Handle (30px)                  |
+------------------------------------------+
|           Input Area (80px)              |
+------------------------------------------+
|         Action Buttons (50px)            |
+------------------------------------------+
|     AI Display Cards (flex, 3列)         |
+------------------------------------------+
```

---

## 8. 产出物

| 产出物 | 路径 | 状态 |
|--------|------|------|
| 分析报告 | `docs/homepage-v4-fix/analysis.md` | ✅ |
| 本 PRD | `docs/homepage-v4-fix/prd.md` | ✅ |
| 架构文档 | `docs/homepage-v4-fix/architecture.md` | 🔄 |
| 规格文档 | `docs/homepage-v4-fix/specs/` | 🔄 |

---

**文档状态**: PRD 完成  
**下一步**: Architect 架构设计 → Dev 实现 → Tester 测试
