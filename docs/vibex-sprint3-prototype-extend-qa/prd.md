# PRD — vibex-sprint3-prototype-extend-qa

**项目**: vibex-sprint3-prototype-extend-qa
**版本**: 1.0
**日期**: 2026-04-18
**状态**: Draft
**作者**: PM

---

## 执行决策

| 字段 | 内容 |
|------|------|
| **决策** | 已采纳 |
| **执行项目** | vibex-sprint3-prototype-extend-qa |
| **执行日期** | 2026-04-18 |
| **技术方案** | 基于 analysis.md 发现的问题，补全缺失的 UI 和测试覆盖，确保 4 个 Epic 可通过验收 |
| **优先级建议** | E1-QA (UI补全) = P0；E2-QA + E4-QA (测试覆盖) = P1；E3-QA = P2 |

---

## 1. 执行摘要

### 背景

`vibex-sprint3-prototype-extend` 交付了 4 个 Epic（E1 页面跳转连线、E2 组件属性面板、E3 响应式断点、E4 AI草图导入）。QA 分析（analysis.md，2026-04-18）发现：

- **E1**: 代码逻辑完整，但 FlowTreePanel「添加连线」按钮 UI 完全缺失，E1-AC1 无法通过验收
- **E2**: 代码完整，71/71 单元测试 PASS，但 Navigation Tab + Responsive Tab 无独立 store 层单元测试
- **E3**: 代码完整，71/71 单元测试 PASS，仅 E3-AC3（断点自动标记）无独立测试用例
- **E4**: 代码完整，但 `image-import.ts` 无单元测试，fetch 无显式 timeout

### 目标（QA修复范围）

本次 QA Sprint 的目标：

1. 补全 E1 FlowTreePanel「添加连线」按钮 UI，确保 E1-AC1 可端到端验证
2. 为 E2/E3/E4 补充缺失的 store 层单元测试，消除测试覆盖盲区
3. 修正 E4 fetch 超时行为，显式声明 30s timeout
4. 全局回归确保 Sprint3 相关测试 >= 71/71，gstack browse E2E 验证通过

### 成功指标

- E1: FlowTreePanel「添加连线」按钮存在且 E2E 可交互
- E2: `updateNodeNavigation` + `updateNodeBreakpoints` 单元测试覆盖，all pass
- E3: `addNode` 断点自动标记有独立测试用例，all pass
- E4: `importFromImage` mock 测试存在；fetch timeout 修正已提交
- 全局回归: Sprint3 相关单元测试 >= 71/71
- gstack browse: 所有 4 个 Epic 端到端可交互，无新增 console.error

---

## 2. Epic/Story 表格

### Epic 映射总览

| Epic（原始） | 原始状态 | QA Phase Epic | 本质问题 | 修复类型 |
|-------------|---------|---------------|---------|---------|
| E1 页面跳转连线 | 条件通过 | E1-QA | FlowTreePanel UI 缺失 | UI补全 + E2E验证 |
| E2 组件属性面板 | 通过（测试缺口） | E2-QA | Navigation/Responsive Tab 无单元测试 | 单元测试补全 |
| E3 响应式断点 | 通过（测试缺口） | E3-QA | E3-AC3 无独立测试 | 单元测试补全 |
| E4 AI草图导入 | 通过（测试缺口） | E4-QA | image-import.ts 无测试，fetch 无 timeout | 单元测试补全 + Bug修正 |

---

### E1-QA: FlowTreePanel 连线按钮补全验证

**本质问题**: UI缺失导致 E1-AC1 无法通过。prototypeStore.edges CRUD 逻辑正确，但 FlowTreePanel 没有发起 edge 创建的 UI 入口。

**本期必做**: FlowTreePanel「添加连线」按钮 UI 补全 + 端到端验证

**本期不做**: 替代方案（React Flow 拖拽连接）的完整 E2E 覆盖

| Story ID | 功能点 | 描述 | 关联 Epic |
|---------|--------|------|----------|
| E1-QA-S1 | FlowTreePanel 连线按钮 | 补全 E1-AC1 缺失的「添加连线」按钮 UI | E1 |

---

### E2-QA: 属性面板测试覆盖补全

**本质问题**: Navigation Tab + Responsive Tab 无独立 store 层单元测试，行为正确性依赖人工验证。

**本期必做**: `updateNodeNavigation` + `updateNodeBreakpoints` store 层单元测试

**本期不做**: E2E drag-to-panel 流程测试（headless 限制）

| Story ID | 功能点 | 描述 | 关联 Epic |
|---------|--------|------|----------|
| E2-QA-S1 | Navigation Tab store 测试 | `updateNodeNavigation` 单元测试覆盖 | E2 |
| E2-QA-S2 | Responsive Tab store 测试 | `updateNodeBreakpoints` 单元测试覆盖 | E2 |

---

### E3-QA: 响应式断点测试补全

**本质问题**: E3-AC3 breakpoint auto-tagging 无独立测试用例。71/71 测试通过但缺少针对 `addNode` 断点自动标记逻辑的覆盖。

**本期必做**: `addNode` 断点自动标记的 store 层单元测试

**本期不做**: 可视化断点切换的 E2E 覆盖

| Story ID | 功能点 | 描述 | 关联 Epic |
|---------|--------|------|----------|
| E3-QA-S1 | 断点自动标记测试 | `addNode` 断点标记 store 层测试 | E3 |

---

### E4-QA: AI导入服务层测试补全

**本质问题**: `image-import.ts` 无单元测试，fetch 无显式 timeout（依赖浏览器默认行为，PRD 要求 ≤30s）。

**本期必做**: `importFromImage` mock 测试 + fetch timeout 修正

**本期不做**: AI 解析准确性集成测试

| Story ID | 功能点 | 描述 | 关联 Epic |
|---------|--------|------|----------|
| E4-QA-S1 | importFromImage mock 测试 | AI 解析结构 mock 测试 | E4 |
| E4-QA-S2 | fetch timeout 修正 | 添加 `AbortSignal.timeout(30000)` | E4 |

---

## 3. 功能列表（Feature List）

| ID | 功能点 | 描述 | 验收标准 | 关联Epic | 类型 |
|----|--------|------|----------|----------|------|
| F-Q1.1 | FlowTreePanel 连线按钮 | 补全 E1-AC1 缺失的 UI：FlowTreePanel 增加「添加连线」按钮，点击后进入连线创建流程（选择源页面→选择目标页面→确认） | `expect(screen.getByRole('button', {name: /添加连线/})).toBeInTheDocument()` | E1 | Feature |
| F-Q1.2 | 连线按钮 E2E 验证 | 连线创建流程端到端验证：点击按钮→选择源节点→选择目标节点→edges 中新增记录 | `expect(store.edges).toContainEqual(expect.objectContaining({source: pageId1, target: pageId2}))` | E1 | E2E |
| F-Q2.1 | Navigation Tab store 测试 | `updateNodeNavigation` 单元测试覆盖：验证导航 target 更新正确写入 store | `expect(updateNodeNavigation(store, 'NODE_001', 'NODE_002').nodes.find(n=>n.id==='NODE_001').navigation.target).toBe('NODE_002')` | E2 | 单元测试 |
| F-Q2.2 | Responsive Tab store 测试 | `updateNodeBreakpoints` 单元测试覆盖：验证断点规则更新正确写入 store | `expect(updateNodeBreakpoints(store, 'NODE_001', {mobile:true,tablet:false,desktop:true}).nodes.find(n=>n.id==='NODE_001').breakpoints).toEqual({mobile:true,tablet:false,desktop:true})` | E2 | 单元测试 |
| F-Q3.1 | 断点自动标记测试 | `addNode` 在特定断点下自动标记断点属性的 store 层测试 | `expect(addNode(store, {type:'Button',breakpoint:'375'}).nodes[n].breakpoints).toEqual({mobile:true,tablet:false,desktop:false})` | E3 | 单元测试 |
| F-Q4.1 | importFromImage mock 测试 | `importFromImage` mock 测试：模拟 AI 返回结构，验证解析结果正确转为 ComponentNode 数组 | `expect(await importFromImage(mockFile, mockAIResponse)).toMatchObject({nodes: expect.arrayContaining([expect.objectContaining({type:'Button'})])})` | E4 | 单元测试 |
| F-Q4.2 | fetch timeout 修正 | `image-import.ts` fetch 添加显式 timeout: `signal: AbortSignal.timeout(30000)` | `expect(fetch).toBeCalledWith(expect.any(String), expect.objectContaining({signal: expect.any(AbortSignal)}))` | E4 | Bug修正 |

---

## 4. 验收标准

### E1-QA: FlowTreePanel 连线按钮

#### E1-QA-AC1: FlowTreePanel「添加连线」按钮存在
- **Input**: 渲染 FlowTreePanel 组件
- **Expected Output**:
  - 存在「添加连线」按钮
  - `expect(screen.getByRole('button', {name: /添加连线/})).toBeInTheDocument()`
  - 按钮可见且可点击

#### E1-QA-AC2: 连线创建流程端到端
- **Input**: 点击「添加连线」按钮 → 选择源页面节点 → 选择目标页面节点 → 点击确认
- **Expected Output**:
  - prototypeStore.edges 中新增一条 `{ id, source: pageId1, target: pageId2, type: 'smoothstep' }` 记录
  - `expect(store.edges).toContainEqual(expect.objectContaining({source: pageId1, target: pageId2}))`

#### E1-QA-AC3: React Flow 拖拽连接回退验证
- **Input**: 在 ProtoFlowCanvas 中通过 React Flow 拖拽创建 edge
- **Expected Output**:
  - `addEdge` 被正确调用，edges 状态更新
  - 画布上出现可视化连线

---

### E2-QA: 属性面板测试覆盖

#### E2-QA-AC1: updateNodeNavigation 单元测试
- **Input**: 调用 `updateNodeNavigation(store, 'NODE_001', 'NODE_002')`
- **Expected Output**:
  - 指定节点的 `navigation.target` 字段更新为 `'NODE_002'`
  - `expect(result.nodes.find(n => n.id === 'NODE_001').navigation.target).toBe('NODE_002')`
  - 其他节点属性不受影响
  - `expect(result.nodes.find(n => n.id === 'NODE_003').navigation.target).toBeUndefined()`

#### E2-QA-AC2: updateNodeBreakpoints 单元测试
- **Input**: 调用 `updateNodeBreakpoints(store, 'NODE_001', {mobile: true, tablet: false, desktop: true})`
- **Expected Output**:
  - 指定节点的 `breakpoints` 字段完整更新
  - `expect(result.nodes.find(n => n.id === 'NODE_001').breakpoints).toEqual({mobile: true, tablet: false, desktop: true})`
  - 部分更新场景：`updateNodeBreakpoints(store, 'NODE_001', {mobile: false})` 仅更新 mobile，tablet/desktop 保持原值

#### E2-QA-AC3: Navigation Tab + Responsive Tab 联动
- **Input**: 在 Navigation Tab 选择 target 后，在 Responsive Tab 调整断点
- **Expected Output**:
  - 两个 store 方法调用后，节点数据完整保留
  - `expect(result.nodes[0]).toMatchObject({navigation: {target: 'NODE_002'}, breakpoints: {mobile: true}})`

---

### E3-QA: 响应式断点测试

#### E3-QA-AC1: addNode 断点自动标记（手机断点）
- **Input**: `prototypeStore.breakpoint === '375'` 时调用 `addNode({type: 'Button', id: 'NEW_001'})`
- **Expected Output**:
  - 新节点自动设置 `breakpoints: {mobile: true, tablet: false, desktop: false}`
  - `expect(result.nodes.find(n => n.id === 'NEW_001').breakpoints).toEqual({mobile: true, tablet: false, desktop: false})`

#### E3-QA-AC2: addNode 断点自动标记（平板断点）
- **Input**: `prototypeStore.breakpoint === '768'` 时调用 `addNode({type: 'Card', id: 'NEW_002'})`
- **Expected Output**:
  - `expect(result.nodes.find(n => n.id === 'NEW_002').breakpoints).toEqual({mobile: false, tablet: true, desktop: false})`

#### E3-QA-AC3: addNode 断点自动标记（桌面断点）
- **Input**: `prototypeStore.breakpoint === '1024'` 时调用 `addNode({type: 'Input', id: 'NEW_003'})`
- **Expected Output**:
  - `expect(result.nodes.find(n => n.id === 'NEW_003').breakpoints).toEqual({mobile: false, tablet: false, desktop: true})`

---

### E4-QA: AI导入服务层测试

#### E4-QA-AC1: importFromImage mock 测试 — 正常返回
- **Input**: 用 mock AI 响应调用 `importFromImage(mockFile, {components: [{type:'Button',count:2},{type:'Input',count:1}]})`
- **Expected Output**:
  - 返回包含正确数量节点的数组
  - `expect(result.nodes).toHaveLength(3)`
  - `expect(result.nodes.filter(n => n.type === 'Button')).toHaveLength(2)`
  - `expect(result.nodes.filter(n => n.type === 'Input')).toHaveLength(1)`
  - 每个节点有 `id`、`type`、`data`、`breakpoints` 字段

#### E4-QA-AC2: importFromImage mock 测试 — AI 返回空列表
- **Input**: AI 返回 `{components: []}`
- **Expected Output**:
  - `expect(result.nodes).toHaveLength(0)`
  - 不抛出异常

#### E4-QA-AC3: importFromImage mock 测试 — 文件类型校验
- **Input**: 调用 `importFromImage(mockInvalidFile)`（非图片文件）
- **Expected Output**:
  - 抛出错误或返回 `error` 字段
  - `expect(result.error || throws).toBeTruthy()`

#### E4-QA-AC4: fetch timeout 修正
- **Input**: 检查 `image-import.ts` 中 fetch 调用
- **Expected Output**:
  - fetch 请求包含 `signal: AbortSignal.timeout(30000)`
  - 超时后 Promise reject，`expect(fetchWithTimeout).rejects.toThrow()`（或 AbortError）
  - 测试覆盖: mock `AbortController` + `setTimeout` 模拟 30s 超时

---

## 5. Definition of Done（DoD）

### 全局 DoD（QA Phase）

- [ ] **E1-QA**: FlowTreePanel「添加连线」按钮存在且可交互，E2E 验证通过
- [ ] **E1-QA**: 连线创建流程端到端（按钮→选择源→选择目标→edges 新增）验证通过
- [ ] **E2-QA**: `updateNodeNavigation` + `updateNodeBreakpoints` 单元测试覆盖，all pass
- [ ] **E3-QA**: `addNode` 断点自动标记有独立测试用例（手机/平板/桌面各 1 个 case），all pass
- [ ] **E4-QA**: `importFromImage` mock 测试存在（正常返回、空列表、文件类型校验），all pass
- [ ] **E4-QA**: fetch timeout 修正已提交（`AbortSignal.timeout(30000)`），测试覆盖超时场景
- [ ] **全局回归**: 所有 Sprint3 相关单元测试 >= 71/71 + 新增测试全部通过
- [ ] **gstack browse**: 端到端验证所有 4 个 Epic 可正常交互
- [ ] **无新增 console.error**

### Epic 级别 DoD

#### E1-QA DoD
- [ ] FlowTreePanel 渲染后存在「添加连线」按钮
- [ ] 点击按钮后进入连线创建交互流程
- [ ] 流程完成后 prototypeStore.edges 中有对应记录
- [ ] 画布上正确渲染连线

#### E2-QA DoD
- [ ] `updateNodeNavigation` 有 ≥2 个测试用例（正常更新 + 边界情况）
- [ ] `updateNodeBreakpoints` 有 ≥2 个测试用例（完整更新 + 部分更新）
- [ ] 所有新增测试 `npm test` pass

#### E3-QA DoD
- [ ] `addNode` 断点自动标记有 3 个测试用例（375/768/1024 各一）
- [ ] 测试覆盖断点切换场景下新建节点自动标记
- [ ] 所有测试 `npm test` pass

#### E4-QA DoD
- [ ] `importFromImage` 有 ≥3 个 mock 测试用例
- [ ] `image-import.ts` 中 fetch 包含显式 `AbortSignal.timeout(30000)`
- [ ] fetch 超时有对应单元测试
- [ ] 所有测试 `npm test` pass

---

## 6. 优先级矩阵

| Epic | 问题类型 | 影响范围 | 修复难度 | RICE 评分 | 优先级 |
|------|---------|---------|---------|---------|---------|
| E1-QA FlowTreePanel 按钮 | UI缺失 | 阻塞 E1-AC1 验收 | 低（UI补全） | 20×1.0×100%÷0.05 = **400** | **P0** |
| E2-QA 属性面板测试 | 测试覆盖缺口 | 行为正确性无保障 | 中（写测试） | 20×0.8×90%÷0.08 = **180** | **P1** |
| E4-QA AI导入测试 | 测试覆盖缺口+bug | AI解析无保障，超时不可控 | 中（写测试+修正） | 15×0.6×80%÷0.1 = **72** | **P1** |
| E3-QA 断点测试 | 测试覆盖缺口 | E3-AC3 无独立测试 | 低（写测试） | 15×0.5×95%÷0.05 = **142.5** | **P2** |

**说明**:
- E1-QA RICE 最高，因 UI 缺失直接阻塞 E1 验收，且修复仅需 UI 补全
- E2-QA/E4-QA 同级 P1，需并行开发
- E3-QA P2，但工时最短，可快速收尾

---

## 7. 依赖关系图

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Sprint3 现有资产（Analysis 已验证）                   │
├─────────────────────────────────────────────────────────────────────┤
│  prototypeStore.ts  ──── E1 edges CRUD ✅ │ E2 store methods ✅     │
│  ProtoFlowCanvas.tsx ─── E1 edge渲染 ✅ │ E3 breakpoint width ✅    │
│  FlowTreePanel.tsx   ─── E1 连线按钮 ❌（缺失）                       │
│  ProtoAttrPanel.tsx  ─── E2 属性面板 ✅                              │
│  ProtoEditor.tsx     ─── E3 设备切换按钮 ✅                           │
│  image-import.ts     ─── E4 AI解析 ✅ │ fetch timeout ❌（缺失）     │
└─────────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼─────────────────────┐
          ▼                   ▼                     ▼
   ┌─────────────┐     ┌─────────────┐      ┌─────────────┐
   │  E1-QA      │     │  E2-QA      │      │  E3-QA      │
   │ UI补全      │     │ 测试补全    │      │ 测试补全    │
   │ + E2E验证   │     │ Navigation  │      │ 断点标记    │
   │             │     │ Responsive  │      │ 独立测试    │
   └──────┬──────┘     └──────┬──────┘      └──────┬──────┘
          │                   │                     │
          └───────────────────┼─────────────────────┘
                              ▼
                    ┌───────────────────┐
                    │      E4-QA        │
                    │ 测试补全 + Bug修正 │
                    │ importFromImage   │
                    │ fetch timeout     │
                    └───────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   全局回归         │
                    │ >= 71/71 tests    │
                    │ gstack browse E2E │
                    └───────────────────┘
```

---

## 8. Sprint 范围与排期

### 工时估算

| Epic | 任务 | 估算工时 | 实际工时 | 状态 |
|------|------|---------|---------|------|
| E1-QA | FlowTreePanel「添加连线」按钮 UI 补全 | 1.5h | | |
| E1-QA | 连线创建流程 E2E 验证（gstack browse） | 1h | | |
| E2-QA | updateNodeNavigation 单元测试 | 0.5h | | |
| E2-QA | updateNodeBreakpoints 单元测试 | 0.5h | | |
| E3-QA | addNode 断点自动标记单元测试（×3 cases） | 0.5h | | |
| E4-QA | importFromImage mock 测试（×3 cases） | 0.5h | | |
| E4-QA | fetch timeout 修正 + 测试 | 0.5h | | |
| 全局 | 全局回归 + gstack browse E2E | 1h | | |
| **合计** | | **6h** | | |

### Sprint 排期建议（1天快速迭代）

| 时段 | 任务 |
|------|------|
| 上午 | E1-QA FlowTreePanel 按钮补全 + E2-QA 单元测试 |
| 下午 | E3-QA + E4-QA 单元测试 + fetch timeout 修正 |
| 收尾 | 全局回归 + gstack browse E2E 验证 |

---

## 附录

### 关键代码位置（Analysis 参考）

| 文件 | 行 | 内容 |
|------|----|------|
| `prototypeStore.ts` | 225-248 | `addEdge`/`removeEdge` 实现 |
| `prototypeStore.ts` | 169 | `removeNode` 级联清除 edges |
| `prototypeStore.ts` | 253 | `updateNodeBreakpoints` |
| `prototypeStore.ts` | 263 | `updateNodeNavigation` |
| `prototypeStore.ts` | 253 | `addNode` 断点自动标记（E3-AC3 核心逻辑） |
| `ProtoFlowCanvas.tsx` | 131 | `onNodeDoubleClick` |
| `ProtoFlowCanvas.tsx` | 104-105 | `onConnect` → `addEdge` |
| `ProtoEditor.tsx` | 236-266 | 设备切换按钮 |
| `image-import.ts` | 58 | `importFromImage` + fetch `/api/chat` |
| `image-import.ts` | 35 | 10MB 文件大小校验 |

### TBD 项

| 项 | 说明 | 负责人 |
|----|------|-------|
| FlowTreePanel 连线按钮交互细节 | 选择源/目标页面是弹窗、dropdown 还是内联选择 | Design |
| E1 连线按钮 UI 测试 | 是否需要 React Testing Library 组件级测试 | QA |
| image-import.ts fetch timeout 测试方案 | 如何在 vitest 中 mock AbortSignal.timeout | QA |
