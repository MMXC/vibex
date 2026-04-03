# PRD: Checkbox 勾选状态持久化修复

**项目**: checkbox-persist-bug
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
三树（ContextTree / ComponentTree / BusinessFlowTree）的 checkbox 勾选状态仅存在 Zustand store 内存中，未持久化到 JSON 数据。导致：
1. 请求 body 包含未勾选节点
2. 刷新页面后勾选状态丢失
3. 一键导入时勾选状态无法恢复

### 根因
checkbox onChange 只更新 store 状态（`isActive` / `status`），未写回 JSON 数据。

### 目标
勾选状态持久化到 JSON，刷新/导入后状态保留。

---

## Epic 拆分

### Epic 1: 数据结构扩展
**工时**: 0.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 数据结构加 selected 字段 | 0.5h | expect(dataHasSelectedField).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | selected 字段 | JSON 数据含 selected 字段 | expect(selectedInJSON).toBe(true) | ❌ |

---

### Epic 2: 三树勾选持久化
**工时**: 2h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | BoundedContextTree 持久化 | 0.75h | expect(contextPersist).toBe(true) |
| E2-S2 | ComponentTree 持久化 | 0.75h | expect(componentPersist).toBe(true) |
| E2-S3 | BusinessFlowTree 持久化 | 0.5h | expect(flowPersist).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | ContextTree 持久化 | 勾选写 JSON | expect(contextPersist).toBe(true) | ✅ |
| F2.2 | ComponentTree 持久化 | 勾选写 JSON | expect(componentPersist).toBe(true) | ✅ |
| F2.3 | FlowTree 持久化 | 勾选写 JSON | expect(flowPersist).toBe(true) | ✅ |

---

### Epic 3: Prompt 读取持久化状态
**工时**: 0.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | Prompt 读取 selected | 0.5h | expect(promptUsesSelected).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | Prompt 读取持久化 | 请求 body 只含 selected 节点 | expect(promptUsesSelected).toBe(true) | ❌ |

---

### Epic 4: 一键导入勾选状态
**工时**: 0.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | 导入恢复勾选 | 0.5h | expect(importRestoresSelected).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | 导入恢复 | 导入后勾选状态恢复 | expect(importRestoresSelected).toBe(true) | ✅ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | 数据结构扩展 | 0.5h | P0 |
| E2 | 三树勾选持久化 | 2h | P0 |
| E3 | Prompt 读取持久化 | 0.5h | P0 |
| E4 | 一键导入勾选状态 | 0.5h | P0 |
| **总计** | | **3.5h** | |

---

## Sprint 排期建议

**Sprint 0 (0.5 天)**:
- E1 + E2 + E3 + E4（3.5h 并行）

---

## DoD

### Epic 1: 数据结构扩展
- [ ] JSON 数据含 selected 字段

### Epic 2: 三树勾选持久化
- [ ] ContextTree 勾选持久化
- [ ] ComponentTree 勾选持久化
- [ ] FlowTree 勾选持久化

### Epic 3: Prompt 读取持久化
- [ ] 请求 body 只含 selected 节点

### Epic 4: 一键导入勾选状态
- [ ] 导入后勾选状态恢复

---

## 验收标准（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | JSON 数据 | 勾选后保存 | selected 字段 = true |
| AC2 | 刷新页面 | 勾选后刷新 | 勾选状态保留 |
| AC3 | API 请求 | 构造 body | 只含 selected 节点 |
| AC4 | 一键导入 | 导入含 selected 数据 | 勾选状态恢复 |
