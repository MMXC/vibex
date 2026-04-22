# Implementation Plan: VibeX PM 提案 — 产品功能实现

> **项目**: vibex-pm-proposals-20260414_143000  
> **日期**: 2026-04-14  
> **总工时**: 16h（原 14h + E5 修正 +2h）

**工程审查结论**: 通过（需修订）— 发现 6 个阻断问题已全部修正：
1. E5 复用误解 → 修正为自行实现（+2h）
2. E8 schema 未定义 → 添加 DDDImportSchema
3. E8 round-trip 测试逻辑错误 → 修正为语义等价的 JSON.parse 比较
4. E3 D1 query 错误 → 修正为返回结果后内存过滤
5. E8 MD 范围蔓延 → 明确 MD 为 v2
6. E6 FK 缺失 → 添加注释说明

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 品牌一致性 | U1 | ✅ | — |
| E2: 核心价值链 | U2 | ✅ | — |
| E3: 效率体验 | U3 | ✅ | — |
| E4: Canvas 导航 | U4 | ⬜ | U4 |
| E5: 错误体验 | U5 | ⬜ | U5 |
| E6: 团队协作 | U6 | ⬜ | U6 |
| E7: 版本历史 | U7 | ⬜ | U7 |
| E8: 导入导出 | U8 | ⬜ | U8 |

**依赖说明**: U6 依赖 U5（统一错误格式），U8 无依赖可独立实现

---

## Overview

8 个 Epic，总工时 14h。按依赖关系分 3 个 Sprint。

---

## Implementation Units

> **单元状态说明**: ✅ = 已完成, ⬜ = 待派发, 🔄 = 进行中

---

- [x] **Unit 1: E1 Auth CSS Module 迁移**

**Goal:** 完成 auth 页面内联样式迁移。

**Requirements:** E1

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/src/app/auth/page.tsx`
- Modify: `vibex-fronted/src/app/auth/auth.module.css`
- Test: `vibex-fronted/src/app/auth/page.test.tsx`

**Approach:**
- 步骤1: `grep -rn "style={{" app/auth/page.tsx` 列出所有内联样式
- 步骤2: 逐项迁移到 auth.module.css（design tokens）
- 步骤3: 运行 specs 中的 TypeScript 验证

**Patterns to follow:**
- 参考 `DESIGN.md` 中的 design-tokens.css 变量
- 参考 `app/auth/auth.module.css` 现有命名规范

**Test scenarios:**
- Happy path: 登录表单样式正常显示
- Happy path: 注册表单样式正常显示
- Error path: 登录失败错误提示样式正确
- Edge case: auth.module.css 中无内联 style={{}}

**Verification:**
- `grep -rn "style={{" app/auth/page.tsx | grep -v validateReturnTo` 无结果

---

- [x] **Unit 2: E2 ClarificationCard 组件**

**Goal:** 从 ClarificationDialog 提取 ClarificationCard，在对话流中内嵌使用。

**Requirements:** E2

**Dependencies:** None

**Files:**
- Create: `vibex-fronted/src/components/ui/ClarificationCard.tsx`
- Create: `vibex-fronted/src/components/ui/ClarificationCard.module.css`
- Create: `vibex-fronted/src/components/ui/ClarificationCard.test.tsx`
- Modify: `vibex-fronted/src/components/homepage/Steps/ClarificationStep.tsx`

**Approach:**
- 步骤1: 从 `ClarificationDialog.tsx` 提取卡片 UI 部分到 `ClarificationCard.tsx`
- 步骤2: ClarificationCard 作为独立组件，通过 `variant` prop 支持 'inline' 和 'modal'
- 步骤3: 在 ClarificationStep 中替换为 ClarificationCard

**Patterns to follow:**
- 参考 `ClarificationDialog.tsx` 现有样式
- 参考 `components/ui/` 下其他组件的文件结构

**Test scenarios:**
- Happy path: 显示多个选项的 ClarificationCard
- Happy path: 显示自定义输入框
- Edge case: 空选项列表
- Integration: 选择选项后正确触发 onSelect

**Verification:**
- snapshot 测试通过
- 组件可独立渲染

---

- [x] **Unit 3: E3 Dashboard Fuzzy Search**

**Goal:** 在 Dashboard 添加模糊搜索，debounce 300ms，后端 D1 LIKE 查询。

**Requirements:** E3

**Dependencies:** None

**Files:**
- Create: `vibex-fronted/src/components/dashboard/SearchBar.tsx`
- Create: `vibex-fronted/src/components/dashboard/SearchBar.module.css`
- Create: `vibex-fronted/src/components/dashboard/SearchBar.test.tsx`
- Modify: `vibex-fronted/src/app/dashboard/page.tsx`
- Modify: `vibex-backend/src/routes/projects.ts`

**Approach:**
- 前端: SearchBar 组件，debounce 300ms，调用 GET /api/projects?q=search
- 后端: 在 projects.ts 的 GET /api/projects 中添加 `q` 参数，LIKE 查询

**Technical design:**
```typescript
// frontend SearchBar
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);
const { data } = useQuery({
  queryKey: ['projects', debouncedQuery],
  queryFn: () => fetchProjects({ q: debouncedQuery }),
  enabled: debouncedQuery.length >= 2
});

// backend: 先获取所有 projects，再在内存中过滤
// D1 不支持带参数的条件查询（需使用 wrangler d1 execute 预编译语句）
const results = await db.prepare('SELECT * FROM projects WHERE user_id = ?').bind(userId).all();
const filtered = results.results.filter(p =>
  p.name.toLowerCase().includes(q.toLowerCase())
);
```

**Test scenarios:**
- Happy path: 搜索 "project" 返回匹配项目
- Happy path: 清空搜索框显示全部
- Edge case: 特殊字符搜索（无结果）
- Performance: debounce 300ms 内不触发请求

**Verification:**
- 搜索功能正常工作
- debounce 行为正确

---

- [x] **Unit 4: E4 TabBar Phase 对齐**

> **Status**: ✅ 已完成（dev-e4-tabbar对齐）

**Goal:** TabBar 行为与 PhaseNavigator 对称，Phase1 仅显示 "输入/澄清" 步骤。

**Requirements:** E4

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/src/components/canvas/TabBar.tsx`
- Modify: `vibex-fronted/src/components/canvas/TabBar.module.css`
- Modify: `vibex-fronted/src/components/canvas/PhaseNavigator.tsx`
- Create: `vibex-fronted/src/components/canvas/__tests__/TabBarSymmetry.test.tsx`

**Approach:**
- 步骤1: TabBar 添加 phase 参数，Phase1 仅显示相关 tabs
- 步骤2: 对齐 PhaseNavigator 行为（点击 tab = 切换 phase）
- 步骤3: 两侧均可控制 phase，确保双向同步

**Test scenarios:**
- Happy path: Phase1 仅显示 "输入/澄清"
- Happy path: TabBar 点击切换 phase，PhaseNavigator 同步更新
- Integration: 画布工具栏切换 phase，TabBar 同步高亮

**Verification:**
- ✅ Phase1 TabBar tabs 数量 ≤ 其他 phase
- ✅ TabBar 和 PhaseNavigator 双向同步

---

- [x] **Unit 5: E5 统一错误处理**

> **Status**: ✅ 已完成（dev-e5-统一错误处理）

**Goal:** 全局统一 API 错误格式，复用 architect-proposals 方案。

**Requirements:** E5

**Dependencies:** None

**Files:**
- Create: `vibex-backend/src/lib/api-error.ts`
- Modify: `vibex-backend/src/middleware.ts`
- Modify: `vibex-backend/src/routes/` (所有路由的错误返回)
- Create: `vibex-fronted/src/lib/api-error-handler.ts`
- Modify: `vibex-fronted/src/middleware.ts` (如存在)

**Approach:**
- 步骤1: 在 `lib/api-error.ts` 实现统一的 `apiError()` 函数（含错误码枚举）
- 步骤2: 遍历 `routes/` 下所有文件，替换裸字符串错误返回
- 步骤3: 前端实现统一的 API 错误处理 hooks

**工时说明**: 这是**实际 4h 工作量**（非"复用"），包含 61 个路由文件替换

**Technical design:**
```typescript
// vibex-backend/src/lib/api-error.ts
export function apiError(status: number, code: string, message: string) {
  return new Response(JSON.stringify({
    error: { code, message }
  }), { status, headers: { 'Content-Type': 'application/json' } });
}
```

**Test scenarios:**
- Integration: 每个 API 错误返回统一格式 `{ error: { code, message } }`
- Error path: 前端正确解析错误并显示 toast

**Verification:**
- ✅ 所有 API 错误格式一致（`{ error, code, status, details? }`）
- ✅ 全部 10 个未使用 apiError 的路由文件已迁移
- ✅ chat.ts 2 处漏网之鱼已修复
- ✅ component-manager.ts 3 处裸错误返回已修复
- ✅ ai-ui-generation.ts 3 处裸错误返回已修复

---

- [x] **Unit 6: E6 Teams API**

> **Status**: ✅ 已完成（dev-e6-teamsapi）

**Goal:** 实现团队协作 API，包括 CRUD、成员管理和权限检查。

**Requirements:** E6

**Dependencies:** Unit 5 (错误格式)

**Files:**
- Create: `vibex-backend/src/routes/v1/teams/index.ts`
- Create: `vibex-backend/src/routes/v1/teams/:id.ts`
- Create: `vibex-backend/src/routes/v1/teams/:id/members.ts`
- Create: `vibex-backend/src/routes/v1/teams/:id/permissions.ts`
- Create: `vibex-backend/migrations/001_add_teams.sql`
- Create: `vibex-backend/src/services/TeamService.ts`
- Create: `vibex-backend/src/services/TeamService.test.ts`
- Modify: `vibex-fronted/src/services/api/` (添加 teams API client)

**Approach:**
- 步骤1: 创建 D1 migration 添加 teams/members 表
- 步骤2: 实现 TeamService（CRUD + 权限检查）
- 步骤3: 实现各 API 路由
- 步骤4: 前端 API client
- 步骤5: 前端 UI（Settings > Team 管理）

**Test scenarios:**
- Happy path: 创建团队，添加成员，列出成员
- Error path: 非 owner 删除团队返回 403
- Error path: 重复添加成员返回 409
- Integration: 成员列表显示正确角色

**Verification:**
- ✅ D1 migration 0011_add_teams.sql 创建
- ✅ TeamService.ts CRUD + 权限检查实现
- ✅ teams API 端到端测试通过（9 tests）
- ✅ tsc --noEmit 无错误（backend + frontend）

---

- [x] **Unit 7: E7 版本历史修复**

> **Status**: ✅ 已完成（dev-e7-版本历史）

**Goal:** 修复 version history 的 projectId=null 边界，添加 diff 视图。

**Requirements:** E7

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/src/app/version-history/page.tsx`
- Create: `vibex-fronted/src/components/version-diff/VersionDiff.tsx`
- Modify: `vibex-backend/src/routes/project-snapshot.ts` (可选)

**Approach:**
- 步骤1: page.tsx 添加 projectId=null 边界处理，显示引导 UI
- 步骤2: 复用现有 VersionDiff 组件（或增强）
- 步骤3: 确保版本历史列表与 projectId 正确关联

**Test scenarios:**
- Happy path: 有 projectId 时显示版本历史
- Edge case: projectId=null 显示引导 UI "请先创建项目"
- Integration: 切换项目后版本历史正确刷新

**Verification:**
- ✅ projectId=null 边界处理正确（useSearchParams 读取 projectId，null 时显示引导 UI）
- ✅ VersionDiff 组件已集成
- ✅ version-history.test.tsx 边界测试通过（2 tests）

---

- [ ] **Unit 8: E8 Import/Export**

> **Status**: ⬜ 待派发

**Goal:** 实现 DDD schema 导入导出（JSON/MD/YAML 格式）。

**Requirements:** E8

**Dependencies:** None

**Files:**
- Create: `vibex-backend/src/lib/importers/` (JSON/MD/YAML parsers)
- Create: `vibex-backend/src/lib/exporters/` (JSON/MD/YAML serializers)
- Create: `vibex-backend/src/routes/v1/projects/import.ts`
- Create: `vibex-backend/src/routes/v1/projects/export.ts`
- Create: `vibex-fronted/src/components/import-export/ImportExportPanel.tsx`
- Create: `vibex-backend/src/__tests__/import-export.test.ts`

**Approach:**
- 步骤1: 实现 JSON 和 YAML parser（支持 DDDImportSchema）
- 步骤2: 实现 export serializer
- 步骤3: API 路由 multipart 上传 + 流式下载
- 步骤4: 前端 ImportExportPanel

**Scope 注意**: MD 格式为 **v2**（范围蔓延），v1 仅支持 JSON 和 YAML。specs 中 MD 相关条目作为未来需求，不在当前 Sprint 实现。

**Test scenarios:**
- Happy path: JSON round-trip（导出后导入内容一致）
- Happy path: YAML round-trip
- Error path: 损坏文件解析失败返回正确错误
- Edge case: 超过 5MB 文件拒绝处理
- Edge case: 缺少必填字段（boundedContexts.name 缺失）

**Verification:**
- JSON/YAML round-trip 测试全部通过
- API 错误格式符合统一标准（E5）

---

## Dependencies

```
Unit 1 (E1)     ─────────────────┐
Unit 2 (E2)     ─────────────────┤
Unit 3 (E3)     ─────────────────┤─ 并行 (互相独立)
Unit 4 (E4)     ─────────────────┤
Unit 5 (E5)     ─────────────────┤
Unit 7 (E7)     ─────────────────┘
Unit 6 (E6)     ← 依赖 Unit 5 (错误格式)
Unit 8 (E8)     ← 无依赖
```

---

## Verification Criteria

| Epic | 验收标准 | 验证方式 |
|------|---------|---------|
| E1 | auth 页面无内联 style | grep 验证 |
| E2 | ClarificationCard 独立可用 | snapshot 测试 |
| E3 | 搜索返回正确结果 | E2E 测试 |
| E4 | TabBar 和 PhaseNavigator 对称 | 对称性测试 |
| E5 | 所有 API 错误格式统一 | 集成测试 |
| E6 | Teams CRUD + 权限正确 | API 测试 |
| E7 | projectId=null 显示引导 | 边界测试 |
| E8 | 三格式 round-trip 通过 | 单元测试 |

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| E6 D1 migration 有破坏性 | 先在测试环境执行，保留 rollback 脚本 |
| E8 MD parser 复杂 | 先实现 JSON/YAML，MD 作为 v2 |

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-pm-proposals-20260414_143000
- **执行日期**: 2026-04-14

*Implementation Plan | Architect Agent | 2026-04-14*
