# PRD: Plan/Build 双模式切换

**项目**: vibex-plan-build-mode  
**版本**: 1.0  
**日期**: 2026-03-14  
**角色**: PM  

---

## 1. 执行摘要

**背景**: 当前一键生成模式对复杂需求处理准确率较低。

**目标**: Plan/Build 双模式切换，复杂需求准确率提升 25%。

---

## 2. 功能需求

### F1: 模式切换 UI 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F1.1 | 模式选择器 | `expect(selector).toShow('Plan'|'Build')` | P0 |
| F1.2 | Plan 按钮 | `expect(planBtn).toBeVisible()` | P0 |
| F1.3 | Build 按钮 | `expect(buildBtn).toBeVisible()` | P0 |
| F1.4 | 当前模式指示 | `expect(currentMode).toBe('Plan'|'Build')` | P0 |

### F2: Plan 模式 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1 | AI 理解展示 | `expect(understanding).toShow()` | P0 |
| F2.2 | 需求摘要 | `expect(summary).toContain(keyPoints)` | P0 |
| F2.3 | 确认按钮 | `expect(confirmBtn).toTriggerBuild()` | P0 |
| F2.4 | 调整入口 | `expect(adjustLink).toOpenEdit()` | P0 |

### F3: Build 模式

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | 直接生成 | `expect(generate).toStartImmediately()` | P0 |
| F3.2 | 流式输出 | `expect(stream).toShowResult()` | P0 |
| F3.3 | 跳过确认 | `expect(skipConfirm).toWork()` | P0 |

### F4: 模式状态管理

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F4.1 | 模式记忆 | `expect(rememberMode).toPersist()` | P0 |
| F4.2 | 切换动画 | `expect(transition).toAnimate()` | P0 |
| F4.3 | 快捷键支持 | `expect(shortcut).toWork()` | P1 |

---

## 3. Epic 拆分

### Epic 1: 模式选择 UI 【需页面集成】

| Story | 验收 |
|-------|------|
| S1.1 按钮组件 | `expect(buttons).toRender()` |
| S1.2 模式指示 | `expect(indicator).toShow()` |

### Epic 2: Plan 模式

| Story | 验收 |
|-------|------|
| S2.1 理解展示 | `expect(understand).toShow()` |
| S2.2 确认流程 | `expect(confirm).toTriggerBuild()` |

### Epic 3: Build 模式

| Story | 验收 |
|-------|------|
| S3.1 直接生成 | `expect(generate).toStart()` |
| S3.2 结果展示 | `expect(result).toShow()` |

---

## 4. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | 模式切换 | `expect(switch).toWork()` |
| AC2 | Plan 确认 | `expect(confirm).toTriggerBuild()` |
| AC3 | Build 直接生成 | `expect(generate).toStart()` |
| AC4 | 模式记忆 | `expect(persist).toSave()` |

---

## 5. 实施计划

| 阶段 | 任务 | 工时 |
|------|------|------|
| 1 | UI 组件 | 1d |
| 2 | Plan 模式 | 2d |
| 3 | Build 模式 | 1d |

**总计**: 4d
