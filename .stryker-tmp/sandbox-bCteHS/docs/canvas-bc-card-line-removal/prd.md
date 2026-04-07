# PRD: canvas-bc-card-line-removal — 删除上下文树卡片连线

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

BoundedContextTree 卡片之间显示的 SVG 贝塞尔曲线连线（RelationshipConnector）增加视觉干扰，需要移除以简化 UI。

### 目标

注释掉 RelationshipConnector 组件，简化上下文树界面。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 连线可见性 | 0 | E2E 截图验证 |

---

## 2. Epic 拆分

### Epic 1: 注释 RelationshipConnector

**工时**: 0.5h | **优先级**: P0

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 注释组件 | BoundedContextTree.tsx 注释掉 RelationshipConnector | `expect(hasConnector).toBe(false)` | 【需页面集成】 |
| F1.2 | 截图验证 | 打开上下文树无连线 SVG | `expect(lineCount).toBe(0)` | 【需页面集成】 |
| F1.3 | 回归验证 | 卡片拖拽功能正常 | `expect(dragWorks).toBe(true)` | 【需页面集成】 |

#### DoD

- [ ] RelationshipConnector 注释掉
- [ ] 截图验证无连线
- [ ] 卡片拖拽功能正常

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 23:46 GMT+8*
