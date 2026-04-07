# PRD: 面板系统重构

**项目**: vibex-panel-system  
**版本**: 1.0  
**日期**: 2026-03-14  
**角色**: PM  

---

## 1. 执行摘要

**背景**: 当前骨架屏布局固定，用户需要类似 VS Code/Figma 的面板系统，每个区域可调整大小/全屏/小窗。

---

## 2. 功能需求

### F1: 调整大小（宽高）【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F1.1 | 四边拖拽 | `expect(dragEdge).toResize()` | P0 |
| F1.2 | 四角拖拽 | `expect(dragCorner).toResize()` | P0 |
| F1.3 | 最小调整宽度 | `expect(minWidth).toBe(100)` | P0 |
| F1.4 | 最小调整高度 | `expect(minHeight).toBe(80)` | P0 |

### F2: 最大化功能【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1 | 全屏按钮 | `expect(maxBtn).toBeVisible()` | P0 |
| F2.2 | 点击全屏 | `expect(click).toMaximize()` | P0 |
| F2.3 | 退出全屏 | `expect(exitMax).toRestore()` | P0 |

### F3: 最小化功能【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | 最小化按钮 | `expect(minBtn).toBeVisible()` | P0 |
| F3.2 | 折叠标题栏 | `expect(collapse).toTitleBar()` | P0 |
| F3.3 | 恢复展开 | `expect(expand).toRestore()` | P0 |

### F4: 浮动/小窗功能【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F4.1 | 弹出按钮 | `expect(popBtn).toBeVisible()` | P1 |
| F4.2 | 独立窗口 | `expect(popup).toNewWindow()` | P1 |
| F4.3 | 窗口拖拽 | `expect(dragWindow).toMove()` | P1 |
| F4.4 | 关闭小窗 | `expect(close).toReturn()` | P1 |

### F5: 持久化存储【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F5.1 | 保存布局 | `expect(save).toLocalStorage()` | P0 |
| F5.2 | 恢复布局 | `expect(restore).toLoad()` | P0 |
| F5.3 | 重置默认 | `expect(reset).toDefault()` | P1 |

---

## 3. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | 四边拖拽 | `expect(edgeDrag).toResize()` |
| AC2 | 全屏功能 | `expect(maximize).toWork()` |
| AC3 | 最小化 | `expect(minimize).toCollapse()` |
| AC4 | 持久化 | `expect(persist).toSave()` |

---

## 4. 实施计划

| 阶段 | 任务 | 工时 |
|------|------|------|
| 1 | 大小调整 | 2h |
| 2 | 全屏/最小化 | 1.5h |
| 3 | 浮动小窗 | 2h |
| 4 | 持久化 | 1h |

**总计**: 6.5h
