# Implementation Plan — vibex-sprint4-spec-canvas-extend

**项目**: vibex-sprint4-spec-canvas-extend
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect
**上游**: prd.md, architecture.md

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: API 规格章节 | E1-U1 ~ E1-U5 | ✅ 5/5 | — |
| E2: 业务规则章节 | E2-U1 ~ E2-U2 | ✅ 2/2 | — |
| E3: 跨章节集成 | E3-U1 ~ E3-U2 | 0/2 | E3-U1 |
| E4: 导出功能 | E4-U1 ~ E4-U5 | 5/5 ✅ | done |
| E5: 章节四态规范 | E5-U1 ~ E5-U2 | 2/2 ✅ | done |

---

## E1: API 规格章节

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | APIEndpointCard 类型定义 | ✅ | — | `types/dds/api-endpoint.ts` 包含完整 APIEndpointCard 接口 |
| E1-U2 | APIEndpointCard 组件 | ✅ | E1-U1 | 节点显示 method badge + path + summary，选中高亮 |
| E1-U3 | DDSPanel API 组件面板 | ✅ | E1-U2 | 5 种方法卡片（GET/POST/PUT/DELETE/PATCH）可拖拽 |
| E1-U4 | API 属性面板 | ✅ | E1-U2 | path/method/summary 编辑 → 节点标签实时更新 |
| E1-U5 | API 章节持久化 | ✅ | E1-U2 | DDSCanvasStore 支持 api chapter，刷新数据保留 |

### E1-U1: APIEndpointCard 类型定义

**文件**: `src/types/dds/api-endpoint.ts` (新建)

**实现步骤**:
1. 创建 `APIEndpointCard` 接口（extends BaseCard）
2. 定义 `HTTPMethod` 类型别名
3. 定义 `APIParameter` 和 `APIResponse` 接口
4. 在 `src/types/dds/index.ts` 中导出

**风险**: 无

**验收**:
- AC1: `expect(typeof apiCard.method).toBe('string')` 且为 HTTP 方法
- AC2: path 为必填字段
- AC3: 与 OpenAPIGenerator.EndpointDefinition 接口对齐

---

### E1-U2: APIEndpointCard 组件

**文件**: `src/components/dds/cards/APIEndpointCard.tsx` (新建)
**样式**: `src/components/dds/cards/APIEndpointCard.module.css` (新建)

**实现步骤**:
1. 创建自定义 React Flow 节点组件
2. 顶部 method badge（颜色: `var(--color-method-get/post/put/delete/patch)`)
3. 中部 path 文案
4. 底部 summary 摘要（超长截断）
5. 节点宽度固定 180px
6. 选中时蓝色边框
7. 在 `CardRenderer.tsx` 中注册节点类型

**风险**: 无

**验收**:
- AC1: GET 节点显示绿色 badge "GET"
- AC2: path `/api/users` 正确显示
- AC3: 选中节点有蓝色边框
- AC4: `expect(screen.getByTestId('method-badge-GET')).toHaveStyle({ backgroundColor: expect.stringContaining('green') })`

---

### E1-U3: DDSPanel API 组件面板

**文件**: `src/components/dds/canvas/DDSPanel.tsx` (扩展)

**实现步骤**:
1. DDSPanel 根据 `activeChapter` 切换显示内容
2. API 章节：显示 5 个 HTTP 方法端点卡片
3. 每个卡片可拖拽（dataTransfer 传递 componentType JSON）
4. 复用 Sprint2 ComponentPanel 的拖拽模式

**风险**: 低 — 复用已有拖拽实现

**验收**:
- AC1: `expect(screen.getAllByRole('listitem')).toHaveLength(5)`
- AC2: GET/POST/PUT/DELETE/PATCH 五种方法全部显示
- AC3: 拖拽时卡片半透明

---

### E1-U4: API 属性面板

**文件**: `src/components/dds/canvas/DDSPanel.tsx` (扩展右侧面板)

**实现步骤**:
1. 双击 APIEndpointCard → `selectedCardIds` 更新
2. DDSPanel 右侧显示 API 属性表单
3. path input（必填，路径格式校验）
4. method select（GET/POST/PUT/DELETE/PATCH）
5. summary textarea
6. 保存 → `updateCard(id, data)`
7. 无选中节点时显示引导文案

**风险**: 无

**验收**:
- AC1: 修改 path → 节点标签立即更新
- AC2: method select 切换 → badge 颜色变化
- AC3: 无选中节点时显示引导文案

---

### E1-U5: API 章节持久化

**文件**: `src/stores/dds/DDSCanvasStore.ts` (扩展)

**实现步骤**:
1. 在 `initialChapters` 中添加 `api: createInitialChapterData('api')`
2. 在 `types/dds/index.ts` 中扩展 `ChapterType` union
3. 在 `types/dds/index.ts` 中扩展 `CardType` union
4. 确认 localStorage 持久化正常

**风险**: 无

**验收**:
- AC1: `expect(Object.keys(useDDSCanvasStore.getState().chapters)).toContain('api')`
- AC2: 添加端点后刷新页面数据保留

---

## E2: 业务规则章节

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | StateMachineCard 类型定义 | ✅ | — | `types/dds/state-machine.ts` 包含完整定义 |
| E2-U2 | StateMachineCard 组件 | ✅ | E2-U1 | 节点显示状态图标 + stateId，选中高亮 |
| E2-U3 | SM 组件面板 | ⬜ | E2-U2 | 3 种组件（state/transition/choice）可拖拽 |
| E2-U4 | 状态属性面板 | ⬜ | E2-U2 | stateId/stateType/events 编辑 → 节点实时更新 |
| E2-U5 | 业务规则章节持久化 | ⬜ | E2-U2 | DDSCanvasStore 支持 businessRules chapter |

### E2-U1: StateMachineCard 类型定义

**文件**: `src/types/dds/state-machine.ts` (新建)

**实现步骤**:
1. 创建 `StateMachineCard` 接口（extends BaseCard）
2. 定义 `StateMachineStateType` union
3. 定义 `StateTransition` 接口
4. 定义 `SMExporterEdge` 和 `StateMachineJSON` 接口
5. 在 `src/types/dds/index.ts` 中导出

**风险**: 无

**验收**:
- AC1: `expect(['initial', 'final', 'normal', 'choice', 'join', 'fork']).toContain(stateMachineCard.stateType)`
- AC2: stateId 为必填字段
- AC3: StateMachineJSON 可被 JSON.stringify 序列化

---

### E2-U2: StateMachineCard 组件

**文件**: `src/components/dds/cards/StateMachineCard.tsx` (新建)
**样式**: `src/components/dds/cards/StateMachineCard.module.css` (新建)

**实现步骤**:
1. 创建自定义 React Flow 节点
2. 顶部：状态类型图标（6 种）
   - initial: 实心圆点（绿色）
   - final: 双圆（灰色）
   - normal: 直角矩形（蓝色）
   - choice: 菱形（黄色）
   - join: 倒三角（紫色）
   - fork: 正三角（橙色）
3. 底部：stateId 文案
4. 节点宽度固定 140px，高度 60px
5. 选中时蓝色边框
6. 在 `CardRenderer.tsx` 中注册节点类型

**风险**: 无

**验收**:
- AC1: `expect(screen.getByTestId('state-icon-initial')).toBeInTheDocument()`
- AC2: stateId "Idle" 正确显示
- AC3: 选中节点有蓝色边框

---

### E2-U3: SM 组件面板

**文件**: `src/components/dds/canvas/DDSPanel.tsx` (扩展)

**实现步骤**:
1. DDSPanel businessRules 章节：显示 3 种组件卡片
2. State（方块图标）/ Transition（箭头图标）/ Choice（菱形图标）
3. 每个卡片可拖拽

**风险**: 无

**验收**:
- AC1: `expect(screen.getAllByRole('listitem')).toHaveLength(3)`
- AC2: State/Transition/Choice 三种组件全部显示

---

### E2-U4: 状态属性面板

**文件**: `src/components/dds/canvas/DDSPanel.tsx` (扩展右侧面板)

**实现步骤**:
1. 双击 StateMachineCard → 右侧显示状态属性表单
2. stateId input（必填，重复校验）
3. stateType select（initial/final/normal/choice/join/fork）
4. events list（字符串数组，添加/删除）
5. transitions 简要列表（只读）

**风险**: 低

**验收**:
- AC1: 修改 stateId → 节点标签立即更新
- AC2: stateType 下拉有 6 种选项
- AC3: stateId 重复时显示错误提示

---

### E2-U5: 业务规则章节持久化

**文件**: `src/stores/dds/DDSCanvasStore.ts` (扩展)

**实现步骤**:
1. 在 `initialChapters` 中添加 `businessRules: createInitialChapterData('businessRules')`
2. 确认类型扩展正确

**风险**: 无

**验收**:
- AC1: `expect(Object.keys(useDDSCanvasStore.getState().chapters)).toContain('businessRules')`
- AC2: 刷新数据保留

---

## E3: 跨章节集成

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | DDSToolbar 扩展 | ⬜ | E1-U5, E2-U5 | 5 章节按钮，点击切换 activeChapter |
| E3-U2 | CrossChapterEdgesOverlay 扩展 | ⬜ | E3-U1 | API ↔ Requirement、SM ↔ Context 跨章节边渲染 |

### E3-U1: DDSToolbar 扩展

**文件**: `src/components/dds/toolbar/DDSToolbar.tsx` (扩展)

**实现步骤**:
1. 扩展 `CHAPTER_LABELS`：`{ api: 'API', businessRules: '业务规则' }`
2. 5 个章节按钮横向排列
3. 当前章节按钮高亮（primary 背景色）
4. 点击 → `setActiveChapter(chapter)`
5. 支持 URL query 参数（`?chapter=api`）

**风险**: 低 — 复用现有章节切换实现

**验收**:
- AC1: `expect(screen.getAllByRole('button')).toHaveLength(5)`
- AC2: 点击 API 按钮 → `activeChapter === 'api'`
- AC3: 当前章节按钮高亮可见

---

### E3-U2: CrossChapterEdgesOverlay 扩展

**文件**: `src/components/dds/canvas/CrossChapterEdgesOverlay.tsx` (扩展)

**实现步骤**:
1. 扩展 `CHAPTER_ORDER` 和 `CHAPTER_OFFSETS` 支持 5 栏
2. 跨章节边从 api → requirement 和 businessRules → context
3. 边样式：虚线 + 紫色（`var(--color-cross-chapter-edge)`）
4. 降级处理：目标章节不可见时显示为灰色虚线

**风险**: 中 — 章节宽度计算需验证

**验收**:
- AC1: APIEndpointCard → UserStoryCard 跨章节边正确渲染
- AC2: StateMachineCard → BoundedContextCard 跨章节边正确渲染
- AC3: 边为虚线样式

---

## E4: 导出功能

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| ~~E4-U1~~ | APICanvasExporter | ⬜ | E1-U1 | `exportToOpenAPI(cards)` 返回 OpenAPISpec |
| ~~E4-U2~~ | SMExporter | ⬜ | E2-U1 | `exportToStateMachine(nodes, edges)` 返回 StateMachineJSON |
| ~~E4-U3~~ | OpenAPI Export Modal | ⬜ | ~~E4-U1~~ | Modal 显示 JSON 预览 + 复制/下载 |
| ~~E4-U4~~ | StateMachine Export Modal | ⬜ | ~~E4-U2~~ | Modal 显示 JSON 预览 + 复制/下载 |
| ~~E4-U5~~ | Export 测试覆盖 | ⬜ | E4-U1, E4-U2 | 10 个测试用例（5 个 OpenAPI + 5 个 SM） |

### E4-U1: APICanvasExporter

**文件**: `src/lib/contract/APICanvasExporter.ts` (新建)
**测试**: `src/lib/contract/__tests__/APICanvasExporter.test.ts` (新建)

**实现步骤**:
1. 创建 `exportToOpenAPI(cards)` 函数
2. 将 APIEndpointCard[] 映射为 EndpointDefinition[]
3. 调用 `OpenAPIGenerator.addEndpoints()` → `generate()`
4. 创建 `exportToOpenAPIJSON()` 返回字符串
5. 编写 5 个测试用例（E4-U1.1 ~ E4-U1.5）

**风险**: 无

**验收**:
- AC1: `expect(spec.openapi).toBe('3.0.3')`
- AC2: `expect(spec.paths['/api/users'].get.summary).toBe('List users')`
- AC3: 空数组导出空 paths

---

### E4-U2: SMExporter

**文件**: `src/lib/stateMachine/SMExporter.ts` (新建)
**测试**: `src/lib/stateMachine/__tests__/SMExporter.test.ts` (新建)

**实现步骤**:
1. 创建 `exportToStateMachine(nodes, edges)` 函数
2. 找到 initial 节点 → initial 字段
3. 其余节点按 stateId 分组 → states 对象
4. 每条边 → states[sourceId].on[eventName]
5. 创建 `exportToStateMachineJSON()` 返回字符串
6. 编写 5 个测试用例（E4-U2.1 ~ E4-U2.5）

**风险**: 无

**验收**:
- AC1: `expect(sm.initial).toBe('Idle')`
- AC2: `expect(sm.states['Idle'].on['START'].target).toBe('Active')`
- AC3: guard 条件正确包含

---

### E4-U3: OpenAPI Export Modal

**文件**: `src/components/dds/canvas/DDSPanel.tsx` 或新建 Export Modal

**实现步骤**:
1. 点击导出按钮 → Modal 弹出
2. 调用 `exportToOpenAPIJSON(chapters.api.cards)`
3. JSON 预览区（语法高亮）
4. "复制到剪贴板" + "下载 JSON" 按钮
5. 空数据时显示 `{}`

**风险**: 无

**验收**:
- AC1: JSON 预览区显示有效 OpenAPI 3.0 JSON
- AC2: 复制成功显示 "已复制 ✓"（2秒后恢复）
- AC3: 下载生成 `openapi.json` 文件

---

### E4-U4: StateMachine Export Modal

**文件**: 同 E4-U3

**实现步骤**:
1. 点击导出按钮 → Modal 弹出
2. 调用 `exportToStateMachineJSON(cards, edges)`
3. JSON 预览区（语法高亮）
4. "复制到剪贴板" + "下载 JSON" 按钮

**风险**: 无

**验收**:
- AC1: JSON 预览区显示有效 StateMachine JSON
- AC2: 下载生成 `statemachine.json` 文件

---

### E4-U5: Export 测试覆盖

**测试文件**: 见 E4-U1 和 E4-U2

**E4-U5.1**: exportToOpenAPI — openapi 版本
**E4-U5.2**: exportToOpenAPI — GET/POST/PUT/DELETE/PATCH 全部映射
**E4-U5.3**: exportToOpenAPI — 空数组
**E4-U5.4**: exportToOpenAPI — 异常输入不崩溃
**E4-U5.5**: exportToStateMachine — initial 节点
**E4-U5.6**: exportToStateMachine — 转移映射
**E4-U5.7**: exportToStateMachine — guard 条件
**E4-U5.8**: exportToStateMachine — 无 initial
**E4-U5.9**: exportToStateMachine — 空数组
**E4-U5.10**: exportToStateMachine — 多事件同一转移

**风险**: 无

**验收**: 全部 10 个测试用例通过

---

## E5: 章节四态规范

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | API 章节四态 | ✅ | E1-U2 | 骨架屏/空状态/加载态/错误态规范 |
| E5-U2 | SM 章节四态 | ✅ | E2-U2 | 骨架屏/空状态/加载态/错误态规范 |

### E5-U1: API 章节四态

**文件**: `src/components/dds/cards/__tests__/APIEndpointCard.test.tsx` 等

**实现步骤**:
1. 确认 API 章节空状态（无端点时引导文案）
2. 确认骨架屏组件（Loading）
3. 确认错误态（渲染失败时灰色占位框 + 文案）
4. 四态均不使用转圈（统一骨架屏）

**风险**: 无

**验收**:
- AC1: 无端点时显示引导文案（不为空白）
- AC2: 骨架屏使用 `var(--color-skeleton)` token
- AC3: 错误态文案包含 "API 端点渲染失败"

---

### E5-U2: SM 章节四态

**文件**: `src/components/dds/cards/__tests__/StateMachineCard.test.tsx` 等

**实现步骤**:
1. 确认业务规则章节空状态（无状态时引导文案）
2. 确认骨架屏组件
3. 确认错误态（渲染失败时占位框 + 文案）

**风险**: 无

**验收**:
- AC1: 无状态节点时显示引导文案
- AC2: 骨架屏使用 `var(--color-skeleton)` token
- AC3: 错误态文案包含 "状态节点渲染失败"

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint4-spec-canvas-extend
- **执行日期**: 2026-04-18
