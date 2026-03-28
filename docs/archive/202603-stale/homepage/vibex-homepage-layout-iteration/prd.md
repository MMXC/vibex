# PRD: 首页布局迭代

**项目**: vibex-homepage-layout-iteration  
**版本**: 2.0  
**日期**: 2026-03-14  
**角色**: PM  

---

## 1. 执行摘要

**背景**: 对比 PRD 与代码实现，发现 7 个 Critical/High 级差异。

**目标**: 移除多余区域，调整布局参数，统一设计。

---

## 2. 功能需求

### F1: 移除多余区域

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F1.1 | 移除 Hero 区域 | `expect(hero).not.toExist()` | P0 |
| F1.2 | 移除 Features 区域 | `expect(features).not.toExist()` | P0 |

### F2: 三栏布局

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1 | Sidebar 15% | `expect(sidebar).toHaveWidth('15%')` | P0 |
| F2.2 | Content 区域 | `expect(content).toHaveWidth('70%')` | P0 |
| F2.3 | AI Panel 15% | `expect(aiPanel).toHaveWidth('15%')` | P0 |

### F3: Input 底部固定

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | Input 底部固定 | `expect(input).toBeFixed('bottom')` | P0 |
| F3.2 | Preview 占据主体 | `expect(preview).toFillSpace()` | P0 |

---

## 3. 目标布局结构

```
┌─────────────────────────────────────────────────────────────┐
│ NAVBAR (~60px)                                             │
├──────────────┬────────────────────────────┬─────────────────┤
│ SIDEBAR      │ CONTENT                  │ AI PANEL       │
│   (15%)      │      (70%)               │    (15%)       │
│              │                          │                 │
│  - 流程进度  │  [Tab: 输入/预览]        │  - 思考过程    │
│  - 项目结构  │                          │  - AI 建议     │
│              │  ┌──────────────────┐    │                 │
│              │  │   Preview 区域    │    │                 │
│              │  └──────────────────┘    │                 │
│              │                          │                 │
│              │  ┌──────────────────┐    │                 │
│              │  │ INPUT (底部固定)  │ ← 固定在底部    │
│              │  └──────────────────┘    │                 │
└──────────────┴────────────────────────────┴─────────────────┘
```

---

## 4. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | Hero 移除 | `expect(hero).not.toExist()` |
| AC2 | Features 移除 | `expect(features).not.toExist()` |
| AC3 | Sidebar 15% | `expect(width).toBe('15%')` |
| AC4 | AI Panel 15% | `expect(width).toBe('15%')` |
| AC5 | Input 底部固定 | `expect(position).toBe('fixed-bottom')` |

---

## 5. 更新内容

- ✅ 新增 F1: 移除 Hero/Features
- ✅ 新增 F2: 三栏布局参数
- ✅ 新增 F3: Input 底部固定
- ✅ 目标布局结构图
- ✅ 调整验收标准

---

## 6. 实施计划

| 阶段 | 任务 | 工时 |
|------|------|------|
| 1 | 移除区域 | 0.5d |
| 2 | 调整宽度 | 0.5d |
| 3 | 验证 | 0.5d |

**总计**: 1.5d
