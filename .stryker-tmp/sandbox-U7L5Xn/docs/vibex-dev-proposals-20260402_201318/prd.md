# PRD: VibeX Dev 提案 PRD — vibex-dev-proposals-20260402_201318

**项目**: vibex-dev-proposals-20260402_201318
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
六方提案综合分析后，从 dev 实现视角提取 7 条改进建议，涵盖 Sprint 0 紧急修复到长尾 E2E 建设。

### 目标
建立可执行的研发改进路线图，优先修复阻断性问题（P0），逐步完善基础设施（P1-P2）。

### 成功指标

| KPI | 当前 | 目标 |
|-----|------|------|
| TS 错误数 | 9 个 | 0 |
| canvasStore 行数 | 1433 行 | ≤300 行（拆分后）|
| E2E 覆盖率 | ~0% | ≥60% |

---

## Epic 拆分

### Epic 1: Sprint 0 紧急修复
**工时**: 1.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | D-001: TypeScript 预存错误清理 | 1h | expect(tsErrorCount).toBe(0) |
| E1-S2 | D-002: DOMPurify XSS Override | 0.5h | expect(noDompurifyVuln).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | TS 错误清理 | 修复 9 个预存 TS 错误 | expect(tsErrorCount).toBe(0) | ❌ |
| F1.2 | DOMPurify Override | 覆盖 monaco-editor dompurify 版本 | expect(noDompurifyVuln).toBe(true) | ❌ |

---

### Epic 2: 三树 checkbox UX 修复
**工时**: 1.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | D-E1: BoundedContextTree 合并 checkbox | 1h | expect(checkboxCount).toBe(1) |
| E2-S2 | D-E2: FlowCard 级联确认 | 0.5h | expect(stepsConfirmed).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 合并 checkbox | 删除 selectionCheckbox，保留 1 个 inline | expect(checkboxCount).toBe(1) | ✅ |
| F2.2 | 级联确认 | confirmFlowNode 级联到 steps | expect(stepsConfirmed).toBe(true) | ✅ |

---

### Epic 3: canvasStore 职责拆分
**工时**: 8-12h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | Phase1: contextStore 拆分 | 4-6h | expect(contextStoreLines).toBeLessThan(200) |
| E3-S2 | Phase2: 入口整合测试 | 4-6h | expect(allTestsPass).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | contextStore 拆分 | canvasStore → contextStore | expect(contextStoreLines).toBeLessThan(200) | ❌ |
| F3.2 | 回归测试 | 所有测试通过 | expect(allTestsPass).toBe(true) | ✅ |

---

### Epic 4: Zustand Migration 修复
**工时**: 0.5h | **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | Migration 2→3 status 映射 | 0.5h | expect(migratedStatus).toBe('confirmed') |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | status 映射 | confirmed → status: 'confirmed' | expect(migratedStatus).toBe('confirmed') | ❌ |

---

### Epic 5: API 防御性解析
**工时**: 1h | **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E5-S1 | generateComponentFromFlow fallback | 1h | expect(zodErrorCount).toBe(0) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | 防御性解析 | 逐字段验证 + fallback | expect(zodErrorCount).toBe(0) | ❌ |

---

### Epic 6: E2E 测试框架建设
**工时**: 6-9 人天 | **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E6-S1 | journey-create-context.spec | 2-3 人天 | expect(testPass).toBe(true) |
| E6-S2 | journey-generate-flow.spec | 2-3 人天 | expect(testPass).toBe(true) |
| E6-S3 | journey-multi-select.spec | 2-3 人天 | expect(testPass).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | E2E 覆盖率 | 3 个核心用户旅程覆盖 | expect(e2eCoverage).toBeGreaterThan(60) | ✅ |

---

### Epic 7: vitest 配置优化
**工时**: 2h | **优先级**: P2

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E7-S1 | vitest 路径别名 + 覆盖率 | 2h | expect(testTime).toBeLessThan(60) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F7.1 | 测试时间优化 | npm test < 60s | expect(testTime).toBeLessThan(60) | ❌ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | Sprint 0 紧急修复 | 1.5h | P0 |
| E2 | 三树 checkbox UX 修复 | 1.5h | P0 |
| E3 | canvasStore 职责拆分 | 8-12h | P0 |
| E4 | Zustand Migration 修复 | 0.5h | P1 |
| E5 | API 防御性解析 | 1h | P1 |
| E6 | E2E 测试框架建设 | 6-9 人天 | P1 |
| E7 | vitest 配置优化 | 2h | P2 |
| **总计** | | **20.5h + 6-9 人天** | |

---

## Sprint 排期建议

| Sprint | 内容 | 工时 |
|--------|------|------|
| Sprint 0 | E1 + E2 | 3h |
| Sprint 1 | E3 Phase1 (contextStore) | 8-12h |
| Sprint 2 | E4 + E5 + E7 | 3.5h |
| Sprint 3 | E6 (E2E) | 6-9 人天 |

---

## DoD

### E1: Sprint 0 紧急修复
- [ ] `npm run build` 无 TS 错误
- [ ] DOMPurify 版本覆盖生效

### E2: 三树 checkbox UX 修复
- [ ] BoundedContextTree 只有 1 个 checkbox
- [ ] FlowCard 勾选后 steps 全部 confirmed

### E3: canvasStore 职责拆分
- [ ] contextStore ≤200 行
- [ ] 所有测试通过

### E4: Migration 修复
- [ ] 旧数据 confirmed → status: 'confirmed'

### E5: 防御性解析
- [ ] ZodError = 0

### E6: E2E 覆盖
- [ ] 3 个核心旅程 E2E 测试

### E7: vitest 优化
- [ ] 测试时间 < 60s

---

## 验收标准（expect() 断言汇总）

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | npm run build | 执行 | TS error = 0 |
| E1-AC2 | npm audit | 执行 | 无 DOMPurify 漏洞 |
| E2-AC1 | BoundedContextTree | 渲染 | checkbox = 1 |
| E2-AC2 | 勾选 FlowCard | 确认 | steps 全部 confirmed |
| E3-AC1 | contextStore.ts | 统计 | ≤200 行 |
| E4-AC1 | Migration 2→3 | 执行 | status = 'confirmed' |
| E5-AC1 | API 响应 | 解析 | ZodError = 0 |
| E7-AC1 | npm test | 执行 | < 60s |
