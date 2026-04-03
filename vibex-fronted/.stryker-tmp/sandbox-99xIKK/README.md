# VibeX Frontend

VibeX 前端项目 - AI 驱动的需求分析和原型生成平台

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 16.x | App Router 框架 |
| React | 19.x | UI 库 |
| TypeScript | 5.x | 类型安全 |
| CSS Modules | - | 样式隔离 |
| Jest | - | 单元测试 |
| Playwright | - | E2E 测试 |

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── auth/              # 认证页面
│   ├── chat/              # AI 对话
│   ├── design/            # 设计流程 (5步)
│   │   ├── clarification/
│   │   ├── bounded-context/
│   │   ├── domain-model/
│   │   ├── business-flow/
│   │   └── ui-generation/
│   ├── domain/            # 领域模型编辑
│   ├── flow/              # 流程图编辑
│   └── prototype/          # 原型预览
├── components/             # React 组件
│   ├── ui/               # 基础 UI 组件
│   ├── design/           # 设计组件
│   ├── flow/             # 流程图组件
│   └── dialogue/         # 对话组件
├── services/              # 服务层
│   └── api/              # API 客户端
├── stores/                # Zustand 状态管理
├── hooks/                 # React Hooks
└── utils/                 # 工具函数
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 运行测试

```bash
# 单元测试
npm test

# E2E 测试
npm run test:e2e

# 覆盖率报告
npm run test:coverage
```

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
# ESLint
npm run lint

# Prettier
npm run format
```

## 设计流程 (5步)

1. **需求澄清** (`/design/clarification`) - 用户输入需求描述
2. **边界上下文** (`/design/bounded-context`) - 确定业务边界
3. **领域模型** (`/design/domain-model`) - 实体和关系建模
4. **业务流程** (`/design/business-flow`) - 流程图设计
5. **UI 生成** (`/design/ui-generation`) - 原型生成

## 组件文档

### ProgressiveLoading

渐进式加载状态组件

```tsx
import { ProgressiveLoading } from '@/components/ui/ProgressiveLoading';

<ProgressiveLoading 
  phase="processing"
  progress={50}
  message="处理中..."
/>
```

### 状态

- `idle` - 初始状态
- `initializing` - 骨架屏
- `processing` - 进度条
- `finalizing` - 淡入效果
- `complete` - 完成

## 环境变量

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.vibex.top
AUTH_SECRET=your-secret-key
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'feat: add xxx'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

## 许可证

MIT

## API 文档

### 认证 API

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "用户名",
  "email": "user@example.com",
  "password": "password"
}
```

### 需求澄清 API

#### 发送消息
```http
POST /api/clarify/chat
Content-Type: application/json

{
  "message": "我想做一个电商平台",
  "history": [
    {"role": "user", "content": "我想做一个管理系统"},
    {"role": "assistant", "content": "好的，请告诉我主要功能"}
  ]
}
```

#### 响应
```json
{
  "reply": "明白了，这是一个电商平台...",
  "quickReplies": ["用户管理系统", "电商平台", "博客系统"],
  "completeness": 65,
  "nextAction": "gather_more_info"
}
```

### 项目 API

#### 获取项目列表
```http
GET /api/projects
Authorization: Bearer <token>
```

#### 创建项目
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "我的项目",
  "description": "项目描述"
}
```

## 测试结果

- 单元测试: 933 passed
- E2E 测试: 5+ test suites
- 覆盖率: 64.11%

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|---------|
| NEXT_PUBLIC_API_URL | 后端 API 地址 | http://localhost:3001 |
| AUTH_SECRET | JWT 密钥 | - |
| DATABASE_URL | 数据库连接 | - |

## 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/MMXC/vibex.git
cd vibex/vibex-fronted

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local

# 4. 运行开发服务器
npm run dev

# 5. 运行测试
npm test
npm run test:e2e
```
