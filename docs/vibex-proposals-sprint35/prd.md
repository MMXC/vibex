# PRD — VibeX Sprint 35 功能规划

**Agent**: pm
**日期**: 2026-05-11
**项目**: vibex-proposals-sprint35
**仓库**: /root/.openclaw/vibex
**依赖输入**: `docs/vibex-proposals-sprint35/analysis.md` (analyst, 2026-05-10)
**前置阶段**: `analyst-review` ✅

---

## 1. 背景与目标

基于 Sprint 34 交付成果，Sprint 35 聚焦两类工作：
1. **收尾 Sprint 34 遗留项**（P001 U4），消除技术债
2. **建立 Sprint 35 新能力基线**，通过调研明确协作增强和模板市场方向

目标：Sprint 35 结束时，撤销/重做系统可投入使用，性能基线有实测数值，协作文档和模板市场有清晰的技术路线图。

---

## 2. 功能列表

| 功能 ID | 标题 | 优先级 | 类别 | 工作量 |
|---------|------|--------|------|--------|
| S35-P001 | Sprint 34 遗留项收尾（P001 U4 调用补充） | P0 | improvement | 0.5d |
| S35-P002 | Sprint 34 性能基线实测 + 阈值建立 | P1 | improvement | 0.5d |
| S35-P003 | 多人协作能力增强调研 | P1 | analysis | 1.5d |
| S35-P004 | 模板市场功能调研 | P2 | analysis | 0.5d |

---

## 3. 功能详情

### S35-P001: Sprint 34 遗留项收尾（P001 U4 调用补充）

**问题描述**:
Sprint 34 的 P001（撤销/重做）实现了 `canvasHistoryStore` 和 Middleware 包装，但 DDSCanvasPage 中的 `undoCallback`/`redoCallback` 连接点未完成实际调用。Sprint 34 CHANGELOG 明确标注：⚠️ U4-P001 在 DDSCanvasPage 中的调用待后续 sprint 补充。

**影响范围**: `DDSCanvasPage.tsx` 第 375-380 行（现有连接点）
**页面集成**: `pages/dds-canvas/index.tsx` / `src/pages/DDSCanvasPage.tsx`

**功能 ID 格式**: `S35-P001-U{n}`（Sprint 35 / Proposal 001 / Unit n）

#### 子任务

| 子任务 ID | 描述 | 验收标准 |
|-----------|------|----------|
| S35-P001-U1 | DDSCanvasPage 导入 canvasHistoryStore | `expect(canvasHistoryStore).toBeDefined()` |
| S35-P001-U2 | undoCallback 调用链 | `expect(canvasHistoryStore.getState().undo).toBeDefined()` 后端已实现 |
| S35-P001-U3 | redoCallback 调用链 | `expect(canvasHistoryStore.getState().redo).toBeDefined()` 后端已实现 |
| S35-P001-U4 | Ctrl+Z / Ctrl+Shift+Z 生效 | E2E: `expect(page.keyboard.press('Control+z')).toMatch('undo-called')` |
| S35-P001-U5 | localStorage 持久化验证 | E2E: 刷新页面后撤销历史记录保留 |
| S35-P001-U6 | 现有 53 个 Canvas 单元测试全部通过 | CI: `npm run test -- --testPathPattern=canvas` → exit 0 |

**Definition of Done**:
- [ ] `DDSCanvasPage.tsx` 中 `undoCallback` → `canvasHistoryStore.getState().undo()` 已实现
- [ ] `DDSCanvasPage.tsx` 中 `redoCallback` → `canvasHistoryStore.getState().redo()` 已实现
- [ ] `useKeyboardShortcuts` 中 Ctrl+Z / Ctrl+Shift+Z 快捷键已连接到 History Store
- [ ] E2E 测试 `sprint34-p001.spec.ts` 中 "刷新页面后历史记录保留" 通过
- [ ] `npm run test -- --testPathPattern=canvas` 全部通过（53 个测试）
- [ ] CHANGELOG.md 中 ⚠️ U4-P001 标注已移除

---

### S35-P002: Sprint 34 性能基线实测 + 阈值建立

**问题描述**:
Sprint 34 建立了 Bundle Report CI workflow 和 Lighthouse CI 配置，但 `performance-baseline.md` 为空。Sprint 35 需要建立实测基线数值，使 CI 有可执行的性能门槛。

**影响范围**: `.github/workflows/bundle-report.yml` / `lighthouserc.json`
**页面集成**: 不涉及用户页面，纯 CI/CD 工作流

**功能 ID 格式**: `S35-P002-U{n}`

#### 子任务

| 子任务 ID | 描述 | 验收标准 |
|-----------|------|----------|
| S35-P002-U1 | 主包大小基线测量 | `performance-baseline.md` 包含 `main-bundle: <N> KB` 字段 |
| S35-P002-U2 | Lighthouse 基线指标测量 | FCP / LCP / TTI / CLS 基线值写入 `performance-baseline.md` |
| S35-P002-U3 | Bundle Report CI 在 main 分支运行 | CI run 在 main 分支上成功，baseline 记录已写入 |
| S35-P002-U4 | PR 对比基线，超阈值则 CI 失败 | PR 中包体积增加 >5% → CI exit 1 |
| S35-P002-U5 | Lighthouse CI 配置 warn 级别，3 runs 中位数 | `lighthouserc.json` 中 `settings: { onlyCategories: [...] }` 且 `assertions` 使用 warn |

**Definition of Done**:
- [ ] `performance-baseline.md` 存在且包含主包大小（KB）
- [ ] `performance-baseline.md` 包含 FCP / LCP / TTI / CLS 数值
- [ ] Bundle Report CI 在 main 分支运行，baseline 已记录
- [ ] PR 中包体积增幅 >5% 时 CI 失败
- [ ] Lighthouse CI 使用 3 runs 中位数策略

---

### S35-P003: 多人协作能力增强调研

**问题描述**:
Sprint 33 已实现协作者意图气泡（IntentionBubble）和 ConflictBubble 冲突可视化。Sprint 34 无协作增强。Sprint 35 需要调研下一阶段协作能力（实时多人光标、Presence 增强、冲突仲裁 UX 改进）。

**影响范围**: `src/components/collaboration/` / `src/stores/collaborationStore.ts`
**页面集成**: Canvas 协作视图（`DDSCanvasPage.tsx`）

**功能 ID 格式**: `S35-P003-U{n}`

#### 子任务

| 子任务 ID | 描述 | 验收标准 |
|-----------|------|----------|
| S35-P003-U1 | 竞品对比分析 | 调研文档包含 Figma / Miro / Notion 对比表 |
| S35-P003-U2 | 技术风险识别 | 识别 Firebase RTDB 扩展性风险 + WebSocket vs. RTC 选型 |
| S35-P003-U3 | 可选方案（≥2 个）含 Pros/Cons | 文档包含方案 A（Pros/Cons）+ 方案 B（Pros/Cons） |
| S35-P003-U4 | 推荐方案含工作量估算 | 文档包含推荐方案 + 初步工时估计（人天） |

**调研文档输出**: `docs/vibex-proposals-sprint35/collaboration-research.md`

**Definition of Done**:
- [ ] 调研文档 `collaboration-research.md` 存在
- [ ] 包含 Figma / Miro / Notion 竞品对比表
- [ ] 识别 Firebase RTDB 扩展性问题
- [ ] 包含 WebSocket vs. RTC 选型分析
- [ ] 至少 2 个可选方案，每个含 Pros/Cons
- [ ] 推荐方案含初步工作量估算
- [ ] 不实施，只产出文档供 Sprint 36 决策

---

### S35-P004: 模板市场功能调研

**问题描述**:
当前模板系统支持 CRUD 和导入导出，缺少模板市场（模板上传/分享/评分/发现）能力。需要调研 MVP 方案。

**影响范围**: `src/features/template/` / `src/pages/TemplatePage.tsx`
**页面集成**: 模板管理页面（`pages/template/index.tsx`）

**功能 ID 格式**: `S35-P004-U{n}`

#### 子任务

| 子任务 ID | 描述 | 验收标准 |
|-----------|------|----------|
| S35-P004-U1 | 用户故事（≥3 个） | 文档包含 As a [role] I want to [goal] So that [benefit] |
| S35-P004-U2 | API 设计草稿 | 包含 `/api/templates/marketplace` 端点设计 |
| S35-P004-U3 | 技术方案选项（自建 vs. 第三方） | 文档包含自建方案 + 第三方集成方案 Pros/Cons |
| S35-P004-U4 | 安全考量 | 包含模板代码沙箱隔离方案说明 |

**调研文档输出**: `docs/vibex-proposals-sprint35/template-market-research.md`

**Definition of Done**:
- [ ] 调研文档 `template-market-research.md` 存在
- [ ] 包含至少 3 个用户故事
- [ ] 包含 API 设计草稿
- [ ] 包含自建 vs. 第三方方案对比
- [ ] 包含模板代码沙箱隔离安全方案说明
- [ ] 不实施，只产出文档供 Sprint 36 决策

---

## 4. 验收标准汇总

| 功能 ID | 功能 | 核心验收标准 |
|---------|------|------------|
| S35-P001 | Sprint 34 遗留项收尾 | undo/redo 在 DDSCanvasPage 中可调用，Ctrl+Z 生效，53 个测试全通过 |
| S35-P002 | 性能基线实测 | performance-baseline.md 有数值，CI 对比基线超阈值失败 |
| S35-P003 | 协作调研 | collaboration-research.md 含竞品分析 + ≥2 方案 + 推荐 |
| S35-P004 | 模板市场调研 | template-market-research.md 含用户故事 + API 设计 + 安全方案 |

---

## 5. 依赖关系图

```
S35-P001 (P0, 0.5d)
└─ 依赖: Sprint 34 canvasHistoryStore Middleware 已完成
   └─ 页面集成: DDSCanvasPage.tsx (第 375-380 行)

S35-P002 (P1, 0.5d)
└─ 依赖: Sprint 34 Bundle Report CI workflow 已建立
   └─ 页面集成: 无（纯 CI）

S35-P003 (P1, 1.5d)
└─ 依赖: Sprint 33 IntentionBubble / ConflictBubble 已完成
   └─ 页面集成: DDSCanvasPage.tsx 协作视图

S35-P004 (P2, 0.5d)
└─ 依赖: 当前模板系统 CRUD 已完成
   └─ 页面集成: pages/template/index.tsx

依赖链: S35-P001 → S35-P002 → S35-P003 / S35-P004 (无直接依赖，可并行)
```

---

## 6. 优先级矩阵（MoSCoW）

| 优先级 | 功能 | 理由 |
|--------|------|------|
| Must have | S35-P001 | Sprint 34 技术债，P0，阻塞其他功能 |
| Must have | S35-P002 | 性能基线无实测，CI 无性能门槛 |
| Should have | S35-P003 | Sprint 33 协作能力连续性，下一阶段方向明确 |
| Could have | S35-P004 | 模板市场需求调研，非紧急 |

---

## 7. 风险清单

| 风险 | 影响 | 缓解 |
|------|------|------|
| S35-P001 U4 与现有 Middleware 冲突 | 中 | 参考 AGENTS.md 4.1 连接点规范 |
| S35-P002 Lighthouse CI flaky | 低 | 使用 warn 级别，3 runs 中位数 |
| S35-P003 调研发现需要大改架构 | 高 | 仅调研不实施，Sprint 36 再决策 |

---

## 8. 输出物清单

| 输出文件 | 归属功能 | 类型 |
|----------|----------|------|
| `docs/vibex-proposals-sprint35/prd.md` | 阶段产出 | PRD（本文档） |
| `docs/vibex-proposals-sprint35/collaboration-research.md` | S35-P003 | 调研文档 |
| `docs/vibex-proposals-sprint35/template-market-research.md` | S35-P004 | 调研文档 |
| `docs/vibex-proposals-sprint35/performance-baseline.md` | S35-P002 | 性能基线 |
| `changelogs/vibex-sprint-35-changelog.md` | 全功能 | 变更日志 |

---

*本文档由 PM 基于 analyst 调研报告（analysis.md, 2026-05-10）生成，作为 pm-review 阶段产出。*