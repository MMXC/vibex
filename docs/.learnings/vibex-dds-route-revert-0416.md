# vibex-dds-route-revert-0416 经验沉淀

**日期**: 2026-04-16
**决定人**: 小羊

---

## 背景

最初为解决 `/api/v1/dds/*` 在 Cloudflare Pages 环境下 404 问题，在 `vibex-fronted/src/app/api/v1/dds/[...path]/route.ts` 中实现了 Next.js API proxy。

详见 `vibex-fix-canvas-bugs.md` 的 Bug1 记录。

---

## 问题

`output: 'export'`（Next.js 静态导出）与 `[...path]` catch-all 动态路由根本性不兼容：

- Next.js 16.2.0 要求 catch-all 路由提供 `generateStaticParams()`
- `generateStaticParams` 不可能返回非空数组（DDS 路径是运行时动态的）
- 即使加 `export const dynamic = "force-static"`，错误依然：`missing generateStaticParams()`

两种解法：

| 方案 | 内容 | 状态 |
|------|------|------|
| standalone build | 启用 SSR，`pnpm build` 通过 | 后被 revert |
| 回退静态 export + _redirects | 删除 route.ts，依赖 `_redirects` | ✅ 最终采纳 |

---

## 最终决策

**删掉** `/api/v1/dds/[...path]/route.ts`，**恢复** `package.json` 的 `build` 为 `next build`，依赖 `public/_redirects` 的 `/api/* → https://api.vibex.top/api/:splat` 做代理。

Commit: `384ff637`

---

## 经验教训

**前端不要出现 `/api/v1/dds/[...path]/route.ts` 这种路由。**

原因：
1. Next.js 静态导出（`output: 'export'`）下，catch-all 路由与静态构建不兼容
2. `_redirects` 能做基本的路径转发，够用
3. DDS API 本身是后端接口，前端不应该自建 proxy 层

---

## 决策决策链

```
2026-04-15: 发现 _redirects 不稳定 → 添加 DDS route.ts 绕过（治标）
2026-04-16: 尝试 standalone build 解决静态导出冲突
2026-04-16: 小羊决定回归静态 export + _redirects（治本）
```

---

## 谁应该知道这条经验

- **前端开发者**：永远不要在前端 repo 创建 catch-all API 路由来处理后端代理
- **架构设计者**：静态导出与 SSR 路由的取舍，要在项目立项时就确定，不要中途变更
