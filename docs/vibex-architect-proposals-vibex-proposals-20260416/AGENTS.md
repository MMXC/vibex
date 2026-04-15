# VibeX Sprint 2 — Dev Agent 任务清单

**项目**: vibex-sprint2
**日期**: 2026-04-16
**作者**: Architect

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定

---

## 1. 开发约束（所有 Epic 通用）

### 1.1 代码规范

- **无 any 类型泄漏**：所有类型必须显式定义，禁止 `any`
- **无 canvasLogger.default.debug**：Debug 日志禁用（保留 info/error）
- **无直接修改 canvasStore 核心**：E1 以外的所有 Epic 如需修改 store，通过 hook 间接访问
- **组件接收 slice props**：不直接从多个 canvasStore slice 获取数据，通过 `useCanvasStore` 封装

### 1.2 提交规范

- 每个 Unit 独立提交，commit message 格式：`[E{n}-U{m}] <描述>`
- 示例：`[E1-U1] fix: reset phase state on tab switch`
- PR 标题格式：`[Sprint 2] E{n}: <Epic 名称>`
- 每个 PR 需包含测试用例（Vitest 单元测试或 Playwright E2E）

### 1.3 审查要点

- TypeScript 类型覆盖完整
- 错误处理（try/catch + 用户可见的错误提示）
- 状态更新后 UI 响应正确
- 不引入新的 bundlesize regression（参考 E6 CI 基线）

---

## 2. Dev Agent 任务分配

### 2.1 Epic E1: Tab State 残留修复

#### E1-U1: Tab State 修复

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent（分配给具体开发者）|
| **依赖** | 无 |
| **预计工时** | 1h |
| **优先级** | P0 |
| **产出** | PR: `[Sprint 2] E1: Tab State 修复` |

**任务清单**:

1. 阅读 `CanvasPage.tsx` 第 150-180 行（useCanvasPanels 调用 + useEffect）
2. 检查 `useCanvasPanels.ts` 中的 `resetPanelState()` 实现
3. 如 `resetPanelState` 不重置 `phase`，添加：
   ```typescript
   setPhase('context');
   ```
4. 如 `resetPanelState` 不重置 `queuePanelExpanded`，添加：
   ```typescript
   setQueuePanelExpanded(false);
   ```
5. 验证 `useEffect([activeTab], () => resetPanelState())` 存在且依赖正确
6. 编写 Vitest 测试：`canvas-tab-state.spec.ts`（Tab 切换 → phase 重置）

**验收检查**:
- [ ] `setPhase('context')` 在非 prototype tab 时被调用
- [ ] `queuePanelExpanded` 切换 Tab 时重置为 false
- [ ] Vitest 测试通过

---

### 2.2 Epic E2: 版本历史集成

#### E2-U1: 版本历史 API 集成

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | 无 |
| **预计工时** | 1h |
| **优先级** | P1 |
| **产出** | PR: `[Sprint 2] E2-U1: 版本历史 API 集成` |

**任务清单**:

1. 创建 `src/services/api/types/snapshot.ts`：
   ```typescript
   export interface SnapshotListItem {
     snapshotId: string;
     projectId: string;
     label: string;
     trigger: 'manual' | 'auto' | 'ai_complete';
     createdAt: string;
     version: number;
     contextCount: number;
     flowCount: number;
     componentCount: number;
     isAutoSave: boolean;
   }
   
   export interface SnapshotListResponse {
     snapshots: SnapshotListItem[];
     total: number;
     limit: number;
     offset: number;
   }
   ```
2. 扩展 `src/hooks/canvas/useVersionHistory.ts`：
   - 添加 `fetchSnapshots(projectId, limit, offset)` → 调用 GET `/v1/canvas/snapshots`
   - 添加 `getSnapshot(snapshotId)` → GET `/v1/canvas/snapshots/:id`
   - 添加 `restoreSnapshot(snapshotId)` → POST `/v1/canvas/snapshots/:id/restore`
   - 添加 `loading` 和 `error` 状态
3. 单元测试覆盖 API 调用逻辑

**验收检查**:
- [ ] 类型定义完整，无 any
- [ ] 三个 API 方法正确调用
- [ ] 单元测试 > 80% 覆盖率

#### E2-U2: 版本列表 UI

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | E2-U1 |
| **预计工时** | 1h |
| **优先级** | P1 |
| **产出** | PR: `[Sprint 2] E2-U2: 版本列表 UI` |

**任务清单**:

1. 阅读现有 `VersionHistoryPanel.tsx` 组件
2. 绑定 `useVersionHistory.snapshots` 到列表渲染
3. 每个版本项显示：
   - label（主文本）
   - createdAt（格式化：YYYY-MM-DD HH:mm）
   - trigger badge（auto=蓝色，manual=灰色，ai_complete=紫色）
4. 底部「加载更多」按钮，offset + limit 分页
5. 空状态：暂无版本历史

**验收检查**:
- [ ] 列表正确渲染
- [ ] trigger badge 样式正确
- [ ] 分页功能可用

#### E2-U3: Diff 查看功能

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | E2-U2 |
| **预计工时** | 1h |
| **优先级** | P1 |
| **产出** | PR: `[Sprint 2] E2-U3: Diff 查看功能` |

**任务清单**:

1. 安装 `json-diff` 库：`npm install --save-dev json-diff`
2. 创建 `src/components/canvas/features/DiffViewer.tsx`：
   - 输入：两个 snapshot 的 contexts/flows/components 数组
   - 使用 `json-diff.diff()` 生成差异
   - 渲染：added=绿色背景，removed=红色背景+删除线，changed=黄色背景
3. 在 `VersionHistoryPanel` 中：
   - 用户选择两个版本 → 进入对比模式
   - 展示三个 DiffViewer（contexts/flows/components 分开）
4. 「恢复到该版本」按钮调用 `restoreSnapshot(snapshotId)`

**验收检查**:
- [ ] 三树 diff 独立展示
- [ ] 颜色区分 added/removed/changed
- [ ] 恢复功能正常

---

### 2.3 Epic E3: 导入导出

#### E3-U1: JSON 导出

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | 无 |
| **预计工时** | 0.5h |
| **优先级** | P2 |
| **产出** | PR: `[Sprint 2] E3-U1: JSON 导出` |

**任务清单**:

1. 创建 `src/services/export/types/export-format.ts`（ProjectExport 类型）
2. 创建 `src/services/export/ProjectExporter.ts`：
   - `serializeProject()`：从 Zustand store 提取三树，生成 `ProjectExport`
   - `downloadAsJSON(projectExport)`：`Blob` + `URL.createObjectURL()` 下载
   - 文件名：`{projectName}_{YYYY-MM-DD}.vibex.json`
3. 入口：ProjectBar 或 Canvas toolbar 的「导出」按钮

**验收检查**:
- [ ] 导出文件符合 ProjectExport 类型
- [ ] 包含完整三树数据
- [ ] 文件名格式正确

#### E3-U2: YAML 导出

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | E3-U1 |
| **预计工时** | 0.5h |
| **优先级** | P2 |
| **产出** | PR: `[Sprint 2] E3-U2: YAML 导出` |

**任务清单**:

1. 确认 `js-yaml` 已安装：`npm list js-yaml`
2. 在 `ProjectExporter.ts` 添加：
   - `downloadAsYAML(projectExport)`：使用 `yaml.dump()` 生成 YAML
   - 文件名：`{projectName}_{YYYY-MM-DD}.vibex.yaml`
3. 导出按钮增加格式选择（JSON / YAML）

**验收检查**:
- [ ] YAML 可被 `yaml.load()` 正确解析
- [ ] 文件格式与 JSON 一致（数据内容相同）

#### E3-U3: Round-trip 验证

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | E3-U2 |
| **预计工时** | 1h |
| **优先级** | P2 |
| **产出** | PR: `[Sprint 2] E3-U3: Round-trip 验证` |

**任务清单**:

1. 创建 `src/services/export/ImportService.ts`：
   - `parseJSON(content: string): ProjectExport`
   - `parseYAML(content: string): ProjectExport`
   - `validateFileSize(file: File): boolean` — > 5MB 抛错
   - **禁止任何网络请求**（无 fetch 调用）
2. 创建 `src/components/import/ImportModal.tsx`：
   - drag-and-drop 文件区域
   - 解析后预览（显示三树节点数）
   - 确认后替换 Zustand store
3. 测试：
   - `export-import-roundtrip.test.ts`：导出一个项目 → 导入 → 再导出 → 结构比对
   - JSON 和 YAML 各一个用例

**验收检查**:
- [ ] round-trip 测试通过（内容完全一致）
- [ ] > 5MB 文件报错
- [ ] 无网络请求（禁止 fetch）
- [ ] 导入 UI 可用

---

### 2.4 Epic E4: 三树数据持久化

#### E4-U1: D1 Migration

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent（需有 Cloudflare Workers 部署权限）|
| **依赖** | 无 |
| **预计工时** | 1h |
| **优先级** | P1 |
| **产出** | PR: `[Sprint 2] E4-U1: D1 Migration` |

**任务清单**:

1. **确认方案**：评审时确定用「canvas_state 表」还是「project.name 字段」
2. 编写 migration SQL（假设方案 A）：
   ```sql
   CREATE TABLE IF NOT EXISTS canvas_state (
     id TEXT PRIMARY KEY,
     project_id TEXT NOT NULL UNIQUE,
     context_nodes TEXT NOT NULL DEFAULT '[]',
     flow_nodes TEXT NOT NULL DEFAULT '[]',
     component_nodes TEXT NOT NULL DEFAULT '[]',
     saved_at TEXT NOT NULL,
     FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
   );
   CREATE INDEX IF NOT EXISTS idx_canvas_state_project ON canvas_state(project_id);
   ```
3. 命名迁移文件：`0008_add_canvas_state.sql`
4. **本地验证**：
   ```bash
   wrangler d1 migrations apply vibex-db --local
   ```
   验证表创建成功
5. **测试数据**：
   - 插入测试数据，验证读写
6. 合入 PR 后 CI 自动部署

**验收检查**:
- [ ] 迁移文件命名正确（0008_*.sql）
- [ ] 本地 D1 执行成功
- [ ] 表结构符合设计
- [ ] FK 外键约束正确

#### E4-U2: 三树数据序列化

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | E4-U1 |
| **预计工时** | 2h |
| **优先级** | P1 |
| **产出** | PR: `[Sprint 2] E4-U2: 三树数据序列化` |

**任务清单**:

1. 创建 `src/services/persistence/ThreeTreesSerializer.ts`：
   ```typescript
   interface ThreeTreesPayload {
     version: 1;
     contextNodes: BoundedContextNode[];
     flowNodes: BusinessFlowNode[];
     componentNodes: ComponentNode[];
     savedAt: string;  // ISO 8601
   }
   
   export function serializeThreeTrees(
     contexts: BoundedContextNode[],
     flows: BusinessFlowNode[],
     components: ComponentNode[]
   ): string {
     const payload: ThreeTreesPayload = {
       version: 1,
       contextNodes: contexts,
       flowNodes: flows,
       componentNodes: components,
       savedAt: new Date().toISOString(),
     };
     return JSON.stringify(payload);
   }
   ```
2. 错误处理：`JSON.stringify` 失败时返回 `'{}'` 并记录 error 日志
3. 修改 `useAutoSave.ts`：保存时读取三树 → 序列化 → 写入 API
4. 修改后端 `PUT /api/projects/:id`：接受 `canvasState` 字段，写入 D1
5. 单元测试：序列化各种边界情况（空数组、单节点、深嵌套）

**验收检查**:
- [ ] 序列化函数正确返回 JSON 字符串
- [ ] 保存时三树数据写入 D1
- [ ] 单元测试覆盖率 > 85%
- [ ] 错误场景不 crash

#### E4-U3: 三树数据恢复

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | E4-U2 |
| **预计工时** | 1.5h |
| **优先级** | P1 |
| **产出** | PR: `[Sprint 2] E4-U3: 三树数据恢复` |

**任务清单**:

1. 在 `ThreeTreesSerializer.ts` 添加反序列化：
   ```typescript
   export function deserializeThreeTrees(jsonStr: string): ThreeTreesPayload | null {
     try {
       const payload = JSON.parse(jsonStr);
       if (payload.version !== 1) throw new Error('Unsupported version');
       return payload;
     } catch {
       return null;  // 旧项目或损坏数据
     }
   }
   ```
2. 修改项目加载流程（`useLoadProject` 或 CanvasPage useEffect）：
   - 获取 `projectId`
   - GET `/api/projects/:id` 获取项目
   - 提取 canvas_state JSON
   - `deserializeThreeTrees()`
   - 恢复三树到 Zustand store：`setContextNodes()`, `setFlowNodes()`, `setComponentNodes()`
3. 旧项目兼容：无 canvas_state 时正常打开空画布，不报错
4. 单元测试：反序列化正常/损坏数据

**验收检查**:
- [ ] 反序列化正确恢复三树状态
- [ ] 旧项目（无三树数据）正常打开
- [ ] 损坏数据不 crash

#### E4-U4: Dashboard 集成验证

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | E4-U3 |
| **预计工时** | 0.5h |
| **优先级** | P1 |
| **产出** | PR: `[Sprint 2] E4-U4: Dashboard 集成验证` |

**任务清单**:

1. 编写 Playwright E2E 测试 `e2e/three-trees-persistence.spec.ts`：
   - 新建项目 → 添加上下文/流程/组件节点 → 保存 → 关闭 → 重新打开 → 验证节点存在
2. 运行测试，确保通过

**验收检查**:
- [ ] E2E 测试通过
- [ ] 三树节点数量/名称完全一致

---

## 3. 提交顺序建议

```
E1-U1 → E2-U1 → E2-U2 → E2-U3 → E3-U1 → E3-U2 → E3-U3 → E4-U1 → E4-U2 → E4-U3 → E4-U4
```

- E1 先完成（P0 阻塞体验）
- E2 三个 unit 连续（API → UI → Diff）
- E3 三个 unit 连续（JSON → YAML → round-trip）
- E4-U1 先完成（migration 是其他 unit 的前置）

---

## 4. PR 合并后检查清单

- [ ] bundlesize 无 regression（参考 E6 CI 基线）
- [ ] 所有单元测试通过（`npm test`）
- [ ] 所有 E2E 测试通过（`npx playwright test`）
- [ ] TypeScript 类型检查通过（`npx tsc --noEmit`）
- [ ] 无 any 类型泄漏
- [ ] changelog 更新（如果是 user-facing 功能）

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定