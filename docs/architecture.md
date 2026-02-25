# VibeX Frontend 技术架构方案

## 1. 技术选型

### 1.1 核心框架

| 技术 | 选型 | 理由 |
|------|------|------|
| 前端框架 | React 18+ | 主流、生态丰富 |
| 元框架 | Next.js 14+ (App Router) | SSR/SSG 支持、文件系统路由 |
| 路由 | Next.js App Router | 官方推荐、简化数据获取 |
| 样式方案 | CSS Modules + CSS Variables | 产品要求、 scoped 样式 |

### 1.2 状态管理

| 场景 | 方案 | 理由 |
|------|------|------|
| 全局状态 | Zustand | 轻量、API 简洁、适合中型应用 |
| 服务端状态 | TanStack Query | 缓存、轮询、失效策略 |
| 表单状态 | React Hook Form | 性能好、社区主流 |
| UI 状态 | Context API | 主题、语言等低频变更 |

### 1.3 核心依赖

| 功能 | 库 | 版本 | 理由 |
|------|-----|------|------|
| 流程图编辑 | @xyflow/react (React Flow) | ^18.0.0 | 功能完善、社区活跃 |
| AI 对话 UI | streaming 实现 | 自研 | 定制化强、依赖少 |
| 表单验证 | Zod | ^3.x | 类型安全、TS 友好 |
| HTTP 客户端 | Fetch API (原生) | - | 轻量、符合 Web 标准 |
| 日期处理 | date-fns | ^3.x | 轻量、Tree-shakeable |
| 图标 | Lucide React | ^0.400+ | 风格统一、开源免费 |

### 1.4 开发工具

| 工具 | 选型 | 用途 |
|------|------|------|
| 包管理器 | pnpm | 速度快、磁盘优化 |
| 构建工具 | Next.js 内置 (Turbopack) | 开发体验 |
| 代码规范 | ESLint + Prettier | 团队协作 |
| 测试 | Vitest + React Testing Library | 单元/组件测试 |

---

## 2. 项目结构

```
vibex-frontend/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── (auth)/             # 认证路由组
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/        # 仪表盘路由组
│   │   │   ├── dashboard/
│   │   │   ├── chat/
│   │   │   ├── flow/
│   │   │   ├── pages/
│   │   │   └── editor/
│   │   ├── layout.tsx          # 根布局
│   │   └── page.tsx            # 落地页
│   │
│   ├── components/             # 业务组件
│   │   ├── ui/                 # 基础 UI 组件 (Button, Card)
│   │   ├── chat/               # AI 对话组件
│   │   ├── flow/               # 流程图组件
│   │   ├── layout/             # 布局组件 (Header, Sidebar)
│   │   └── forms/              # 表单组件
│   │
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   └── useFlow.ts
│   │
│   ├── stores/                 # Zustand stores
│   │   ├── authStore.ts
│   │   ├── projectStore.ts
│   │   └── uiStore.ts
│   │
│   ├── lib/                    # 工具函数
│   │   ├── api.ts              # HTTP 封装
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   ├── types/                  # TypeScript 类型
│   │   ├── api.ts
│   │   ├── chat.ts
│   │   └── flow.ts
│   │
│   └── styles/                 # 全局样式
│       ├── globals.css
│       └── variables.css
│
├── public/                     # 静态资源
├── tests/                      # 测试文件
├── docs/                       # 项目文档
├── package.json
├── next.config.js
├── tsconfig.json
└── vitest.config.ts
```

---

## 3. 核心模块设计

### 3.1 路由结构

| 路由 | 页面 | 权限 | 说明 |
|------|------|------|------|
| `/` | 落地页 | 公开 | 产品介绍 |
| `/auth` | 登录/注册 | 公开 | 认证入口 |
| `/dashboard` | 用户中心 | 需登录 | 项目列表 |
| `/chat` | AI 对话页 | 需登录 | MVP 核心 |
| `/flow` | 流程图编辑 | 需登录 | MVP 核心 |
| `/pages` | 页面列表 | 需登录 | 项目页面管理 |
| `/editor` | 页面编辑 | 需登录 | 低代码编辑器 |
| `/preview` | 原型预览 | 需登录 | 设备模拟 |

### 3.2 页面布局

#### 认证页面 (`/auth`)
- 简洁布局，无侧边栏
- 居中卡片形式

#### Dashboard 布局 (需登录)
- 固定 Header: 64px
- 侧边栏: 200px (可折叠)
- 主内容区: 自适应

#### Editor 布局 (三栏)
```
┌──────────┬─────────────┬────────────┐
│ 组件库   │   画布      │  属性面板   │
│ 200px   │   自适应    │   280px    │
└──────────┴─────────────┴────────────┘
```

### 3.3 数据流设计

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  UI Layer   │────▶│ Hooks Layer │────▶│ Store Layer │
│ Components  │◀────│  Business   │◀────│   Zustand   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  API Layer  │
                    │   Fetch     │
                    └─────────────┘
```

### 3.4 核心组件接口

#### Button 组件
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

#### Card 组件
```typescript
interface CardProps {
  hoverable?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

#### FlowEditor 组件
```typescript
interface FlowEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge;
  onSave?: (data: FlowData) => void;
}
```

---

## 4. MVP 实施计划

### Phase 1: 基础框架 (Day 1-2)
- [ ] 初始化 Next.js 项目
- [ ] 配置 ESLint + Prettier + Vitest
- [ ] 建立项目目录结构
- [ ] 实现基础 UI 组件 (Button, Card)
- [ ] 配置 CSS Variables 主题系统

### Phase 2: 认证与布局 (Day 2-3)
- [ ] 实现登录/注册页面
- [ ] 实现 Dashboard 布局 (Header + Sidebar)
- [ ] 实现用户中心页面
- [ ] 接入认证状态管理

### Phase 3: 核心功能 (Day 3-5)
- [ ] AI 对话页开发
  - [ ] 对话列表组件
  - [ ] 消息渲染组件
  - [ ] 输入框组件
  - [ ] 流式响应处理
- [ ] 流程图编辑页开发
  - [ ] React Flow 集成
  - [ ] 节点库面板
  - [ ] 属性编辑面板
  - [ ] 连线操作

### Phase 4: 支撑功能 (Day 5-7)
- [ ] 页面列表页
- [ ] 原型预览页
- [ ] 基础测试覆盖

---

## 5. 验收标准

### 5.1 功能验收
- [ ] 用户可完成登录/注册流程
- [ ] 用户可在 Dashboard 查看项目列表
- [ ] 用户可进入 AI 对话页发送消息并接收回复
- [ ] 用户可在流程图页拖拽节点、连接、编辑属性
- [ ] 用户可预览页面原型

### 5.2 技术验收
- [ ] TypeScript 无报错
- [ ] ESLint 检查通过
- [ ] 单元测试覆盖率 > 60%
- [ ] 首次加载 LCP < 2.5s
- [ ] Lighthouse 性能 > 80

---

## 6. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 流程图复杂度高 | 开发周期超预期 | 优先实现核心连线功能，特性后续补充 |
| AI 对话流式处理 | 体验与性能平衡 | 使用 Server-Sent Events，控制缓冲区 |
| 多人协作冲突 | 状态一致性 | MVP 暂不开放协作，单用户先行 |

---

*产出时间: 2026-02-25*
*架构师: Architect Agent*
