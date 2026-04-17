# PRD — vibex-sprint6-ai-coding-integration

**项目**: vibex-sprint6-ai-coding-integration
**版本**: v1.0
**日期**: 2026-04-18
**角色**: PM
**上游**: analysis.md (2026-04-18)
**产出**: plan/feature-list.md

---

## 执行摘要

### 背景
Sprint6 是 VibeX 项目的最后一期，包含三组不同性质的功能：
1. **Figma/设计稿导入完善**（Sprint3 E4 的延续）
2. **AI Coding Agent 反馈回路**（全新能力）
3. **画布版本 diff + 对比**（版本历史扩展）

已有大量可复用资产：`llm-provider.ts` (1208行)、`image-import.ts` (111行)、`VersionDiff.tsx` (190行)、`figma-import.ts` (175行)、`prototype-snapshots` API。

### 目标
1. 完成 Figma URL 和设计图片导入到原型画布
2. 建立 AI Coding Agent 反馈回路（生成代码 → 用户反馈 → 重新生成）
3. 支持画布版本历史 + diff 可视化对比
4. Sprint1-6 全量回归测试，确保无破坏性变更

### 成功指标
- Figma URL 或图片导入后 ProtoNode 出现在画布上
- AI Coding Agent 能生成组件代码字符串，用户可复制
- 用户点击"重新生成"后代码更新
- version-history 页面显示 prototype 版本，支持恢复
- 两个版本 diff 正确可视化（红色=删除/绿色=新增）
- 全量回归测试通过

---

## 1. 功能点总表

| ID | 功能点 | 描述 | 验收标准（expect()） | 页面集成 |
|----|--------|------|---------------------|---------|
| F-A.1 | Figma OAuth + API 集成 | 输入 Figma URL → 拉取组件列表 | expect(screen.getByText(/figma/i)).toBeInTheDocument(); userEvent.type(urlInput, 'https://figma.com/file/xxx'); expect(await screen.findByTestId('component-list')).toBeInTheDocument() | 【需页面集成】FigmaImport |
| F-A.2 | FigmaImport UI 完善 | 显示组件预览，点击导入到 prototypeStore | expect(screen.getByTestId('figma-component-preview')).toBeInTheDocument(); userEvent.click(screen.getByRole('button', { name: /导入/i })); expect(usePrototypeStore.getState().nodes.length).toBeGreaterThan(0) | 【需页面集成】FigmaImport |
| F-A.3 | Image Import UI 完善 | 拖拽上传图片，预览 AI 识别结果 | const file = new File(['test'], 'design.png', { type: 'image/png' }); fireEvent.drop(dropZone, { dataTransfer: { files: [file] } }); expect(await screen.findByTestId('ai-recognition-result')).toBeInTheDocument() | 【需页面集成】ImageImport |
| F-A.4 | 导入结果 → prototypeStore | 识别的组件转换为 ProtoNode，添加到画布 | const importedNodes = convertToProtoNodes(recognitionResult); importedNodes.forEach(n => usePrototypeStore.getState().addNode(n)); expect(usePrototypeStore.getState().nodes.length).toBeGreaterThan(0) | 无（数据转换） |
| F-B.1 | CodingAgent 服务层 | Component[] → LLM → GeneratedCode[]（MVP 纯 LLM 输出） | const codes = await codingAgent.generateCode([component]); expect(Array.isArray(codes)).toBe(true); expect(codes.length).toBeGreaterThan(0); expect(codes[0].code).toBeTruthy() | 无（服务层） |
| F-B.2 | ProtoAttrPanel AI 代码 Tab | Tab 显示 AI 生成的代码，可复制 | userEvent.click(screen.getByRole('tab', { name: /ai.*code/i })); expect(screen.getByTestId('ai-code-output')).toBeInTheDocument(); expect(screen.getByRole('button', { name: /复制/i })).toBeInTheDocument() | 【需页面集成】ProtoAttrPanel |
| F-B.3 | 用户反馈回路 | "采纳" / "重新生成" → CodingAgent 重新生成 | expect(screen.getByRole('button', { name: /重新生成/i })).toBeInTheDocument(); userEvent.click(screen.getByRole('button', { name: /重新生成/i })); await waitFor(() => expect(screen.getByTestId('ai-code-output')).toHaveTextContent(/generated/i)) | 【需页面集成】ProtoAttrPanel |
| F-B.4 | AI 生成结果存储 | 存入 prototype-snapshots，带 AI 元数据 | const snapshot = await createSnapshot({ ...exportData, aiMeta: { model, generatedAt } }); expect(snapshot.aiMeta).toBeDefined(); expect(snapshot.aiMeta.model).toBeTruthy() | 无（API 层） |
| F-C.1 | prototypeVersionStore | 版本历史独立 store，与 prototypeStore 解耦 | expect(usePrototypeVersionStore).toBeDefined(); expect(typeof usePrototypeVersionStore.getState().snapshots).toBe('object') | 无（store） |
| F-C.2 | 版本快照创建 API | 点击保存 → POST /api/v1/prototype-snapshots | const snapshot = await createSnapshot(usePrototypeStore.getState().getExportData()); expect(snapshot.id).toBeTruthy(); expect(snapshot.createdAt).toBeTruthy() | 【需页面集成】ProtoEditor |
| F-C.3 | 版本列表 + 恢复 | version-history 页面显示 proto 版本，支持恢复到画布 | expect(screen.getByTestId('version-list')).toBeInTheDocument(); expect(screen.getAllByTestId('version-item').length).toBeGreaterThan(0); userEvent.click(screen.getByRole('button', { name: /恢复/i }).first()); expect(usePrototypeStore.getState().nodes).toMatchObject(expectedNodes) | 【需页面集成】version-history |
| F-C.4 | jsondiffpatch diff 可视化 | 两版本对比，红色=删除/绿色=新增/黄色=修改 | const diff = diffpatcher.diff(oldSnapshot.data, newSnapshot.data); renderDiff(diff); expect(screen.getByTestId('diff-added')).toBeInTheDocument(); expect(screen.getByTestId('diff-removed')).toBeInTheDocument() | 【需页面集成】VersionDiff |
| F-D.1 | Delivery Center 导出 AI 代码 | Delivery 可导出 AI 生成的代码（从 snapshot 读取） | const snapshot = getLatestSnapshotWithAI(); expect(snapshot.aiMeta).toBeDefined(); expect(snapshot.aiMeta.codes).toBeDefined() | 无（数据层） |
| F-D.2 | Sprint1-6 回归测试 | pnpm test 全量通过 | expect(exec('pnpm test').exitCode).toBe(0) | 无（CI） |
| F-D.3 | changelog 更新 | 全项目 changelog 补档 | expect(changelog.sections.length).toBeGreaterThan(0) | 无（文档） |

---

## 2. Epic 拆分

### E1: Figma/设计稿导入完善

**Epic 目标**: 完成设计稿到原型画布的导入流程，支持 Figma URL 和图片文件两种方式。

#### 2a. 本质需求穿透

- **用户的底层动机**: 设计师/PM 已经有了 Figma 设计稿或设计图片，想快速变成可交互的原型
- **去掉导入功能会怎样**: 只能手动画组件，效率低
- **解决的本质问题**: 设计稿和原型之间没有自动化通道

#### 2b. 最小可行范围

- **本期必做**: A1（Figma API 集成）+ A2（FigmaImport UI）+ A3（Image Import UI）+ A4（prototypeStore 接入）
- **本期不做**: Figma Plugin 集成（需额外开发）
- **暂缓**: 从 Sketch/Adobe XD 导入

#### 2c. 用户情绪地图

**关键页面: FigmaImport 组件**
- **进入时**: 期待输入 Figma URL 就能看到组件列表
- **迷路时**: 不知道 Figma URL 格式 → input placeholder 显示示例 URL
- **出错时**: URL 无效 → inline 错误提示"无效的 Figma URL，请检查后重试"

**关键页面: Image Import 区域**
- **进入时**: 想拖图片进来
- **迷路时**: 不知道支持什么格式 → 拖放区域显示"支持 PNG/JPG/SVG，最大 10MB"
- **出错时**: 图片识别失败 → toast "图片无法识别，请上传更清晰的设计图"

#### E1-A1: Figma OAuth + API 集成
- **Story**: 完成 Figma API 后端集成，输入 Figma URL → 拉取文件节点 → 显示组件列表
- **工时**: 3h
- **验收标准**: URL 解析成功 + 组件列表加载

#### E1-A2: FigmaImport UI 完善
- **Story**: 显示 Figma 组件预览，点击导入到 prototypeStore
- **工时**: 1h
- **验收标准**: 导入后画布出现新节点

#### E1-A3: Image Import UI 完善
- **Story**: 拖拽上传图片，AI 识别结果预览
- **工时**: 2h
- **验收标准**: 识别结果显示

#### E1-A4: 导入结果 → prototypeStore
- **Story**: 识别的组件转换为 ProtoNode，添加到画布
- **工时**: 2h
- **验收标准**: `expect(store.nodes.length).toBeGreaterThan(0)` after import

#### 2d. UI 状态规范

详见 `specs/E1-import-ui.md`

---

### E2: AI Coding Agent 反馈回路

**Epic 目标**: 让设计师看到 AI 根据原型组件生成的代码，并能通过反馈改进生成结果。

#### 2a. 本质需求穿透

- **用户的底层动机**: 想知道 AI 怎么理解自己画的组件，生成的代码能不能直接用
- **去掉 AI Coding 会怎样**: 只能自己写代码，不知道 AI 能不能帮忙
- **解决的本质问题**: 设计师和代码之间没有 AI 翻译层

#### 2b. 最小可行范围

- **本期必做**: B1（CodingAgent 服务层）+ B2（AI 代码 Tab）+ B4（结果存储）
- **本期不做**: B3（用户反馈回路）→ 降级为 MVP（无反馈，生成即用）
- **暂缓**: Function calling + 沙箱执行（安全风险高）

#### 2c. 用户情绪地图

**关键页面: ProtoAttrPanel AI 代码 Tab**
- **进入时**: 期待看到 AI 生成的代码
- **迷路时**: 不知道 AI 生成的是什么 → Tab 标题显示"AI 代码"
- **出错时**: 生成失败 → 显示错误 + "重新生成" 按钮

#### E2-B1: CodingAgent 服务层（MVP）
- **Story**: Component[] → 调用 llm-provider.ts → 返回 GeneratedCode[]（纯 LLM 输出，不执行）
- **工时**: 3h
- **验收标准**: `expect(codes[0].code).toBeTruthy()`

#### E2-B2: ProtoAttrPanel AI 代码 Tab
- **Story**: Tab 显示 AI 生成的代码 + 复制按钮
- **工时**: 2h
- **验收标准**: Tab 存在 + 代码显示 + 复制按钮可用

#### E2-B4: AI 生成结果存储
- **Story**: 生成结果存入 prototype-snapshots，带 aiMeta 元数据
- **工时**: 1h
- **验收标准**: snapshot 含 aiMeta.model / aiMeta.generatedAt

#### 2d. UI 状态规范

详见 `specs/E2-ai-coding.md`

---

### E3: 画布版本 diff + 对比

**Epic 目标**: 支持原型画布的版本历史管理和 diff 可视化对比。

#### 2a. 本质需求穿透

- **用户的底层动机**: 想知道画布改了哪些东西，能恢复到某个时间点
- **去掉版本 diff 会怎样**: 改错了不知道之前什么样，只能重画
- **解决的本质问题**: 原型编辑没有后悔药

#### 2b. 最小可行范围

- **本期必做**: C1（prototypeVersionStore）+ C2（快照创建）+ C3（版本列表 + 恢复）
- **本期不做**: C4（jsondiffpatch diff 可视化）
- **暂缓**: 版本分支、版本合并

#### 2c. 用户情绪地图

**关键页面: version-history 页面**
- **进入时**: 期待看到历史版本列表
- **迷路时**: 不知道哪个版本是什么 → 列表显示时间 + 节点数量
- **出错时**: 恢复失败 → toast "恢复失败，请重试"，不丢失当前数据

#### E3-C1: prototypeVersionStore
- **Story**: 独立的版本历史 store（与 prototypeStore 解耦）
- **工时**: 2h
- **验收标准**: store 存在且包含 snapshots 数组

#### E3-C2: 版本快照创建
- **Story**: 点击"保存版本" → POST prototype-snapshots API
- **工时**: 1h
- **验收标准**: snapshot 创建成功 + 可在 version-history 看到

#### E3-C3: 版本列表 + 恢复
- **Story**: version-history 页面显示快照列表，点击"恢复"还原画布
- **工时**: 2h
- **验收标准**: 恢复后画布状态与快照一致

#### 2d. UI 状态规范

详见 `specs/E3-version-history.md`

---

### E4: 打磨与集成

**Epic 目标**: Sprint6 功能与 Sprint1-5 产出物集成，做全量回归测试。

#### 2a. 本质需求穿透

- **用户的底层动机**: 用的是完整产品，不是半成品
- **去掉打磨会怎样**: 功能能用但体验差，集成有断裂
- **解决的本质问题**: Sprint6 之后就是完整产品，不能有明显的集成断裂

#### 2b. 最小可行范围

- **本期必做**: D2（回归测试）+ D3（changelog 更新）
- **本期不做**: D1（Delivery Center 导出 AI 代码，暂缓）
- **暂缓**: 性能优化（除非有明确的性能问题）

#### E4-D2: Sprint1-6 回归测试
- **工时**: 1h
- **验收标准**: `pnpm test` 全量通过

#### E4-D3: changelog 更新
- **工时**: 1h
- **验收标准**: changelog 包含 Sprint6 所有功能

---

## 3. 优先级矩阵

| 优先级 | Epic | Story | 功能点 | 依据 |
|--------|------|-------|--------|------|
| P0 | E1 | A1+A2+A3+A4 | Figma/图片导入完整流程 | 核心功能 |
| P0 | E4 | D2+D3 | 回归测试 + changelog | 质量保证 |
| P1 | E2 | B1+B2+B4 | AI Coding 服务层 + Tab + 存储（MVP） | 新能力 |
| P1 | E3 | C1+C2+C3 | 版本历史核心（store + 快照 + 恢复） | 核心功能 |
| P2 | E2 | B3 | 用户反馈回路（重新生成） | 体验增强 |
| P2 | E3 | C4 | jsondiffpatch diff 可视化 | 体验增强 |
| P2 | E4 | D1 | Delivery Center 导出 AI 代码 | 后续迭代 |

---

## 4. 验收标准汇总（expect() 条目）

### E1 Figma/图片导入

```
// A1: Figma API 集成
userEvent.type(screen.getByLabelText('Figma URL'), 'https://figma.com/file/abc')
await waitFor(() => expect(screen.getByTestId('figma-component-list')).toBeInTheDocument())

// A2: FigmaImport UI 导入
userEvent.click(screen.getByRole('checkbox', { name: /button component/i }))
userEvent.click(screen.getByRole('button', { name: /导入选中/i }))
await waitFor(() => expect(usePrototypeStore.getState().nodes.length).toBeGreaterThan(0))

// A3: Image Import
const file = new File([imageData], 'design.png', { type: 'image/png' })
fireEvent.drop(screen.getByTestId('image-drop-zone'), { dataTransfer: { files: [file] } })
await waitFor(() => expect(screen.getByTestId('ai-recognition-result')).toBeInTheDocument())
expect(screen.getByTestId('ai-recognition-result').textContent).toMatch(/button/i)

// A4: prototypeStore 接入
const result = await importFromImage(file)
result.components.forEach(c => usePrototypeStore.getState().addNode(c))
expect(usePrototypeStore.getState().nodes.length).toBe(result.components.length)
```

### E2 AI Coding Agent

```
// B1: CodingAgent 服务层
const codes = await codingAgent.generateCode([{ id: 'n1', type: 'Button', props: {} }])
expect(Array.isArray(codes)).toBe(true)
expect(codes.length).toBeGreaterThan(0)
expect(typeof codes[0].code).toBe('string')
expect(codes[0].code.length).toBeGreaterThan(0)

// B2: ProtoAttrPanel AI 代码 Tab
fireEvent.dblClick(screen.getByTestId('proto-node'))
expect(screen.getByRole('tab', { name: /ai.*code/i })).toBeInTheDocument()
userEvent.click(screen.getByRole('tab', { name: /ai.*code/i }))
expect(screen.getByTestId('ai-code-output')).toBeInTheDocument()
expect(screen.getByRole('button', { name: /复制/i })).toBeInTheDocument()

// B4: AI 元数据存储
const snapshot = await createSnapshot({ ...data, aiMeta: { model: 'claude', codes } })
expect(snapshot.aiMeta).toBeDefined()
expect(snapshot.aiMeta.codes).toBeDefined()
```

### E3 版本历史

```
// C1: prototypeVersionStore
expect(usePrototypeVersionStore).toBeDefined()
expect(Array.isArray(usePrototypeVersionStore.getState().snapshots)).toBe(true)

// C2: 快照创建
const before = usePrototypeVersionStore.getState().snapshots.length
await usePrototypeVersionStore.getState().createSnapshot()
const after = usePrototypeVersionStore.getState().snapshots.length
expect(after).toBe(before + 1)

// C3: 版本恢复
const targetSnapshot = snapshots[0]
await usePrototypeVersionStore.getState().restoreSnapshot(targetSnapshot.id)
expect(usePrototypeStore.getState().nodes).toMatchObject(targetSnapshot.data.nodes)

// C4: diff 可视化
const diff = diffpatcher.diff(v1.data, v2.data)
renderDiff(diff)
expect(screen.getByTestId('diff-added')).toBeInTheDocument()
expect(screen.getByTestId('diff-removed')).toBeInTheDocument()
```

---

## 5. DoD (Definition of Done)

### 研发完成判断标准

#### E1 Figma/设计稿导入
- [ ] Figma URL 输入 → 组件列表加载成功
- [ ] FigmaImport 显示组件预览
- [ ] 点击导入 → ProtoNode 添加到 prototypeStore
- [ ] Image Import 拖拽上传 → AI 识别结果显示
- [ ] 识别的组件成功添加到画布
- [ ] TypeScript 编译 0 errors

#### E2 AI Coding Agent（MVP）
- [ ] CodingAgent.generateCode() 返回 GeneratedCode[]
- [ ] ProtoAttrPanel 有 AI 代码 Tab（切换可见）
- [ ] Tab 显示生成的代码字符串
- [ ] 复制按钮可用
- [ ] 生成结果含 aiMeta 存储到 snapshot

#### E3 画布版本历史
- [ ] prototypeVersionStore 独立存在
- [ ] 点击"保存版本" → snapshot 创建成功
- [ ] version-history 页面显示版本列表
- [ ] 点击"恢复" → prototypeStore 数据还原
- [ ] TypeScript 编译 0 errors

#### E4 打磨与集成
- [ ] `pnpm test` 全量通过
- [ ] changelog 包含 Sprint6 所有功能

#### 全局
- [ ] pnpm exec tsc --noEmit → 0 errors
- [ ] pnpm test → 全部通过
- [ ] 无新的 P0 缺陷引入

---

## 6. Specs 索引

| Spec 文件 | 对应 Epic | 描述 |
|-----------|---------|------|
| specs/E1-import-ui.md | E1 | FigmaImport + ImageImport UI 规格 |
| specs/E2-ai-coding.md | E2 | AI Coding Agent 服务 + ProtoAttrPanel AI Tab 规格 |
| specs/E3-version-history.md | E3 | prototypeVersionStore + 版本历史 UI 规格 |
| specs/E4-version-diff.md | E3-C4 | jsondiffpatch diff 可视化规格 |

---

## 7. 关键设计决策记录

| 决策 | 采纳方案 | 理由 |
|------|---------|------|
| AI Coding 执行方式 | MVP: 纯 LLM 输出字符串 | 降低复杂度，function calling schema 设计复杂 |
| 代码执行 | 不执行，只生成字符串 | 沙箱安全性高风险，MVP 规避 |
| AI 反馈 | 无反馈回路（暂缓 B3） | MVP 先跑通，再加反馈 |
| 版本 diff 存储 | jsondiffpatch delta | 节省存储空间 |
| Figma 导入 | URL → 组件列表（MVP） | Figma Plugin 需额外开发 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint6-ai-coding-integration
- **执行日期**: 2026-04-18
- **备注**: Sprint6 是最后一期，工时 28h
