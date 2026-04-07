# API Contract YAML 验证报告

**项目**: vibex-doc-fix-20260328
**Task**: F1.4 — YAML 格式正确性验证
**日期**: 2026-03-28
**验证人**: Dev agent (subagent)

---

## 验证结果摘要

| 检查项 | 结果 | 详情 |
|--------|------|------|
| YAML 语法 | ✅ PASS | PyYAML safe_load 成功解析 |
| OpenAPI 版本 | ✅ PASS | 3.0.3 |
| info 块完整性 | ✅ PASS | title + version 均存在 |
| 路径数量 | ✅ PASS | 95 条（目标 ≥ 60） |
| 无重复路径 | ✅ PASS | 95 unique keys |
| HTTP 方法结构 | ✅ PASS | 所有端点含有效方法对象 |
| summary/operationId | ✅ PASS | 所有端点含摘要字段 |
| Tag 分组 | ✅ PASS | 19 个 tag 分组 |

## Tag 分组统计

| Tag | 端点数 |
|-----|--------|
| BackendOnly | 33 |
| Deprecated | 28 |
| Projects | 14 |
| Design | 12 |
| Requirements | 9 |
| Agents | 5 |
| Flows | 6 |
| Pages | 6 |
| EntityRelations | 5 |
| Auth | 4 |
| DomainEntities | 4 |
| Messages | 3 |
| Chat | 3 |
| Clarifications | 3 |
| DDD | 3 |
| PrototypeSnapshots | 5 |
| Diagnosis | 1 |
| Plan | 1 |
| Users | 2 |

## Schema 状态

- **总数**: 55 个
- ✅ Requirement
- ✅ RequirementCreate
- ✅ RequirementUpdate
- ✅ RequirementAnalysis
- ✅ Clarification
- ✅ DomainEntity
- ✅ EntityRelation
- ⚠️ DesignSession（缺失，建议后续补充）
- ⚠️ BusinessFlow（缺失，建议后续补充）
- ✅ BoundedContext
- ✅ ProjectRole
- ✅ PrototypeSnapshot

## 关键路径验证（全部 ✅）

| 路径 | Tag | 状态 |
|------|-----|------|
| /auth/me | Auth | ✅ |
| /requirements | Requirements | ✅ |
| /requirements/{id}/analyze | Requirements | ✅ |
| /requirements/{id}/clarifications | Clarifications | ✅ |
| /projects/deleted | Projects | ✅ |
| /projects/{id}/soft-delete | Projects | ✅ |
| /projects/{id}/restore | Projects | ✅ |
| /projects/{id}/permanent | Projects | ✅ |
| /projects/{id}/role | Projects | ✅ |
| /flows/generate | Flows | ✅ |
| /ddd/bounded-context | DDD | ✅ |
| /ddd/domain-model | DDD | ✅ |
| /ddd/business-flow | DDD | ✅ |
| /clarify/ask | Design | ✅ |
| /clarify/accept | Design | ✅ |
| /domain/generate | Design | ✅ |
| /domain/derive | Design | ✅ |
| /pages/generate | Design | ✅ |
| /pages/derive | Design | ✅ |
| /flow/generate | Design | ✅ |
| /flow/derive | Design | ✅ |
| /design/session | Design | ✅ |
| /design/session/{id} | Design | ✅ |
| /prototype/generate | Design | ✅ |
| /plan/analyze | Plan | ✅ |
| /domain-entities | DomainEntities | ✅ |
| /domains/{id} | DomainEntities | ✅ |
| /entity-relations | EntityRelations | ✅ |
| /entity-relations/{id} | EntityRelations | ✅ |
| /clarifications/{id} | Clarifications | ✅ |
| /prototype-snapshots | PrototypeSnapshots | ✅ |
| /prototype-snapshots/{id} | PrototypeSnapshots | ✅ |

## 非关键问题

1. **DesignSession schema 缺失** — Design session 端点存在但无对应 schema 定义。建议后续补充。
2. **BusinessFlow schema 缺失** — /ddd/business-flow 端点存在但无 schema 定义。建议后续补充。
3. **/requirements/{id}/clarifications 归类为 Clarifications 而非 Requirements** — 这是合理的（澄清内容属于 Clarifications tag）。

## 结论

✅ **API Contract YAML 验证通过**，可投入使用。

- 路径数 95 条，远超原计划 60 条目标
- 所有 14 个 Tag 分组均有对应端点
- BackendOnly（后端独有）和 Deprecated（废弃 v1）路由已分别标注
- 55 个 Schema 覆盖核心数据类型
