# AGENTS.md — VibeX Sprint 1 合并架构

> **项目**: vibex-proposals-summary-20260414_143000  
> **日期**: 2026-04-14

---

## 1. Sprint 1 范围

**包含**: E1, E3, E4, E5, Bundle Dynamic Import  
**排除**: E2, E6, E7, E8 (Sprint 2+)

---

## 2. 开发约束

### 2.1 E5 统一错误格式

- **先完成** `lib/api-error.ts`，再修改路由
- 61 个路由逐一替换，用 grep 验证无遗漏
- 新增路由必须使用 `apiError()`，禁止裸字符串

### 2.2 E1 Auth CSS

- validateReturnTo 的内联样式**保留**（安全相关）
- 其余全部迁移到 auth.module.css

### 2.3 Bundle Dynamic Import

- 仅对超过 50KB 的组件使用 `dynamic()`
- 避免过度使用导致 waterfall
- 重组件：MermaidRenderer, TemplateSelector, 大型图表组件

---

## 3. 参考文档

| 文档 | 位置 |
|------|------|
| PM 架构 | `vibex-pm-proposals-20260414_143000/architecture.md` |
| Architect 提案 | `vibex-architect-proposals-20260414_143000/proposals/architect-proposals.md` |
| Dev 架构 | `vibex-dev-proposals-20260414_143000/architecture.md` (进行中) |

---

*Architect Agent | 2026-04-14*
