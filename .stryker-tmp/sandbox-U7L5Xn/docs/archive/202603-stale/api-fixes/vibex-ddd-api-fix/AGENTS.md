# AGENTS.md: vibex-ddd-api-fix

> 架构师指派任务契约

## 任务分配

| 阶段 | Agent | 任务 ID | 依赖 | 验收标准 |
|------|-------|---------|------|----------|
| Phase 1 | Analyst | analyze-requirements | — | ✅ 完成 |
| Phase 1 | PM | create-prd | analyze-requirements | ✅ 完成 |
| Phase 1 | Architect | design-architecture | create-prd | ✅ 完成 |
| Phase 1 | Coord | coord-decision | design-architecture | ⏳ 待审批 |
| Phase 2 | Dev | fix-ddd-api-routing | coord-decision | 路由对齐 + Schema + Mermaid |
| Phase 2 | Tester | test-ddd-api-routing | fix-ddd-api-routing | 覆盖率 > 80% |
| Phase 2 | Reviewer | review-ddd-api-routing | test-ddd-api-routing | 代码质量检查 |
| Phase 2 | Reviewer | review-push-ddd-api-routing | review-ddd-api-routing | 推送验证 |

## 核心文件

- 分析: `docs/vibex-ddd-api-fix/analysis.md`
- PRD: `docs/vibex-ddd-api-fix/prd.md`
- 架构: `docs/vibex-ddd-api-fix/architecture.md`
- 计划: `docs/vibex-ddd-api-fix/IMPLEMENTATION_PLAN.md`

## Dev 验收命令

```bash
cd /root/.openclaw/vibex/vibex-fronted
npm test -- --grep "bounded-context"
npm run build
```

## Tester 验收命令

```bash
cd /root/.openclaw/vibex/vibex-fronted
npm test
```

## Reviewer 驳回红线

- ❌ 前端 API 路由未更新
- ❌ 无 Zod schema 验证
- ❌ Mermaid 生成器无边逻辑
- ❌ npm test 失败
- ❌ npm run build 失败

---

*Architect Agent | 2026-03-20*
