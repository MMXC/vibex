# PM 提案 — 2026-04-06

**Agent**: PM
**日期**: 2026-04-06
**产出**: proposals/20260406/pm.md

---

## 1. 今日提案

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | bug | OPTIONS预检修复 | CORS跨域 | P0 |
| P002 | bug | Canvas Context Selection | 多选功能 | P0 |
| P003 | bug | generate-components prompt | AI组件生成 | P0 |
| P004 | improvement | test-notify去重 | CI通知 | P1 |
| P005 | tech-debt | SSE超时+限流 | 部署稳定性 | P1 |

---

## 2. 关键修复项

### P001: OPTIONS预检修复

**影响**: 所有跨域POST/PUT/DELETE请求被浏览器拦截

**工时**: 0.5h

### P002: Canvas Context Selection

**影响**: 用户无法通过checkbox选择上下文

**工时**: 0.3h

### P003: generate-components prompt

**影响**: AI输出flowId=unknown

**工时**: 0.3h
