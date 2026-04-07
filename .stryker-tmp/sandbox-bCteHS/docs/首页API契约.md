# 首页 API 契约 (完整版)

> 版本: v2.0  
> 创建时间: 2026-03-21  
> 更新: 2026-03-21  
> 页面: 首页 /

---

## 一、API 总览

### 1.1 接口分类

| 分类 | 数量 | 说明 |
|------|------|------|
| 认证类 | 5 | 登录/注册/登出/OAuth/Token刷新 |
| 用户类 | 3 | 个人信息/设置/头像 |
| 分析类 | 4 | 需求分析/诊断/优化/澄清 |
| 项目类 | 4 | CRUD + 状态管理 |
| 历史类 | 2 | 对话历史/草稿 |
| 模板类 | 3 | 模板列表/预览/应用 |
| 渲染类 | 2 | Mermaid渲染/导出 |
| Webhook | 1 | 状态变更回调 |

**总计**: 24 个接口

---

## 二、认证类 API

### 2.1 用户登录

**接口**: `POST /api/v1/auth/login`

**描述**: 邮箱密码登录

**请求**:
```typescript
interface LoginRequest {
  email: string;       // 邮箱
  password: string;     // 密码 (6-20位)
}
```

**响应**:
```typescript
interface LoginResponse {
  success: boolean;
  data: {
    token: string;           // JWT access token
    refreshToken: string;    // 刷新token
    expiresIn: number;       // 过期时间(秒)
    user: {
      id: string;
      email: string;
      name: string;
      avatar?: string;
      plan: 'free' | 'pro' | 'enterprise';
    };
  };
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
    "expiresIn": 3600,
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "张三",
      "avatar": "https://...",
      "plan": "pro"
    }
  }
}
```

---

### 2.2 用户注册

**接口**: `POST /api/v1/auth/register`

**描述**: 新用户注册

**请求**:
```typescript
interface RegisterRequest {
  email: string;       // 邮箱 (唯一)
  password: string;     // 密码 (8-20位，需包含大小写+数字)
  name: string;         // 昵称 (2-20字符)
  captcha?: string;     // 验证码 (可选)
}
```

**响应**:
```typescript
interface RegisterResponse {
  success: boolean;
  data: {
    userId: string;
    email: string;
    name: string;
    createdAt: string;
  };
}
```

---

### 2.3 邮箱验证

**接口**: `GET /api/v1/auth/verify-email`

**描述**: 验证邮箱链接

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | string | 是 | 邮箱验证token |

**响应**:
```typescript
interface VerifyEmailResponse {
  success: boolean;
  data: {
    verified: boolean;
    message: string;
  };
}
```

---

### 2.4 Google OAuth

**接口**: `GET /api/v1/auth/google`

**描述**: Google OAuth2.0 登录入口

**响应**: 302 重定向到 Google 授权页面

**回调接口**: `GET /api/v1/auth/google/callback`

**请求参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| code | string | Google 授权码 |
| state | string | CSRF 防护token |

**响应**: 同 LoginResponse

---

### 2.5 Token 刷新

**接口**: `POST /api/v1/auth/refresh`

**描述**: 刷新 access token

**请求**:
```typescript
interface RefreshTokenRequest {
  refreshToken: string;
}
```

**响应**:
```typescript
interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
    expiresIn: number;
  };
}
```

---

### 2.6 登出

**接口**: `POST /api/v1/auth/logout`

**描述**: 用户登出

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
interface LogoutResponse {
  success: boolean;
  data: {
    message: string;
  };
}
```

---

### 2.7 发送重置密码邮件

**接口**: `POST /api/v1/auth/forgot-password`

**请求**:
```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

**响应**:
```typescript
interface ForgotPasswordResponse {
  success: boolean;
  data: {
    message: string;
    expiresIn: number;  // 邮件链接有效期(秒)
  };
}
```

---

### 2.8 重置密码

**接口**: `POST /api/v1/auth/reset-password`

**请求**:
```typescript
interface ResetPasswordRequest {
  token: string;       // 重置token
  newPassword: string;  // 新密码
}
```

**响应**:
```typescript
interface ResetPasswordResponse {
  success: boolean;
  data: {
    message: string;
  };
}
```

---

## 三、用户类 API

### 3.1 获取用户信息

**接口**: `GET /api/v1/users/me`

**请求头**: `Authorization: Bearer <token>`

**响应**:
```typescript
interface GetUserResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    plan: 'free' | 'pro' | 'enterprise';
    usage: {
      projectsUsed: number;
      projectsLimit: number;
      apiCallsUsed: number;
      apiCallsLimit: number;
    };
    createdAt: string;
    updatedAt: string;
  };
}
```

---

### 3.2 更新用户信息

**接口**: `PATCH /api/v1/users/me`

**请求**:
```typescript
interface UpdateUserRequest {
  name?: string;
  avatar?: string;    // Base64 或 URL
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    language: 'zh-CN' | 'en-US';
    notifications: boolean;
  };
}
```

**响应**: 同 GetUserResponse

---

### 3.3 上传头像

**接口**: `POST /api/v1/users/me/avatar`

**请求**: multipart/form-data

| 字段 | 类型 | 说明 |
|------|------|------|
| file | File | 图片文件 (最大2MB) |

**支持的格式**: jpg, png, gif, webp

**响应**:
```typescript
interface UploadAvatarResponse {
  success: boolean;
  data: {
    url: string;
    width: number;
    height: number;
  };
}
```

---

## 四、分析类 API

### 4.1 提交需求分析

**接口**: `POST /api/v1/analyze`

**描述**: 提交需求文本，获取 DDD 分析结果

**请求头**: `Authorization: Bearer <token>` (可选，未登录用户限制调用次数)

**请求**:
```typescript
interface AnalyzeRequest {
  requirement: string;       // 需求文本 (1-10000字)
  context?: {
    currentStep?: 1 | 2 | 3 | 4;
    previousResult?: {
      boundedContexts?: BoundedContext[];
      domainModels?: DomainModel[];
      flowCharts?: FlowChart[];
    };
    followUpQuestion?: string;  // 追问内容
  };
  options?: {
    includeMermaid?: boolean;  // 是否生成Mermaid代码，默认true
    depth?: 'basic' | 'detailed';  // 分析深度
  };
}
```

**响应**:
```typescript
interface AnalyzeResponse {
  success: boolean;
  data: {
    analysisId: string;        // 本次分析ID
    boundedContexts: BoundedContext[];
    domainModels: DomainModel[];
    flowCharts: FlowChart[];
    componentTrees: ComponentTree[];
    mermaidCodes?: {
      boundedContexts?: string;
      domainModels?: string;
      flowCharts?: string;
      componentTrees?: string;
    };
  };
  meta?: {
    processingTime: number;    // 处理耗时(ms)
    tokensUsed: number;       // 消耗token数
  };
}
```

---

### 4.2 流式需求分析

**接口**: `GET /api/v1/analyze/stream`

**描述**: SSE 流式返回 AI 分析过程和结果

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| requirement | string | 是 | 需求文本 |
| depth | string | 否 | basic/detailed |

**SSE 事件**:

```typescript
// 连接成功
event: connected
data: {"sessionId": "sess_xxx"}

// 思考过程
event: thinking
data: {
  "id": "th_001",
  "content": "正在分析需求结构...",
  "status": "processing" | "done",
  "timestamp": "2026-03-21T10:00:00Z"
}

// 分析进度
event: progress
data: {
  "step": 1,
  "total": 4,
  "message": "分析限界上下文",
  "percent": 25
}

// 中间结果 (限界上下文完成)
event: bounded-contexts
data: {
  "boundedContexts": [...]
}

// 中间结果 (领域模型完成)
event: domain-models
data: {
  "domainModels": [...]
}

// 中间结果 (流程图完成)
event: flow-charts
data: {
  "flowCharts": [...]
}

// 中间结果 (组件树完成)
event: component-trees
data: {
  "componentTrees": [...]
}

// 最终结果
event: result
data: {
  "analysisId": "ana_xxx",
  "boundedContexts": [...],
  "domainModels": [...],
  "flowCharts": [...],
  "componentTrees": [...],
  "mermaidCodes": {...}
}

// 错误
event: error
data: {
  "code": "ANALYSIS_FAILED",
  "message": "分析失败，请重试"
}

// 完成
event: done
data: {
  "processingTime": 5000,
  "tokensUsed": 1500
}
```

---

### 4.3 智能诊断

**接口**: `POST /api/v1/analyze/diagnose`

**描述**: 对需求或分析结果进行智能诊断

**请求**:
```typescript
interface DiagnoseRequest {
  requirement?: string;
  analysis?: {
    boundedContexts?: BoundedContext[];
    domainModels?: DomainModel[];
  };
  options?: {
    checkItems?: ('completeness' | 'consistency' | 'best-practices')[];
  };
}
```

**响应**:
```typescript
interface DiagnoseResponse {
  success: boolean;
  data: {
    issues: Issue[];
    score: number;           // 0-100 健康分数
    summary: string;
  };
}

interface Issue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'completeness' | 'consistency' | 'best-practice';
  title: string;
  description: string;
  location?: {
    type: 'bounded-context' | 'domain-model' | 'attribute';
    id: string;
  };
  suggestion: string;
}
```

---

### 4.4 应用优化建议

**接口**: `POST /api/v1/analyze/optimize`

**描述**: 生成优化建议

**请求**:
```typescript
interface OptimizeRequest {
  analysis: {
    boundedContexts?: BoundedContext[];
    domainModels?: DomainModel[];
    flowCharts?: FlowChart[];
  };
  goals?: ('simplicity' | 'performance' | 'maintainability')[];
}
```

**响应**:
```typescript
interface OptimizeResponse {
  success: boolean;
  data: {
    suggestions: Suggestion[];
    summary: string;
  };
}

interface Suggestion {
  id: string;
  category: 'refactor' | 'pattern' | 'structure';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  changes?: {
    type: string;
    before: string;
    after: string;
  }[];
}
```

---

### 4.5 AI 对话澄清 (SSE)

**接口**: `GET /api/v1/analyze/clarify/stream`

**描述**: SSE 流式返回澄清问题

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| requirement | string | 是 | 需求文本 |
| history | string | 否 | Base64编码的历史对话 |

**SSE 事件**:

```typescript
// 开始追问
event: start
data: {"questionId": "q_001"}

// 追问问题
event: question
data: {
  "id": "q_001",
  "content": "您提到的「订单」，是指在线支付订单还是线下到店消费订单？",
  "type": "single-choice" | "multi-choice" | "text",
  "options": [
    {"value": "online", "label": "在线支付"},
    {"value": "offline", "label": "到店消费"},
    {"value": "both", "label": "两者都有"}
  ],
  "required": true
}

// 用户回答
event: answer
data: {
  "questionId": "q_001",
  "answer": "online",
  "timestamp": "2026-03-21T10:00:00Z"
}

// 下一个问题
event: question
data: {...}

// 完成
event: complete
data: {
  "clarifiedRequirement": "原始需求 + 补充的澄清内容",
  "questionsAnswered": 3
}
```

---

### 4.6 保存分析草稿

**接口**: `POST /api/v1/drafts`

**描述**: 自动保存分析草稿

**请求**:
```typescript
interface SaveDraftRequest {
  type: 'analysis' | 'conversation';
  data: {
    requirement?: string;
    currentStep?: number;
    boundedContexts?: BoundedContext[];
    domainModels?: DomainModel[];
    flowCharts?: FlowChart[];
    thinkingMessages?: ThinkingMessage[];
  };
  autoSave?: boolean;  // 是否自动保存
}
```

**响应**:
```typescript
interface SaveDraftResponse {
  success: boolean;
  data: {
    draftId: string;
    updatedAt: string;
  };
}
```

---

### 4.7 获取草稿列表

**接口**: `GET /api/v1/drafts`

**描述**: 获取用户的所有草稿

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | analysis/conversation |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |

**响应**:
```typescript
interface DraftListResponse {
  success: boolean;
  data: {
    drafts: Draft[];
    total: number;
    page: number;
    limit: number;
  };
}

interface Draft {
  id: string;
  type: 'analysis' | 'conversation';
  preview: string;        // 需求预览
  currentStep: number;
  updatedAt: string;
}
```

---

### 4.8 获取草稿详情

**接口**: `GET /api/v1/drafts/:id`

**响应**: SaveDraftRequest (完整数据)

---

### 4.9 删除草稿

**接口**: `DELETE /api/v1/drafts/:id`

**响应**:
```typescript
interface DeleteDraftResponse {
  success: boolean;
}
```

---

## 五、项目类 API

### 5.1 创建项目

**接口**: `POST /api/v1/projects`

**描述**: 将分析结果保存为项目

**请求**:
```typescript
interface CreateProjectRequest {
  name: string;                    // 项目名称 (1-100字符)
  description?: string;            // 项目描述
  requirement: string;              // 原始需求
  analysis: {
    boundedContexts: BoundedContext[];
    domainModels: DomainModel[];
    flowCharts: FlowChart[];
    componentTrees: ComponentTree[];
  };
  template?: string;               // 使用的模板ID
  tags?: string[];                 // 标签
}
```

**响应**:
```typescript
interface CreateProjectResponse {
  success: boolean;
  data: {
    project: Project;
    shareUrl?: string;  // 分享链接
  };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  requirement: string;
  analysis: {...};
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}
```

---

### 5.2 获取项目列表

**接口**: `GET /api/v1/projects`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | draft/published/archived |
| tag | string | 否 | 按标签筛选 |
| search | string | 否 | 搜索项目名 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |
| sort | string | 否 | createdAt/updatedAt/name |

**响应**:
```typescript
interface ProjectListResponse {
  success: boolean;
  data: {
    projects: ProjectPreview[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

interface ProjectPreview {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  thumbnail?: string;    // 缩略图
  createdAt: string;
  updatedAt: string;
}
```

---

### 5.3 获取项目详情

**接口**: `GET /api/v1/projects/:id`

**响应**:
```typescript
interface ProjectDetailResponse {
  success: boolean;
  data: {
    project: Project;
    shareUrl?: string;
    collaborators?: Collaborator[];
  };
}

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
}
```

---

### 5.4 更新项目

**接口**: `PATCH /api/v1/projects/:id`

**请求**: 部分字段更新

```typescript
interface UpdateProjectRequest {
  name?: string;
  description?: string;
  analysis?: {...};
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
}
```

---

### 5.5 删除项目

**接口**: `DELETE /api/v1/projects/:id`

**响应**:
```typescript
interface DeleteProjectResponse {
  success: boolean;
  data: {
    deletedId: string;
  };
}
```

---

### 5.6 发布项目

**接口**: `POST /api/v1/projects/:id/publish`

**描述**: 将项目状态改为已发布

**响应**: ProjectDetailResponse

---

### 5.7 复制项目

**接口**: `POST /api/v1/projects/:id/clone`

**描述**: 复制项目创建新项目

**响应**: CreateProjectResponse

---

### 5.8 导出项目

**接口**: `GET /api/v1/projects/:id/export`

**描述**: 导出项目数据

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| format | string | 是 | json/markdown/pdf |

**响应**: 文件下载或 JSON 数据

---

## 六、模板类 API

### 6.1 获取模板列表

**接口**: `GET /api/v1/templates`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | 模板分类 |
| search | string | 否 | 搜索模板名 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

**响应**:
```typescript
interface TemplateListResponse {
  success: boolean;
  data: {
    templates: Template[];
    total: number;
  };
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  usageCount: number;
  isOfficial: boolean;
  createdAt: string;
}
```

---

### 6.2 获取模板详情

**接口**: `GET /api/v1/templates/:id`

**响应**:
```typescript
interface TemplateDetailResponse {
  success: boolean;
  data: {
    template: Template;
    preview: {
      boundedContexts: BoundedContext[];
      domainModels: DomainModel[];
    };
  };
}
```

---

### 6.3 应用模板

**接口**: `POST /api/v1/templates/:id/apply`

**描述**: 基于模板创建项目

**请求**:
```typescript
interface ApplyTemplateRequest {
  name: string;
  customize?: {
    requirement?: string;
    modifyContexts?: BoundedContext[];
  };
}
```

**响应**: CreateProjectResponse

---

## 七、渲染类 API

### 7.1 Mermaid 渲染

**接口**: `POST /api/v1/render/mermaid`

**描述**: 服务端渲染 Mermaid 图表

**请求**:
```typescript
interface RenderMermaidRequest {
  code: string;           // Mermaid 代码
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
  width?: number;
  height?: number;
  format?: 'svg' | 'png';
}
```

**响应**:
```typescript
interface RenderMermaidResponse {
  success: boolean;
  data: {
    svg?: string;        // SVG 代码
    png?: string;        // Base64 PNG
    width: number;
    height: number;
  };
}
```

---

### 7.2 导出图表

**接口**: `POST /api/v1/render/export`

**描述**: 导出图表为图片

**请求**:
```typescript
interface ExportChartRequest {
  type: 'bounded-context' | 'domain-model' | 'flow-chart' | 'component-tree';
  projectId?: string;      // 从项目获取
  mermaidCode?: string;    // 或直接提供代码
  format: 'svg' | 'png';
  scale?: number;          // 缩放比例
  backgroundColor?: string;
}
```

**响应**: 文件下载

---

## 八、历史类 API

### 8.1 获取对话历史

**接口**: `GET /api/v1/history`

**描述**: 获取用户的分析历史

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 否 | 日期筛选 YYYY-MM-DD |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

**响应**:
```typescript
interface HistoryResponse {
  success: boolean;
  data: {
    history: HistoryItem[];
    total: number;
  };
}

interface HistoryItem {
  id: string;
  type: 'analysis' | 'clarify' | 'diagnose';
  requirement: string;
  preview: string;
  createdAt: string;
}
```

---

### 8.2 获取历史详情

**接口**: `GET /api/v1/history/:id`

**响应**:
```typescript
interface HistoryDetailResponse {
  success: boolean;
  data: {
    id: string;
    type: string;
    requirement: string;
    messages: HistoryMessage[];
    result: {...};
    createdAt: string;
  };
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

---

## 九、数据模型

### 9.1 BoundedContext (限界上下文)

```typescript
interface BoundedContext {
  id: string;
  name: string;           // 名称
  description: string;    // 描述
  entities: string[];     // 核心实体列表
  services: string[];     // 领域服务
  events: string[];        // 领域事件
  mermaidCode?: string;
  position?: { x: number; y: number };  // 布局位置
}
```

---

### 9.2 DomainModel (领域模型)

```typescript
interface DomainModel {
  id: string;
  contextId: string;
  name: string;
  description?: string;
  attributes: Attribute[];
  relationships: Relationship[];
  mermaidCode?: string;
}

interface Attribute {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

interface Relationship {
  target: string;              // 目标实体名
  type: 'has' | 'belongs-to' | 'references' | 'inherit';
  label?: string;
  multiplicity?: '1:1' | '1:n' | 'n:m';
}
```

---

### 9.3 FlowChart (流程图)

```typescript
interface FlowChart {
  id: string;
  contextId: string;
  name: string;
  description?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  mermaidCode?: string;
}

interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'input' | 'output';
  position?: { x: number; y: number };
  style?: {
    fill?: string;
    stroke?: string;
  };
}

interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  type?: 'arrow' | 'association' | 'dependency';
}
```

---

### 9.4 ComponentTree (组件树)

```typescript
interface ComponentTree {
  id: string;
  pageId?: string;
  name: string;
  description?: string;
  nodes: ComponentNode[];
  mermaidCode?: string;
}

interface ComponentNode {
  id: string;
  name: string;
  type: 'page' | 'layout' | 'container' | 'component' | 'element';
  props?: Record<string, any>;
  children?: ComponentNode[];
  position?: { x: number; y: number };
}
```

---

### 9.5 ThinkingMessage (AI思考消息)

```typescript
interface ThinkingMessage {
  id: string;
  content: string;
  status: 'processing' | 'done' | 'error';
  timestamp: string;
  metadata?: {
    step?: number;
    tokensUsed?: number;
  };
}
```

---

## 十、错误码

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| INVALID_REQUEST | 400 | 请求参数错误 |
| INVALID_REQUIREMENT | 400 | 需求文本无效 |
| UNAUTHORIZED | 401 | 未登录或Token过期 |
| FORBIDDEN | 403 | 无权限访问 |
| NOT_FOUND | 404 | 资源不存在 |
| ANALYSIS_FAILED | 500 | AI分析失败 |
| RENDER_FAILED | 500 | 图表渲染失败 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| RATE_LIMITED | 429 | 请求过于频繁 |
| QUOTA_EXCEEDED | 403 | 配额超限 |

---

## 十一、认证与授权

### 11.1 认证方式

所有需要认证的接口，在请求头中携带 Token:

```
Authorization: Bearer <access_token>
```

### 11.2 Token 类型

| 类型 | 有效期 | 用途 |
|------|--------|------|
| access_token | 1小时 | API 访问 |
| refresh_token | 7天 | 刷新 access_token |

### 11.3 权限控制

| 用户计划 | API调用限制 | 项目数量 | 模板访问 |
|----------|-------------|----------|----------|
| free | 100次/天 | 3个 | 官方模板 |
| pro | 1000次/天 | 无限 | 全部模板 |
| enterprise | 无限 | 无限 | 全部+私有模板 |

---

## 十二、限流

| 接口类型 | 限制 | 窗口 |
|----------|------|------|
| 公开接口 | 20次/分钟 | sliding |
| 认证接口 | 60次/分钟 | sliding |
| 分析接口 | 10次/分钟 | sliding |
| SSE连接 | 5个并发 | - |
| 文件上传 | 10次/分钟 | sliding |

限流响应头:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1742524800
```

---

## 十三、Webhook

### 13.1 项目状态变更

**接口**: `POST /api/v1/webhooks/project-status`

**事件类型**:
| 事件 | 触发时机 |
|------|----------|
| project.created | 项目创建 |
| project.updated | 项目更新 |
| project.deleted | 项目删除 |
| project.published | 项目发布 |

**请求头**:
```
X-Webhook-Secret: <webhook_secret>
X-Webhook-Timestamp: <unix_timestamp>
X-Webhook-Signature: <hmac_sha256>
```

**签名验证**:
```
signature = HMAC-SHA256(secret, timestamp + "." + body)
```

**请求体**:
```typescript
interface ProjectWebhook {
  event: 'project.created' | 'project.updated' | 'project.deleted' | 'project.published';
  timestamp: string;
  data: {
    projectId: string;
    name: string;
    status: string;
    userId: string;
    changes?: Record<string, { old: any; new: any }>;
  };
}
```

---

## 十四、变更日志

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-03-21 | 初始版本，基础API |
| v2.0 | 2026-03-21 | 完整版，新增认证、用户、历史、模板、渲染、Webhook |
