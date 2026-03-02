# VibeX Dashboard 用户流程优化 PRD

**版本**: v1.0  
**日期**: 2026-03-02  
**状态**: Draft  
**作者**: PM Agent

---

## 1. 背景与目标

### 1.1 背景

当前 VibeX Dashboard 存在以下问题：
1. "创建新项目"按钮直接跳转到编辑器，缺少需求输入流程
2. 点击项目卡片跳转到编辑器，无法查看项目的领域模型和原型
3. 侧边栏导航结构不够清晰，缺少项目级别的功能入口
4. 菜单无收起功能，占用过多屏幕空间

### 1.2 目标

优化用户操作流程，实现：
- **创建项目流程**：Dashboard → /requirements/new → 描述需求 → 生成原型
- **项目详情流程**：点击项目卡片 → 项目详情页 → 领域模型/原型标签页
- **双菜单系统**：全局导航菜单 + 项目详情菜单，均支持收起/展开

---

## 2. 用户操作流程图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           用户操作流程                                        │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   Dashboard  │
                    │   /dashboard │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │ 创建新项目 │    │ 点击项目  │    │ 侧边栏导航 │
   │  (主按钮)  │    │   卡片    │    │  (全局)   │
   └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
         │                 │                 │
         ▼                 ▼                 ▼
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │/require-  │    │ 项目详情页 │    │ AI 原型设计│
   │ments/new  │    │/project/  │    │/requirements│
   │(需求输入) │    │  [id]     │    │   /new    │
   └─────┬─────┘    └─────┬─────┘    └───────────┘
         │                 │
         ▼                 ▼
   ┌───────────┐    ┌───────────────────────┐
   │ 澄清对话  │    │      项目详情菜单       │
   │ (AI 引导) │    │  ┌─────┬─────┬─────┐  │
   └─────┬─────┘    │  │领域 │原型 │设置 │  │
         │          │  │模型 │预览 │    │  │
         ▼          │  └──┬──┴──┬──┴─────┘  │
   ┌───────────┐    │     │     │           │
   │ 领域模型  │◄───┤     │     │           │
   │ /domain   │    │     ▼     │           │
   └─────┬─────┘    │ ┌───────┐ │           │
         │          │ │原型页面│ │           │
         ▼          │ │  树   │ │           │
   ┌───────────┐    │ └───────┘ │           │
   │ 原型预览  │◄───┤     │     │           │
   │/prototype │    │     ▼     │           │
   └───────────┘    │ ┌───────┐ │           │
                    │ │组件列表│ │           │
                    │ └───────┘ │           │
                    └───────────────────────┘
```

---

## 3. 功能需求详解

### 3.1 Dashboard 页面优化

#### 3.1.1 创建新项目按钮

**当前行为**：
- 点击 "创建新项目" → 跳转到 `/editor?projectId=xxx`

**期望行为**：
- 点击 "创建新项目" → 跳转到 `/requirements/new`
- 需求输入流程：描述需求 → AI 澄清 → 生成领域模型 → 原型预览

**修改点**：
```tsx
// 修改前
const handleCreateProject = async () => {
  router.push(`/editor?projectId=${newProject.id}`)
}

// 修改后
const handleCreateProject = async () => {
  router.push('/requirements/new')
}
```

#### 3.1.2 项目卡片点击行为

**当前行为**：
- 点击项目卡片 → 跳转到 `/editor?projectId=xxx`

**期望行为**：
- 点击项目卡片 → 跳转到 `/project/[id]`（项目详情页）
- 项目详情页包含 Domain 和 Prototype 标签页

**修改点**：
```tsx
// 修改前
<Link href={`/editor?projectId=${project.id}`}>

// 修改后
<Link href={`/project/${project.id}`}>
```

#### 3.1.3 侧边栏导航优化

**当前结构**：
- 项目、AI 原型设计、领域模型、原型预览、模板、导出、设置

**期望结构**：
- **全局菜单**：项目、AI 原型设计、模板
- **项目菜单**（进入项目详情后显示）：领域模型、原型预览、导出、设置

---

### 3.2 项目详情页 `/project/[id]`

#### 3.2.1 页面结构

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◀ 返回  项目名称                                          [⚙ 设置]    │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┬─────────────────────────────────┐   │
│  │     侧边菜单 (可收起)            │          主内容区域              │   │
│  │  ┌───────────────────┐          │                                 │   │
│  │  │ ◈ 领域模型        │◄─────────│   根据选中的标签页显示内容       │   │
│  │  │   ├ 实体1         │          │                                 │   │
│  │  │   ├ 实体2         │          │   - Domain: 领域关系图          │   │
│  │  │   └ 实体3         │          │   - Prototype: 原型页面树+预览   │   │
│  │  ├───────────────────┤          │                                 │   │
│  │  │ ◈ 原型预览        │          │                                 │   │
│  │  │   ├ 页面1         │          │                                 │   │
│  │  │   │   ├ 组件A     │          │                                 │   │
│  │  │   │   └ 组件B     │          │                                 │   │
│  │  │   ├ 页面2         │          │                                 │   │
│  │  │   └ 页面3         │          │                                 │   │
│  │  └───────────────────┘          │                                 │   │
│  │                                 │                                 │   │
│  │  [◀ 收起菜单]                   │                                 │   │
│  └─────────────────────────────────┴─────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 标签页功能

| 标签 | 路由 | 功能描述 |
|------|------|----------|
| 领域模型 | `/project/[id]/domain` | 显示项目的领域实体关系图 |
| 原型预览 | `/project/[id]/prototype` | 显示原型页面树 + 页面预览 |

#### 3.2.3 侧边菜单结构

```typescript
interface ProjectMenuItem {
  id: string
  label: string
  icon: string
  type: 'folder' | 'item'
  children?: ProjectMenuItem[]
  route?: string
}

const projectMenu: ProjectMenuItem[] = [
  {
    id: 'domain',
    label: '领域模型',
    icon: '📊',
    type: 'folder',
    children: [
      { id: 'entities', label: '实体列表', icon: '📦', type: 'item', route: '/domain' },
      { id: 'relations', label: '关系图', icon: '🔗', type: 'item', route: '/domain/graph' },
    ]
  },
  {
    id: 'prototype',
    label: '原型预览',
    icon: '🎨',
    type: 'folder',
    children: [
      { id: 'pages', label: '页面树', icon: '📄', type: 'item', route: '/prototype' },
      { id: 'components', label: '组件库', icon: '🧩', type: 'item', route: '/prototype/components' },
    ]
  },
  {
    id: 'settings',
    label: '项目设置',
    icon: '⚙',
    type: 'item',
    route: '/project-settings'
  }
]
```

---

### 3.3 菜单收起/展开功能

#### 3.3.1 交互设计

**收起状态**：
- 菜单宽度: 64px
- 仅显示图标
- 悬停显示 Tooltip

**展开状态**：
- 菜单宽度: 240px
- 显示图标 + 文字
- 支持子菜单展开

**切换按钮**：
- 位于菜单底部
- 收起状态: `▶` (展开箭头)
- 展开状态: `◀` (收起箭头)

#### 3.3.2 状态持久化

```typescript
// 使用 localStorage 存储菜单状态
const MENU_COLLAPSED_KEY = 'vibex_menu_collapsed'

// 初始化时读取
const savedState = localStorage.getItem(MENU_COLLAPSED_KEY)
const [isCollapsed, setIsCollapsed] = useState(savedState === 'true')

// 状态变更时保存
useEffect(() => {
  localStorage.setItem(MENU_COLLAPSED_KEY, String(isCollapsed))
}, [isCollapsed])
```

#### 3.3.3 CSS 样式规范

```css
/* 展开状态 */
.sidebar {
  width: 240px;
  transition: width 0.3s ease;
}

/* 收起状态 */
.sidebar.collapsed {
  width: 64px;
}

/* 收起时的文字隐藏 */
.sidebar.collapsed .nav-text {
  display: none;
}

/* 收起时的 Tooltip */
.sidebar.collapsed .nav-item:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 72px;
  background: #1e1e2e;
  padding: 8px 12px;
  border-radius: 8px;
  white-space: nowrap;
  z-index: 1000;
}
```

---

## 4. 技术实现方案

### 4.1 路由结构

```
/dashboard                    # Dashboard 主页
/requirements/new             # 新建需求入口
/project/[id]                 # 项目详情主页
/project/[id]/domain          # 项目领域模型
/project/[id]/prototype       # 项目原型预览
/project/[id]/prototype/[pageId]  # 具体原型页面
```

### 4.2 组件结构

```
src/
├── app/
│   ├── project/
│   │   └── [id]/
│   │       ├── page.tsx           # 项目详情主页
│   │       ├── domain/
│   │       │   └── page.tsx       # 领域模型页
│   │       └── prototype/
│   │           ├── page.tsx       # 原型预览主页
│   │           └── [pageId]/
│   │               └── page.tsx   # 具体页面预览
│   └── requirements/
│       └── new/
│           └── page.tsx           # 需求输入页
├── components/
│   ├── Sidebar/
│   │   ├── Sidebar.tsx            # 通用侧边栏组件
│   │   ├── Sidebar.module.css
│   │   └── SidebarContext.tsx     # 侧边栏状态上下文
│   ├── ProjectSidebar/
│   │   ├── ProjectSidebar.tsx     # 项目详情侧边栏
│   │   └── ProjectSidebar.module.css
│   └── PrototypeTree/
│       ├── PrototypeTree.tsx      # 原型页面树组件
│       └── PrototypeTree.module.css
```

### 4.3 状态管理

```typescript
// contexts/ProjectContext.tsx
interface ProjectContextType {
  projectId: string
  project: Project | null
  activeTab: 'domain' | 'prototype' | 'settings'
  setActiveTab: (tab: 'domain' | 'prototype' | 'settings') => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}
```

---

## 5. 开发任务拆解

### Epic 1: Dashboard 跳转优化 (2 tasks)

| Task ID | 任务名称 | 描述 | 预估工时 | 验证方式 |
|---------|----------|------|----------|----------|
| D-001 | 修改创建项目跳转 | 将按钮跳转从 /editor 改为 /requirements/new | 0.5h | 点击按钮跳转到正确页面 |
| D-002 | 修改项目卡片跳转 | 将卡片跳转从 /editor 改为 /project/[id] | 0.5h | 点击卡片跳转到项目详情页 |

### Epic 2: 项目详情页实现 (4 tasks)

| Task ID | 任务名称 | 描述 | 预估工时 | 验证方式 |
|---------|----------|------|----------|----------|
| P-001 | 创建项目详情页框架 | 创建 /project/[id] 路由和基础布局 | 1h | 页面可访问，显示项目信息 |
| P-002 | 实现 Domain 标签页 | 集成现有领域模型组件 | 1h | 可查看项目的领域模型 |
| P-003 | 实现 Prototype 标签页 | 集成现有原型预览组件 | 1h | 可查看项目的原型预览 |
| P-004 | 实现返回和设置按钮 | 顶部导航栏的返回和设置功能 | 0.5h | 功能正常 |

### Epic 3: 侧边栏菜单系统 (4 tasks)

| Task ID | 任务名称 | 描述 | 预估工时 | 验证方式 |
|---------|----------|------|----------|----------|
| S-001 | 实现通用侧边栏组件 | 支持收起/展开的可复用组件 | 2h | 组件可独立运行 |
| S-002 | 实现项目侧边栏 | 显示领域模型和原型页面树 | 2h | 树结构正确展示 |
| S-003 | 实现菜单状态持久化 | localStorage 存储收起状态 | 0.5h | 刷新页面状态保持 |
| S-004 | 实现菜单动画过渡 | CSS transition 动画效果 | 0.5h | 动画流畅 |

### Epic 4: 原型页面树组件 (3 tasks)

| Task ID | 任务名称 | 描述 | 预估工时 | 验证方式 |
|---------|----------|------|----------|----------|
| T-001 | 实现页面树基础结构 | 递归渲染树形结构 | 1.5h | 树结构正确渲染 |
| T-002 | 实现节点展开/收起 | 点击节点可展开子项 | 1h | 交互正常 |
| T-003 | 实现组件列表显示 | 展示页面挂载的组件 | 1h | 组件列表正确显示 |

---

## 6. 验收标准

### 6.1 功能验收

- [ ] 点击 "创建新项目" 跳转到 /requirements/new
- [ ] 点击项目卡片跳转到 /project/[id]
- [ ] 项目详情页显示 Domain 和 Prototype 标签页
- [ ] 侧边栏显示领域模型树和原型页面树
- [ ] 菜单收起/展开功能正常
- [ ] 菜单状态刷新后保持

### 6.2 UI 验收

- [ ] 收起状态宽度 64px，仅显示图标
- [ ] 展开状态宽度 240px，显示图标+文字
- [ ] 收起时悬停显示 Tooltip
- [ ] 动画过渡流畅（0.3s）

### 6.3 兼容性验收

- [ ] Chrome 最新版测试通过
- [ ] Firefox 最新版测试通过
- [ ] Safari 最新版测试通过
- [ ] 移动端响应式布局正常

---

## 7. 风险与依赖

### 7.1 风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 现有路由变更可能影响外链 | 中 | 添加重定向规则 |
| 菜单状态管理复杂度 | 低 | 使用 Context + localStorage |

### 7.2 依赖

- 现有 `/domain` 页面组件
- 现有 `/prototype` 页面组件
- 现有 API 服务层

---

## 8. 附录

### 8.1 相关文件

- `/src/app/dashboard/page.tsx` - Dashboard 主页
- `/src/app/domain/page.tsx` - 领域模型页
- `/src/app/prototype/page.tsx` - 原型预览页
- `/src/app/requirements/new/page.tsx` - 需求输入页

### 8.2 参考资料

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Flow](https://reactflow.dev/) - 领域关系图
- [Radix UI](https://www.radix-ui.com/) - 可访问性组件库