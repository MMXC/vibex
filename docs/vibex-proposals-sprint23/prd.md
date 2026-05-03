# VibeX Sprint 23 PRD

**Agent**: PM
**日期**: 2026-05-03
**项目**: vibex-proposals-sprint23
**状态**: Draft → Review

---

## 1. 执行摘要

### 背景

VibeX 完成 Sprint 1-22，已交付核心 Canvas 编辑、Design Review、Firebase Presence、模板库等能力。通过 Analyst Sprint 23 审查，识别出 5 个真实待改进点：E2E CI 报告链路断裂、Design Review 无反馈闭环、Cursor 同步缺失、导出格式有限、模板库无版本/分享。

### 目标

在 Sprint 23 落地以下改进：
- E2E 测试结果自动推送到 Slack #analyst-channel
- Design Review 支持重新评审 + diff 视图
- 为多人实时协作 Cursor 同步打好 Firebase 基础
- 扩展 Canvas 导出格式（PlantUML / SVG / JSON Schema）
- 模板库支持本地版本历史 + 导出/导入

### 成功指标

| 指标 | 目标 |
|------|------|
| E2E Slack 报告覆盖率 | 100%（每次 CI run 均推送） |
| Design Review diff 视图使用率 | Sprint 23 内测用户 > 50% 触发重评 |
| PlantUML 导出文件 | 可被 StarUML 打开，无语法错误 |
| 模板版本历史 | 用户平均保存 2+ 个版本 snapshot |
| P001-P005 全部 | `pnpm run build` → 0 errors |

---

## 2. Epic 拆分

### Epic E1: E2E CI 闭环落地（P001）

| Story ID | 描述 | 工时 | 优先级 |
|----------|------|------|--------|
| S1.1 | CI E2E job 完成后调用 Slack 报告脚本 | 1h | P1 |
| S1.2 | Slack 消息包含 pass/fail 摘要 + 失败用例列表 | 1h | P1 |

**技术方案**: 方案 A — 在 `.github/workflows/test.yml` e2e job 末尾添加 `pnpm --filter vibex-fronted run e2e:summary:slack`，读取 Playwright JSON report，生成 Slack Block Kit，发送到 `#analyst-channel`。

---

### Epic E2: Design Review 反馈闭环（P002）

| Story ID | 描述 | 工时 | 优先级 |
|----------|------|------|--------|
| S2.1 | ReviewReportPanel 添加"重新评审"按钮 | 1h | P1 |
| S2.2 | useDesignReview 支持 previousReportId 参数 | 1h | P1 |
| S2.3 | diff 视图展示 added（红）/ removed（绿）问题 | 2h | P1 |
| S2.4 | 后端 review_design API 支持 diff 对比 | 2h | P2 |

**技术方案**: 方案 A — 轻量 diff，在 ReviewReportPanel 添加重评按钮，调用时传入 previousReportId，后端返回 diff 字段，前端用绿色/红色标记变化。

---

### Epic E3: Firebase Cursor Sync 基础（P003）

| Story ID | 描述 | 工时 | 优先级 |
|----------|------|------|--------|
| S3.1 | Firebase presence channel 新增 cursor: { x, y, nodeId, timestamp } 字段 | 2h | P2 |
| S3.2 | RemoteCursor 组件开发 | 2h | P2 |
| S3.3 | 鼠标移动 throttle 100ms 写入 + mock 模式不渲染 | 1h | P2 |
| S3.4 | E2E 测试覆盖 cursor sync 场景 | 1h | P2 |

**技术方案**: 方案 A — 在现有 Firebase presence 中扩展 cursor 字段，RemoteCursor 组件渲染其他用户 cursor icon + username label。

---

### Epic E4: Canvas 导出格式扩展（P004）

| Story ID | 描述 | 工时 | 优先级 |
|----------|------|------|--------|
| S4.1 | PlantUML exporter 实现 | 2h | P1 |
| S4.2 | JSON Schema exporter 实现 | 2h | P1 |
| S4.3 | SVG exporter 实现（含降级策略） | 3h | P2 |

**技术方案**: 方案 A — 分阶段实现，Phase 1 PlantUML → Phase 2 JSON Schema → Phase 3 SVG。SVG 导出失败时显示降级文案。

---

### Epic E5: 需求模板库深耕（P005）

| Story ID | 描述 | 工时 | 优先级 |
|----------|------|------|--------|
| S5.1 | 模板导入/导出 JSON 文件 | 2h | P1 |
| S5.2 | 模板版本历史（最多 10 个 snapshot） | 2h | P1 |
| S5.3 | 模板分享 link 生成（Phase 1 export 优先） | 0h | P3（后延） |

**技术方案**: 方案 A — Phase 1 本地功能优先，模板存 localStorage，支持 export JSON 文件，版本历史最多 10 个 snapshot。分享 link Phase 2 再做。

---

## 3. 功能点详细规格

### 功能点格式

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | E2E Slack 报告触发 | CI E2E job 末尾调用 e2e:summary:slack | expect(e2eSlackMessage).toContain('pass') | 【需页面集成】 |
| F1.2 | Slack 消息格式 | Block Kit 格式，含 pass/fail 摘要 | expect(block.type).toBe('section') | 【无需页面集成】 |
| F2.1 | 重新评审按钮 | ReviewReportPanel 添加 re-review-btn | expect(btn).toBeVisible() | 【需页面集成】 |
| F2.2 | diff 视图 | added（红）/ removed（绿）标记 | expect(diff.added[0].color).toBe('red') | 【需页面集成】 |
| F3.1 | RemoteCursor 组件 | 渲染远程用户 cursor icon + username | expect(remoteCursor).toBeInDocument() | 【需页面集成】 |
| F3.2 | Firebase cursor 同步 | cursor: { x, y, nodeId, timestamp } 实时同步 | expect(firebase.cursor.x).toBe(number) | 【无需页面集成】 |
| F4.1 | PlantUML 导出 | DDSToolbar 导出 PlantUML 格式 | expect(exportedFile).toMatch(/\.puml$/) | 【需页面集成】 |
| F4.2 | SVG 导出 | Canvas → SVG，含降级策略 | expect(svgElement).toBeDefined() | 【需页面集成】 |
| F5.1 | 模板导出 | 自定义模板导出 JSON 文件 | expect(localStorage.getItem('templateExport')).toBeTruthy() | 【需页面集成】 |
| F5.2 | 模板版本历史 | 最多 10 个 snapshot，可查看历史 | expect(history.length).toBeLessThanOrEqual(10) | 【需页面集成】 |

---

## 4. 验收标准（expect() 断言）

### S1.1: E2E Slack 报告触发
```
expect(existsSync('.github/workflows/test.yml')).toBe(true)
expect(readFileSync('.github/workflows/test.yml')).toContain('e2e:summary:slack')
expect(process.env.SLACK_WEBHOOK_URL).toBeDefined()
```

### S1.2: Slack 消息格式
```
expect(slackMessage.blocks).toBeDefined()
expect(slackMessage.blocks.find(b => b.type === 'section').text.text).toMatch(/E2E.*pass|fail/)
expect(slackMessage.blocks.find(b => b.type === 'context')).toContain('vibex-fronted')
```

### S2.1: 重新评审按钮
```
expect(screen.getByTestId('re-review-btn')).toBeVisible()
expect(screen.getByTestId('re-review-btn')).toHaveTextContent(/重新评审/)
```

### S2.2: useDesignReview 支持 previousReportId
```
expect(useDesignReview.review).toBeDefined()
const result = useDesignReview.review({ canvasId, previousReportId: 'rpt_001' })
expect(result.diff).toBeDefined()
expect(result.diff.added).toBeInstanceOf(Array)
```

### S2.3: diff 视图
```
expect(screen.getByTestId('diff-view')).toBeInTheDocument()
expect(screen.getByTestId('diff-item-added')).toHaveClass(/text-red/)
expect(screen.getByTestId('diff-item-removed')).toHaveClass(/text-green/)
```

### S3.1: Firebase cursor 字段
```
expect(firebasePresence.cursor).toBeDefined()
expect(firebasePresence.cursor.x).toBe(number)
expect(firebasePresence.cursor.y).toBe(number)
expect(firebasePresence.cursor.nodeId).toBe(string)
expect(firebasePresence.cursor.timestamp).toBe(number)
```

### S3.2: RemoteCursor 组件
```
expect(existsSync('src/components/presence/RemoteCursor.tsx')).toBe(true)
expect(RemoteCursor).toBeInTheDocument()
expect(screen.getByText(/username/)).toBeInTheDocument()
```

### S4.1: PlantUML 导出
```
expect(DDSToolbarExportModal).toHaveTestId('plantuml-option')
userEvent.click(screen.getByTestId('plantuml-option'))
expect(downloadedFile.name).toMatch(/\.puml$/)
```

### S4.2: SVG 导出
```
expect(DDSToolbarExportModal).toHaveTestId('svg-option')
userEvent.click(screen.getByTestId('svg-option'))
expect(screen.queryByText(/当前视图不支持/)).not.toBeInTheDocument()
```

### S5.1: 模板导出
```
expect(screen.getByTestId('template-export-btn')).toBeVisible()
userEvent.click(screen.getByTestId('template-export-btn'))
expect(globalThis.URL.createObjectURL).toHaveBeenCalled()
```

### S5.2: 模板版本历史
```
expect(screen.getByTestId('template-history-btn')).toBeVisible()
userEvent.click(screen.getByTestId('template-history-btn'))
expect(screen.getAllByTestId('history-item')).toHaveLength(lessThanOrEqual(10))
```

---

## 5. DoD (Definition of Done)

### Epic E1 DoD
- [ ] `.github/workflows/test.yml` e2e job 末尾步骤调用 `e2e:summary:slack`
- [ ] Slack #analyst-channel 收到 E2E 报告消息（Block Kit 格式）
- [ ] CI job exit code 与 E2E 结果一致
- [ ] `pnpm run build` → 0 errors
- [ ] E2E 测试覆盖 Slack 报告链路

### Epic E2 DoD
- [ ] ReviewReportPanel 有"重新评审"按钮（`data-testid="re-review-btn"`）
- [ ] 重新评审后 diff 视图显示 added（红）/ removed（绿）问题
- [ ] `useDesignReview` 支持 `previousReportId` 参数
- [ ] `pnpm run build` → 0 errors
- [ ] E2E 测试覆盖重评 + diff 场景

### Epic E3 DoD
- [ ] RemoteCursor 组件存在（`src/components/presence/RemoteCursor.tsx`）
- [ ] 多用户 cursor 位置通过 Firebase 同步（实时 x/y/nodeId）
- [ ] Firebase mock 模式下 RemoteCursor 不渲染
- [ ] 鼠标移动 throttle 100ms，不重复写入
- [ ] `pnpm run build` → 0 errors
- [ ] E2E 测试覆盖 cursor sync 场景

### Epic E4 DoD
- [ ] DDSToolbar 导出模态框添加 PlantUML / SVG / JSON Schema 选项
- [ ] PlantUML 导出文件可被 StarUML 打开，无语法错误
- [ ] SVG 导出文件可被 Figma 导入
- [ ] SVG 导出失败时显示"当前视图不支持 SVG 导出"
- [ ] `pnpm run build` → 0 errors

### Epic E5 DoD
- [ ] 自定义模板支持导出 JSON 文件（download 触发）
- [ ] 自定义模板支持导入 JSON 文件（file input）
- [ ] 模板版本历史可查看（最多 10 个 snapshot）
- [ ] `pnpm run build` → 0 errors

---

## 6. 依赖关系图

```
S1.1 (E2E Slack) ──依赖──▶ S1.2 (Slack 消息格式)
S2.1 (重评按钮) ──依赖──▶ S2.2 (previousReportId) ──依赖──▶ S2.3 (diff 视图) ──依赖──▶ S2.4 (后端 diff API)
S3.1 (Firebase cursor) ──依赖──▶ S3.2 (RemoteCursor) ──依赖──▶ S3.3 (throttle) ──依赖──▶ S3.4 (E2E)
S4.1 (PlantUML) ──独立──▶ S4.2 (SVG) ──独立──▶ (可并行)
S5.1 (模板导出) ──依赖──▶ S5.2 (版本历史) ──独立──▶ S5.3 (分享 link, Sprint 24+)
```

---

## 7. 工时汇总

| Epic | 故事数 | 总工时 |
|------|--------|--------|
| E1 | 2 | 2h |
| E2 | 4 | 6h |
| E3 | 4 | 6h |
| E4 | 3 | 7h |
| E5 | 3 | 4h |
| **合计** | **16** | **25h** |

---

*生成时间: 2026-05-03 03:50 GMT+8*
*PM Agent | VibeX Sprint 23 PRD*