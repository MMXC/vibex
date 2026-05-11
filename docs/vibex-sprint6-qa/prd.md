# PRD — vibex-sprint6-qa / Sprint6 QA 验证

**项目**: vibex-sprint6-qa
**角色**: PM
**日期**: 2026-04-25
**上游**: analysis.md + plan/feature-list.md
**状态**: ✅ PRD 完成

---

## 1. 执行摘要

### 背景

Sprint6 AI Coding 集成提案（`vibex-sprint6-ai-coding-integration`）**有条件通过 QA 验证**（analysis.md，2026-04-25）。核心风险：E2 AI Coding Agent 的 `mockAgentCall()` 是功能性 Stub，Sprint6 若按此实现，E2 功能将完全不可用。

### 目标

对 Sprint6 全部产出物进行系统化 QA 验证，确保：
1. E1/E3/E4 的 Specs 与实现一一对应，四态定义完整
2. E2 Stub 已升级为真实实现（方案 A: OpenClaw ACP Runtime 或方案 B: HTTP 后端 AI）
3. DoD 逐条可核查，PRD 格式符合规范

### 成功指标

| 指标 | 目标值 | 测量方式 |
|------|--------|---------|
| 全量测试覆盖率 | ≥ 80% | Vitest coverage-v8 报告 |
| E2 Stub 消失率 | 100% | 源码静态分析（无 mockAgentCall/TODO） |
| 四态验证覆盖率 | 100% | 每个 Spec 文件 ≥ 1 个 QA 验证点（E5.1） |
| DoD 逐条通过率 | 100% | E5.2 逐条核查 |
| PRD 格式自检 | 通过 | E5.3 格式校验 |

**总工时: 11h**

---

## 2. Epic 拆分

### Epic 总览

| Epic | 功能点 | 优先级 | 工时 |
|------|--------|--------|------|
| E1: 设计稿导入验证 | F1.1 + F1.2 + F1.3 | P0 | 2.5h |
| E2: AI Coding Agent 验证 | F2.1 + F2.2 + F2.3 | P0 | 3.0h |
| E3: 版本历史验证 | F3.1 + F3.2 | P1 | 2.0h |
| E4: 版本 Diff 验证 | F4.1 + F4.2 | P1 | 2.0h |
| E5: 质量保障 | F5.1 + F5.2 + F5.3 | P2 | 1.5h |

---

### E1: 设计稿导入验证

**功能点**: F1.1（FigmaImport 四态） + F1.2（ImageImport 四态） + F1.3（ImportConfirmDialog 四态）
**优先级**: P0 | **工时**: 2.5h

#### 2a. 本质需求穿透（剥洋葱）

| 层级 | 需求 | 本质 |
|------|------|------|
| 表层 | 组件四态完整 | UI 反馈正确 |
| 二层 | Figma/Image 导入成功 | 设计稿能进来 |
| 三层 | 用户确认导入前可见预览 | 不瞎导 |
| **本质** | **设计师能把 Figma/图片里的组件，一键导入到 VibeX 画布** | **零摩擦设计导入** |

#### 2b. 最小可行范围

**必做**：
- FigmaImport 四态（ideal/empty/loading/error）— specs/E1-import-ui.md
- ImageImport 四态（ideal/empty/loading/error）— specs/E1-import-ui.md
- ImportConfirmDialog 四态（ideal/loading/error）— specs/E1-import-ui.md
- E2E Playwright 测试覆盖

**不做**：
- Figma API Token 管理（延期至 Token 管理方案落地）
- Figma URL 解析（Image AI 降级路径已满足 MVP）

**暂缓**：
- 多选组件批量导入确认流程

#### 2c. 用户情绪地图（老妈测试）

> "这个东西能让我把 Figma 里的东西弄进来吗？"

| 状态 | 用户感受 | 情绪 |
|------|---------|------|
| 理想态 | 看到 Figma URL 输入框，知道填什么 | 😌 自信 |
| 空状态 | 提示"该文件中没有可导入的组件" | 😐 困惑（但知道下一步） |
| 加载态 | 看到骨架屏，不是白屏 | 😟 不慌 |
| 错误态 | 看到明确错误文案 + 重试方式 | 😤 烦躁但有路 |

#### 2d. UI 状态规范

详见 `specs/E1-import-ui.md`

---

### E2: AI Coding Agent 验证

**功能点**: F2.1（CodingAgent 服务层） + F2.2（ProtoAttrPanel AI Tab 四态） + F2.3（Stub 升级决策）
**优先级**: P0 | **工时**: 3.0h

#### 2a. 本质需求穿透（剥洋葱）

| 层级 | 需求 | 本质 |
|------|------|------|
| 表层 | 组件四态完整 | UI 反馈正确 |
| 二层 | generateCode() 返回真实代码 | Agent 不是 Stub |
| 三层 | 代码可复制 | 能拿走用 |
| **本质** | **用户选中画布组件，AI 生成可用代码片段** | **一键代码生成** |

#### 2b. 最小可行范围

**必做**：
- CodingAgent.generateCode() 非 Stub（静态分析验证）— F2.3
- generateCode() 返回 GeneratedCode[] 格式验证 — F2.1
- ProtoAttrPanel AI Tab 四态（ideal/empty/loading/error）— specs/E2-ai-coding.md
- F2.1 Vitest 单元测试

**不做**：
- Agent 生成代码写入项目文件的闭环（Architecture 已标注，延期）
- 实时流式反馈 UI（无 CodingFeedbackPanel 详细设计）

**暂缓**：
- 多模型并行生成

#### 2c. 用户情绪地图（老妈测试）

> "这个按钮真能用吗？按下去会怎样？"

| 状态 | 用户感受 | 情绪 |
|------|---------|------|
| 理想态 | 看到生成的代码 + 复制按钮 | 😍 哇 |
| 空状态 | 看到引导文案"点击生成代码" | 😐 知道要做什么 |
| 加载态 | 看到骨架屏 + "正在调用 Claude..." | 😟 等着但不焦虑 |
| 错误态 | 看到错误 banner + 重试按钮，不丢代码 | 😤 烦躁但有救 |

#### 2d. UI 状态规范

详见 `specs/E2-ai-coding.md`

---

### E3: 版本历史验证

**功能点**: F3.1（prototypeVersionStore） + F3.2（version-history 页面四态）
**优先级**: P1 | **工时**: 2.0h

#### 2a. 本质需求穿透（剥洋葱）

| 层级 | 需求 | 本质 |
|------|------|------|
| 表层 | 版本列表 + 四态 | 看到历史 |
| 二层 | createSnapshot / restoreSnapshot | 能保存/能回退 |
| 三层 | 选版本时数据一致 | 不丢东西 |
| **本质** | **用户在画布操作中途，随时保存一个版本，之后能随时回到那个版本** | **后悔药** |

#### 2b. 最小可行范围

**必做**：
- prototypeVersionStore 存在且行为正确 — F3.1（Vitest store 测试）
- version-history 页面四态（ideal/empty/loading/error）— specs/E3-version-history.md

**不做**：
- 版本对比（E4 独立）
- 版本命名/重命名

**暂缓**：
- 版本自动保存（定时）

#### 2c. 用户情绪地图（老妈测试）

> "我刚才改坏了，能回到之前吗？"

| 状态 | 用户感受 | 情绪 |
|------|---------|------|
| 理想态 | 看到版本列表 + 时间 + 节点数 | 😌 安心 |
| 空状态 | 看到时间机器图标 + "保存第一个版本" | 😟 好奇 |
| 加载态 | 看到骨架屏 | 😟 耐心等 |
| 错误态 | 看到 toast + 重试，当前画布不丢 | 😤 能接受 |

#### 2d. UI 状态规范

详见 `specs/E3-version-history.md`

---

### E4: 版本 Diff 验证

**功能点**: F4.1（VersionDiff 组件四态） + F4.2（jsondiffpatch diff 计算）
**优先级**: P1 | **工时**: 2.0h

#### 2a. 本质需求穿透（剥洋葱）

| 层级 | 需求 | 本质 |
|------|------|------|
| 表层 | diff 可视化（绿/红/黄） | 看得见差异 |
| 二层 | added/removed/modified 分类正确 | 分类准 |
| 三层 | 无差异时显示文案 | 不留白 |
| **本质** | **用户选两个版本，清楚地看到这之间发生了什么变化** | **所见即所得的变化追踪** |

#### 2b. 最小可行范围

**必做**：
- VersionDiff 组件四态（ideal/empty/loading/error）— specs/E4-version-diff.md
- computeVersionDiff 四场景（added/removed/modified/无差异）— F4.2（Vitest 单元测试）

**不做**：
- 边（edges）的 diff（节点 diff 已覆盖）

**暂缓**：
- diff 结果导出（JSON/Markdown）

#### 2c. 用户情绪地图（老妈测试）

> "我改了什么来着？"

| 状态 | 用户感受 | 情绪 |
|------|---------|------|
| 理想态 | 看到绿增红删黄改，颜色清晰 | 😍 清晰 |
| 空状态 | 看到"两个版本没有差异" | 😌 放心 |
| 加载态 | 看到骨架屏 | 😟 等着 |
| 错误态 | 看到错误信息，不渲染脏 diff | 😤 能接受 |

#### 2d. UI 状态规范

详见 `specs/E4-version-diff.md`

---

### E5: 质量保障

**功能点**: F5.1（全量 Specs 覆盖率验证）+ F5.2（DoD 逐条核查）+ F5.3（PRD 格式自检）
**优先级**: P2 | **工时**: 1.5h

#### 2a. 本质需求穿透（剥洋葱）

| 层级 | 需求 | 本质 |
|------|------|------|
| 表层 | Specs 覆盖率 ≥ 100% | 有据可依 |
| 二层 | DoD 逐条可核查 | 不扯皮 |
| 三层 | PRD 格式正确 | 团队协作顺畅 |
| **本质** | **研发交付时，有明确标准判断完成与否** | **减少返工** |

#### 2b. 最小可行范围

**必做**：
- 每个 Spec 文件 ≥ 1 个 QA 验证点（F5.1）
- PRD 自检逐条通过（F5.3）

**不做**：
- 覆盖率报告自动生成（手动汇总即可）

**暂缓**：
- CI 集成自动化 QA 检查

---

## 3. 验收标准

### Story 表格

| Story ID | 描述 | Epic | 工时 | 验收标准（expect 断言） |
|----------|------|------|------|----------------------|
| S-E1-01 | FigmaImport 四态验证 | E1 | 1.0h | `expect(getByRole('button', { name: /获取组件/i })).toBeDisabled()` 当 URL 为空时 |
| S-E1-02 | ImageImport 四态验证 | E1 | 1.0h | `expect(getByTestId('image-skeleton')).toBeVisible()` 当 AI 识别中时 |
| S-E1-03 | ImportConfirmDialog 四态验证 | E1 | 0.5h | `expect(getByTestId('import-progress')).toBeVisible()` 当导入进行中时 |
| S-E2-01 | CodingAgent.generateCode() 返回格式 | E2 | 1.5h | `expect(Array.isArray(codes)).toBe(true)`<br>`expect(codes[0].language).toMatch(/tsx\|jsx/)`<br>`expect(codes[0].code.length).toBeGreaterThan(0)` |
| S-E2-02 | ProtoAttrPanel AI Tab 四态 | E2 | 1.0h | `expect(getByTestId('code-skeleton')).toBeVisible()` 当生成中时 |
| S-E2-03 | E2 Stub 升级验证 | E2 | 0.5h | `expect(sourceCode).not.toMatch(/mockAgentCall/)`<br>`expect(sourceCode).not.toMatch(/TODO.*Replace with real agent/i)` |
| S-E3-01 | prototypeVersionStore 存在性和行为 | E3 | 1.0h | `expect(usePrototypeVersionStore.getState().createSnapshot).toBeDefined()`<br>`expect(after).toBe(before + 1)` 创建快照后数量+1 |
| S-E3-02 | version-history 页面四态 | E3 | 1.0h | `expect(getByText(/还没有保存过版本/i)).toBeVisible()` 当无版本时 |
| S-E4-01 | VersionDiff 组件四态 | E4 | 1.0h | `expect(getByTestId('diff-added')).toBeVisible()` 当有新增时 |
| S-E4-02 | computeVersionDiff 四场景 | E4 | 1.0h | `expect(diff.nodes.added).toHaveLength(1)` 场景1<br>`expect(diff.nodes.removed).toHaveLength(1)` 场景2<br>`expect(diff.nodes.modified[0].after.props.text).toBe('Submit')` 场景3<br>`expect(diff).toEqual({})` 场景4 |
| S-E5-01 | 全量 Specs 覆盖率 | E5 | 0.5h | `expect(coverageReport['E1-import-ui']).toBeGreaterThanOrEqual(1)`<br>`expect(coverageReport['E2-ai-coding']).toBeGreaterThanOrEqual(1)`<br>`expect(coverageReport['E3-version-history']).toBeGreaterThanOrEqual(1)`<br>`expect(coverageReport['E4-version-diff']).toBeGreaterThanOrEqual(1)` |
| S-E5-02 | DoD 逐条核查 | E5 | 0.5h | 逐条执行 DoD 清单，每条有 pass/fail 记录 |
| S-E5-03 | PRD 格式自检 | E5 | 0.5h | `expect(prdContent).toMatch(/执行摘要/)`<br>`expect(prdContent).toMatch(/验收标准/)`<br>`expect(prdContent).toMatch(/Definition of Done/)` |

### 依赖关系图

```
S-E1-01 + S-E1-02 + S-E1-03
    ↓
S-E2-01 + S-E2-02 ← S-E2-03（Stub 验证独立，先执行）
    ↓
S-E3-01 + S-E3-02
    ↓
S-E4-01 + S-E4-02
    ↓
S-E5-01 + S-E5-02 + S-E5-03
```

---

## 4. DoD (Definition of Done)

研发完成的判断标准，**每条必须满足**：

### 通用 DoD

- [ ] **D1**: 所有 Story 的 `expect()` 断言全部通过（Vitest / Playwright 测试绿）
- [ ] **D2**: 测试覆盖率报告存在，E1/E3/E4 ≥ 80%，E2 ≥ 85%
- [ ] **D3**: 源码静态分析确认无 `mockAgentCall` 或 `// TODO: Replace with real agent`
- [ ] **D4**: E2 Stub 升级方案已明确（方案 A: ACP Runtime 或方案 B: HTTP 后端）
- [ ] **D5**: TypeScript 类型检查通过（`pnpm exec tsc --noEmit` 无错误）
- [ ] **D6**: 每个 Spec 文件至少有 1 个对应的测试用例覆盖

### Epic 专属 DoD

**E1 设计稿导入**
- [ ] **E1-D1**: FigmaImport 四态 Playwright 测试通过（ideal/empty/loading/error）
- [ ] **E1-D2**: ImageImport 四态 Playwright 测试通过（ideal/empty/loading/error）
- [ ] **E1-D3**: ImportConfirmDialog 四态 Playwright 测试通过（ideal/loading/error）
- [ ] **E1-D4**: Specs/E1-import-ui.md 四态与实现一一对应

**E2 AI Coding Agent**
- [ ] **E2-D1**: CodingAgent.generateCode() 返回非空 GeneratedCode[]（Vitest）
- [ ] **E2-D2**: ProtoAttrPanel AI Tab 四态 Playwright 测试通过
- [ ] **E2-D3**: 源码不含 mockAgentCall 或 Stub TODO 注释
- [ ] **E2-D4**: Specs/E2-ai-coding.md 四态与实现一一对应

**E3 版本历史**
- [ ] **E3-D1**: prototypeVersionStore 的 createSnapshot/restoreSnapshot 行为正确（Vitest）
- [ ] **E3-D2**: version-history 页面四态 Playwright 测试通过
- [ ] **E3-D3**: Specs/E3-version-history.md 四态与实现一一对应

**E4 版本 Diff**
- [ ] **E4-D1**: VersionDiff 组件四态 Playwright 测试通过
- [ ] **E4-D2**: computeVersionDiff 四场景（added/removed/modified/无差异）全部通过（Vitest）
- [ ] **E4-D3**: Specs/E4-version-diff.md 四态与实现一一对应

**E5 质量保障**
- [ ] **E5-D1**: 全量 Specs 覆盖率报告产出，每份 Spec ≥ 1 个验证点
- [ ] **E5-D2**: DoD 逐条核查记录存在（pass/fail 每条记录）
- [ ] **E5-D3**: PRD 自检清单全部通过（本文件 §驳回红线检查）

---

## 5. 驳回红线检查

PRD 自检：

- [ ] 执行摘要包含：背景 + 目标 + 成功指标（可量化）
- [ ] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [ ] 每个 Story 有可写的 `expect()` 断言（可直接转化为测试用例）
- [ ] DoD 章节存在且具体（通用 DoD + Epic 专属 DoD）
- [ ] 神技 1-3：每个 Epic 有本质需求穿透、最小可行范围、情绪地图
- [ ] 神技 4：涉及页面的 Epic 有 specs/ 四态定义
- [ ] specs/ 中无硬编码间距（使用 8 倍数 Token）、无硬编码颜色（使用 Token）

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint6-qa
- **执行日期**: 2026-04-25

---

*PRD 时间: 2026-04-25 11:55 GMT+8*
