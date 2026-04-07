# AGENTS.md: VibeX Proposals Summary 2026-04-11

> **项目**: vibex-proposals-summary-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## 角色定义

| 角色 | 负责人 | 职责范围 |
|------|--------|----------|
| **Dev-A** | @dev | Phase 1 P0 修复 |
| **Dev-B** | @dev | Phase 2-3 Feature 开发 |
| **Reviewer** | @reviewer | PR 审查 |
| **Architect** | @architect | 架构设计 |

---

## Sprint 分配

| Sprint | Dev-A | Dev-B |
|--------|-------|-------|
| Sprint 1 | E-P0-1, E-P0-2, E-P0-3 | E-P0-4, E-P0-5 |
| Sprint 2 | E-P1-1, E-P1-3 | E-P1-2, E-P1-4, E-P1-5 |
| Sprint 3 | E-P1-6, E-P1-7 | E-P2-1 ~ E-P2-5 |

---

## 禁止事项

| 禁止 | 正确 |
|------|------|
| `xoxp-` 硬编码 | `os.environ.get('SLACK_TOKEN')` |
| `as any` | `unknown` + 类型守卫 |
| `console.log` | `logger.info` |
| 空 catch | 结构化日志 |
| `waitForTimeout(n)` | 智能等待 |
| 双重 Playwright 配置 | 单一根配置 |

---

## DoD

- [ ] E-P0-1: task_manager 无 token，无 ESLint any
- [ ] E-P0-2: v0 有 Deprecation header
- [ ] E-P0-3: WebSocket 连接限制生效
- [ ] E-P0-4: AI 补全触发率 ≥ 80%
- [ ] E-P0-5: Playwright 配置唯一，无 grepInvert
- [ ] E-P1-7: @vibex/types 被 ≥5 模块依赖
- [ ] E-P2-1: waitForTimeout → 0

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
