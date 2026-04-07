# Spec: E1-E4 - Canvas Component Validate Fix

## 1. 概述

**工时**: 1.25h | **优先级**: P0
**依赖**: 无

## 2. 修改范围

### 2.1 Component Type 枚举对齐

**检查**: Zod schema 与 API 返回值枚举是否匹配
**修复**: 同步枚举定义

### 2.2 API Method 大小写

**检查**: HTTP method 是否正确（GET/POST 等）
**修复**: 修正大小写

### 2.3 confidence 默认值

**检查**: confidence 字段
**修复**: 添加默认值

### 2.4 flowId 传递

**检查**: API 请求 body 中 flowId
**修复**: 确保正确传递，非 unknown

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | API 调用 | generate-components | ZodError = 0 |
| AC2 | 返回数据 | flowId | 非 unknown |

## 4. DoD

- [ ] ZodError = 0
- [ ] 枚举匹配
- [ ] method 正确
- [ ] confidence 有默认值
- [ ] flowId 正确
