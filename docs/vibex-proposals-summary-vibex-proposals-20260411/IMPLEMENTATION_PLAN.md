# IMPLEMENTATION_PLAN: VibeX Proposals Summary 2026-04-11

> **项目**: vibex-proposals-summary-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## Sprint 规划

| Sprint | 周期 | Phase | 工时 |
|--------|------|-------|------|
| Sprint 1 | Day 1-2 | Phase 1: 止血 | 29.75h |
| Sprint 2 | Day 3-5 | Phase 2: 筑基 | 44.75h |
| Sprint 3 | Day 6-10 | Phase 3: 体验 | 24h |

**总工时**: ~98.5h | **团队**: 2 Dev | **周期**: ~10 周

---

## Sprint 1: Phase 1 止血（29.75h）

### E-P0-1: P0 Tech Debt（8h）

| Story | 描述 | 工时 |
|--------|------|------|
| S1.1 | Slack token 环境变量化 | 0.5h |
| S1.2 | ESLint no-explicit-any 清理 | 1h |
| S1.3 | PrismaClient Workers 守卫 | 1h |
| S1.4 | @ci-blocking 批量移除 | 1h |

### E-P0-2: API 路由治理（4h）

| Story | 描述 | 工时 |
|--------|------|------|
| S2.1 | v0 Deprecation header | 2h |
| S2.2 | v1 路由覆盖验证 | 1h |

### E-P0-3: WebSocket 治理（6h）

| Story | 描述 | 工时 |
|--------|------|------|
| S3.1 | maxConnections 限制 | 2h |
| S3.2 | 心跳机制 | 2h |
| S3.3 | 死连接清理 | 2h |

### E-P0-4: 需求质量（10h）

| Story | 描述 | 工时 |
|--------|------|------|
| S4.1 | AI 智能补全 | 5h |
| S4.2 | 项目搜索过滤 | 3h |
| S4.3 | flowId E2E | 2h |

### E-P0-5: 测试基础设施（1.75h）

| Story | 描述 | 工时 |
|--------|------|------|
| S5.1 | 删除 grepInvert | 0.5h |
| S5.2 | 删除双重 Playwright 配置 | 1h |
| S5.3 | stability.spec.ts 路径修复 | 0.25h |

---

## Sprint 2-3: Phase 2 筑基（44.75h）

| Epic | 主题 | 工时 |
|------|------|------|
| E-P1-1 | 日志+健壮性 | 9h |
| E-P1-2 | Auth 统一 | 4h |
| E-P1-3 | 类型安全 | 5.5h |
| E-P1-4 | 测试质量 | 8.25h |
| E-P1-5 | 企业协作 | 13h |
| E-P1-6 | 提案闭环 | 2h |
| E-P1-7 | 类型共享 | 3h |

---

## Sprint 4-5: Phase 3 体验（24h）

| Epic | 主题 | 工时 |
|------|------|------|
| E-P2-1 | 体验优化 | 8h |
| E-P2-2 | 质量保障 | 5h |
| E-P2-3 | 安全扫描 | 4h |
| E-P2-4 | MCP 可观测 | 3h |
| E-P2-5 | 代码一致性 | 4h |

---

## 关键里程碑

| Milestone | 验收 | 时间 |
|-----------|------|------|
| M1: P0 止血完成 | E-P0-1 ~ E-P0-5 全部 done | Sprint 1 末 |
| M2: 类型安全基线 | E-P1-3 + E-P1-7 全部 done | Sprint 2 末 |
| M3: 测试门禁恢复 | E-P0-5 + E-P1-4 全部 done | Sprint 2 末 |
| M4: 核心 Feature 上线 | E-P0-4 + E-P1-5 全部 done | Sprint 3 末 |

---

## 回滚计划

| Sprint | 回滚命令 | 时间 |
|--------|---------|------|
| Sprint 1 | `git checkout HEAD~1 -- src/` | <5 min |
| Sprint 2 | `git checkout HEAD~1 -- src/` | <5 min |
| Sprint 3 | `git checkout HEAD~1 -- src/` | <5 min |

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
