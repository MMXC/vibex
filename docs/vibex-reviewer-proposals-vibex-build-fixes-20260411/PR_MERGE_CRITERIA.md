# VibeX PR 合入标准

**文档路径**: `docs/PR_MERGE_CRITERIA.md`
**版本**: v1.0
**日期**: 2026-04-11
**维护者**: reviewer + dev team

---

## 1. 构建检查（必须通过）

| 检查项 | 命令 | 退出码 | 说明 |
|--------|------|--------|------|
| TypeScript 编译 | `cd vibex-fronted && pnpm exec tsc --noEmit` | 0 | 无类型错误 |
| ESLint | `cd vibex-fronted && pnpm lint` | 0 | 无 lint 错误 |
| 前端构建 | `cd vibex-fronted && pnpm build` | 0 | 构建成功（CI 环境需 NODE_OPTIONS） |
| 后端构建 | `cd vibex-backend && pnpm build` | 0 | 构建成功 |
| 依赖安全 | `pnpm audit --audit-level=high` | 0 | 无高危漏洞 |

> ⚠️ **注意**: CI 环境内存受限，`pnpm build` 可能 OOM。需在 CI workflow 中设置 `NODE_OPTIONS: "--max-old-space-size=4096"`。

---

## 2. 代码质量

### 2.1 格式化
- 所有代码通过 Prettier 格式化（无需手动 `pnpm format`）
- 检查命令: `pnpm format:check`（CI 自动运行）

### 2.2 测试覆盖率

| 模块 | 覆盖率门槛 | 说明 |
|------|------------|------|
| 新增函数 | ≥ 80% | 单元测试 |
| 关键路径（认证/支付/删除） | 100% | 边界条件全覆盖 |
| 组件渲染 | ≥ 70% | 快照或行为测试 |
| API 层（client.ts / api） | ≥ 80% | 状态码覆盖 |

检查命令:
```bash
pnpm test -- --coverage
```

### 2.3 测试通过率
- 所有 Vitest 测试 100% 通过
- 无 `test.skip` / `test.only` 遗留
- 无 timeout 宽松设置（默认 5000ms）

---

## 3. 安全检查

### 3.1 敏感信息
- ❌ 禁止 `API_KEY` / `SECRET` / `PASSWORD` 硬编码
- ❌ 禁止 `.env` 提交（应使用 `.env.example`）
- ❌ 禁止 `console.log` 生产代码（允许 `canvasLogger` / `safeError`）

检查: ESLint rule `no-console` 已配置

### 3.2 依赖安全
- 使用 `npm audit` 或 `pnpm audit`
- 已知漏洞必须修复（高危）或加白并说明

### 3.3 认证安全
- API 路由必须有权限检查（401/403 返回）
- `middleware.ts` 保护所有受保护路由
- `validateReturnTo()` 防止开放重定向

---

## 4. 提交流程

### 4.1 Commit Message 规范
```
<type>(<scope>): <subject>

[type]: feat | fix | refactor | test | docs | chore
[scope]: 模块路径或功能域（如 auth/canvas/dashboard）
[subject]: 简洁描述，不超过 72 字
```

示例:
```
feat(auth): E1 — add 401 redirect with returnTo

- Add AuthError class for 401 distinction
- httpClient dispatches auth:401 CustomEvent
- useAuth listener redirects to /auth
Epic1-401: S1.1+S1.2
```

### 4.2 PR 描述模板
```markdown
## 变更内容
- ...

## 验证方式
- [ ] TypeScript 编译通过
- [ ] `pnpm test` 全部通过
- [ ] `pnpm build` 成功（NODE_OPTIONS 已设置）
- [ ] 安全检查通过

## 相关文档
- 方案: docs/.../IMPLEMENTATION_PLAN.md
- CHANGELOG.md 已更新
```

---

## 5. Review Checklist（Reviewer 用）

| # | 检查项 | 通过标准 |
|---|--------|----------|
| 1 | 构建通过 | CI pipeline 全部 ✅ |
| 2 | 测试通过 | 100% pass，无 flaky |
| 3 | 覆盖率达标 | 核心文件 ≥ 80% |
| 4 | CHANGELOG 更新 | `## [Unreleased]` 下有变更记录 |
| 5 | IMPLAN/AGENTS 更新 | 如有方案文档变更 |
| 6 | 无敏感信息 | 密钥/密码/Token 未提交 |
| 7 | 架构一致性 | 新增 store/组件符合现有架构 |
| 8 | 性能影响 | 无明显的 O(n²) 或内存泄漏 |

---

## 6. 驳回标准（Reviewer 触发）

以下情况 PR 必须驳回：

| 触发条件 | 严重程度 | 动作 |
|----------|----------|------|
| TypeScript 编译失败 | P0 | 立即驳回 |
| 测试失败 | P0 | 立即驳回 |
| 覆盖率为 0（新增代码） | P1 | 驳回重做 |
| 敏感信息硬编码 | P0 | 立即驳回 |
| CHANGELOG 未更新 | P2 | 驳回补充 |
| 方案文档未更新 | P1 | 驳回补充 |

---

*最后更新: 2026-04-11 | 版本: v1.0*
