# Spec: Epic 1 - 路由重定向

## Jobs-To-Be-Done

- **JTBD 1**: 作为用户，我希望访问旧路由时自动跳转到新首页，以便不迷路并继续完成任务。

## User Stories

- US1.1: 作为用户，我访问 `/confirm/context` 时自动跳转到 `/`，以便在首页继续限界上下文流程。
- US1.2: 作为用户，我访问 `/requirements/list` 时自动跳转到 `/`，以便在首页继续需求管理。
- US1.3: 作为用户，我看到导航栏中没有废弃入口链接，以便知道正确的入口在哪里。

## Requirements

### F1.1: Next.js 重定向配置
- [ ] 在 `next.config.js` 或 `middleware.ts` 中配置 `/confirm/*` → `/`
- [ ] 配置 `/requirements/*` → `/`
- [ ] 使用 301 永久重定向（SEO 友好）

### F1.2: 导航栏更新
- [ ] 移除导航栏中指向 `/confirm` 的链接
- [ ] 移除导航栏中指向 `/requirements` 的链接
- [ ] 确保导航栏只显示 `/` 和 `/design` 入口

### F1.3: Deprecation 注释
- [ ] 在 `/confirm` 目录下的所有 page.tsx 文件头部添加 `@deprecated` 注释
- [ ] 在 `/requirements` 目录下的所有 page.tsx 文件头部添加 `@deprecated` 注释
- [ ] 注释包含重定向说明和预计删除时间

### F1.4: 重定向验证测试
- [ ] E2E 测试：访问 `/confirm/context` 验证重定向到 `/`
- [ ] E2E 测试：访问 `/confirm/flow` 验证重定向到 `/`
- [ ] E2E 测试：访问 `/confirm/model` 验证重定向到 `/`
- [ ] E2E 测试：访问 `/requirements` 验证重定向到 `/`

## Technical Notes

```
// next.config.js 重定向配置示例
{
  source: '/confirm/:path*',
  destination: '/',
  permanent: true  // 301
}
```

```
// middleware.ts 重定向（更灵活）
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/confirm/')) {
    return NextResponse.redirect(new URL('/', request.url), 301)
  }
  if (request.nextUrl.pathname.startsWith('/requirements')) {
    return NextResponse.redirect(new URL('/', request.url), 301)
  }
}
```

## Acceptance Criteria

- [ ] `expect(response.status).toBe(301)` — 旧路由返回 301
- [ ] `expect(header.location).toBe('/')` — 重定向目标正确
- [ ] `expect(screen.queryByRole('link', {name: /confirm/i})).toBeNull()` — 导航栏无废弃入口
- [ ] `expect(await page.evaluate(() => document.title)).toBeTruthy()` — 重定向后页面正常加载

## Definition of Done

| 维度 | 标准 |
|------|------|
| 功能 | 所有 `/confirm/*` 和 `/requirements/*` 路由重定向到 `/` |
| 测试 | E2E 测试 100% 通过 |
| 安全 | 重定向不会导致无限循环 |
| 文档 | Deprecation 注释已添加 |
