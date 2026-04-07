# F4: 两步设计流程 sessionId 链路验证规格说明

**功能域**: 验证 contexts → flows → components 的 sessionId 全链路传递  
**PRD ID**: F4  
**状态**: 待开发

---

## 1. 两步设计流程

```
用户输入需求文本
       ↓
POST /api/v1/canvas/generate-contexts  ← Step 0: 提取限界上下文
       ↓ (返回 contexts[] + sessionId)
POST /api/v1/canvas/generate-flows    ← Step 1: 生成业务流程
       ↓ (返回 flows[] + sessionId)
POST /api/v1/canvas/generate-components ← Step 2: 生成组件树
       ↓ (返回 components[])
```

---

## 2. 规格详情

### F4.1 sessionId 生成

**规格要求**:
- `POST /api/v1/canvas/generate-contexts` 响应中必须包含 `sessionId`
- `sessionId` 格式: UUID v4 或唯一字符串
- `sessionId` 有效期: 至少 24 小时

**响应格式**:
```typescript
interface GenerateContextsResponse {
  success: true;
  data: {
    contexts: BoundedContext[];
    sessionId: string;  // 必须存在
  };
  error?: never;
}
```

**验证方法**:
```bash
# 本地测试
curl -X POST http://localhost:3000/api/v1/canvas/generate-contexts \
  -H "Content-Type: application/json" \
  -d '{"description": "test project"}' | jq '.data.sessionId'
# 期望: 输出非空字符串
```

---

### F4.2 sessionId 传递

**规格要求**:
- `POST /api/v1/canvas/generate-flows` 请求必须包含上一步返回的 `sessionId`
- `POST /api/v1/canvas/generate-components` 请求必须包含 `sessionId`
- 后端必须验证 `sessionId` 合法性（存在且未过期）

**前端调用示例**:
```typescript
// generate-flows
const flowsResponse = await canvasApi.generateFlows({
  contexts: selectedContexts,
  sessionId: currentSessionId,  // ← 必须传递
});

// generate-components
const componentsResponse = await canvasApi.generateComponents({
  flows: selectedFlows,
  sessionId: currentSessionId,  // ← 必须传递
});
```

**验证方法**:
```bash
# 不传 sessionId 应返回错误
curl -X POST http://localhost:3000/api/v1/canvas/generate-flows \
  -H "Content-Type: application/json" \
  -d '{"contexts": [], "description": "test"}' | jq '.error'
# 期望: 包含 sessionId 相关错误信息
```

---

### F4.3 sessionId 存储确认

**规格要求**:
- 明确 `sessionId` 存储介质（推荐: 内存 + localStorage 备份）
- 不允许隐式丢失（刷新页面后需可恢复）

**存储策略**:
```typescript
// 推荐: 内存为主，localStorage 为备份
class SessionManager {
  private sessionId: string | null = null;
  private readonly STORAGE_KEY = 'vibex_canvas_session_id';

  get(): string | null {
    return this.sessionId || localStorage.getItem(this.STORAGE_KEY);
  }

  set(id: string): void {
    this.sessionId = id;
    localStorage.setItem(this.STORAGE_KEY, id);
  }

  clear(): void {
    this.sessionId = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
```

**验证方法**:
- 页面刷新后 `sessionId` 可恢复
- 切换标签页后 `sessionId` 不丢失

---

## 3. 相关文件

| 文件路径 | 职责 |
|----------|------|
| `src/lib/canvas/api/canvasApi.ts` | 存储 sessionId 状态 |
| `src/lib/canvas/hooks/useCanvasSession.ts` | sessionId 管理 hook（建议） |
| `app/api/v1/canvas/generate-contexts/route.ts` | 生成 sessionId |
| `app/api/v1/canvas/generate-flows/route.ts` | 验证 sessionId |
| `app/api/v1/canvas/generate-components/route.ts` | 验证 sessionId |

---

## 4. 验收标准

| ID | 验收标准 | 验证方法 |
|----|----------|----------|
| AC-SID-1 | `generate-contexts` 返回包含 `sessionId` | API 测试 |
| AC-SID-2 | `generate-flows` 请求必须包含 `sessionId` | API 测试 + 代码审查 |
| AC-SID-3 | `generate-components` 请求必须包含 `sessionId` | API 测试 + 代码审查 |
| AC-SID-4 | `sessionId` 刷新页面后可恢复 | UI 测试 |

---

## 5. 依赖

- `canvasApi.ts` 已标准化（F1 完成）
- v1 路由功能正常（F3 完成）
