# Implementation Plan: VibeX Sprint 2

**项目**: vibex-sprint2-20260415
**日期**: 2026-04-16
**Agent**: architect
**总工时**: 11h（E1=1h / E2=3h / E3=2h / E4=5h）

---

## 执行决策

- **决策**: 待评审
- **执行项目**: vibex-sprint2-20260415
- **执行日期**: 待定

---

## 1. Unit Index（顶层索引）

| Epic | Unit | 名称 | 工时 | 优先级 | 依赖 | 状态 |
|------|------|------|------|--------|------|------|
| E1 | E1-U1 | Tab State 修复 | 1h | P0 | — | 待派发 |
| E2 | E2-U1 | 版本历史 API 集成 | 1h | P1 | — | 待派发 |
| E2 | E2-U2 | 版本列表 UI | 1h | P1 | E2-U1 | 待派发 |
| E2 | E2-U3 | Diff 查看 + 恢复 | 1h | P1 | E2-U2 | 待派发 |
| E3 | E3-U1 | JSON 导出 | 0.5h | P2 | — | 待派发 |
| E3 | E3-U2 | YAML 导出 | 0.5h | P2 | E3-U1 | 待派发 |
| E3 | E3-U3 | Round-trip 验证 | 1h | P2 | E3-U2 | 待派发 |
| E4 | E4-U1 | D1 Migration 验证 | 1h | P1 | — | 待派发 |
| E4 | E4-U2 | 三树数据序列化 | 2h | P1 | E4-U1 | 待派发 |
| E4 | E4-U3 | 三树数据恢复 | 1.5h | P1 | E4-U2 | 待派发 |
| E4 | E4-U4 | Dashboard 集成验证 | 0.5h | P1 | E4-U3 | 待派发 |

**推荐实施顺序**: E1 → E2-U1 → E2-U2 → E2-U3 → E3-U1 → E3-U2 → E3-U3 → E4-U1 → E4-U2 → E4-U3 → E4-U4

---

## 2. Epic E1: Tab State 残留修复

### E1-U1: Tab State 修复

| 属性 | 值 |
|------|-----|
| **Unit ID** | E1-U1 |
| **名称** | Tab State 修复 |
| **依赖** | 无 |
| **工时** | 1h |
| **优先级** | P0 |
| **状态** | 待派发 |

#### 验收标准

- AC1: [可验证条件] Tab 切换到 context 时，`phase` 状态变为 `'input'`
- AC2: [边界条件] Prototype accordion 在离开 prototype tab 时自动关闭（`phase !== 'prototype'`）
- AC3: [可验证条件] `resetPanelState()` 在 Tab 变化时被调用，`queuePanelExpanded = false`
- AC4: [回归条件] 切换到其他 tab 不影响 canvasStore 核心逻辑

#### 文件变更

```
Modified:
  vibex-fronted/src/components/canvas/CanvasPage.tsx
    - Line 216-218: useEffect([activeTab]) 中增加 setPhase('input') 调用
```

#### 实现步骤

1. **确认 `phase`/`setPhase` 在 CanvasPage scope 内**：
   - `phase` 来自 `useCanvasStore()`（Line 109）
   - `setPhase` 来自 `useCanvasStore()`（Line 115）

2. **修改 useEffect（Line 216-218）**：
   ```typescript
   useEffect(() => {
     resetPanelState();
     setPhase('input'); // ← 新增：Tab 切换时重置 phase
   }, [activeTab, resetPanelState, setPhase]);
   ```

3. **添加测试覆盖**：
   - `vitest test src/components/canvas/__tests__/CanvasPage.test.tsx`
   - 覆盖 Tab 切换 → phase 重置场景

#### 风险

- **低风险**：一行代码改动，不碰 canvasStore 核心
- 需确认 `setPhase` 在 useEffect 依赖数组中（避免闭包过期）

---

## 3. Epic E2: 版本历史集成

### E2-U1: 版本历史 API 集成

| 属性 | 值 |
|------|-----|
| **Unit ID** | E2-U1 |
| **名称** | 版本历史 API 集成 |
| **依赖** | 无 |
| **工时** | 1h |
| **优先级** | P1 |
| **状态** | 待派发 |

#### 验收标准

- AC1: [可验证条件] `useVersionHistory` hook 能正确调用 `/v1/canvas/snapshots?projectId=xxx`
- AC2: [可验证条件] Snapshot 列表正确解析（label, trigger, createdAt, version, isAutoSave）
- AC3: [边界条件] 空 projectId 时返回空列表，不报错

#### 文件变更

```
Modified:
  vibex-fronted/src/services/api/modules/prototype.ts
    - 确认 useVersionHistory 与实际 API 接口匹配（若有偏差需对齐类型）

New:
  vibex-fronted/src/hooks/canvas/useVersionHistory.ts
    - 如 hook 不存在则新建（17 tests 已覆盖，参考 specs/）
```

#### 实现步骤

1. **验证 API 接口匹配性**：
   - 对比 `useVersionHistory` 返回类型与 `SnapshotListResponse` 接口
   - 如有不匹配，修正 hook 返回类型或调整 API 消费逻辑

2. **验证 API 端点可达性**：
   ```bash
   curl "https://api.vibex.top/v1/canvas/snapshots?projectId=test-project"
   ```

3. **添加 TypeScript 类型验证**

#### 风险

- **中风险**：hook 与 API 接口可能不匹配，需先验证兼容性

---

### E2-U2: 版本列表 UI

| 属性 | 值 |
|------|-----|
| **Unit ID** | E2-U2 |
| **名称** | 版本列表 UI |
| **依赖** | E2-U1 |
| **工时** | 1h |
| **优先级** | P1 |
| **状态** | 待派发 |

#### 验收标准

- AC1: [可验证条件] VersionHistoryDialog 显示版本列表（label, createdAt, trigger badge）
- AC2: [边界条件] isAutoSave 标记正确区分手动/自动快照
- AC3: [性能条件] 列表加载 < 1s（20 条以内）

#### 文件变更

```
New:
  vibex-fronted/src/components/canvas/VersionHistoryDialog.tsx
    - Dialog 组件，包含 snapshot 列表渲染
    - 支持 select 两个版本进行 diff

Modified:
  vibex-fronted/src/components/canvas/CanvasPage.tsx
    - 添加 VersionHistoryDialog 入口（如工具栏按钮）
  vibex-fronted/src/app/canvas/page.tsx
    - 挂载 VersionHistoryDialog
```

#### 实现步骤

1. **创建 VersionHistoryDialog 组件**：
   - 使用 `useVersionHistory(projectId)` 获取列表
   - 列表项显示：label、createdAt（相对时间）、trigger badge
   - "自动保存"用不同样式区分

2. **集成到 CanvasPage 工具栏**：
   - 添加 "版本历史" 按钮（时钟图标）

3. **测试**：Playwright E2E 验证列表显示

#### 风险

- **低风险**：纯 UI 组件，已有数据源

---

### E2-U3: Diff 查看 + 版本恢复

| 属性 | 值 |
|------|-----|
| **Unit ID** | E2-U3 |
| **名称** | Diff 查看 + 版本恢复 |
| **依赖** | E2-U2 |
| **工时** | 1h |
| **优先级** | P1 |
| **状态** | 待派发 |

#### 验收标准

- AC1: [可验证条件] 选择两个版本后，diff 面板显示 added/removed/changed 差异
- AC2: [可验证条件] json-diff 结构化比较三树差异（contexts/flows/components 独立展示）
- AC3: [可验证条件] "恢复此版本" 按钮触发 `POST /v1/canvas/snapshots/:id/restore`
- AC4: [边界条件] 恢复后三树 Zustand 状态更新，UI 刷新

#### 文件变更

```
Modified:
  vibex-fronted/src/components/canvas/VersionHistoryDialog.tsx
    - 添加 diff 比较视图（使用 json-diff 库）
    - 添加 "恢复版本" 按钮和确认 dialog
  vibex-fronted/package.json
    - 添加 "json-diff": "^1.0.0" 依赖
```

#### 实现步骤

1. **安装 json-diff**：
   ```bash
   cd vibex-fronted && pnpm add json-diff
   ```

2. **实现 Diff 视图**：
   - 用户选中两个版本 → 调用 `jsonDiff.diff(snapshotA.data, snapshotB.data)`
   - 结果渲染为 added（绿）/ removed（红）/ changed（黄）三栏

3. **实现版本恢复**：
   - 调用 `POST /v1/canvas/snapshots/:id/restore`
   - 恢复结果写入 Zustand 三树状态
   - 关闭 dialog，刷新 Canvas

4. **测试**：Vitest 覆盖 diff 逻辑，Playwright E2E 覆盖完整流程

#### 风险

- **低风险**：json-diff 库成熟稳定

---

## 4. Epic E3: 导入导出

### E3-U1: JSON 导出

| 属性 | 值 |
|------|-----|
| **Unit ID** | E3-U1 |
| **名称** | JSON 导出 |
| **依赖** | 无 |
| **工时** | 0.5h |
| **优先级** | P2 |
| **状态** | 待派发 |

#### 验收标准

- AC1: [可验证条件] 点击"导出 JSON"后生成包含 `version/data/metadata` 的 JSON 文件
- AC2: [性能条件] 5MB 以内文件导出 < 500ms
- AC3: [边界条件] 文件超过 5MB 时显示明确错误提示，不触发下载

#### 文件变更

```
New:
  vibex-fronted/src/services/export/ExportService.ts
    - exportAsJSON(projectName: string): Promise<Blob>
    - validateFileSize(blob: Blob): boolean

Modified:
  vibex-fronted/src/components/canvas/ExportPanel.tsx
    - 添加导出 UI 和导出按钮
```

#### 实现步骤

1. **创建 ExportService**：
   ```typescript
   export async function exportAsJSON(projectName: string): Promise<Blob> {
     const { contextNodes, flowNodes, componentNodes } = useCanvasStore.getState();
     const payload: ProjectExport = {
       version: '1.0.0',
       exportedAt: new Date().toISOString(),
       projectName,
       data: { contexts: contextNodes, flows: flowNodes, components: componentNodes },
       metadata: { appVersion: '2.x', format: 'json', nodeCount: { ... } },
     };
     const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
     if (!validateFileSize(blob)) throw new Error('文件超过 5MB');
     return blob;
   }
   ```

2. **集成导出按钮到 CanvasPage 或导出面板**

3. **测试**：Vitest + Playwright

#### 风险

- **低风险**：纯序列化，无外部依赖

---

### E3-U2: YAML 导出

| 属性 | 值 |
|------|-----|
| **Unit ID** | E3-U2 |
| **名称** | YAML 导出 |
| **依赖** | E3-U1 |
| **工时** | 0.5h |
| **优先级** | P2 |
| **状态** | 待派发 |

#### 验收标准

- AC1: [可验证条件] 导出 YAML 文件可被 `js-yaml` 正确解析
- AC2: [可验证条件] YAML 内容与 JSON 导出语义等价

#### 文件变更

```
Modified:
  vibex-fronted/package.json
    - 添加 "js-yaml": "^4.1.0" 依赖
  vibex-fronted/src/services/export/ExportService.ts
    - 添加 exportAsYAML(projectName: string): Promise<Blob>
  vibex-fronted/src/components/canvas/ExportPanel.tsx
    - 添加 "导出 YAML" 按钮
```

#### 实现步骤

1. **安装 js-yaml**：`pnpm add js-yaml`
2. **实现 exportAsYAML**：使用 `yaml.dump()` 序列化
3. **测试**

#### 风险

- **低风险**：js-yaml 成熟

---

### E3-U3: Round-trip 验证

| 属性 | 值 |
|------|-----|
| **Unit ID** | E3-U3 |
| **名称** | Round-trip 验证 |
| **依赖** | E3-U2 |
| **工时** | 1h |
| **优先级** | P2 |
| **状态** | 待派发 |

#### 验收标准

- AC1: [可验证条件] JSON: serialize → deserialize === original
- AC2: [可验证条件] YAML: serialize → deserialize === original（忽略空白）
- AC3: [边界条件] 导入时解析失败显示明确错误

#### 文件变更

```
New:
  vibex-fronted/src/services/import/ImportService.ts
    - parseJSON(content: string): ProjectExport
    - parseYAML(content: string): ProjectExport
    - roundTripTest(exportData: ProjectExport): boolean

Modified:
  vibex-fronted/src/components/canvas/ImportPanel.tsx
    - 文件上传 UI，导入后恢复三树状态
```

#### 实现步骤

1. **创建 ImportService**：
   - `parseJSON`: `JSON.parse` + schema 验证
   - `parseYAML`: `yaml.load` + schema 验证
   - `roundTripTest`: 序列化 → 反序列化 → 对比

2. **创建 ImportPanel**：
   - 文件上传 → 解析 → 验证 → 写入 Zustand

3. **自动化 round-trip 测试**：Vitest 对所有节点类型跑测试

#### 风险

- **低风险**：有完整的 AC 定义

---

## 5. Epic E4: 三树数据持久化

### E4-U1: D1 Migration 验证

| 属性 | 值 |
|------|-----|
| **Unit ID** | E4-U1 |
| **名称** | D1 Migration 验证 |
| **依赖** | 无 |
| **工时** | 1h |
| **优先级** | P1 |
| **状态** | 待派发 |

#### 验收标准

- AC1: [可验证条件] `CanvasSnapshot.data` 字段支持 JSON 存储 `{contextNodes, flowNodes, componentNodes}`
- AC2: [可验证条件] D1 migration 在 staging 通过，无数据丢失
- AC3: [边界条件] migration 回滚脚本可用

#### 文件变更

```
确认:
  vibex-backend/drizzle/migrations/
    - 0006_canvas_snapshot 已存在，检查 data 字段类型为 TEXT（JSON）

New (如需):
  vibex-backend/drizzle/migrations/0007_xxx.sql
    - 如 data 字段需扩展，创建 migration
```

#### 实现步骤

1. **检查现有 migration**：
   ```bash
   cat vibex-backend/drizzle/migrations/0006_*.sql | grep -A5 "data"
   ```

2. **验证 D1 schema**：
   ```bash
   wrangler d1 execute vibex-db --local --file=drizzle/migrations/0006_*.sql
   ```

3. **确认 data 字段可存储 JSON（TEXT 类型足够）**

#### 风险

- **中风险**：需真实 D1 环境验证

---

### E4-U2: 三树数据序列化

| 属性 | 值 |
|------|-----|
| **Unit ID** | E4-U2 |
| **名称** | 三树数据序列化 |
| **依赖** | E4-U1 |
| **工时** | 2h |
| **优先级** | P1 |
| **状态** | 待派发 |

#### 验收标准

- AC1: [可验证条件] `serializeThreeTrees()` 生成 `CanvasSnapshotData` JSON，含 version/savedAt
- AC2: [可验证条件] 空三树序列化不报错，JSON 可用
- AC3: [性能条件] 500KB 三树数据序列化 < 20ms

#### 文件变更

```
New:
  vibex-fronted/src/lib/canvas/serialize.ts
    - serializeThreeTrees(contexts, flows, components): CanvasSnapshotData
    - deserializeThreeTrees(jsonStr): CanvasSnapshotData
    - restoreStore(payload: CanvasSnapshotData): void  → 写入 Zustand

Modified:
  vibex-fronted/src/hooks/canvas/useAutoSave.ts
    - 在保存时调用 serializeThreeTrees，结果写入 CanvasSnapshot.data
```

#### 实现步骤

1. **创建 serialize.ts**：
   - `serializeThreeTrees`: 从 Zustand 提取三树 + 包装为 CanvasSnapshotData
   - `deserializeThreeTrees`: 解析 JSON + 验证 schema

2. **集成到 useAutoSave**：
   - 当前 useAutoSave 保存 canvas 状态
   - 修改为：序列化三树 → 作为 CanvasSnapshot.data 写入

3. **测试**：Vitest 覆盖序列化/反序列化

#### 风险

- **低风险**：纯前端逻辑，无外部依赖

---

### E4-U3: 三树数据恢复

| 属性 | 值 |
|------|-----|
| **Unit ID** | E4-U3 |
| **名称** | 三树数据恢复 |
| **依赖** | E4-U2 |
| **工时** | 1.5h |
| **优先级** | P1 |
| **状态** | 待派发 |

#### 验收标准

- AC1: [可验证条件] Dashboard 打开项目时，从 CanvasSnapshot.data 恢复三树到 Zustand
- AC2: [边界条件] 无 snapshot 记录时显示空画布，不报错
- AC3: [可验证条件] 恢复后 Canvas UI 正确渲染三树节点

#### 文件变更

```
Modified:
  vibex-fronted/src/hooks/canvas/useAutoSave.ts
    - loadProject(): 从 API 获取最新 snapshot → deserialize → restoreStore

New:
  vibex-fronted/src/hooks/canvas/useProjectLoader.ts
    - useProjectLoader(projectId): 加载项目 + 恢复三树状态
```

#### 实现步骤

1. **创建 useProjectLoader hook**：
   - 调用 `GET /v1/canvas/snapshots?projectId=xxx&limit=1`（最新）
   - 解析 `CanvasSnapshot.data` JSON
   - 调用 `restoreStore()` 恢复三树

2. **集成到 CanvasPage**：
   - `useEffect(() => { loadProject(projectId); }, [projectId])`

3. **测试**：Playwright E2E 覆盖打开 → 恢复流程

#### 风险

- **低风险**

---

### E4-U4: Dashboard 集成验证

| 属性 | 值 |
|------|-----|
| **Unit ID** | E4-U4 |
| **名称** | Dashboard 集成验证 |
| **依赖** | E4-U3 |
| **工时** | 0.5h |
| **优先级** | P1 |
| **状态** | 待派发 |

#### 验收标准

- AC1: [可验证条件] 从 Dashboard 点击项目进入 Canvas，三树完整恢复
- AC2: [回归条件] Dashboard 项目列表不显示三树数据（仅 Canvas 需要）

#### 文件变更

```
Modified:
  vibex-fronted/src/app/dashboard/page.tsx
    - 确认项目卡片点击 → Canvas 加载时触发 useProjectLoader
```

#### 实现步骤

1. **E2E 验证**：
   ```bash
   playwright test tests/e2e/dashboard-canvas-persistence.spec.ts
   ```

2. **验证 Dashboard 无三树数据泄露**

#### 风险

- **低风险**

---

## 6. 依赖图

```
E1-U1 ───────────────────────────────────────────────────────────────────┐
E2-U1 ──→ E2-U2 ──→ E2-U3                                                │
E3-U1 ──→ E3-U2 ──→ E3-U3                                                │
E4-U1 ──→ E4-U2 ──→ E4-U3 ──→ E4-U4                                      │
                                                                         │
总工时: 1h + 3h + 2h + 5h = 11h                                         │
推荐顺序: E1 → E2-U1 → E2-U2 → E2-U3 → E3-U1 → E3-U2 → E3-U3 → E4-U1 → E4-U2 → E4-U3 → E4-U4
```
