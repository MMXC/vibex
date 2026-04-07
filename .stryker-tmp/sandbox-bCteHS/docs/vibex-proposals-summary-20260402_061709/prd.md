# PRD: VibeX 系统性风险治理路线图

**项目**: vibex-proposals-summary-20260402_061709
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
VibeX 核心价值链路为「需求 → 限界上下文 → 领域模型 → 业务流程 → 组件树」。当前存在三类系统性风险：
1. **技术债务累积**: canvasStore 1433行、renderer.ts 2175行、9个TS预存错误
2. **交互不一致**: 三树 checkbox 实现各异，用户体验割裂
3. **质量门禁失效**: CI 不稳定、E2E 测试缺失、测试覆盖不足

### 目标
通过渐进式改良（Sprint 0-4），在 5-6 周内系统性治理上述风险，建立可靠的代码质量基线和一致的用户体验。

### 成功指标

| KPI | 当前 | Sprint 1 目标 | Sprint 4 目标 |
|-----|------|-------------|--------------|
| TypeScript error 数 | 9 | **0** | 0 |
| npm test 通过率 | ~80% | **> 95%** | > 95% |
| 三树 checkbox 行为一致性 | 3 种实现 | **1 种** | 1 种 |
| canvasStore 行数 | 1433 | 1433（拆分中）| **< 300** |
| E2E 测试覆盖率 | ~0% | **> 50%** | > 80% |

---

## Epic 拆分

### Epic 1: Sprint 0 — CI 基线修复（P0）
**工时**: 2.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 修复 9 个 TypeScript 预存错误 | 1h | expect(build.stderr.match(/error TS/g) \|\| []).toHaveLength(0) |
| E1-S2 | DOMPurify XSS 漏洞修复 | 0.5h | expect(dompurifyVersion).toBe('>=3.3.3') |
| E1-S3 | vitest 稳定性配置 | 1h | expect(testPassRate).toBeGreaterThanOrEqual(95) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | TS 错误清零 | npm run build 0 error | expect(build.stderr.match(/error TS/g) \|\| []).toHaveLength(0) | ❌ |
| F1.2 | DOMPurify override | package.json overrides | expect(npmLs.dompurify).toMatch(/3\.[3-9]/) | ❌ |
| F1.3 | vitest 稳定配置 | maxWorkers + memoryLimit | expect(testPassRate).toBeGreaterThanOrEqual(95) | ❌ |

---

### Epic 2: Sprint 1 — 用户体验统一（P0）
**工时**: 11-12h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | 三树 checkbox 位置统一 | 4h | expect(checkbox.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy() |
| E2-S2 | 确认状态绿色 ✓ 反馈 | 2h | expect(container.querySelector('[class*="confirmedBadge"]')).not.toBeNull() |
| E2-S3 | 移除 nodeUnconfirmed 黄色边框 | 1h | expect(nodeUnconfirmed.style.borderColor).not.toBe('var(--color-warning)') |
| E2-S4 | window.confirm 替换 toast | 2h | expect(window.confirmCount).toBe(0) |
| E2-S5 | UI 变更影响范围清单 | 2h | expect(checklistDocExists).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 三树 checkbox 位置统一 | checkbox 在 type badge 前 | 三树验收标准一致 | ✅ |
| F2.2 | 确认反馈绿色 ✓ | 已确认节点显示 ✓ | expect(container.querySelector('[class*="confirmedBadge"]')).not.toBeNull() | ✅ |
| F2.3 | 无黄色边框 | pending 节点无警告边框 | expect(borderColor).not.toBe('var(--color-warning)') | ✅ |
| F2.4 | 无 window.confirm | 删除 confirm 用 toast | expect(window.confirmCount).toBe(0) | ✅ |
| F2.5 | UI 变更清单 | CONTRIBUTING.md checklist | expect(checklistDocExists).toBe(true) | ❌ |

---

### Epic 3: Sprint 2 — 架构基础（P0）
**工时**: 10-14h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | canvasStore 最小化拆分 | 6-8h | expect(contextStoreLines).toBeLessThanOrEqual(300) |
| E3-S2 | vitest 优化（快/慢分离） | 2h | expect(vitestRuntime).toBeLessThanOrEqual(60) |
| E3-S3 | 每个子 store 独立测试 | 2-4h | expect(subStoreTests).toBeTrue() |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | contextStore 拆分 | < 300 行 | expect(contextStoreLines).toBeLessThanOrEqual(300) | ❌ |
| F3.2 | flowStore 拆分 | < 300 行 | expect(flowStoreLines).toBeLessThanOrEqual(300) | ❌ |
| F3.3 | componentStore 拆分 | < 300 行 | expect(componentStoreLines).toBeLessThanOrEqual(300) | ❌ |
| F3.4 | canvasStore 代理层 | < 100 行 | expect(canvasStoreLines).toBeLessThanOrEqual(100) | ❌ |
| F3.5 | vitest 快慢分离 | 运行时间 < 60s | expect(vitestRuntime).toBeLessThanOrEqual(60) | ❌ |

---

### Epic 4: Sprint 3 — Store 完整拆分（P1）
**工时**: 8-12h | **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | canvasStore 完全拆分 | 4-6h | expect(canvasStoreLines).toBeLessThanOrEqual(200) |
| E4-S2 | 每个 store 独立测试文件 | 2-3h | expect(storeTestFiles).toHaveLength(4) |
| E4-S3 | 无循环依赖 | 2-3h | expect(eslintNoCycleViolations).toBe(0) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | canvasStore 完全拆分 | < 200 行入口文件 | expect(canvasStoreLines).toBeLessThanOrEqual(200) | ❌ |
| F4.2 | 独立测试文件 | 4 个 store 各有测试 | expect(storeTestFiles).toHaveLength(4) | ❌ |
| F4.3 | 无循环依赖 | import/no-cycle 0 违规 | expect(eslintNoCycleViolations).toBe(0) | ❌ |

---

### Epic 5: Sprint 4 — E2E + 性能（P2）
**工时**: 18-25h | **优先级**: P2

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E5-S1 | Playwright E2E 核心旅程 | 8-10h | expect(e2ePassRate).toBeGreaterThanOrEqual(90) |
| E5-S2 | Canvas 拖拽性能优化 | 6-8h | expect(dragFPS).toBeGreaterThanOrEqual(55) |
| E5-S3 | ReactFlow 交互验证 | 4-7h | expect(reactFlowInteraction).toBeTrue() |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | journey-create-context E2E | 创建 → 确认全流程 | expect(testPass).toBe(true) | ✅ |
| F5.2 | journey-generate-flow E2E | 生成 → 确认全流程 | expect(testPass).toBe(true) | ✅ |
| F5.3 | journey-multi-select E2E | 多选 → 批量确认 | expect(testPass).toBe(true) | ✅ |
| F5.4 | 拖拽帧率 | ≥ 55fps | expect(dragFPS).toBeGreaterThanOrEqual(55) | ✅ |
| F5.5 | ReactFlow 交互 | 节点拖拽/连线正常 | expect(reactFlowInteraction).toBe(true) | ✅ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | Sprint 0 — CI 基线修复 | 2.5h | P0 |
| E2 | Sprint 1 — 用户体验统一 | 11-12h | P0 |
| E3 | Sprint 2 — 架构基础 | 10-14h | P0 |
| E4 | Sprint 3 — Store 完整拆分 | 8-12h | P1 |
| E5 | Sprint 4 — E2E + 性能 | 18-25h | P2 |
| **总计** | | **49.5-65.5h** | |

---

## 优先级矩阵

| 优先级 | Epic | 工时 |
|--------|------|------|
| P0 | E1, E2, E3 | 23.5-28.5h |
| P1 | E4 | 8-12h |
| P2 | E5 | 18-25h |

---

## Sprint 排期建议

**Sprint 0 (0.5 天)**: TS 清理 + DOMPurify（2.5h）

**Sprint 1 (1 周)**: 三树统一 + 确认反馈 + UI 清单（11-12h）

**Sprint 2 (1.5 周)**: canvasStore 拆分 + vitest 优化（10-14h）

**Sprint 3 (1 周)**: Store 完整拆分 + 无循环依赖（8-12h）

**Sprint 4 (2 周)**: E2E 覆盖 + 性能优化（18-25h）

---

## 关键依赖链

```
E1 (Sprint 0)  ← 无依赖
    ↓
E2 (Sprint 1)  ← 依赖 E1（CI 稳定后做 UI 变更）
    ↓
E3 (Sprint 2)  ← 依赖 E1（TS 清理后做 store 拆分）
    ↓
E4 (Sprint 3)  ← 依赖 E3（基础拆分后做完整拆分）
    ↓
E5 (Sprint 4)  ← 依赖 E2+E3（UI 稳定 + 架构清晰后做 E2E）
```

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| canvasStore 拆分引入回归 | 40% | 高 | E1 先行，每阶段测试覆盖 |
| E2E 测试 flaky | 30% | 中 | E1+E2 完成后做 E2E |
| DOMPurify override 不兼容 | 20% | 中 | staging 验证 + 回滚 |
| 多人修改同一文件冲突 | 25% | 中 | git worktree 隔离 |

---

## DoD (Definition of Done)

### Epic 1: Sprint 0 — CI 基线修复
- [ ] `npm run build` 输出 0 TypeScript error
- [ ] `npm audit` 无 DOMPurify XSS 漏洞
- [ ] `npm test` 通过率 > 95%（连续 3 次）

### Epic 2: Sprint 1 — 用户体验统一
- [ ] 三树 checkbox 均在 type badge 前，无绝对定位
- [ ] 已确认节点显示绿色 ✓ 反馈
- [ ] nodeUnconfirmed 无黄色边框/阴影
- [ ] `grep -r "window.confirm" src/` 结果 = 0
- [ ] CONTRIBUTING.md 包含 UI 变更 checklist

### Epic 3: Sprint 2 — 架构基础
- [ ] contextStore < 300 行，flowStore < 300 行，componentStore < 300 行
- [ ] canvasStore < 100 行（代理层）
- [ ] vitest 运行时间 < 60s
- [ ] 快/慢测试套件分离

### Epic 4: Sprint 3 — Store 完整拆分
- [ ] canvasStore < 200 行入口文件
- [ ] 4 个 store 各有独立测试文件
- [ ] import/no-cycle 违规 = 0

### Epic 5: Sprint 4 — E2E + 性能
- [ ] 3 个核心旅程 E2E 通过率 > 90%
- [ ] 拖拽帧率 ≥ 55fps
- [ ] ReactFlow 交互验证通过

---

## 验收标准汇总（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 执行 npm run build | 构建完成 | 0 TypeScript error |
| AC1.2 | 执行 npm audit | 安全检查 | 无 high/critical 漏洞 |
| AC2.1 | 渲染三树节点 | status = confirmed | 1 checkbox + 绿色 ✓ |
| AC2.2 | 渲染 pending 节点 | nodeUnconfirmed | 无 border-color: warning |
| AC3.1 | 检查 store 行数 | contextStore | ≤ 300 行 |
| AC3.2 | 检查 store 行数 | canvasStore | ≤ 100 行 |
| AC4.1 | 检查循环依赖 | ESLint | 0 违规 |
| AC5.1 | 运行 E2E | journey-create-context | passRate ≥ 90% |
| AC5.2 | 测试拖拽 | Chrome DevTools | dragFPS ≥ 55 |
