# VibeX Sprint 4+ 实施计划 — VibeX Architect 提案

**项目**: vibex-architect-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**角色**: Architect

---

## 执行决策

| 提案 | 决策 | team-tasks 项目 | 执行日期 |
|------|------|-----------------|---------|
| E1: E4 Sync Protocol | **已采纳** | vibex-sync-protocol | Sprint 4 |
| E2: canvasStore Facade 清理 | **已采纳** | vibex-facade-cleanup | Sprint 4 |
| E3: TypeScript Strict 模式 | **已采纳** | vibex-ts-strict | Sprint 5-6 |
| E4: API 契约测试 | **已采纳** | vibex-contract-testing | Sprint 7+ |
| E5: 测试策略统一 | **已采纳** | vibex-testing-strategy | Sprint 6 |

---

## 一、Sprint 4 详细实施计划

**目标**: E1 (Sync Protocol) + E2 (Facade Cleanup) 并行实施
**总工时**: 7-10h

### Day 1-2: E2-S1 分析 + E2-S2 CascadeUpdateManager 迁移 + E1-S1 版本号字段

#### E2-S1: canvasStore.ts 剩余逻辑分析（2h）

**任务文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts`（1513 行）

**执行步骤**:

1. **静态分析** — 逐行分类到所属 domain:
   ```bash
   # 统计各类型代码行数
   grep -n "// ===" vibex-fronted/src/lib/canvas/canvasStore.ts
   grep -n "^function\|^const\|^type\|^interface\|^class" vibex-fronted/src/lib/canvas/canvasStore.ts | wc -l
   
   # 识别 CascadeUpdateManager 相关逻辑（搜索关键字）
   grep -n "CascadeUpdate\|cascade\|upstream\|downstream" vibex-fronted/src/lib/canvas/canvasStore.ts
   
   # 识别直接定义的 state 和 actions
   grep -n "create(\|state:\|actions:\|getState\|setState" vibex-fronted/src/lib/canvas/canvasStore.ts
   ```

2. **输出分析报告**:
   ```typescript
   // 目标输出结构
   interface FacadeAnalysisReport {
     totalLines: number
     categories: {
       reExports: number      // 已有 stores/ 导出的行数
       directState: number     // 直接定义的状态（需迁移）
       directActions: number   // 直接定义的动作（需迁移）
       cascadeManager: number  // CascadeUpdateManager（需迁移）
       reducers: number        // reducer 逻辑（需迁移）
       init: number            // 初始化逻辑（保留）
       comments: number        // 注释（保留）
       other: number          // 其他杂项
     }
     unmigratedModules: string[]
     migrationPriority: string[]
   }
   ```

3. **创建分析报告文件**: `docs/vibex-facade-cleanup/analysis-report.md`

**验收标准**: `expect(report.totalLines).toBe(1513)` + 所有行已分类

---

#### E2-S2: CascadeUpdateManager 迁移（2h）

**源文件**: `vibex-fronted/src/lib/canvas/cascade/CascadeUpdateManager.ts`
**目标文件**: `vibex-fronted/src/lib/canvas/stores/cascadeUpdateStore.ts`

**执行步骤**:

1. 创建 `stores/cascadeUpdateStore.ts`:
   ```typescript
   import { create } from 'zustand'
   
   interface CascadeUpdateState {
     // CascadeUpdateManager 的状态字段
     upstreamMap: Map<string, string[]>
     downstreamMap: Map<string, string[]>
     updateQueue: string[]
     isProcessing: boolean
   }
   
   interface CascadeUpdateActions {
     registerUpstream: (sourceId: string, targetIds: string[]) => void
     propagateUpdate: (sourceId: string) => void
     clearAll: () => void
   }
   
   type CascadeUpdateStore = CascadeUpdateState & CascadeUpdateActions
   
   export const useCascadeUpdateStore = create<CascadeUpdateStore>((set, get) => ({
     upstreamMap: new Map(),
     downstreamMap: new Map(),
     updateQueue: [],
     isProcessing: false,
     registerUpstream: (sourceId, targetIds) => { /* ... */ },
     propagateUpdate: (sourceId) => { /* ... */ },
     clearAll: () => set({ upstreamMap: new Map(), downstreamMap: new Map(), updateQueue: [] }),
   }))
   ```

2. 逐个从 canvasStore.ts 迁移相关函数到新 store

3. 更新组件引用:
   ```bash
   # 查找引用 CascadeUpdateManager 的文件
   grep -r "CascadeUpdateManager" vibex-fronted/src/ --include="*.ts" --include="*.tsx"
   ```

4. 验证: `expect(canvasStoreLines).toBeLessThanOrEqual(1300)` + npm test 通过

**约束**: 每步迁移后运行 `npm test`，失败则回退

---

#### E1-S1: 自动保存携带版本号（2h）

**涉及文件**:
- `vibex-fronted/src/hooks/canvas/useAutoSave.ts`（修改）
- `vibex-fronted/src/lib/canvas/api/canvasApi.ts`（修改）
- `vibex-backend/src/routes/v1/canvas/snapshots.ts`（修改）

**执行步骤**:

1. **前端: useAutoSave 携带版本号**:

   修改 `useAutoSave.ts` 中的 `doSave` 函数:
   ```typescript
   // 1. 从 canvasStore 读取当前版本号
   const currentVersion = useCanvasStore.getState().currentVersion
   
   // 2. 携带版本号到 API 请求
   await canvasApi.createSnapshot({
     projectId,
     label: isAutoSave ? '自动保存' : '手动保存',
     trigger: isAutoSave ? 'auto' : 'manual',
     version: currentVersion,  // E4: 携带版本号
     contextNodes: state.contextNodes,
     flowNodes: state.flowNodes,
     componentNodes: state.componentNodes,
   })
   
   // 3. 保存成功后更新本地版本号
   setLastSavedVersion(data.version)
   ```

2. **前端: canvasApi 添加版本支持**:
   
   在 `canvasApi.ts` 的 `CreateSnapshotRequest` 中添加 `version?: number`
   添加 `VersionConflictError` 类

3. **后端: 乐观锁检查**:

   修改 `POST /v1/canvas/snapshots` 路由:
   ```typescript
   // 在 INSERT 之前增加乐观锁检查
   const existing = await queryDB<{ maxVersion: number | null }>(
     env,
     'SELECT MAX(version) as maxVersion FROM CanvasSnapshot WHERE projectId = ?',
     [resolvedProjectId]
   )
   const serverVersion = existing[0]?.maxVersion ?? 0
   
   // E4 新增: 乐观锁检查
   if (body.version !== undefined && body.version < serverVersion) {
     const serverSnapshot = await queryOne<CanvasSnapshotRow>(
       env,
       'SELECT * FROM CanvasSnapshot WHERE projectId = ? ORDER BY version DESC LIMIT 1',
       [resolvedProjectId]
     )
     return c.json({
       success: false,
       error: {
         code: 'VERSION_CONFLICT',
         message: `版本冲突: 本地 v${body.version} < 服务器 v${serverVersion}`,
         serverVersion,
         localVersion: body.version,
       },
       conflictData: {
         serverSnapshot: serverSnapshot ? parseSnapshotData(serverSnapshot) : null,
         localData: { /* 本地数据摘要 */ },
         suggestedActions: ['keep_local', 'accept_server', 'merge'],
       },
     }, 409)
   }
   ```

4. **验收测试**: 手动测试正常保存 + 模拟冲突 409 响应

---

### Day 3-5: E1-S2 ConflictDialog + E2-S3 分批迁移 + E1-S3 E2E 测试

#### E1-S2: ConflictDialog 冲突解决 UI（3h）

**新文件**: `vibex-fronted/src/components/canvas/ConflictDialog.tsx`

**执行步骤**:

1. **创建 ConflictDialog 组件**:
   ```bash
   mkdir -p vibex-fronted/src/components/canvas/ConflictDialog
   touch vibex-fronted/src/components/canvas/ConflictDialog/index.tsx
   touch vibex-fronted/src/components/canvas/ConflictDialog/DiffViewer.tsx
   touch vibex-fronted/src/components/canvas/ConflictDialog/MergeEditor.tsx
   touch vibex-fronted/src/components/canvas/ConflictDialog/__tests__/ConflictDialog.test.tsx
   ```

2. **集成到 Canvas 编辑器**:
   
   在编辑器主组件中添加冲突状态监听:
   ```typescript
   // 在 Canvas 编辑器顶层组件
   const [conflictState, setConflictState] = useState<ConflictState | null>(null)
   
   // 监听 useAutoSave 错误
   const { saveError } = useAutoSave({
     projectId,
     onSaveError: (error) => {
       if (error instanceof VersionConflictError) {
         setConflictState({
           isOpen: true,
           localData: error.localData,
           serverData: error.serverSnapshot,
           serverVersion: error.serverVersion,
           localVersion: error.localVersion,
         })
       }
     },
   })
   
   return (
     <>
       {/* 其他编辑器内容 */}
       {conflictState?.isOpen && (
         <ConflictDialog
           isOpen={conflictState.isOpen}
           localData={conflictState.localData}
           serverData={conflictState.serverData}
           serverVersion={conflictState.serverVersion}
           localVersion={conflictState.localVersion}
           onResolve={(resolution, mergedData) => {
             handleConflictResolve(resolution, mergedData)
             setConflictState(null)
           }}
           onDismiss={() => setConflictState(null)}
         />
       )}
     </>
   )
   ```

3. **ConflictDialog 三选项实现**:
   
   - **Keep Local**: 调用 `canvasApi.createSnapshot({ version: serverVersion })` 重保存
   - **Accept Server**: 调用 `canvasApi.restoreSnapshot(snapshotId)` 加载服务器数据
   - **Merge**: 打开 MergeEditor，用户手动合并后重保存

**验收标准**:
```typescript
expect(screen.getByRole('button', { name: 'Keep Local' })).toBeVisible()
expect(screen.getByRole('button', { name: 'Accept Server' })).toBeVisible()
expect(screen.getByRole('button', { name: 'Merge' })).toBeVisible()
```

---

#### E2-S3: 剩余逻辑分批迁移（3h）

**执行步骤**:

1. **Batch A: context/flow/component 相关 actions 迁移**（1h）
   - 从 canvasStore.ts 迁移 context/flow/component 相关的直接定义 actions
   - 到对应 `stores/contextStore.ts`、`stores/flowStore.ts`、`stores/componentStore.ts`

2. **Batch B: history/reducer 逻辑迁移**（1h）
   - 迁移 `historySlice.ts` 相关逻辑
   - 确保 undo/redo 功能不受影响

3. **Batch C: 剩余杂项清理**（1h）
   - 逐行审查剩余行
   - 删除无引用逻辑
   - 最终验证行数 ≤ 300

**回归测试策略**（每个 commit 必须执行）:
```bash
# 每个迁移 commit 后
npm test -- --testPathPattern="canvas" --passWithNoTests
npm run lint
git diff --stat  # 确认行数减少
```

---

#### E1-S3: 冲突场景 E2E 测试覆盖（2h）

**文件**: `vibex-fronted/e2e/conflict-sync.spec.ts`

**执行步骤**:

1. 创建 `e2e/conflict-sync.spec.ts`
2. 编写 4 个核心场景测试（见 architecture.md 6.2 节）
3. 运行 `npx playwright test e2e/conflict-sync.spec.ts`
4. 验证所有 4 个场景通过

**CI 配置**: 在 `playwright.ci.config.ts` 中添加该 spec 文件

---

## 二、Sprint 5 实施计划

**目标**: E3 Phase 1 — TypeScript noImplicitAny 全面修复
**总工时**: 3-4h

### E3-S1: tsconfig.json Strict 配置启用 + any 修复（3h）

**执行步骤**:

1. **扫描当前 any 类型**:
   ```bash
   cd vibex-fronted
   npx tsc --noEmit 2>&1 | grep "is implicitly has type 'any'" | wc -l
   
   # 列出所有 any 错误（按文件分组）
   npx tsc --noEmit 2>&1 | grep "is implicitly has type 'any'" > any-errors.txt
   sort any-errors.txt | uniq -c | sort -rn | head -50
   ```

2. **分类 + 排序修复优先级**:
   ```typescript
   interface AnyTypeError {
     file: string
     line: number
     variableName: string
     occurrenceCount: number  // 从 grep -c 统计
   }
   ```

3. **修复前 50 个高频 any**（按 PRD E3-S1 要求）:
   - 优先修复 `lib/` 和 `components/` 核心目录
   - 低频 any（出现 1-2 次）可暂时 `// @ts-expect-error`

4. **验证**: `tsc --noEmit` 错误数 ≤ 50

---

## 三、Sprint 6 实施计划

**目标**: E3 Phase 2 (strict) + E5 测试策略
**总工时**: 3-4h

### E3-S2: 剩余 any 类型全面修复（4h）

**执行步骤**:

1. 修复所有剩余 `any` 类型，目标减少 ≥ 80%
2. 启用 `strictPropertyInitialization: true`
3. 清理 `// @ts-ignore` 和 `// @ts-expect-error`
4. 在 GitHub Actions 添加 `tsc --strict` CI step

### E5-S1: 测试策略文档编写（1h）

**文件**: `vibex-fronted/docs/TESTING_STRATEGY.md`

```markdown
# VibeX 测试策略

## Jest 职责范围（单元 + 集成）
- 纯函数（utilities）
- React hooks（useAutoSave、useCanvasHistory 等）
- Zustand stores（action、selector 测试）
- 业务逻辑（data transformation、validation）

## Playwright 职责范围（E2E）
- 用户交互流程（点击、输入、导航）
- 页面渲染验证（UI 组件存在）
- 异步行为（动画、定时器）
- 跨页状态（beacon、sendBeacon、requestAnimationFrame）
- **禁止在 Jest 中测试 beacon/sendBeacon/rAF**

## 禁止模式
- `waitForTimeout(1000)` — 必须使用 `waitForResponse`/`waitForLoadState`
- `act()` 包装 beacon 调用 — beacon 是异步的，无法在 act 中等待
```

---

## 四、Sprint 7+ 实施计划

**目标**: E4 API 契约测试
**总工时**: 4-5h

### E4-S1: 契约测试框架初始化（1h）

**执行步骤**:

1. **选择 OpenAPI + Prism**:
   ```bash
   cd vibex-fronted
   npm install --save-dev @stoplight/prism-cli openapi-typescript
   ```

2. **创建契约目录**:
   ```bash
   mkdir -p vibex-fronted/tests/contracts/{consumers,providers}
   ```

3. **从现有 Zod schemas 生成 OpenAPI spec**:
   ```typescript
   // scripts/generate-openapi.ts
   import { generateSpec } from 'zod-to-openapi'
   // 从 CreateSnapshotSchema 生成 OpenAPI spec
   ```

### E4-S2: 契约定义（2h）

**覆盖端点**:
- `POST /v1/canvas/snapshots`（含 409 冲突响应）
- `GET /v1/canvas/snapshots`
- `POST /v1/canvas/snapshots/:id/restore`

### E4-S3: CI 集成（1h）

**GitHub Actions 配置**:
```yaml
- name: Contract Tests
  run: npx prism mock tests/contracts/openapi.yaml
  # 或使用 openapi-typescript 生成客户端进行验证
```

---

## 五、每日检查清单（Daily Checklist）

每个 Sprint 日结束时必须验证:

- [ ] 所有相关 `npm test` 通过（无 regression）
- [ ] E2 迁移进度：当前 canvasStore.ts 行数 vs 目标
- [ ] E1 测试：Playwright 冲突场景是否通过
- [ ] 代码变更已 commit 到对应 feature 分支
- [ ] 无新增 `console.error` 或 `any` 类型（除非必要 review）

---

## 六、回滚计划

| 场景 | 回滚策略 |
|------|---------|
| E2-S2 迁移后组件报错 | `git revert` 最近的迁移 commit；canvasStore.ts 回退到上一版本 |
| E1-S1 乐观锁引入 regression | 关闭乐观锁检查（`version` 字段仍携带，但后端不检查）|
| E3 tsconfig strict 引入大量编译错误 | 暂回退 `strict: false`，分文件逐个启用 |
| ConflictDialog 影响页面布局 | 条件渲染改用 `visible={false}` 而非条件卸载 |

---

## 七、工具与脚本

### 7.1 行数监控脚本

```bash
#!/bin/bash
# scripts/check-canvasstore-lines.sh
LINES=$(wc -l < vibex-fronted/src/lib/canvas/canvasStore.ts)
echo "canvasStore.ts: $LINES 行"
if [ "$LINES" -gt 300 ]; then
  echo "⚠️  超过 300 行目标!"
  exit 1
fi
echo "✅ 行数在目标范围内"
```

### 7.2 any 类型扫描脚本

```bash
#!/bin/bash
# scripts/scan-any-types.sh
cd vibex-fronted
COUNT=$(npx tsc --noEmit 2>&1 | grep "is implicitly has type 'any'" | wc -l)
echo "Implicit any 类型数: $COUNT"
if [ "$COUNT" -gt 50 ]; then
  echo "⚠️  超过 50 个目标!"
  exit 1
fi
echo "✅ any 类型数在目标范围内"
```

---

## 八、依赖关系图

```mermaid
gantt
    title Sprint 4+ 实施计划
    dateFormat  YYYY-MM-DD
    section Sprint 4
    E2-S1: 0d, 2d
    E2-S2: 2d, 4d
    E1-S1: 0d, 2d
    E1-S2: 4d, 7d
    E2-S3: 5d, 8d
    E1-S3: 7d, 9d
    section Sprint 5
    E3-S1: 9d, 12d
    section Sprint 6
    E3-S2: 12d, 16d
    E5-S1: 12d, 13d
    E5-S2: 13d, 15d
    section Sprint 7+
    E4-S1: 16d, 17d
    E4-S2: 17d, 19d
    E4-S3: 19d, 20d
```

---

*本文档由 Architect Agent 生成于 2026-04-03 03:10 GMT+8*
