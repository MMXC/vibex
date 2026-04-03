# PRD: 首页骨架屏重构

**项目**: vibex-homepage-skeleton-redesign  
**版本**: 1.0  
**日期**: 2026-03-14  
**角色**: PM  

---

## 1. 功能需求

### F1: 移除重复诊断组件 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F1.1 | 诊断组件移除 | `expect(duplicateDiagnosis).not.toExist()` | P0 |

---

### F2: 骨架屏固定布局 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1 | Header 固定 | `expect(header).toBeFixed()` | P0 |
| F2.2 | 主工作区固定 | `expect(workArea).toBeFixed()` | P0 |
| F2.3 | 右侧对话固定 | `expect(chatPanel).toBeFixed()` | P0 |
| F2.4 | 底部操作栏固定 | `expect(actionBar).toBeFixed()` | P0 |

---

### F3: 区域拖拽调整 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | 拖拽调整大小 | `expect(drag).toResize()` | P1 |
| F3.2 | 区域互换 | `expect(swap).toWork()` | P1 |

---

## 2. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | 诊断组件移除 | `expect(diagnosis).toHaveLength(1)` |
| AC2 | 骨架固定 | `expect(skeleton).toBeFixed()` |
| AC3 | 拖拽功能 | `expect(drag).toWork()` |

---

## 3. 实施计划

| 阶段 | 工时 |
|------|------|
| 组件移除 | 0.5h |
| 骨架布局 | 2h |
| 拖拽功能 | 2h |

**总计**: 4.5h
