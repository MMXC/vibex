type: 'component',
  children: comp.hasChildren ? [] : undefined
  }));
};
```

**UI 组件**:
- 使用 `@tanstack/react-query` 管理懒加载状态
- 使用 `react-arborist` 或自定义树组件

### 3.4 模块 4: 原型编辑器 + AI 对话

**目标**: 右侧原型预览 + 底部 AI 对话框

**新功能**:

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 原型预览 | 实时渲染选中页面 | P0 |
| 组件选中 | 点击组件高亮并设置上下文 | P0 |
| Ask 模式 | 单次问答，不保留上下文 | P0 |
| Agent 模式 | 多轮对话，保留上下文 | P1 |

**现有 API**:
- `POST /api/chat` - MiniMax AI 流式对话
- `POST /api/ai-design-chat` - 设计专用 AI 对话

**技术方案**:

```typescript
// 原型编辑器状态
interface PrototypeEditorState {
  selectedPageId: string;
  selectedComponentId: string | null;
  aiContext: {
    mode: 'ask' | 'agent';
    selectedComponent: UIComponent | null;
    conversationId: string;
  };
}

// AI 对话
const handleAIChat = async (message: string) => {
  const response = await apiService.aiDesignChat({
    message,
    conversationId: state.aiContext.conversationId,
    projectId,
    context: {
      currentPage: state.selectedPageId,
      currentComponent: state.selectedComponentId,
      designGoals: []
    }
  });
  
  // 流式响应处理
  // ...
};
```

**UI 布局**:
```
┌─────────────────────────────────────────────────────────┐
│ 原型编辑器                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    原型预览区域                          │
│                  (80% 高度)                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [Ask 模式] [Agent 模式]    上下文: Navigation          │
├─────────────────────────────────────────────────────────┤
│ AI: 您选中了导航栏组件，需要什么帮助？                   │
│ 用户: 把导航栏改成深色主题                               │
├─────────────────────────────────────────────────────────┤
│ [输入框...]                                    [发送]   │
└─────────────────────────────────────────────────────────┘
    ↑ 底部 AI 对话框 (20% 高度，可拖拽调整)
```

---

## 4. API 设计

### 4.1 新增 API

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/api/ai/generate-domain` | AI 生成领域模型 |
| POST | `/api/ai/generate-flow` | AI 生成交互流程 |
| POST | `/api/ai/generate-pages` | AI 生成页面组件树 |
| POST | `/api/ai/modify-component` | AI 修改组件属性 |

### 4.2 现有 API 改进

| 方法 | 路由 | 改进点 |
|------|------|--------|
| POST | `/api/requirements-analysis` | 增加图布局位置输出 |
| POST | `/api/ai-design-chat` | 增加组件上下文参数 |
| POST | `/api/ai-ui-generation` | 增加页面级生成模式 |

### 4.3 API 详细设计

#### 4.3.1 生成领域模型

```http
POST /api/ai/generate-domain
Content-Type: application/json

{
  "requirementId": "req-xxx",
  "requirementText": "我想要开发一个电商系统...",
  "projectId": "proj-xxx"
}

Response:
{
  "entities": [
    {
      "id": "entity-1",
      "name": "User",
      "type": "person",
      "description": "系统用户",
      "attributes": [
        { "name": "id", "type": "string", "required": true },
        { "name": "username", "type": "string", "required": true }
      ],
      "position": { "x": 100, "y": 100 }
    }
  ],
  "relations": [
    {
      "id": "rel-1",
      "sourceEntityId": "entity-1",
      "targetEntityId": "entity-2",
      "relationType": "association",
      "description": "用户创建订单"
    }
  ]
}
```

#### 4.3.2 生成交互流程

```http
POST /api/ai/generate-flow
Content-Type: application/json

{
  "projectId": "proj-xxx",
  "domainEntities": [...]
}

Response:
{
  "pages": [
    {
      "id": "page-1",
      "name": "首页",
      "route": "/",
      "relatedEntities": ["User", "Product"],
      "position": { "x": 400, "y": 50 }
    },
    {
      "id": "page-2",
      "name": "产品列表",
      "route": "/products",
      "relatedEntities": ["Product"],
      "position": { "x": 200, "y": 200 }
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "sourcePageId": "page-1",
      "targetPageId": "page-2",
      "trigger": "点击产品分类"
    }
  ]
}
```

#### 4.3.3 AI 设计对话 (增强版)

```http
POST /api/ai-design-chat
Content-Type: application/json

{
  "message": "把导航栏改成深色主题",
  "conversationId": "conv-xxx",
  "projectId": "proj-xxx",
  "context": {
    "currentPage": "page-1",
    "currentComponent": "comp-1-1",
    "componentData": {
      "type": "navigation",
      "props": { "title": "我的应用", "theme": "light" }
    }
  }
}

Response (Streaming):
data: {"content": "好的，我将为您把导航栏修改为深色主题..."}
data: {"content": "修改后的组件配置："}
data: {"componentUpdate": {"id": "comp-1-1", "props": {"theme": "dark"}}}
data: {"done": true}
```

---

## 5. 前端组件设计

### 5.1 领域模型图组件

```typescript
// components/DomainGraph.tsx
import ReactFlow, { Node, Edge } from 'reactflow';

interface DomainGraphProps {
  entities: DomainEntity[];
  relations: EntityRelation[];
  onEntityAdd: () => void;
  onEntityEdit: (entity: DomainEntity) => void;
  onRelationEdit: (relation: EntityRelation) => void;
}

export function DomainGraph({ 
  entities, 
  relations, 
  onEntityAdd, 
  onEntityEdit, 
  onRelationEdit 
}: DomainGraphProps) {
  const nodes: Node[] = entities.map(entity => ({
    id: entity.id,
    type: 'domainEntity',
    data: entity,
    position: entity.position || { x: 0, y: 0 }
  }));
  
  const edges: Edge[] = relations.map(relation => ({
    id: relation.id,
    source: relation.fromEntityId,
    target: relation.toEntityId,
    label: relation.relationType
  }));
  
  return (
    <div className="domain-graph">
      <ReactFlow nodes={nodes} edges={edges} />
      <button onClick={onEntityAdd}>+ 添加实体</button>
    </div>
  );
}
```

### 5.2 交互流程图组件

```typescript
// components/FlowGraph.tsx
import ReactFlow from 'reactflow';

interface FlowGraphProps {
  pages: FlowPage[];
  connections: FlowConnection[];
  onPageAdd: () => void;
  onPageEdit: (page: FlowPage) => void;
}

export function FlowGraph({ 
  pages, 
  connections, 
  onPageAdd, 
  onPageEdit 
}: FlowGraphProps) {
  const nodes: Node[] = pages.map(page => ({
    id: page.id,
    type: 'flowPage',
    data: {
      name: page.name,
      route: page.route,
      relatedEntities: page.relatedEntities
    },
    position: page.position
  }));
  
  const edges: Edge[] = connections.map(conn => ({
    id: conn.id,
    source: conn.sourcePageId,
    target: conn.targetPageId,
    label: conn.trigger
  }));
  
  return (
    <div className="flow-graph">
      <ReactFlow nodes={nodes} edges={edges} />
      <button onClick={onPageAdd}>+ 添加页面</button>
    </div>
  );
}
```

### 5.3 AI 对话框组件

```typescript
// components/AIChatPanel.tsx
interface AIChatPanelProps {
  mode: 'ask' | 'agent';
  context: {
    currentPage: string;
    selectedComponent: UIComponent | null;
  };
  onComponentUpdate: (component: UIComponent) => void;
}

export function AIChatPanel({ 
  mode, 
  context, 
  onComponentUpdate 
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  
  const handleSend = async () => {
    const response = await apiService.aiDesignChat({
      message: input,
      context: {
        currentPage: context.currentPage,
        currentComponent: context.selectedComponent?.id
      }
    });
    
    // 处理流式响应
    for await (const chunk of response) {
      if (chunk.componentUpdate) {
        onComponentUpdate(chunk.componentUpdate);
      }
      // 更新消息列表
    }
  };
  
  return (
    <div className="ai-chat-panel">
      <div className="mode-toggle">
        <button className={mode === 'ask' ? 'active' : ''}>Ask</button>
        <button className={mode === 'agent' ? 'active' : ''}>Agent</button>
      </div>
      <div className="context-bar">
        上下文: {context.selectedComponent?.name || '无选中组件'}
      </div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input value={input} onChange={e => setInput(e.target.value)} />
        <button onClick={handleSend}>发送</button>
      </div>
    </div>
  );
}
```

---

## 6. 数据库设计

### 6.1 新增表

```sql
-- 流程图页面
CREATE TABLE FlowPage (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  name TEXT NOT NULL,
  route TEXT NOT NULL,
  relatedEntities TEXT, -- JSON array
  position TEXT, -- JSON {x, y}
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (projectId) REFERENCES Project(id)
);

-- 流程图连接
CREATE TABLE FlowConnection (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  sourcePageId TEXT NOT NULL,
  targetPageId TEXT NOT NULL,
  trigger TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (projectId) REFERENCES Project(id),
  FOREIGN KEY (sourcePageId) REFERENCES FlowPage(id),
  FOREIGN KEY (targetPageId) REFERENCES FlowPage(id)
);

-- AI 对话历史
CREATE TABLE AIConversation (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  userId TEXT NOT NULL,
  context TEXT, -- JSON
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

### 6.2 修改表

```sql
-- DomainEntity 添加位置字段
ALTER TABLE DomainEntity ADD COLUMN position TEXT;

-- UIComponent 添加父组件关系
ALTER TABLE UIComponent ADD COLUMN parentId TEXT;
ALTER TABLE UIComponent ADD COLUMN order INTEGER;
```

---

## 7. 任务拆解

### 7.1 Phase 1: 领域模型真实 AI (P0)

| 任务 ID | 任务 | 角色 | 预估 |
|---------|------|------|------|
| 1.1 | 接入 requirements-analysis API | dev | 2h |
| 1.2 | 移除 mockDomains/mockRelations | dev | 1h |
| 1.3 | 集成 React Flow 图可视化 | dev | 4h |
| 1.4 | 实现实体增删改功能 | dev | 3h |
| 1.5 | 测试领域模型生成 | tester | 2h |

### 7.2 Phase 2: 交互流程图 (P0)

| 任务 ID | 任务 | 角色 | 预估 |
|---------|------|------|------|
| 2.1 | 创建 AI 生成流程 API | dev | 3h |
| 2.2 | 创建 FlowPage/FlowConnection 表 | dev | 1h |
| 2.3 | 创建流程图页面 /flow | dev | 4h |
| 2.4 | 实现思维导图布局 | dev | 3h |
| 2.5 | 测试流程图生成 | tester | 2h |

### 7.3 Phase 3: 页面组件树 (P1)

| 任务 ID | 任务 | 角色 | 预估 |
|---------|------|------|------|
| 3.1 | 创建组件树 API | dev | 2h |
| 3.2 | 实现懒加载树菜单 | dev | 3h |
| 3.3 | 集成到项目详情页 | dev | 2h |
| 3.4 | 测试组件树加载 | tester | 1h |

### 7.4 Phase 4: 原型编辑器 + AI 对话 (P1)

| 任务 ID | 任务 | 角色 | 预估 |
|---------|------|------|------|
| 4.1 | 改进 ai-design-chat API | dev | 2h |
| 4.2 | 创建原型编辑器布局 | dev | 3h |
| 4.3 | 实现组件选中高亮 | dev | 2h |
| 4.4 | 实现 AI 对话框 | dev | 4h |
| 4.5 | 实现 Ask/Agent 模式切换 | dev | 2h |
| 4.6 | 测试 AI 对话功能 | tester | 2h |

---

## 8. 验证清单

### 8.1 领域模型验证

- [ ] 需求描述后调用真实 AI
- [ ] 显示图状领域模型
- [ ] 可添加/删除实体
- [ ] 可编辑关系类型
- [ ] 拖拽调整布局

### 8.2 交互流程验证

- [ ] 领域模型确认后生成流程
- [ ] 显示思维导图式布局
- [ ] 页面节点显示关联实体
- [ ] 可添加/删除页面
- [ ] 可编辑跳转关系

### 8.3 原型编辑器验证

- [ ] 左侧显示组件树菜单
- [ ] 点击组件选中高亮
- [ ] 底部 AI 对话框正常
- [ ] Ask 模式单次问答
- [ ] Agent 模式多轮对话
- [ ] AI 可修改组件属性

---

## 9. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| AI 响应慢 | 用户体验差 | 添加加载动画，流式输出 |
| AI 输出不准确 | 用户需要手动修正 | 支持用户编辑 AI 结果 |
| 图布局混乱 | 显示效果差 | 使用自动布局算法 |
| 组件树过大 | 加载慢 | 懒加载 + 虚拟滚动 |

---

## 10. 总结

| 项目 | 内容 |
|------|------|
| **总任务数** | 21 个 |
| **预估工时** | 45 小时 |
| **优先级 P0** | 领域模型 + 交互流程 |
| **优先级 P1** | 组件树 + AI 对话 |

**关键里程碑**:
1. Week 1: 领域模型真实 AI
2. Week 2: 交互流程图
3. Week 3: 页面组件树 + AI 对话

---

**分析完成时间**: 2026-03-03 01:03
**分析者**: Analyst Agent