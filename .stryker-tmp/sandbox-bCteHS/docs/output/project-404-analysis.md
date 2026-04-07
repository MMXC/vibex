# 项目卡片 404 错误分析报告

**分析时间**: 2026-03-03 22:30
**问题**: 项目卡片点击后返回 404 错误
**URL**: `https://vibex-app.pages.dev/project/cmmapa47iuik55hvt`

---

## 问题定位

### 1. 路由文件结构

```
/app/project/
├── page.tsx          ← 静态页面，使用 query parameter (?id=xxx)
├── page.test.tsx
└── project.module.css

❌ 不存在: /app/project/[id]/page.tsx  ← 动态路由
```

### 2. Dashboard 链接格式

**文件**: `/app/dashboard/page.tsx`
**行号**: 277

```typescript
href={`/project/${project.id}`}
```

**实际生成的 URL**: `/project/cmmapa47iuik55hvt`

### 3. Next.js 配置

**文件**: `vibex-fronted/next.config.mjs`

```typescript
const nextConfig: NextConfig = {
  output: 'export',      // ← 静态导出模式
  images: { unoptimized: true },
  trailingSlash: true,
};
```

---

## 根因分析

| 问题 | 说明 |
|------|------|
| **链接格式错误** | Dashboard 使用 `/project/${id}` 动态路由格式 |
| **路由不存在** | `/app/project/[id]/` 目录不存在 |
| **静态导出限制** | `output: 'export'` 模式不支持服务端动态路由 |

### 详细说明

1. **Dashboard 链接**: `href="/project/${project.id}"` → 生成 `/project/cmmapa47iuik55hvt`

2. **实际存在的页面**: `/app/project/page.tsx` 是一个静态页面，通过 query parameter 获取项目 ID：
   ```typescript
   const projectId = searchParams.get('id')  // 期望 URL: /project?id=xxx
   ```

3. **静态导出限制**:
   - `output: 'export'` 只支持预生成的静态页面
   - 动态路由 `[id]` 需要 `generateStaticParams` 在构建时生成所有可能的路径
   - 但项目 ID 是动态的，无法预先生成

---

## 问题对比

| 期望 URL | 实际链接 | 页面支持 |
|----------|---------|---------|
| `/project?id=cmmapa47iuik55hvt` | ❌ 未使用 | ✅ 页面支持 |
| `/project/cmmapa47iuik55hvt` | ✅ Dashboard 使用 | ❌ 路由不存在 |

---

## 解决方案

### 方案 A: 修改链接格式 (推荐)

修改 Dashboard 链接使用 query parameter 格式：

**文件**: `/app/dashboard/page.tsx` 行 277

```typescript
// 修改前
href={`/project/${project.id}`}

// 修改后
href={`/project?id=${project.id}`}
```

**优点**:
- 改动最小
- 兼容静态导出
- 现有页面无需修改

### 方案 B: 创建动态路由页面

创建 `/app/project/[id]/page.tsx`，但需要在构建时预生成所有项目页面：

```typescript
export async function generateStaticParams() {
  const projects = await fetchAllProjects()
  return projects.map(p => ({ id: p.id }))
}
```

**缺点**:
- 需要构建时知道所有项目 ID
- 新项目创建后需要重新部署
- 不适合动态创建项目的场景

### 方案 C: 移除静态导出，使用 SSR

移除 `output: 'export'`，改用服务端渲染。

**缺点**:
- 需要服务器运行 Next.js
- 失去静态部署的优势
- 改动较大

---

## 推荐修复

**推荐方案 A**: 修改 Dashboard 链接格式

**修改文件**: `vibex-fronted/src/app/dashboard/page.tsx`
**修改位置**: 第 277 行

```diff
- href={`/project/${project.id}`}
+ href={`/project?id=${project.id}`}
```

---

## 验证步骤

1. 修改 Dashboard 链接格式
2. 重新构建: `npm run build`
3. 部署后测试项目卡片点击
4. 确认 URL 格式为 `/project?id=xxx`

---

*分析完成时间: 2026-03-03 22:30*
*分析者: Analyst Agent*