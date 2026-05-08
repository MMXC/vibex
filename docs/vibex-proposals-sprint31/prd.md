# VibeX Sprint 31 — PRD

**Agent**: PM
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint31
**上游**: analyst review (analysis.md)

---

## 1. 执行摘要

### 背景

Sprint 30 代码审查发现 3 个 Epic 存在关键路径断裂：
- **E01**: ProtoPreview 实时联动功能缺少 E2E 测试保护
- **E02**: Dashboard 的"导出"是纯前端 JSON（仅 id/name/description），**不是** E02 spec 设计的 .vibex 格式；导入功能完全缺失
- **E05**: Presence 头像集成在 DDSCanvasPage，ProtoFlowCanvas（React Flow 原型编辑器）无头像显示

### 目标

Sprint 31 修复 Sprint 30 遗留的 3 个 Epic 断裂点，补全导入导出闭环、添加 E2E 测试卡口、在 ProtoFlowCanvas 渲染 Presence 头像。

### 成功指标

- [ ] Dashboard 可导出完整 .vibex 文件（包含 uiNodes/businessDomains/flowData/requirements）
- [ ] Dashboard 可导入 .vibex 文件，项目数据完整恢复
- [ ] ProtoPreview E2E 测试通过，Playwright CI 卡口绿灯
- [ ] ProtoFlowCanvas 右上角显示在线协作者头像（mock 优先）
- [ ] 5 个功能点全部满足验收标准

---

## 2. Epic 拆分

### Epic 1: E02 项目导入导出补全

| ID | Story | 描述 | 工时 | 验收标准数 | 依赖 |
|----|-------|------|------|-----------|------|
| F1.1 | P003 schema 字段对齐 | Backend export 输出结构与 import 读取格式完全一致 | 3h | 4 | 无 |
| F1.2 | P002 导出功能重构 | Dashboard 导出按钮对接 Backend API，生成 .vibex 格式 | 4h | 5 | F1.1 |
| F1.3 | P001 导入 Modal | Dashboard 新增导入按钮 + Modal，支持 .vibex 上传 | 6h | 6 | F1.2 |

### Epic 2: E01/E05 测试与集成补全

| ID | Story | 描述 | 工时 | 验收标准数 | 依赖 |
|----|-------|------|------|-----------|------|
| F2.1 | P004 ProtoPreview E2E 测试 | 新建 protopreview-realtime.spec.ts，覆盖实时联动全场景 | 5h | 4 | 无 |
| F2.2 | P005 ProtoFlowCanvas Presence 头像 | ProtoFlowCanvas 工具栏显示在线用户头像 | 3h | 4 | 无 |

**总工期: 21h**

---

## 3. 验收标准（每条可写 expect() 断言）

### F1.1 — P003 schema 字段对齐

**涉及文件**: `vibex-backend/src/lib/services/projectExporter.ts`, `vibex-backend/src/lib/schemas/vibex.ts`

```
// GET /api/projects/:id/export 返回的字段必须与 import 读取字段完全一致
expect(Object.keys(projectExporter.export(id))).toContain('pages');
expect(Object.keys(projectExporter.export(id))).toContain('uiNodes');
expect(Object.keys(projectExporter.export(id))).toContain('businessDomains');
expect(Object.keys(projectExporter.export(id))).toContain('flowData');
expect(Object.keys(projectExporter.export(id))).toContain('requirements');
expect(projectExporter.export(id).version).toBe('1.0');
expect(Object.keys(projectExporter.export(id))).toEqual(
  expect.arrayContaining(['pages', 'uiNodes', 'businessDomains', 'flowData', 'requirements', 'version'])
);
```

**验收标准明细**:
- [ ] `projectExporter.export(id)` 返回字段包含 `pages, uiNodes, businessDomains, flowData, requirements, version`
- [ ] `version` 字段为 `"1.0"`
- [ ] export 导出的 `pages` 数组中每个 page 包含 `id, name, nodes`（与 Prisma schema 对齐）
- [ ] `GET /api/projects/:id/export` HTTP 响应 200，Content-Type 为 `application/json`
- [ ] 导出后立即导入，核心字段全部恢复，无数据丢失

---

### F1.2 — P002 导出功能重构 【需页面集成】

**涉及文件**: `vibex-fronted/src/app/dashboard/page.tsx`

**当前问题**: `handleBulkExport` 是纯前端 JSON，仅含 id/name/description，不调用 Backend API。

```
// 点击项目卡片「导出」→ 调用 Backend API
expect(fetch).toHaveBeenCalledWith('/api/projects/:id/export', expect.objectContaining({ method: 'GET' }));

// 导出文件为 .vibex 格式
const blob = await response.blob();
expect(blob.type).toBe('application/json');
expect(downloadedFilename).toMatch(/\.vibex$/);

// 批量导出（选择多个项目）→ 分别调用各项目 export API
expect(fetch).toHaveBeenCalledTimes(selectedProjects.length);
selectedProjects.forEach(p => {
  expect(fetch).toHaveBeenCalledWith(`/api/projects/${p.id}/export`, expect.any(Object));
});
```

**验收标准明细**:
- [ ] 点击项目卡片「导出」→ `fetch('/api/projects/:id/export')` 被调用（method: GET）
- [ ] 响应 blob 被下载，文件名以 `.vibex` 结尾（如 `my-project-2026-05-08.vibex`）
- [ ] 下载文件内容包含 `version: "1.0"`、`pages`、`uiNodes`、`businessDomains`、`flowData`、`requirements`
- [ ] 批量选择多个项目后导出 → 对每个项目分别调用 export API
- [ ] 导出过程中 Dashboard 无报错（无 console.error）

---

### F1.3 — P001 导入 Modal 【需页面集成】

**涉及文件**: `vibex-fronted/src/app/dashboard/page.tsx`, `vibex-fronted/src/components/dashboard/ImportModal.tsx`

**当前问题**: Dashboard 完全没有导入入口。

```
// Dashboard 顶部「导入项目」按钮存在
expect(screen.getByText('导入项目')).toBeInTheDocument();

// 点击触发 Modal
expect(screen.getByRole('dialog')).toBeInTheDocument();

// 无效文件 → 错误提示
expect(screen.getByText(/导入失败|无效|格式错误/i)).toBeInTheDocument();
```

**验收标准明细**:
- [ ] Dashboard 顶部区域存在「导入项目」按钮
- [ ] 点击后弹出 Modal，支持拖拽或点击上传 `.vibex` 文件
- [ ] `POST /api/projects/import` 请求发送，响应 201
- [ ] 导入成功后 Modal 关闭，项目出现在 Dashboard 列表顶部
- [ ] 无效 JSON 或非 .vibex 格式 → Modal 内显示红色错误提示
- [ ] 导入中 Modal 显示 loading spinner，不可重复提交

---

### F2.1 — P004 ProtoPreview E2E 测试

**涉及文件**: `vibex-fronted/tests/e2e/protopreview-realtime.spec.ts`

```
// E2E: 选中节点 → ProtoPreview 200ms 内显示
await page.click('[data-node-id="node-1"]');
await expect(page.locator('[data-preview-panel]')).toBeVisible({ timeout: 300 });
const text = await page.locator('[data-preview-panel]').textContent();
expect(text).toContain('node-1');

// E2E: 无选中节点 → placeholder
await page.click('[data-node-id="node-1"]');
await page.keyboard.press('Escape');
await expect(page.locator('[data-preview-placeholder]')).toBeVisible();
```

**验收标准明细**:
- [ ] `tests/e2e/protopreview-realtime.spec.ts` 文件存在
- [ ] E2E: 打开 Canvas → 选中组件树节点 → ProtoPreview 在 300ms 内渲染
- [ ] E2E: 无选中节点 → 显示 placeholder（"选中组件以预览"）
- [ ] E2E: `npm run test:e2e:ci` exit 0，无 flaky 跳过

---

### F2.2 — P005 ProtoFlowCanvas Presence 头像 【需页面集成】

**涉及文件**: `vibex-fronted/src/components/prototype/ProtoFlowCanvas.tsx`

**当前问题**: PresenceAvatars 在 DDSCanvasPage 集成，ProtoFlowCanvas 缺失。

```
// ProtoFlowCanvas 右上角显示头像
const avatars = page.locator('[data-presence-avatars]');
await expect(avatars).toBeVisible();

// 头像包含 initial + color dot
const firstAvatar = avatars.locator('[data-avatar]').first();
await expect(firstAvatar.locator('[data-avatar-initial]')).toBeVisible();
await expect(firstAvatar.locator('[data-avatar-dot]')).toBeVisible();
```

**验收标准明细**:
- [ ] ProtoFlowCanvas 右上角或工具栏区域存在 `[data-presence-avatars]`
- [ ] 每个在线用户显示一个头像：包含用户名首字母（initial）+ 颜色圆点（color dot）
- [ ] Firebase RTDB 未配置时 → PresenceAvatars 降级到 mock 数据，Canvas 正常编辑不受影响
- [ ] Firebase 配置异常时 → 无 Error 抛出到 console（静默降级）

---

## 4. Definition of Done

### F1.1 DoD（schema 字段对齐）
- [ ] `projectExporter.export()` 输出字段与 import 读取字段完全一致（pages, uiNodes, businessDomains, flowData, requirements, version）
- [ ] `vibex.ts` Zod schema 与 export 输出对齐
- [ ] 导出测试：调用 export → 调用 import → 断言 JSON.stringify(exported) === JSON.stringify(imported)（忽略 id/timestamps）
- [ ] Backend API 测试：`GET /api/projects/:id/export` 响应 200，字段完整

### F1.2 DoD（导出功能重构）
- [ ] Dashboard 导出按钮点击 → `fetch('/api/projects/:id/export')` 被调用
- [ ] 下载文件为 .vibex 格式，包含 version/pages/uiNodes/businessDomains/flowData/requirements
- [ ] 批量导出（多选）→ 每个项目分别调用 export API
- [ ] 导出时 Dashboard 无白屏、无 console.error
- [ ] E2E: 导出 → 下载 .vibex → 导入同一文件 → 数据完整恢复

### F1.3 DoD（导入 Modal）
- [ ] `ImportModal.tsx` 组件存在
- [ ] Dashboard 顶部「导入项目」按钮可点击
- [ ] Modal 支持拖拽上传 + 点击选择文件
- [ ] 有效 .vibex 文件 → POST /api/projects/import → 201 → 项目出现在列表
- [ ] 无效文件 → Modal 内红色错误提示，不崩溃
- [ ] 导入中状态（loading spinner）正常显示
- [ ] E2E: 导入完整流程通过

### F2.1 DoD（ProtoPreview E2E）
- [ ] `tests/e2e/protopreview-realtime.spec.ts` 存在且非空
- [ ] 测试用例覆盖：选中节点→预览、placeholder、热更新
- [ ] `npm run test:e2e:ci` 全部通过（exit 0）
- [ ] CI workflow `.github/workflows/e2e-tests.yml` 配置正确，无 `|| true` 跳过

### F2.2 DoD（ProtoFlowCanvas Presence）
- [ ] `ProtoFlowCanvas.tsx` 导入并渲染 `PresenceAvatars` 组件
- [ ] PresenceAvatars 传入 `usePresence({ mockMode: true })`
- [ ] Firebase RTDB 未配置时 → Canvas 正常加载，无 error
- [ ] UI 样式与 DDSCanvasPage 侧边栏头像一致

---

## 5. 优先级矩阵

| ID | 功能点 | RICE 分数 | 理由 |
|----|--------|-----------|------|
| F1.1 | schema 字段对齐 | P0 | E02 导出/导入的根因断裂点，不修则整个 Epic 无法闭环 |
| F1.2 | 导出功能重构 | P0 | 用户实际使用入口，修复后 E02 对外可用 |
| F1.3 | 导入 Modal | P0 | E02 完整闭环，用户导入/导出必须成对存在 |
| F2.1 | ProtoPreview E2E | P1 | 防止 ProtoPreview 功能退化，无测试 = 每次改代码都是盲改 |
| F2.2 | Presence 头像 | P1 | 协作体验提升，mock 优先实现简单 |

---

## 6. 执行顺序（依赖关系）

```
F1.1 (3h) → F1.2 (4h) → F1.3 (6h)     ← Epic 1 串行（schema → 导出 → 导入）
F2.1 (5h) ────────────────────────────────── Epic 2a 并行
F2.2 (3h) ────────────────────────────────── Epic 2b 并行
```

**关键路径**: F1.1 → F1.2 → F1.3（21h 总工期，2人 Sprint buffer 充足）

---

## 7. 相关文件

- PRD: `docs/vibex-proposals-sprint31/prd.md`
- Analysis: `docs/vibex-proposals-sprint31/analysis.md`
- E02 export API: `vibex-backend/src/app/api/projects/[id]/export/route.ts`
- E02 import API: `vibex-backend/src/app/api/projects/import/route.ts`
- Dashboard: `vibex-fronted/src/app/dashboard/page.tsx`
- ProtoFlowCanvas: `vibex-fronted/src/components/prototype/ProtoFlowCanvas.tsx`
- Presence: `vibex-fronted/src/lib/firebase/presence.ts`
- E2E 模板: `vibex-fronted/tests/e2e/share-notification.spec.ts`
