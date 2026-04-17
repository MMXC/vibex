# QA PRD — vibex-sprint1-qa

**项目**: vibex-sprint1-qa
**角色**: QA
**日期**: 2026-04-17
**文档类型**: QA 验证计划与测试用例
**依据**: analysis.md (§7 验收标准), IMPLEMENTATION_PLAN 功能 ID

---

## 执行决策

- **决策**: 通过（待 P1 行动完成）
- **执行项目**: vibex-sprint1-qa
- **执行日期**: 2026-04-17
- **条件**: 需启动 dev server 后用 gstack browse 确认 Edge 连线 UI 完整性

---

## 1. QA 目标与范围

### 目标

验证 Sprint1 Prototype Canvas 产出物是否满足验收标准，涵盖：
- 产出物完整性（文件存在、TypeScript 编译通过、构建产物存在）
- 交互可用性（页面渲染、拖拽交互、路由管理、属性编辑）
- 设计一致性（React Flow 架构、Zustand Store、CSS Modules、错误边界）
- 测试覆盖率（64 tests 全部通过）

### 验证范围

| 验证维度 | 范围 | 依据 |
|----------|------|------|
| 文件完整性 | §2.1 列出 的 12 个核心文件 | analysis.md §2.1 |
| TypeScript 编译 | `pnpm tsc --noEmit` → 0 errors | analysis.md §3.1 |
| Vitest 测试 | 5 个测试文件，64 tests | analysis.md §5.1 |
| 交互可用性 | ProtoFlowCanvas / ProtoAttrPanel / RoutingDrawer / ComponentPanel | analysis.md §3.2 |
| 设计一致性 | 架构重组合理性、UI Schema、错误边界 | analysis.md §4 |

### 不在范围内

- Sprint2+ 功能
- Backend / API 路由
- Storybook 可视化回归测试（P3 建议）

---

## 2. 测试用例列表

### QA1 — 产出物文件完整性验证

- **功能 ID 引用**: E1-U1, E1-U2, E1-U3, E1-U4, E2-U1, E3-U1, E5-U1
- **测试类型**: 手工验证（静态检查）
- **验收标准**:
  - `expect(fileExists('src/components/prototype/ProtoEditor.tsx')).toBe(true)`
  - `expect(fileExists('src/components/prototype/ProtoFlowCanvas.tsx')).toBe(true)`
  - `expect(fileExists('src/components/prototype/ProtoNode.tsx')).toBe(true)`
  - `expect(fileExists('src/components/prototype/ProtoAttrPanel.tsx')).toBe(true)`
  - `expect(fileExists('src/components/prototype/RoutingDrawer.tsx')).toBe(true)`
  - `expect(fileExists('src/components/prototype/ComponentPanel.tsx')).toBe(true)`
  - `expect(fileExists('src/components/prototype/PrototypeExporter.tsx')).toBe(true)`
  - `expect(fileExists('src/stores/prototypeStore.ts')).toBe(true)`
  - `expect(fileExists('src/stores/prototypeStore.test.ts')).toBe(true)`
  - `expect(fileExists('src/schemas/ui-schema.ts')).toBe(true)`
  - `expect(fileExists('src/app/prototype/page.tsx')).toBe(true)`
  - `expect(fileExists('src/app/prototype/editor/page.tsx')).toBe(true)`
- **执行方法**: `ls -la` 或 `find src -name "*.tsx" | sort`
- **预期结果**: 12/12 文件全部存在

---

### QA2 — TypeScript 编译验证

- **功能 ID 引用**: E1-U1, E1-U2, E1-U3, E1-U4, E2-U1, E3-U1, E5-U1（全局）
- **测试类型**: 单元测试（编译检查）
- **验收标准**:
  - `expect(exec('pnpm tsc --noEmit').exitCode).toBe(0)`
  - `expect(stdout).not.toContain('error TS')`
- **执行方法**: `pnpm tsc --noEmit`
- **预期结果**: 0 errors，编译通过

---

### QA3 — Vitest 测试套件验证

- **功能 ID 引用**: E1-U4 (store actions), E2-U1 (ComponentPanel), E5-U1 (UI Schema)
- **测试类型**: 单元测试
- **验收标准**:
  - `expect(exec('pnpm vitest run').exitCode).toBe(0)`
  - `expect(stdout).toMatch(/\d+ tests passed/);`
  - `expect(stdout).toContain('prototypeStore.test.ts')`
  - `expect(stdout).toContain('ProtoAttrPanel.test.tsx')`
  - `expect(stdout).toContain('ComponentPanel.test.tsx')`
  - `expect(stdout).toContain('ProtoNode.test.tsx')`
  - `expect(stdout).toContain('ProtoFlowCanvas.test.tsx')`
- **执行方法**: `pnpm vitest run`
- **预期结果**: 64 tests passed，5 个测试文件全部通过

---

### QA4 — prototypeStore action 覆盖率验证

- **功能 ID 引用**: E1-U4 (ProtoAttrPanel), E4-U1 (Edge 连线)
- **测试类型**: 单元测试（白盒）
- **验收标准**:
  - `expect(testedActions).toContain('addNode')`
  - `expect(testedActions).toContain('updateNode')`
  - `expect(testedActions).toContain('removeNode')`
  - `expect(testedActions).toContain('addPage')`
  - `expect(testedActions).toContain('removePage')`
  - `expect(testedActions).toContain('addEdge')`  // E4-U1
  - `expect(testedActions).toContain('removeEdge')`  // E4-U1
  - `expect(testCount).toBeGreaterThanOrEqual(17)`  // analysis.md §5.1
- **执行方法**: `pnpm vitest run src/stores/prototypeStore.test.ts`
- **预期结果**: 17 tests passed，addEdge / removeEdge 已覆盖

---

### QA5 — ProtoFlowCanvas Edge 连线 UI 验证（P1 阻塞）

- **功能 ID 引用**: E4-U1 (路由树增强，Edge 连线)
- **测试类型**: 端到端（gstack browse）
- **验收标准**:
  - `expect(isVisible('.react-flow__edge')).toBe(true)` 或验证 edge 数据结构存在
  - `expect(canvas.nodes).toHaveLength(2)` 或以上（至少 2 个节点可连线）
  - `expect(store.edges.length).toBeGreaterThanOrEqual(0)`（store 层已支持）
- **执行方法**: `gstack browse` → 启动 dev server → `/app/prototype/editor/page.tsx`
- **预期结果**: 页面渲染成功，节点可添加，Edge 可视化编辑 UI 可用
- **阻塞原因**: analysis.md §6 风险等级 🟡 中 — dev server 未运行，需启动后验证

---

### QA6 — 拖拽节点交互验证

- **功能 ID 引用**: E2-U2 (组件拖拽交互)
- **测试类型**: 端到端（gstack browse）
- **验收标准**:
  - `expect(isVisible('.react-flow__node')).toBe(true)`（节点渲染）
  - `expect(isVisible('.component-item')).toBe(true)`（ComponentPanel 组件列表）
  - 拖拽组件到画布后，`expect(nodes.length).toBeGreaterThan(0)`（节点增加）
- **执行方法**: `gstack browse` → `/app/prototype/editor/page.tsx`
- **预期结果**: 组件面板可见，拖拽后节点出现在画布上

---

### QA7 — RoutingDrawer 页面管理验证

- **功能 ID 引用**: E3-U1 (RoutingDrawer), E3-U2 (页面路由管理)
- **测试类型**: 端到端（gstack browse）
- **验收标准**:
  - `expect(isVisible('text=页面管理')).toBe(true)` 或 drawer 可见
  - `expect(pageList).toHaveLength(1)` 或以上（至少默认页面）
  - 点击添加页面后，`expect(pageList.length).toBeGreaterThan(initialCount)`
- **执行方法**: `gstack browse` → RoutingDrawer → 页面管理区域
- **预期结果**: 页面列表可见，可添加/删除页面

---

### QA8 — ProtoAttrPanel 属性编辑验证

- **功能 ID 引用**: E1-U3 (MockData), E1-U4 (ProtoAttrPanel)
- **测试类型**: 端到端（gstack browse）+ 单元测试
- **验收标准**:
  - `expect(isVisible('.attr-panel')).toBe(true)`
  - 选择节点后，`expect(panel.title).toBe(nodeName)`
  - 修改属性值后，`expect(store.nodes[0].data).toMatchObject({...updatedData})`
- **执行方法**: `gstack browse` + `pnpm vitest run src/components/prototype/ProtoAttrPanel.test.tsx`
- **预期结果**: 5 tests passed，属性面板可见，MockData tab 可切换

---

### QA9 — 构建产物存在性验证

- **功能 ID 引用**: 全局（部署前提）
- **测试类型**: 手工验证（CI/CD 前置）
- **验收标准**:
  - `expect(dirExists('.next/')).toBe(true)`
  - `expect(dirExists('storybook-static/')).toBe(true)`
- **执行方法**: `ls -d .next storybook-static`
- **预期结果**: 两个目录均存在

---

### QA10 — 架构重组合理性验证

- **功能 ID 引用**: E1-U3, E1-U2（重组）
- **测试类型**: 手工验证（代码审查）
- **验收标准**:
  - `MockDataPanel` 功能已在 `ProtoAttrPanel.tsx` 内置 → `expect(fileContains('ProtoAttrPanel.tsx', 'MockData')).toBe(true)`
  - `ProtoPagePanel` 功能已在 `RoutingDrawer.tsx` 内置 → `expect(fileContains('RoutingDrawer.tsx', 'page')).toBe(true)`
- **执行方法**: `grep -l 'MockData\|page' src/components/prototype/ProtoAttrPanel.tsx`
- **预期结果**: 两个文件均包含对应功能，非功能缺失

---

### QA11 — 错误边界与加载状态验证

- **功能 ID 引用**: E5-U1 (组件库完善)
- **测试类型**: 手工验证（代码审查）
- **验收标准**:
  - `expect(fileExists('src/components/prototype/PrototypeErrorBoundary.tsx')).toBe(true)`
  - `expect(fileContains('ProtoEditor.tsx', 'ErrorBoundary')).toBe(true)` 或 Loading 骨架屏
- **执行方法**: `ls src/components/prototype/` + `grep -n 'ErrorBoundary\|Loading' src/components/prototype/`
- **预期结果**: 错误边界和加载状态已实现

---

### QA12 — ProtoFlowCanvas 测试覆盖率提升验证（P1 建议）

- **功能 ID 引用**: E4-U1 (Edge 连线)
- **测试类型**: 单元测试（补充）
- **验收标准**:
  - `expect(testCount).toBeGreaterThanOrEqual(15)`（当前仅 8 tests，见 analysis.md §5.2）
  - edge 连接测试: `expect(onConnect).toBeDefined()`
  - 设备切换测试: `expect(deviceMode).toBeIn(['desktop', 'tablet', 'mobile'])`
- **执行方法**: `pnpm vitest run src/components/prototype/ProtoFlowCanvas.test.tsx`
- **预期结果**: 测试数从 8 提升至 15+，edge 相关测试新增

---

## 3. 缺陷追踪

基于 analysis.md §6 识别的风险：

| 缺陷 ID | 缺陷描述 | 等级 | 状态 | 关联测试 |
|---------|---------|------|------|---------|
| DEF-01 | RoutingDrawer 的页面连线功能（addEdge）UI 完整性未验证 | 🟡 中 | Open（阻塞 QA5） | QA5, QA12 |
| DEF-02 | ProtoFlowCanvas 测试覆盖率偏低（8 tests → 需 15+）| 🟡 中 | Open（阻塞 QA12） | QA12 |
| DEF-03 | dev server 未运行，gstack browse 交互验证受阻 | 🟡 中 | Open（P1 行动）| QA5, QA6, QA7, QA8 |
| DEF-04 | prototypeStore addEdge/removeEdge 来自不同 repo 的 commit（低风险）| 🟢 低 | Monitor | QA4 |

---

## 4. QA DoD（Definition of Done）

Sprint1 QA 验证通过需满足：

- [ ] **QA1**: 12/12 核心文件全部存在
- [ ] **QA2**: `pnpm tsc --noEmit` → 0 errors
- [ ] **QA3**: 64 tests across 5 files → all passed
- [ ] **QA4**: prototypeStore test ≥ 17 tests，包含 addEdge/removeEdge
- [ ] **QA5**: dev server 启动后，gstack browse 验证 Edge 连线 UI 可用
- [ ] **QA6**: 拖拽节点到画布，节点正常渲染
- [ ] **QA7**: RoutingDrawer 页面管理（增/删）功能正常
- [ ] **QA8**: ProtoAttrPanel 属性编辑 + MockData tab 正常
- [ ] **QA9**: 构建产物 `.next/` 和 `storybook-static/` 存在
- [ ] **QA10**: 架构重组确认（MockDataPanel → ProtoAttrPanel, ProtoPagePanel → RoutingDrawer）
- [ ] **QA11**: ErrorBoundary + Loading skeleton 已实现
- [ ] **QA12**: ProtoFlowCanvas 测试数 ≥ 15（含 edge 连接 + 设备切换）

**P1 阻塞解除条件**: dev server 启动 → gstack browse → QA5/QA6/QA7/QA8 全部通过 → DEF-03 关闭

---

## 5. Sprint1 产出物清单

基于 analysis.md §2 列出：

### 核心组件文件

| 文件 | 路径 | 行数 | 状态 |
|------|------|------|------|
| ProtoEditor.tsx | src/components/prototype/ | ~323L | ✅ |
| ProtoFlowCanvas.tsx | src/components/prototype/ | ~215L | ✅ |
| ProtoNode.tsx | src/components/prototype/ | — | ✅ |
| ProtoAttrPanel.tsx | src/components/prototype/ | ~195L | ✅ |
| RoutingDrawer.tsx | src/components/prototype/ | ~185L | ✅ |
| ComponentPanel.tsx | src/components/prototype/ | — | ✅ |
| PrototypeExporter.tsx | src/components/prototype/ | — | ✅ |

### Store 与 Schema

| 文件 | 路径 | 行数 | 状态 |
|------|------|------|------|
| prototypeStore.ts | src/stores/ | ~245L | ✅（已扩展 addEdge/removeEdge）|
| ui-schema.ts | src/schemas/ | — | ✅ |

### 测试文件

| 文件 | 路径 | 测试数 | 状态 |
|------|------|--------|------|
| prototypeStore.test.ts | src/stores/ | 17 | ✅ |
| ProtoAttrPanel.test.tsx | src/components/prototype/ | 5 | ✅ |
| ComponentPanel.test.tsx | src/components/prototype/ | 16 | ✅ |
| ProtoNode.test.tsx | src/components/prototype/ | 18 | ✅ |
| ProtoFlowCanvas.test.tsx | src/components/prototype/ | 8 | ⚠️ 需提升至 15+ |

### 页面文件

| 文件 | 路径 | 状态 |
|------|------|------|
| PrototypePreview | src/app/prototype/page.tsx | ✅ |
| ProtoEditor wrapper | src/app/prototype/editor/page.tsx | ✅ |

### 构建产物

| 产物 | 状态 |
|------|------|
| .next/ | ✅ 存在 |
| storybook-static/ | ✅ 存在 |

### 辅助文件

| 文件 | 说明 | 状态 |
|------|------|------|
| PrototypeErrorBoundary.tsx | 错误边界 | ✅ |
| *.module.css | CSS Modules | ✅ |

---

*QA Agent | 2026-04-17*
