# VibeX 产品体验优化 — 开发规范

**项目**: vibex-pm-proposals-vibex-build-fixes-20260411
**角色**: Architect
**日期**: 2026-04-11

---

## 1. 代码规范

### 1.1 TypeScript 规范

- **严格模式**: 所有新文件启用 `strict: true`
- **类型优先**: 优先使用 `interface` 定义数据结构，`type` 用于联合/交叉类型
- **禁止 `any`**: 必须使用 `unknown` + 类型守卫，或显式声明具体类型
- **Zod schema 共享**: `@vibex/types` 包中的 Zod schema 是前端和后端的唯一真相来源，禁止各自定义重复的验证逻辑

```typescript
// ✅ 正确
import { AuthResponseSchema } from '@vibex/types/auth';
const result = AuthResponseSchema.safeParse(response);

// ❌ 错误
const result = response as any;
```

### 1.2 React 组件规范

- **文件命名**: `PascalCase.tsx`（组件）或 `camelCase.tsx`（工具函数）
- **Hooks 规范**: 自定义 Hook 以 `use` 开头，单独文件存放于 `hooks/`
- **组件拆分**: 单个组件不超过 200 行，超出则拆分
- **禁止内联函数作为 props**：超出 3 次使用的回调函数需提取为 `useCallback`

```typescript
// ✅ 正确
const handleSubmit = useCallback(() => { ... }, [deps]);
<Button onClick={handleSubmit} />

// ❌ 错误
<Button onClick={() => handleSubmit()} />
```

### 1.3 CSS / CSS Module 规范

- **内联样式禁止**: Epic 4.4 要求 Auth 页面全面迁移 CSS Module；新代码禁止内联 `style={}`，使用 `module.css`
- **CSS Variable**: 全局颜色/间距使用 `globals.css` 中的 CSS 变量，禁止硬编码颜色值
- **BEM 命名**: CSS Module 使用 `Block__Element--Modifier` 约定

### 1.4 安全规范（Epic 1 专项）

| 规则 | 说明 | 违规处理 |
|------|------|----------|
| **无前端 JWT 解码** | 前端禁止出现 `atob(jwt)` `parseJWT` `jwt.decode` 等 | PR 驳回 |
| **无前端权限判断** | 前端禁止出现 `ROLE_PERMISSIONS` `user.role === 'admin'` | PR 驳回 |
| **敏感数据不打印** | `console.log` 禁止输出 token、password、email | ESLint 规则 |
| **API 鉴权** | 所有非公开 API 端点必须有权限中间件 | 后端 review |

### 1.5 测试规范

- **每个 Story 至少一个测试**: Vitest unit test 或 Playwright E2E
- **覆盖率门槛**: 核心 Hooks（`useDebouncedAI` `useAuth` `useCanvas`）覆盖率 ≥ 80%
- **E2E 关键路径**: Auth 登录 → Dashboard → Canvas → AI 操作，全链路覆盖
- **禁止只测 happy path**: 必须覆盖错误场景（网络错误、超时、权限拒绝）

### 1.6 Git 规范

- **分支命名**: `feat/epic-{n}-{story-id}` 或 `fix/epic-{n}-{issue-id}`
- **Commit message**: `[{Epic}] {Story ID} {简短描述}`，如 `[Epic1] 1.1 移除前端RBAC逻辑`
- **PR size**: 单个 PR 不超过 400 行 diff，超出则拆分
- **PR 描述**: 必须包含测试结果截图和自测 Checklist

---

## 2. 变更范围约束

### 2.1 允许变更的文件

| Epic | 允许变更目录/文件 |
|------|------------------|
| Epic 1 | `vibex-frontend/src/app/dashboard/` `vibex-frontend/src/components/generation-progress/` `vibex-frontend/src/middleware.ts` `vibex-backend/src/auth/` `vibex-backend/src/api/` `@vibex/types/` |
| Epic 2 | `vibex-frontend/src/app/confirm/` `vibex-frontend/src/app/project-settings/` `vibex-frontend/src/app/` (root page) `vibex-frontend/src/app/export/` `vibex-frontend/src/app/auth/` |
| Epic 3 | `vibex-frontend/src/app/canvas/` `vibex-frontend/src/components/canvas/` `vibex-frontend/src/hooks/useDebouncedAI.ts` `vibex-frontend/src/app/design/[id]/` `vibex-frontend/src/app/chat/` |
| Epic 4 | `vibex-frontend/src/app/auth/` `vibex-frontend/src/app/dashboard/` `vibex-frontend/src/components/dashboard/` `vibex-frontend/src/components/auth/` `@vibex/types/` |
| Epic 5 | `vibex-frontend/src/app/onboarding/` `vibex-frontend/src/components/onboarding/` |
| Epic 6 | `vibex-frontend/src/app/flow/components/ProjectCreationStep.tsx` `vibex-frontend/src/app/flow/components/BusinessFlowStep.tsx` |

### 2.2 禁止变更的文件（除非明确授权）

| 文件路径 | 原因 |
|---------|------|
| `vibex-frontend/src/app/landing/` | Landing 页面独立迭代，本次范围外 |
| `vibex-backend/prisma/schema.prisma` | 数据库迁移需 DBA review |
| `vibex-frontend/src/app/providers/` | 全局 Context Provider，变更影响范围大 |
| `packages/types/index.ts` | 共享类型，需向后兼容 |
| `.github/workflows/` | CI/CD 配置需 DevOps review |

### 2.3 变更传播限制

- **Epic 4.4 样式迁移**: 只迁移 `app/auth/` 下的内联样式，不影响其他页面
- **Epic 1.1 权限后移**: 后端 API 变更必须向后兼容，除非明确 break change
- **Epic 3.4 手势**: 移动端增强不影响桌面端现有交互

---

## 3. 质量门槛

### 3.1 代码质量

| 指标 | 门槛 | 检测方式 |
|------|------|----------|
| TypeScript 错误 | 0 errors | `pnpm tsc --noEmit` |
| ESLint 错误 | 0 errors, 0 warnings（新增代码） | `pnpm lint` |
| Stylelint | 0 errors（CSS Module 文件） | `pnpm lint:css` |
| 包大小增量 | 前端 bundle 增量 ≤ 50KB（gzip） | `pnpm analyze` |
| 新增依赖 | 需 Architect 批准（Epic 3.4 手势库预批准） | PR review |

### 3.2 测试覆盖

| 类型 | 覆盖率门槛 | 关键文件 |
|------|-----------|----------|
| 单元测试 | Hooks ≥ 80% | `hooks/useDebouncedAI.ts` `hooks/useAuth.ts` |
| 单元测试 | 工具函数 ≥ 70% | `lib/error-mapper.ts` |
| E2E | Auth → Dashboard → Canvas ≥ 100% | `tests/e2e/` |
| E2E | AI 操作全流程 ≥ 100% | `tests/e2e/design/` |

### 3.3 性能门槛

| 指标 | 门槛 | 测试方式 |
|------|------|----------|
| Lighthouse Performance | ≥ 85（Canvas 页面） | `lhci` CI 集成 |
| First Contentful Paint | ≤ 2.0s | Lighthouse |
| Canvas 渲染帧率 | ≥ 50fps（桌面端） | Chrome DevTools Performance |
| AI 输入 debounce | 300ms ± 10% | Vitest |
| SaveIndicator 刷新 | ≤ 1 req/30s | Network tab |

### 3.4 安全门槛

| 检查项 | 门槛 | 工具 |
|--------|------|------|
| 前端 RBAC 代码 | 0 行（Epic 1.1 后） | `grep` CI |
| 敏感信息泄露 | 0 处 | `git-secrets` / CI |
| 依赖漏洞 | 0 Critical/High | `pnpm audit` |
| XSS 风险 | 0 高风险 | Code review |

### 3.5 发布门槛

| 条件 | 说明 |
|------|------|
| Sprint 1 发布 | 所有 P1 问题（1.2-1.5）验收通过 + Staging PM 确认 |
| Sprint 2 发布 | 所有 P1 问题（1.1）验收通过 + Canvas E2E 100% + Onboarding 可用 |
| 项目整体 | 0 P1 遗留 + P2 覆盖率 ≥ 80% + CI 全绿 |

---

## 4. PR Checklist（每个 PR 必须勾选）

```markdown
## PR Checklist

### 功能
- [ ] 代码修改点与 Story 验收标准一一对应
- [ ] 新增功能有 E2E 测试覆盖
- [ ] 错误场景有测试覆盖

### 代码质量
- [ ] `pnpm tsc --noEmit` 无错误
- [ ] `pnpm lint` 无新增警告
- [ ] 无 `console.log` 敏感数据
- [ ] 组件拆分合理（< 200 行）

### 测试
- [ ] `pnpm test:unit` 全通过
- [ ] `pnpm test:e2e:local` 全通过（如涉及 UI）
- [ ] 覆盖率无下降

### 安全（Epic 1 相关）
- [ ] 前端无 JWT 解码逻辑
- [ ] 前端无权限判断代码
- [ ] API 鉴权已添加

### 变更范围
- [ ] 变更仅在允许的目录/文件内
- [ ] 未修改禁止变更的文件

### 发布
- [ ] 已在 staging 环境自测
- [ ] 部署顺序已确认（后端先上 / 前端后上）
```

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks 项目 ID（待主 agent 绑定）
- **执行日期**: 2026-04-11
