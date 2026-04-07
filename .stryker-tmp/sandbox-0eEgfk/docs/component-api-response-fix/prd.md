# PRD: Component API Response Fix

**项目**: component-api-response-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
`generate-components` API 返回值与前端 Zod schema 不匹配，导致 ZodError 或非法值存入 store。

### 问题
1. component type 非法值 → ZodError 或非法 type 存入 store
2. api.method 非法值 → ZodError
3. confidence undefined → ZodError
4. flowId 显示 'unknown' → 后端映射问题

### 目标
前端防御性解析，ZodError = 0，非法值有 fallback 不崩溃。

---

## Epic 拆分

### Epic 1: Defensive Parsing 实现
**工时**: 1h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | type fallback | 0.25h | expect(typeFallback).toBe('page') |
| E1-S2 | method fallback | 0.25h | expect(methodFallback).toBe('GET') |
| E1-S3 | confidence fallback | 0.25h | expect(confidenceFallback).toBe(0) |
| E1-S4 | flowId 空字符串处理 | 0.25h | expect(flowIdNotUnknown).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | type fallback | 非法值 → 'page' | expect(validType).toBe(true) | ❌ |
| F1.2 | method fallback | 非法值 → 'GET' | expect(validMethod).toBe(true) | ❌ |
| F1.3 | confidence fallback | undefined → 0 | expect(confidenceDefined).toBe(true) | ❌ |
| F1.4 | flowId 空字符串 | 'unknown' → '' | expect(flowIdNotUnknown).toBe(true) | ✅ |

---

### Epic 2: ZodError 友好错误
**工时**: 0.5h | **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | 错误处理 | 0.5h | expect(gracefulError).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 友好错误 | ZodError 时显示 toast，不白屏 | expect(noBlankScreen).toBe(true) | ✅ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | Defensive Parsing | 1h | P0 |
| E2 | ZodError 友好错误 | 0.5h | P1 |
| **总计** | | **1.5h** | |

---

## 协作依赖

| 问题 | 需要后端 |
|------|---------|
| flowId 'unknown' | ✅ 需后端检查映射逻辑 |

---

## DoD

### Epic 1: Defensive Parsing
- [ ] type 非法值 → 'page'
- [ ] method 非法值 → 'GET'
- [ ] confidence undefined → 0
- [ ] flowId 'unknown' → ''

### Epic 2: ZodError 友好错误
- [ ] ZodError 时 toast，不白屏

---

## 验收标准（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | API 返回非法 type | 解析 | type = 'page' |
| AC1.2 | API 返回非法 method | 解析 | method = 'GET' |
| AC1.3 | confidence undefined | 解析 | confidence = 0 |
| AC1.4 | flowId = 'unknown' | 解析 | flowId = '' |
| AC2.1 | ZodError | API 调用 | toast 显示，不白屏 |
