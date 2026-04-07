# Vibex Simplified Flow — API Specs 索引

> 所有 API 的独立规格说明文档。每个 Spec 包含：数据结构、测试用例、示例、边界条件、AI Prompt（涉及时）。

---

## 规范

每个 Spec 文件命名格式: `SPEC-XX-name.md`

每个 Spec 必须包含以下章节：

| 章节 | 必填 | 说明 |
|------|------|------|
| 基本信息 | ✅ | API 名称、模块、负责人、状态、日期 |
| 功能说明 | ✅ | 简洁功能描述 |
| 接口定义 | ✅ | Method、Path、Auth、Request/Response |
| 示例 | ✅ | curl 示例 |
| 边界条件 | ✅ | 错误场景 + 期望输出 |
| 测试用例 | ✅ | 单元测试 + E2E 测试 |
| 验证命令 | ✅ | curl 验证命令 |
| AI Prompt | ⭐ | 仅 AI 生成类 API |
| 关联 Specs | ✅ | 依赖和被依赖的 Spec |
| 变更记录 | ✅ | 版本历史 |

---

## Spec 清单

### 生成类 (AI, 流式)

| # | Spec | API | 流式 | Agent |
|---|------|-----|------|-------|
| 01 | `SPEC-01-business-domain-generate.md` | `POST /api/business-domain/generate` | ✅ SSE | dev |
| 02 | `SPEC-02-flow-generate.md` | `POST /api/flow/generate` | ✅ SSE | dev |
| 08 | `SPEC-08-ui-nodes-generate.md` | `POST /api/ui-nodes/generate` | ❌ | dev |

### 数据操作类

| # | Spec | API | 说明 |
|---|------|-----|------|
| 03 | `SPEC-03-project-snapshot.md` | `GET /api/projects?id=&include=snapshot` | 完整快照 (核心) |
| 04 | `SPEC-04-step-state.md` | `POST /api/step-state` | Autosave |

### 项目管理类

| # | Spec | API | 说明 |
|---|------|-----|------|
| 05 | `SPEC-05-project-convert.md` | `POST /api/projects/convert` | 草稿转正式 |
| 06 | `SPEC-06-project-clone.md` | `POST /api/projects/clone` | 克隆/模板 |
| 07 | `SPEC-07-project-rollback.md` | `POST /api/projects?action=rollback` | 版本回滚 |
| 09 | `SPEC-09-templates.md` | `GET /api/templates` | 模板市场 |

### 模板

| # | Spec | 说明 |
|---|------|------|
| — | `SPEC-template.md` | 通用模板 |

---

## 验收流程

```
dev 创建/更新 Spec
    ↓
dev 实现 API
    ↓
dev 运行 Spec 中的测试用例
    ↓
dev 运行 Spec 中的验证命令
    ↓
reviewer 审查 Spec + 实现
    ↓
通过 → 更新状态: approved
失败 → 驳回 → dev 修复
```

---

## 状态定义

| 状态 | 说明 |
|------|------|
| `draft` | 草稿，编写中 |
| `in-review` | 审查中 |
| `approved` | 已批准，可实现 |
| `deprecated` | 已废弃 |

---

## 最近更新

| 日期 | Spec | 变更 |
|------|------|------|
| 2026-03-23 | SPEC-01 ~ SPEC-09 | 初始版本 |
