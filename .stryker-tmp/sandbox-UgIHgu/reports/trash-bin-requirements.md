# Dashboard 垃圾桶功能需求分析报告

## 项目概述

**目标**: Dashboard 垃圾桶功能：拖拽删除、回收站找回、清空永久删除

**分析时间**: 2026-03-02 20:06

**项目路径**: `/root/.openclaw/vibex`

---

## 1. 功能需求

### 1.1 交互设计

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                                   │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ 项目 A   │  │ 项目 B   │  │ 项目 C   │                   │
│  │          │  │          │  │          │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
│       │                                                      │
│       │ 拖拽                                                 │
│       ▼                                                      │
│                                          ┌─────────────┐    │
│                                          │   🗑️        │    │
│                                          │  回收站     │    │
│                                          │  (3)        │    │
│                                          └─────────────┘    │
│                                              右下角悬浮      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 功能清单

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 拖拽删除 | 将项目卡片拖拽到垃圾桶图标上删除 | P0 |
| 回收站弹窗 | 点击垃圾桶显示已删除项目列表 | P0 |
| 项目恢复 | 从回收站恢复项目到 Dashboard | P0 |
| 清空回收站 | 永久删除所有已删除项目 | P1 |
| 悬浮提示 | 拖拽时垃圾桶高亮+提示文字 | P2 |

### 1.3 交互流程

```
┌─────────────────────────────────────────────────────────────┐
│                      删除流程                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  用户拖拽项目卡片 ──▶ 移动到垃圾桶图标上 ──▶ 释放           │
│         │                    │                    │          │
│         │                    ▼                    │          │
│         │            垃圾桶高亮闪烁               │          │
│         │                    │                    │          │
│         └────────────────────┼────────────────────┘          │
│                              ▼                               │
│                    调用 PATCH /projects/:id/soft-delete      │
│                              │                               │
│                              ▼                               │
│                    项目从 Dashboard 消失                     │
│                    回收站计数 +1                             │
│                    显示 Toast: "项目已移至回收站"            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 数据模型设计

### 2.1 Project 表修改

**当前结构**:
```sql
CREATE TABLE Project (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  userId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

**新增字段**:
```sql
ALTER TABLE Project ADD COLUMN deletedAt TEXT DEFAULT NULL;
```

**完整结构**:
```sql
CREATE TABLE Project (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  userId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT DEFAULT NULL  -- 新增：逻辑删除时间戳
);
```

### 2.2 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `deletedAt` | TEXT (ISO 8601) | NULL = 未删除，非 NULL = 已删除时间 |

### 2.3 查询逻辑

**获取正常项目列表**:
```sql
SELECT * FROM Project 
WHERE userId = ? AND deletedAt IS NULL 
ORDER BY createdAt DESC
```

**获取已删除项目列表**:
```sql
SELECT * FROM Project 
WHERE userId = ? AND deletedAt IS NOT NULL 
ORDER BY deletedAt DESC
```

---

## 3. API 设计

### 3.1 后端 API 清单

| 方法 | 路由 | 描述 |
|------|------|------|
| PATCH | `/api/projects/:id/soft-delete` | 逻辑删除项目 |
| PATCH | `/api/projects/:id/restore` | 恢复项目 |
| DELETE | `/api/projects/:id` | 永久删除项目 |
| GET | `/api/projects/trash` | 获取回收站项目列表 |
| DELETE | `/api/projects/trash` | 清空回收站 |

### 3.2 API 详细设计

#### 3.2.1 逻辑删除项目

```http
PATCH /api/projects/:id/soft-delete
```

**请求**:
```json
{
  "userId": "user-xxx"
}
```

**响应**:
```json
{
  "success": true,
  "project": {
    "id": "proj-xxx",
    "name": "项目 A",
    "deletedAt": "2026-03-02T12:00:00Z"
  }
}
```

**SQL**:
```sql
UPDATE Project 
SET deletedAt = ?, updatedAt = ? 
WHERE id = ? AND userId = ?
```

#### 3.2.2 恢复项目

```http
PATCH /api/projects/:id/restore
```

**请求**:
```json
{
  "userId": "user-xxx"
}
```

**响应**:
```json
{
  "success": true,
  "project": {
    "id": "proj-xxx",
    "name": "项目 A",
    "deletedAt": null
  }
}
```

**SQL**:
```sql
UPDATE Project 
SET deletedAt = NULL, updatedAt = ? 
WHERE id = ? AND userId = ?
```

#### 3.2.3 永久删除项目

```http
DELETE /api/projects/:id
```

**请求参数**:
- `userId` (query): 用户 ID
- `permanent` (query): true 表示永久删除

**响应**:
```json
{
  "success": true,
  "message": "项目已永久删除"
}
```

**SQL**:
```sql
DELETE FROM Project 
WHERE id = ? AND userId = ?
```

#### 3.2.4 获取回收站项目列表

```http
GET /api/projects/trash?userId=user-xxx
```

**响应**:
```json
{
  "projects": [
    {
      "id": "proj-xxx",
      "name": "项目 A",
      "description": "描述",
      "deletedAt": "2026-03-02T12:00:00Z"
    }
  ],
  "total": 3
}
```

#### 3.2.5 清空回收站

```http
DELETE /api/projects/trash?userId=user-xxx
```

**响应**:
```json
{
  "success": true,
  "deletedCount": 3,
  "message": "回收站已清空"
}
```

**SQL**:
```sql
DELETE FROM Project 
WHERE userId = ? AND deletedAt IS NOT NULL
```

---

## 4. 前端设计

### 4.1 组件结构

```
src/components/
├── TrashBin/
│   ├── TrashBin.tsx         # 垃圾桶主组件
│   ├── TrashBin.css         # 样式
│   ├── TrashModal.tsx       # 回收站弹窗
│   └── DraggableCard.tsx    # 可拖拽卡片（HOC）
```

### 4.2 垃圾桶组件

```tsx
// TrashBin.tsx
interface TrashBinProps {
  count: number;           // 已删除项目数量
  onOpen: () => void;      // 打开回收站弹窗
  onDrop: (projectId: string) => void;  // 拖拽删除回调
  isDragOver: boolean;     // 是否有项目拖拽到上方
}

export function TrashBin({ count, onOpen, onDrop, isDragOver }: TrashBinProps) {
  return (
    <div 
      className={`trash-bin ${isDragOver ? 'active' : ''}`}
      onClick={onOpen}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const projectId = e.dataTransfer.getData('projectId');
        onDrop(projectId);
      }}
    >
      <span className="trash-icon">🗑️</span>
      <span className="trash-count">{count}</span>
    </div>
  );
}
```

### 4.3 回收站弹窗

```tsx
// TrashModal.tsx
interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: DeletedProject[];
  onRestore: (projectId: string) => void;
  onDeletePermanently: (projectId: string) => void;
  onEmptyTrash: () => void;
}

export function TrashModal({ 
  isOpen, 
  onClose, 
  projects, 
  onRestore, 
  onDeletePermanently,
  onEmptyTrash 
}: TrashModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="trash-modal-overlay">
      <div className="trash-modal">
        <header>
          <h2>回收站</h2>
          <button onClick={onClose}>×</button>
        </header>
        
        <div className="trash-content">
          {projects.length === 0 ? (
            <p className="empty-message">回收站是空的</p>
          ) : (
            <ul className="trash-list">
              {projects.map(project => (
                <li key={project.id}>
                  <span>{project.name}</span>
                  <span className="deleted-time">
                    {formatTime(project.deletedAt)}
                  </span>
                  <div className="actions">
                    <button onClick={() => onRestore(project.id)}>
                      恢复
                    </button>
                    <button onClick={() => onDeletePermanently(project.id)}>
                      永久删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <footer>
          <button 
            className="empty-trash-btn"
            onClick={onEmptyTrash}
            disabled={projects.length === 0}
          >
            清空回收站
          </button>
        </footer>
      </div>
    </div>
  );
}
```

### 4.4 拖拽卡片

```tsx
// DraggableCard.tsx
interface DraggableCardProps {
  project: Project;
  onDragStart: (projectId: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
}

export function DraggableCard({ 
  project, 
  onDragStart, 
  onDragEnd, 
  onClick 
}: DraggableCardProps) {
  return (
    <div
      className="project-card draggable"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('projectId', project.id);
        onDragStart(project.id);
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <h3>{project.name}</h3>
      <p>{project.description}</p>
    </div>
  );
}
```

---

## 5. 前后端分工

### 5.1 前端任务

| 任务 | 描述 | 文件 |
|------|------|------|
| 垃圾桶组件 | 右下角悬浮垃圾桶图标 | `src/components/TrashBin/TrashBin.tsx` |
| 回收站弹窗 | 显示已删除项目列表 | `src/components/TrashBin/TrashModal.tsx` |
| 拖拽卡片 | 项目卡片支持拖拽 | `src/components/TrashBin/DraggableCard.tsx` |
| Dashboard 集成 | 拖拽删除交互 | `src/app/dashboard/page.tsx` |
| API 调用 | 调用后端删除/恢复 API | `src/services/api.ts` |

### 5.2 后端任务

| 任务 | 描述 | 文件 |
|------|------|------|
| 数据库迁移 | 添加 deletedAt 字段 | `migrations/add_deleted_at.sql` |
| 逻辑删除 API | PATCH /projects/:id/soft-delete | `src/routes/projects.ts` |
| 恢复 API | PATCH /projects/:id/restore | `src/routes/projects.ts` |
| 永久删除 API | DELETE /projects/:id | `src/routes/projects.ts` |
| 回收站列表 API | GET /projects/trash | `src/routes/projects.ts` |
| 清空回收站 API | DELETE /projects/trash | `src/routes/projects.ts` |

---

## 6. 样式设计

### 6.1 垃圾桶样式

```css
/* TrashBin.css */
.trash-bin {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 64px;
  height: 64px;
  background: rgba(255, 59, 48, 0.1);
  border: 2px solid rgba(255, 59, 48, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
}

.trash-bin:hover,
.trash-bin.active {
  background: rgba(255, 59, 48, 0.2);
  border-color: rgba(255, 59, 48, 0.6);
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(255, 59, 48, 0.4);
}

.trash-icon {
  font-size: 28px;
}

.trash-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff3b30;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}
```

### 6.2 拖拽状态

```css
/* 拖拽时项目卡片样式 */
.project-card.draggable {
  cursor: grab;
  transition: transform 0.2s, opacity 0.2s;
}

.project-card.dragging {
  opacity: 0.5;
  transform: scale(0.95);
  cursor: grabbing;
}

/* 拖拽到垃圾桶上方时 */
.trash-bin.drag-over {
  animation: pulse 0.5s ease infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1.1); }
  50% { transform: scale(1.15); }
}
```

---

## 7. 安全考量

### 7.1 权限验证

所有 API 必须验证用户权限：

```typescript
// 确保用户只能操作自己的项目
const project = await queryOne(env, 
  'SELECT * FROM Project WHERE id = ? AND userId = ?', 
  [projectId, userId]
);

if (!project) {
  return c.json({ error: 'Project not found' }, 404);
}
```

### 7.2 数据备份

永久删除前考虑：
1. 显示确认弹窗
2. 可选：删除前备份数据

---

## 8. 验证清单

### 8.1 功能验证

```bash
# 1. 测试逻辑删除
curl -X PATCH http://localhost:3001/api/projects/proj-xxx/soft-delete \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-xxx"}'

# 2. 测试回收站列表
curl "http://localhost:3001/api/projects/trash?userId=user-xxx"

# 3. 测试恢复
curl -X PATCH http://localhost:3001/api/projects/proj-xxx/restore \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-xxx"}'

# 4. 测试清空回收站
curl -X DELETE "http://localhost:3001/api/projects/trash?userId=user-xxx"
```

### 8.2 前端验证

- [ ] 项目卡片可拖拽
- [ ] 拖拽到垃圾桶时高亮
- [ ] 释放后项目消失
- [ ] 回收站计数更新
- [ ] 点击垃圾桶打开弹窗
- [ ] 弹窗显示已删除项目
- [ ] 恢复按钮正常工作
- [ ] 清空按钮正常工作

---

## 9. 总结

| 模块 | 任务数 | 预估工时 |
|------|--------|----------|
| 前端 | 5 | 8h |
| 后端 | 6 | 4h |
| **总计** | **11** | **12h** |

**优先级排序**:
1. **P0**: 数据库迁移 (添加 deletedAt 字段)
2. **P0**: 后端 API (逻辑删除/恢复/回收站列表)
3. **P0**: 前端垃圾桶组件 + 拖拽交互
4. **P1**: 回收站弹窗
5. **P1**: 清空回收站功能

---

**分析完成时间**: 2026-03-02 20:06
**分析者**: Analyst Agent