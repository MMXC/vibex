# VibeX Sprint 14 PRD — 功能提案规划

**项目**: vibex-proposals-20260427-sprint14
**作者**: pm
**日期**: 2026-04-27
**版本**: 1.0
**状态**: Draft → 待评审

---

## 1. 执行摘要

### 背景

VibeX Sprint 1-13 已交付以下核心能力：
- Canvas 可视化设计（chapters + crossChapterEdges）
- CodeGen 代码生成面板（S13-E1）
- AI Agent 对话式实现助手
- Analytics 基础看板（S10 E1）
- Design Token 基础设施（S13-E2 待确认）

随着功能成熟，三个问题浮现：
1. **流程割裂**：CodeGen → AI Agent 需要手动复制粘贴，设计师无法独立完成
2. **数据孤岛**：Canvas 仅 localStorage 持久化，跨设备工作不连续
3. **质量保障**：核心路径缺乏 E2E regression 保护

### 目标

Sprint 14 聚焦三个方向：
- **串联**：Design-to-Code Pipeline 一键化
- **连续性**：Canvas 导入/导出，跨设备工作
- **质量**：E2E 测试覆盖关键用户路径
- **洞察**：Analytics 漏斗，让 PM 和用户都能看到数据

### 成功指标

| 指标 | 当前基线 | Sprint 14 目标 |
|------|---------|--------------|
| Design-to-Code Pipeline 转化率 | N/A（功能不存在） | CodeGen 用户 50% 使用 Send to AI |
| Canvas 导出次数/周 | 0 | ≥ 50 次/周 |
| E2E 测试覆盖率 | < 20% | > 60%（关键路径） |
| Funnel API 响应时间 | N/A | < 200ms (p95) |
| Token 版本记录数 | N/A（conditional） | 每 token 修改有记录 |

---

## 2. Epic 拆分

### Epic 总览

| ID | Epic 名称 | 优先级 | 工时估算 | 依赖 | 状态 |
|----|----------|--------|---------|------|------|
| E1 | Design-to-Code Pipeline 串联 | P0 | 8pt | S13-E1 实施 | 待确认 |
| E2 | Canvas 导入/导出系统 | P0 | 5pt | 无 | 独立执行 |
| E3 | E2E 测试覆盖增强 | P0 | 5pt | 无 | 独立执行 |
| E4 | Analytics 看板增强 | P1 | 6pt | S10 E1 实施 | 待确认 |
| E5 | Design Token 版本化管理 | P1 | 4pt | **S13-E2 实施（条件）** | Conditional |

### E1 — Design-to-Code Pipeline 串联

| ID | Story | 描述 | 工时 | 验收标准数 |
|----|-------|------|------|-----------|
| US-E1.1 | 设计师一键发送上下文 | CodeGenPanel "Send to AI Agent" 按钮，injectContext 注入设计上下文，跳转 AI Agent 页面 | 3pt | 3 |
| US-E1.2 | AI Agent 接收并展示 | 读取 URL 参数 `agentSession=new`，预填充消息输入框 | 2pt | 2 |
| US-E1.3 | 大型 Canvas 截断保护 | 200+ 节点时 CodeGenPanel 显示截断警告 | 1pt | 2 |
| US-E1.4 | Feature Flag 隔离 | `FEATURE_DESIGN_TO_CODE_PIPELINE` 控制功能开关 | 1pt | 1 |
| US-E1.5 | injectContext 单元测试 | valid/invalid context 各一条用例 | 1pt | 2 |

### E2 — Canvas 导入/导出系统

| ID | Story | 描述 | 工时 | 验收标准数 |
|----|-------|------|------|-----------|
| US-E2.1 | 导出 Canvas 为 JSON | "Export Canvas" 按钮，生成含 schemaVersion + chapters + crossChapterEdges 的 JSON | 2pt | 4 |
| US-E2.2 | 从 JSON 导入 Canvas | "Import Canvas" 按钮，schema 校验，restore chapters | 2pt | 3 |
| US-E2.3 | 不兼容 JSON 降级处理 | warn + 友好提示，不崩溃 | 0.5pt | 2 |
| US-E2.4 | 导入覆盖确认 | 导入前 confirm 对话，防止意外覆盖 | 0.5pt | 2 |

### E3 — E2E 测试覆盖增强

| ID | Story | 描述 | 工时 | 验收标准数 |
|----|-------|------|------|-----------|
| US-E3.1 | AI Agent Session E2E | `agent-session.spec.ts` 覆盖创建→发送→接收→保存→关闭，每步断言 | 2pt | 3 |
| US-E3.2 | CodeGen Pipeline E2E | `codegen-pipeline.spec.ts` 覆盖选择→生成→预览→发送→验证，每步断言 | 2pt | 3 |
| US-E3.3 | Design Review E2E | `design-review-e2e.spec.ts` 覆盖打开→切换→评论→验证，每步断言 | 1pt | 3 |

### E4 — Analytics 看板增强

| ID | Story | 描述 | 工时 | 验收标准数 |
|----|-------|------|------|-----------|
| US-E4.1 | Funnel API 端点 | `/api/v1/analytics/funnel?range=7d|30d` 返回 steps 转化数据 | 2pt | 3 |
| US-E4.2 | FunnelWidget SVG 渲染 | 纯 SVG 漏斗图，Dashboard + Canvas 内嵌两模式 | 2pt | 3 |
| US-E4.3 | 日期范围切换 | 7d/30d 切换，API 请求参数正确 | 1pt | 2 |
| US-E4.4 | Canvas 内嵌入口 | DDSCanvasPage 工具栏"分析"按钮，data-testid | 0.5pt | 3 |
| US-E4.5 | 空数据优雅降级 | 数据不足时显示友好提示 | 0.5pt | 1 |

### E5 — Design Token 版本化管理（Conditional）

> ⚠️ **仅在 S13-E2（Design Token Palette Manager）确认进入 Sprint 14 执行后启动**

| ID | Story | 描述 | 工时 | 验收标准数 |
|----|-------|------|------|-----------|
| US-E5.1 | Token 变更记录版本 | 每次修改 push version，包含 id/timestamp/author/tokens/description | 1.5pt | 2 |
| US-E5.2 | 版本列表展示 | UI 显示 timestamp + author + description | 1pt | 2 |
| US-E5.3 | Token Rollback | 选中历史版本，一键回滚，回滚本身也记录版本 | 1pt | 3 |
| US-E5.4 | Rollback 单元测试 | 覆盖正常回滚 + 初始版本不可回滚场景 | 0.5pt | 3 |

---

## 3. 验收标准

### E1 — Design-to-Code Pipeline 串联

| ID | Story | 验收标准 |
|----|-------|---------|
| E1-AC1 | US-E1.1 | `expect(CodeGenPanel).toHaveButton('Send to AI Agent')` |
| E1-AC2 | US-E1.1 | `expect(agentStore.injectContext).toHaveBeenCalledWith(expect.objectContaining({ type: 'codegen', generatedCode: expect.any(String), nodes: expect.any(Array) }))` |
| E1-AC3 | US-E1.1 | `expect(navigate).toHaveBeenCalledWith('/design/canvas?agentSession=new')` |
| E1-AC4 | US-E1.2 | `expect(useAgentContext).toHaveBeenCalledWith({ sessionId: 'new', source: 'codegen' })` |
| E1-AC5 | US-E1.2 | `expect(messageInput).toHaveValueContaining('// Generated from Canvas')` |
| E1-AC6 | US-E1.3 | Given 201 selected nodes → `expect(warningBanner).toBeVisible()` |
| E1-AC7 | US-E1.3 | `expect(warningBanner).toHaveTextContent(/200.*nodes.*truncated/i)` |
| E1-AC8 | US-E1.4 | `expect(flags['FEATURE_DESIGN_TO_CODE_PIPELINE']).toBe(false)` 时按钮不渲染 |
| E1-AC9 | US-E1.5 | `expect(agentStore.injectContext(validCtx)).not.toThrow()` |
| E1-AC10 | US-E1.5 | `expect(agentStore.injectContext(invalidCtx)).toThrow()` |

### E2 — Canvas 导入/导出系统

| ID | Story | 验收标准 |
|----|-------|---------|
| E2-AC1 | US-E2.1 | `expect(DDSCanvasPage).toHaveButton('Export Canvas')` |
| E2-AC2 | US-E2.1 | `expect(exportCanvas()).resolves.toMatchObject({ schemaVersion: expect.any(String), chapters: expect.any(Array) })` |
| E2-AC3 | US-E2.1 | `expect(JSON.parse(downloadedFile)).not.toThrow()` |
| E2-AC4 | US-E2.1 | 导出 JSON 含 `schemaVersion`, `chapters`, `crossChapterEdges`, `metadata` |
| E2-AC5 | US-E2.2 | `expect(DDSCanvasPage).toHaveButton('Import Canvas')` |
| E2-AC6 | US-E2.2 | 导入后 `useCanvasStore.getState().chapters.length` > 0 |
| E2-AC7 | US-E2.2 | 导入文件 chapters 数量与文件内容一致 |
| E2-AC8 | US-E2.3 | Given 不兼容 JSON → `expect(console.warn).toHaveBeenCalled()` |
| E2-AC9 | US-E2.3 | Given 不兼容 JSON → UI 显示错误提示，控制台无 error |
| E2-AC10 | US-E2.4 | Given 当前有内容 → `expect(confirmDialog).toBeVisible()` |
| E2-AC11 | US-E2.4 | 确认后原内容被替换，取消后原内容保留 |

### E3 — E2E 测试覆盖增强

| ID | Story | 验收标准 |
|----|-------|---------|
| E3-AC1 | US-E3.1 | `pnpm exec playwright test --grep "agent-session"` → 0 failures |
| E3-AC2 | US-E3.1 | agent-session.spec.ts 包含 ≥ 3 个 test case |
| E3-AC3 | US-E3.1 | 每步有 `expect` 断言，非纯 smoke test |
| E3-AC4 | US-E3.2 | `pnpm exec playwright test --grep "codegen-pipeline"` → 0 failures |
| E3-AC5 | US-E3.2 | codegen-pipeline.spec.ts 包含 ≥ 3 个 test case |
| E3-AC6 | US-E3.2 | 所有交互元素有 `data-testid` 定位 |
| E3-AC7 | US-E3.3 | `pnpm exec playwright test --grep "design-review-e2e"` → 0 failures |
| E3-AC8 | US-E3.3 | design-review-e2e.spec.ts 包含 ≥ 3 个 test case |

### E4 — Analytics 看板增强

| ID | Story | 验收标准 |
|----|-------|---------|
| E4-AC1 | US-E4.1 | `GET /api/v1/analytics/funnel?range=7d` → `{ success: true, data: { steps: [...] } }` |
| E4-AC2 | US-E4.1 | steps 包含 open_canvas, add_cards, generate_code, export_code |
| E4-AC3 | US-E4.1 | 每 step 含 `name`, `count`, `rate`（rate: 0.0-1.0） |
| E4-AC4 | US-E4.2 | Given API 返回数据 → `expect(FunnelWidget).toBeVisible()` |
| E4-AC5 | US-E4.2 | 每个 step 有对应标签和数字 |
| E4-AC6 | US-E4.2 | FunnelWidget SVG 漏斗从上到下宽度递减 |
| E4-AC7 | US-E4.3 | Given 选择 "30d" → `expect(fetch).toHaveBeenCalledWith(expect.stringContaining('range=30d'))` |
| E4-AC8 | US-E4.3 | Given 选择 "7d" → `expect(fetch).toHaveBeenCalledWith(expect.stringContaining('range=7d'))` |
| E4-AC9 | US-E4.4 | DDSCanvasPage 有 "分析" 按钮，data-testid="canvas-analytics-btn" |
| E4-AC10 | US-E4.4 | 点击后 FunnelWidget 内联展开 |
| E4-AC11 | US-E4.4 | Dashboard 和 Canvas 内嵌渲染结果一致 |
| E4-AC12 | US-E4.5 | Given 数据不足（每步 < 3 条）→ `expect(emptyState).toHaveTextContent(/数据不足以计算漏斗/i)` |

### E5 — Design Token 版本化管理（Conditional）

| ID | Story | 验收标准 |
|----|-------|---------|
| E5-AC1 | US-E5.1 | Given token 修改 → `expect(store.versions.length).toBe(prevLength + 1)` |
| E5-AC2 | US-E5.1 | 每个 version 含 `id`, `timestamp`, `author`, `tokens`, `description` |
| E5-AC3 | US-E5.2 | Given 打开版本面板 → `expect(versionList).toHaveLength(n > 0)` |
| E5-AC4 | US-E5.2 | 每列表项显示 timestamp + author + description |
| E5-AC5 | US-E5.3 | Given 选中 version[0]，rollback → `expect(store.tokens).toEqual(version[0].tokens)` |
| E5-AC6 | US-E5.3 | Rollback 后 UI token 值与选中版本完全一致 |
| E5-AC7 | US-E5.3 | Rollback 后 versions.length = 原长度 + 1（Rollback 本身记录版本） |
| E5-AC8 | US-E5.4 | Given store 有 3 个 version，选中 version[0]，rollback → tokens === version[0].tokens |
| E5-AC9 | US-E5.4 | Given store 有 1 个 version，rollback → `expect(warn).toHaveBeenCalledWith('Cannot rollback to initial version')` |
| E5-AC10 | US-E5.4 | Given 正常 rollback → versions 数组长度 + 1 |

---

## 4. DoD (Definition of Done)

### 研发完成判断标准（通用）

以下条件**全部满足**才视为研发完成，可进入 Code Review：

1. **功能实现**
   - 所有 US-AC 验收标准对应的代码已实现
   - `data-testid` 标注在对应组件代码中存在（不只在测试中）
   - feature flag 在 config 中注册并默认关闭

2. **测试覆盖**
   - 每个 Story 有对应单元测试（valid + invalid case）
   - E2E spec 文件存在且 Playwright 测试通过（0 failures）
   - Mock 范围在测试文件顶部注释说明

3. **文档**
   - Spec 文件已更新（包含最终实现的验收标准）
   - API endpoint 有 OpenAPI 注释或 schema 文档

4. **代码质量**
   - `pnpm lint` 无 error（warning 可接受）
   - 无 TODO 残留（`// TODO:` 或 `// FIXME:` 需全部处理）
   - TypeScript 类型检查通过（`pnpm tsc --noEmit`）

### Epic 特定 DoD

| Epic | 特定 DoD |
|------|---------|
| E1 | "Send to AI Agent" 按钮在 CodeGenPanel 中可见且可点击；injectContext 测试覆盖 valid + invalid 两种 context |
| E2 | Export JSON 可直接导入并还原完整的 Canvas；data-testid 存在于 Export/Import 按钮 |
| E3 | `pnpm exec playwright test --grep "agent-session"` 和 `--grep "codegen-pipeline"` 均 0 failures |
| E4 | FunnelWidget 在无数据时显示空状态提示；API 响应时间 < 200ms (p95) |
| E5 | `FEATURE_DESIGN_TOKEN_VERSIONING=false` 时版本相关代码不注册；若 S13-E2 未实施，E5 代码不存在 |

---

## 5. 依赖关系图

```
E1 (Design-to-Code Pipeline)
└── 依赖 S13-E1 (CodeGenPanel) 必须已实施

E2 (Canvas Import/Export)
└── 无外部依赖，独立执行

E3 (E2E Test Coverage)
└── 无外部依赖，独立执行
└── MockAgentService 已存在

E4 (Analytics Dashboard)
└── 依赖 S10 E1 (Analytics API 后端基础设施) 必须就绪

E5 (Design Token Versioning)
└── 依赖 S13-E2 (Design Token Palette Manager) 必须已实施
└── ⚠️ 条件触发：S13-E2 确认进入 Sprint 14 执行后才启动
└── 若 S13-E2 未实施 → E5 从 Sprint 14 剔除，不产生空代码
```

---

## 6. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准数 | 页面集成 |
|----|--------|------|-----------|----------|
| E1.1 | Send to AI Agent 按钮 | CodeGenPanel 注入上下文按钮 | 3 | ✅ DDSCanvasPage / CodeGenPanel |
| E1.2 | AI Agent 上下文预填充 | 接收注入的代码片段到消息框 | 2 | ✅ AI Agent 页面 |
| E1.3 | 节点截断警告 | 200+ 节点截断并提示 | 2 | ✅ CodeGenPanel |
| E1.4 | Feature Flag | `FEATURE_DESIGN_TO_CODE_PIPELINE` 开关 | 1 | 无 |
| E1.5 | injectContext 单元测试 | valid/invalid context 测试 | 2 | 无（纯单元） |
| E2.1 | Export Canvas | 导出 JSON，含 schemaVersion | 4 | ✅ DDSCanvasPage |
| E2.2 | Import Canvas | 导入 JSON，还原设计 | 3 | ✅ DDSCanvasPage |
| E2.3 | 不兼容 JSON 降级 | warn + 友好提示 | 2 | ✅ DDSCanvasPage |
| E2.4 | 导入覆盖确认 | confirm 对话防止覆盖 | 2 | ✅ DDSCanvasPage |
| E3.1 | agent-session E2E | session 生命周期测试 | 3 | 无（E2E） |
| E3.2 | codegen-pipeline E2E | 设计到代码串联测试 | 3 | 无（E2E） |
| E3.3 | design-review E2E | 设计评审流程测试 | 3 | 无（E2E） |
| E4.1 | Funnel API | `/api/v1/analytics/funnel` 端点 | 3 | 无（后端） |
| E4.2 | FunnelWidget SVG | 漏斗图渲染组件 | 3 | ✅ Dashboard + DDSCanvasPage |
| E4.3 | 日期范围切换 | 7d/30d 切换 | 2 | ✅ Dashboard |
| E4.4 | Canvas 内嵌入口 | DDSCanvasPage 分析按钮 | 3 | ✅ DDSCanvasPage |
| E4.5 | 空数据降级 | 空状态友好文案 | 1 | ✅ Dashboard |
| E5.1 | 版本记录 | 每次 token 修改记录 version | 2 | 无（Store） |
| E5.2 | 版本列表 UI | 显示历史版本列表 | 2 | ✅ Token Palette Manager |
| E5.3 | Rollback 功能 | 选中版本回滚 | 3 | ✅ Token Palette Manager |
| E5.4 | Rollback 单元测试 | Rollback 逻辑测试覆盖 | 3 | 无（纯单元） |

---

## 7. 驳回条件

以下情况将驳回重新补充：

- [ ] PRD 缺少执行摘要/Epic拆分/验收标准/DoD 任一章节 → 驳回
- [ ] 功能点模糊，无法写 `expect()` → 驳回
- [ ] 验收标准缺失 → 驳回
- [ ] 涉及页面但未标注【需页面集成】→ 驳回
- [ ] E5 未标注 Conditional 条件 → 驳回
- [ ] 未说明 E1/E4 对 S13-E1/S10 E1 的依赖关系 → 驳回

---

**e-signature**: pm | 2026-04-27
