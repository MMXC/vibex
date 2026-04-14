# AGENTS.md — VibeX Q2 Sprint 1

> **项目**: vibex-p0-q2-sprint1  
> **日期**: 2026-04-14

---

## 1. Sprint 1 范围

| Epic | 内容 | 工时 |
|------|------|------|
| E1 | Auth CSS 迁移 | 3h |
| E2 | Dashboard Search | 4h |
| E3 | Canvas TabBar | 4h |
| E4 | API Error Format | 6h |
| E5 | AI Clarification | 6h |
| E6 | Bundle Audit | 4h |
| **Total** | | **27h** |

---

## 2. 开发约束

### 2.1 E1 Auth CSS

- validateReturnTo 的内联样式**必须保留**（安全验证逻辑）
- 其余所有 `style={{}}` 必须迁移到 `auth.module.css`
- 使用 design-tokens.css 变量，禁止引入新颜色

### 2.2 E4 API Error Format

- **先完成** `lib/api-error.ts`，再修改路由
- 61 个路由逐一替换，grep 验证无遗漏
- 新增路由必须使用 `apiError()`，禁止裸字符串
- 错误码必须来自 STATUS_MAP 枚举

### 2.3 E5 ClarificationCard

- 追问 Prompt 按 specs/E5-ai-clarification.md §E5.2 执行
- 每轮最多 3 个问题，最多 3 轮
- 跳过行为按 specs §E5.3 定义

### 2.4 E6 Bundle

- **仅建立 dynamic import 脚手架**，不替换现有引用
- MermaidRenderer/TemplateSelector 合并是后续 Sprint 的范围
- bundle audit 报告提交到 Git

---

## 3. 测试要求

| Epic | 测试类型 | 覆盖率 |
|------|---------|--------|
| E1 | 回归测试 | 登录/注册表单 |
| E2 | E2E | 搜索流程 |
| E3 | 对称性测试 | TabBar ↔ PhaseNavigator |
| E4 | 集成测试 | 所有错误路径 |
| E5 | Snapshot + 交互 | > 80% |
| E6 | Bundle 报告 | top 10 |

---

## 4. CI 门控

Sprint 1 不新增 CI 门控（E6 的 bundlesize 是 Sprint 2 的范围）。

---

## 5. 参考文档

- PRD: `docs/vibex-p0-q2-sprint1/prd.md`
- Specs: `docs/vibex-p0-q2-sprint1/specs/`
- Architect Proposals: `docs/vibex-architect-proposals-20260414_143000/proposals/`

---

*Architect Agent | 2026-04-14*
