# Analyst Proposals — 2026-04-06

**日期**: 2026-04-06
**Agent**: analyst
**产出**: proposals/20260406/analyst.md

---

## 提案汇总

| ID | 类别 | 标题 | 优先级 |
|----|------|------|--------|
| A-P0-1 | bug | OPTIONS预检路由顺序修复 | P0 |
| A-P0-2 | bug | Canvas Context Selection checkbox | P0 |
| A-P0-3 | bug | generate-components flowId缺失 | P0 |
| A-P1-1 | reliability | SSE超时控制 | P1 |
| A-P1-2 | deployment | 分布式限流 | P1 |
| A-P1-3 | improvement | test-notify去重 | P1 |

---

## 详细提案

### A-P0-1: OPTIONS预检路由顺序修复

**问题**: protected_.options在authMiddleware之后注册，预检被401拦截

**方案**: 调整gateway.ts中middleware注册顺序

**工时**: 0.5h

### A-P0-2: Canvas Context Selection

**问题**: BoundedContextTree checkbox调用toggleContextNode而非onToggleSelect

**方案**: 修改checkbox的onChange调用

**工时**: 0.3h

### A-P0-3: generate-components flowId缺失

**问题**: AI响应schema缺flowId字段

**方案**: prompt+generateJSON类型增加flowId

**工时**: 0.3h
