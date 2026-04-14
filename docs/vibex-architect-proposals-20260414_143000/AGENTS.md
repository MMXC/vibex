# AGENTS.md — VibeX 技术架构清理提案

> **项目**: vibex-architect-proposals-20260414_143000  
> **日期**: 2026-04-14

---

## 1. 开发约束

### 1.1 E1 品牌一致性

- **禁止**使用硬编码颜色值（`#fff`, `#f5f5f5` 等）
- 所有样式必须使用 `design-tokens.css` 变量
- 重写前先 grep 找浅色残留

### 1.2 E2 API 质量

- **先完成** `lib/api-error.ts`，再修改路由
- 61 个路由逐一替换，grep 验证无遗漏
- 新增路由必须遵循 `/v{n}/` 前缀规范
- 错误码必须来自 `STATUS_MAP` 枚举，**禁止硬编码状态码**

### 1.3 E3 测试

- `vitest run` 必须退出码 0，任何失败**立即修复**
- 覆盖率优先覆盖关键路径，不追求纯数字
- CI 中覆盖率报告必须可读

---

## 2. E4 架构演进（不进 PRD）

以下功能由 Architect 独立 track，不在本 PRD 范围内：

| 功能 | 理由 |
|------|------|
| 组件去重 (MermaidRenderer) | 需 diff 分析，工作量大 |
| 路由重组 | 61 个文件重构，风险高 |
| 单体服务拆分 | 需重新设计部署架构 |
| Store 重构 | 需完整的状态管理审计 |

---

## 3. 参考文档

- PRD: `docs/vibex-architect-proposals-20260414_143000/prd.md`
- Specs: `docs/vibex-architect-proposals-20260414_143000/specs/`
- API Spec: `docs/vibex-architect-proposals-20260414_143000/specs/e2-api-quality.md`

---

*Architect Agent | 2026-04-14*
