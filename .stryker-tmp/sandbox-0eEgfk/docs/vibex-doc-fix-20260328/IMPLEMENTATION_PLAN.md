# 实施计划：VibeX 文档健康度修复

**项目**: vibex-doc-fix-20260328
**任务**: design-architecture (architect)
**文档版本**: 1.0.0
**日期**: 2026-03-28
**工作目录**: /root/.openclaw/vibex
**前置依据**: architecture.md

---

## 1. 实施概述

本项目包含两个 Epic，共 9 个 Task，总工时 7.25h（≈1 人天）。

| Epic | 目标 | 工时 | 并行策略 |
|------|------|------|----------|
| Epic 1 | API Contract 重建 | 4.5h | F1.1 + F1.2 可并行 |
| Epic 2 | 废弃文档归档 | 2.75h | F2.1 → F2.2 → F2.3/F2.4 |

---

## 2. Epic 1: API Contract 重建

### F1.1 — 提取后端路由完整清单并分类
**Story ID**: `F1.1` | **优先级**: P0 | **工时**: 30min
**执行人**: Dev agent
**产出路径**: `docs/vibex-doc-fix-20260328/backend-routes.md`

**执行步骤**:

```bash
# Step 1: 扫描 Next.js App Router 路由
find /root/.openclaw/vibex/vibex-backend/src/app/api -name "route.ts" -type f | sort

# Step 2: 扫描 Express 路由（如果有）
find /root/.openclaw/vibex/vibex-backend/src/routes -name "*.ts" | grep -v __tests__ | sort

# Step 3: 提取每个路由的功能描述（读 route.ts 顶部注释）
for f in $(find ...); do
  head -20 "$f" | grep -E "description|summary|路由|API"
done

# Step 4: 按 Tag 分组写入 backend-routes.md
```

**验收标准**:
```bash
expect(test -f docs/vibex-doc-fix-20260328/backend-routes.md).toBe(true)
expect(wc -l < docs/vibex-doc-fix-20260328/backend-routes.md).toBeGreaterThan(50)
expect(grep -c "Group\|Tag\|路径前缀" docs/vibex-doc-fix-20260328/backend-routes.md).toBeGreaterThan(10)
```

**输入**: analysis.md §2.2（已有后端路由统计）
**前置依赖**: 无

---

### F1.2 — 提取前端 API 调用完整清单
**Story ID**: `F1.2` | **优先级**: P0 | **工时**: 30min
**执行人**: Dev agent
**产出路径**: `docs/vibex-doc-fix-20260328/frontend-calls.md`

**执行步骤**:

```bash
# Step 1: 扫描前端 API 模块
grep -rh "httpClient\." \
  /root/.openclaw/vibex/vibex-fronted/src/services/api/modules/ \
  --include="*.ts" | grep -v "^import\|^//\|^ \*" \
  | sed 's/.*httpClient/httpClient/' | sort -u

# Step 2: 归类每个端点的 HTTP 方法和路径
# Step 3: 按模块分组写入 frontend-calls.md
```

**验收标准**:
```bash
expect(test -f docs/vibex-doc-fix-20260328/frontend-calls.md).toBe(true)
expect(grep -c "^/" docs/vibex-doc-fix-20260328/frontend-calls.md).toBeGreaterThanOrEqual(51)
```

**输入**: analysis.md §2.3（已有 51 个前端调用路径）
**前置依赖**: 无（可与 F1.1 并行执行）

---

### F1.3 — 生成新版 api-contract.yaml（核心任务）
**Story ID**: `F1.3` | **优先级**: P0 | **工时**: 2h
**执行人**: Dev agent
**产出路径**: `docs/api-contract.yaml`（覆盖更新）
**备份**: `docs/api-contract.yaml.bak-20260328`

**执行步骤**:

```bash
# Step 1: 备份现有契约
cp docs/api-contract.yaml docs/api-contract.yaml.bak-20260328

# Step 2: 确认 yq 可用
yq --version

# Step 3: 以现有 api-contract.yaml 为蓝本
# 在 paths: 下追加以下新增路径（Group A: 4个，Group B: 34个）

# 新增 paths（按 Tag 顺序追加到 paths: 块末尾）:
# Group A 新增（4个）:
#   /auth/me GET → Auth tag
#   /projects/deleted GET → Projects tag
#   /projects/deleted-all DELETE → Projects tag
#   /projects/{projectId}/soft-delete PATCH → Projects tag
#   /projects/{projectId}/restore PATCH → Projects tag
#   /projects/{projectId}/permanent DELETE → Projects tag
#   /projects/{projectId}/role GET → Projects tag
#   /flows/generate POST → Flows tag

# Group B 新增（34个，完整清单见 architecture.md §2.2）:
# Requirements: /requirements CRUD + /requirements/{id}/analyze + reanalyze + analysis
# Clarifications: /requirements/{id}/clarifications GET + /clarifications/{id} PUT
# DomainEntities: /domain-entities GET + /domains CRUD
# EntityRelations: /entity-relations CRUD
# DDD: /ddd/bounded-context + /ddd/business-flow + /ddd/domain-model
# Design: /clarify/ask + /clarify/accept + /domain/generate + /domain/derive
#         /flow/generate + /flow/derive + /pages/generate + /pages/derive
#         /prototype/generate + /design/session + /design/session/{id}
# Plan: /plan/analyze POST
# PrototypeSnapshots: /prototype-snapshots CRUD + /prototype/generate

# Step 4: 补充缺失 schemas（在 components/schemas: 下追加）
# 需新增 13 个 schema（见 architecture.md §2.3）
```

**关键实现 — YAML 路径追加模板**（以 `/auth/me` 为例）:

```yaml
  /auth/me:
    get:
      tags: [Auth]
      summary: 获取当前登录用户
      operationId: getCurrentUser
      security:
        - bearerAuth: []
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

**验收标准**:
```bash
# 路径数 ≥ 60
expect(yq eval '.paths | length' docs/api-contract.yaml).toBeGreaterThanOrEqual(60)
# 包含关键新路径
expect(yq eval '.paths | has("/auth/me")' docs/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/requirements")' docs/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/projects/deleted")' docs/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/ddd/bounded-context")' docs/api-contract.yaml).toBe(true)
expect(yq eval '.paths | has("/clarify/ask")' docs/api-contract.yaml).toBe(true)
# YAML 可解析
expect(yq eval '.' docs/api-contract.yaml | wc -c).toBeGreaterThan(100)
```

**输入**: backend-routes.md + frontend-calls.md + architecture.md §2
**前置依赖**: F1.1 + F1.2

---

### F1.4 — 验证 YAML 格式正确性
**Story ID**: `F1.4` | **优先级**: P1 | **工时**: 30min
**执行人**: Dev agent（自验证）
**产出路径**: `docs/vibex-doc-fix-20260328/yaml-validation-report.md`

**执行步骤**:

```bash
# Step 1: yq 语法检查
yq eval '.' docs/api-contract.yaml > /dev/null 2>&1 && echo "✅ YAML 语法正确" || echo "❌ YAML 语法错误"

# Step 2: OpenAPI 3.0 版本验证
yq eval '.openapi' docs/api-contract.yaml

# Step 3: info 块完整性
yq eval '.info.title' docs/api-contract.yaml
yq eval '.info.version' docs/api-contract.yaml

# Step 4: 无重复路径
PATH_COUNT=$(yq eval '.paths | keys | length' docs/api-contract.yaml)
UNIQUE_COUNT=$(yq eval '.paths | keys | unique | length' docs/api-contract.yaml)
if [ "$PATH_COUNT" = "$UNIQUE_COUNT" ]; then echo "✅ 无重复路径"; else echo "❌ 存在重复路径"; fi

# Step 5: 所有 path key 含有效 HTTP 方法
yq eval '.paths | to_entries | .[].key' docs/api-contract.yaml | wc -l
```

**验收标准**:
```bash
# YAML 格式可解析（无错误输出）
expect(yq eval '.' docs/api-contract.yaml | wc -c).toBeGreaterThan(100)
# 版本声明存在
expect(yq eval '.openapi' docs/api-contract.yaml).toContain("3.")
expect(yq eval '.info.title' docs/api-contract.yaml).toBeTruthy()
# 无重复路径
expect(yq eval '.paths | keys | unique | length' docs/api-contract.yaml).toBe(yq eval '.paths | keys | length' docs/api-contract.yaml)
```

**前置依赖**: F1.3

---

### F1.5 — 标注后端独有路由（未调用路由）
**Story ID**: `F1.5` | **优先级**: P2 | **工时**: 1h
**执行人**: Dev agent
**产出路径**: `docs/vibex-doc-fix-20260328/unused-routes.md`

**执行步骤**:

```bash
# Step 1: 对比 backend-routes.md vs frontend-calls.md
# 找出前端未调用的后端路由

# Step 2: 按 Group C 分类（见 architecture.md §2.2）
# /oauth/{provider}/* (5个) — OAuth 集成
# /canvas/* (7个) — Canvas 批量生成
# /github/* (3个) — GitHub 集成
# /ai-ui-generation (1个) — AI UI 批量生成

# Step 3: 写入 unused-routes.md，含：
# - 每个路由的功能描述
# - x-backend-only: true 扩展字段值
# - 未来可能的调用场景（参考）
```

**验收标准**:
```bash
expect(test -f docs/vibex-doc-fix-20260328/unused-routes.md).toBe(true)
expect(grep -c "oauth\|canvas\|github" docs/vibex-doc-fix-20260328/unused-routes.md).toBeGreaterThan(0)
```

**前置依赖**: F1.3

---

## 3. Epic 2: 废弃文档归档

### F2.1 — 创建归档目录结构
**Story ID**: `F2.1` | **优先级**: P0 | **工时**: 15min
**执行人**: Dev agent
**产出路径**: `docs/archive/202603-stale/`

**执行步骤**:

```bash
# Step 1: 创建归档目录
mkdir -p docs/archive/202603-stale/{tester-checklists,homepage,domain-model,button-style,api-fixes,security,test-infra,proposals-dedup,review-reports,other-stale}

# Step 2: 创建 README.md
cat > docs/archive/202603-stale/README.md << 'EOF'
# VibeX 文档归档 — 2026-03-28

本目录归档了项目中已完成的废弃文档，按功能领域分类存储。

## 归档原则
- **只移不删**: 所有文件仅移动，不删除
- **保留文件名和时间戳**: 便于追溯来源
- **按类别分子目录**: 便于按领域恢复

## 目录结构
- tester-checklists/: 测试检查清单（7个）
- homepage/: 首页迭代历史文档（35+个）
- domain-model/: 域名模型修复历史（15+个）
- button-style/: 按钮/样式修复（6+个）
- api-fixes/: API 修复历史（10+个）
- security/: 安全修复历史（6+个）
- test-infra/: 测试基础设施（8+个）
- proposals-dedup/: 提案去重/工作流（15+个）
- review-reports/: 历史审查报告（按日期归档）
- other-stale/: 其他零散废弃文档

## 恢复指引
如需恢复某个文档，定位对应子目录后用 `mv` 移回 docs/ 根目录。
EOF

# Step 3: 验证目录结构
find docs/archive/202603-stale -type d | wc -l  # 应 ≥ 11
```

**验收标准**:
```bash
expect(test -d docs/archive/202603-stale).toBe(true)
expect(test -f docs/archive/202603-stale/README.md).toBe(true)
expect(find docs/archive/202603-stale -type d | wc -l).toBeGreaterThanOrEqual(11)
```

**前置依赖**: 无

---

### F2.2 — 归档全部 47+ 个废弃文档
**Story ID**: `F2.2` | **优先级**: P0 | **工时**: 1.5h
**执行人**: Dev agent
**产出路径**: `docs/archive/202603-stale/<category>/`

**执行步骤**（按类别分批执行）:

```bash
# === Batch 1: tester-checklist 文件（7个，直接移动）===
cd /root/.openclaw/vibex/docs
mv tester-checklist-*.md archive/202603-stale/tester-checklists/

# === Batch 2: homepage 相关（35+ 个）===
# 根目录 .md 文件
mv homepage-crash-fix.md homepage-flow-fix.md homepage-hydration-fix.md \
   homepage-mermaid-fix.md homepage-redesign.md homepage-sketch.md \
   homepage-v4-fix.md homepage-urgent-fixes.md homepage-three-column-layout.md \
   homepage-skeleton-redesign.md homepage-thinking-panel.md \
   homepage-thinking-panel-fix.md homepage-thinking-panel-fix-v2.md \
   homepage-ux-redesign.md homepage-event-audit.md \
   homepage-cardtree-debug.md homepage-flow-redesign.md \
   homepage-iteration.md homepage-layout-fix.md homepage-layout-iteration.md \
   homepage-modular-refactor.md homepage-redesign-v2.md \
   homepage-api-alignment.md homepage-core-layout.md \
   homepage-final-review.md \
   archive/202603-stale/homepage/ 2>/dev/null || true

# homepage 子目录（含 specs/ 等）
for dir in homepage-redesign homepage-v4-fix homepage-v4-fix-reviewer-aipanel-fix \
            homepage-v4-fix-epic1-aipanel-test homepage-v4-fix-epic3-layout-test \
            homepage-theme-api-analysis-epic3-test-fix homepage-theme-integration \
            homepage-theme-wrapper-timing-fix homepage-epic4-integration-fix \
            homepage-event-epic1-optimize-fix homepage-issues-20260317 \
            homepage-redesign-analysis homepage-redesign-reviewer-sprint1-fix \
            homepage-sprint1-reviewer-fix homepage-sprint1-reviewer-fix-revised \
            homepage-reviewer-failed-fix homepage-redesign-specs \
            homepage-v4-confirmed.html homepage-collapsed.html homepage-collapsed.png \
            homepage-demo.html homepage-expanded.html homepage-expanded.png; do
  [ -e "$dir" ] && mv "$dir" archive/202603-stale/homepage/ 2>/dev/null || true
done

# === Batch 3: domain-model 相关（15+ 个）===
for f in domain-model-crash.md domain-model-mermaid-fix.md domain-model-mermaid-render.md \
         domain-model-not-rendering.md domain-model-parsing-stuck.md \
         domain-model-render-fix-v3.md domain-model-render-fix-v4.md \
         domain-model-step-not-advancing.md domain-model-crash-fix.md \
         vibex-domain-model-*.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/domain-model/ 2>/dev/null || true
done
for dir in vibex-domain-model-crash vibex-domain-model-mermaid-fix \
           vibex-domain-model-mermaid-render vibex-domain-model-not-rendering \
           vibex-domain-model-render-fix-v3 vibex-domain-model-render-fix-v4 \
           vibex-domain-model-step-not-advancing; do
  [ -e "$dir" ] && mv "$dir" archive/202603-stale/domain-model/ 2>/dev/null || true
done

# === Batch 4: button-style 相关（6+ 个）===
for f in button-split.md button-style-fix.md image-and-button-fix.md \
         css-tokens-migration.md vibex-button-split.md vibex-button-style-fix.md \
         vibex-image-and-button-fix.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/button-style/ 2>/dev/null || true
done

# === Batch 5: api-fixes 相关（10+ 个）===
for f in api-endpoint-fix.md api-domain-model-fix.md auth-e2e-fix.md \
         auth-state-sync.md api-retry-circuit.md requirements-sync.md \
         ddd-api-fix.md vibex-api-*.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/api-fixes/ 2>/dev/null || true
done
for dir in vibex-api-endpoint-fix vibex-api-domain-model-fix vibex-api-retry-circuit \
           vibex-auth-e2e-fix vibex-auth-state-sync vibex-requirements-sync vibex-ddd-api-fix; do
  [ -e "$dir" ] && mv "$dir" archive/202603-stale/api-fixes/ 2>/dev/null || true
done

# === Batch 6: security 相关（6+ 个）===
for f in xss-token-security.md secure-storage-fix.md security-hardening.md \
         security-auto-detect.md vibex-xss-token-security.md \
         vibex-secure-storage-fix.md vibex-security-hardening.md \
         vibex-security-auto-detect.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/security/ 2>/dev/null || true
done

# === Batch 7: test-infra 相关（8+ 个）===
for f in test-infra-fix.md test-infra-improve.md test-orphans-fix.md \
         jest-esm-fix.md pre-existing-test-failures.md \
         test-cases-api-error.md test-cases.md test-quality-checklist.md \
         vibex-test-infra-fix.md vibex-test-infra-improve.md \
         vibex-test-orphans-fix.md vibex-jest-esm-fix.md \
         vibex-pre-existing-test-failures.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/test-infra/ 2>/dev/null || true
done
for dir in vibex-test-infra-fix vibex-test-infra-improve vibex-test-orphans-fix \
           vibex-jest-esm-fix; do
  [ -e "$dir" ] && mv "$dir" archive/202603-stale/test-infra/ 2>/dev/null || true
done

# === Batch 8: proposals-dedup 相关（15+ 个）===
for f in proposal-dedup-mechanism.md dedup-path-fix.md eslint-perf-fix.md \
         fix-lint-error.md uuid-fix.md taskmanager-syntaxwarning-fix.md \
         proposal-dedup-reviewer1-fix.md \
         vibex-proposal-dedup-mechanism.md vibex-dedup-path-fix.md \
         vibex-eslint-perf-fix.md vibex-fix-lint-error.md vibex-uuid-fix.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/proposals-dedup/ 2>/dev/null || true
done
for dir in proposal-dedup-mechanism vibex-eslint-perf-fix; do
  [ -e "$dir" ] && mv "$dir" archive/202603-stale/proposals-dedup/ 2>/dev/null || true
done

# === Batch 9: review-reports 历史子目录 ===
for subdir in docs/review-reports/202603*; do
  [ -e "$subdir" ] && mv "$subdir" docs/archive/202603-stale/review-reports/ 2>/dev/null || true
done

# === Batch 10: other-stale（剩余零散废弃文档）===
# 首页提案相关
for f in homepage-redesign homepage-redesign-analysis \
         homepage-redesign-reviewer-sprint1-fix \
         homepage-redesign-sprint1-reviewer-fix \
         homepage-reviewer-failed-fix \
         homepage-sprint1-reviewer-fix \
         homepage-sprint1-reviewer-fix-revised \
         homepage-redesign/specs \
         homepage-redesign/specs; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/other-stale/ 2>/dev/null || true
done

# 导航/项目相关
for f in navbar-projects-fix.md vibex-navbar-projects-fix.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/other-stale/ 2>/dev/null || true
done

# 状态/Mermaid相关
for f in mermaid-display-bug.md mermaid-render-bug.md mermaid-render-fix.md \
         mermaid-progress-bug.md mermaid-test-regression.md mermaid-fix-verify.md \
         state-render-fix.md state-optimization.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/other-stale/ 2>/dev/null || true
done

# TypeScript/代码质量
for f in ts-strict.md type-safety-boost.md type-safety-cleanup.md \
         gitignore-fix.md code-quality.md console-log-sanitize.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/other-stale/ 2>/dev/null || true
done

# GitHub/Figma
for f in github-figma-import.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/other-stale/ 2>/dev/null || true
done

# React相关
for f in react-query-refactor.md reactflow-visualization.md \
         hooks-fix.md zustand-missing.md \
         particle-effects.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/other-stale/ 2>/dev/null || true
done

# 流程/Step相关
for f in step-context-fix-20260326.md step-context-fix-reviewer-fix-phase1.md \
         step-modular-architecture.md step2-issues.md step2-regression.md \
         task-state-20260326.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/other-stale/ 2>/dev/null || true
done

# 三树/Bounded Context
for f in three-trees-enhancement-20260326.md bc-filter-fix-20260326.md \
         bc-prompt-optimize-20260326.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/other-stale/ 2>/dev/null || true
done

# 其他
for f in heartbeat-template-optimization.md heartbeat-report-template.md \
         coord-workflow-improvement.md on-boarding-redesign.md \
         user-onboarding-optimization.md page-tree-diagram.md \
         page-structure-consolidation simplified-flow.md simplified-flow-test-fix.md \
         canvas-analysis.md canvas-redesign-20260325.md canvas-api-fix-20260326.md \
         new-process-design-20260318.md new-process-impl-20260318.md \
         new-process-impl-20260318-v2.md nextjs-upgrade.md \
         phase1-infra-20260316.md phase1-infra-20260317.md \
         phase2-core-20260316.md phase2-core-features-20260316.md \
         phase2-infra.md phase3-enhancements.md p1-impl-20260314.md \
         p1-security-fix.md production-polish.md quality-optimization-20260317.md \
         stage-integration.md plan-build-mode.md proposal-api-split.md \
         proposal-five-step-flow.md proposal-rca-tool.md proposal-report-template.md \
         session-smart-compress.md process-optimization.md \
         issue-knowledge-base.md template-ecosystem.md \
         frontend-analysis-20260327.md frontend-sse-display-fix.md \
         cicd-optimization.md sample-input-fix.md; do
  [ -e "$f" ] && mv "$f" archive/202603-stale/other-stale/ 2>/dev/null || true
done

# === 最终验证 ===
# tester-checklist 归档验证
CHECKLIST_COUNT=$(find docs/archive/202603-stale/tester-checklists -name "*.md" | wc -l)
echo "tester-checklist 归档数量: $CHECKLIST_COUNT (应 ≥ 7)"

# 根目录无 tester-checklist 验证
ROOT_CHECKLIST=$(find docs -maxdepth 1 -name "tester-checklist*.md" | wc -l)
echo "docs/ 根目录 tester-checklist 残留: $ROOT_CHECKLIST (应为 0)"

# 归档总数
TOTAL_ARCHIVED=$(find docs/archive/202603-stale -type f | wc -l)
echo "归档文件总数: $TOTAL_ARCHIVED (应 ≥ 47)"
```

**验收标准**:
```bash
# P0 - tester-checklist 已归档
CHECKLIST_COUNT=$(find docs/archive/202603-stale -name "tester-checklist*" | wc -l)
expect(checklist_count).toBeGreaterThanOrEqual(7)

# P0 - docs/ 根目录无 tester-checklist 残留
expect(find docs -maxdepth 1 -name "tester-checklist*.md" | wc -l).toBe(0)

# P0 - 归档总数 ≥ 47
TOTAL=$(find docs/archive/202603-stale -type f | wc -l)
expect(total).toBeGreaterThanOrEqual(47)
```

**前置依赖**: F2.1

---

### F2.3 — 更新 docs/README.md
**Story ID**: `F2.3` | **优先级**: P1 | **工时**: 30min
**执行人**: Dev agent
**产出路径**: `docs/README.md`（覆盖更新）

**执行步骤**:

```bash
# 读取现有 docs/README.md
cat docs/README.md
# 追加以下内容：
# 1. archive/ 目录说明
# 2. 文档命名规范（禁止 tester-checklist- 前缀，禁止 -fix/-improve 后缀）
# 3. 归档规则：项目完成 30 天后归档
```

**验收标准**:
```bash
expect(test -f docs/README.md).toBe(true)
expect(grep -c "archive" docs/README.md).toBeGreaterThan(0)
expect(grep -c "命名\|naming\|规范" docs/README.md).toBeGreaterThan(0)
expect(grep -c "30\|归档\|archive" docs/README.md).toBeGreaterThan(0)
```

**前置依赖**: F2.2

---

### F2.4 — 验证 CLAUDE.md 无已归档文件引用
**Story ID**: `F2.4` | **优先级**: P2 | **工时**: 30min
**执行人**: Dev agent（验证 + 修改）
**产出路径**: `CLAUDE.md`（如有引用则更新）

**执行步骤**:

```bash
# Step 1: 遍历归档目录中的所有文件
ARCHIVED_FILES=$(find docs/archive/202603-stale -type f -name "*.md")

# Step 2: 检查 CLAUDE.md 中是否有引用
BROKEN=""
for f in $ARCHIVED_FILES; do
  basename_f=$(basename "$f")
  if grep -q "$basename_f" CLAUDE.md 2>/dev/null; then
    echo "⚠️  CLAUDE.md 引用了已归档文件: $basename_f"
    BROKEN=1
    # 定位引用行
    grep -n "$basename_f" CLAUDE.md
  fi
done

# Step 3: 如有引用，更新为注释掉的失效引用
# 示例: # [已归档] 旧引用路径 → 移至 archive/202603-stale/
```

**验收标准**:
```bash
# 所有归档文件在 CLAUDE.md 中无有效引用
# 验证方法：遍历后无输出
```

**前置依赖**: F2.2

---

## 4. Sprint 日程

```
Day 1
├─ 09:00 [Epic 1] F1.1 提取后端路由清单  ← Dev 并行
├─ 09:00 [Epic 1] F1.2 提取前端 API 调用  ← Dev 并行
├─ 09:30 [Epic 1] F1.3 生成新版 api-contract.yaml ← 核心任务
├─ 11:30 [Epic 1] F1.4 验证 YAML 格式    ← Dev 自验证
├─ 12:00 [Epic 1] F1.5 标注后端独有路由  ← Dev
├─ 13:00 [Epic 2] F2.1 创建归档目录      ← Dev
├─ 13:15 [Epic 2] F2.2 归档 47+ 文档      ← Dev（批量执行）
├─ 14:45 [Epic 2] F2.3 更新 docs/README  ← Dev
└─ 15:15 [Epic 2] F2.4 验证 CLAUDE.md    ← Dev
```

---

## 5. 验证检查清单

| # | 检查项 | 验证命令 | 预期结果 |
|---|--------|----------|----------|
| 1 | YAML 语法正确 | `yq eval '.' docs/api-contract.yaml > /dev/null` | 无错误 |
| 2 | 路径数 ≥ 60 | `yq eval '.paths \| length' docs/api-contract.yaml` | ≥ 60 |
| 3 | 关键路径存在 | `yq eval '.paths \| has("/auth/me")'` | true |
| 4 | 无 tester-checklist 残留 | `find docs -maxdepth 1 -name "tester-checklist*.md"` | 空 |
| 5 | 归档数 ≥ 47 | `find docs/archive/202603-stale -type f \| wc -l` | ≥ 47 |
| 6 | docs/README 含归档规范 | `grep -c "archive" docs/README.md` | > 0 |
| 7 | 备份文件存在 | `test -f docs/api-contract.yaml.bak-20260328` | true |

---

**实施计划完成**: 2026-03-28
**Architect**: subagent (coord dispatch)
