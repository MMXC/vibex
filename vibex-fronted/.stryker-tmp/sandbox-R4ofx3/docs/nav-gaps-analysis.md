# 导航入口缺失分析报告

## 概述

本报告分析了 VibeX 项目中缺失全局导航入口的页面，识别出 4 个需要添加导航入口的页面。

## 当前导航结构

### 全局导航 (GlobalNav)

| ID        | 标签 | 路径           |
| --------- | ---- | -------------- |
| projects  | 项目 | /dashboard     |
| templates | 模板 | /templates     |
| settings  | 设置 | /user-settings |

**组件位置**: `src/components/navigation/GlobalNav.tsx`  
**状态管理**: `src/stores/navigationStore.ts`

### 项目导航 (ProjectNav)

| ID           | 标签      | 路径              |
| ------------ | --------- | ----------------- |
| dashboard    | Dashboard | /dashboard        |
| chat         | 对话      | /chat             |
| requirements | 需求      | /requirements     |
| domain       | 领域模型  | /domain           |
| flow         | 流程图    | /flow             |
| pages        | 页面      | /pages            |
| settings     | 设置      | /project-settings |

## 缺失导航入口的页面

经过，以下 4 个页面存在独立导航分析栏但未接入 GlobalNav 统一导航系统：

### 1. /export - 导出页面

**文件**: `src/app/export/page.tsx`  
**问题**: 使用自定义简单导航栏，未使用 GlobalNav 组件  
**功能**: 代码导出、PRD 导出  
**导航链接**: `/dashboard`, `/editor`, `/export` (硬编码)

### 2. /editor - 编辑器页面

**文件**: `src/app/editor/page.tsx`  
**问题**: 无全局导航栏，用户无法返回其他主要页面  
**功能**: 可视化组件编辑器  
**依赖**: 需要从项目上下文进入，无独立导航

### 3. /changelog - 更新日志页面

**文件**: `src/app/changelog/page.tsx`  
**问题**: 完全独立页面，无任何导航入口  
**功能**: 版本更新记录展示  
**状态**: 用户无法从应用内访问此页面

### 4. /prototype - 原型预览页面

**文件**: `src/app/prototype/page.tsx`  
**问题**: 使用自定义工具栏而非 GlobalNav  
**功能**: UI 原型预览，支持多设备切换  
**导航链接**: 需从项目内进入

## 影响分析

| 页面       | 影响级别 | 用户体验问题                     |
| ---------- | -------- | -------------------------------- |
| /export    | 高       | 无法快速访问项目、模板等核心功能 |
| /changelog | 中       | 用户无法查看版本更新             |
| /editor    | 中       | 编辑器与主应用导航割裂           |
| /prototype | 中       | 原型预览缺乏统一导航支持         |

## 建议方案

### 方案 A: 将页面接入 GlobalNav

在 `navigationStore.ts` 的 `DEFAULT_GLOBAL_NAV` 中添加：

```typescript
const DEFAULT_GLOBAL_NAV: NavItem[] = [
  { id: 'projects', label: '项目', href: '/dashboard' },
  { id: 'templates', label: '模板', href: '/templates' },
  { id: 'changelog', label: 更新日志, href: '/changelog' }, // 新增
  { id: 'export', label: '导出', href: '/export' }, // 新增
  { id: 'settings', label: '设置', href: '/user-settings' },
];
```

然后更新各页面使用 `<GlobalNav />` 组件替换自定义导航栏。

### 方案 B: 为独立页面添加面包屑导航

对于 `/editor` 和 `/prototype`，这些页面主要从项目上下文进入，建议：

- 保留当前独立导航
- 添加面包屑导航指示当前位置
- 提供返回项目的快捷入口

## 其他需要关注的页面

以下页面虽然有独立导航，但可能是项目上下文内的合理设计：

- `/project` - 项目详情页 (可能需要接入 ProjectNav)
- `/pagelist` - 页面列表
- `/preview` - 页面预览
- `/requirements/new` - 新建需求 (已重定向到 /confirm)
- `/confirm/*` - 确认流程 (独立流程页面)

## 总结

| 指标               | 数值                 |
| ------------------ | -------------------- |
| 当前全局导航入口   | 3                    |
| 缺失导航入口的页面 | 4                    |
| 建议新增入口       | 2-4 (根据业务优先级) |

**建议优先级**:

1. **高**: /export - 核心导出功能
2. **中**: /changelog - 用户引导
3. **中**: /editor, /prototype - 可选接入或保持独立
