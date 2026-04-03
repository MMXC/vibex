# PRD: VibeX 文档健康度修复

**项目**: vibex-doc-fix-20260328
**任务**: create-prd (pm)
**版本**: 1.0.0
**日期**: 2026-03-28
**工作目录**: /root/.openclaw/vibex
**分析依据**: vibex-doc-fix-20260328/analysis.md

---

## 1. 背景与目标

### 1.1 问题摘要

| 问题 | 当前状态 | 目标状态 |
|------|----------|----------|
| api-contract.yaml 路由缺失 | 14 个端点，前端调用 51 个 | 覆盖 100% 前端调用 |
| 废弃文档堆积 | 47 个废弃文档散落 docs/ | 归档至 archive/202603-stale/ |

### 1.2 目标

1. **重建 API 契约文档**，确保前端所有 API 调用都在 `api-contract.yaml` 中有定义
2. **归档废弃文档**，清理 docs/ 目录，消除"40+ 废弃文档"警告
3. **建立文档生命周期规范**，防止未来债务积累

---

## 2. Epic & Story 拆分

### Epic 1: API Contract 重建
**目标**: 消除 72.5% 的契约缺口，让前端所有 API 调用都有迹可循

---

**Story 1.1** | `F1.1` | P0 | 30min
**标题**: 提取后端路由完整清单并按领域分类

**验收标准**:
```bash
# expect: 后端路由清单已生成到 docs/vibex-doc-fix-20260328/backend-routes.md
expect(test -f docs/vibex-doc-fix-20260328/backend-routes.md).toBe(true)
# expect: 清单包含 39 个路径前缀，57 个 route.ts 文件
expect(wc -l < docs/vibex-doc-fix-20260328/backend-routes.md).toBeGreaterThan(50)
# expect: 每个路径前缀有功能描述和 HTTP 方法标注
expect(grep -c "HTTP\|描述\|group" docs/vibex-doc-fix-20260328/backend-routes.md).toBeGreaterThan(10)
```

---

**Story 1.2** | `F1.2` | P0 | 30min
**标题**: 提取前端 API 调用清单

**验收标准**:
```bash
# expect: 前端 API 调用清单已生成到 docs/vibex-doc-fix-20260328/frontend-calls.md
expect(test -f docs/vibex-doc-fix-20260328/frontend-calls.md).toBe(true)
# expect: 清单包含至少 51 个路径（对应已知前端调用数）
expect(grep -c "^/" docs/vibex-doc-fix-20260328/frontend-calls.md).toBeGreaterThanOrEqual(51)
```

---

**Story 1.3** | `F1.3` | P0 | 1.5h
**标题**: 生成新版 api-contract.yaml，覆盖所有前端调用

**验收标准**:
```bash
# expect: api-contract.yaml 已更新
expect(test -f src/lib/api-contract.yaml).toBe(true)
# expect: 契约中定义的路径数 >= 51（覆盖全部前端调用）
expect(yq eval '.paths | length' src/lib/api-contract.yaml).toBeGreaterThanOrEqual(51)
# expect: 契约不含 v1 双写路由（仅保留 /api/v1 前缀或无前缀统一）
expect(yq eval '.paths | keys | any_c | contains("v1")' src/lib/api-contract.yaml).toBe(true)
# expect: 认证模块已完整: login, register, logout, me
expect(yq eval '.paths | has("/auth/login")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/auth/me")' src/lib/api-contract.yaml).toBe(true)
# expect: 需求管理模块已完整: /requirements CRUD + analyze + clarifications
expect(yq eval '.paths | has("/requirements")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/requirements/{id}/analyze")' src/lib/api-contract.yaml).toBe(true)
# expect: DDD 模块已完整: bounded-context, business-flow, domain-model
expect(yq eval '.paths | has("/ddd/bounded-context")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/ddd/business-flow")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/ddd/domain-model")' src/lib/api-contract.yaml).toBe(true)
# expect: 流程生成模块已完整
expect(yq eval '.paths | has("/flow/generate")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/flow/derive")' src/lib/api-contract.yaml).toBe(true)
# expect: 原型快照模块已完整
expect(yq eval '.paths | has("/prototype-snapshots")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/prototype/generate")' src/lib/api-contract.yaml).toBe(true)
# expect: 澄清模块已完整: ask, accept, clarifications
expect(yq eval '.paths | has("/clarify/ask")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/clarify/accept")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/clarifications/{id}")' src/lib/api-contract.yaml).toBe(true)
# expect: 域/实体管理已完整
expect(yq eval '.paths | has("/domains/{id}")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/entity-relations")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/domain-entities")' src/lib/api-contract.yaml).toBe(true)
# expect: 设计/诊断模块已完整
expect(yq eval '.paths | has("/design/session")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/diagnosis/analyze")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/domain/derive")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/domain/generate")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/pages/derive")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/pages/generate")' src/lib/api-contract.yaml).toBe(true)
# expect: 项目软删除/恢复链已完整
expect(yq eval '.paths | has("/projects/deleted")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/projects/{id}/restore")' src/lib/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/projects/{id}/permanent")' src/lib/api-contract.yaml).toBe(true)
# expect: 项目角色查询已定义
expect(yq eval '.paths | has("/projects/{id}/role")' src/lib/api-contract.yaml).toBe(true)
```

---

**Story 1.4** | `F1.4` | P1 | 30min
**标题**: 验证 api-contract.yaml 格式正确且可解析

**验收标准**:
```bash
# expect: YAML 文件可被 yq 解析
expect(yq eval '.' src/lib/api-contract.yaml | wc -c).toBeGreaterThan(100)
# expect: YAML 包含 openapi 3.0 版本声明
expect(yq eval '.openapi' src/lib/api-contract.yaml).toContain("3.")
# expect: YAML 包含 info 块（title + version）
expect(yq eval '.info.title' src/lib/api-contract.yaml).toBeTruthy()
# expect: Swagger UI 或 redoc 可正常渲染（手动测试）
# expect: 契约文件中没有重复路径定义
expect(yq eval '.paths | keys | unique | length' src/lib/api-contract.yaml).toBe(yq eval '.paths | keys | length')
```

---

**Story 1.5** | `F1.5` | P2 | 1h
**标题**: 标注契约缺口——后端独有但前端未调用的路由

**验收标准**:
```bash
# expect: 存在 docs/vibex-doc-fix-20260328/unused-routes.md 记录后端独有路由
expect(test -f docs/vibex-doc-fix-20260328/unused-routes.md).toBe(true)
# expect: 文件列出 OAuth、Canvas 生成、GitHub 集成等未调用路由
expect(grep -c "oauth\|canvas\|github" docs/vibex-doc-fix-20260328/unused-routes.md).toBeGreaterThan(0)
```

---

### Epic 2: 废弃文档归档
**目标**: 消除 docs/ 目录中的废弃文档警告，建立归档规范

---

**Story 2.1** | `F2.1` | P0 | 15min
**标题**: 创建归档目录结构

**验收标准**:
```bash
# expect: archive 目录存在
expect(test -d docs/archive/202603-stale).toBe(true)
# expect: 目录包含 README.md 说明归档用途
expect(test -f docs/archive/202603-stale/README.md).toBe(true)
# expect: README 说明归档原则：只移不删，保留文件名和时间戳
expect(grep -c "移动\|归档\|不删除" docs/archive/202603-stale/README.md).toBeGreaterThan(0)
```

---

**Story 2.2** | `F2.2` | P0 | 1h
**标题**: 归档全部 47 个废弃文档

**验收标准**:
```bash
# expect: 47 个 tester-checklist 文件已移动到 archive/
CHECKLIST_COUNT=$(find docs/archive/202603-stale -name "tester-checklist*" | wc -l)
expect(checklist_count).toBeGreaterThanOrEqual(7)
# expect: 40+ 历史项目文档已归档
PROJECT_COUNT=$(find docs/archive/202603-stale -maxdepth 1 -name "*-20*" -o -name "*-fix*" -o -name "*-improve*" | wc -l)
expect(project_count).toBeGreaterThanOrEqual(40)
# expect: 归档文件总数量 >= 47
TOTAL=$(find docs/archive/202603-stale -type f | wc -l)
expect(total).toBeGreaterThanOrEqual(47)
# expect: 原始 docs/ 目录不再包含 tester-checklist-*.md 文件
expect(find docs -maxdepth 1 -name "tester-checklist*.md" | wc -l).toBe(0)
```

**归档清单确认**:

*P0 - tester-checklist（7 个）*:
- tester-checklist-coord-workflow-improvement.md
- tester-checklist-domain-model-crash-fix.md
- tester-checklist-navbar-projects-fix.md
- tester-checklist-vibex-domain-model-crash.md
- tester-checklist-vibex-domain-model-render-fix-v2.md
- tester-checklist-vibex-issue-knowledge-base.md
- tester-checklist-vibex-template-ecosystem.md

*P1 - 历史项目文档（40 个，含子目录）*:
- homepage-*.md 系列 (~20 个)
- domain-model-*.md 系列 (~5 个)
- button-*.md / css-*.md 系列 (~4 个)
- api-*.md 系列 (~6 个)
- security-*.md 系列 (~4 个)
- test-infra-*.md 系列 (~5 个)
- proposal-dedup-*.md 系列 (~8 个)
- review-reports/ 目录（整体归档，30+ 个单次审查报告）

*约束*: 不删除任何文件，仅移动

---

**Story 2.3** | `F2.3` | P1 | 30min
**标题**: 更新 docs/README.md，建立文档生命周期规范

**验收标准**:
```bash
# expect: docs/README.md 已更新
expect(test -f docs/README.md).toBe(true)
# expect: 包含归档目录说明
expect(grep -c "archive" docs/README.md).toBeGreaterThan(0)
# expect: 包含文档命名规范（禁止 tester-checklist- 命名，禁止 -fix/-improve 后缀）
expect(grep -c "命名\|naming\|规范" docs/README.md).toBeGreaterThan(0)
# expect: 包含文档归档规则：项目完成 30 天后归档
expect(grep -c "30\|归档\|archive" docs/README.md).toBeGreaterThan(0)
```

---

**Story 2.4** | `F2.4` | P2 | 30min
**标题**: 更新 CLAUDE.md 中的过时文档引用

**验收标准**:
```bash
# expect: CLAUDE.md 中不包含已归档文件的路径引用
# 验证方法：遍历 archive/ 中所有文件，检查 CLAUDE.md 中无对应引用
ARCHIVED_FILES=$(find docs/archive/202603-stale -type f -name "*.md")
for f in $ARCHIVED_FILES; do
  basename "$f" | xargs -I{} grep -q {} CLAUDE.md && echo "FAIL: {} still referenced"
done
# expect: 所有检查通过（无输出）
```

---

## 3. 优先级矩阵

| 功能 ID | 功能名称 | Epic | 优先级 | 工作量 | 依赖 | 风险 |
|---------|----------|------|--------|--------|------|------|
| F1.1 | 提取后端路由清单并分类 | Epic 1 | P0 | 30min | 无 | 低 |
| F1.2 | 提取前端 API 调用清单 | Epic 1 | P0 | 30min | 无 | 低 |
| F1.3 | 生成新版 api-contract.yaml | Epic 1 | P0 | 1.5h | F1.1, F1.2 | 中 |
| F1.4 | 验证 YAML 格式正确性 | Epic 1 | P1 | 30min | F1.3 | 低 |
| F1.5 | 标注后端独有路由 | Epic 1 | P2 | 1h | F1.3 | 低 |
| F2.1 | 创建归档目录结构 | Epic 2 | P0 | 15min | 无 | 低 |
| F2.2 | 归档全部 47 个废弃文档 | Epic 2 | P0 | 1h | F2.1 | 中 |
| F2.3 | 更新 docs/README.md | Epic 2 | P1 | 30min | F2.2 | 低 |
| F2.4 | 更新 CLAUDE.md 引用 | Epic 2 | P2 | 30min | F2.2 | 低 |

---

## 4. 实施计划

### Sprint 1: API Contract 重建（3h）
```
Day 1
├─ 09:00 F1.1 提取后端路由清单
├─ 09:30 F1.2 提取前端 API 调用
├─ 10:00 F1.3 生成新版 api-contract.yaml
└─ 11:30 F1.4 验证 YAML 格式
```

### Sprint 2: 文档归档（2.5h）
```
Day 1
├─ 13:00 F2.1 创建归档目录
├─ 13:15 F2.2 归档 47 个废弃文档
├─ 14:15 F2.3 更新 docs/README.md
└─ 14:45 F2.4 更新 CLAUDE.md 引用
```

---

## 5. 约束（红线）

1. **只移不删** — 归档操作只移动文件，禁止删除任何文档
2. **保留已有正确定义** — 更新 api-contract.yaml 时不得删除已有的正确端点定义
3. **禁止破坏引用** — 归档后确保 CLAUDE.md 等核心文档不引用已归档文件
4. **保留最近 30 天活跃项目** — docs/ 根目录保留最近 30 天内活跃项目的文档

---

## 6. 验收总览

| # | 验收项 | Epic | 验收方式 |
|---|--------|------|----------|
| A1 | api-contract.yaml 覆盖 >= 51 个前端调用路径 | Epic 1 | `yq` 解析计数 |
| A2 | YAML 文件格式可被 OpenAPI 3.0 解析器解析 | Epic 1 | `yq eval` 无报错 |
| A3 | docs/ 目录不含 tester-checklist-*.md | Epic 2 | `find` 零结果 |
| A4 | archive/202603-stale/ 包含 >= 47 个归档文件 | Epic 2 | `find` 计数 |
| A5 | docs/README.md 包含归档规范 | Epic 2 | `grep` 关键词 |
| A6 | CLAUDE.md 无已归档文件引用 | Epic 2 | 脚本遍历验证 |
| A7 | F1.5 产出后端独有路由清单（未调用路由） | Epic 1 | 文件存在性检查 |

---

**PRD 完成**: 2026-03-28 13:40 GMT+8
**预计总工时**: 5.5 小时
**下一步**: Architect 阶段 — 架构设计评审（确认 YAML 生成方案和归档脚本方案）
