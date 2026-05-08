# VibeX Sprint 31 — Implementation Plan

**Agent**: Architect
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint31
**版本**: v1.0

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint31
- **执行日期**: 2026-05-08

---

## 1. 总览

| Epic | 功能 | 工时 | 执行顺序 |
|------|------|------|----------|
| E02 | F1.1 schema 对齐 | 3h | 1st（并行启动） |
| E02 | F1.2 导出重构 | 4h | 2nd（依赖 F1.1） |
| E02 | F1.3 导入 Modal | 6h | 3rd（依赖 F1.2） |
| E01 | F2.1 ProtoPreview E2E | 5h | 1st（并行启动） |
| E05 | F2.2 Presence 头像 | 3h | 1st（并行启动） |

**总工期**: 21h（2人 Sprint buffer 充足）
**关键路径**: F1.1 → F1.2 → F1.3

---

## 2. Epic 1: E02 项目导入导出补全

### F1.1 — P003 schema 字段对齐（3h）

#### 目标
修复 `projectExporter.export()` 输出格式与 `VibexExportSchema` 不一致问题。

#### 实施步骤

**Step 1: 对齐 export 输出格式**
- 文件: `vibex-backend/src/lib/services/projectExporter.ts`
- 改动: `export()` 返回值从 `{ version, projectId, projectName, pages, uiNodes, ... }` 改为 `{ version, project: { name, description }, pages, uiNodes, businessDomains, flowData, requirements }`
- 对齐 Prisma schema 的字段名（pages 不再遗漏 id/name）

**Step 2: 对齐 Zod schema**
- 文件: `vibex-backend/src/lib/schemas/vibex.ts`
- 改动: `VibexExportSchema.project` 字段调整为 `{ name: z.string(), description: z.string().optional() }`
- 确保 `exportedAt` 为 `z.string().datetime().optional()`（export 无此字段时兼容）

**Step 3: 写 roundtrip 测试**
- 文件: `vibex-backend/src/__tests__/import-export.test.ts`
- 新增: `describe('export → import roundtrip')`
- 断言: `export()` 输出 → `validateExportJson()` → `success === true`

#### 验收标准
- [ ] `export()` 输出可直接作为 `POST /api/projects/import` body
- [ ] `GET /api/projects/:id/export` 响应 200，字段完整
- [ ] roundtrip 测试通过

---

### F1.2 — P002 导出功能重构（4h）

#### 目标
Dashboard 单项目导出和批量导出对接 Backend API，生成 .vibex 格式。

#### 实施步骤

**Step 1: 重构 Dashboard 导出逻辑**
- 文件: `vibex-fronted/src/app/dashboard/page.tsx`
- 单项目导出: `handleSingleExport(projectId, projectName)` 调用 `fetch('/api/projects/${id}/export')`
- 批量导出: `handleBulkExport()` 对每个选中项目调用单项目导出
- 文件名: `${projectName}-${date}.vibex`

**Step 2: 实现 downloadBlob 工具函数**
```typescript
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Step 3: 替换「导出」按钮 alert**
- 移除 `alert('导出功能开发中')`
- 替换为实际 `handleSingleExport` 调用

**Step 4: 替换批量导出 alert**
- 移除 `handleBulkExport` 中的纯前端 JSON 逻辑
- 替换为 `Promise.all(projectIds.map(id => handleSingleExport(id)))`

**Step 5: 添加入口按钮**
- Dashboard header 区域添加「导入项目」按钮占位（后续 F1.3 实现）

#### 验收标准
- [ ] 单项目导出下载 `.vibex` 文件
- [ ] 批量导出对每个项目分别调用 export API
- [ ] 导出过程无 console.error

---

### F1.3 — P001 导入 Modal（6h）

#### 目标
新建 ImportModal 组件，支持拖拽/点击上传 .vibex 文件。

#### 实施步骤

**Step 1: 创建 ImportModal.tsx**
- 路径: `vibex-fronted/src/components/dashboard/ImportModal.tsx`
- 状态: `isOpen`, `isLoading`, `errorMessage`
- 功能: 文件选择、拖拽上传、loading spinner、错误提示

**Step 2: Dashboard 集成**
- 文件: `vibex-fronted/src/app/dashboard/page.tsx`
- header 区域添加「导入项目」按钮（调用 `setImportModalOpen(true)`）
- 渲染 `<ImportModal isOpen={importModalOpen} onClose={...} onSuccess={...} />`
- `onSuccess` 中 `queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })` 刷新列表

**Step 3: 错误处理**
- JSON parse 失败 → 显示"文件格式无效"
- API 400 → 显示后端返回的 `error.message`
- 文件 > 10MB → 显示"文件过大"

**Step 4: E2E 测试**
- 文件: `tests/e2e/export-import-flow.spec.ts`
- 覆盖: 按钮存在、Modal 打开、无效文件、导入成功

#### 验收标准
- [ ] 「导入项目」按钮可见
- [ ] Modal 支持拖拽和点击上传
- [ ] 无效文件显示红色错误，不崩溃
- [ ] 成功导入后 Modal 关闭，列表刷新

---

## 3. Epic 2: E01/E05 测试与集成补全

### F2.1 — P004 ProtoPreview E2E 测试（5h）

#### 目标
新建 `protopreview-realtime.spec.ts`，覆盖 ProtoPreview 实时联动全场景。

#### 实施步骤

**Step 1: 分析现有 ProtoPreviewPanel 组件**
- 文件: `vibex-fronted/src/components/prototype/ProtoPreviewPanel.tsx`
- 确定: `data-preview-panel` 和 `data-preview-placeholder` 的存在位置

**Step 2: 创建 E2E 测试文件**
- 路径: `vibex-fronted/tests/e2e/protopreview-realtime.spec.ts`
- 场景1: 选中节点 → ProtoPreview 显示内容
- 场景2: 无选中 → placeholder
- 场景3: 选中后取消 → placeholder

**Step 3: 添加 `data-testid` 到 ProtoPreviewPanel**
- 必要: 在 `ProtoPreviewPanel.tsx` 中添加 `data-testid` 属性（如需）

**Step 4: 验证 CI 配置**
- 文件: `.github/workflows/e2e-tests.yml`
- 确认 `npm run test:e2e:ci` 无 `|| true` 跳过

#### 验收标准
- [x] `protopreview-realtime.spec.ts` 存在且用例完整（3 个场景）
- [x] 使用 `data-testid` 选择器，无 CSS selector
- [x] 无 `console.log` 调试语句

---

### F2.2 — P005 ProtoFlowCanvas Presence 头像（3h）

#### 目标
在 ProtoFlowCanvas 集成 PresenceAvatars 组件，mock 优先。

#### 实施步骤

**Step 1: 分析 PresenceAvatars 用法**
- 文件: `vibex-fronted/src/components/canvas/Presence/PresenceAvatars.tsx`
- 确定: 已有 `usePresence` hook 的 `mockMode` 参数

**Step 2: 在 ProtoFlowCanvas 集成**
- 文件: `vibex-fronted/src/components/prototype/ProtoFlowCanvas.tsx`
- 导入: `import { PresenceAvatars } from '@/components/canvas/Presence/PresenceAvatars'`
- 导入: `import { usePresence } from '@/lib/firebase/presence'`
- 渲染: 在 `canvasWrap` 或 Controls 旁添加 `[data-presence-avatars]` 容器
- mockMode: `usePresence({ mockMode: true })`

**Step 3: 样式隔离**
- 确保 PresenceAvatars 在 ProtoFlowCanvas 区域内样式正常
- 如有冲突，添加 CSS Modules 隔离

**Step 4: 降级测试**
- 验证 Firebase 未配置时无 error 抛出
- `jest.spyOn(console, 'error')` 断言无调用

#### 验收标准
- [x] ProtoFlowCanvas 右上角显示 `[data-testid="presence-avatars"]`
- [x] Firebase 未配置 → 无 console.error（unit test 验证）
- [x] 每个在线用户显示 initial + color dot（通过 PresenceAvatars 组件实现）

---

## 4. 文件清单

| 操作 | 文件路径 | 类型 |
|------|----------|------|
| 修改 | `vibex-backend/src/lib/services/projectExporter.ts` | 核心重构 |
| 修改 | `vibex-backend/src/lib/schemas/vibex.ts` | Schema 对齐 |
| 修改 | `vibex-backend/src/__tests__/import-export.test.ts` | 新增 roundtrip 测试 |
| 修改 | `vibex-fronted/src/app/dashboard/page.tsx` | 导出重构 + 导入按钮 |
| 新建 | `vibex-fronted/src/components/dashboard/ImportModal.tsx` | 新建组件 |
| 新建 | `vibex-fronted/tests/e2e/export-import-flow.spec.ts` | 新建 E2E |
| 新建 | `vibex-fronted/tests/e2e/protopreview-realtime.spec.ts` | 新建 E2E |
| 修改 | `vibex-fronted/src/components/prototype/ProtoFlowCanvas.tsx` | Presence 集成 |
| 修改 | `vibex-fronted/src/components/prototype/ProtoPreviewPanel.tsx` | data-testid（如需） |
| 修改 | `.github/workflows/e2e-tests.yml` | CI 配置验证 |

---

## 5. 测试运行命令

```bash
# Backend unit tests
pnpm --filter vibex-backend test

# Frontend unit tests
pnpm --filter vibex-fronted test

# E2E (local)
pnpm --filter vibex-fronted playwright test

# E2E (CI)
pnpm --filter vibex-fronted test:e2e:ci

# 全量测试
pnpm test
```
