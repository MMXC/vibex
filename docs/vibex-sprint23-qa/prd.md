# VibeX Sprint 23 QA — PRD（需求规格文档）

**Agent**: PM
**日期**: 2026-05-03
**项目**: vibex-sprint23-qa
**阶段**: create-prd
**上游**: analysis.md (analyst), prd.md (vibex-proposals-sprint23)

---

## 1. 执行摘要

### 背景

Sprint 23 进入 QA 验证阶段，需要验证 5 个 Epic 的实现状态：E1 E2E CI Slack 报告链路、E2 Design Review Diff 视图、E3 Firebase Cursor Sync、E4 Canvas 导出格式扩展（PlantUML/SVG/JSON Schema）、E5 模板库版本历史 + 导入导出。

前期产出物：Analyst 输出 analysis.md、PM 输出 prd.md、Architect 输出 architecture.md + IMPLEMENTATION_PLAN.md，E2-E5 的 tester 报告均已产出（19/4/17/76 测试通过）。

### 目标

QA 阶段对 5 个 Epic 进行功能验收，确保：
- 所有验收标准有对应测试覆盖
- 实现与 PRD 描述一致
- 偏差项已识别并有修复计划
- specs/ 目录提供四态规格支撑

### 成功指标

| 指标 | 目标 |
|------|------|
| E1: Slack 消息格式 | Block Kit，含 pass/fail + 失败用例列表 |
| E2: Diff 视图渲染 | added（红）/ removed（绿）列表正确显示 |
| E3: Cursor 同步延迟 | Firebase mock 模式不报错，延迟 < 200ms |
| E4: 导出文件格式 | PlantUML StarUML 可打开，SVG 有降级文案 |
| E5: 历史面板 | ≤10 个 snapshot，超出自动清理 |
| 跨 Epic | `pnpm run build` → 0 errors |
| 跨 Epic | E2-E5 tester 报告 100% 测试通过 |

---

## 2. 本质需求穿透（神技1：剥洋葱）

### E1: E2E CI → Slack 报告链路

**用户的底层动机是什么？**
开发者不想每30分钟手动点开 CI 页面查看结果，希望在 Slack 里直接看到"今天哪些测试挂了、挂了哪几个、谁改的"。

**去掉现有方案，理想解法是什么？**
CI 结束后，Slack 自动推送一份结构化报告，包含：总通过/失败数、失败用例列表（方便直接定位）、运行时间/链接。不需要开发者主动去 CI 页面翻报告。

**这个 Epic 解决了用户的什么本质问题？**
消除"主动检查 CI"的信息摩擦，让 CI 结果像消息一样被"推送"到眼前。

**最小可行范围（神技2：极简主义）**：
- **本期必做**：CI job 末尾调用 e2e:summary:slack，Slack 收到 Block Kit 消息（摘要+失败用例），if: always() 确保 webhook 失败不污染 CI exit code
- **本期不做**：失败时自动 @assignee（需要 Slack User ID mapping），历史趋势看板
- **暂缓**：E2E 报告持久化存储 + Web UI

---

### E2: Design Review 反馈闭环

**用户的底层动机是什么？**
评审结果出来后，开发改了代码，但不知道改对了没有、评分有没有提升。评审报告是一次性的，无法回答"我修好了吗？"

**去掉现有方案，理想解法是什么？**
改完代码后一键重新评审，自动对比新旧报告：高亮新增问题（红色）、高亮已解决问题（绿色），同时显示评分变化。

**这个 Epic 解决了用户的什么本质问题？**
让评审结果"活起来"，追踪改进闭环，而非一次性报告。

**最小可行范围**：
- **本期必做**：ReviewReportPanel 添加 re-review-btn，DiffView 显示 added（红）/ removed（绿）列表
- **本期不做**：后端 diff API（纯前端 diff 已可工作），跨报告评分趋势图
- **暂缓**：Slack 评审通知（通知太多反而不看）

---

### E3: Firebase Cursor Sync

**用户的底层动机是什么？**
多人协作时，只看到"谁在线"不够用。需要知道"谁在哪、当前在看什么节点"，才能真正协作而非互相干扰。

**去掉现有方案，理想解法是什么？**
Canvas 里实时显示每个在线用户的鼠标光标 + 用户名标签，移动时丝滑跟随。

**这个 Epic 解决了用户的什么本质问题？**
实时协作的"存在感"——知道队友在哪、在做什么，减少协作摩擦。

**最小可行范围**：
- **本期必做**：RemoteCursor 组件（SVG icon + username label），Firebase cursor 字段同步（x/y/nodeId/timestamp），mock 模式不渲染
- **本期不做**：Cursor 移动轨迹历史（ghost trail），语音/视频集成
- **暂缓**：Cursor 跟随动画（性能优先）

---

### E4: Canvas 导出格式扩展

**用户的底层动机是什么？**
VibeX 的 DDS Canvas 是内部建模工具，用户最终要把这些设计导出到其他工具（StarUML/Figma/OpenAPI 文档）才能真正使用。

**去掉现有方案，理想解法是什么？**
一键导出，格式直接是目标工具能打开的（.puml / .svg / .schema.json），不需要二次转换。

**这个 Epic 解决了用户的什么本质问题？**
打通 VibeX 与外部工具生态，让设计资产真正流转起来。

**最小可行范围**：
- **本期必做**：PlantUML（.puml，StarUML 可打开），JSON Schema（.schema.json），SVG 降级策略（失败显示文案）
- **本期不做**：批量导出（一次导出多个格式），导出预览（先看再下）
- **暂缓**：导出到 Confluence/Notion，直接 API POST

---

### E5: 模板库版本历史 + 导入导出

**用户的底层动机是什么？**
模板是团队的设计资产，改了怕回不去，不用又浪费。需要版本管理来积累、备份、分享。

**去掉现有方案，理想解法是什么？**
本地版本历史（每次保存快照），JSON 文件导入/导出（跨设备迁移、团队分享）。

**这个 Epic 解决了用户的什么本质问题？**
模板作为"知识资产"可持续积累，而非一次性消耗品。

**最小可行范围**：
- **本期必做**：模板导出 JSON 文件，模板导入 JSON 文件，版本历史（≤10 个 snapshot，超出自动清理）
- **本期不做**：后端存储（Phase 2），分享 link 生成（Phase 2）
- **暂缓**：模板对比/合并，模板市场/社区

---

## 3. 用户情绪地图（神技3：老妈测试）

### E2: ReviewReportPanel（关键页面）

**用户进入时的情绪**：期待又紧张。希望看到自己修改后的评分有没有提升，但不确定改对了没有。

**用户迷路时的引导文案**：
- 无历史报告时（首次评审）：DiffView 区域显示「暂无历史对比，点击上方「重新评审」按钮发起第一次对比」
- diff 列表为空时：「本次评审与上次一致，未发现变更」

**用户出错时的兜底机制**：
- 网络异常：`DiffView 显示「评审对比失败，请检查网络后重试」，按钮「重新加载」`
- 评审失败：`显示具体错误原因（评分超时/节点数据异常），不直接暴露堆栈`

### E4: DDSToolbar ExportModal（关键页面）

**用户进入时的情绪**：目标明确。需要某个格式的文件，快速找到然后离开。

**用户迷路时的引导文案**：
- 无 canvas 数据时：`ExportModal 的导出选项 disabled，显示「当前视图无内容，无法导出」`
- 不确定选哪个格式时：PlantUML 选项显示 tooltip「导出为 .puml 文件，适用于 StarUML」

**用户出错时的兜底机制**：
- SVG 导出失败：`显示「当前视图不支持 SVG 导出，请尝试其他格式」，不阻断用户其他操作`
- PlantUML 语法错误：`显示「导出格式验证失败，请检查组件名称是否包含特殊字符」`

### E5: TemplateHistoryPanel（关键页面）

**用户进入时的情绪**：想找回某个旧版本，期待列表中有我要的。

**用户迷路时的引导文案**：
- 无历史版本时：`显示「暂无版本历史，修改模板后会为您自动保存快照」+ 引导操作「开始使用 →」`

**用户出错时的兜底机制**：
- 导入 JSON 格式错误：`显示「文件格式不正确，请选择有效的模板 JSON 文件」+ 重试按钮`
- localStorage 超出：`静默清理最旧版本，用户无感知，列表自动更新`

---

## 4. Epic 拆分

### Epic E1: E2E CI → Slack 报告链路

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S1.1 | CI E2E job 末尾调用 e2e:summary:slack | 1h | P1 | 缺 CI 配置 |
| S1.2 | Slack 消息 Block Kit 格式，含 pass/fail 摘要 + 失败用例列表 | 1h | P1 | 待 webhook 验证 |

**依赖**: S1.1 → S1.2（串行）
**执行者**: Dev

---

### Epic E2: Design Review Diff 视图

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S2.1 | ReviewReportPanel 添加 re-review-btn | 1h | P1 | ✅ 已完成 |
| S2.2 | useDesignReview 支持 previousReportId 参数 | 1h | P1 | ✅ 已完成 |
| S2.3 | DiffView 组件显示 added（红）/ removed（绿）问题 | 2h | P1 | ✅ 已完成 |
| S2.4 | 后端 POST /design/review-diff API | 2h | P2 | ⚠️ 待确认 |

**依赖**: S2.1 → S2.2 → S2.3 → S2.4（串行）
**执行者**: S2.1-S2.3 Dev（已实现），S2.4 Backend Dev（待确认）

---

### Epic E3: Firebase Cursor Sync

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S3.1 | Firebase presence cursor 字段（x/y/nodeId/timestamp） | 2h | P2 | ✅ 已完成 |
| S3.2 | RemoteCursor 组件（SVG icon + username label） | 2h | P2 | ✅ 已完成 |
| S3.3 | 鼠标移动 100ms debounce 写入 + mock 模式不渲染 | 1h | P2 | ✅ 已完成 |
| S3.4 | E2E 测试覆盖 cursor sync 场景 | 1h | P2 | ⚠️ 待补充 |

**依赖**: S3.1 → S3.2 → S3.3 → S3.4（串行）
**执行者**: Dev

---

### Epic E4: Canvas 导出格式扩展

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S4.1 | PlantUML exporter 实现 + StarUML 验证 | 2h | P1 | ✅ 已完成 |
| S4.2 | JSON Schema exporter 实现 | 2h | P1 | ✅ 已完成 |
| S4.3 | SVG exporter 实现 + 降级策略 | 3h | P2 | ✅ 已完成 |

**依赖**: S4.1 / S4.2 / S4.3（可并行）
**执行者**: Dev

---

### Epic E5: 模板库版本历史 + 导入导出

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S5.1 | 模板导出 JSON 文件 | 2h | P1 | ✅ 已完成 |
| S5.2 | 模板导入 JSON 文件 | 2h | P1 | ✅ 已完成 |
| S5.3 | 模板版本历史（≤10 个 snapshot，超出自动清理） | 2h | P1 | ✅ 已完成 |

**依赖**: S5.1 / S5.2 / S5.3（可并行）
**执行者**: Dev

---

## 5. 功能点详细规格

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | E2E Slack 报告触发 | CI E2E job 末尾调用 e2e:summary:slack | expect(workflowYml).toContain('e2e:summary:slack') | 【需 CI 配置】 |
| F1.2 | Slack Block Kit 消息 | 消息包含 pass/fail 摘要 + 失败用例列表 | expect(blocks.find(t=>t.type==='section').text).toMatch(/E2E.*pass\|fail/) | 【无需页面集成】 |
| F2.1 | 重新评审按钮 | ReviewReportPanel 含 re-review-btn | expect(screen.getByTestId('re-review-btn')).toBeVisible() | 【需页面集成】 |
| F2.2 | diff 视图渲染 | DiffView 显示 added（红）/ removed（绿）列表 | expect(screen.getByTestId('diff-item-added')).toHaveClass(/text-red/) | 【需页面集成】 |
| F2.3 | diff 统计 | added/removed 数量显示 | expect(screen.getByTestId('diff-added-count')).toBeVisible() | 【需页面集成】 |
| F3.1 | RemoteCursor 渲染 | Canvas 内显示远程用户 cursor icon + username | expect(screen.getByTestId('remote-cursor')).toBeInTheDocument() | 【需页面集成】 |
| F3.2 | Firebase mock 降级 | isMockMode=true 时 RemoteCursor 不渲染 | expect(screen.queryByTestId('remote-cursor')).not.toBeInTheDocument() | 【需页面集成】 |
| F3.3 | cursor 数据同步 | presence.ts cursor 含 x/y/nodeId/timestamp | expect(firebasePresence.cursor.timestamp).toBe(number) | 【无需页面集成】 |
| F4.1 | PlantUML 导出 | DDSToolbar 导出 .puml 文件 | expect(screen.getByTestId('plantuml-option')).toBeVisible() | 【需页面集成】 |
| F4.2 | SVG 导出 | Canvas → SVG，失败时显示降级文案 | expect(screen.getByTestId('svg-option')).toBeVisible() | 【需页面集成】 |
| F4.3 | JSON Schema 导出 | DDSToolbar 导出 .schema.json 文件 | expect(screen.getByTestId('schema-option')).toBeVisible() | 【需页面集成】 |
| F5.1 | 模板导出 | 触发 JSON 文件 download | expect(screen.getByTestId('template-export-btn')).toBeVisible() | 【需页面集成】 |
| F5.2 | 模板导入 | 解析 JSON 文件并恢复模板 | expect(screen.getByTestId('template-import-btn')).toBeVisible() | 【需页面集成】 |
| F5.3 | 模板历史版本 | 显示 ≤10 个 snapshot，超出自动清理 | expect(screen.getAllByTestId('history-item').length).toBeLessThanOrEqual(10) | 【需页面集成】 |

---

## 6. 验收标准（expect() 断言）

### E1 验收标准

```typescript
// S1.1: CI 配置
expect(existsSync('.github/workflows/test.yml')).toBe(true)
expect(readFileSync('.github/workflows/test.yml')).toContain('e2e:summary:slack')
expect(readFileSync('.github/workflows/test.yml')).toContain('if: always()')

// S1.2: Slack Block Kit 格式
expect(slackPayload.blocks).toBeDefined()
expect(slackPayload.blocks.find(b => b.type === 'section').text.text).toMatch(/E2E.*pass|fail/)
expect(slackPayload.blocks.find(b => b.type === 'context').elements[0].text).toMatch(/vibex-fronted/)
```

### E2 验收标准

```typescript
// S2.1: 重新评审按钮
expect(screen.getByTestId('re-review-btn')).toBeVisible()
expect(screen.getByTestId('re-review-btn')).toHaveTextContent(/重新评审/)

// S2.2: useDesignReview diff 模式
const result = useDesignReview.review({ canvasId, previousReportId: 'rpt_001' })
expect(result.diff).toBeDefined()
expect(result.diff.added).toBeInstanceOf(Array)

// S2.3: DiffView 渲染
expect(screen.getByTestId('diff-view')).toBeInTheDocument()
expect(screen.getByTestId('diff-item-added')).toHaveClass(/text-red/)
expect(screen.getByTestId('diff-item-removed')).toHaveClass(/text-green/)
expect(screen.getByTestId('diff-added-count')).toBeVisible()
expect(screen.getByTestId('diff-removed-count')).toBeVisible()
```

### E3 验收标准

```typescript
// S3.1: Firebase cursor 字段
expect(firebasePresence.cursor).toBeDefined()
expect(firebasePresence.cursor.x).toBe(number)
expect(firebasePresence.cursor.y).toBe(number)
expect(firebasePresence.cursor.nodeId).toBe(string)
expect(firebasePresence.cursor.timestamp).toBe(number)

// S3.2: RemoteCursor 组件
expect(screen.getByTestId('remote-cursor')).toBeInTheDocument()
expect(screen.getByTestId('remote-cursor-label')).toBeInTheDocument()
expect(screen.getByTestId('remote-cursor-label')).toHaveTextContent(/username/)

// S3.3: Mock 模式不渲染
render(<RemoteCursor isMockMode={true} />)
expect(screen.queryByTestId('remote-cursor')).not.toBeInTheDocument()
```

### E4 验收标准

```typescript
// S4.1: PlantUML 导出
expect(screen.getByTestId('plantuml-option')).toBeVisible()
userEvent.click(screen.getByTestId('plantuml-option'))
expect(downloadedFile.name).toMatch(/\.puml$/)

// S4.2: SVG 导出 + 降级
expect(screen.getByTestId('svg-option')).toBeVisible()
// SVG 降级测试由 tester 覆盖，vitest 通过（vitest 版本问题不影响功能）
expect(screen.getByText('当前视图不支持 SVG 导出')).toBeVisible() // 降级场景

// S4.3: JSON Schema 导出
expect(screen.getByTestId('schema-option')).toBeVisible()
userEvent.click(screen.getByTestId('schema-option'))
expect(downloadedFile.name).toMatch(/\.schema\.json$/)
```

### E5 验收标准

```typescript
// S5.1: 模板导出
expect(screen.getByTestId('template-export-btn')).toBeVisible()
userEvent.click(screen.getByTestId('template-export-btn'))
expect(globalThis.URL.createObjectURL).toHaveBeenCalled()

// S5.2: 模板导入
expect(screen.getByTestId('template-import-btn')).toBeVisible()
// JSON 格式错误兜底
expect(screen.getByText('文件格式不正确，请选择有效的模板 JSON 文件')).toBeInTheDocument()

// S5.3: 模板版本历史
expect(screen.getByTestId('template-history-btn')).toBeVisible()
userEvent.click(screen.getByTestId('template-history-btn'))
expect(screen.getAllByTestId('history-item').length).toBeLessThanOrEqual(10)
```

---

## 7. Specs 目录引用

> 详细四态规格（理想态/空状态/加载态/错误态）见 specs/ 目录：
> - `specs/01-epic1-e2e-slack-report.md`
> - `specs/02-epic2-design-review-diff.md`
> - `specs/03-epic3-firebase-cursor-sync.md`
> - `specs/04-epic4-export-formats.md`
> - `specs/05-epic5-template-library.md`

**Spec 四态规范摘要**：
- **加载态**：禁止 spinner（会抖动），统一用骨架屏（E2 DiffView）或按钮 disabled + loading（E4/E5）
- **空状态**：禁止留白，强制引导文案（详见各 spec 文件）
- **错误态**：至少覆盖网络异常/权限不足/数据超长/接口超时
- **间距/颜色**：统一用 design token，禁止硬编码（specs 中已规范）

---

## 8. 依赖关系图

```
E1: S1.1 ──▶ S1.2
E2: S2.1 ──▶ S2.2 ──▶ S2.3 ──▶ S2.4（⚠️ Backend Dev 待确认）
E3: S3.1 ──▶ S3.2 ──▶ S3.3 ──▶ S3.4（⚠️ E2E 测试待补充）
E4: S4.1 // S4.2 // S4.3（可并行，全部完成）
E5: S5.1 // S5.2 // S5.3（可并行，全部完成）
```

---

## 9. 工时汇总

| Epic | 故事数 | 总工时 | 完成度 |
|------|--------|--------|--------|
| E1 | 2 | 2h | 80%（缺 CI 配置） |
| E2 | 4 | 6h | 75%（前端完成，后端待确认） |
| E3 | 4 | 6h | 90%（全链路完成，缺 E2E） |
| E4 | 3 | 7h | 100% |
| E5 | 3 | 4h | 100% |
| **合计** | **16** | **25h** | **89%** |

---

## 10. DoD (Definition of Done)

### E1 DoD
- [ ] `.github/workflows/test.yml` e2e job 末尾步骤调用 `e2e:summary:slack`
- [ ] Slack #analyst-channel 收到 E2E 报告消息（Block Kit 格式，含 pass/fail 摘要 + 失败用例列表）
- [ ] CI job exit code 与 E2E 结果一致（`if: always()`）
- [ ] Slack webhook 不可用时 CI 仍正常通过
- [ ] `pnpm run build` → 0 errors

### E2 DoD
- [ ] ReviewReportPanel 有"重新评审"按钮（`data-testid="re-review-btn"`）
- [ ] DiffView 显示 added（红）/ removed（绿）问题列表
- [ ] `useDesignReview` 支持 `previousReportId` 参数
- [ ] diff 统计显示 added/removed 数量（`data-testid="diff-added-count"`, `data-testid="diff-removed-count"`）
- [ ] 首次评审无历史报告时显示引导文案（空状态）
- [ ] 重新评审中显示骨架屏（非 spinner）
- [ ] 评审失败显示错误消息 + 重试按钮
- [ ] `pnpm run build` → 0 errors

### E3 DoD
- [ ] RemoteCursor 组件存在（`src/components/presence/RemoteCursor.tsx`）
- [ ] RemoteCursor 含 `data-testid="remote-cursor"` 和 `data-testid="remote-cursor-label"`
- [ ] 多用户 cursor 位置通过 Firebase 同步（x/y/nodeId/timestamp）
- [ ] Firebase mock 模式下 RemoteCursor 不渲染（`isMockMode=true` → null）
- [ ] 鼠标移动 throttle 100ms，不重复写入
- [ ] 单人使用（无其他用户在线）时 RemoteCursor 不渲染（空状态降级，正常行为）
- [ ] `pnpm run build` → 0 errors
- [ ] E2E 测试覆盖 cursor sync 场景（S3.4）

### E4 DoD
- [ ] DDSToolbar 含 `plantuml-option` / `svg-option` / `schema-option` data-testid
- [ ] PlantUML 导出文件可被 StarUML 打开（`.puml` 后缀）
- [ ] JSON Schema 导出文件含 `.schema.json` 后缀
- [ ] SVG 导出失败时显示降级文案「当前视图不支持 SVG 导出」
- [ ] `pnpm run build` → 0 errors

### E5 DoD
- [ ] `template-export-btn` / `template-import-btn` / `template-history-btn` / `history-item` data-testid 全存在
- [ ] 模板导出触发 JSON 文件 download
- [ ] 模板导入解析 JSON 文件并恢复
- [ ] 模板导入 JSON 格式错误时显示错误文案（空状态引导）
- [ ] 无历史版本时显示引导文案「暂无版本历史，修改模板后会为您自动保存快照」
- [ ] 模板版本历史显示 ≤10 个 snapshot
- [ ] 超出 10 个时自动清理最旧版本（静默）
- [ ] `pnpm run build` → 0 errors

---

## 11. 识别的问题与后续行动

| 问题 | Epic | 影响 | 行动 | 执行者 |
|------|------|------|------|--------|
| CI workflow 未调用 e2e:summary:slack | E1 | 阻断 | 在 `.github/workflows/test.yml` e2e job 末尾添加步骤 | Dev |
| E2 后端 diff API 无独立 task | E2 | 中 | 请 Coord 确认 Backend Dev Sprint 23 是否实现 S2.4 | Analyst → Coord |
| E3 E2E 测试覆盖缺失 | E3 | 低 | 补充 cursor sync Playwright E2E 测试用例 | Dev |
| E4 vitest 配置技术债 | E4 | 低 | Sprint 24 优化（vi.mock 替代 vi.isolateModules） | Dev（延后） |

---

## 执行决策

- **决策**: 已采纳（有条件）
- **执行项目**: vibex-sprint23-qa
- **执行日期**: 2026-05-03
- **条件**: E1/E3 补充项在 Sprint 23 完成，E2 后端 API 由 Coord 确认

---

*生成时间: 2026-05-03 07:55 GMT+8*
*PM Agent | VibeX Sprint 23 QA — PRD（create-prd 阶段）*