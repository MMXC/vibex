# AGENTS.md — VibeX PM 提案 — 产品功能实现

> **项目**: vibex-pm-proposals-20260414_143000  
> **日期**: 2026-04-14

---

## 1. 工作约束

### 1.1 E1 Auth CSS 迁移

- `app/auth/page.tsx` 中 `validateReturnTo` 函数的内联样式**保留**（安全相关，非 UI）
- 其余所有 `style={{}}` 必须迁移到 `auth.module.css`
- 使用 `design-tokens.css` 变量，不引入新颜色

### 1.2 E5 统一错误格式

- **参照** `vibex-architect-proposals-20260414_143000` 的设计规范（**非代码复用**）
- 本项目自行实现 `lib/api-error.ts`（4h 工时）
- `apiError('VALIDATION_ERROR', 'message')` 统一使用方式
- 替换全部 61 个后端路由的错误返回

### 1.3 E6 Teams API

- **必须执行 D1 migration** (`001_add_teams.sql`)，在测试环境先验证
- 权限检查在 Service 层做，不依赖前端传递
- JWT 验证在 middleware 层统一处理

### 1.4 E8 Import/Export

- 文件大小限制 **5MB**
- 禁止解析外部 URL（防止 SSRF）
- **v1 仅支持 JSON 和 YAML**，MD 格式作为 v2 需求
- round-trip 测试覆盖 JSON 和 YAML

---

## 2. 代码规范

### 2.1 新增文件位置

```
E2 组件:  components/ui/ClarificationCard.tsx
E3 搜索:  components/dashboard/SearchBar.tsx
E4 TabBar: components/canvas/TabBar.tsx
E6 Teams:  routes/v1/teams/
E8 Import: routes/v1/projects/import.ts
E8 Export: routes/v1/projects/export.ts
```

### 2.2 测试要求

| Epic | 测试类型 | 覆盖率目标 |
|------|---------|---------|
| E1 | 回归测试 | 覆盖登录/注册表单 |
| E2 | Snapshot + 交互 | > 80% |
| E3 | E2E | 搜索流程 |
| E4 | 对称性测试 | TabBar ↔ PhaseNavigator |
| E5 | 集成测试 | 所有 API 错误路径 |
| E6 | 单元 + API | > 70% |
| E7 | 边界测试 | projectId=null |
| E8 | Round-trip | 100% 三格式 |

---

## 3. 相关文档

- PRD: `docs/vibex-pm-proposals-20260414_143000/prd.md`
- Architecture: `docs/vibex-pm-proposals-20260414_143000/architecture.md`
- Specs: `docs/vibex-pm-proposals-20260414_143000/specs/`

---

*Architect Agent | 2026-04-14*
