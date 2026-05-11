# 提案 — VibeX Sprint 35 功能规划

**Agent**: analyst
**日期**: 2026-05-10
**项目**: vibex-proposals-sprint35
**仓库**: /root/.openclaw/vibex
**分析视角**: 基于 Sprint 34 交付成果，识别下一批高优先级功能增强

---

## 1. Sprint 34 交付回顾

### 已交付

| 编号 | 功能 | 状态 |
|------|------|------|
| P001 | 撤销/重做系统（canvasHistoryStore + Middleware） | ✅ 完成 |
| P002 | 性能基线系统（Bundle Report CI） | ✅ 完成 |
| P003 | 快捷键动态集成（useKeyboardShortcuts） | ✅ 完成 |

### 待完成（P001 遗留项）

| 编号 | 描述 | 状态 | 依赖 |
|------|------|------|------|
| U4-P001 | DDSCanvasPage 中 canvasHistoryStore 调用补充 | ⚠️ 待补充 | P001 Middleware |
| S34-E4-U4 | U4-P001 localStorage 持久化调用 | ⚠️ 待集成 | DDSCanvasPage 修改 |

### Sprint 33 遗留项

| 编号 | 描述 | 建议 |
|------|------|------|
| P004 | Webhook 外部通知系统 | 推迟或降级 |
| P005 | 移动端适配 | P2，可持续关注 |

---

## 2. Sprint 35 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | Sprint 34 遗留项收尾（P001 U4 调用补充） | DDS Canvas | P0 |
| P002 | improvement | Sprint 34 性能基线实测 + 阈值建立 | CI/CD | P1 |
| P003 | analysis | 多人协作能力增强调研（实时光标/Presence/冲突仲裁） | 协作层 | P1 |
| P004 | analysis | 模板市场功能调研（模板上传/分享/评分） | 模板系统 | P2 |

---

## 3. 提案详情

### P001: Sprint 34 遗留项收尾

**问题描述**:
Sprint 34 的 P001（撤销/重做）实现了 `canvasHistoryStore` 和 Middleware 包装，但 DDSCanvasPage 中的 `undoCallback`/`redoCallback` 连接点需要实际调用 `canvasHistoryStore.getState().undo()` / `.redo()`。此连接点同时是 P003（快捷键）的依赖。

Sprint 34 CHANGELOG 标注：⚠️ U4-P001 在 DDSCanvasPage 中的调用待后续 sprint 补充。

**影响范围**: `DDSCanvasPage.tsx` 第 375-380 行

**验收标准**:
- [ ] `DDSCanvasPage` 导入 `canvasHistoryStore`
- [ ] `undoCallback` → `canvasHistoryStore.getState().undo()`
- [ ] `redoCallback` → `canvasHistoryStore.getState().redo()`
- [ ] `useKeyboardShortcuts` (P003) Ctrl+Z / Ctrl+Shift+Z 生效
- [ ] E2E: `sprint34-p001.spec.ts` 中 "刷新页面后历史记录保留" 通过
- [ ] 现有 53 个 Canvas 单元测试全部通过

**工作量估算**: 0.5 天

---

### P002: Sprint 34 性能基线实测

**问题描述**:
Sprint 34 建立了 Bundle Report CI workflow 和 Lighthouse CI 配置，但尚未建立实际的性能基线数值。P002 的 `performance-baseline.md` 已存在但为空。

**影响范围**: CI/CD pipeline

**验收标准**:
- [ ] `performance-baseline.md` 包含主包大小基线（KB）
- [ ] Lighthouse 关键指标基线（FCP, LCP, TTI, CLS）
- [ ] Bundle Report CI 在 main 分支运行并记录基准值
- [ ] PR 对比基准值，超阈值（如包体积 +5%）则 CI 失败

**工作量估算**: 0.5 天

---

### P003: 多人协作能力增强调研

**问题描述**:
Sprint 33 已实现协作者意图气泡（IntentionBubble）和 ConflictBubble 冲突可视化。Sprint 34 无协作增强。Sprint 35 应评估下一阶段协作能力（实时多人光标、Presence 增强、冲突仲裁 UX 改进）。

**影响范围**: 协作层 / Real-time sync

**验收标准**:
- [ ] 调研文档（analysis.md）包含：竞品对比（Figma/Miro/Notion）
- [ ] 识别技术风险：Firebase RTDB 扩展性、WebSocket vs. RTC
- [ ] 至少 2 个可选方案，含 Pros/Cons
- [ ] 推荐方案含初步工作量估算

**工作量估算**: 1 天调研 + 0.5 天文档

---

### P004: 模板市场功能调研

**问题描述**:
当前模板系统支持 CRUD 和导入导出，缺少模板市场（模板上传/分享/评分/发现）能力。需要调研 MVP 方案。

**影响范围**: 模板系统

**验收标准**:
- [ ] 调研文档（analysis.md）包含：用户故事、API 设计草稿
- [ ] 技术方案选项：自建 vs. 第三方模板市场集成
- [ ] 安全考量：模板代码沙箱隔离

**工作量估算**: 0.5 天调研

---

## 4. 根因分析

### Sprint 34 P001 U4 遗留根因

**根因**: Sprint 34 时间盒到期时，P001 的 Middleware 实现复杂度超预期，DDSCanvasPage 连接点的集成测试未完成。Reviewer 给予条件通过。

**证据**:
- CHANGELOG.md 明确标注：⚠️ U4-P001 在 DDSCanvasPage 中的调用待后续 sprint 补充
- Reviewer report `reviewer-p001-report-20260510.md` 记录了条件通过

**建议**: Sprint 35 P001 以 P0 优先级收尾此遗留项，消除技术债。

---

## 5. 风险识别

| 风险 | 影响 | 缓解 |
|------|------|------|
| P001 U4 与现有 Middleware 冲突 | 中 | 参考 AGENTS.md 4.1 连接点规范 |
| P002 Lighthouse CI flaky | 低 | 使用 warn 级别，配置 3 runs 中位数 |
| P003 调研发现需要大改架构 | 高 | 仅调研不实施，Sprint 36 再决策 |
