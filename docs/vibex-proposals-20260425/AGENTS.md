# VibeX Sprint 8 — 开发约束规范（AGENTS.md）

> **生效范围**: Sprint 8 全阶段
> **版本**: v1.0
> **最后更新**: 2026-04-25

---

## 1. 技术栈约束表

| 维度 | 约束 | 理由 |
|------|------|------|
| 框架 | React 19 + TypeScript + Next.js | 现有 |
| 样式 | CSS Modules + CSS Custom Properties | 现有，禁止引入新方案 |
| 状态 | Zustand | 现有，禁止引入新状态管理 |
| 测试 | Vitest + Playwright | 现有 |
| 类型 | @cloudflare/workers-types | Sprint 8 新增 |
| Firebase | REST API（不引入完整 SDK） | 保持现状，验证可行后再升级 |

### 强制禁止事项

- ❌ 不得引入新的前端状态管理（Zustand 之外）
- ❌ 不得引入新的 CSS 方案（Tailwind、Styled Components 等）
- ❌ 不得引入 Firebase 完整 SDK（保持 REST API）
- ❌ 不得引入新的运行时依赖（需 Architect + Tech Lead 双签）

---

## 2. 文件操作约束

### P001 TypeScript 债务

**允许修改**
- `tsconfig.json`（strict 模式配置）
- `package.json`（新增 @cloudflare/workers-types）
- `.github/workflows/*.yml`（CI 类型门禁）
- 所有 `src/**/*`（类型修复）

**禁止操作**
- 删除现有类型定义文件
- 降低 `strict` 级别
- 将 `any` 作为修复手段（必须使用 `unknown` + 收窄）

---

### P002 Firebase Analytics

**允许修改**
- `src/lib/firebase/presence.ts`（性能测试）
- 新建测试文件（E2E）
- `src/app/dashboard/page.tsx`（Analytics widget）

**禁止操作**
- 引入 `firebase/app` 或完整 SDK
- 修改 Firebase REST API 端点
- 删除现有 analytics 事件定义

---

### P003 Import/Export

**允许修改**
- 新建 E2E 测试文件：
  - `json-roundtrip.spec.ts`
  - `yaml-roundtrip.spec.ts`
  - `file-size-limit.spec.ts`
- `src/components/FileUploader.tsx`
- `src/app/teams/page.tsx`

**禁止操作**
- 引入新的文件格式解析库（需 Architect 审批）
- 修改现有 export schema
- 绕过文件大小限制（安全边界）

---

### P004 模板更新

**允许修改**
- `docs/coord-review-process.md`
- `docs/prd-template.md`
- `docs/spec-template.md`

**禁止操作**
- 修改 `AGENTS.md` 约束条款
- 删除现有的 Review Checklist 条款

---

## 3. 代码规范

### TypeScript

```json
// tsconfig.json 强制配置
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Cloudflare Workers 类型

- 使用 `@cloudflare/workers-types` 定义 Request/Response/Env 类型
- 禁止使用 `any` 作为 `fetch` 返回类型
- 正确处理 `ExecutionContext` 和 `CfProperties`

```typescript
// ✅ 正确
import type { AppLoadContext } from 'next/dist/build/swc/generated-native/wasm';
import type { KVNamespace } from '@cloudflare/workers-types';

interface Env {
  VIBEX_KV: KVNamespace;
}

// ❌ 错误
const data: any = await fetch(url);
```

### Firebase REST API

- 必须使用原生 `fetch`，禁止引入 `firebase/app`
- 处理 401/403/429 响应码
- 实现 7 天 TTL 缓存策略

```typescript
// ✅ 正确
const response = await fetch(
  `https://firebase-api/v1/projects/${projectId}/events`,
  { headers: { Authorization: `Bearer ${token}` } }
);

// ❌ 错误
import { initializeApp } from 'firebase/app';
```

### CSS 变量命名

- 所有设计 token 定义在 `src/styles/design-tokens.css`
- 命名规范：`--color-{component}-{variant}`（例：`--color-button-primary-bg`）
- 禁止硬编码颜色值（#fff 等必须提取为变量）

### 无障碍（Accessibility）

- 所有交互元素必须有 `aria-label` 或 `aria-labelledby`
- 表单输入必须有 `<label>` 关联
- 使用语义化 HTML（`<button>` 而非 `<div onClick>`）
- 确保 Keyboard Navigation 可达

---

## 4. 测试覆盖率门禁

| Epic | 文件 / 范围 | 覆盖率要求 | 门禁类型 |
|------|------------|-----------|---------|
| P001 | 所有 `src/**/*.ts` | 80% line | Vitest 单元测试 |
| P001 | `tsconfig.json` 配置 | 100% | 自动化 CI |
| P002 | Firebase REST API 响应 | 100% | Playwright E2E |
| P002 | Analytics 数据 7d TTL | 100% | Playwright E2E |
| P003 | JSON round-trip | 100% | Playwright E2E |
| P003 | YAML round-trip | 100% | Playwright E2E |
| P003 | 文件大小限制 | 100% | Playwright E2E |
| P004 | Coord 评审清单 | 100% | 文档自动化（脚本校验） |

### 覆盖率计算规则

- Line Coverage（行覆盖率）≥ 目标值
- 关键路径（登录/导出/导入）必须 100% 覆盖
- 禁止 Mock 掉核心业务逻辑

---

## 5. CI/CD 约束

### 必须存在的门禁

| 门禁 | 命令 | 通过条件 |
|------|------|---------|
| TypeScript 编译 | `npx tsc --noEmit` | Exit Code 0 |
| Vitest 单元测试 | `npx vitest run` | Exit Code 0 |
| Playwright E2E | `npx playwright test` | Exit Code 0 |
| ESLint | `npx eslint .` | Exit Code 0 |

### 禁止绕过

- ❌ 禁止使用 `--skipLibCheck`
- ❌ 禁止 `tsconfig.json` 中 `noEmit: true` 绕过类型检查
- ❌ 禁止 `git push --no-verify`
- ❌ 禁止禁用 Playwright CI 模式

### GitHub Actions 强制检查

```yaml
# .github/workflows/ci.yml 必须包含
jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - run: npx tsc --noEmit

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npx vitest run --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test
```

---

## 6. 提交规范

### Commit Message 格式

```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

### Type 分类

| Type | 含义 | 示例 |
|------|------|------|
| feat | 新功能 | `feat(import): 添加 JSON 文件导入` |
| fix | Bug 修复 | `fix(firebase): 修复 presence 内存泄漏` |
| types | 类型修复 | `types(canvas): 完善 Node 泛型约束` |
| test | 测试相关 | `test(export): 添加 JSON round-trip E2E` |
| chore | 工具/依赖 | `chore(deps): 添加 @cloudflare/workers-types` |
| docs | 文档更新 | `docs(templates): 更新 PRD 模板` |
| refactor | 重构 | `refactor(presence): 提取独立 fetch hook` |
| perf | 性能优化 | `perf(firebase): 批量获取减少 API 调用` |

### Epic 专属 Commit 示例

**P001 TypeScript 债务**

```bash
# 类型修复
git commit -m "types(canvas): 完善 CanvasNodeProps 泛型定义

- 为自定义节点添加完整泛型约束
- 修复 React Flow 15.x 类型兼容问题
Closes: #P001-S2"

# 配置更新
git commit -m "chore(tsconfig): 启用 noUncheckedIndexedAccess
Closes: #P001-S1"
```

**P002 Firebase**

```bash
# 性能测试
git commit -m "test(firebase): 添加 presence API 响应时间 E2E

- 测试 100 并发连接场景
- 验证 7 天 TTL 缓存策略
Closes: #P002-S3"

# Dashboard widget
git commit -m "feat(dashboard): 集成 Firebase Analytics widget

- 展示 7 天活跃用户趋势
- 事件漏斗可视化
Closes: #P002-S4"
```

**P003 Import/Export**

```bash
# JSON round-trip
git commit -m "test(export): JSON round-trip E2E 完整覆盖

- 验证节点数据完整性
- 验证元数据不丢失
- 验证 UTF-8 编码正确
Closes: #P003-S1"

# 文件大小限制
git commit -m "test(upload): 文件大小限制边界测试

- 1MB 以下: 通过
- 5MB: 通过
- 10MB: 拒绝 + 友好错误提示
Closes: #P003-S2"
```

**P004 模板更新**

```bash
# 模板更新
git commit -m "docs(templates): 更新 coord-review-process.md

- 新增 TypeScript 类型检查标准
- 更新覆盖率门禁要求
Closes: #P004-S1"
```

### 提交前检查清单

- [ ] `npx tsc --noEmit` 通过
- [ ] `npx vitest run` 通过
- [ ] `npx eslint .` 无 error
- [ ] Commit message 符合格式
- [ ] 相关测试用例已更新

---

## 7. E2E 检查清单

### Playwright 测试通过

- [ ] `json-roundtrip.spec.ts` 全场景通过
- [ ] `yaml-roundtrip.spec.ts` 全场景通过
- [ ] `file-size-limit.spec.ts` 边界值覆盖
- [ ] `firebase-presence.spec.ts` 性能断言通过

### Console 清洁

- [ ] 无 `console.error`（警告允许）
- [ ] 无未捕获的 Promise Rejection
- [ ] 无 React 渲染错误
- [ ] 无 404 资源请求

### Lighthouse 性能

| 指标 | 阈值 |
|------|------|
| Performance | ≥ 90 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |

### 可访问性检查

- [ ] `axe-core` 无 critical / serious 问题
- [ ] 所有图片有 `alt` 属性
- [ ] 颜色对比度符合 WCAG AA（4.5:1）
- [ ] Focus 顺序符合逻辑

---

## 8. 附录

### Sprint 8 Epic 映射

| Epic ID | Epic 名称 | Owner |
|---------|----------|-------|
| P001 | TypeScript 债务清偿 | TypeScript Team |
| P002 | Firebase Analytics 完善 | Firebase Team |
| P003 | Import/Export 增强 | Import/Export Team |
| P004 | 模板与文档更新 | Docs Team |

### 参考文档

- [React 19 官方文档](https://react.dev)
- [Cloudflare Workers 类型定义](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
- [Vitest 覆盖率配置](https://vitest.dev/guide/coverage.html)
- [Playwright CI 模式](https://playwright.dev/docs/ci)

---

**变更记录**

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-04-25 | Sprint 8 初始版本 |
