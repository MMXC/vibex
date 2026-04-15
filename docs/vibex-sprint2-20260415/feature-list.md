# Feature List — VibeX Sprint 2

**项目**: vibex-sprint2-20260415
**日期**: 2026-04-16
**来源**: analysis.md（Analyst 报告）
**Plan 类型**: feat
**Plan 深度**: Standard

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| E1-S1 | Tab 切换 phase 重置 | CanvasPage.tsx activeTab 变化时 setPhase('input') | A-E1 | 0.5h |
| E1-S2 | Tab State 回归测试 | useCanvasRenderer 测试覆盖 + accordion 状态验证 | A-E1 | 0.5h |
| E2-S1 | 版本历史 Dialog | VersionHistoryDialog UI + useVersionHistory hook 集成 | A-E2 | 1.5h |
| E2-S2 | 版本 Diff 预览 | 版本对比功能（diff viewer） | A-E2 | 1.5h |
| E3-S1 | 项目 JSON 导出 | 导出 contexts/flows/components 为 JSON，≤5MB 限制 | A-E3 | 1h |
| E3-S2 | 项目 JSON 导入 | 导入 JSON 反序列化，round-trip 无损验证 | A-E3 | 1h |
| E4-S1 | 三树数据序列化 | Canvas 三树数据写入 CanvasSnapshot.data JSON | A-E4 | 2h |
| E4-S2 | 三树数据反序列化 | 从 CanvasSnapshot.data 恢复三树状态 | A-E4 | 1.5h |
| E4-S3 | D1 Migration 验证 | staging 环境 migration 验证 + 回滚脚本 | A-E4 | 1.5h |

**总工时**: 11.5h

---

## Epic 划分

| Epic | 主题 | 包含 Story | 工时 |
|------|------|-----------|------|
| E1 | Tab State 残留修复 | E1-S1, E1-S2 | 1h |
| E2 | 版本历史 UI 集成 | E2-S1, E2-S2 | 3h |
| E3 | 导入导出 | E3-S1, E3-S2 | 2h |
| E4 | 三树数据持久化 | E4-S1, E4-S2, E4-S3 | 5h |

---

## 验收标准（摘要）

### E1 DoD
- [ ] Tab 切换到 context/flow 时 phase 重置为 input
- [ ] Prototype accordion 在离开时自动关闭
- [ ] useCanvasRenderer 测试不引入回归

### E2 DoD
- [ ] VersionHistoryDialog 显示版本列表（时间戳 + isAutoSave）
- [ ] useVersionHistory hook 与实际 API 接口匹配
- [ ] 版本 diff viewer 可对比两个版本

### E3 DoD
- [ ] 导出 JSON ≤5MB，超限给出明确错误提示
- [ ] 导入不解析外部 URL
- [ ] round-trip 无损（导出→导入，数据完全一致）

### E4 DoD
- [ ] 三树数据写入 CanvasSnapshot.data JSON
- [ ] Dashboard 打开项目正确恢复三树状态
- [ ] D1 migration staging 验证通过
