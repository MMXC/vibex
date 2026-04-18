# Feature List — vibex-sprint3-prototype-extend-qa

**项目**: vibex-sprint3-prototype-extend-qa
**角色**: PM
**日期**: 2026-04-18
**基础**: 分析报告 `analysis.md`

---

## 一、Feature List 表格

| ID | 功能名 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|
| F1 | FlowTreePanel「添加连线」按钮 | 在 `FlowTreePanel.tsx` 中新增「添加连线」按钮，用户选择源页面→目标页面后调用 `prototypeStore.addEdge()` | E1-AC1 UI 缺失，PRD 明确要求此 UI 入口 | 4h |
| F2 | FlowTreePanel 连线模态框/交互 | 按钮触发后，提供源页面选择 → 目标页面选择的交互流程，支持边类型（跳转/navigate）参数 | F1 的子任务，依赖 F1 完成 | 3h |
| F3 | Navigation Tab store 单元测试 | 为 `updateNodeNavigation` 补充 `prototypeStore.test.ts` 测试用例，覆盖下拉选择→store 状态更新的完整路径 | E2 Navigation Tab 无独立单元测试 | 2h |
| F4 | Responsive Tab store 单元测试 | 为 `updateNodeBreakpoints` 补充 `prototypeStore.test.ts` 测试用例，覆盖 toggle 点击→breakpoint 状态变更的完整路径 | E2 Responsive Tab 无独立单元测试 | 2h |
| F5 | importFromImage 服务 mock 测试 | 为 `image-import.ts` 的 `importFromImage` 补充单元测试，mock `/api/chat` 返回值，验证 AI 解析结果的结构解析和 error 分支 | E4 无服务层单元测试，AI 解析结果结构变化无法被测试发现 | 3h |
| F6 | fetch 添加显式 timeout | `image-import.ts` 第 58 行 fetch 调用增加 `signal: AbortSignal.timeout(30000)`，显式声明 30s 超时，替代浏览器默认超时依赖 | E4 fetch 无显式 timeout，PRD 要求 ≤30s | 0.5h |
| F7 | prototypeStore E3-AC3 边界测试 | 为 `addNode` 的 breakpoint auto-tagging 行为补充独立测试用例，验证新节点自动继承当前 breakpoint 状态 | `prototypeStore.test.ts` 无 E3-AC3 特定测试，breakpoint auto-tagging 无独立覆盖 | 1h |
| F8 | ImportPanel 组件单元测试 | 为 `components/canvas/features/ImportPanel.tsx` 补充组件级测试，覆盖文件上传 preview、AI 解析 loading 状态、批量入画布逻辑 | ImportPanel 无任何单元测试 | 2h |

---

## 二、Epic / Story 划分

### Epic 1: E1-UI 补全 — FlowTreePanel 连线按钮

**Epic ID**: E1-FIX
**描述**: 补全 FlowTreePanel「添加连线」按钮 UI，消除 E1 高风险阻断项
**优先级**: P0（阻断性）
**总工时**: 7h

| Story ID | 描述 | 验收标准 | 工时 |
|----------|------|---------|------|
| E1-S1 | FlowTreePanel「添加连线」按钮 UI | 按钮存在于 `FlowTreePanel.tsx` 中，aria-label 为「添加连线」，点击触发连线交互流程 | 4h |
| E1-S2 | 连线交互流程（源页面→目标页面选择） | 用户点击按钮 → 弹出/进入源页面选择 → 选择后进入目标页面选择 → 确认后调用 `addEdge(sourceId, targetId)`，edges 状态正确更新 | 3h |

**E1-S2 验收标准（可测试）**:
- [ ] 点击「添加连线」按钮，界面进入源页面选择模式（视觉反馈明确）
- [ ] 选择源页面后，界面进入目标页面选择模式
- [ ] 选择目标页面并确认，edges 数组中新增对应记录（`source`/`target`/`id` 字段正确）
- [ ] 重复添加同名 edge 不产生重复记录
- [ ] 取消操作不修改 edges 状态

---

### Epic 2: E2 测试覆盖补全 — 组件属性面板

**Epic ID**: E2-TEST
**描述**: 补充 E2 组件属性面板 Navigation Tab + Responsive Tab 的 store 层单元测试，消除测试覆盖缺口
**优先级**: P1
**总工时**: 4h

| Story ID | 描述 | 验收标准 | 工时 |
|----------|------|---------|------|
| E2-S1 | Navigation Tab store 单元测试 | `updateNodeNavigation` 调用后，`nodes` 中对应节点的 `data.navigation.targetId` 正确更新 | 2h |
| E2-S2 | Responsive Tab store 单元测试 | `updateNodeBreakpoints` 调用后，`nodes` 中对应节点的 `data.breakpoints` 对象 `{ mobile: bool, tablet: bool, desktop: bool }` 正确更新 | 2h |

**E2-S1 / E2-S2 验收标准（可测试）**:
- [ ] store action 调用后，指定节点的 data 字段包含预期值
- [ ] 未指定 nodeId 时不抛错（或正确处理）
- [ ] 重复调用结果幂等

---

### Epic 3: E3 测试覆盖补全 — 响应式断点

**Epic ID**: E3-TEST
**描述**: 补充 E3 响应式断点 auto-tagging 边界测试用例
**优先级**: P2
**总工时**: 1h

| Story ID | 描述 | 验收标准 | 工时 |
|----------|------|---------|------|
| E3-S1 | addNode breakpoint auto-tagging 测试 | 调用 `addNode` 时，当前 `breakpoint` 状态（mobile/tablet/desktop）自动写入新节点的 `data.breakpoints` 字段 | 1h |

**E3-S1 验收标准（可测试）**:
- [ ] 切换断点为 mobile 后添加节点，新节点 `data.breakpoints.mobile === true`
- [ ] 切换断点为 desktop 后添加节点，新节点 `data.breakpoints.desktop === true`
- [ ] 不同断点状态添加的节点相互独立，不互相影响

---

### Epic 4: E4 测试覆盖 + 稳定性补全 — AI 草图导入

**Epic ID**: E4-TEST
**描述**: 补充 E4 importFromImage mock 测试、ImportPanel 组件测试、fetch timeout 显式声明
**优先级**: P1
**总工时**: 5.5h

| Story ID | 描述 | 验收标准 | 工时 |
|----------|------|---------|------|
| E4-S1 | importFromImage 服务 mock 测试 | mock `/api/chat` 返回值（有效 JSON + error 响应），验证函数对不同返回值的处理路径 | 3h |
| E4-S2 | ImportPanel 组件单元测试 | 覆盖文件大小校验（>10MB 拒绝）、preview 渲染、AI 解析 loading 状态、确认导入批量 addNode | 2h |
| E4-S3 | fetch 添加显式 timeout | `image-import.ts` 第 58 行 fetch 增加 `signal: AbortSignal.timeout(30000)`，30s 无响应触发 AbortError | 0.5h |

**E4-S1 验收标准（可测试）**:
- [ ] mock `/api/chat` 返回有效结构时，`importFromImage` 返回解析后的节点数据
- [ ] mock `/api/chat` 返回 401/500 时，函数抛出/返回正确错误
- [ ] mock `/api/chat` 超时（AbortError）时，函数抛出明确超时错误

**E4-S2 验收标准（可测试）**:
- [ ] 上传 >10MB 文件，UI 显示错误提示，不调用 API
- [ ] 上传 <10MB 文件，preview 区域显示图片缩略图
- [ ] 点击「确认导入」，批量 addNode 被调用（次数与 AI 返回节点数一致）

**E4-S3 验收标准（可测试）**:
- [ ] 代码中存在 `AbortSignal.timeout(30000)` 或等效 timeout 配置
- [ ] 超时后 promise 被 reject，错误信息包含 "aborted" 或 "timeout"

---

## 三、工时汇总

| Epic | 名称 | 工时 |
|------|------|------|
| E1-FIX | FlowTreePanel 连线按钮 | 7h |
| E2-TEST | 组件属性面板测试覆盖 | 4h |
| E3-TEST | 响应式断点测试覆盖 | 1h |
| E4-TEST | AI 草图导入测试 + timeout | 5.5h |
| **合计** | | **17.5h** |

---

## 四、执行优先级

| 优先级 | Story | 理由 |
|--------|-------|------|
| P0 | E1-S1, E1-S2 | 高风险阻断项，FlowTreePanel 无连线按钮导致 E1 功能完全不可用 |
| P1 | E2-S1, E2-S2, E4-S1, E4-S2, E4-S3 | 功能已实现但测试覆盖不足，影响长期可维护性和回归检测 |
| P2 | E3-S1 | 测试覆盖小缺口，风险低 |
