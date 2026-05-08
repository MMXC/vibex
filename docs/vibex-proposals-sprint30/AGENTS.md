# VibeX Sprint 30 — 开发约束文档（AGENTS.md）

**Agent**: architect
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint30
**状态**: Adopted

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint30
- **执行日期**: 2026-05-08

---

## 1. 开发规范

### 1.1 TypeScript 严格模式（继承 Sprint 28）

| 配置项 | 值 | 理由 |
|--------|----|------|
| `tsconfig.json` — `strict: true` | 必须 | 启用所有严格类型检查 |
| `tsconfig.json` — `noImplicitAny: true` | 必须 | 禁止隐式 any |
| `tsconfig.json` — `strictNullChecks: true` | 必须 | 严格 null/undefined 检查 |
| `tsconfig.json` — `noUnusedLocals: true` | 必须 | 禁止未使用变量 |
| `tsconfig.json` — `noUnusedParameters: true` | 必须 | 禁止未使用参数 |

**CI 门控**: `tsc --noEmit` 必须 exit 0，任何 error 导致 PR blocked。

### 1.2 代码风格（继承 Sprint 28）

| 工具 | 配置 | 强制方式 |
|------|------|---------|
| ESLint | `next/core-web-vitals` + `typescript-eslint/recommended` | CI pre-commit hook |
| Prettier | `printWidth: 100`, `singleQuote: true`, `semi: true` | CI pre-commit hook |

**禁止规则**:
- `any` — 全部禁用，使用 `unknown` 代替
- `// @ts-ignore` — 全部禁用，必须使用 `// @ts-expect-error` 并附理由
- `console.log` — 生产代码禁止，使用 `console.error` 或 structured logger

### 1.3 Sprint 30 新增约束

| 约束项 | 值 | 适用 Epic | 理由 |
|--------|----|---------|------|
| Zustand subscription 必须用 useShallow | 必须 | E01 | 避免过度 re-render |
| 防抖 debounce 200ms（ProtoPreview）| 必须 | E01 | 防止高频 selectedIds 变更导致性能问题 |
| 热更新组件 data-rebuild="false" | 必须 | E01 | E2E 断言无组件卸载重挂 |
| .vibex 导入必须 Zod schema 校验 | 必须 | E02 | 防止 XSS payload 注入 |
| E2E 测试文件命名 `share-notification.spec.ts` | 必须 | E03 | Playwright 规范 |
| CI e2e:ci 禁止 `\|\| true` 跳过 | 必须 | E03 | CI 卡口有效性 |
| Firebase RTDB 未配置静默降级 | 必须 | E05 | 不阻断 Canvas 正常编辑 |

---

## 2. API 设计规范

### 2.1 RESTful 约定（继承 Sprint 28）

| 方法 | 端点 | 语义 | 成功状态码 |
|------|------|------|-----------|
| GET | `/api/projects/:id/export` | 导出项目 | 200 |
| POST | `/api/projects/import` | 导入项目 | 201 |
| GET | `/api/notifications` | 通知列表 | 200 |
| PATCH | `/api/notifications/read-all` | 标记已读 | 200 |
| POST | `/api/projects/:id/share-team` | 团队分享 | 200 |

### 2.2 E02 项目导入/导出端点规范

#### Export API

```
GET /api/projects/:id/export

Request Headers:
  Authorization: Bearer <token>

Response 200:
  Content-Type: application/octet-stream
  Content-Disposition: attachment; filename="项目名.vibex"
  Body: { version, project, trees, exportedAt, exportedBy }

Errors:
  401: UNAUTHORIZED
  403: FORBIDDEN
  404: NOT_FOUND
  500: INTERNAL_ERROR
```

#### Import API

```
POST /api/projects/import

Request Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data 或 application/json

Request Body (multipart):
  file: .vibex 文件

Request Body (JSON):
  { version, project, trees, exportedAt, exportedBy }

Response 201:
  { id, name, importedAt }

Errors:
  400: MISSING_FILE
  401: UNAUTHORIZED
  422: INVALID_JSON
  422: INVALID_VERSION
  422: INVALID_TREE_STRUCTURE
  422: INVALID_DATE
  500: INTERNAL_ERROR
```

### 2.3 错误码矩阵（E02）

| HTTP Status | Error Code | 触发条件 | 降级策略 |
|-------------|-----------|---------|---------|
| 400 | MISSING_FILE | multipart 无 file 字段 | 提示"请选择文件" |
| 401 | UNAUTHORIZED | 无效或过期 token | 跳转登录页 |
| 403 | FORBIDDEN | 非 owner 或 collaborator | 提示"无权限" |
| 404 | NOT_FOUND | project id 不存在 | 提示"项目不存在" |
| 422 | INVALID_JSON | 无法解析为 JSON | 提示"文件格式错误" |
| 422 | INVALID_VERSION | version 非 "1.0" | 提示"不支持的版本" |
| 422 | INVALID_TREE_STRUCTURE | 缺少必需 tree key | 提示"文件结构不完整" |
| 422 | INVALID_DATE | exportedAt 非 ISO 8601 | 提示"文件已损坏" |
| 500 | INTERNAL_ERROR | DB write 失败 | 提示"请稍后重试" |

---

## 3. 前端组件规范

### 3.1 ProtoPreview 热更新约束（E01）

| 约束项 | 正确 | 错误 |
|--------|------|------|
| Store subscription | `useComponentStore(useShallow(s => ({ selectedIds: s.selectedIds })))` | 直接解构 `{ selectedIds }` |
| 防抖 | `debounce(200ms)` 包装 updateNodeProps | 无防抖或 < 200ms |
| 组件热更新 | React.memo 包裹 + `data-rebuild="false"` | 每次 props 变化重新挂载 |
| 未选中状态 | 显示 placeholder div（display: flex + 占位文字）| 保持上次渲染结果 |

### 3.2 导入/导出 UI 约束（E02）

| 元素 | data-testid | 说明 |
|------|------------|------|
| 导出按钮 | `export-project-btn` | Dashboard 项目卡片菜单项 |
| 导入按钮 | `import-project-btn` | Dashboard 顶部 |
| 导入 Dropzone | `import-dropzone` | Modal 内拖拽区域 |
| 导入进度 | `import-progress` | 导入中显示进度条 |
| 错误提示 | `import-error` | 红色错误文字 |

### 3.3 ShareBadge 行为约束（E03）

| 状态 | 展示 |
|------|------|
| 无未读通知 | `display: none`（完全隐藏）|
| 1-99 未读 | 数字 badge，如 `3` |
| ≥100 未读 | 显示 `99+` |
| 加载中 | `display: none`（不显示旧数据）|
| API 失败 | `display: none`（静默降级）|

---

## 4. 测试规范

### 4.1 单元测试（Vitest）

| 指标 | 要求 |
|------|------|
| 覆盖率阈值 | **> 80% line coverage** |
| 测试框架 | Vitest 4.1.2 |
| 强制方式 | CI gate: `vitest run --coverage --coverage.threshold.lines 80` |

**核心测试用例**（E01-E05）:
- E01: componentStore.selectedIds → ProtoPreview re-render（≤200ms）
- E01: updateNodeProps → rebuild=false
- E02: VibexFileSchema.safeParse v1.0 valid/invalid
- E02: Import API 422 error codes
- E05: isRTDBConfigured() → 降级路径

### 4.2 E2E 测试（Playwright）

| 规则 | 要求 |
|------|------|
| 命名约定 | `*.spec.ts`（Playwright 默认）|
| 路径 | `tests/e2e/` |
| 文件命名 | `share-notification.spec.ts`（E03）|
| 强制方式 | CI gate: `npm run test:e2e:ci` exit non-zero → PR blocked |
| **禁止** | CI workflow 中使用 `|| true` 跳过 e2e 失败 |

**Playwright 配置**:
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html'], ['list']],
});
```

### 4.3 CI 卡口配置（E03 关键）

```yaml
# .github/workflows/ci.yml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e:ci
        # ⚠️ 禁止加 || true，exit code 必须被 capture
```

**验收标准**:
- `npm run test:e2e:ci` exit 0 → all passed
- `npm run test:e2e:ci` exit non-zero → PR status check `e2e tests (ci)` = **failure**

---

## 5. Git Workflow

### 5.1 分支命名

| 类型 | 格式 | 示例 |
|------|------|------|
| Feature（Epic 任务）| `feat/s30-*` | `feat/s30-e01-protopreview-realtime`, `feat/s30-e02-import-export` |
| Bug Fix | `fix/s30-*` | `fix/s30-e03-sharebadge-test` |
| Chore | `chore/s30-*` | `chore/s30-e2e-ci` |
| Hotfix | `hotfix/*` | `hotfix/prod-canvas-crash` |

### 5.2 PR Checklist

创建 PR 前必须满足以下所有条目：

- [ ] `tsc --noEmit` exit 0
- [ ] `vitest run` 通过（无 skipped/failed tests）
- [ ] `npm run test:e2e` 通过（针对涉及的功能）
- [ ] 新增代码行覆盖率 > 80%（`vitest --coverage`）
- [ ] E2E 测试文件存在且行数 ≥100（E03）
- [ ] CI workflow 无 `|| true` 跳过 e2e
- [ ] PR 描述包含：关联的 Story ID / 验收标准 / 测试结果

---

## 6. 安全规范

| 规则 | 说明 |
|------|------|
| .vibex 导入 XSS 防护 | Zod schema 校验所有字符串字段，防止 script injection |
| 导出权限控制 | 验证 userId === ownerId 或 collaborator |
| FIREBASE_* 仅 server-side | 不可暴露给客户端（仅 `NEXT_PUBLIC_*` 可客户端读）|
| .env* 加入 .gitignore | 仅 .env.example 可提交 |

---

## 7. Epic-Specific Constraints

### 7.1 E01 — ProtoPreview 实时联动

| 约束项 | 值 | 备注 |
|--------|----|------|
| Subscription 方式 | `useShallow` from `zustand/react/shallow` | 避免过度 re-render |
| 防抖延迟 | **200ms**（debounce）| 可用 lodash debounce 或自实现 |
| 热更新标记 | `data-rebuild="false"`（组件未卸载）| E2E 断言用 |
| 组件化 | React.memo 包裹 ProtoPreview | 防止父组件重渲染导致子组件卸载 |
| 未选中状态 | placeholder div（data-testid="proto-preview-placeholder"）| 不保持上次渲染 |

### 7.2 E02 — 项目导入/导出

| 约束项 | 值 | 备注 |
|--------|----|------|
| 文件格式 | `{ version: "1.0", project, trees, exportedAt, exportedBy }` | Zod schema 校验 |
| 版本检查 | version === "1.0" | 非 1.0 → INVALID_VERSION 422 |
| 导出聚合 | 三个 store → ProjectExporter → Prisma | 确认数据持久化方式 |
| 导入校验 | Zod safeParse → 错误信息 Toast | 不静默失败 |
| 大文件 | 流式写入 + 进度提示 | 前端 Toast 提示 |

### 7.3 E03 — E2E 测试补全

| 约束项 | 值 | 备注 |
|--------|----|------|
| 测试文件 | `tests/e2e/share-notification.spec.ts` | Playwright 默认目录 |
| 测试用例数 | ≥8 个（TC-S06-01~04 + TC-S07-01~04）| 覆盖率 100% |
| CI 强制 | `npm run test:e2e:ci` exit non-zero → blocked | 禁止 `|| true` |
| retries | CI 环境 2 次 retry | 隔离 flaky tests |
| workers | CI 环境并行度 2 | 控制资源 |

### 7.4 E04 — Spec 补全

| 约束项 | 值 | 备注 |
|--------|----|------|
| E04-template-crud.md | 补充 API 字段 + 错误码矩阵 | Sprint 28 遗漏 |
| S29-E01-notification.md | 通知类型 + 降级策略 | Sprint 29 遗漏 |
| 文件存在验证 | `test -f docs/vibex-proposals-sprint28/specs/E04-template-crud.md` | DoD 验收 |

### 7.5 E05 — Presence 层增强

| 约束项 | 值 | 备注 |
|--------|----|------|
| RTDB 状态验证 | S10 子任务先确认 useRealtimeSync.ts 就绪 | 阻塞项 |
| 方案 A | RTDB 就绪 → Firebase presence（10h）| 节点级别在线状态 |
| 方案 B | RTDB 未就绪 → 仅 UI mock（4h）| 用户头像列表 mock |
| 降级约束 | Firebase 未配置 → 静默降级 | 不抛错，不阻断 Canvas |
| 更新频率 | RTDB write ≤ 1Hz | 防止 quota 超限 |

---

## 8. 验收标准速查表

| Epic | 功能点 | 验收标准（摘要） | 验证命令 |
|------|--------|-----------------|----------|
| E01 | componentStore subscription | useShallow + selectedIds | 代码审查 |
| E01 | 热更新 ≤ 200ms | 选中节点到 ProtoPreview 渲染 | `npm run test:e2e -- protopreview` |
| E01 | rebuild=false | data-rebuild attr 验证 | Vitest unit |
| E02 | Export API | GET → 200 + v1.0 JSON | `curl localhost:3000/api/projects/:id/export` |
| E02 | Import API | POST → 201 + 新项目 | API test + E2E |
| E02 | 错误码 | INVALID_JSON/VERSION/TREE/DATE → 422 | API tests |
| E03 | share-notification.spec.ts | TC-S06-01~04 + TC-S07-01~04 | `npm run test:e2e -- share-notification` |
| E03 | CI 卡口 | e2e:ci exit non-zero blocked | GitHub Actions |
| E04 | Spec 存在 | E04 + S29 specs test -f | shell test |
| E05 | RTDB 降级 | Firebase 未配置静默降级 | 代码审查 |

---

## 9. 降级策略汇总

| 场景 | 降级策略 | 不降级风险 |
|------|---------|-----------|
| E01 热更新失败 | 显示空白占位符，不阻断编辑 | 白屏，用户体验差 |
| E02 导入失败 | Dashboard 显示红色错误 Toast | 静默失败，数据丢失 |
| E03 ShareBadge 失败 | badge 隐藏（display:none）| 显示错误数字 |
| E05 Firebase 未配置 | 静默降级到 UI mock | Canvas 编辑阻断 |

---

*本文件由 architect 基于 PRD（prd.md）+ Analyst 报告（analysis.md）+ E01-E05 specs 产出，继承 Sprint 28 AGENTS.md 规范。*