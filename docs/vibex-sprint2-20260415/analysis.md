# Analysis: VibeX Sprint 2 (2026-04-15)

**Project**: vibex-sprint2-20260415
**Date**: 2026-04-15
**Analyst**: Owner (Hermes)

---

## 1. 背景与动机

Sprint 1 已完成 4 个 Epic（E1-E5），遗留：
- **E6 CI 门控**：bundlesize 基线已建立
- **E7 版本历史**：API 端点已有（snapshot 路由），前端集成待完成
- **E8 导入导出**：PRD 有规格，未实施

同时 QA 发现新问题：
- **Bug #1**：Canvas Tab 切换时 phase state 残留（Prototype accordion 不关闭）
- **E6 Canvas-Dashboard**：三树数据持久化待实现（PRD 在 vibex-canvas-dashboard-integration-v2 中标记为 Phase 2）

---

## 2. Sprint 2 候选 Epic

### E1: Tab State 残留修复
- **根因**：CanvasPage 中 `setActiveTab` 变更时未同步重置 `currentPhase` 和关闭 Prototype accordion
- **工时**：1h
- **优先级**：P0（阻塞用户操作体验）

### E2: 版本历史集成（E7）
- **范围**：前端与已有 snapshot API 集成，版本列表 + diff 查看
- **工时**：3h
- **优先级**：P1

### E3: 导入导出（E8）
- **范围**：JSON/YAML 项目导出，round-trip 验证
- **工时**：2h
- **优先级**：P2

### E4: 三树数据持久化（Canvas-Dashboard E6 Phase 2）
- **范围**：contexts/flows/components 随项目一并保存
- **工时**：5h
- **优先级**：P1

---

## 3. 候选 Epic 工时汇总

| Epic | 内容 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | Tab State 修复 | 1h | P0 |
| E2 | 版本历史集成 | 3h | P1 |
| E3 | 导入导出 | 2h | P2 |
| E4 | 三树数据持久化 | 5h | P1 |
| **Total** | | **11h** | |

---

## 4. 技术约束

1. **E1**：只修改 CanvasPage.tsx，不碰 canvasStore 核心逻辑
2. **E2**：后端 snapshot API 已存在，只做前端集成
3. **E3**：文件大小限制 5MB，禁止解析外部 URL
4. **E4**：需要 D1 migration，先验证再合入

---

## 5. 验收标准

- [ ] E1: Tab 切换后 phase 正确回归 context，accordion 关闭
- [ ] E2: 版本历史 dialog 显示版本列表，点击可查看 diff
- [ ] E3: 项目可导出为 JSON/YAML，round-trip 无损
- [ ] E4: Canvas 创建项目后，三树数据在 Dashboard 打开时正确恢复

---

## 6. 依赖

| 依赖 | 来源 |
|------|------|
| snapshot API | 已实现（vibex-canvas-qa-fix Epic2） |
| projectApi.createProject | 已实现（vibex-canvas-dashboard-integration-v2 E5） |
| 三树状态序列化 | 待实现 |
