# Implementation Plan — vibex-sprint6-qa / design-architecture

**项目**: vibex-sprint6-qa
**角色**: Architect（实施计划）
**日期**: 2026-04-25
**上游**: architecture.md
**状态**: ✅ 设计完成

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E2: AI Coding Agent | E2-U1 ~ E2-U3 | 0/3 | E2-U1 |
| E3: 版本历史 | E3-U1 ~ E3-U2 | 0/2 | E3-U1 |
| E4: 版本 Diff | E4-U1 ~ E4-U2 | 0/2 | E4-U2 |
| E5: 质量保障 | E5-U1 ~ E5-U3 | 0/3 | E5-U1 |
| E1: 设计稿导入 | E1-U1 ~ E1-U3 | 0/3 | E1-U1 |

---

## E2: AI Coding Agent

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | CodingAgent 服务层验证 | ⬜ | — | CodingAgent.generateCode() 返回 GeneratedCode[]，非 Stub；language 不是 'unknown'；代码非空 |
| E2-U2 | ProtoAttrPanel AI Tab 四态验证 | ⬜ | E2-U1 | AI Tab 切换成功；空状态/加载态/错误态/理想态各有 expect() 断言 |
| E2-U3 | E2 Stub 升级决策验证 | ⬜ | — | 源码中不存在 mockAgentCall；sessions_spawn(runtime:'acp') 被调用 |

### E2-U1 详细说明

**目标**: 验证 CodingAgent 服务层返回真实代码，非 Stub。

**测试文件**: `tests/unit/services/CodingAgent.test.ts`

**实现步骤**:
1. 创建 `src/services/ai-coding/CodingAgent.ts`（如果不存在）
2. 使用 MSW 拦截 sessions_spawn 调用
3. 编写非 Stub 验证测试用例

**Test scenarios**:
- Happy path: `generateCode([{id:'n1',type:'Button',props:{}}])` 返回非空代码
- Edge case: `generateCode([])` 返回空数组（不抛错）
- Edge case: 返回 `GeneratedCode.language` 为 `tsx` 或 `jsx`，不是 `unknown`
- Error path: AI 服务超时返回空数组
- Non-stub verification: 源码静态分析不存在 `mockAgentCall`/`TODO.*real agent`

**Verification**: `pnpm vitest run tests/unit/services/CodingAgent.test.ts --coverage` → 0 failures

---

### E2-U2 详细说明

**目标**: 验证 ProtoAttrPanel AI Tab 四态。

**测试文件**: `tests/e2e/sprint6-qa/E2-ai-coding-panel.spec.ts`

**实现步骤**:
1. Playwright 打开 ProtoAttrPanel（双击节点）
2. 切换到 AI 代码 Tab
3. 验证四态

**Test scenarios**:
- Ideal state: AI Tab 可见；生成按钮 enabled；代码输出区有内容；复制/重新生成按钮存在
- Empty state: 未生成代码时显示引导文案
- Loading state: 点击"生成代码"后显示骨架屏 + "正在调用 Claude..."
- Error state: API 错误后显示红色错误 banner + 重新生成按钮

**Verification**: `pnpm playwright test tests/e2e/sprint6-qa/E2-ai-coding-panel.spec.ts` → 0 failures

---

### E2-U3 详细说明

**目标**: 验证 E2 Stub 已升级为真实实现。

**测试文件**: `tests/unit/services/CodingAgent.stub-check.test.ts`

**实现步骤**:
1. 使用 fs.readFileSync 读取 CodingAgent.ts 源码
2. 断言不存在 `mockAgentCall` 字符串
3. 断言不存在 `// TODO: Replace with real agent` 注释
4. 验证 sessions_spawn 调用参数包含 `runtime: 'acp'`

**Test scenarios**:
- Stub detection: 源码包含 mockAgentCall 时测试失败
- Real implementation: 源码调用 sessions_spawn 且 runtime='acp'
- Integration verification: Mock MSW handler 验证 sessions_spawn 被正确调用

**Verification**: `pnpm vitest run tests/unit/services/CodingAgent.stub-check.test.ts` → 0 failures

---

## E3: 版本历史

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | prototypeVersionStore 验证 | ⬜ | — | createSnapshot 增加快照数量；restoreSnapshot 正确还原数据；loadSnapshots 加载成功 |
| E3-U2 | version-history 页面四态验证 | ⬜ | E3-U1 | 理想态/空状态/加载态/错误态各有 expect() 断言 |

### E3-U1 详细说明

**目标**: 验证 prototypeVersionStore 所有 Actions。

**测试文件**: `tests/unit/stores/prototypeVersionStore.test.ts`

**Test scenarios**:
- Happy path: createSnapshot 增加快照数量，snapshot 包含 id/createdAt/data.nodes
- Happy path: restoreSnapshot 还原画布数据，nodes 与 snapshot.data.nodes 完全一致
- Happy path: deleteSnapshot 减少快照数量
- Empty state: loadSnapshots([]) 后版本列表为空
- Error path: loadSnapshots 失败时 store 状态不变

**Verification**: `pnpm vitest run tests/unit/stores/prototypeVersionStore.test.ts` → 0 failures

---

### E3-U2 详细说明

**目标**: 验证 version-history 页面四态。

**测试文件**: `tests/e2e/sprint6-qa/E3-version-history.spec.ts`

**Test scenarios**:
- Ideal state: 版本列表存在；版本项显示时间 + 名称 + 节点数量；hover 显示恢复/对比/删除按钮
- Empty state: 无版本时显示"还没有保存过版本" + "保存第一个版本"按钮
- Loading state: 5 个骨架屏；版本列表按钮不显示
- Error state: 加载失败显示 toast + 重试按钮

**Verification**: `pnpm playwright test tests/e2e/sprint6-qa/E3-version-history.spec.ts` → 0 failures

---

## E4: 版本 Diff

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | VersionDiff 组件四态验证 | ⬜ | — | 理想态/空状态/加载态/错误态各有 expect() 断言；diff-added/removed/modified 高亮正确 |
| E4-U2 | jsondiffpatch diff 计算验证 | ⬜ | — | added/removed/modified/无差异 四场景全部通过 |

### E4-U1 详细说明

**目标**: 验证 VersionDiff 组件四态。

**测试文件**: `tests/e2e/sprint6-qa/E4-version-diff.spec.ts`

**Test scenarios**:
- Ideal state: diff-added/removed/modified 高亮可见；绿色=新增/红色=删除/黄色=修改
- Empty state: 两版本相同显示"两个版本没有差异"
- Loading state: diff-skeleton 骨架屏可见
- Error state: diff 计算失败显示错误信息

**Verification**: `pnpm playwright test tests/e2e/sprint6-qa/E4-version-diff.spec.ts` → 0 failures

---

### E4-U2 详细说明

**目标**: 验证 jsondiffpatch computeVersionDiff 四场景。

**测试文件**: `tests/unit/services/computeVersionDiff.test.ts`

**Test scenarios**:
- Happy path (added): v2 比 v1 多一个节点，diff.nodes.added 数量为 1
- Happy path (removed): v1 比 v2 多一个节点，diff.nodes.removed 数量为 1
- Happy path (modified): 同一节点 props.text 从 'Click' 变为 'Submit'，modified[0].before/after 正确
- Happy path (no-diff): 相同数据返回空对象 `{}`
- Edge case: 嵌套 props 变化（如 position.x）
- Edge case: 节点 type 变化（Button -> Input）

**Verification**: `pnpm vitest run tests/unit/services/computeVersionDiff.test.ts` → 0 failures

---

## E5: 质量保障

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | Specs 覆盖率验证 | ⬜ | — | E1/E2/E3/E4 每个 Spec 文件都有 ≥1 个 QA 验证点 |
| E5-U2 | DoD 逐条核查 | ⬜ | — | PRD DoD 16 条条目逐条可测试 |
| E5-U3 | PRD 格式自检 | ⬜ | — | PRD 格式 7 项检查全部通过 |

### E5-U1 详细说明

**目标**: 验证每个 Spec 文件至少有一个 QA 验证点覆盖。

**测试文件**: `tests/unit/docs/coverage-map.test.ts`

**Test scenarios**:
- E1 coverage: specs/E1-import-ui-qa.md 被 F1.1/F1.2/F1.3 覆盖
- E2 coverage: specs/E2-ai-coding-qa.md 被 F2.1/F2.2 覆盖
- E3 coverage: specs/E3-version-history-qa.md 被 F3.1/F3.2 覆盖
- E4 coverage: specs/E4-version-diff-qa.md 被 F4.1/F4.2 覆盖

**Verification**: `pnpm vitest run tests/unit/docs/coverage-map.test.ts` → 0 failures

---

### E5-U2 详细说明

**目标**: 逐条验证 PRD DoD 16 条条目可测试。

**测试文件**: `tests/unit/docs/dod-checklist.test.ts`

**Test scenarios**:
- 每条 DoD 条目必须有对应的 test case 名称
- 条目描述必须包含具体的输入/输出/行为，不能是模糊表达

**Verification**: `pnpm vitest run tests/unit/docs/dod-checklist.test.ts` → 0 failures

---

### E5-U3 详细说明

**目标**: 验证 PRD 包含所有必需章节。

**测试文件**: `tests/unit/docs/prd-format.test.ts`

**Test scenarios**:
- 执行摘要包含：背景 + 目标 + 成功指标
- Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- 每个 Story 有 expect() 断言
- DoD 章节存在且具体
- 关键页面有"用户情绪地图"
- 全局检查：tsc --noEmit 0 errors + pnpm test 全通过

**Verification**: `pnpm exec tsc --noEmit && pnpm test` → 0 errors, all tests pass

---

## E1: 设计稿导入

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | FigmaImport 四态验证 | ⬜ | — | 理想态/空状态/加载态/错误态各有 expect() 断言 |
| E1-U2 | ImageImport 四态验证 | ⬜ | E1-U1 | 拖拽/上传/识别结果/错误处理各有 expect() 断言 |
| E1-U3 | ImportConfirmDialog 四态验证 | ⬜ | E1-U2 | 理想态/加载态各有 expect() 断言 |

### E1-U1 详细说明

**目标**: 验证 FigmaImport 组件四态。

**测试文件**: `tests/e2e/sprint6-qa/E1-import-flow.spec.ts`

**Test scenarios**:
- Ideal state: Figma URL 输入框存在；"获取组件"按钮 enabled；输入 URL 后按钮启用
- Empty state: URL 未输入时按钮 disabled
- Loading state: 点击"获取组件"后按钮变为"获取中..."+disabled；骨架屏替代内容
- Error state: URL 无效时 input 红色边框（aria-invalid=true）+ inline 错误文案

**Verification**: `pnpm playwright test tests/e2e/sprint6-qa/E1-import-flow.spec.ts` → 0 failures

---

### E1-U2 详细说明

**目标**: 验证 ImageImport 组件四态。

**测试文件**: `tests/e2e/sprint6-qa/E1-import-flow.spec.ts`

**Test scenarios**:
- Ideal state: 拖放区存在；引导文案存在；上传后预览区显示图片
- Empty state: 无上传图片时显示引导文案
- Loading state: 上传中显示进度；AI 识别中显示骨架屏（testId: image-skeleton）
- Error state: 文件格式不支持显示 toast；文件过大显示 toast；AI 识别失败显示重试按钮

**Verification**: `pnpm playwright test tests/e2e/sprint6-qa/E1-import-flow.spec.ts` → 0 failures

---

### E1-U3 详细说明

**目标**: 验证 ImportConfirmDialog 四态。

**测试文件**: `tests/e2e/sprint6-qa/E1-import-flow.spec.ts`

**Test scenarios**:
- Ideal state: Dialog 存在；组件列表显示；"确认导入"/"取消"按钮存在
- Loading state: 导入中显示进度条（testId: import-progress）；确认按钮 disabled
- Error state: 导入失败显示错误信息 + 重试按钮；画布数据不受影响

**Verification**: `pnpm playwright test tests/e2e/sprint6-qa/E1-import-flow.spec.ts` → 0 failures

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint6-qa
- **执行日期**: 2026-04-25
- **备注**: E2-U3 Stub 验证优先级最高（P0）。Unit 执行顺序：E2 → E3 → E4 → E5 → E1。

---

*计划时间: 2026-04-25 11:55 GMT+8*
