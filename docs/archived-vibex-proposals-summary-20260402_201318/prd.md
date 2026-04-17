# PRD: VibeX 提案汇总 PRD — vibex-proposals-summary-20260402_201318

**项目**: vibex-proposals-summary-20260402_201318
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
基于六方提案综合分析，Dev + PM + Architect 三个视角共识别 13 项改进建议，分 P0/P1/P2 三级。

### 目标
建立可执行的研发路线图，按依赖顺序实施，优先修复阻断性问题，逐步完善用户体验和架构健康。

### 关键依赖
D-003 (canvasStore 拆分) 是关键路径，多个 PM 提案依赖此基础设施。

---

## Epic 拆分

### Epic 1: Sprint 0 紧急修复
**工时**: 1.5h | **优先级**: P0 | **依赖**: 无

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | D-001: TS 预存错误清理 | 1h | expect(tsErrorCount).toBe(0) |
| E1-S2 | D-002: DOMPurify XSS Override | 0.5h | expect(noDompurifyVuln).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | TS 错误清理 | npm run build 0 error | expect(tsErrorCount).toBe(0) | ❌ |
| F1.2 | DOMPurify Override | monaco-editor dompurify 版本覆盖 | expect(noDompurifyVuln).toBe(true) | ❌ |

---

### Epic 2: 三树 Checkbox UX 修复 + 可视化
**工时**: 5h | **优先级**: P0 | **依赖**: E1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | D-E1: BoundedContextTree 合并 checkbox | 1h | expect(checkboxCount).toBe(1) |
| E2-S2 | D-E2: FlowCard 级联确认 | 0.5h | expect(stepsConfirmed).toBe(true) |
| E2-S3 | P-001: 确认状态可视化 | 2h | expect(greenBorder).toBe(true) |
| E2-S4 | D-004: Migration 2→3 status 修复 | 0.5h | expect(migratedStatus).toBe('confirmed') |
| E2-S5 | P-002: 面板状态持久化 | 1h | expect(stateRestored).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 合并 checkbox | BoundedContextTree 只有 1 个 inline checkbox | expect(checkboxCount).toBe(1) | ✅ |
| F2.2 | 级联确认 | confirmFlowNode 级联到 steps | expect(stepsConfirmed).toBe(true) | ✅ |
| F2.3 | 未确认边框 | 黄色虚线边框 | expect(yellowBorder).toBe(true) | ✅ |
| F2.4 | 已确认边框 | 绿色实线边框 | expect(greenBorder).toBe(true) | ✅ |
| F2.5 | Migration status | confirmed → status: 'confirmed' | expect(migratedStatus).toBe('confirmed') | ❌ |
| F2.6 | 面板状态 | localStorage 存储，刷新后恢复 | expect(stateRestored).toBe(true) | ✅ |

---

### Epic 3: CanvasStore 职责拆分 + 导出向导
**工时**: 14-18h | **优先级**: P0 | **依赖**: E2

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | D-003 Phase1: contextStore 拆分 | 8-12h | expect(contextStoreLines).toBeLessThan(200) |
| E3-S2 | P-003: 导出向导 | 3h | expect(wizardSteps).toBe(3) |
| E3-S3 | D-005: API 防御性解析 | 1h | expect(zodErrorCount).toBe(0) |
| E3-S4 | D-007: vitest 配置优化 | 2h | expect(testTime).toBeLessThan(60) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | contextStore 拆分 | canvasStore → contextStore，≤200 行 | expect(contextStoreLines).toBeLessThan(200) | ❌ |
| F3.2 | 导出向导 | Step 1/2/3 向导 + 必填标记 | expect(wizardSteps).toBe(3) | ✅ |
| F3.3 | 进度条 | 导出过程进度条 | expect(progressBar).toBe(true) | ✅ |
| F3.4 | API 防御 | 逐字段验证 + fallback | expect(zodErrorCount).toBe(0) | ❌ |
| F3.5 | vitest 优化 | 测试时间 < 60s | expect(testTime).toBeLessThan(60) | ❌ |

---

### Epic 4: 体验优化 + 质量建设
**工时**: 11h | **优先级**: P1 | **依赖**: E3

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | P-004: 空状态引导 | 2h | expect(guideCard).toBe(true) |
| E4-S2 | D-006: E2E 测试框架 | 6-9 人天 | expect(e2eCoverage).toBeGreaterThan(60) |
| E4-S3 | P-006: PRD 导出 | 4h | expect(markdownExport).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | 空画布引导 | 引导卡片 + 快捷操作 | expect(guideCard).toBe(true) | ✅ |
| F4.2 | 有数据隐藏 | 有历史数据时引导卡片消失 | expect(guideHidden).toBe(true) | ✅ |
| F4.3 | E2E 覆盖 | 3 个核心旅程 E2E 测试 | expect(e2eCoverage).toBeGreaterThan(60) | ✅ |
| F4.4 | Markdown 导出 | 导出选项有 Markdown 格式 | expect(markdownExport).toBe(true) | ✅ |
| F4.5 | 飞书兼容 | 可直接粘贴到飞书文档 | expect(feishuCompatible).toBe(true) | ✅ |

---

### Epic 5: 移动端降级
**工时**: 3h | **优先级**: P2 | **依赖**: E3

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E5-S1 | P-005: 移动端降级 | 3h | expect(degradedMessage).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | 移动端检测 | 检测移动设备 | expect(mobileDetected).toBe(true) | ✅ |
| F5.2 | 降级提示 | 提示使用桌面浏览器 | expect(degradedMessage).toBe(true) | ✅ |
| F5.3 | 只读预览 | 提供查看只读预览入口 | expect(readOnlyEntry).toBe(true) | ✅ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | Sprint 0 紧急修复 | 1.5h | P0 |
| E2 | Checkbox UX + 可视化 + 面板持久化 | 5h | P0 |
| E3 | CanvasStore 拆分 + 导出向导 | 14-18h | P0 |
| E4 | 体验优化 + 质量建设 | 11h | P1 |
| E5 | 移动端降级 | 3h | P2 |
| **总计** | | **34.5-38.5h + 6-9 人天** | |

---

## Sprint 排期建议

| Sprint | Epic | 工时 | 关键依赖 |
|--------|------|------|---------|
| Sprint 0 | E1 | 1.5h | 解除 CI 阻断 |
| Sprint 1 | E2 | 5h | P-001 + P-002 + checkbox 修复 |
| Sprint 2 | E3 | 14-18h | 关键路径：canvasStore 拆分 |
| Sprint 3 | E4 | 11h | E2E + 体验优化 |
| Sprint 4 | E5 | 3h | 移动端降级 |

---

## 关键依赖图

```
E1 (Sprint 0)
    ↓
E2 (Sprint 1) ← D-E1, D-E2, D-004, P-001, P-002
    ↓
E3 (Sprint 2) ← D-003, P-003, D-005, D-007
    ↓
E4 (Sprint 3) ← D-006, P-004, P-006
    ↓
E5 (Sprint 4) ← P-005
```

---

## DoD

### E1: Sprint 0 紧急修复
- [ ] `npm run build` TS error = 0
- [ ] DOMPurify override 生效

### E2: Checkbox UX + 可视化 + 面板持久化
- [ ] BoundedContextTree 只有 1 个 checkbox
- [ ] FlowCard 勾选后 steps 全部 confirmed
- [ ] 未确认节点黄色边框 / 已确认绿色边框
- [ ] Migration 后 status 正确
- [ ] 刷新后面板状态保持

### E3: CanvasStore 拆分 + 导出向导
- [ ] contextStore ≤200 行
- [ ] 导出向导 Step 1/2/3
- [ ] ZodError = 0
- [ ] `npm test` < 60s

### E4: 体验优化 + 质量建设
- [ ] 空画布引导卡片
- [ ] E2E 覆盖率 > 60%
- [ ] Markdown 导出 + 飞书兼容

### E5: 移动端降级
- [ ] 移动设备检测
- [ ] 降级提示 + 只读预览入口

---

## 验收标准（expect() 断言汇总）

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | npm run build | 执行 | TS error = 0 |
| E1-AC2 | npm audit | 执行 | 无 DOMPurify 漏洞 |
| E2-AC1 | BoundedContextTree | 渲染 | 1 个 checkbox |
| E2-AC2 | 勾选 FlowCard | 确认 | steps 全部 confirmed |
| E2-AC3 | 未确认节点 | 渲染 | 黄色边框 |
| E2-AC4 | 已确认节点 | 渲染 | 绿色边框 |
| E2-AC5 | 展开面板 | 刷新 | 状态保持 |
| E3-AC1 | contextStore.ts | 统计 | ≤200 行 |
| E3-AC2 | 导出按钮 | 点击 | Step 1/2/3 向导 |
| E3-AC3 | npm test | 执行 | < 60s |
| E4-AC1 | 空画布 | 渲染 | 引导卡片 |
| E4-AC2 | E2E | 执行 | > 60% 覆盖 |
| E4-AC3 | 导出选项 | 检查 | 有 Markdown |
| E5-AC1 | 移动端 | 访问 | 降级提示 |
