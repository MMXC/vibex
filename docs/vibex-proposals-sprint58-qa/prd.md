# Sprint58 QA PRD

## 执行摘要
Sprint58 完成 5 个 Epic 的交付，需要验证：代码在 origin/main、测试通过、CHANGELOG 合规。

## QA 验收标准

### 通用标准（所有 Epic）
- [ ] `git log origin/main --oneline | grep "S58-E{N}"` 返回 feat commit
- [ ] `git show origin/main` 上对应测试文件存在且 vitest 通过
- [ ] `CHANGELOG.md` 包含 `S58-E{N}` 条目
- [ ] `vibex-fronted/CHANGELOG.md` 包含 `S58-E{N}` 条目

### E1 专项
- [ ] `canvasHistoryStore.test.ts` 在 origin/main 通过 ≥37 tests
- [ ] `canvasHistoryStore.ts` 含 Snapshot 持久化逻辑
- [ ] IndexedDB mock 修复生效（vi.hoisted pattern）

### E2 专项
- [ ] `useFileDrop.test.ts` 在 origin/main 通过 8 tests
- [ ] `DDSFlow.tsx` 含 `onDragOver`/`onDragLeave`/`onDrop` 集成
- [ ] `FileImportDialog.tsx` 含 confirmImport 逻辑

### E3 专项
- [ ] `coords.test.ts` 边界测试 ≥14 个通过
- [ ] `useCollaboration.ts` 含 `broadcastCursor` 方法
- [ ] `onNodeMouseMove` → `screenToFlowPosition` → `broadcastCursor` 集成

### E4 专项
- [ ] `ShareDialog.test.tsx` ≥46 tests 通过
- [ ] `shareUtils.ts` 含 `generateReadToken`/`generateWriteToken` 函数
- [ ] PermissionDropdown 组件渲染正确

### E5 专项
- [ ] `ConflictDialog.test.tsx` + `conflictStore.test.ts` = 17 tests 通过
- [ ] `wsConflictHandler.ts` 监听 `conflict:detected`
- [ ] ConflictDialog 支持三种解决策略（discard-local / merge / discard-remote）

## 质量阈值
- vitest 通过率: ≥95%
- CHANGELOG 覆盖率: 100%（root + vibex-fronted）
- epic push 率: 100%（5/5）

## 结论
- 通过: 标记 QA 项目 completed
- 失败: 创建 `vibex-proposals-sprint58-fix` 修复任务
