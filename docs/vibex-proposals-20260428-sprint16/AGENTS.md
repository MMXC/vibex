# AGENTS.md — VibeX Sprint 16 Development Constraints

> **覆盖范围**: VibeX Sprint 16 所有提案（6个）
> **生效日期**: 2026-04-28
> **维护人**: Architect Agent
> **强制等级**: 所有 Sprint 16 代码必须遵守本文档，否则 PR 禁止合并

---

## 1. Tech Stack Constraints

### 1.1 锁定版本（禁止升级）

以下依赖版本**已锁定**，Sprint 16 期间禁止升级：

| 包 | 锁定版本 | 原因 |
|----|---------|------|
| `next` | `16.2.0` | App Router 稳定性 |
| `react` | `19.2.3` | 与 Next.js 16 配套 |
| `react-dom` | `19.2.3` | 同上 |
| `typescript` | `^5` | 严格类型检查 |
| `zustand` | `4.5.7` | 与现有 store 兼容 |
| `vitest` | `^4.1.2` | 测试框架稳定 |
| `playwright` | `1.59.0` | E2E 稳定性 |
| `framer-motion` | `^12.35.2` | 动画一致性 |
| `firebase` | `^10.14.1` | S16-P1-1 Firebase Mock 依赖 |

### 1.2 Sprint 16 新增依赖上限

| 包 | 最高版本 | 来源 | 用于 |
|----|---------|------|------|
| `firebase-tools` | `^13.x` | npm | 本地模拟器（非生产） |
| `@modelcontextprotocol/sdk` | `^1.0.0` | npm | S16-P2-2 MCP Tool |
| `jsondiffpatch` | `^0.7.3` | 已有 | S16-P2-1 Canvas 版本历史 |
| `@xyflow/react` | `^12.10.1` | 已有 | Canvas 组件 |

**禁止在 Sprint 16 引入新依赖**（不在上表中的包），除非 Architect 批准。

### 1.3 环境要求

```
Node.js: ^20（参考 @types/node ^20）
pnpm: ^10.32.1（参考 packageManager）
OS: Linux（CI 环境）
```

---

## 2. Code Standards

### 2.1 TypeScript

- **严格模式**: `tsconfig.json` 中 `strict: true` 必须保持开启
- **无 `any`**: 禁止使用 `any` 类型，例外场景需附 `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 并附原因
- **导入排序**: ESLint `import` 规则自动强制，pre-commit hook 执行
- **类型导出**: 公开 API 必须有类型签名，不得隐式 `any`

### 2.2 CSS Modules 规则

- **强制**: 所有组件样式必须使用 `.module.css`，禁止在 `.tsx` 文件中使用内联 `style={{}}` 定义颜色/间距/字体
- **验证命令**:
  ```bash
  grep -rn "style={{" /root/.openclaw/vibex/vibex-fronted/src/ --include="*.tsx" | grep -v "node_modules" | grep -v "data-" | grep -v "test"
  ```
  此命令输出必须为空（或仅含非样式属性）。
- **例外**: `style={{ display: 'flex' }}` 类布局属性允许，但颜色/字体/间距必须用 CSS 变量

### 2.3 设计变量使用（强制）

所有颜色/字体/间距**必须**使用 `design-tokens.css` 中定义的 CSS 变量：

```css
/* ✅ 正确 */
color: var(--color-primary);
font-size: var(--text-sm);
padding: var(--space-4);

/* ❌ 错误 */
color: #00ffff;
font-size: 14px;
padding: 16px;
```

**例外**: 在 `design-tokens.css` 本身定义变量时允许字面量。

### 2.4 CSS 文件规范

- 每个 `.tsx` 组件对应同名的 `.module.css`
- CSS 类名使用 **kebab-case**：`canvas-panel.module.css`
- BEM 变体命名：`canvas-panel__header--active`
- **禁止**在 CSS 文件中直接写死颜色值（`#xxx`、`rgb()`、`hsl()`），必须用变量

---

## 3. Naming Conventions

### 3.1 组件

| 场景 | 规则 | 示例 |
|------|------|------|
| 组件文件 | `PascalCase.tsx` | `DesignReviewPanel.tsx` |
| 组件名称 | 同文件名 | `export function DesignReviewPanel` |
| 样式文件 | 同名 `.module.css` | `DesignReviewPanel.module.css` |
| 测试文件 | 同名 `.test.tsx` | `DesignReviewPanel.test.tsx` |

### 3.2 文件命名

| 类型 | 规则 | 示例 |
|------|------|------|
| 服务层 | `camelCase.ts` | `firebaseService.ts` |
| Store | `camelCase.ts` | `canvasHistoryStore.ts` |
| Hook | `useXxx.ts` | `useDesignToken.ts` |
| 类型定义 | `camelCase.ts` | `designReviewTypes.ts` |
| 工具函数 | `camelCase.ts` | `diffPatch.ts` |
| 配置文件 | `kebab-case` | `firebase-mock.config.ts` |

### 3.3 分支命名

```
<type>/<ticket>-<short-description>
```

| type | 用途 |
|------|------|
| `feat/` | 新功能（S16-P0-1/P0-2/P1-1/P1-2/P2-1/P2-2） |
| `fix/` | Bug 修复 |
| `chore/` | 配置/依赖变更 |
| `docs/` | 文档更新 |

**示例**:
```
feat/S16-P0-1-design-review-ui
feat/S16-P1-1-firebase-mock
chore/S16-P2-2-mcp-docs
```

### 3.4 Commit Messages

遵循 [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[body]

[footer]
```

**type 映射**:
- `feat`: 新功能
- `fix`: 修复
- `refactor`: 重构
- `test`: 测试
- `docs`: 文档
- `chore`: 构建/工具

**scope 优先用 ticket ID**: `feat(S16-P0-1): add design review panel UI`

---

## 4. Git Workflow

### 4.1 分支策略

```
main (protected)
  └── feat/S16-xxx-*
  └── fix/S16-xxx-*
  └── chore/S16-xxx-*
```

- **每个提案一个分支**，不允许在一个分支上混做多个提案
- **禁止直接 push 到 main**
- **禁止 force push** 到已合并的分支

### 4.2 PR 流程

1. **创建 PR**: 从 `feat/S16-xxx-*` → `main`
2. **PR 标题**: 必须包含 ticket ID: `[S16-P0-1] Design Review UI Integration`
3. **PR 描述**: 必须包含 DoD checklist（见第 11 节）
4. **CI 必须通过**:
   - `pnpm lint` — 0 warnings
   - `pnpm test:unit` — 全部通过
   - `pnpm test:e2e:ci` — 全部通过
   - `pnpm build` — 构建成功
5. **Review**: 至少 1 人 approve（Architect 强制 review）
6. **合并策略**: Squash and merge，commit message = PR title

### 4.3 Sprint 16 分支分配

| 分支 | 负责人 | 提案 |
|------|--------|------|
| `feat/S16-P0-1-design-review-ui` | Dev | Design Review UI Integration |
| `feat/S16-P0-2-design-code-sync` | Dev | Design-to-Code Bidirectional Sync |
| `feat/S16-P1-1-firebase-mock` | Dev | Firebase Mock + Config |
| `feat/S16-P1-2-code-gen-components` | Dev | Code Generator Real Components |
| `feat/S16-P2-1-canvas-version-history` | Dev | Canvas Version History |
| `chore/S16-P2-2-mcp-docs` | Dev | MCP Tool Documentation |

---

## 5. Testing Requirements

### 5.1 覆盖率要求

| 层级 | 最低覆盖率 | 测量方式 |
|------|-----------|---------|
| 工具函数（`src/lib/`） | **80%** | `vitest --coverage` |
| Store（`src/stores/`） | **80%** | `vitest --coverage` |
| Hooks（`src/hooks/`） | **75%** | `vitest --coverage` |
| 组件（`src/components/`） | **60%** | `vitest --coverage` |
| 服务层（`src/services/`） | **70%** | `vitest --coverage` |
| **整体项目** | **70%** | `pnpm coverage:check` |

**强制检查**: `pnpm coverage:check` 失败则 CI 失败，禁止合并。

### 5.2 测试文件位置

```
src/
  ├── components/
  │   ├── DesignReviewPanel/
  │   │   ├── DesignReviewPanel.tsx
  │   │   ├── DesignReviewPanel.module.css
  │   │   └── DesignReviewPanel.test.tsx   ← 同目录
  │   └── ...
  ├── stores/
  │   ├── canvasHistoryStore.ts
  │   └── canvasHistoryStore.test.ts       ← 同目录
  ├── lib/
  │   ├── diffPatch.ts
  │   └── diffPatch.test.ts                ← 同目录
  ├── services/
  │   ├── firebaseService.ts
  │   └── firebaseService.test.ts         ← 同目录
tests/
  ├── e2e/
  │   ├── design-review.spec.ts           ← E2E 测试
  │   └── canvas-history.spec.ts
  └── unit/
      └── setup.ts                         ← 共享 setup
```

### 5.3 单元测试规范

- **框架**: Vitest
- **断言库**: Vitest 内置 `expect`
- **React Testing**: `@testing-library/react` + `@testing-library/user-event`
- **Mock 策略**: Jest mocks > MSW > 手动 mock
- **禁止**: `jest.fn().mockImplementation()` 在非必要场景

### 5.4 E2E 测试规范

- **框架**: Playwright
- **配置**: `tests/e2e/playwright.config.ts`
- **环境**: `BASE_URL=https://vibex-app.pages.dev`（CI）；本地 `http://localhost:3000`
- **每个提案至少 1 个 E2E 测试**：
  - S16-P0-1: `tests/e2e/design-review.spec.ts`
  - S16-P0-2: `tests/e2e/design-sync.spec.ts`
  - S16-P1-1: `tests/e2e/firebase-mock.spec.ts`
  - S16-P1-2: `tests/e2e/code-gen.spec.ts`
  - S16-P2-1: `tests/e2e/canvas-history.spec.ts`
  - S16-P2-2: `tests/e2e/mcp-docs.spec.ts`
- **无头运行**: `pnpm test:e2e:ci`
- **超时**: 单个 test 最大 60s

---

## 6. File Organization Rules

### 6.1 新组件放置

```
src/components/
├── <feature-name>/
│   ├── <ComponentName>.tsx
│   ├── <ComponentName>.module.css
│   ├── <ComponentName>.test.tsx        ← 单元测试（必须）
│   └── index.ts                         ← barrel export
```

**命名空间规则**:
- Sprint 16 新增组件按提案名组织目录
- 通用组件放 `components/common/`
- Canvas 相关组件放 `components/canvas/`
- AI/代码生成放 `components/code-gen/`

### 6.2 新服务层放置

```
src/services/
├── <feature>/
│   ├── <serviceName>.ts
│   └── <serviceName>.test.ts
```

Sprint 16 新服务：
- `src/services/firebase/` — S16-P1-1 Firebase Mock
- `src/services/code-generator/` — S16-P1-2 Code Generator
- `src/services/canvas-history/` — S16-P2-1 Version History
- `src/services/design-sync/` — S16-P0-2 Design-to-Code Sync

### 6.3 Store 放置

```
src/stores/
├── <feature>Store.ts
└── <feature>Store.test.ts
```

Sprint 16 新 Store：
- `src/stores/designReviewStore.ts` — S16-P0-1
- `src/stores/canvasHistoryStore.ts` — S16-P2-1
- `src/stores/firebaseConfigStore.ts` — S16-P1-1

### 6.4 文档放置

```
docs/
├── vibex-proposals-20260428-sprint16/
│   ├── AGENTS.md                        ← 本文件
│   ├── prd.md                           ← 产品需求
│   ├── analysis.md                      ← 技术分析
│   └── ...
├── solutions/                           ← 已解决问题文档
└── design/
    └── design-review/                   ← S16-P0-1 设计稿
```

### 6.5 禁止的操作

- **禁止**在 `app/` 目录直接写样式（必须在对应组件的 `.module.css`）
- **禁止**在 `src/lib/utils.ts` 追加无关联的通用函数
- **禁止**创建跨提案共享的 "Utils 大全"

---

## 7. API Contract Rules

### 7.1 REST 风格约定

| 操作 | 方法 | 路径示例 |
|------|------|---------|
| 获取列表 | `GET` | `/api/canvas-history/:projectId` |
| 创建资源 | `POST` | `/api/design-reviews` |
| 更新资源 | `PATCH` | `/api/design-reviews/:id` |
| 删除资源 | `DELETE` | `/api/canvas-history/:id` |

### 7.2 错误响应格式（强制）

所有 API 错误必须返回：

```typescript
interface ApiError {
  error: string;        // 人类可读消息（用于 UI 显示）
  code: string;         // 机器可读错误码，如 `CANVAS_HISTORY_NOT_FOUND`
  details?: unknown;    // 可选附加信息
}
```

**HTTP 状态码**:
- `400` — 参数错误
- `401` — 未认证
- `403` — 无权限
- `404` — 资源不存在
- `429` — 请求频率超限
- `500` — 服务器内部错误

### 7.3 Firebase Firestore 规则

```
projects/{projectId}/designReviews/{reviewId}
projects/{projectId}/canvasHistory/{historyId}
```

禁止在客户端直接暴露 Firestore 规则配置，所有访问通过 `src/services/firebase/` 层。

---

## 8. Security Constraints

### 8.1 输入校验

- **所有外部输入** 必须通过 `zod` schema 校验（项目已有 `^4.3.6`）
- **禁止**直接拼接用户输入到 SQL/DOM/Firestore 查询
- **DOMPurify** 用于所有富文本渲染输入（项目已有）

### 8.2 认证与授权

- Firebase Auth 用于用户身份验证（S16-P1-1 引入 mock）
- 所有 API 调用前检查 `user.uid`
- **禁止**在客户端存储敏感 token（使用 Firebase ID Token）
- **禁止**在代码中硬编码 API 密钥

### 8.3 禁止的代码模式

```typescript
// ❌ 禁止：eval / Function 动态执行
eval(userInput);

// ❌ 禁止：innerHTML 直接插入
element.innerHTML = userInput;

// ❌ 禁止：直接暴露 Firestore 安全规则
// Firestore.rules 文件必须放在项目根目录且被 gitignore
// 实际部署通过 Firebase Console 管理

// ❌ 禁止：console.log 敏感信息
console.log('API Key:', apiKey);

// ❌ 禁止：Secrets in code
const API_KEY = 'sk-xxx'; // 任何 .ts/.tsx 文件
```

### 8.4 扫描工具

**Pre-commit 扫描**（已配置）:
- `gitleaks` — 禁止密钥泄露
- `actionlint` — GitHub Actions 安全

**CI 扫描**:
- `pnpm scan:vuln` — npm audit，moderate 及以上必须修复

---

## 9. Performance Constraints

### 9.1 Bundle Size

| 指标 | 目标 | 监控 |
|------|------|------|
| 首页 JS | `< 200KB`（gzipped） | `@next/bundle-analyzer` |
| Canvas 路由 JS | `< 500KB`（gzipped） | 同上 |
| 整体 LCP | `< 2.5s` | Playwright 性能测试 |
| CLS | `< 0.1` | 同上 |

**监控命令**:
```bash
pnpm build 2>&1 | grep "First Load JS"
```

### 9.2 Canvas 版本历史性能

- **最大快照数**: 每个 Canvas 项目保留最近 50 个快照
- **快照大小限制**: 单个快照最大 500KB
- **防抖**: Canvas 操作防抖 500ms 后触发保存
- **异步处理**: 版本历史 diff 计算必须在 Web Worker 或 `requestIdleCallback` 中执行，**禁止**阻塞主线程

### 9.3 冷启动

- Next.js App Router 页面冷启动 `< 3s`（Vercel/Cloudflare Pages）
- **禁止**在 `page.tsx` 顶层直接调用数据获取（用 Server Component + RSC）

### 9.4 内存约束

- 单个 React 组件树最大 50MB 内存占用
- Monaco Editor 实例最多 3 个（同一页面内）
- `zustand` store 禁止存储大型二进制数据

---

## 10. Design Compliance

### 10.1 强制规范（违反 = PR 驳回）

| 规范 | 验证方式 |
|------|---------|
| 使用 `design-tokens.css` 变量 | `grep "#[0-9a-fA-F]{3,8}" src/**/*.module.css` 必须为空 |
| 无内联颜色 | `grep -rn "style={{" src/ --include="*.tsx"` 颜色相关内容为空 |
| 玻璃态使用 `backdrop-filter: blur()` | `src/styles/utilities.css` 定义优先复用 |
| 主色调 `#00ffff` | 禁止引入新的主色调 |
| 字体 Geist | 禁止引入其他字体 |
| 深色模式 | 禁止创建浅色主题或响应 `prefers-color-scheme` |

### 10.2 引用文件

所有设计相关实现必须引用 `DESIGN.md` 对应章节：

```typescript
// 实现后添加注释说明符合 DESIGN.md 哪个规范
// See: DESIGN.md §3.1 — Color System (--color-primary: #00ffff)
// See: DESIGN.md §11.1 — Glassmorphism pattern
```

### 10.3 新增设计元素流程

若 Sprint 16 提案需要新增设计变量（如新的状态色）：

1. 在 `DESIGN.md` 中提出变更请求
2. Architect Agent 审批
3. 更新 `src/styles/design-tokens.css`
4. 更新 `src/styles/tokens.ts`
5. 在 PR 描述中说明变更理由

**禁止**在组件中直接写新颜色绕过此流程。

---

## 11. DoD Checklist

所有 Sprint 16 PR 必须满足以下条件才能合并：

### 代码质量
- [ ] `pnpm lint` 输出 0 warnings
- [ ] `pnpm typecheck`（`tsc --noEmit`）通过
- [ ] `pnpm build` 成功，无错误无警告
- [ ] **无内联样式**用于颜色/字体/间距（用 CSS 变量）
- [ ] 所有新组件有对应的 `.module.css` 文件
- [ ] 所有新组件有单元测试（覆盖率达标）

### 测试
- [ ] `pnpm test:unit` 全部通过
- [ ] `pnpm test:e2e` 全部通过（CI 环境）
- [ ] `pnpm coverage:check` 整体覆盖率 ≥ 70%
- [ ] 新增服务/工具函数覆盖率 ≥ 80%
- [ ] 每个提案至少 1 个 E2E 测试

### 设计
- [ ] 符合 `DESIGN.md` 所有规范
- [ ] 使用设计令牌（`var(--color-*)` 等），无硬编码颜色
- [ ] 玻璃态效果使用 `backdrop-filter: blur(20px)`
- [ ] 霓虹发光使用 `DESIGN.md` 定义的 shadow 变量
- [ ] 无新颜色/字体引入

### 安全
- [ ] 所有用户输入通过 `zod` 校验
- [ ] 无 secrets/keys 提交（`gitleaks` 通过）
- [ ] `pnpm scan:vuln` 无 moderate+ 漏洞

### Git
- [ ] 分支名符合规范（`feat/S16-xxx-*`）
- [ ] Commit message 符合 Conventional Commits
- [ ] PR 标题包含 ticket ID
- [ ] CI 全部通过（lint + test + build + e2e）
- [ ] 至少 1 人 Review approve

### 文档
- [ ] 更新 `DESIGN.md`（如有设计变更）
- [ ] 新 API 端点在内部文档说明
- [ ] README 更新（如有配置变更）

---

## 12. Sprint 16 提案快速索引

| Ticket | 提案名 | 关键约束 |
|--------|--------|---------|
| S16-P0-1 | Design Review UI Integration | UI 符合 DESIGN.md §11，新增 `designReviewStore` |
| S16-P0-2 | Design-to-Code Bidirectional Sync | diff 计算在 Worker 中，防抖 500ms |
| S16-P1-1 | Firebase Mock + Config | 使用 `firebase-tools ^13.x` 本地模拟，不上生产 |
| S16-P1-2 | Code Generator Real Components | 代码生成输出到 `src/components/code-gen/` |
| S16-P2-1 | Canvas Version History | 最多 50 快照，单个 ≤ 500KB，用 `jsondiffpatch` |
| S16-P2-2 | MCP Tool Documentation | 文档在 `docs/mcp-tools/`，不写运行时代码 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260428-sprint16
- **执行日期**: 2026-04-28
