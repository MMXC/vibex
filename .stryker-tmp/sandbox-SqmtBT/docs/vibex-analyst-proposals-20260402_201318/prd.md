# PRD: VibeX Analyst 提案 PRD — vibex-analyst-proposals-20260402_201318

**项目**: vibex-analyst-proposals-20260402_201318
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
从 Analyst 视角识别 7 项改进建议，重点关注状态管理一致性、架构可维护性和用户体验流畅性。

### 目标
统一三树状态模型，拆分 canvasStore 责任，建立规范体系。

### 成功指标

| KPI | 当前 | 目标 |
|-----|------|------|
| 节点状态模型 | 三树各异 | 统一 NodeState 枚举 |
| canvasStore 行数 | 1433 行 | ≤300 行（拆分后）|
| 交互反馈一致性 | 混用 confirm/toast | 统一 toast |

---

## Epic 拆分

### Epic 1: 三树状态模型统一
**工时**: 4-6h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | NodeState 枚举定义 | 1h | expect(NodeState).toBeDefined() |
| E1-S2 | 三树 checkbox 位置统一 | 2h | expect(checkboxPosition).toBeConsistent() |
| E1-S3 | 确认反馈统一（绿色 ✓）| 1h | expect(confirmedIcon).toBe('✓') |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | NodeState 枚举 | idle/selected/confirmed/error | expect(NodeStateEnum).toBeDefined() | ❌ |
| F1.2 | checkbox 位置 | 所有树 checkbox 在 badge 前 | expect(positionConsistent).toBe(true) | ✅ |
| F1.3 | 确认图标 | 绿色 ✓ 勾选 | expect(confirmedIcon).toBe('✓') | ✅ |
| F1.4 | 删除冗余边框 | 删除 nodeUnconfirmed 黄色边框 | expect(yellowBorderRemoved).toBe(true) | ✅ |

---

### Epic 2: canvasStore 职责拆分
**工时**: 8-12h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | Phase 1: contextStore 拆分 | 4-6h | expect(contextStoreLines).toBeLessThan(200) |
| E2-S2 | 入口整合测试 | 4-6h | expect(allTestsPass).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | contextStore 拆分 | canvasStore → contextStore | expect(contextStoreLines).toBeLessThan(200) | ❌ |
| F2.2 | 回归测试 | 所有测试通过 | expect(allTestsPass).toBe(true) | ✅ |

---

### Epic 3: Migration Bug 修复
**工时**: 0.5h | **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | Migration 2→3 status 映射 | 0.5h | expect(migratedStatus).toBe('confirmed') |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | status 映射 | confirmed → status: 'confirmed' | expect(migratedStatus).toBe('confirmed') | ❌ |

---

### Epic 4: API 防御性解析
**工时**: 1h | **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | 逐字段验证 + fallback | 1h | expect(zodErrorCount).toBe(0) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | type fallback | 非法值 → 'page' | expect(typeFallback).toBe('page') | ❌ |
| F4.2 | method fallback | 非法值 → 'GET' | expect(methodFallback).toBe('GET') | ❌ |

---

### Epic 5: 交互反馈标准化
**工时**: 4-6h | **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E5-S1 | 删除 window.confirm() | 2h | expect(confirmRemoved).toBe(true) |
| E5-S2 | 统一 toast 反馈 | 2h | expect(toastFeedback).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | 删除 confirm | window.confirm() → toast | expect(confirmRemoved).toBe(true) | ✅ |
| F5.2 | 统一 toast | 所有确认改为 toast | expect(toastFeedback).toBe(true) | ✅ |

---

### Epic 6: PRD 模板规范落地
**工时**: 3-4h | **优先级**: P2

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E6-S1 | GIVEN/WHEN/THEN 模板 | 2h | expect(验收标准格式).toBeCorrect() |
| E6-S2 | 功能 ID 格式统一 | 1h | expect(featureIdFormat).toBeCorrect() |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | GIVEN/WHEN/THEN | 验收标准格式强制 | expect(gwtFormat).toBeCorrect() | ❌ |
| F6.2 | 功能 ID 格式 | Epic-N/Feature-N.Story-N | expect(featureIdFormat).toBeCorrect() | ❌ |

---

### Epic 7: 设计系统一致性审计
**工时**: 6-8h | **优先级**: P2

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E7-S1 | emoji → SVG 替换 | 3h | expect(svgReplaced).toBe(true) |
| E7-S2 | Spacing Token 规范 | 2h | expect(spacingToken).toBeDefined() |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F7.1 | SVG 替换 | emoji → SVG | expect(svgReplaced).toBe(true) | ✅ |
| F7.2 | Spacing Token | space-xs/sm/md/lg/xl | expect(spacingToken).toBeDefined() | ❌ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | 三树状态模型统一 | 4-6h | P0 |
| E2 | canvasStore 职责拆分 | 8-12h | P0 |
| E3 | Migration Bug 修复 | 0.5h | P1 |
| E4 | API 防御性解析 | 1h | P1 |
| E5 | 交互反馈标准化 | 4-6h | P1 |
| E6 | PRD 模板规范落地 | 3-4h | P2 |
| E7 | 设计系统一致性审计 | 6-8h | P2 |
| **总计** | | **26.5-37.5h** | |

---

## Sprint 排期建议

| Sprint | Epic | 工时 |
|--------|------|------|
| Sprint 0 | D-001 + D-002 | 1.5h |
| Sprint 1 | E3 + E1 | 5h |
| Sprint 2 | E2 Phase 1 | 8-12h |
| Sprint 3 | E4 + E5 | 5h |
| Sprint 4 | E6 + E7 | 9h |

---

## DoD

### E1: 三树状态模型统一
- [ ] NodeState 枚举定义
- [ ] checkbox 位置统一
- [ ] 确认图标绿色 ✓
- [ ] nodeUnconfirmed 黄色边框移除

### E2: canvasStore 职责拆分
- [ ] contextStore ≤200 行
- [ ] 所有测试通过

### E3: Migration Bug 修复
- [ ] confirmed → status: 'confirmed'

### E4: API 防御性解析
- [ ] type fallback → 'page'
- [ ] method fallback → 'GET'

### E5: 交互反馈标准化
- [ ] window.confirm() 移除
- [ ] 统一 toast 反馈

### E6: PRD 模板规范落地
- [ ] GIVEN/WHEN/THEN 格式强制
- [ ] 功能 ID 格式统一

### E7: 设计系统一致性审计
- [ ] emoji → SVG 替换
- [ ] Spacing Token 定义

---

## 验收标准（expect() 断言汇总）

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | NodeState | 定义 | idle/selected/confirmed/error |
| E1-AC2 | 三树 checkbox | 渲染 | 位置一致 |
| E2-AC1 | contextStore | 统计 | ≤200 行 |
| E3-AC1 | Migration 2→3 | 执行 | status = 'confirmed' |
| E4-AC1 | 非法 type | 解析 | 'page' |
| E4-AC2 | 非法 method | 解析 | 'GET' |
| E5-AC1 | window.confirm | 代码搜索 | 不存在 |
