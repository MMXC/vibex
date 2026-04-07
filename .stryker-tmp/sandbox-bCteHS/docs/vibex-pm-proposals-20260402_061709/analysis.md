# PM 分析报告：VibeX 技术债务与体验优化路线图

**项目**: VibeX
**分析视角**: Senior Product Manager
**数据来源**: PM / Analyst / Dev / Reviewer / Tester 五方提案汇总
**日期**: 2026-04-02
**提案周期**: 2026-04-01 ~ 2026-04-02

---

## 1. 业务场景分析

### 1.1 目标用户

| 用户群体 | 核心需求 | 痛点 |
|---------|---------|------|
| **AI 驱动的 DDD 建模者** | 快速将业务需求转化为限界上下文、流程和组件 | 三树交互割裂，操作一致性差 |
| **原型设计师** | 可视化预览、组件树生成 | 状态管理混乱导致画布崩溃 |
| **开发团队** | 可维护的代码基线、清晰的组件规范 | 单文件 1433 行，TS 错误 9 个，测试脆弱 |

### 1.2 核心价值主张

VibeX 的核心竞争力是**「协作式 DDD 建模流程」**：需求输入 → 限界上下文 → 领域模型 → 业务流程 → 组件树。当前系统已跑通核心流程，但随着功能膨胀，**可维护性风险正在累积**，直接影响用户体验和团队效率。

### 1.3 当前系统性风险画像

```
风险等级    风险类型              影响范围        量化指标
───────────────────────────────────────────────────────────
🔴 P0     三树状态模型分裂        Canvas 三树      3种checkbox实现
🔴 P0     canvasStore 膨胀       整个前端          1433行单文件
🟠 P1     页面状态污染            Canvas 页面       3个scrollTop问题/周
🟠 P1     UI 变更回归率高         全局              ~20%
🟡 P2     测试覆盖率不足          CI/CD            关键路径无E2E
🟡 P2     流程规范缺失            团队协作          Epic/Story格式不统一
🟢 P3     设计系统碎片化          UI组件            emoji+SVG混用
```

---

## 2. 核心 JTBD（Jobs To Be Done）

### JTBD 1: 作为 DDD 建模者，我希望三树交互保持一致（P0）
- **当前状态**: 三树 checkbox 实现各异（ContextTree 双 checkbox/FlowTree 前置 checkbox/ComponentTree 后置 inline checkbox）
- **期望状态**: 统一的节点状态机（idle/selected/confirmed/error），统一的视觉反馈
- **价值**: 降低认知负荷，减少操作错误，提升建模效率

### JTBD 2: 作为前端开发者，我希望 canvasStore 职责清晰可测试（P0）
- **当前状态**: 1433 行 store 混合了 40+ 状态字段，所有组件直接依赖
- **期望状态**: 按领域拆分为 contextStore / flowStore / componentStore / uiStore，每个 < 300 行
- **价值**: 可单独测试，可安全重构，测试覆盖可达 80%+

### JTBD 3: 作为用户，我希望页面切换后状态干净（P1）
- **当前状态**: 页面切换后 scrollTop = 946（而非 0），panelRef 未清理
- **期望状态**: 每次进入 Canvas scrollTop = 0，无跨页面状态污染
- **价值**: 减少 bug 报告，提升产品可靠性感知

### JTBD 4: 作为团队成员，我希望变更有规范可循（P1）
- **当前状态**: UI 变更无影响范围评估，PRD/Story 格式不统一，测试与代码不同步
- **期望状态**: UI 变更 checklist、验收标准模板、测试纳入 DoD
- **价值**: 减少返工，提升交付质量一致性

### JTBD 5: 作为开发者，我希望测试环境稳定可靠（P2）
- **当前状态**: E2E 测试 flaky（waitForTimeout + 不稳定选择器），tsc 有 9 个预存错误
- **期望状态**: CI 门禁可靠，测试通过率 > 95%，覆盖核心用户路径
- **价值**: 提升开发信心，加速迭代

---

## 3. 技术方案选项

### 方案 A：「全面重构」路线（推荐 P0+P1，P2 延后）

**策略**: 优先解决结构性风险（P0），同步推进体验问题（P1），技术债务（P2）进入专项 sprint。

**详细实施计划**:

#### Phase 1: P0 问题修复（预计 10-14h）

| 子项 | 内容 | 工时 | 负责 |
|------|------|------|------|
| A-1 | 三树选择模型统一：定义 NodeState 枚举，统一 checkbox 位置和行为 | 4-6h | Dev |
| A-2 | canvasStore 拆分 Phase1：抽取 contextStore，保持代理兼容 | 3-4h | Dev |
| A-3 | E2E 测试稳定性加固：修复 tsconfig 语法错误，替换 waitForTimeout | 2h | Dev |
| A-4 | DOMPurify XSS 间接依赖：package.json 添加 overrides | 0.5h | Dev |

#### Phase 2: P1 体验优化（预计 10-14h）

| 子项 | 内容 | 工时 | 负责 |
|------|------|------|------|
| A-5 | Canvas 页面信息架构：sticky 工具栏，scrollTop 规范，Drawer 协议 | 6-8h | Dev |
| A-6 | 交互反馈标准化：Feedback Token 文档，删除 window.confirm()，统一 dragging 状态 | 4-6h | Dev |

#### Phase 3: P2 技术债务（预计 12-15h，进入后续 sprint）

| 子项 | 内容 | 工时 | 负责 |
|------|------|------|------|
| A-7 | canvasStore 拆分 Phase2-3：flowStore / componentStore / uiStore | 5-6h | Dev |
| A-8 | canvas.module.css 拆分（1420 行 → 按组件拆分） | 6h | Dev |
| A-9 | 测试覆盖率提升：用户旅程 E2E + 覆盖率门禁 | 3-4h | Tester |
| A-10 | PRD/Story 规范落地：验收标准 GIVEN-WHEN-THEN 模板 | 2-3h | PM |
| A-11 | ADR-001 checkbox 语义规范文档 | 1h | Architect |
| A-12 | TypeScript strict 模式 + types/canvas.ts 统一类型定义 | 4h | Dev |

**总工时**: P0: 10-14h + P1: 10-14h + P2: 21-24h

**优点**:
- 结构性风险优先解决，避免继续恶化
- Phase1-2 可以在当前 sprint 内完成
- P2 问题不影响当前功能交付

**缺点**:
- 跨度 3-4 个 sprint，总周期较长
- 需要团队持续纪律性

---

### 方案 B：「快速止血」路线

**策略**: 不做大规模重构，先通过标准化和文档解决表面问题，保持功能稳定。

**详细实施计划**:

#### Phase 1: 止血（预计 6-8h）

| 子项 | 内容 | 工时 |
|------|------|------|
| B-1 | 修复 9 个 TypeScript 预存错误 | 1h |
| B-2 | 统一 checkbox 视觉样式（仅样式统一，不改状态机） | 2h |
| B-3 | 修复 scrollTop = 946 问题（加 useEffect 清理） | 1h |
| B-4 | 添加 UI 变更 checklist 到 CONTRIBUTING.md | 2h |
| B-5 | DOMPurify overrides | 0.5h |

#### Phase 2: 规范建设（预计 4-5h）

| 子项 | 内容 | 工时 |
|------|------|------|
| B-6 | 创建 Canvas 组件设计规范文档 | 3h |
| B-7 | 统一 Feedback Token 规范（文档层面） | 1-2h |
| B-8 | 页面切换状态清理 SOP | 1h |

**总工时**: Phase1-2 共计 10-13h

**优点**:
- 投入小，快速见效（1 sprint 可完成）
- 风险低，不引入新架构变更

**缺点**:
- 不解决根本问题（store 膨胀、状态机分裂）
- 3 个月后可能回到当前状态
- 技术债务持续累积

---

### 方案对比

| 维度 | 方案 A（全面重构） | 方案 B（快速止血） |
|------|------------------|------------------|
| 工时投入 | 41-52h（跨 3-4 sprint） | 10-13h（1 sprint） |
| 技术风险 | 中（架构变更） | 低（仅修复+文档） |
| 长期价值 | 高（可测试、可扩展） | 低（治标不治本） |
| 适合场景 | 团队稳定，长期维护 | 快速迭代，短期交付 |
| **推荐度** | **⭐⭐⭐** | **⭐**（过渡期可行） |

**推荐方案 A**。理由：VibeX 已进入「功能堆叠→系统化」的关键节点，方案 B 只会让技术债务继续膨胀。

---

## 4. 可行性评估

### 4.1 技术可行性

| 提案 | 技术可行性 | 理由 |
|------|-----------|------|
| 三树选择模型统一 | ✅ 高 | 纯前端重构，不涉及 API，已有类似重构经验（canvas-bc-checkbox-fix） |
| canvasStore 拆分 | ✅ 高 | Zustand 支持多 store，通过代理保持 API 兼容即可渐进迁移 |
| scrollTop 规范 | ✅ 高 | 纯 useEffect 修复，已有修复先例 |
| E2E 稳定性 | ✅ 高 | 主要是配置修复（tsconfig + waitForTimeout 替换） |
| CSS 模块拆分 | ⚠️ 中 | 1420 行 CSS 重构有冲突风险，建议渐进迁移（6个月并行期） |

### 4.2 团队可行性

| 提案 | 团队可行性 | 理由 |
|------|-----------|------|
| 全面重构（方案A） | ✅ 团队稳定 | Dev 提案中有 2h canvasStore 重构估算，说明已在思考中 |
| 测试覆盖率提升 | ⚠️ 需要 tester 介入 | tester 提案显示 tester 在代码完成后才介入，建议提前到 design review 阶段 |
| PRD/Story 规范 | ✅ 流程调整 | 纯流程变更，PM 主导即可落地 |

### 4.3 资源约束

- **Dev 带宽**: 当前 sprint 已有 canvas-checkbox-style-unify 等项目在执行，建议 P0 提案以独立 Epic 形式派发，不阻塞当前 sprint
- **Reviewer 带宽**: 50+ Epic 已审查，系统性问题汇总已到位，reviewer 角色可聚焦 PR 门禁强化
- **Tester 带宽**: tester 建议提前介入 design review，需调整工作流

---

## 5. 风险识别

| 风险 ID | 风险描述 | 概率 | 影响 | 缓解措施 |
|---------|---------|------|------|---------|
| R1 | canvasStore 拆分时引入 breaking change | 中 | 高 | Phase1 使用代理模式保持 API 兼容，充分测试 |
| R2 | CSS 模块拆分导致样式冲突 | 中 | 高 | 6 个月并行期，旧文件标记废弃，逐步迁移 |
| R3 | TypeScript strict 模式发现大量隐式 any | 高 | 中 | 分阶段引入：先 `@typescript-eslint/no-explicit-any` warn，再 error |
| R4 | P2 技术债务（Sprint 回顾自动化等）优先级被挤压 | 高 | 中 | P2 进入独立 sprint，与功能开发并行 |
| R5 | 团队惯性：规范文档写完后无人遵守 | 中 | 中 | 将规范检查加入 PR review checklist，自动化 lint 规则 |
| R6 | tester 介入时机调整涉及跨 agent 协作 | 低 | 中 | 当前 team-tasks 流程已支持，提前派发 tester 任务 |

---

## 6. 验收标准（具体可测试）

### P0 验收标准

#### P0-1: 三树选择模型统一
- [ ] `npm run build` 无 TypeScript 错误（验收前：9个 TS 错误 → 0）
- [ ] 三树组件（ContextTree / FlowTree / ComponentTree）的 checkbox 均使用 inline 布局（非绝对定位）
- [ ] 已确认节点统一显示绿色 ✓ 图标，类型 badge 在 checkbox **前**
- [ ] 未确认节点无黄色边框（`nodeUnconfirmed` 样式已移除）
- [ ] E2E 测试：三树多选 + 确认操作流程通过率 100%

#### P0-2: canvasStore 拆分（Phase1）
- [ ] `contextStore.ts` 存在且 < 300 行
- [ ] 原 `canvasStore.ts` 中 context 状态通过 `create(() => contextStore.getState())` 代理
- [ ] `BoundedContextTree` 组件渲染正常（无 breaking change）
- [ ] `npm test` 全部通过（验收前：测试超时/不稳定 → 稳定）

#### P0-S: E2E 测试稳定性
- [ ] `tsc --noEmit` 无错误（验收前：tsconfig include 路径缺失 → 已修复）
- [ ] 所有 `waitForTimeout` 已替换为 Playwright 条件等待 API
- [ ] CI E2E 测试通过率 > 95%（连续 3 次运行）

#### P0-S: DOMPurify XSS
- [ ] `npm ls dompurify` 显示 monaco-editor 间接依赖已覆盖为 3.3.3
- [ ] `npm audit` 无 dompurify 相关漏洞

### P1 验收标准

#### P1-1: Canvas 页面信息架构
- [ ] 进入 Canvas 页面时 `scrollTop = 0`（可在 DevTools 验证）
- [ ] 面板切换后 scrollTop 重置（TreePanel tab 切换测试）
- [ ] 工具栏使用 `position: sticky`，滚动后仍可见
- [ ] 所有抽屉使用统一 z-index 层级，无覆盖冲突

#### P1-2: 交互反馈标准化
- [ ] `CONTRIBUTING.md` 包含 UI 变更检查清单（screenshot diff 命令）
- [ ] 代码中 `window.confirm()` 调用数 = 0（危险操作改用 toast）
- [ ] Feedback Token 文档存在：`docs/design-system/feedback-tokens.md`
- [ ] 拖拽状态统一（`dragging` 状态：opacity + scale，一致于三树）

#### P1-3: ADR-001 checkbox 语义
- [ ] `docs/adr/ADR-001-checkbox-semantics.md` 存在
- [ ] PR review checklist 包含 ADR 合规检查项

### P2 验收标准

#### P2-1: 测试覆盖率
- [ ] 核心用户旅程 E2E 测试存在：
  - `journey-create-context.spec.ts`
  - `journey-generate-flow.spec.ts`
  - `journey-multi-select.spec.ts`
- [ ] `package.json` 包含 `coverage:check` 脚本，覆盖率门禁 Statements > 60%
- [ ] 关键路径（`handleGenerate` / `confirmContextNode`）有单元测试

#### P2-2: PRD/Story 规范
- [ ] 模板文件存在：`docs/templates/prd-template.md`
- [ ] 所有 Story 的验收标准使用 GIVEN-WHEN-THEN 格式
- [ ] 测试用例已纳入 DoD（`docs/process/definition-of-done.md`）

#### P2-3: 类型安全
- [ ] `npm run type-check:strict` 无新增 error（允许渐进消除）
- [ ] `types/canvas.ts` 统一类型定义文件存在
- [ ] 高风险路径（用户输入 / API 响应）无 `as any`

#### P2-4: CSS 模块拆分
- [ ] `BoundedContextTree.module.css` / `ComponentTree.module.css` / `BusinessFlowTree.module.css` 各自独立
- [ ] `canvas.module.css` 行数 < 800（原始 1420 行减少 40%+）
- [ ] 无样式回归（视觉对比测试通过）

---

## 7. 实施路线图建议

```
Sprint N（本周期）
├── P0-1 三树选择模型统一          → Epic: vibex-tree-selection-unify
├── P0-2 canvasStore 拆分 Phase1  → Epic: vibex-canvas-store-split
├── P0-S E2E 稳定性 + DOMPurify   → Epic: vibex-ci-stability-fix
└── 产出: 可测试、可维护的 Canvas 前端基线

Sprint N+1
├── P1-1 Canvas 页面信息架构      → Epic: vibex-canvas-ia-refactor
├── P1-2 交互反馈标准化           → Epic: vibex-feedback-standard
└── 产出: 体验一致、状态干净的 Canvas 页面

Sprint N+2 ~ N+3
├── P2 技术债务专项               → Epic: vibex-tech-debt-2026q2
│   ├── canvas.module.css 拆分
│   ├── canvasStore 拆分 Phase2-3
│   ├── 测试覆盖率提升
│   ├── PRD/Story 规范落地
│   └── TypeScript strict 模式
└── 产出: 健康的前端代码基线
```

---

## 8. KPI 追踪

| KPI | 当前基线 | Sprint N 目标 | Sprint N+1 目标 | Sprint N+3 目标 |
|-----|---------|--------------|----------------|----------------|
| TypeScript 预存错误数 | 9 | **0** | 0 | 0 |
| canvasStore 行数 | 1433 | 1433（代理中）| 800 | **< 300** |
| E2E 测试通过率 | ~80% | **> 95%** | > 95% | > 95% |
| UI 一致性评分 | 6/10 | 6/10 | **7/10** | **8/10** |
| 状态污染问题（/周） | 3 | 2 | **1** | **< 0.5** |
| 覆盖率（Statements） | ~40% | ~45% | ~50% | **> 60%** |

---

*本分析基于 2026-04-01~02 周期内 PM / Analyst / Dev / Reviewer / Tester 五方提案汇总，涵盖 50+ Epic 的代码审查发现和 6 个近期项目的实施经验。*

*PM Agent | VibeX 项目 | 2026-04-02*
