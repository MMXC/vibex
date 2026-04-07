# 更新日志页面需求分析报告

## 项目概述

**目标**: 新增更新日志页面，展示项目变更记录和部署版本（前后端）

**分析时间**: 2026-03-02 17:40

**项目路径**: `/root/.openclaw/vibex`

---

## 1. 功能需求

### 1.1 前端页面设计

**路由**: `/changelog`

**页面结构**:
```
┌─────────────────────────────────────────────────────┐
│  更新日志                                            │
│  ───────────────────────────────────────────────────│
│  当前版本:                                           │
│  ┌──────────────────┐ ┌──────────────────┐         │
│  │ 前端版本         │ │ 后端版本          │         │
│  │ fa3c20e          │ │ fa3c20e           │         │
│  │ 2026-03-02 16:23 │ │ 2026-03-02 10:39  │         │
│  └──────────────────┘ └──────────────────┘         │
│                                                      │
│  变更记录:                                           │
│  ┌────────────────────────────────────────────────┐ │
│  │ fa3c20e - fix: update dashboard page           │ │
│  │ 2026-03-02 16:23                               │ │
│  ├────────────────────────────────────────────────┤ │
│  │ 6e1f93d - review: vibex-ai-prototype-builder   │ │
│  │ 2026-03-02 05:20                               │ │
│  ├────────────────────────────────────────────────┤ │
│  │ 7d9490a - chore: update chat test              │ │
│  │ 2026-03-02 05:18                               │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**组件清单**:
| 组件 | 说明 |
|------|------|
| `VersionCard` | 版本号卡片（显示 commit id + 时间戳） |
| `ChangelogList` | 变更记录列表 |
| `ChangelogItem` | 单条变更记录（commit id + 消息 + 时间） |

### 1.2 后端 API 设计

**路由**: `GET /api/version`

**响应格式**:
```json
{
  "version": "fa3c20e",
  "commit": "fa3c20ef1234567890abcdef1234567890abcdef",
  "timestamp": "2026-03-02T16:23:00Z",
  "branch": "main",
  "environment": "production"
}
```

**实现方式**:
1. **构建时注入**: 在 CI/CD 中通过环境变量注入
2. **运行时读取**: 从 `.git` 目录读取（仅开发环境）

### 1.3 版本号格式

**格式**: Git commit SHA-1 前 7 位

**示例**:
- `fa3c20e` (前端最新)
- `6e1f93d` (上一版本)

---

## 2. 前后端分工

### 2.1 前端任务

| 任务 | 描述 | 文件 |
|------|------|------|
| 创建页面路由 | `/changelog` | `src/app/changelog/page.tsx` |
| 版本卡片组件 | 显示前端/后端版本 | `src/components/VersionCard.tsx` |
| 变更记录组件 | 显示 Git 提交历史 | `src/components/ChangelogList.tsx` |
| 版本 API 调用 | 获取后端版本 | `src/services/api.ts` |
| 前端版本注入 | 构建时注入 commit id | `next.config.ts` |

### 2.2 后端任务

| 任务 | 描述 | 文件 |
|------|------|------|
| 版本 API | `GET /api/version` | `src/app/api/version/route.ts` |
| Git 信息读取 | 获取 commit 信息 | `src/lib/git-version.ts` |
| 环境变量支持 | 支持 CI/CD 注入 | `.env` |

---

## 3. 技术实现方案

### 3.1 前端版本注入

**方案 A: 环境变量（推荐）**

```typescript
// next.config.ts
const commitId = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();

export default {
  env: {
    NEXT_PUBLIC_VERSION: commitId,
    NEXT_PUBLIC_COMMIT: require('child_process')
      .execSync('git rev-parse HEAD')
      .toString()
      .trim(),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};
```

**方案 B: 构建时生成文件**

```typescript
// scripts/generate-version.js
const fs = require('fs');
const { execSync } = require('child_process');

const version = {
  version: execSync('git rev-parse --short HEAD').toString().trim(),
  commit: execSync('git rev-parse HEAD').toString().trim(),
  timestamp: new Date().toISOString(),
};

fs.writeFileSync('public/version.json', JSON.stringify(version, null, 2));
```

### 3.2 后端版本 API

```typescript
// src/app/api/version/route.ts
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
  try {
    const version = execSync('git rev-parse --short HEAD').toString().trim();
    const commit = execSync('git rev-parse HEAD').toString().trim();
    const timestamp = execSync('git log -1 --format=%cI').toString().trim();
    
    return NextResponse.json({
      version,
      commit,
      timestamp,
      branch: process.env.VERCEL_GIT_COMMIT_REF || 'main',
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    // Fallback to environment variables
    return NextResponse.json({
      version: process.env.DEPLOY_VERSION || 'unknown',
      commit: process.env.DEPLOY_COMMIT || 'unknown',
      timestamp: process.env.DEPLOY_TIME || new Date().toISOString(),
      branch: process.env.VERCEL_GIT_COMMIT_REF || 'main',
      environment: process.env.NODE_ENV,
    });
  }
}
```

### 3.3 前端页面实现

```typescript
// src/app/changelog/page.tsx
import { apiService } from '@/services/api';

export default async function ChangelogPage() {
  // 获取后端版本
  const backendVersion = await fetch('/api/version').then(r => r.json());
  
  // 前端版本（构建时注入）
  const frontendVersion = {
    version: process.env.NEXT_PUBLIC_VERSION,
    commit: process.env.NEXT_PUBLIC_COMMIT,
    timestamp: process.env.NEXT_PUBLIC_BUILD_TIME,
  };
  
  return (
    <div className="changelog-page">
      <h1>更新日志</h1>
      
      <div className="version-cards">
        <VersionCard 
          label="前端版本" 
          {...frontendVersion} 
        />
        <VersionCard 
          label="后端版本" 
          {...backendVersion} 
        />
      </div>
      
      <ChangelogList />
    </div>
  );
}
```

---

## 4. 部署版本确认流程

```
用户访问 /changelog
        │
        ▼
┌─────────────────────┐
│ 前端显示版本        │
│ - 前端 commit id    │
│ - 构建时间          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 调用后端 API        │
│ GET /api/version    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 显示后端版本        │
│ - 后端 commit id    │
│ - 部署时间          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 版本对比            │
│ 前端 === 后端?      │
│ ✅ 同步 / ❌ 不同步  │
└─────────────────────┘
```

---

## 5. 变更记录来源

### 方案 A: Git 提交历史（推荐）

```typescript
// 获取最近 20 条提交
const commits = execSync('git log -20 --pretty=format:"%h|%s|%cI"')
  .toString()
  .split('\n')
  .map(line => {
    const [hash, message, timestamp] = line.split('|');
    return { hash, message, timestamp };
  });
```

### 方案 B: CHANGELOG.md 文件

```markdown
# Changelog

## [fa3c20e] - 2026-03-02
- fix: update dashboard page

## [6e1f93d] - 2026-03-02
- review: vibex-ai-prototype-builder approved
```

---

## 6. 任务拆解

| 任务 ID | 任务名称 | 角色 | 依赖 | 验证标准 |
|---------|----------|------|------|----------|
| T1 | 创建后端版本 API | dev | 无 | `curl /api/version` 返回 JSON |
| T2 | 前端版本注入配置 | dev | 无 | `process.env.NEXT_PUBLIC_VERSION` 有值 |
| T3 | 创建 changelog 页面 | dev | T1, T2 | 访问 `/changelog` 显示版本 |
| T4 | 变更记录组件 | dev | T3 | 显示最近提交列表 |
| T5 | 版本同步检测 | dev | T4 | 前后端版本一致时显示 ✅ |

---

## 7. 验证清单

### 7.1 本地验证

```bash
# 1. 检查前端版本注入
cd vibex-fronted
npm run build
grep -r "NEXT_PUBLIC_VERSION" .next/

# 2. 检查后端 API
cd vibex-backend
npm run dev
curl http://localhost:3001/api/version

# 3. 检查 changelog 页面
curl http://localhost:3000/changelog
```

### 7.2 部署验证

```bash
# 1. 检查线上版本
curl https://vibex-app.pages.dev/changelog
curl https://api.vibex.top/api/version

# 2. 对比版本一致性
# 前端版本应与后端版本一致
```

---

## 8. 约束与风险

### 8.1 约束

- 版本号格式: commit SHA-1 前 7 位
- 页面路由: `/changelog`
- API 路由: `GET /api/version`
- 响应时间: < 100ms

### 8.2 风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| CI/CD 环境变量未配置 | 版本显示 unknown | 提供 fallback 逻辑 |
| Git 命令执行失败 | API 返回错误 | 捕获异常，返回默认值 |
| 前后端部署不同步 | 版本不一致 | 显示同步状态提示 |

---

## 9. 总结

| 模块 | 任务数 | 预估工时 |
|------|--------|----------|
| 前端 | 3 | 4h |
| 后端 | 2 | 2h |
| **总计** | **5** | **6h** |

**优先级**:
1. **P0**: 后端版本 API
2. **P0**: 前端版本注入
3. **P1**: Changelog 页面
4. **P2**: 变更记录组件

---

**分析完成时间**: 2026-03-02 17:40
**分析者**: Analyst Agent