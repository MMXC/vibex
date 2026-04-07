# IMPLEMENTATION_PLAN: vibex-selfcheck-path-normalization

## 实施步骤

### Epic 1: 路径规范落地
1. 更新各 agent HEARTBEAT.md，明确报告路径格式
2. 迁移现有报告到新路径
3. 验证：reviewer 可从规范路径读取所有报告

## 验收
所有 agent 报告统一路径格式

## 实现记录

### Epic 1: 路径规范落地 ✅
- [x] analyst HEARTBEAT.md: `docs/_bmad-output/product-brief.md` → `docs/{project}/analysis.md`
- [x] pm HEARTBEAT.md: `docs/prd/xxx.md` → `docs/{project}/prd.md`
- [x] architect HEARTBEAT.md: `docs/architecture/xxx.md` → `docs/{project}/architecture.md`
- [x] reviewer HEARTBEAT.md: 补充 `docs/{project}/review.md` 规范
- 验收：所有 agent 报告统一路径格式 `docs/{project}/`
