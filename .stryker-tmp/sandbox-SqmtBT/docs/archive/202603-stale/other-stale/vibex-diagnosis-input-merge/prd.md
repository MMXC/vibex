# PRD: 智能诊断与需求录入框合并

**项目**: vibex-diagnosis-input-merge  
**版本**: 1.0  
**日期**: 2026-03-14  
**角色**: PM  

---

## 1. 执行摘要

**背景**: 存在两套独立的需求输入系统，样式不一致（深色 vs 浅色），功能重叠。

**目标**: 合并为统一需求录入组件，集成智能诊断功能，体验一致性提升 80%。

---

## 2. 功能需求

### F1: 统一需求输入组件

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F1.1 | 统一输入框 | `expect(input).toHaveStyle('dark-theme')` | P0 |
| F1.2 | 实时输入 | `expect(onChange).toEmit(value)` | P0 |
| F1.3 | 占位提示 | `expect(placeholder).toBeDefined()` | P0 |

### F2: 智能诊断集成 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1 | 诊断触发 | `expect(diagnosis).toRunOn(input)` | P0 |
| F2.2 | 评分显示 | `expect(score).toShow(0-100)` | P0 |
| F2.3 | 建议展示 | `expect(suggestions).toDisplay()` | P0 |

### F3: 一键优化 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | 优化按钮 | `expect(btn).toBeVisible()` | P0 |
| F3.2 | 优化执行 | `expect(optimize).toApply()` | P0 |
| F3.3 | 结果应用 | `expect(apply).toUpdateInput()` | P0 |

### F4: 样式统一

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F4.1 | 深色主题 | `expect(bgColor).toBe('#1a1a1a')` | P0 |
| F4.2 | 组件风格 | `expect(style).toMatch(darkTheme)` | P0 |
| F4.3 | 响应式 | `expect(responsive).toWork()` | P1 |

---

## 3. Epic 拆分

### Epic 1: 统一输入组件

| Story | 验收 |
|-------|------|
| S1.1 输入框统一 | `expect(input).toUseSingleComponent()` |
| S1.2 主题统一 | `expect(theme).toBeDark()` |

### Epic 2: 诊断集成 【需页面集成】

| Story | 验收 |
|-------|------|
| S2.1 实时诊断 | `expect(diagnosis).toTriggerOnInput()` |
| S2.2 结果展示 | `expect(result).toShow()` |

### Epic 3: 优化功能

| Story | 验收 |
|-------|------|
| S3.1 一键优化 | `expect(optimize).toWork()` |
| S3.2 结果应用 | `expect(apply).toUpdate()` |

---

## 4. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | 统一输入框 | `expect(component).toBeSingle()` |
| AC2 | 深色主题 | `expect(style).toBeDark()` |
| AC3 | 诊断触发 | `expect(diagnosis).toRun()` |
| AC4 | 优化应用 | `expect(optimize).toApply()` |

---

## 5. 实施计划

| 阶段 | 任务 | 工时 |
|------|------|------|
| 1 | 组件合并 | 1d |
| 2 | 诊断集成 | 1d |
| 3 | 优化功能 | 1d |

**总计**: 3d
