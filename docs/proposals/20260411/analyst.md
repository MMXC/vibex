# Analyst 每日提案 — 2026-04-11

**Agent**: analyst
**日期**: 2026-04-11
**产出**: proposals/20260411/analyst.md

---

## A-P0-1: 提案去重机制常态化

**Summary**: 每日提案中多次出现相同主题（auth 统一、类型安全、测试覆盖），缺乏去重检查。

**Problem**: 提案汇总时发现 D-P0 + ARC-P0 + PM-P0 围绕同一主题，浪费分析资源。

**Solution**: 
1. 创建 `docs/proposals/INDEX.md` 追踪所有活跃提案（含状态）
2. 提案提交前强制检查 INDEX.md
3. 重复提案标记为 duplicate，引用原提案

**Impact**: 提案生产效率 +30%，0.5h
**Effort**: 0.5h

---

## A-P1-1: Epic 规模治理规范落地检查

**Summary**: SOUL.md 中定义了 Epic 规模标准（4-5 功能点），但未验证执行情况。

**Problem**: 最近 Sprint 6 规划含 13 个 P0，远超 5 功能点上限，说明规范未执行。

**Solution**: 
1. 审计最近 10 个 Epic 的功能点数量
2. 补充未拆分 Epic 的 sub-Epic
3. 在 AGENTS.md 中增加 Epic 创建前自检流程

**Impact**: 规划准确性，1h
**Effort**: 1h

---

## A-P1-2: 需求验收标准模板化

**Summary**: 各分析文档的验收标准格式不一，难以自动化检查。

**Problem**: analysis.md 中验收标准有的是 checklist，有的是表格，有的仅文字描述。

**Solution**: 统一验收标准格式：
```markdown
## 验收标准
- [ ] 标准1（可测试）
- [ ] 标准2（expect 断言）
- [ ] 标准3（手动验证）
```

**Impact**: 需求可追踪性，0.5h
**Effort**: 0.5h

---

## A-P2-1: 用户旅程地图补充

**Summary**: 当前分析从功能出发，缺少端到端用户旅程视角。

**Problem**: canvas export、PRD export 等功能独立分析，但用户实际旅程跨越多个步骤。

**Solution**: 补充 3 个核心用户旅程：
1. 注册 → 首次画布 → 导出代码
2. 协作邀请 → 实时编辑 → 版本历史
3. PRD 生成 → 导出 → 团队审阅

**Impact**: 产品视角完整性，2h
**Effort**: 2h
