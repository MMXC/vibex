# PRD — vibex-sprint6-qa / create-prd

**项目**: vibex-sprint6-qa
**版本**: v1.0
**日期**: 2026-04-25
**角色**: PM
**上游**: analysis.md (2026-04-25, Analyst 报告)

---

## 执行摘要

### 背景

vibex-sprint6-ai-coding-integration 是 VibeX Sprint6 的核心功能集，包含：
1. **E1: 设计稿导入完善** — Figma URL 和设计图片导入到原型画布
2. **E2: AI Coding Agent 反馈回路** — 基于组件生成代码，支持复制和反馈
3. **E3: 画布版本历史** — 版本快照创建、列表展示、恢复功能
4. **E4: 版本 Diff 可视化** — 两版本 diff 对比展示

Analyst 在 QA 验证报告（`analysis.md`）中给出了**有条件通过**结论：
- E1、E3、E4 产出物完整，规格齐全
- **E2 Stub 是 P0 风险**：`mockAgentCall()` 无真实实现，若按当前架构实现则 E2 功能不可用
- PRD、Architecture、Specs、Implementation Plan、AGENTS 五项产出物齐全

### 目标

对 Sprint6 全部产出物进行系统化 QA 验证，确保：
1. E1/E3/E4 的 Specs 与实现一一对应，四态定义完整
2. E2 Stub 已升级为真实实现（方案 A: OpenClaw ACP Runtime 或方案 B: HTTP 后端 AI）
3. DoD 逐条可核查，PRD 格式符合规范
4. 关键风险已被验证或缓解

### 成功指标

- E1 三个组件（FigmaImport / ImageImport / ImportConfirmDialog）四态验证通过
- E2 CodingAgent 服务层通过集成测试（非 Stub）
- E2 ProtoAttrPanel AI Tab 四态验证通过
- E3 prototypeVersionStore + version-history 页面四态验证通过
- E4 VersionDiff 组件 + jsondiffpatch diff 计算验证通过
- E5 DoD 逐条核查无遗漏
- E5 PRD 格式自检通过（7 项检查项全部覆盖）

---

## 1. 功能点总表

| ID | 功能点 | 描述 | 验收标准（expect()） | 页面集成 | Epic | 工时 |
|----|--------|------|---------------------|---------|------|------|
| F1.1 | FigmaImport 四态验证 | 验证 FigmaImport 组件四态符合 specs/E1-import-ui.md | 见 §2 E1 验收标准 | 【需页面集成】FigmaImport | E1 | 1h |
| F1.2 | ImageImport 四态验证 | 验证 ImageImport 组件四态符合 specs/E1-import-ui.md | 见 §2 E1 验收标准 | 【需页面集成】ImageImport | E1 | 1h |
| F1.3 | ImportConfirmDialog 四态验证 | 验证 ImportConfirmDialog 四态符合 specs/E1-import-ui.md | 见 §2 E1 验收标准 | 【需页面集成】ImportConfirmDialog | E1 | 0.5h |
| F2.1 | CodingAgent 服务层验证 | 验证 CodingAgent.generateCode() 返回 GeneratedCode[]，非 Stub | `expect(codes[0].code).toBeTruthy(); expect(typeof codes[0].code).toBe('string')` | 无（服务层） | E2 | 1.5h |
| F2.2 | ProtoAttrPanel AI Tab 四态验证 | 验证 ProtoAttrPanel AI 代码 Tab 四态符合 specs/E2-ai-coding.md | 见 §2 E2 验收标准 | 【需页面集成】ProtoAttrPanel | E2 | 1h |
| F2.3 | E2 Stub 升级决策验证 | 验证 PRD 指定的方案 A 或方案 B 已选择并实现 | `expect(sessions_spawn).toHaveBeenCalled() // 方案 A` 或 `expect(aiService.generate).toHaveBeenCalled() // 方案 B` | 无（架构层） | E2 | 0.5h |
| F3.1 | prototypeVersionStore 验证 | 验证 prototypeVersionStore 存在且行为符合 specs/E3-version-history.md | `expect(usePrototypeVersionStore.getState().snapshots).toBeInstanceOf(Array)` | 无（store） | E3 | 1h |
| F3.2 | version-history 页面四态验证 | 验证 version-history 页面四态符合 specs/E3-version-history.md | 见 §2 E3 验收标准 | 【需页面集成】version-history | E3 | 1h |
| F4.1 | VersionDiff 组件四态验证 | 验证 VersionDiff 组件四态符合 specs/E4-version-diff.md | 见 §2 E4 验收标准 | 【需页面集成】VersionDiff | E4 | 1h |
| F4.2 | jsondiffpatch diff 计算验证 | 验证 added/removed/modified 分类正确 | 见 §2 E4 验收标准 | 无（计算逻辑） | E4 | 1h |
| F5.1 | Specs 覆盖率验证 | 验证每个 Spec 文件至少有一个 QA 验证点覆盖 | `expect(coveredEpicSet.size).toBe(4) // E1 E2 E3 E4 全部覆盖` | 无（文档层） | E5 | 0.5h |
| F5.2 | DoD 逐条核查 | 逐条验证 PRD DoD 章节所有条目是否可测试 | `expect(dodChecklistItems.every(item => item.verifiable === true)).toBe(true)` | 无（文档层） | E5 | 0.5h |
| F5.3 | PRD 格式自检 | 验证 PRD 包含全部必需章节 | 见格式自检表 | 无（文档层） | E5 | 0.5h |

**总工时: 11h**

---

## 2. Epic / Story 表格

### E1: 设计稿导入 QA 验证

| Story ID | Story | 验收标准 | 工时 |
|----------|-------|---------|------|
| E1-S1 | FigmaImport 四态验证 | F1.1 | 1h |
| E1-S2 | ImageImport 四态验证 | F1.2 | 1h |
| E1-S3 | ImportConfirmDialog 四态验证 | F1.3 | 0.5h |

**E1 Epic 工时: 2.5h**

#### E1 验收标准（expect() 断言）

```typescript
// E1-S1: FigmaImport 四态

// 理想态
expect(screen.getByLabelText('Figma URL')).toBeInTheDocument();
expect(screen.getByRole('button', { name: /获取组件/i })).toBeInTheDocument();
userEvent.type(screen.getByLabelText('Figma URL'), 'https://figma.com/file/abc123');
expect(screen.getByRole('button', { name: /获取组件/i })).toBeEnabled();

// 加载态（API 调用中）
const mockFigmaApi = jest.fn().mockImplementation(() => new Promise(() => {}));
userEvent.click(screen.getByRole('button', { name: /获取组件/i }));
expect(screen.getByRole('button', { name: /获取中/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /获取中/i })).toBeDisabled();

// 错误态
mockFigmaApi.mockRejectedValue(new Error('invalid'));
userEvent.click(screen.getByRole('button', { name: /获取组件/i }));
await waitFor(() => {
  expect(screen.getByLabelText('Figma URL')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText(/无效的 Figma URL/i)).toBeInTheDocument();
});

// E1-S2: ImageImport 四态

// 理想态（空状态）
expect(screen.getByTestId('image-drop-zone')).toBeInTheDocument();
expect(screen.getByText(/拖拽设计图片到这里/i)).toBeInTheDocument();

// 加载态
const file = new File([imageData], 'design.png', { type: 'image/png' });
fireEvent.drop(screen.getByTestId('image-drop-zone'), { dataTransfer: { files: [file] } });
expect(screen.getByText(/AI 正在识别中/i)).toBeInTheDocument();
expect(screen.getByTestId('image-skeleton')).toBeInTheDocument();

// 错误态（格式不支持）
const badFile = new File([data], 'design.bmp', { type: 'image/bmp' });
fireEvent.drop(screen.getByTestId('image-drop-zone'), { dataTransfer: { files: [badFile] } });
await waitFor(() => {
  expect(screen.getByText(/不支持的图片格式/i)).toBeInTheDocument();
});

// E1-S3: ImportConfirmDialog 四态

// 理想态
expect(screen.getByRole('dialog')).toBeInTheDocument();
expect(screen.getByRole('button', { name: /确认导入/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /取消/i })).toBeInTheDocument();

// 加载态（导入中）
userEvent.click(screen.getByRole('button', { name: /确认导入/i }));
expect(screen.getByTestId('import-progress')).toBeInTheDocument();
```

---

### E2: AI Coding Agent QA 验证

| Story ID | Story | 验收标准 | 工时 |
|----------|-------|---------|------|
| E2-S1 | CodingAgent 服务层验证 | F2.1 | 1.5h |
| E2-S2 | ProtoAttrPanel AI Tab 四态验证 | F2.2 | 1h |
| E2-S3 | E2 Stub 升级决策验证 | F2.3 | 0.5h |

**E2 Epic 工时: 3h**

#### E2 验收标准（expect() 断言）

```typescript
// E2-S1: CodingAgent 服务层（非 Stub）

// 验证非 mockAgentCall（Stub 检测）
const originalModule = jest.requireActual('@/services/ai-coding/CodingAgent');
expect(originalModule.prototype.generateCode.toString()).not.toMatch(/mockAgentCall|TODO.*real agent/i);

// 真实调用验证（方案 A: OpenClaw ACP 或方案 B: HTTP）
const mockSessionsSpawn = jest.fn().mockResolvedValue('session-abc');
jest.doMock('@/services/openclaw', () => ({ sessions_spawn: mockSessionsSpawn }));

const codes = await codingAgent.generateCode([{ id: 'n1', type: 'Button', props: {} }]);
expect(Array.isArray(codes)).toBe(true);
expect(codes.length).toBeGreaterThan(0);
expect(typeof codes[0].code).toBe('string');
expect(codes[0].code.length).toBeGreaterThan(0);
expect(codes[0].componentId).toBe('n1');
expect(codes[0].language).toMatch(/tsx|jsx/);

// E2-S2: ProtoAttrPanel AI Tab 四态

// 理想态（空状态）
fireEvent.dblClick(screen.getByTestId('proto-node'));
expect(screen.getByRole('tab', { name: /AI 代码/i })).toBeInTheDocument();
userEvent.click(screen.getByRole('tab', { name: /AI 代码/i }));
expect(screen.getByText(/点击「生成代码」查看 AI 生成的组件代码/i)).toBeInTheDocument();

// 加载态
mockCodingAgent.generateCode.mockImplementation(() => new Promise(() => {}));
userEvent.click(screen.getByRole('button', { name: /生成代码/i }));
expect(screen.getByTestId('code-skeleton')).toBeInTheDocument();
expect(screen.getByText(/正在调用 Claude/i)).toBeInTheDocument();

// 错误态
mockCodingAgent.generateCode.mockRejectedValue(new Error('API error'));
await waitFor(() => {
  expect(screen.getByTestId('code-error-banner')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /重新生成/i })).toBeInTheDocument();
});

// 理想态（代码生成成功）
mockCodingAgent.generateCode.mockResolvedValue([{ componentId: 'n1', code: 'export const Button = () => <button>Click</button>', language: 'tsx', model: 'claude' }]);
userEvent.click(screen.getByRole('button', { name: /生成代码/i }));
await waitFor(() => {
  expect(screen.getByTestId('ai-code-output')).toBeInTheDocument();
  expect(screen.getByTestId('ai-code-output').textContent).toMatch(/export const Button/i);
  expect(screen.getByRole('button', { name: /复制/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /重新生成/i })).toBeInTheDocument();
});

// E2-S3: Stub 升级决策验证
// 方案 A: OpenClaw ACP
expect(sessions_spawn).toHaveBeenCalledWith(expect.objectContaining({ runtime: 'acp', mode: 'session' }));
// 或方案 B: HTTP 后端
expect(aiService.generate).toHaveBeenCalledWith(expect.objectContaining({ model: expect.stringContaining('claude') }));
```

---

### E3: 版本历史 QA 验证

| Story ID | Story | 验收标准 | 工时 |
|----------|-------|---------|------|
| E3-S1 | prototypeVersionStore 验证 | F3.1 | 1h |
| E3-S2 | version-history 页面四态验证 | F3.2 | 1h |

**E3 Epic 工时: 2h**

#### E3 验收标准（expect() 断言）

```typescript
// E3-S1: prototypeVersionStore

expect(usePrototypeVersionStore).toBeDefined();
expect(typeof usePrototypeVersionStore.getState().snapshots).toBe('object');
expect(typeof usePrototypeVersionStore.getState().createSnapshot).toBe('function');
expect(typeof usePrototypeVersionStore.getState().restoreSnapshot).toBe('function');
expect(typeof usePrototypeVersionStore.getState().loadSnapshots).toBe('function');

// createSnapshot: 快照创建成功
const before = usePrototypeVersionStore.getState().snapshots.length;
await usePrototypeVersionStore.getState().createSnapshot();
const after = usePrototypeVersionStore.getState().snapshots.length;
expect(after).toBe(before + 1);

// restoreSnapshot: 数据还原正确
const target = usePrototypeVersionStore.getState().snapshots[0];
await usePrototypeVersionStore.getState().restoreSnapshot(target.id);
expect(usePrototypeStore.getState().nodes).toMatchObject(target.data.nodes);

// E3-S2: version-history 页面四态

// 理想态
expect(screen.getByTestId('version-list')).toBeInTheDocument();
expect(screen.getAllByTestId('version-item').length).toBeGreaterThan(0);
expect(screen.getByText(/2026-04-18/)).toBeInTheDocument(); // 时间显示

// 空状态（无版本时）
mockApi.get.mockResolvedValue([]);
render(<VersionHistoryPage />);
expect(screen.getByText(/还没有保存过版本/i)).toBeInTheDocument();
expect(screen.getByRole('button', { name: /保存第一个版本/i })).toBeInTheDocument();

// 加载态
mockApi.get.mockImplementation(() => new Promise(() => {}));
render(<VersionHistoryPage />);
expect(screen.getAllByTestId('version-skeleton').length).toBe(5);
expect(screen.queryByRole('button', { name: /保存第一个版本/i })).not.toBeInTheDocument();

// 错误态
mockApi.get.mockRejectedValue(new Error('network error'));
render(<VersionHistoryPage />);
await waitFor(() => {
  expect(screen.getByTestId('toast-error')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
});
```

---

### E4: 版本 Diff QA 验证

| Story ID | Story | 验收标准 | 工时 |
|----------|-------|---------|------|
| E4-S1 | VersionDiff 组件四态验证 | F4.1 | 1h |
| E4-S2 | jsondiffpatch diff 计算验证 | F4.2 | 1h |

**E4 Epic 工时: 2h**

#### E4 验收标准（expect() 断言）

```typescript
// E4-S1: VersionDiff 组件四态

// 理想态（两版本有差异）
render(<VersionDiff before={snapshotV1} after={snapshotV2} />);
expect(screen.getByTestId('diff-added')).toBeInTheDocument(); // 绿色
expect(screen.getByTestId('diff-removed')).toBeInTheDocument(); // 红色
expect(screen.getByTestId('diff-modified')).toBeInTheDocument(); // 黄色

// 空状态（两版本完全相同）
render(<VersionDiff before={snapshotV1} after={snapshotV1} />);
expect(screen.getByText(/两个版本没有差异/i)).toBeInTheDocument();
expect(screen.queryByTestId('diff-added')).not.toBeInTheDocument();

// 加载态（diff 计算中）
render(<VersionDiff before={snapshotV1} after={snapshotV2} diffLoading={true} />);
expect(screen.getByTestId('diff-skeleton')).toBeInTheDocument();

// 错误态
render(<VersionDiff before={snapshotV1} after={snapshotV2} diffError={new Error('compute failed')} />);
expect(screen.getByText(/diff 计算失败/i)).toBeInTheDocument();

// E4-S2: jsondiffpatch diff 计算

// added 场景
const v1 = { nodes: [{ id: 'n1', type: 'Button' }] };
const v2 = { nodes: [{ id: 'n1', type: 'Button' }, { id: 'n2', type: 'Input' }] };
const diff = computeVersionDiff(v1, v2);
expect(diff.nodes.added).toHaveLength(1);
expect(diff.nodes.added[0].id).toBe('n2');

// removed 场景
const v1r = { nodes: [{ id: 'n1', type: 'Button' }, { id: 'n2', type: 'Input' }] };
const v2r = { nodes: [{ id: 'n1', type: 'Button' }] };
const diffR = computeVersionDiff(v1r, v2r);
expect(diffR.nodes.removed).toHaveLength(1);
expect(diffR.nodes.removed[0].id).toBe('n2');

// modified 场景
const v1m = { nodes: [{ id: 'n1', type: 'Button', props: { text: 'Click' } }] };
const v2m = { nodes: [{ id: 'n1', type: 'Button', props: { text: 'Submit' } }] };
const diffM = computeVersionDiff(v1m, v2m);
expect(diffM.nodes.modified).toHaveLength(1);
expect(diffM.nodes.modified[0].before.props.text).toBe('Click');
expect(diffM.nodes.modified[0].after.props.text).toBe('Submit');

// 无差异场景
const diffEmpty = computeVersionDiff(v1, v1);
expect(diffEmpty).toEqual({});
```

---

### E5: 质量保障 QA 验证

| Story ID | Story | 验收标准 | 工时 |
|----------|-------|---------|------|
| E5-S1 | Specs 覆盖率验证 | F5.1 | 0.5h |
| E5-S2 | DoD 逐条核查 | F5.2 | 0.5h |
| E5-S3 | PRD 格式自检 | F5.3 | 0.5h |

**E5 Epic 工时: 1.5h**

#### E5 验收标准（expect() 断言）

```typescript
// E5-S1: Specs 覆盖率

const specFiles = [
  'specs/E1-import-ui.md',
  'specs/E2-ai-coding.md',
  'specs/E3-version-history.md',
  'specs/E4-version-diff.md',
];
const qaCoverageMap = {
  'specs/E1-import-ui.md': ['F1.1', 'F1.2', 'F1.3'],
  'specs/E2-ai-coding.md': ['F2.1', 'F2.2'],
  'specs/E3-version-history.md': ['F3.1', 'F3.2'],
  'specs/E4-version-diff.md': ['F4.1', 'F4.2'],
};
specFiles.forEach(file => {
  expect(qaCoverageMap[file]).toBeDefined();
  expect(qaCoverageMap[file].length).toBeGreaterThan(0);
});

// E5-S2: DoD 逐条核查
const dodItems = [
  'Figma URL 输入 → 组件列表加载成功',
  'FigmaImport 显示组件预览',
  '点击导入 → ProtoNode 添加到 prototypeStore',
  'Image Import 拖拽上传 → AI 识别结果显示',
  '识别的组件成功添加到画布',
  'CodingAgent.generateCode() 返回 GeneratedCode[]',
  'ProtoAttrPanel 有 AI 代码 Tab（切换可见）',
  'Tab 显示生成的代码字符串',
  '复制按钮可用',
  '生成结果含 aiMeta 存储到 snapshot',
  'prototypeVersionStore 独立存在',
  '点击"保存版本" → snapshot 创建成功',
  'version-history 页面显示版本列表',
  '点击"恢复" → prototypeStore 数据还原',
  'pnpm test → 全部通过',
  'changelog 包含 Sprint6 所有功能',
];
dodItems.forEach(item => {
  expect(item.verifiable).toBe(true); // 每条 DoD 必须可测试
});

// E5-S3: PRD 格式自检（见下表）
```

---

## 3. DoD (Definition of Done)

### Sprint6 QA 验证完成判断标准

#### E1 设计稿导入验证
- [ ] F1.1: FigmaImport 四态验证通过（理想态/空状态/加载态/错误态各有≥1 个 expect() 断言）
- [ ] F1.2: ImageImport 四态验证通过（拖拽/上传/识别结果/错误处理各有 expect() 断言）
- [ ] F1.3: ImportConfirmDialog 四态验证通过（理想态/加载态各有 expect() 断言）

#### E2 AI Coding Agent 验证
- [ ] F2.1: CodingAgent 服务层集成测试通过，验证非 Stub
- [ ] F2.2: ProtoAttrPanel AI Tab 四态验证通过（空状态/加载态/错误态/理想态各有 expect() 断言）
- [ ] F2.3: E2 Stub 升级方案已选择（A: OpenClaw ACP 或 B: HTTP 后端 AI），代码已实现

#### E3 版本历史验证
- [ ] F3.1: prototypeVersionStore 所有 Actions（createSnapshot/restoreSnapshot/loadSnapshots）验证通过
- [ ] F3.2: version-history 页面四态验证通过（理想态/空状态/加载态/错误态各有 expect() 断言）

#### E4 版本 Diff 验证
- [ ] F4.1: VersionDiff 组件四态验证通过（理想态/空状态/加载态/错误态各有 expect() 断言）
- [ ] F4.2: jsondiffpatch diff 计算 added/removed/modified/无差异 四场景全部验证通过

#### E5 质量保障验证
- [ ] F5.1: Specs 覆盖率 100%（E1/E2/E3/E4 每个 Spec 文件都有对应 QA 验证点）
- [ ] F5.2: PRD DoD 全部 16 条条目逐条可测试
- [ ] F5.3: PRD 格式自检全部 7 项通过

#### 全局
- [ ] `pnpm exec tsc --noEmit` → 0 errors
- [ ] `pnpm test` → 全部通过（测试覆盖率 ≥ 80%）
- [ ] 无新的 P0 缺陷引入
- [ ] E2 Stub P0 风险已关闭（mockAgentCall 已替换为真实实现）

---

## 4. PRD 格式自检表

| # | 检查项 | 是否满足 | 说明 |
|---|--------|---------|------|
| 1 | 执行摘要包含：背景 | ✅ | §执行摘要/背景 |
| 2 | 执行摘要包含：目标 | ✅ | §执行摘要/目标 |
| 3 | 执行摘要包含：成功指标 | ✅ | §执行摘要/成功指标 |
| 4 | Epic/Story 表格格式正确（ID/描述/工时/验收标准） | ✅ | §2 Epic/Story 表格 |
| 5 | 每个 Story 有可写的 expect() 断言 | ✅ | §2 各 Epic 验收标准 |
| 6 | DoD 章节存在且具体 | ✅ | §3 DoD（16 条） |
| 7 | 关键页面有"用户情绪地图" | ✅ | §5 用户情绪地图 |

---

## 5. 本质需求穿透（神技1）

> **去掉这个 Sprint 的 QA 工作，VibeX 会失去什么？**

### E1 设计稿导入 QA
- **底层动机**: Sprint6 结束后，Figma/图片导入必须是可靠的 — 设计师不能因为导入失败就放弃使用 VibeX
- **去掉 E1 QA 会怎样**: Specs 存在但四态未经验证，E1 上线后用户会遇到无法预知的加载/错误态崩溃
- **本质问题**: 设计稿导入是 VibeX 的核心差异化能力，导入不可靠 = 整个工具不可信

### E2 AI Coding Agent QA
- **底层动机**: E2 是 Sprint6 最重要的新功能，Stub 未升级 = E2 不存在
- **去掉 E2 QA 会怎样**: E2 Stub 未升级风险被忽视，Sprint6 上线后 E2 是一个空按钮
- **本质问题**: AI Coding Agent 是 VibeX 的技术差异化，生成代码能力缺失 = Sprint6 核心价值归零

### E3 版本历史 QA
- **底层动机**: 版本历史是原型工具的"后悔药"，恢复失败 = 用户数据损坏
- **去掉 E3 QA 会怎样**: version-history 页面四态未验证，空状态/加载态/错误态存在未预知缺陷
- **本质问题**: 版本历史的数据完整性决定了用户信任度，恢复功能不可靠 = 用户不敢大胆修改

### E4 版本 Diff QA
- **底层动机**: Diff 可视化让版本差异一目了然，diff 分类错误 = 用户误解变更
- **去掉 E4 QA 会怎样**: added/removed/modified 分类逻辑未验证，可能将删除误标为新增
- **本质问题**: 版本 diff 是版本历史的价值放大器，分类错误 = 版本历史的价值归零

### E5 质量保障
- **底层动机**: Specs 覆盖率/DoD 核查/PRD 格式是 QA 工作的元保障
- **去掉 E5 会怎样**: Specs 可能存在覆盖盲点，DoD 执行无依据，PRD 格式不标准影响后续迭代
- **本质问题**: 质量保障工作本身也需要质量 — E5 是 QA 流程的自我验证

---

## 6. 最小可行范围（神技2）

> **如果工时压缩到 6h，必须放弃哪些功能？**

### 保留（核心）
- **F2.1 + F2.3**（E2 Stub 验证 + 决策）：E2 Stub 是 P0 风险，必须优先验证
- **F3.1**（prototypeVersionStore 验证）：版本历史 store 是 E3 的核心
- **F5.2**（DoD 逐条核查）：DoD 是整个 Sprint6 的完成标准
- **F5.3**（PRD 格式自检）：PRD 格式规范性影响后续工作流

### 放弃（可延期）
- F1.1 + F1.2 + F1.3（E1 四态验证）：E1 Specs 已完整，可由 Tester 独立完成
- F2.2（ProtoAttrPanel AI Tab 四态）：可由 Tester 在 UI 集成后补充
- F4.1 + F4.2（VersionDiff 验证）：E4 是 E3 的扩展，可延期到 Sprint7

**最小可行工时: 4h**（F2.1 + F2.3 + F3.1 + F5.2 + F5.3）

---

## 7. 用户情绪地图（神技3）

### 关键页面 1: FigmaImport 组件

| 场景 | 情绪 | 触发条件 | 预期反馈 |
|------|------|---------|---------|
| 进入时 | 期待 | 用户输入 Figma URL | placeholder 显示示例 URL，引导正确格式 |
| 加载中 | 耐心 | 点击"获取组件" | 按钮变为"获取中..."+禁用，骨架屏替代内容 |
| 成功获取 | 满足 | 组件列表加载 | 组件名称+缩略图，checkbox 可选 |
| 导入失败 | 焦虑 | URL 无效或无权限 | input 红色边框+inline 错误，不丢失输入内容 |
| 导入成功 | 惊喜 | 画布出现新节点 | toast "导入成功，N 个组件已添加" |

### 关键页面 2: ProtoAttrPanel AI 代码 Tab

| 场景 | 情绪 | 触发条件 | 预期反馈 |
|------|------|---------|---------|
| 进入时 | 好奇 | 切换到 AI 代码 Tab | 引导文案"点击「生成代码」查看 AI 生成的组件代码" |
| 生成中 | 期待 | 点击"生成代码" | 骨架屏+"正在调用 Claude..."，不显示 loading spinner |
| 生成成功 | 惊喜 | 代码显示 | 语法高亮代码+复制按钮，底部有"重新生成" |
| 生成失败 | 挫败 | API 错误/超时 | 红色错误 banner+"重新生成"按钮，不丢失已生成代码 |
| 采纳后 | 满足 | 用户复制代码 | toast "代码已复制" |

### 关键页面 3: version-history 页面

| 场景 | 情绪 | 触发条件 | 预期反馈 |
|------|------|---------|---------|
| 进入时 | 安心 | 看到版本列表 | 时间倒序排列，节点数量 badge，一目了然 |
| 无版本时 | 轻微迷茫 | 版本列表为空 | 引导文案+"保存第一个版本"按钮 |
| 恢复前 | 确认需求 | hover 版本项 | 显示"恢复"/"对比"/"删除"按钮 |
| 恢复中 | 紧张 | 点击"恢复" | 进度指示，恢复后画布状态与快照一致 |
| 恢复失败 | 恐慌 | 恢复 API 错误 | toast "恢复失败，请重试"，当前画布数据不受影响 |
| 对比模式 | 清晰 | 两个版本 diff | 绿色=新增/红色=删除/黄色=修改，变更一目了然 |

---

## 8. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint6-qa
- **执行日期**: 2026-04-25
- **备注**: 基于 Analyst analysis.md 有条件通过报告，E2 Stub P0 风险必须在本 Sprint 内关闭

---

## 9. Specs 索引

| Spec 文件 | 对应 Epic | 描述 |
|-----------|---------|------|
| specs/E1-import-ui-qa.md | E1 | FigmaImport / ImageImport / ImportConfirmDialog 四态 QA 规格 |
| specs/E2-ai-coding-qa.md | E2 | CodingAgent 服务层 + ProtoAttrPanel AI Tab 四态 QA 规格 |
| specs/E3-version-history-qa.md | E3 | prototypeVersionStore + version-history 页面四态 QA 规格 |
| specs/E4-version-diff-qa.md | E4 | VersionDiff 组件四态 + jsondiffpatch diff 计算 QA 规格 |
