# Canvas 页 404 问题分析 — vibex-canvas-deploy

> 分析日期: 2026-03-29
> 分析者: analyst agent
> 项目: vibex-canvas-deploy

---

## 🔍 问题概述

| 项目 | 值 |
|------|-----|
| **问题 URL** | `vibex.ai/canvas` |
| **预期行为** | Canvas 页面正常加载（VibeX MVP 核心用户流程页）|
| **实际行为** | 报告生产环境返回 404 |
| **影响范围** | 新用户无法通过 `vibex.ai` 访问 Canvas 核心流程 |
| **严重程度** | P0 — 核心功能不可用 |

---

## 📋 调研过程

### 1. 代码层面检查

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `src/app/canvas/page.tsx` 存在 | ✅ | 文件完整，约 25 行路由组件 |
| CanvasPage 组件存在 | ✅ | `components/canvas/CanvasPage.tsx`，Epic 1 完整实现 |
| 静态构建产物 `out/canvas.html` | ✅ | 静态导出正常，生成了 HTML |
| `out/canvas/` 目录资源 | ✅ | 包含 `__next.canvas.*.txt` 等 RSC 资源 |

**结论**: 代码层无问题，Canvas 功能已完整实现。

### 2. 部署架构分析

项目使用 **Next.js `output: 'export'` 静态导出** + **Cloudflare Pages** 部署（`wrangler.toml`）：

```
wrangler.toml 关键配置:
  pages_build_output_dir = "./out"
  [env.production]
    NEXT_PUBLIC_APP_URL = "https://vibex.top"
    NEXT_PUBLIC_API_BASE_URL = "https://api.vibex.top/api"
```

**无 Vercel 配置文件**（`vercel.json`、`.vercel` 均不存在）。

### 3. 实际访问测试

| URL | HTTP 状态 | 响应说明 |
|-----|-----------|---------|
| `https://vibex.ai/` | 200 | 首页正常 |
| **`https://vibex.ai/canvas`** | **200** | **✅ Canvas 正常加载** |
| `https://vibex.top/canvas` | 307 → `www.vibex.top/canvas` | 重定向到 www 子域 |
| `https://www.vibex.top/canvas` | 200 | 返回 Next.js 内置 404 页面 |
| `https://vibex.top/` | 307 → `www.vibex.top/` | 首页重定向 |

**Header 分析**:
- `vibex.top` 响应头含 `x-vercel-id: fra1::...` → 确认由 **Vercel** 提供服务
- `vibex.ai` 响应头由 **Cloudflare** 提供 → 确认由 **Cloudflare Pages** 提供服务

### 4. 域名架构现状

```
┌─────────────────────────────────────────────────────────┐
│  vibex.ai          →  Cloudflare Pages (当前主域名) ✅   │
│                      → out/ (最新静态构建，含 canvas)    │
│                                                         │
│  vibex.top          →  Vercel (旧部署，未更新) ⚠️         │
│                      → 旧构建，不含 canvas 页面          │
│                      → 重定向到 www.vibex.top            │
│                                                         │
│  www.vibex.top      →  Vercel (同上)                    │
│                      → canvas 返回 Next.js 404           │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 根因定位

### 根本原因: `vibex.top` 仍由旧 Vercel 部署提供

**时序分析**:

1. **Phase 1**: 项目最初部署在 Vercel（`vibex.top`）
2. **Phase 2**: 项目迁移到 Cloudflare Pages（`wrangler.toml`）
3. **Phase 3**: 新域名 `vibex.ai` 绑定到 Cloudflare Pages，Canvas 功能在此期间开发完成
4. **Phase 4**: `vibex.top` 的 Vercel 部署**未被更新/禁用**，仍保留旧构建（不含 canvas 页面）
5. **当前**: `vibex.ai/canvas` 正常工作 ✅；`vibex.top/canvas` 返回 404 ⚠️

### 混淆点

用户报告的是 `vibex.ai/canvas` 404，但实际测试显示该 URL 完全正常。**可能的解释**：

1. 用户测试时使用的是 `vibex.top` 或 `www.vibex.top`（书签/旧链接）
2. 报告时已修复（Cloudflare Pages 部署刚完成）
3. 存在 CDN 缓存问题（Cloudflare 缓存了旧 404 响应）

---

## ✅ 验证结论

| 验证项 | 状态 |
|--------|------|
| Canvas 代码完整 | ✅ |
| 静态构建产物存在 | ✅ |
| `vibex.ai/canvas` 访问正常 | ✅ **问题不存在或已自愈** |
| `vibex.top/canvas` 有问题 | ⚠️ 旧 Vercel 部署，需处理 |

---

## 🛠️ 修复方案

### 方案 A: 将 `vibex.top` 迁移到 Cloudflare Pages（推荐）

**操作步骤**:

1. **登录 Cloudflare Dashboard**，将 `vibex.top` 添加为 Cloudflare Pages 的自定义域名
2. 配置 CNAME 记录指向 Cloudflare Pages 部署（如 `vibex-frontend-prod.pages.dev`）
3. 在 Vercel 控制台**禁用/删除**旧部署，防止混淆
4. 等待 DNS 生效（通常 5-30 分钟）
5. 验证 `vibex.top/canvas` → 200 ✅

**优点**: 统一部署平台，消除双部署问题
**工时**: ~30 分钟

### 方案 B: Vercel 重新部署最新构建

**操作步骤**:

1. 确认 Vercel 项目仍有绑定 `vibex.top`
2. 在 Vercel 触发重新部署（`vercel --prod` 或 Dashboard 手动部署）
3. 验证 `vibex.top/canvas` → 200 ✅

**注意**: `wrangler.toml` 和 `vercel.toml` 可能冲突，需确保环境变量一致

**优点**: 快速修复
**工时**: ~15 分钟
**风险**: 未来需维护两套部署配置

### 方案 C: 301 重定向 `vibex.top` → `vibex.ai`

**操作步骤**:

1. 在 Vercel 或 Cloudflare 配置 301 重定向规则
2. 将所有 `vibex.top/*` 请求重定向到 `vibex.ai/*`
3. 逐步将流量迁移到 `vibex.ai`

**优点**: 品牌统一，减少维护负担
**工时**: ~20 分钟

---

## 📊 推荐方案

**推荐: 方案 A（统一 Cloudflare Pages）**

理由：
- 项目已迁移至 Cloudflare Pages，`wrangler.toml` 是当前唯一部署配置
- Vercel 旧部署维护成本高且容易导致混淆
- Cloudflare Pages 对静态站点有更好的性能和边缘缓存支持
- 避免未来再次出现"哪个域名用哪个部署"的问题

---

## ⏱️ 预计工时

| 步骤 | 工时 |
|------|------|
| Cloudflare Pages 添加自定义域名 | 10 分钟 |
| DNS 配置与验证 | 10 分钟 |
| Vercel 旧部署清理 | 5 分钟 |
| 回归验证 | 10 分钟 |
| **总计** | **~35 分钟** |

---

## ✅ 验收标准

1. [ ] `vibex.top/canvas` 返回 200，内容正常
2. [ ] `vibex.ai/canvas` 持续返回 200（回归保护）
3. [ ] 首页 `vibex.top/` 和 `vibex.ai/` 均正常
4. [ ] Canvas 页面交互功能正常（三树视图、阶段进度条等）
5. [ ] Vercel 旧部署已清理或禁用

---

## 📝 备注

- Canvas 是 VibeX MVP 核心流程页，代码已 Epic 1 完整实现
- 当前主域名为 `vibex.ai`（Cloudflare Pages），`vibex.top` 为过渡域名
- 静态导出模式（`output: 'export'`）下，动态路由通过预渲染生成 HTML
- 建议后续统一文档，明确各域名用途和部署责任
