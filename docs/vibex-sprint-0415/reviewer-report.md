# Review Report: vibex-sprint-0415 / reviewer-epic1-dds路由构建修复

**Reviewer**: REVIEWER | **Date**: 2026-04-17
**Sprint**: vibex-sprint-0415 | **Epic**: Epic1-DDS路由构建修复
**Commits reviewed**: `384ff637` (fix), `ea5119ac` (docs)

---

## INV 检查（审查前自检）

| # | 检查项 | 结果 |
|---|--------|------|
| INV-0 | 读过文件了吗？ | ✅ 读了 git show diff |
| INV-1 | 改了源头，消费方 grep 过了吗？ | ✅ `_redirects` 已在 public/，e2e 用 route mock |
| INV-2 | 格式对了，语义呢？ | ✅ 删除 vs redirect，语义正确 |
| INV-4 | 同一件事写在了几个地方？ | ✅ learnings 存在，changelog 待补 |
| INV-5 | 复用这段代码，我知道原来为什么这么写吗？ | ✅ learnings doc 解释了来龙去脉 |
| INV-6 | 验证从用户价值链倒推了吗？ | ✅ DDS API 调用链路：画布 → /api/v1/dds/* → backend |
| INV-7 | 跨模块边界有没有明确的 seam_owner？ | ✅ seam: `_redirects` / Cloudflare Pages |

---

## 审查结论: ✅ PASSED

代码改动正确，审查通过。

---

## 代码变更摘要

### `384ff637` — fix(dds): remove catch-all API route, rely on _redirects for DDS proxy

删除：
- `vibex-fronted/src/app/api/v1/dds/[...path]/route.ts` (106 lines)
- `vibex-fronted/src/app/api/v1/dds/[...path]/route.test.ts` (161 lines)

**根因**: Next.js `output: 'export'` 静态导出与 `[...path]` catch-all 动态路由不兼容。即使加 `export const dynamic = "force-static"`，Next.js 仍要求 `generateStaticParams()` 返回非空数组——这对于运行时动态的 DDS 路径是不可能的。

**解决方案**: 删除 route.ts，依赖 `public/_redirects` 的 `/api/* → https://api.vibex.top/api/:splat` 做代理。

**Trade-off**（已在 commit message 中记录）:
- `_redirects` 无法转发 cookie（认证信息）
- 适用于 DDS API（无需认证或用其他方式传 token）

### `ea5119ac` — docs: add learnings - frontend should not have catch-all API routes

新增 `docs/.learnings/vibex-dds-route-revert-0416.md`，记录了完整的决策链和经验教训。文档质量高。

---

## 审查详情

### 🔴 Blockers: 无

### 🟡 遗留问题（需追踪，非本次 review 范畴）

1. **Bug1 changelog 矛盾**: `CHANGELOG.md` 中存在 "Bug Fixes — 2026-04-15" 条目记录了"修复 route.ts 添加 proxy"，但 sprint-0415 已经删除了该文件。两条记录冲突。
   - 位置: CHANGELOG.md L107-112
   - 建议: 后续清理该矛盾条目，或在 Bug1 条目中注明"已 revert by sprint-0415"

2. **e2e 测试注释过时**: `e2e/dds-canvas-load.spec.ts` 注释中仍有 "Next.js proxy: /api/v1/dds/[...path]/route.ts"（L13），但该文件已不存在。注释不影响测试运行（测试用 route mock），建议更新注释。

### 💭 Nits

1. `route.test.ts` 被删除后，其测试的 URL 构造逻辑仍有价值（`buildProxyUrl` 函数），但因为是 server-only 代码，无法在前端单元测试中覆盖。已通过 e2e 的 route mock 间接覆盖，可接受。

---

## changelog 状态

| 文件 | vibex-sprint-0415 Epic1 条目 |
|------|------------------------------|
| `CHANGELOG.md` | ❌ 缺失 |
| `src/app/changelog/page.tsx` | ❌ 缺失 |

**Reviewer 行动**: 由 reviewer 补充 changelog 条目（按 AGENTS.md 规范）。

---

## 下一步（Reviewer 执行）

1. ✅ 代码审查通过
2. ⬜ 更新 `CHANGELOG.md`（新增 Epic1-DDS路由构建修复条目）
3. ⬜ 更新 `vibex-fronted/src/app/changelog/page.tsx`
4. ⬜ `git add . && git commit -m "review: vibex-sprint-0415/epic1-dds路由构建修复 approved"`
5. ⬜ `git commit -m "docs: update changelog for vibex-sprint-0415 Epic1"`
6. ⬜ `git push`
7. ⬜ 更新任务状态 → done
8. ⬜ 发 Slack 报告
