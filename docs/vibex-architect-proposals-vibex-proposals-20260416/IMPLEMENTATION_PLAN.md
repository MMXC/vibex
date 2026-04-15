# VibeX Sprint 2 实现计划

**项目**: vibex-sprint2
**日期**: 2026-04-16
**作者**: Architect

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定

---

## 1. Unit Index（顶层索引）

| Epic | Unit | 名称 | 依赖 | 工时 | 优先级 | 状态 |
|------|------|------|------|------|--------|------|
| E1 | E1-U1 | Tab State 修复 | — | 1h | P0 | 待开始 |
| E2 | E2-U1 | 版本历史 API 集成 | — | 1h | P1 | 待开始 |
| E2 | E2-U2 | 版本列表 UI | E2-U1 | 1h | P1 | 待开始 |
| E2 | E2-U3 | Diff 查看功能 | E2-U2 | 1h | P1 | 待开始 |
| E3 | E3-U1 | JSON 导出 | — | 0.5h | P2 | 待开始 |
| E3 | E3-U2 | YAML 导出 | E3-U1 | 0.5h | P2 | 待开始 |
| E3 | E3-U3 | Round-trip 验证 | E3-U2 | 1h | P2 | 待开始 |
| E4 | E4-U1 | D1 Migration | — | 1h | P1 | 待开始 |
| E4 | E4-U2 | 三树数据序列化 | E4-U1 | 2h | P1 | 待开始 |
| E4 | E4-U3 | 三树数据恢复 | E4-U2 | 1.5h | P1 | 待开始 |
| E4 | E4-U4 | Dashboard 集成验证 | E4-U3 | 0.5h | P1 | 待开始 |

**总工时**: 11h（E1=1h, E2=3h, E3=2h, E4=5h）

---

## 2. Epic E1: Tab State 残留修复

### 2.1 E1-U1: Tab State 修复

| 属性 | 值 |
|------|-----|
| **Unit ID** | E1-U1 |
| **名称** | Tab State 修复 |
| **依赖** | 无 |
| **工时** | 1h |
| **优先级** | P0 |
| **状态** | 待开始 |

#### 验收标准

- [ ] Tab 切换后 `phase` 正确重置为 `context`
- [ ] Prototype accordion（queuePanelExpanded）切换 Tab 时关闭
- [ ] 不改动 canvasStore 核心逻辑
- [ ] `resetPanelState()` 在 Tab 变化时正确触发

#### 文件变更

```
Modified:
  vibex-fronted/src/components/canvas/CanvasPage.tsx
    - 增强 useEffect([activeTab]) 逻辑，调用 resetPanelState()
    - 添加 phase 重置：切换 Tab 时 setPhase('context')（非 prototype tab 时）

New:
  vibex-fronted/src/hooks/canvas/useCanvasPanels.ts
    - resetPanelState() 需重置: currentPhase → 'context', queuePanelExpanded → false, accordion 状态
```

#### 实现步骤

1. **分析 `useCanvasPanels` 中的 `resetPanelState`**：
   - 确认 `resetPanelState` 是否已存在
   - 若存在，确认是否同时重置 `phase` 和 `queuePanelExpanded`
   - 若不存在，创建该函数

2. **修改 CanvasPage.tsx 中的 Tab 切换逻辑**：
   - 在 `setActiveTab` 调用时，`useEffect` 监听 `activeTab` 变化
   - `useEffect` 内调用 `resetPanelState()` 重置面板状态
   - 非 prototype tab 时，`setPhase('context')` 确保 phase 不残留

3. **验证 Prototype accordion 关闭**：
   - `queuePanelExpanded` 需在 `resetPanelState` 中重置为 `false`

#### 风险

- **低风险**：只修改 CanvasPage.tsx 和 useCanvasPanels，不动 canvasStore
- 若 `resetPanelState` 已被其他地方引用，需确保不影响现有功能

---

## 3. Epic E2: 版本历史集成

### 3.1 E2-U1: 版本历史 API 集成

| 属性 | 值 |
|------|-----|
| **Unit ID** | E2-U1 |
| **名称** | 版本历史 API 集成 |
| **依赖** | 无 |
| **工时** | 1h |
| **优先级** | P1 |
| **状态** | 待开始 |

#### 验收标准

- [ ] `useVersionHistory` hook 能正确调用 `/v1/canvas/snapshots?projectId=xxx`
- [ ] Snapshot 列表正确解析（label, trigger, createdAt, version）
- [ ] 支持分页（limit/offset）

#### 文件变更

```
Modified:
  vibex-fronted/src/hooks/canvas/useVersionHistory.ts
    - 添加 fetchSnapshots(projectId, limit?, offset?)
    - 添加 snapshotDetail(snapshotId)
    - 添加 restoreSnapshot(snapshotId)
    - 添加 loading/error 状态

  vibex-fronted/src/services/api/types/snapshot.ts (New)
    - SnapshotListResponse
    - SnapshotDetailResponse
    - RestoreSnapshotResponse
```

#### 实现步骤

1. 创建 `services/api/types/snapshot.ts`，定义 API 响应类型
2. 扩展 `useVersionHistory` hook：
   - `fetchSnapshots(projectId, limit, offset)` → GET `/v1/canvas/snapshots`
   - `getSnapshot(snapshotId)` → GET `/v1/canvas/snapshots/:id`
   - `restoreSnapshot(snapshotId)` → POST `/v1/canvas/snapshots/:id/restore`
3. 添加 loading/error 状态管理
4. 单元测试覆盖 API 调用

#### 风险

- **低风险**：后端 API 已存在，前端只做消费
- 需确认 `projectId` 字段在 snapshot API 响应中的格式

### 3.2 E2-U2: 版本列表 UI

| 属性 | 值 |
|------|-----|
| **Unit ID** | E2-U2 |
| **名称** | 版本列表 UI |
| **依赖** | E2-U1 |
| **工时** | 1h |
| **优先级** | P1 |
| **状态** | 待开始 |

#### 验收标准

- [ ] VersionHistoryPanel 显示版本列表（label, trigger, createdAt）
- [ ] 显示 auto/manual/ai_complete 标签
- [ ] 支持加载更多（分页）
- [ ] 空状态友好提示

#### 文件变更

```
Modified:
  vibex-fronted/src/components/canvas/features/VersionHistoryPanel.tsx
    - 列表视图（已有骨架，需完善数据绑定）
    - 版本项展示（label + 时间 + trigger 标签）
    - 加载更多按钮

New:
  vibex-fronted/src/components/canvas/features/VersionHistoryPanel.module.css
    - 列表样式
```

#### 实现步骤

1. 读取现有 `VersionHistoryPanel.tsx` 实现
2. 绑定 `useVersionHistory` 的 snapshots 数组到列表
3. 每个 list item 显示：label、createdAt、trigger badge（auto=蓝，manual=灰，ai_complete=紫）
4. 底部「加载更多」按钮调用 `fetchSnapshots(..., offset + limit)`
5. 空状态：显示「暂无版本历史」

#### 风险

- **低风险**：依赖 E2-U1 的 API 集成完成

### 3.3 E2-U3: Diff 查看功能

| 属性 | 值 |
|------|-----|
| **Unit ID** | E2-U3 |
| **名称** | Diff 查看功能 |
| **依赖** | E2-U2 |
| **工时** | 1h |
| **优先级** | P1 |
| **状态** | 待开始 |

#### 验收标准

- [ ] 选择两个版本后，UI 显示结构化 diff
- [ ] 三树各自的 diff 独立展示（contexts/flows/components）
- [ ] 新增节点（绿色）、删除节点（红色）、修改节点（黄色）有视觉区分
- [ ] 支持一键恢复到某版本

#### 文件变更

```
Modified:
  vibex-fronted/src/components/canvas/features/VersionHistoryPanel.tsx
    - 添加版本对比模式
    - 添加 DiffViewer 子组件

New:
  vibex-fronted/src/components/canvas/features/DiffViewer.tsx (New)
    - Diff 算法（json-diff 或手写递归比较）
    - 三树 diff 独立展示
    - 节点级别 diff（added/removed/changed）
```

#### 实现步骤

1. 创建 `DiffViewer.tsx` 组件：
   - 输入：两个 snapshot 的 contexts/flows/components 数组
   - 使用递归比较算法，生成 diff 树
   - 输出：added/removed/changed 三类 diff items
2. 在 `VersionHistoryPanel` 中：
   - 用户选择两个版本 → 进入对比模式
   - 展示三个 DiffViewer（contexts/flows/components）
   - 每个 diff item 有颜色标识和操作按钮
3. 「恢复到该版本」按钮调用 `restoreSnapshot(snapshotId)`，恢复后关闭 panel

#### 风险

- **中风险**：Diff 算法复杂度。初期可用简单递归比较，后期优化
- 可先用 `json-diff` 库快速实现结构化 diff

---

## 4. Epic E3: 导入导出

### 4.1 E3-U1: JSON 导出

| 属性 | 值 |
|------|-----|
| **Unit ID** | E3-U1 |
| **名称** | JSON 导出 |
| **依赖** | 无 |
| **工时** | 0.5h |
| **优先级** | P2 |
| **状态** | 待开始 |

#### 验收标准

- [ ] 导出文件符合 `ProjectExport` 类型定义
- [ ] 文件后缀 `.vibex.json`
- [ ] 包含三树完整数据

#### 文件变更

```
Modified:
  vibex-fronted/src/services/export/ProjectExporter.ts (New or extend ZipExporter)
    - addProjectExportJSON()
    - addProjectExportYAML()
    - createProjectExportMetadata()

New:
  vibex-fronted/src/services/export/types/export-format.ts (New)
    - ProjectExport interface
```

#### 实现步骤

1. 创建 `ProjectExport` 类型（参考 architecture.md §3.2）
2. 创建 `serializeProject()` 函数，从 Zustand store 提取三树数据
3. 生成 JSON 字符串，使用 `Blob` + `URL.createObjectURL()` 下载
4. 文件名格式：`{projectName}_{YYYY-MM-DD}.vibex.json`

#### 风险

- **低风险**：纯前端逻辑，已有 ZipExporter 可参考

### 4.2 E3-U2: YAML 导出

| 属性 | 值 |
|------|-----|
| **Unit ID** | E3-U2 |
| **名称** | YAML 导出 |
| **依赖** | E3-U1 |
| **工时** | 0.5h |
| **优先级** | P2 |
| **状态** | 待开始 |

#### 验收标准

- [ ] 导出文件符合 `ProjectExport` 结构，YAML 格式
- [ ] 文件后缀 `.vibex.yaml`
- [ ] 可被 yaml 库正确解析

#### 文件变更

```
Modified:
  vibex-fronted/src/services/export/ProjectExporter.ts
    - addProjectExportYAML()
    - 使用 js-yaml 库序列化

New:
  vibex-fronted/package.json
    - 添加 js-yaml 依赖（如尚未引入）
```

#### 实现步骤

1. 确认 `js-yaml` 是否已安装
2. 复用 `ProjectExport` 类型（与 JSON 共用）
3. `yaml.dump(projectExport)` 生成 YAML 字符串
4. 下载方式同 JSON

#### 风险

- **低风险**：YAML 序列化依赖 js-yaml，确认依赖已存在

### 4.3 E3-U3: Round-trip 验证

| 属性 | 值 |
|------|-----|
| **Unit ID** | E3-U3 |
| **名称** | Round-trip 验证 |
| **依赖** | E3-U2 |
| **工时** | 1h |
| **优先级** | P2 |
| **状态** | 待开始 |

#### 验收标准

- [ ] 导入 JSON → 导出 JSON = 完全一致（内容相等）
- [ ] 导入 YAML → 导出 YAML = 完全一致（结构相等）
- [ ] 导入文件大小 > 5MB 时报错
- [ ] 禁止解析外部 URL（无网络请求）
- [ ] UI 提供导入入口（Dashboard 或 Canvas 内）

#### 文件变更

```
Modified:
  vibex-fronted/src/services/export/ImportService.ts (New)
    - parseJSON(content: string): ProjectExport
    - parseYAML(content: string): ProjectExport
    - validateFileSize(file: File): boolean

  vibex-fronted/src/services/export/ExportValidator.test.ts (New)
    - round-trip 测试用例

New:
  vibex-fronted/src/components/import/ImportModal.tsx (New)
    - 文件选择 + 预览 + 确认导入
```

#### 实现步骤

1. 创建 `ImportService.ts`：
   - `parseJSON/YAML`：解析文件内容，校验 `version` 字段
   - `validateFileSize`：读取 File.size，> 5MB 抛错
   - 不发送任何网络请求（无 fetch 外部 URL）
2. 创建 `ImportModal.tsx`：
   - drag-and-drop 文件区域
   - 解析后预览三树节点数
   - 确认后替换 Zustand store（三树数据 + projectName）
3. Round-trip 测试：
   - `importThenExport.test.ts`：导出一个项目 → 导入 → 再导出 → 比对
   - JSON 和 YAML 各一个测试用例

#### 风险

- **中风险**：YAML 解析时数字/布尔值类型可能不一致，需做结构化比对（非字符串比对）

---

## 5. Epic E4: 三树数据持久化

### 5.1 E4-U1: D1 Migration

| 属性 | 值 |
|------|-----|
| **Unit ID** | E4-U1 |
| **名称** | D1 Migration |
| **依赖** | 无 |
| **工时** | 1h |
| **优先级** | P1 |
| **状态** | 待开始 |

#### 验收标准

- [ ] Migration 在本地 D1 执行成功
- [ ] 表结构创建后，可正常读写三树数据
- [ ] Migration 合入前通过 CI

#### 文件变更

```
New:
  vibex-backend/src/db/migrations/0008_add_canvas_state.sql (New)
    - CREATE TABLE canvas_state (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        context_nodes TEXT NOT NULL,
        flow_nodes TEXT NOT NULL,
        component_nodes TEXT NOT NULL,
        saved_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    - CREATE INDEX idx_canvas_state_project_id ON canvas_state(project_id);

  vibex-backend/src/db/migrations/0009_alter_project_table.sql (New)
    - (如选择将三树存于 project.name 字段则无需此步)

  vibex-backend/wrangler.toml
    - 确保 D1 database binding 正确
```

#### 实现步骤

1. **方案选择**（两种，团队评审后决定）：
   
   **方案 A（推荐）**：新建 `canvas_state` 表，与 Project 一对一
   
   **方案 B**：将三树 JSON 存入 `Project.name` 字段（需验证字段长度限制）

2. **编写 Migration 文件**（方案 A）：
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

3. **本地验证**：
   ```bash
   wrangler d1 migrations apply vibex-db --local
   ```

4. **合入**：创建 PR，合入后 CI 自动部署

#### 风险

- **中风险**：SQLite 字段大小限制。JSON 序列化后可能超过 `TEXT` 字段的处理能力（但 D1 支持最大 10MB 行），实际三树数据预估 < 500KB，风险低

### 5.2 E4-U2: 三树数据序列化

| 属性 | 值 |
|------|-----|
| **Unit ID** | E4-U2 |
| **名称** | 三树数据序列化 |
| **依赖** | E4-U1 |
| **工时** | 2h |
| **优先级** | P1 |
| **状态** | 待开始 |

#### 验收标准

- [ ] `serializeThreeTrees(contexts, flows, components)` 返回符合 `ThreeTreesPayload` 的 JSON 字符串
- [ ] 保存项目时，三树数据随 Project 数据一并写入 D1
- [ ] 序列化过程有错误处理（JSON.stringify 失败时不 crash）

#### 文件变更

```
New:
  vibex-fronted/src/services/persistence/ThreeTreesSerializer.ts (New)
    - serializeThreeTrees(nodes)
    - deserializeThreeTrees(jsonStr)

  vibex-fronted/src/services/persistence/persistence.test.ts (New)
    - 序列化测试

Modified:
  vibex-fronted/src/hooks/canvas/useAutoSave.ts
    - 保存时调用 serializeThreeTrees() 并写入 API

  vibex-backend/src/routes/api/projects/[id].ts
    - 保存项目时接受三树数据字段
```

#### 实现步骤

1. 创建 `ThreeTreesSerializer.ts`：
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

2. 修改 `useAutoSave.ts`：保存时读取三树 → 序列化 → 写入 Project API
3. 修改后端 `PUT /api/projects/:id`：接受 `canvasState` 字段，写入 `canvas_state` 表

#### 风险

- **中风险**：时序问题（保存时三树状态可能正在变更），需使用 snapshot 而非 live state

### 5.3 E4-U3: 三树数据恢复

| 属性 | 值 |
|------|-----|
| **Unit ID** | E4-U3 |
| **名称** | 三树数据恢复 |
| **依赖** | E4-U2 |
| **工时** | 1.5h |
| **优先级** | P1 |
| **状态** | 待开始 |

#### 验收标准

- [ ] Dashboard 打开项目时，三树数据从 D1 读取并正确反序列化
- [ ] 反序列化后 Zustand store 正确填充（三树渲染正常）
- [ ] 无三树数据的旧项目正常打开（回退到空状态）

#### 文件变更

```
Modified:
  vibex-fronted/src/hooks/canvas/useCanvasStore.ts
    - 添加 loadThreeTrees(projectId) 方法

  vibex-fronted/src/hooks/useLoadProject.ts (New or extend)
    - 项目打开时调用 loadThreeTrees()

  vibex-fronted/src/components/dashboard/ProjectCard.tsx
    - 打开项目时触发三树恢复
```

#### 实现步骤

1. 创建 `deserializeThreeTrees(jsonStr)` 函数：
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

2. 在 `useCanvasStore` 或项目加载 hook 中：
   - 获取 `projectId`
   - GET `/api/projects/:id` 获取项目数据
   - 提取 `canvas_state` JSON（或从 project.name 解析）
   - `deserializeThreeTrees()`
   - `useContextStore.getState().setContextNodes(deserialized.contextNodes)`
   - `useFlowStore.getState().setFlowNodes(deserialized.flowNodes)`
   - `useComponentStore.getState().setComponentNodes(deserialized.componentNodes)`

3. 错误处理：旧项目无三树数据时返回 `null`，不 crash，正常打开空画布

#### 风险

- **低风险**：依赖 E4-U2 序列化完成和后端 API 改造
- 需处理「新建项目」场景（无三树数据）

### 5.4 E4-U4: Dashboard 集成验证

| 属性 | 值 |
|------|-----|
| **Unit ID** | E4-U4 |
| **名称** | Dashboard 集成验证 |
| **依赖** | E4-U3 |
| **工时** | 0.5h |
| **优先级** | P1 |
| **状态** | 待开始 |

#### 验收标准

- [ ] E2E 测试：新建项目 → 添加上下文/流程/组件节点 → 保存 → 关闭页面 → 从 Dashboard 重新打开 → 三树数据正确恢复
- [ ] 节点数量、节点名称完全一致

#### 文件变更

```
New:
  vibex-fronted/e2e/three-trees-persistence.spec.ts (New)
    - E2E 测试：三树持久化 round-trip
```

#### 实现步骤

1. 编写 Playwright E2E 测试：
   ```typescript
   test('should persist and restore three trees', async ({ page }) => {
     // 1. 新建项目
     await page.click('[data-testid="create-project"]');
     
     // 2. 添加上下文节点
     await page.click('[data-testid="add-context"]');
     await page.fill('[data-testid="context-name"]', 'TestContext');
     
     // 3. 添加流程节点
     await page.click('[data-testid="continue-to-flow"]');
     await page.click('[data-testid="add-flow"]');
     await page.fill('[data-testid="flow-name"]', 'TestFlow');
     
     // 4. 添加组件节点
     await page.click('[data-testid="continue-to-component"]');
     await page.click('[data-testid="add-component"]');
     await page.fill('[data-testid="component-name"]', 'TestComponent');
     
     // 5. 等待保存完成
     await page.waitForSelector('[data-testid="save-complete"]');
     
     // 6. 关闭页面
     await page.close();
     
     // 7. 从 Dashboard 重新打开
     await page.goto('/dashboard');
     await page.click('[data-testid="project-card"]:has-text("TestProject")');
     
     // 8. 验证三树数据恢复
     await expect(page.locator('[data-testid="context-node"]:has-text("TestContext")')).toBeVisible();
     await expect(page.locator('[data-testid="flow-node"]:has-text("TestFlow")')).toBeVisible();
     await expect(page.locator('[data-testid="component-node"]:has-text("TestComponent")')).toBeVisible();
   });
   ```

#### 风险

- **低风险**：端到端测试，验证完整性

---

## 6. 风险汇总

| 风险 | 影响 Epic | 缓解措施 |
|------|-----------|----------|
| D1 Migration 合入失败 | E4 | 先本地验证，提供回滚 SQL |
| 三树数据量超限 | E4 | 预估 < 500KB，远低于 D1 限制 |
| YAML round-trip 类型不一致 | E3 | 使用结构化比对而非字符串比对 |
| Diff 算法复杂度过高 | E2 | 初期用 `json-diff` 库，后期优化 |
| Tab 切换时 state 竞争 | E1 | useEffect 依赖数组正确设置 |

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定