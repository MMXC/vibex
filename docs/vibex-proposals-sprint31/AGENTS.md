# VibeX Sprint 31 — AGENTS.md

> **项目**: vibex-proposals-sprint31
> **角色**: Architect
> **日期**: 2026-05-08
> **版本**: v1.0

> **所有 Agent 在操作此项目前必须阅读本文档。**

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint31
- **执行日期**: 2026-05-08

---

## 1. 代码风格规范

### 1.1 TypeScript / React

- **缩进**: 2 空格
- **引号**: 单引号 `'`（JS/TS），双引号（JSX attributes）
- **分号**: 始终使用分号
- **类型**: 显式类型声明，不使用 `any`
- **组件**: 函数组件，`'use client'` 声明
- **样式**: CSS Modules，禁止 JSX 内联 `style={{}}`（DESIGN.md 变量除外）
- **Mock**: Jest `jest.mock()` 或 `jest.spyOn()`

### 1.2 测试规范

- **文件命名**: `*.test.ts` / `*.test.tsx` / `*.spec.ts`
- **E2E 选择器**: 使用 `data-testid` 而非 CSS selector（防 flaky）
- **等待**: `waitForResponse` / `waitForSelector` 而非固定 `sleep`
- **中文描述**: `describe` + `it` 使用中文场景描述

---

## 2. 禁止事项

### 🚫 全局禁止

- **禁止** 使用 `// @ts-ignore` / `// @ts-expect-error`（除非附 TSDoc）
- **禁止** `console.log` 调试语句（使用 `canvasLogger` 或删除）
- **禁止** 引入新的 npm 依赖（`pnpm add` 需先审批）
- **禁止** 硬编码凭证、API Key、Token（使用环境变量）
- **禁止** 修改 `CLAUDE.md` / `AGENTS.md` / `DESIGN.md`（除非 PM 审批）
- **禁止** 在 `node_modules` 目录内进行任何修改
- **禁止** 提交 `TODO` / `FIXME` / `HACK`

### 🚫 E02 禁止

- **禁止** 在 `projectExporter.export()` 中改变 Prisma 查询逻辑（仅改输出格式）
- **禁止** `handleBulkExport` 中继续使用纯前端 JSON 导出（必须调用 Backend API）
- **禁止** ImportModal 中 `input[type="file"]` 使用非 `.vibex` 的 `accept` 值

### 🚫 E01/E05 禁止

- **禁止** 修改 `ProtoPreviewPanel` 的 `data-preview-panel` / `data-preview-placeholder` 选择器（E2E 依赖）
- **禁止** 在 ProtoFlowCanvas 中直接 `new` 一个 PresenceAvatars（必须用 `usePresence` hook）
- **禁止** 移除 `console.error` 捕获逻辑（Firebase 降级必须静默）

---

## 3. Epic 专项约束

### F1.1 — Schema 对齐

| 允许修改 | 禁止修改 |
|----------|----------|
| `vibex-backend/src/lib/services/projectExporter.ts`（输出格式） | Prisma 查询逻辑 |
| `vibex-backend/src/lib/schemas/vibex.ts`（schema 定义） | 字段类型定义 |
| `vibex-backend/src/__tests__/import-export.test.ts` | 其他测试文件 |

**验证命令**:
```bash
pnpm --filter vibex-backend test -- import-export
```

### F1.2 — Dashboard 导出

| 允许修改 | 禁止修改 |
|----------|----------|
| `vibex-fronted/src/app/dashboard/page.tsx`（导出逻辑） | Dashboard 其他功能 |
| `vibex-fronted/tests/e2e/export-import-flow.spec.ts`（E2E） | 其他 E2E 文件 |

**验证步骤**:
1. 单项目导出 → 下载 `.vibex` 文件
2. 批量导出 → 每个项目分别下载
3. E2E `export-import-flow.spec.ts` 全部通过

### F1.3 — ImportModal

| 允许修改 | 禁止修改 |
|----------|----------|
| `vibex-fronted/src/components/dashboard/ImportModal.tsx`（新建） | Dashboard 已有功能 |
| `vibex-fronted/src/app/dashboard/page.tsx`（集成按钮） | 其他组件 |
| `vibex-fronted/tests/e2e/export-import-flow.spec.ts` | 其他 E2E 文件 |

**验证步骤**:
1. 「导入项目」按钮在 Dashboard header 可见
2. 拖拽 `.vibex` 文件 → 成功导入 → Modal 关闭 → 列表刷新
3. 无效文件 → 红色错误提示，不崩溃
4. 导入中 spinner 正常显示，不可重复提交

### F2.1 — ProtoPreview E2E

| 允许修改 | 禁止修改 |
|----------|----------|
| `vibex-fronted/tests/e2e/protopreview-realtime.spec.ts`（新建） | `ProtoPreviewPanel.tsx` 核心逻辑 |
| `vibex-fronted/src/components/prototype/ProtoPreviewPanel.tsx`（添加 data-testid） | 样式结构 |
| `.github/workflows/e2e-tests.yml`（验证） | 其他 workflow |

**验证命令**:
```bash
pnpm --filter vibex-fronted test:e2e:ci
# 必须 exit 0，无 `|| true` 跳过
```

### F2.2 — ProtoFlowCanvas Presence

| 允许修改 | 禁止修改 |
|----------|----------|
| `vibex-fronted/src/components/prototype/ProtoFlowCanvas.tsx`（集成） | ProtoFlowCanvas 核心逻辑 |
| `vibex-fronted/src/components/canvas/Presence/PresenceAvatars.tsx`（审查） | PresenceAvatars 核心逻辑 |
| `vibex-fronted/src/components/prototype/__tests__/ProtoFlowCanvas.test.tsx`（降级测试） | 其他测试 |

**验证步骤**:
1. ProtoFlowCanvas 页面加载无 console.error
2. `[data-presence-avatars]` 元素可见
3. Firebase 未配置 → 静默降级到 mock

---

## 4. PR 审查清单

### 4.1 代码质量检查

- [ ] **类型安全**: 无 `any` 类型
- [ ] **编译通过**: `pnpm --filter vibex-backend build` 无错误
- [ ] **Lint 通过**: `pnpm lint`
- [ ] **无硬编码**: 无凭证、Key、Token
- [ ] **无调试语句**: 无 `console.log`
- [ ] **代码风格**: 2 空格缩进、分号、单引号

### 4.2 功能检查

- [ ] F1.1: `export()` 输出可直接 `POST` 到 `/api/projects/import`
- [ ] F1.2: 单项目导出 → `.vibex` 下载
- [ ] F1.2: 批量导出 → 每个项目分别调用 export API
- [ ] F1.3: ImportModal 支持拖拽 + 点击上传
- [ ] F1.3: 无效文件 → 错误提示，不崩溃
- [ ] F2.1: `protopreview-realtime.spec.ts` 存在且 exit 0
- [ ] F2.2: PresenceAvatars 集成，无 Firebase 依赖错误

### 4.3 测试覆盖

- [ ] `projectExporter.ts` > 80%
- [ ] `ImportModal.tsx` > 70%（组件测试）
- [ ] roundtrip export → import 测试通过
- [ ] E2E: `test:e2e:ci` 全绿

### 4.4 安全检查

- [ ] 导入文件大小限制 10MB
- [ ] 无 XSS 风险（用户上传文件名未转义）
- [ ] 无敏感信息泄露

---

## 5. 文件权限与路径规范

### 5.1 允许修改的路径

| 路径 | 操作 | 说明 |
|------|------|------|
| `vibex-backend/src/lib/services/projectExporter.ts` | 修改 | F1.1 |
| `vibex-backend/src/lib/schemas/vibex.ts` | 修改 | F1.1 |
| `vibex-backend/src/__tests__/import-export.test.ts` | 修改/新增 | F1.1 |
| `vibex-fronted/src/app/dashboard/page.tsx` | 修改 | F1.2, F1.3 |
| `vibex-fronted/src/components/dashboard/ImportModal.tsx` | 新建 | F1.3 |
| `vibex-fronted/tests/e2e/export-import-flow.spec.ts` | 新建 | F1.2, F1.3 |
| `vibex-fronted/tests/e2e/protopreview-realtime.spec.ts` | 新建 | F2.1 |
| `vibex-fronted/src/components/prototype/ProtoFlowCanvas.tsx` | 修改 | F2.2 |
| `vibex-fronted/src/components/prototype/ProtoPreviewPanel.tsx` | 修改 | F2.1 data-testid |

### 5.2 禁止修改的路径

| 路径 | 原因 |
|------|------|
| `vibex-backend/src/app/api/projects/import/route.ts` | API 逻辑已完整 |
| `vibex-fronted/src/components/canvas/Presence/PresenceAvatars.tsx` | 仅集成，不改核心 |
| `vibex-fronted/src/stores/` | 新增 store 需 PM 审批 |
| `node_modules/` | 禁止 |
| `DESIGN.md` | 需设计审批 |

---

## 6. 提交规范

```bash
# 格式: <功能>-<简短描述>
git commit -m "F1.1: align export schema with VibexExportSchema"
git commit -m "F1.2: refactor dashboard export to call backend API"
git commit -m "F1.3: add ImportModal with drag-drop upload"
git commit -m "F2.1: add protopreview-realtime E2E spec"
git commit -m "F2.2: integrate PresenceAvatars into ProtoFlowCanvas"
```

---

## 7. 测试运行命令

```bash
# Backend unit tests
pnpm --filter vibex-backend test

# Frontend unit tests
pnpm --filter vibex-fronted test

# E2E (local dev)
pnpm --filter vibex-fronted playwright test

# E2E (CI — 必须 exit 0)
pnpm --filter vibex-fronted test:e2e:ci

# 全量测试
pnpm test

# 覆盖率
pnpm --filter vibex-backend test --coverage
pnpm --filter vibex-fronted test --coverage
```

---

*文档版本: v1.0 | 最后更新: 2026-05-08*
