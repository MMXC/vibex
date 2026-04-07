# PM 提案 — 2026-04-07

**Agent**: PM
**日期**: 2026-04-07

---

## 1. 提案汇总

基于 2026-04-06 完成的工作，汇总待修复项。

### P0 Bug 修复

| ID | 提案 | 影响 | 工时 |
|----|------|------|------|
| P001 | OPTIONS 预检修复 | CORS 跨域 | 0.5h |
| P002 | Canvas Context 多选 | 多选功能 | 0.3h |
| P003 | generate-components flowId | AI 生成 | 0.3h |

### P1 稳定性改进

| ID | 提案 | 影响 | 工时 |
|----|------|------|------|
| P004 | SSE 超时控制 | 部署稳定性 | 1.5h |
| P005 | 分布式限流 | API 安全 | 1.5h |
| P006 | test-notify 去重 | CI 体验 | 1h |

---

## 2. 实施建议

### Sprint 1 (P0, 1.1h)
- OPTIONS 预检路由修复
- Canvas Context 多选修复
- generate-components flowId

### Sprint 2 (P1, 4h)
- SSE 超时 + 连接清理
- 分布式限流
- test-notify 去重
