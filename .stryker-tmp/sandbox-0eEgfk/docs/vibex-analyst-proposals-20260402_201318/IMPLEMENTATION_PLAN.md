# Implementation Plan: VibeX 技术改进提案实施

**项目**: vibex-analyst-proposals-20260402_201318
**版本**: v1.0
**日期**: 2026-04-02
**负责人**: architect
**状态**: ✅ 计划完成

---

## 执行摘要

| Sprint | 内容 | Epic | 工时 | 优先级 |
|--------|------|------|------|--------|
| Sprint 0 | D-001 (Migration Bug) + D-002 (API 防御) | E1 + E2 | 1.5h | P0 |
| Sprint 1 | A-1 (三树状态统一) | E1 | 4-6h | P0 |
| Sprint 2 | A-2 Phase 1 (canvasStore 拆分 contextStore) | E1 | 8-12h | P0 |
| Sprint 3 | A-5 (交互反馈标准化) | E2 | 4-6h | P1 |
| Sprint 4 | A-6 + A-7 (规范落地 + 设计系统审计) | E3 | 5h | P2 |

**总工时**: 22.5–37.5h
**并行度**: 串行执行，每个 Sprint 独立测试通过后进入下一 Sprint

---

## Sprint 0: 基础设施修复

**目标**: 修复最高风险 Bug + 建立防御层
**时长**: 1.5h
**Epic**: E1 (部分) + E2 (部分)

### Sprint 0 详细步骤

#### Step 0.1: Migration Bug 修复 (45min)

> **对应**: F1.2.2 / Story-1.2.2

- [ ] **0.1.1** 创建 `src/lib/canvas/migration.ts`
- [ ] **0.1.2** 实现 `migrateNodesV2toV3`，显式设置 `status` 字段
- [ ] **0.1.3** 编写单元测试覆盖所有行为矩阵路径（9 个用例）
- [ ] **0.1.4** 备份现有 localStorage JSON（手动或脚本）
- [ ] **0.1.5** 在 canvasStore 中集成 migration.ts
- [ ] **0.1.6** 运行 E2E 验证刷新后 confirmed 状态保持

#### Step 0.2: API 防御性解析 (45min)

> **对应**: F2.1 / Story-2.1.1

- [ ] **0.2.1** 创建 `src/constants/validators.ts`，定义白名单
- [ ] **0.2.2** 创建 `src/utils/sanitizeComponent.ts`，实现 sanitizeComponent + sanitizeComponentList
- [ ] **0.2.3** 编写单元测试（valid/invalid/missing 路径全覆盖）
- [ ] **0.2.4** 在 `generateComponents` API 响应处理处集成 sanitizeComponentList
- [ ] **0.2.5** 运行相关 E2E，验证非法数据不进入 UI

### Sprint 0 验收清单

- [ ] `window.confirm` 搜索结果 + `runMigrations` status 字段已修复
- [ ] `migration.test.ts` 通过率 100%（9/9 用例）
- [ ] `sanitizeComponent.test.ts` 通过率 100%（覆盖所有分支）
- [ ] 刷新页面后 confirmed 节点状态保持绿色 ✓
- [ ] 非法 API 响应（type='invalid'）fallback 到 'page'，不崩溃

### Sprint 0 DoD

- [ ] Migration Bug 修复完成，有回归测试
- [ ] API 防御性解析上线，有单元测试
- [ ] 核心功能无新增回归

---

## Sprint 1: 三树状态统一

**目标**: 建立统一 NodeState 枚举，消除三树实现差异
**时长**: 4-6h
**Epic**: E1 / Feature-1.1

### Sprint 1 详细步骤

#### Step 1.1: NodeState 类型定义 (1h)

> **对应**: Story-1.1.1

- [ ] **1.1.1** 创建 `src/components/canvas/types/nodeState.ts`
- [ ] **1.1.2** 定义 `NodeState` 枚举（idle/selected/confirmed/error）
- [ ] **1.1.3** 定义 `NodeStatus` 常量（pending/confirmed/error）
- [ ] **1.1.4** 定义 `BaseNode` 接口
- [ ] **1.1.5** 定义 `NODE_STATE_TRANSITIONS` 状态转换矩阵
- [ ] **1.1.6** 编写单元测试覆盖所有状态转换路径
- [ ] **1.1.7** Reviewer 确认枚举命名符合团队约定

#### Step 1.2: 三树 checkbox 位置统一 (1.5h)

> **对应**: Story-1.1.2

- [ ] **1.2.1** 修改 `BoundedContextTree.tsx`，checkbox 移至 type badge 左侧
- [ ] **1.2.2** 修改 `FlowTree.tsx`，checkbox 移至 type badge 左侧
- [ ] **1.2.3** 修改 `ComponentTree.tsx`，checkbox 移至 type badge 左侧
- [ ] **1.2.4** 更新 CSS 样式文件，对应调整
- [ ] **1.2.5** 视觉截图对比验证（before/after）
- [ ] **1.2.6** 运行 E2E 验证 checkbox 交互正常

#### Step 1.3: 移除 nodeUnconfirmed 黄色边框 (1h)

> **对应**: Story-1.1.3

- [ ] **1.3.1** 全局搜索 `nodeUnconfirmed`，列出所有引用
- [ ] **1.3.2** 删除 `nodeUnconfirmed` CSS class 定义
- [ ] **1.3.3** 移除 TSX 中的 `className` 引用
- [ ] **1.3.4** 截图验证无黄色边框残留
- [ ] **1.3.5** 运行 E2E，三树渲染无异常

#### Step 1.4: 三树集成 NodeState (1h)

> **对应**: Story-1.1.1 (集成部分)

- [ ] **1.4.1** 更新 `BoundedContextTree.tsx` 使用 `NodeState` 枚举
- [ ] **1.4.2** 更新 `FlowTree.tsx` 使用 `NodeState` 枚举
- [ ] **1.4.3** 更新 `ComponentTree.tsx` 使用 `BaseNode` 接口
- [ ] **1.4.4** 更新 store 中的状态更新逻辑使用 `NodeStatus`
- [ ] **1.4.5** 完整 E2E 回归测试

### Sprint 1 验收清单

- [ ] `NodeState` 枚举定义于 `src/components/canvas/types/nodeState.ts`
- [ ] 三树（ContextTree / FlowTree / ComponentTree）均使用同一枚举
- [ ] 每种状态有对应 CSS token / 样式变量
- [ ] 三树 checkbox 统一在 type badge 左侧
- [ ] `nodeUnconfirmed` CSS 类及相关引用已删除
- [ ] 页面截图对比验证无黄色边框
- [ ] 单元测试覆盖状态转换逻辑
- [ ] E2E 三树 CRUD 路径 ≥ 95% 通过率

### Sprint 1 DoD

- [ ] 三树 checkbox 位置统一
- [ ] NodeState 枚举在三树中一致使用
- [ ] 无黄色边框残留
- [ ] 状态转换有完整测试覆盖

---

## Sprint 2: canvasStore Phase 1 拆分

**目标**: 将 canvasStore 拆分为 contextStore，代理层保持兼容
**时长**: 8-12h
**Epic**: E1 / Feature-1.2.1

### Sprint 2 详细步骤

#### Step 2.1: contextStore 设计与创建 (3h)

> **对应**: Story-1.2.1

- [ ] **2.1.1** 审查 canvasStore.ts 源码，识别 context 相关代码段（约 ~180 行）
- [ ] **2.1.2** 创建 `src/lib/canvas/contextStore.ts`
- [ ] **2.1.3** 抽取 contextNodes 状态 + 相关 actions
- [ ] **2.1.4** 抽取 context 搜索/过滤逻辑
- [ ] **2.1.5** 抽取 context 确认逻辑（使用修复后的 Migration）
- [ ] **2.1.6** 验证 contextStore.ts 行数 ≤ 200 行

#### Step 2.2: canvasStore 降为代理层 (2h)

> **对应**: Story-1.2.1

- [ ] **2.2.1** 修改 canvasStore.ts，从 contextStore.ts 导入并重导出
- [ ] **2.2.2** 移除已迁移到 contextStore 的代码段
- [ ] **2.2.3** 验证 canvasStore.ts 行数 < 300 行
- [ ] **2.2.4** TypeScript 编译验证无错误

#### Step 2.3: 调用点逐个验证 (4h)

> **对应**: Story-1.2.1

- [ ] **2.3.1** 搜索所有 `useCanvasStore` 的消费点（预期 250+ 处）
- [ ] **2.3.2** 逐个验证 context 相关调用无断裂
- [ ] **2.3.3** 运行 `pnpm build`，无 TypeScript 错误
- [ ] **2.3.4** 运行 `journey-context-crud.spec.ts`，≥ 95% 通过率
- [ ] **2.3.5** 视觉回归截图对比

#### Step 2.4: E2E 回归测试 (2h)

> **对应**: Story-1.2.1

- [ ] **2.4.1** 运行 `journey-context-crud.spec.ts`（创建/确认/删除）
- [ ] **2.4.2** 运行 `journey-confirm-flow.spec.ts`（确认流程）
- [ ] **2.4.3** 运行 `journey-migration-regression.spec.ts`（Migration 回归）
- [ ] **2.4.4** 全量 E2E suite 运行，确保无新增失败

### Sprint 2 验收清单

- [ ] `contextStore.ts` 独立于 `canvasStore.ts`
- [ ] `contextStore.ts` 行数 ≤ 200 行
- [ ] `canvasStore.ts` 行数 < 300 行
- [ ] 所有 context 相关调用点验证无断裂
- [ ] TypeScript 编译无错误
- [ ] E2E 测试通过率 ≥ 95%
- [ ] Migration 后 confirmed 状态保持
- [ ] Playwright 截图对比验证无视觉回归

### Sprint 2 DoD

- [ ] contextStore 独立且可测试
- [ ] canvasStore 作为代理层保持向后兼容
- [ ] 所有 250+ 调用点验证通过
- [ ] 完整 E2E 测试套件通过

---

## Sprint 3: 交互反馈标准化

**目标**: 消除 window.confirm()，建立统一 Feedback Token 系统
**时长**: 4-6h
**Epic**: E2 / Feature-2.2

### Sprint 3 详细步骤

#### Step 3.1: ConfirmToast 组件开发 (2h)

> **对应**: Story-2.2.1

- [ ] **3.1.1** 创建 `src/components/ui/ConfirmToast.tsx`
- [ ] **3.1.2** 实现 variant（danger/warning/info）、确认/取消按钮
- [ ] **3.1.3** 创建 `src/hooks/useConfirmToast.ts`
- [ ] **3.1.4** 全局搜索 `window.confirm`，列出所有调用点
- [ ] **3.1.5** 逐个替换为 `useConfirmToast`
- [ ] **3.1.6** 验证全局 `window.confirm` 搜索结果为 0

#### Step 3.2: Feedback Token 系统 (1.5h)

> **对应**: Story-2.2.2

- [ ] **3.2.1** 创建 `src/styles/feedback-tokens.css`
- [ ] **3.2.2** 定义五类 Token（success/error/warning/loading/confirm）
- [ ] **3.2.3** 创建 `docs/feedback-tokens.md`
- [ ] **3.2.4** 编写使用示例和代码引用

#### Step 3.3: 拖拽状态规范化 (1h)

> **对应**: Story-2.2.3

- [ ] **3.3.1** 创建 `src/styles/drag-tokens.css`
- [ ] **3.3.2** 定义 dragging / drag-over 状态样式
- [ ] **3.3.3** 审查现有拖拽实现，消除不一致
- [ ] **3.3.4** 验证拖拽交互正常

#### Step 3.4: E2E 测试覆盖 (1h)

> **对应**: Story-2.2.1

- [ ] **3.4.1** 创建 `e2e/journey-feedback-toast.spec.ts`
- [ ] **3.4.2** 测试危险操作 toast 确认流程
- [ ] **3.4.3** 测试取消操作无副作用
- [ ] **3.4.4** 运行 E2E，≥ 95% 通过率

### Sprint 3 验收清单

- [ ] 全局搜索 `window.confirm` 结果为 0
- [ ] 所有确认场景替换为 ConfirmToast component
- [ ] ConfirmToast 有确认/取消按钮，风格统一
- [ ] `docs/feedback-tokens.md` 文档完整
- [ ] 五类 Feedback Token 定义完成
- [ ] 拖拽状态有统一 CSS class/token
- [ ] E2E journey-feedback-toast.spec.ts 通过率 ≥ 95%

### Sprint 3 DoD

- [ ] 无 `window.confirm()` 调用
- [ ] Feedback Token 文档已创建
- [ ] 所有确认场景使用 ConfirmToast
- [ ] 拖拽状态规范已建立

---

## Sprint 4: 规范落地与设计系统

**目标**: PRD 模板规范化 + 设计系统一致性审计
**时长**: 5h
**Epic**: E3 / Feature-3.1 + Feature-3.2

### Sprint 4 详细步骤

#### Step 4.1: PRD 模板规范化 (2h)

> **对应**: F3.1

- [ ] **4.1.1** 更新 PRD 模板，包含 GIVEN/WHEN/THEN 示例
- [ ] **4.1.2** 统一功能 ID 格式为 `Epic-N/Feature-N.Story-N`
- [ ] **4.1.3** 补充已有 PRD 缺失的验收标准格式
- [ ] **4.1.4** 在团队 review 流程中增加格式检查步骤
- [ ] **4.1.5** Reviewer 确认格式规范

#### Step 4.2: 设计系统一致性审计 (3h)

> **对应**: F3.2

##### Step 4.2.1: emoji → SVG 替换审计 (1h)

- [ ] **4.2.1.1** 全站扫描 emoji 使用情况
- [ ] **4.2.1.2** 生成 emoji→SVG 替换清单
- [ ] **4.2.1.3** 关键路径 emoji 替换为 SVG
- [ ] **4.2.1.4** 截图验证无布局破坏

##### Step 4.2.2: Spacing Token 规范化 (1h)

- [ ] **4.2.2.1** 验证 `space-xs` / `space-sm` / `space-md` / `space-lg` / `space-xl` token 定义
- [ ] **4.2.2.2** 审查代码中硬编码像素值
- [ ] **4.2.2.3** 记录 DESIGN.md Spacing Token 章节

##### Step 4.2.3: DESIGN.md 整理 (1h)

- [ ] **4.2.3.1** 更新 DESIGN.md 包含 Spacing Token 章节
- [ ] **4.2.3.2** 添加 emoji→SVG 审计发现
- [ ] **4.2.3.3** 添加版本历史记录
- [ ] **4.2.3.4** 文档结构清晰，有目录导航

### Sprint 4 验收清单

- [ ] PRD 模板文件更新，包含 GIVEN/WHEN/THEN 示例
- [ ] 所有功能引用使用统一 ID 格式
- [ ] 全站 emoji 清单已生成
- [ ] 关键路径 emoji 已替换为 SVG
- [ ] Spacing Token 定义完整（xs/sm/md/lg/xl）
- [ ] DESIGN.md 包含本次审计所有发现
- [ ] DESIGN.md 有版本历史记录

### Sprint 4 DoD

- [ ] PRD 模板规范化落地
- [ ] 设计系统一致性审计完成
- [ ] DESIGN.md 已更新
