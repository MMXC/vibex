# Message Context Tracking — Data Model

**项目**: vibex-proposals-summary-20260324_0958  
**Agent**: dev  
**Date**: 2026-03-24

---

## 背景

HEARTBEAT.md 需要追踪消息上下文（哪个项目/任务的话题），当前使用 grep 手动从 HEARTBEAT.md 中查找 thread ID。本文档定义正式数据模型。

---

## 数据模型

### MessageContext (消息上下文)

描述一条消息属于哪个项目话题。

```typescript
interface MessageContext {
  /** 唯一 ID */
  id: string;

  /** 关联的项目名 */
  project: string;

  /** 关联的任务 ID（可选） */
  task?: string;

  /** 话题 ID（Feishu/Slack thread ID） */
  threadId?: string;

  /** 频道 ID */
  channelId: string;

  /** 关联的 agent */
  agent: 'dev' | 'analyst' | 'architect' | 'pm' | 'tester' | 'reviewer' | 'coord';

  /** 创建时间 (ISO) */
  createdAt: string;

  /** 最后活跃时间 (ISO) */
  lastActiveAt: string;

  /** 状态 */
  status: 'active' | 'archived';
}
```

### ThreadMap (话题映射表)

描述项目 → 话题 ID 的映射关系。

```typescript
interface ThreadMap {
  /** 项目名 → 话题 ID */
  [projectName: string]: string;
}
```

### ContextEvent (上下文事件)

描述一条上下文变更事件。

```typescript
interface ContextEvent {
  id: string;
  project: string;
  task?: string;
  eventType: 'topic_created' | 'topic_replied' | 'topic_archived';
  timestamp: string;
  agent: string;
  note?: string;
}
```

---

## 存储位置

| 数据 | 存储位置 |
|------|---------|
| MessageContext[] | `HEARTBEAT.md` 内置变量（第 8-12 行） |
| ThreadMap | `HEARTBEAT.md` 内置变量 |
| 事件历史 | `HEARTBEAT.md` 滚动事件区 |

---

## 使用规则

1. **新增项目话题时**: 在 HEARTBEAT.md 的 `<!-- TASK_THREADS -->` 区记录 `项目名/任务ID: om_xxx`
2. **发送消息时**: 使用 `--reply-to` 参数指定 thread ID
3. **归档时**: 事件移到 HEARTBEAT.md 的「已完成」区域，保持最近 20 条
4. **查找**: `grep "项目名/任务ID:" HEARTBEAT.md` 获取 thread ID

---

## 滚动事件区格式

```
### 当前跟踪事项（上限 10 条）
| ID | 事项 | 类型 | 状态 | 更新时间 |
|----|------|------|------|---------|
```

---

## 示例

```markdown
<!-- TASK_THREADS -->
<!-- homepage-cardtree-debug/dev-epic1: om_123456 -->
```

```typescript
const threadMap: ThreadMap = {
  'homepage-cardtree-debug/dev-epic1': 'om_123456',
  'proposal-dedup-mechanism/dev-epic2': 'om_789012',
};
```
