# PRD - VibeX 导航架构重构

**项目代号**: vibex-nav-redesign  
**状态**: In Progress  
**创建时间**: 2026-03-06  
**负责人**: PM Agent  

---

## 1. 功能需求 (Functional Requirements)

### 1.1 核心功能

| 功能点 | 描述 | 优先级 |
|-------|------|-------|
| 全局顶部导航 | 跨项目功能入口：Logo、项目、模板、设置、用户 | P0 |
| 项目左侧导航 | 项目内功能入口：Dashboard、Chat、需求、领域模型、流程图、页面、设置 | P0 |
| 导航状态管理 | 项目上下文保持、导航项动态加载 | P0 |
| 面包屑导航 | 显示当前位置，支持快速返回 | P1 |
| 响应式适配 | 移动端导航适配 | P1 |

### 1.2 用户故事

#### Epic 1: 全局导航系统

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-001 | 全局顶部导航栏显示 | 登录后顶部显示 Logo、项目、模板、设置、用户入口 |
| US-002 | Logo 点击返回首页 | 点击 Logo 跳转至 `/` |
| US-003 | 项目列表入口 | 点击项目跳转到 `/projects` |
| US-004 | 模板市场入口 | 点击模板跳转到 `/templates` |
| US-005 | 全局设置入口 | 点击设置跳转到 `/settings` |
| US-006 | 用户资料入口 | 点击用户头像/名称跳转到 `/profile` |

#### Epic 2: 项目导航系统

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-010 | 项目左侧导航显示 | 进入项目后左侧显示项目导航栏 |
| US-011 | Dashboard 入口 | 点击 Dashboard 跳转至 `/projects/:id` |
| US-012 | Chat 入口 | 点击 Chat 跳转至 `/projects/:id/chat` |
| US-013 | 需求管理入口 | 点击需求跳转至 `/projects/:id/requirements` |
| US-014 | 领域模型入口 | 点击领域模型跳转至 `/projects/:id/domain` |
| US-015 | 流程图入口 | 点击流程图跳转至 `/projects/:id/flow` |
| US-016 | 页面管理入口 | 点击页面跳转至 `/projects/:id/pages` |
| US-017 | 项目设置入口 | 点击设置跳转至 `/projects/:id/settings` |

#### Epic 3: 导航状态管理

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-020 | 项目上下文保持 | 切换页面后当前项目 ID 保持不变 |
| US-021 | 导航高亮当前项 | 当前页面在导航中处于激活状态 |
| US-022 | 项目切换时重置导航 | 切换项目后左侧导航刷新为新项目内容 |

#### Epic 4: 面包屑与体验优化

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-030 | 面包屑显示 | 页面顶部显示当前位置路径 |
| US-031 | 面包屑可点击 | 点击面包屑可快速返回上级页面 |
| US-032 | 移动端导航适配 | 屏幕宽度 < 768px 时导航折叠为汉堡菜单 |

---

## 2. UI/UX 交互流程

### 2.1 全局导航流程

```
用户登录 → 进入控制台 → 显示全局顶部导航
                                    ↓
                    ┌────────┬────────┬────────┬────────┐
                    │ 项目   │ 模板   │ 设置   │ 用户   │
                    └────────┴────────┴────────┴────────┘
                        ↓           ↓         ↓
                   /projects   /templates  /settings  /profile
```

### 2.2 项目导航流程

```
点击项目卡片 → 进入项目页 → 显示项目左侧导航
                                    ↓
              ┌────────┬────────┬────────┬────────┬────────┐
              │Dashboard│ Chat  │ 需求  │ 领域模型│ 流程图 │
              └────────┴────────┴────────┴────────┴────────┘
                    ↓           ↓         ↓         ↓
            /projects/:id  /chat    /requirements  /domain    /flow
```

### 2.3 页面结构

```
┌─────────────────────────────────────────────────────────────┐
│                      全局顶部导航 (GlobalNav)                 │
│  [Logo]    [项目]    [模板]    [设置]              [用户头像]  │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  项目左侧   │              页面内容区域                       │
│  导航       │                                                │
│ (ProjectNav)│           (页面路由渲染)                       │
│            │                                                │
│  - Dashboard│                                                │
│  - Chat     │                                                │
│  - 需求     │                                                │
│  - 领域模型 │                                                │
│  - 流程图   │                                                │
│  - 页面     │                                                │
│  - 设置     │                                                │
│            │                                                │
└────────────┴────────────────────────────────────────────────┘
```

---

## 3. Epics 拆分 (业务级)

| Epic | 名称 | 描述 | 工作量 |
|------|------|------|-------|
| Epic 1 | GlobalNav | 全局顶部导航组件开发 | 0.5 天 |
| Epic 2 | ProjectNav | 项目左侧导航组件开发 | 0.5 天 |
| Epic 3 | Layout Integration | 布局容器重构，整合双层导航 | 0.5 天 |
| Epic 4 | Route Migration | 路由结构调整，页面迁移 | 1 天 |
| Epic 5 | Navigation State | 导航状态管理 (Context/Store) | 0.5 天 |
| Epic 6 | Breadcrumb | 面包屑导航实现 | 0.25 天 |
| Epic 7 | Mobile Adaptation | 移动端响应式适配 | 0.25 天 |

---

## 4. 非功能需求 (Non-Functional Requirements)

| 需求类型 | 要求 |
|---------|------|
| 性能 | 导航切换 < 100ms，首屏加载 < 2s |
| 兼容性 | Chrome/Firefox/Safari 最新版，移动端 iOS/Android |
| 可访问性 | 键盘导航支持，ARIA 标签 |
| 可维护性 | 组件化开发，Storybook 文档 |
| 测试 | 单元测试覆盖率 > 70%，E2E 覆盖核心流程 |

---

## 5. 验收标准 (可写 expect() 断言)

### 5.1 全局导航验收

```typescript
// expect 测试示例
expect(globalNav.exists()).toBe(true)
expect(globalNav.getLogo().attr('href')).toBe('/')
expect(globalNav.getNavItem('项目').attr('href')).toBe('/projects')
expect(globalNav.getNavItem('模板').attr('href')).toBe('/templates')
expect(globalNav.getNavItem('设置').attr('href')).toBe('/settings')
expect(globalNav.getUserAvatar().exists()).toBe(true)
```

### 5.2 项目导航验收

```typescript
expect(projectNav.exists()).toBe(true)
expect(projectNav.getNavItems()).toHaveLength(7)
expect(projectNav.getNavItem('Dashboard').attr('href')).toBe('/projects/123')
expect(projectNav.getNavItem('Chat').attr('href')).toBe('/projects/123/chat')
expect(projectNav.getNavItem('需求').attr('href')).toBe('/projects/123/requirements')
expect(projectNav.getNavItem('领域模型').attr('href')).toBe('/projects/123/domain')
expect(projectNav.getNavItem('流程图').attr('href')).toBe('/projects/123/flow')
expect(projectNav.getNavItem('页面').attr('href')).toBe('/projects/123/pages')
expect(projectNav.getNavItem('设置').attr('href')).toBe('/projects/123/settings')
```

### 5.3 状态管理验收

```typescript
expect(navigationStore.getCurrentProjectId()).toBe('123')
expect(projectNav.getActiveItem()).toBe('Dashboard')
// 切换项目
navigateToProject('456')
expect(navigationStore.getCurrentProjectId()).toBe('456')
```

### 5.4 面包屑验收

```typescript
expect(breadcrumb.exists()).toBe(true)
expect(breadcrumb.getItems()).toHaveLength(3)
expect(breadcrumb.getItem(0).text()).toBe('项目')
expect(breadcrumb.getItem(1).text()).toBe('项目名称')
expect(breadcrumb.getItem(2).text()).toBe('Dashboard')
```

---

## 6. 数据模型 (如有)

### 6.1 导航配置

```typescript
interface NavItem {
  id: string
  label: string
  icon: string
  path: string
  roles?: string[] // 可选，权限控制
}

interface ProjectNavConfig {
  projectId: string
  items: NavItem[]
}
```

---

## 7. 风险与依赖

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 现有页面路由重构 | 中 | 分阶段迁移，保持向后兼容 |
| 权限系统集成 | 中 | 先实现基础导航，后续接入权限 |
| 移动端体验 | 低 | 先完成桌面端，再适配移动端 |

---

*PRD 创建完成于 2026-03-06 13:50 (Asia/Shanghai)*
