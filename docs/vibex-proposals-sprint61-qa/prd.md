# S61 QA PRD — VibeX Sprint61 质量验证产品需求

## 执行摘要
Sprint61 交付了画布版本历史、批量导出、国际化、AI 上下文集成、数据备份 5 个 Epic。本 QA 验证确保所有 Epic 满足验收标准。

## Epic 验证矩阵

| ID | Epic | 验收标准 | 验证方法 |
|----|------|---------|---------|
| E1 | 画布版本历史 | HistoryPanel 时间线正常展示快照 | UI 交互测试 + vitest |
| E2 | 批量导出 | ExportDialog PNG/ZIP 可用 | UI 交互测试 + vitest |
| E3 | 国际化 | DDSToolbar/BatchOpsToolbar 中英文切换 | UI 交互测试 + vitest |
| E4 | AI 上下文集成 | AIDraftDrawer 显示画布上下文 badge | UI 交互测试 + vitest |
| E5 | 数据备份 | BackupPanel 导出/导入/删除功能 | UI 交互测试 + vitest |

## 质量阈值
- **Vitest**: E1≥8, E2≥18, E3≥4, E4≥10, E5 核心通过
- **UI 可用性**: 所有 5 个 Epic 的核心交互可操作
- **代码质量**: 无 TypeScript 编译错误

## 产出物路径
- E1: `src/components/dds/canvas-history/`
- E2: `src/components/dds/batch-ops/`
- E3: `src/hooks/settings/`
- E4: `src/components/dds/ai-draft/`
- E5: `src/hooks/settings/backup/`

## DoD
- [ ] E1 HistoryPanel 时间线验证通过
- [ ] E2 ExportDialog 批量导出验证通过
- [ ] E3 中英文切换验证通过
- [ ] E4 AI 上下文 badge 验证通过
- [ ] E5 BackupPanel 功能验证通过
- [ ] 所有 vitest 通过（阈值如上）
