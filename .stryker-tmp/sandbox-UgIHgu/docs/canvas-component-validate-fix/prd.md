# PRD: Canvas Component Validate Fix

**项目**: canvas-component-validate-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
API `/api/v1/canvas/generate-components` 返回 ZodError 验证失败。

### 问题
1. Component type 枚举不匹配
2. API method 大小写问题
3. confidence 字段缺失
4. flowId 显示 unknown

### 目标
修复 API 请求/响应验证，使 ZodError = 0。

---

## Epic 拆分

### Epic 1: Component Type 枚举修复
**工时**: 0.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 对齐 Zod schema 与 API 返回值 | 0.25h | expect(zodErrorCount).toBe(0) |
| E1-S2 | 验证测试 | 0.25h | expect(apiSuccess).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 枚举对齐 | Component type 枚举匹配 API | expect(zodErrorCount).toBe(0) | ❌ |

---

### Epic 2: API Method 大小写修复
**工时**: 0.25h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | 修复 method 大小写 | 0.25h | expect(methodCorrect).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | method 正确 | API method 大小写正确 | expect(methodCorrect).toBe(true) | ❌ |

---

### Epic 3: confidence 字段默认值
**工时**: 0.25h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | 添加默认值 | 0.25h | expect(confidenceDefault).toBeDefined() |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 默认值 | confidence 有默认值 | expect(confidenceDefault).toBeDefined() | ❌ |

---

### Epic 4: flowId 传递修复
**工时**: 0.25h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | 修复 flowId 传递 | 0.25h | expect(flowIdCorrect).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | flowId 正确 | flowId 非 unknown | expect(flowIdCorrect).toBe(true) | ❌ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | Component Type 枚举修复 | 0.5h | P0 |
| E2 | API Method 大小写修复 | 0.25h | P0 |
| E3 | confidence 字段默认值 | 0.25h | P0 |
| E4 | flowId 传递修复 | 0.25h | P0 |
| **总计** | | **1.25h** | |

---

## DoD

- [ ] ZodError = 0
- [ ] Component type 枚举匹配
- [ ] method 大小写正确
- [ ] confidence 有默认值
- [ ] flowId 非 unknown

---

## 验收标准（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | API 调用 | generate-components | ZodError = 0 |
| AC2 | API 调用 | 返回数据 | flowId 非 unknown |
