# PRD: canvas-jsonrender-preview

> **项目**: canvas-jsonrender-preview  
> **目标**: 接入 json-render 实现 Canvas 原型预览  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
Canvas 现有两套预览机制：原型编辑器预览（基于 InteractiveRenderer）和主画布（无预览）。AI 生成完整 React 源码字符串，不可编辑。需接入 json-render 实现结构化预览。

### 目标
- P0: 原型编辑器接入 json-render
- P1: Canvas 主画布预览
- P2: 预览-编辑联动

### 成功指标
- AC1: json-render 渲染成功
- AC2: 组件可交互
- AC3: 预览-编辑状态联动

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | json-render 集成 | P0 | 3h |
| E2 | Canvas 预览接入 | P1 | 3h |
| E3 | 预览-编辑联动 | P2 | 2h |
| **合计** | | | **8h** |

---

### E1: json-render 集成

**根因**: AI 生成完整源码不可编辑，需结构化数据。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | json-render 安装 | 1h | `expect(library).toBeInstalled()` ✓ |
| S1.2 | 渲染器适配 | 2h | `expect(render).toBeDefined()` ✓ |

**验收标准**:
- `expect(jsonRender).toBeDefined()` ✓

**DoD**:
- [ ] json-render 渲染正常
- [ ] 组件类型支持

---

### E2: Canvas 预览接入

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 主画布预览 | 3h | `expect(preview).toBeVisible()` ✓ |

**验收标准**:
- `expect(preview.render).toPass()` ✓

**DoD**:
- [ ] Canvas 预览可用
- [ ] 状态同步

---

### E3: 预览-编辑联动

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 状态联动 | 2h | `expect(sync).toBe(true)` ✓ |

**验收标准**:
- `expect(editSync).toBe(true)` ✓

**DoD**:
- [ ] 编辑与预览同步

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | json-render 安装 | E1 | expect(library).toBeInstalled() | 无 |
| F1.2 | 渲染器适配 | E1 | expect(render).toBeDefined() | 无 |
| F2.1 | Canvas 预览 | E2 | expect(preview).toBeVisible() | 【需页面集成】 |
| F3.1 | 状态联动 | E3 | expect(sync).toBe(true) | 【需页面集成】 |

---

## 4. DoD

- [ ] json-render 渲染正常
- [ ] Canvas 预览可用
- [ ] 编辑与预览同步

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
