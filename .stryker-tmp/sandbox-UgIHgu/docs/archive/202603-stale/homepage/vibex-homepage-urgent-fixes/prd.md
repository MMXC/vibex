# PRD: 首页紧急修复

**项目**: vibex-homepage-urgent-fixes  
**版本**: 1.0  
**日期**: 2026-03-14  
**角色**: PM  

---

## 1. 执行摘要

**背景**: 首页 9 个问题，5 个严重 Bug，3 个中等 UX，1 个功能增强。

**优先级**: #1 领域模型报错 > #5 面板功能 > #9 步骤切换

---

## 2. Epic 拆分

### Epic 1: Critical Bug 修复

#### F1: 领域模型生成报错

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F1.1 | lines undefined 修复 | `expect(lines).toBeDefined()` | P0 |

#### F2: React Hydration 错误

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1 | SSR 修复 | `expect(hydrationError).not.toExist()` | P0 |

#### F3: 面板最大化最小化无效

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | 最大化功能 | `expect(maximize).toWork()` | P0 |
| F3.2 | 最小化功能 | `expect(minimize).toWork()` | P0 |

#### F4: 步骤切换 Bug

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F4.1 | 自由切换 | `expect(switchStep).toWork()` | P0 |

---

### Epic 2: UX 优化

#### F5: 按钮交互优化 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F5.1 | 按钮反馈 | `expect(feedback).toShow()` | P1 |

#### F6: 分析进度条 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F6.1 | 进度显示 | `expect(progressBar).toShow()` | P1 |

#### F7: 示例点击未填入 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F7.1 | 点击填入 | `expect(clickExample).toFillInput()` | P1 |

---

### Epic 3: 功能增强

#### F8: 流程勾选上下文传递 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F8.1 | 勾选传递 | `expect(selection).toPass()` | P1 |

#### F9: Panel 区域调整 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F9.1 | 大小调整 | `expect(resize).toWork()` | P2 |

---

## 3. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | 领域模型生成 | `expect(generate).not.toThrow()` |
| AC2 | Hydration 错误 | `expect(error).not.toExist()` |
| AC3 | 面板功能 | `expect(panel).toWork()` |
| AC4 | 步骤切换 | `expect(switch).toWork()` |

---

## 4. 实施计划

| Epic | 工时 |
|------|------|
| 1: Critical Bug | 2.5d |
| 2: UX 优化 | 1.5d |
| 3: 功能增强 | 1.5d |

**总计**: 5.5d
