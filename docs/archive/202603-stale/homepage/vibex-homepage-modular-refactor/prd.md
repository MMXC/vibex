# PRD: 首页模块化重构

**项目**: vibex-homepage-modular-refactor  
**版本**: 1.0  
**日期**: 2026-03-15  
**角色**: PM  

---

## 1. 执行摘要

**背景**: 首页 `page.tsx` 1142 行，CSS 1297 行，需拆分为 5 个独立模块。

**目标**: 组件化拆分，提升可维护性和可测试性。

---

## 2. Epic 拆分

### Epic 1: 组件框架创建

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 目录结构 | 创建 components/home 目录 | `expect(dir).toExist()` | |
| F1.2 | 导出索引 | 创建 index.ts 统一导出 | `expect(export).toWork()` | |
| F1.3 | 类型定义 | 提取组件 Props 类型 | `expect(types).toBeDefined()` | |

### Epic 2: Sidebar + Navbar 拆分

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | Navbar 组件 | 提取导航栏为独立组件 | `expect(navbar).toRender()` | 【需页面集成】 |
| F2.2 | Sidebar 组件 | 提取侧边栏为独立组件 | `expect(sidebar).toRender()` | 【需页面集成】 |
| F2.3 | 导航链接 | 保持原有导航功能 | `expect(link).toWork()` | 【需页面集成】 |

### Epic 3: PreviewArea + InputArea 拆分

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | PreviewArea | 提取预览区域组件 | `expect(preview).toRender()` | 【需页面集成】 |
| F3.2 | InputArea | 提取输入区域组件 | `expect(input).toRender()` | 【需页面集成】 |
| F3.3 | 节点勾选 | 保持勾选功能 | `expect(checkbox).toWork()` | 【需页面集成】 |

### Epic 4: AIPanel + Hooks 拆分

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | AIPanel 组件 | 提取 AI 面板为独立组件 | `expect(aiPanel).toRender()` | 【需页面集成】 |
| F4.2 | ThinkingPanel | 提取思考面板组件 | `expect(thinking).toRender()` | 【需页面集成】 |
| F4.3 | 自定义 Hooks | 提取业务逻辑 hooks | `expect(hook).toWork()` | |

### Epic 5: 样式优化 + 空间调整

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | CSS Modules | 使用 CSS Modules | `expect(cssModule).toWork()` | 【需页面集成】 |
| F5.2 | 空间利用率 | 提升至 85%+ | `expect(utilization).toBe(85)` | 【需页面集成】 |
| F5.3 | 响应式布局 | 适配不同屏幕 | `expect(responsive).toWork()` | 【需页面集成】 |

### Epic 6: 测试 + 文档

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | 组件测试 | 编写单元测试 | `expect(test).toPass()` | |
| F6.2 | 集成测试 | 验证页面渲染 | `expect(integration).toPass()` | |
| F6.3 | README | 组件使用文档 | `expect(doc).toExist()` | |

---

## 3. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | page.tsx < 200 行 | `expect(lines).toBeLessThan(200)` |
| AC2 | 每个组件独立可测试 | `expect(component).toBeTestable()` |
| AC3 | npm test 通过 | `expect(test).toPass()` |
| AC4 | 功能无回归 | `expect(regression).not.toExist()` |
| AC5 | CSS 文件模块化 | `expect(cssModule).toWork()` |

---

## 4. 实施计划

| Epic | 任务 | 工时 |
|------|------|------|
| 1 | 组件框架 | 0.5d |
| 2 | Navbar + Sidebar | 1d |
| 3 | Preview + Input | 1d |
| 4 | AIPanel + Hooks | 1d |
| 5 | 样式优化 | 0.5d |
| 6 | 测试 + 文档 | 1d |

**总计**: 5d
