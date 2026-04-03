# PRD: 首页迭代优化

**项目**: vibex-homepage-iteration  
**版本**: 1.0  
**日期**: 2026-03-14  
**角色**: PM  

---

## 1. 执行摘要

**背景**: 首页 10 项 UI 改进需求 + 11 项集成测试。

**优先级**: Bug > UI 优化 > Feature > Test

---

## 2. Epic 拆分

### Epic 1: Critical Bug 修复

**需求**: R4 (design 404), R2 (Step 标题重复), R3 (重复诊断模块)

#### F1: 修复 design 404

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F1.1 | 链接重定向 | `expect(link).toRedirect('/confirm')` | P0 |

#### F2: Step 标题修复

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1 | 标题去重 | `expect(titles).toHaveUnique()` | P1 |

#### F3: 移除重复诊断模块

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | 模块移除 | `expect(duplicateModule).not.toExist()` | P1 |

---

### Epic 2: High 优先级 UI

**需求**: R6 (示例交互), R5 (布局调整), R1 (画布展示)

#### F4: 示例交互优化 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F4.1 | 示例展示 | `expect(examples).toBeVisible()` | P1 |
| F4.2 | 示例点击 | `expect(clickExample).toFillInput()` | P1 |

#### F5: 布局可调整 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F5.1 | 拖拽调整 | `expect(drag).toResize()` | P2 |

#### F6: 中央画布展示 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F6.1 | 画布渲染 | `expect(canvas).toRender()` | P2 |
| F6.2 | 内容居中 | `expect(center).toAlign()` | P2 |

---

### Epic 3: Medium/Low 功能

**需求**: R10 (登录抽屉), R9 (游客体验), R7 (组件关系图), R8 (导入项目)

#### F7: 单页登录抽屉 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F7.1 | 抽屉组件 | `expect(drawer).toOpen()` | P2 |
| F7.2 | 登录表单 | `expect(form).toSubmit()` | P2 |

#### F8: 游客体验优化 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F8.1 | 游客标识 | `expect(guestBadge).toShow()` | P3 |
| F8.2 | 引导提示 | `expect(guide).toDisplay()` | P3 |

#### F9: 页面组件关系图 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F9.1 | 关系图展示 | `expect(diagram).toRender()` | P2 |

#### F10: 导入自有项目 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F10.1 | 导入入口 | `expect(importBtn).toVisible()` | P2 |
| F10.2 | 文件解析 | `expect(parse).toExtract()` | P2 |

---

### Epic 4: 集成测试

**需求**: IT-001 ~ IT-011

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F11.1 | 导航测试 | `expect(nav).toWork()` | P3 |
| F11.2 | 输入测试 | `expect(input).toWork()` | P3 |
| F11.3 | 生成测试 | `expect(generate).toWork()` | P3 |

---

## 3. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | design 链接修复 | `expect(link).toRedirect()` |
| AC2 | Step 标题唯一 | `expect(titles).toHaveLength(5)` |
| AC3 | 诊断模块唯一 | `expect(diagnosis).toHaveLength(1)` |
| AC4 | 示例可点击 | `expect(click).toFill()` |
| AC5 | 布局可调 | `expect(resize).toWork()` |
| AC6 | 画布居中 | `expect(center).toAlign()` |

---

## 4. 实施计划

| Epic | 任务 | 工时 |
|------|------|------|
| 1 | Bug 修复 | 2h |
| 2 | High UI | 8h |
| 3 | Medium 功能 | 21h |
| 4 | 集成测试 | 8h |

**总计**: ~39h
