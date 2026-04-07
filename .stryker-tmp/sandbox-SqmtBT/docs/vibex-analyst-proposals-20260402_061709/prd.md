# PRD: VibeX 系统性风险治理

**项目**: vibex-analyst-proposals-20260402_061709
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
VibeX 核心价值链为「需求 → DDD建模 → 原型」，当前存在三类系统性风险：
1. **三树选择模型不统一** — checkbox 位置/确认反馈各异，用户体验割裂
2. **canvasStore 膨胀** — 1433 行状态混在一起，状态更新链路不透明
3. **交互反馈碎片化** — window.confirm 残留、emoji 分散、缺乏规范

### 目标
通过渐进式重构，在 6 个 Sprint 内（~6 人天）系统性治理上述风险，使 VibeX 可支撑 5-50 人团队规模。

### 成功指标

| KPI | 当前 | 目标 |
|-----|------|------|
| 三树选择操作成功率 | ~70% | ≥ 95% |
| canvasStore 行数 | 1433 行 | ≤ 300 行（代理层） |
| window.confirm 使用数 | > 0 | = 0 |
| E2E 测试通过率 | 不稳定 | ≥ 95% |
| UI 变更影响范围评估耗时 | ~30 分钟 | ≤ 5 分钟 |

---

## Epic 拆分

### Epic 1: 三树选择模型统一
**工时**: 4-6h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 定义 NodeState 枚举 | 0.5h | expect(NodeState).toBeDefined() |
| E1-S2 | 统一三树 checkbox 位置（type badge 前） | 2h | expect(checkbox.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy() |
| E1-S3 | 添加确认状态绿色 ✓ 反馈 | 1h | expect(container.querySelector('[class*="confirmed"]')).not.toBeNull() |
| E1-S4 | 移除未确认节点黄色边框/阴影 | 0.5h | expect(container.querySelector('[class*="nodeUnconfirmed"]')?.style.borderColor).not.toBe('var(--color-warning)') |
| E1-S5 | Playwright 三树选择成功率测试 | 1h | expect(successRate).toBe(100) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | NodeState 枚举 | 定义节点状态（pending/confirmed） | expect(NodeState).toBeDefined() | ❌ |
| F1.2 | checkbox 位置统一 | 三树 checkbox 均在 type badge 前 | 三树验收标准一致 | ✅ |
| F1.3 | 确认反馈图标 | 已确认节点显示绿色 ✓ | expect(container.querySelector('[class*="confirmed"]')).not.toBeNull() | ✅ |
| F1.4 | 无黄色边框 | nodeUnconfirmed 无 border-color warning | expect(borderColor).not.toBe('var(--color-warning)') | ✅ |
| F1.5 | 操作成功率 | 30 次操作成功率 = 100% | expect(successCount / totalCount).toBe(1) | ✅ |

---

### Epic 2: canvasStore 按领域拆分
**工时**: 8-12h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | 拆分 contextStore (< 300 行) | 3h | expect(contextStoreLines).toBeLessThanOrEqual(300) |
| E2-S2 | 拆分 flowStore (< 300 行) | 3h | expect(flowStoreLines).toBeLessThanOrEqual(300) |
| E2-S3 | 拆分 componentStore (< 300 行) | 3h | expect(componentStoreLines).toBeLessThanOrEqual(300) |
| E2-S4 | canvasStore 降为代理层 | 1h | expect(canvasStoreLines).toBeLessThanOrEqual(100) |
| E2-S5 | 回归测试（三树功能正常） | 2h | expect(create/select/confirm/delete).toBeTrue() |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | contextStore 拆分 | 状态迁移到独立 store | expect(contextStoreLines).toBeLessThanOrEqual(300) | ❌ |
| F2.2 | flowStore 拆分 | 状态迁移到独立 store | expect(flowStoreLines).toBeLessThanOrEqual(300) | ❌ |
| F2.3 | componentStore 拆分 | 状态迁移到独立 store | expect(componentStoreLines).toBeLessThanOrEqual(300) | ❌ |
| F2.4 | canvasStore 代理层 | 仅保留路由分发逻辑 | expect(canvasStoreLines).toBeLessThanOrEqual(100) | ❌ |
| F2.5 | 功能回归 | 三树创建/选择/确认/删除正常 | expect(allOperations).toBeTrue() | ✅ |
| F2.6 | 单元测试覆盖 | contextStore 覆盖率 ≥ 70% | expect(coverage).toBeGreaterThanOrEqual(70) | ❌ |

---

### Epic 3: Canvas 信息架构重构
**工时**: 6-8h | **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | 页面加载 scrollTop = 0 | 1h | expect(scrollTop).toBe(0) |
| E3-S2 | 工具栏 position: sticky | 2h | expect(toolbarStyle.position).toBe('sticky') |
| E3-S3 | 统一抽屉 z-index | 1h | expect(drawerZ).toBe(50) && expect(modalZ).toBe(100) |
| E3-S4 | 三栏面板动画一致（300ms） | 2h | expect(animationDuration).toBe(300) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | scrollTop 初始化 | 页面加载时 scrollTop = 0 | expect(container.scrollTop).toBe(0) | ✅ |
| F3.2 | sticky 工具栏 | 工具栏滚动时保持在视口内 | expect(toolbarStyle.position).toBe('sticky') | ✅ |
| F3.3 | z-index 协议 | drawer: 50, modal: 100, toast: 200 | expect(zIndex).toBeGreaterThanOrEqual(50) | ✅ |
| F3.4 | 面板动画一致 | 三栏面板展开/折叠 300ms ease-in-out | expect(transitionDuration).toBe(300) | ✅ |

---

### Epic 4: 交互反馈标准化
**工时**: 4-6h | **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | 移除 window.confirm | 1h | expect(windowConfirmCount).toBe(0) |
| E4-S2 | 删除操作 toast 确认 + 撤销 | 2h | expect(toastHasUndo).toBe(true) |
| E4-S3 | FeedbackToken 类型定义 | 0.5h | expect(FeedbackToken).toContain('success\|warning\|error\|info') |
| E4-S4 | 拖拽样式反馈 | 0.5h | expect(draggingStyle.opacity).toBe(0.7) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | 无 window.confirm | 全文搜索 = 0 | expect(windowConfirmCount).toBe(0) | ✅ |
| F4.2 | toast 确认 | 删除操作有 toast，含撤销按钮 | expect(toastHasUndo).toBe(true) | ✅ |
| F4.3 | FeedbackToken | 定义 success/warning/error/info 四级 | expect(Object.keys(FeedbackToken)).toHaveLength(4) | ❌ |
| F4.4 | 拖拽反馈 | 拖拽时 opacity: 0.7 + scale(1.02) | expect(draggingStyle.opacity).toBe(0.7) | ✅ |

---

### Epic 5: 测试覆盖率提升
**工时**: 8-10h | **优先级**: P2

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E5-S1 | journey-create-context.spec.ts | 3h | expect(specExists).toBe(true) && expect(passRate).toBeGreaterThanOrEqual(95) |
| E5-S2 | journey-generate-flow.spec.ts | 3h | expect(specExists).toBe(true) && expect(passRate).toBeGreaterThanOrEqual(95) |
| E5-S3 | journey-multi-select.spec.ts | 2h | expect(specExists).toBe(true) && expect(passRate).toBeGreaterThanOrEqual(95) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | 创建上下文 E2E | 创建 → 填写 → 确认全流程 | expect(testPass).toBe(true) | ✅ |
| F5.2 | 生成流程 E2E | 选择 → 生成 → 确认全流程 | expect(testPass).toBe(true) | ✅ |
| F5.3 | 多选 E2E | 多选 → 批量确认全流程 | expect(testPass).toBe(true) | ✅ |

---

### Epic 6: PRD 模板规范落地
**工时**: 3-4h | **优先级**: P2

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E6-S1 | GIVEN/WHEN/THEN 模板 | 1h | expect(templateHasGivenWhenThen).toBe(true) |
| E6-S2 | ESLint/pre-commit hook | 2h | expect(hookExists).toBe(true) |
| E6-S3 | 历史 Story 补充（自愿，≤20%） | 1h | expect(historicalStoryCount).toBeLessThanOrEqual(20) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | Story 模板 | 新 Story 必须包含 GIVEN/WHEN/THEN | expect(templateCheck).toBe(true) | ❌ |
| F6.2 | 强制检查 | pre-commit hook 检测缺失模板 | expect(hookExists).toBe(true) | ❌ |
| F6.3 | 历史补充 | 高价值 Story 补充验收标准 ≤ 20% | expect(historicalPct).toBeLessThanOrEqual(20) | ❌ |

---

### Epic 7: 设计系统一致性审计
**工时**: 6-8h | **优先级**: P3

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E7-S1 | 移除 emoji（canvas 范围内） | 2h | expect(emojiCount).toBe(0) |
| E7-S2 | 定义 spacing token | 2h | expect(spaceTokens).toContain('xs:4px,sm:8px,md:16px,lg:24px,xl:32px') |
| E7-S3 | DESIGN.md 完整版 | 2h | expect(designDocHasTokens).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F7.1 | 无 emoji | canvas 范围 grep = 0 | expect(emojiCount).toBe(0) | ✅ |
| F7.2 | spacing token | 5 级 token 定义 | expect(Object.keys(spacingTokens)).toHaveLength(5) | ❌ |
| F7.3 | DESIGN.md | 包含颜色/spacing/组件规范 | expect(designDocComplete).toBe(true) | ❌ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | 三树选择模型统一 | 4-6h | P0 |
| E2 | canvasStore 按领域拆分 | 8-12h | P0 |
| E3 | Canvas 信息架构重构 | 6-8h | P1 |
| E4 | 交互反馈标准化 | 4-6h | P1 |
| E5 | 测试覆盖率提升 | 8-10h | P2 |
| E6 | PRD 模板规范落地 | 3-4h | P2 |
| E7 | 设计系统一致性审计 | 6-8h | P3 |
| **总计** | | **39-54h** | |

---

## 优先级矩阵

| 优先级 | Epic | 工时 |
|--------|------|------|
| P0 | E1, E2 | 12-18h |
| P1 | E3, E4 | 10-14h |
| P2 | E5, E6 | 11-14h |
| P3 | E7 | 6-8h |

---

## Sprint 排期建议

**Sprint 0 (前置，0.5天)**:
- D-001 TS 错误清理
- D-002 Jest 稳定性修复

**Sprint 1 (1天)**:
- E1: 三树选择模型统一（4-6h）

**Sprint 2 (1.5天)**:
- E2: canvasStore 拆分（8-12h）← 最大风险点

**Sprint 3 (1天)**:
- E3: Canvas 信息架构（6-8h）

**Sprint 4 (1天)**:
- E4: 交互反馈标准化（4-6h）

**Sprint 5 (1天)**:
- E5: 测试覆盖率提升（8-10h）
- E6: PRD 模板规范（3-4h）

**Sprint 6 (1天)**:
- E7: 设计系统一致性（6-8h）

---

## 关键依赖链

```
D-001 (TS错误清理) 
    ↓
D-002 (Jest稳定)
    ↓
E2 (canvasStore拆分)
    ↓
E5 (E2E测试覆盖率)
```

**注意**: E2 完成后立即运行 full E2E suite，每次 store 抽取后跑对应树的 E2E。

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| canvasStore 拆分引入回归 | 中 | 高 | 每次 store 抽取后立即跑对应树 E2E |
| 三树统一后用户习惯打破 | 低 | 中 | changelog 明确告知 |
| E2E 测试不稳定 | 高 | 中 | D-002 Jest 稳定后开始 E5 |
| Feedback Token 推行受阻 | 中 | 中 | 先在 Canvas 范围内落地 |

---

## DoD (Definition of Done)

### Epic 1: 三树选择模型统一
- [ ] `NodeState` 枚举定义完成
- [ ] 三树 checkbox 均在 type badge 前，无绝对定位
- [ ] 已确认节点显示绿色 ✓，取消后可再次点击
- [ ] nodeUnconfirmed 无黄色边框/阴影
- [ ] Playwright 测试：30 次操作成功率 = 100%

### Epic 2: canvasStore 按领域拆分
- [ ] contextStore < 300 行
- [ ] flowStore < 300 行
- [ ] componentStore < 300 行
- [ ] canvasStore < 100 行（代理层）
- [ ] 三树功能（创建/选择/确认/删除）回归测试通过
- [ ] contextStore 单元测试覆盖率 ≥ 70%

### Epic 3: Canvas 信息架构重构
- [ ] 页面加载 scrollTop = 0
- [ ] 工具栏 position: sticky
- [ ] z-index 协议：drawer 50, modal 100, toast 200
- [ ] 三栏面板动画 300ms ease-in-out

### Epic 4: 交互反馈标准化
- [ ] window.confirm 使用数 = 0
- [ ] 删除操作有 toast + 撤销按钮（5 秒内）
- [ ] FeedbackToken 类型定义：success/warning/error/info
- [ ] 拖拽时 opacity: 0.7 + scale(1.02)

### Epic 5: 测试覆盖率提升
- [ ] journey-create-context.spec.ts 存在且通过率 ≥ 95%
- [ ] journey-generate-flow.spec.ts 存在且通过率 ≥ 95%
- [ ] journey-multi-select.spec.ts 存在且通过率 ≥ 95%

### Epic 6: PRD 模板规范落地
- [ ] GIVEN/WHEN/THEN 模板定义
- [ ] pre-commit hook 存在且工作正常
- [ ] 历史 Story 补充 ≤ 20%

### Epic 7: 设计系统一致性审计
- [ ] canvas 范围 emoji = 0
- [ ] spacing token：xs 4px, sm 8px, md 16px, lg 24px, xl 32px
- [ ] DESIGN.md 包含颜色/spacing/组件规范

---

## 验收标准汇总（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 渲染三树节点 | status = confirmed | 只有 1 个 checkbox + 绿色 ✓ |
| AC1.2 | 渲染节点 | pending 状态 | 无黄色边框/阴影 |
| AC2.1 | 检查 store 行数 | contextStore | ≤ 300 行 |
| AC2.2 | 检查 store 行数 | canvasStore | ≤ 100 行 |
| AC3.1 | 页面加载 | Canvas | scrollTop = 0 |
| AC4.1 | 全文搜索 | window.confirm | = 0 |
| AC5.1 | 运行 E2E | journey-create-context | passRate ≥ 95% |
| AC7.1 | canvas 范围 grep | emoji | = 0 |
